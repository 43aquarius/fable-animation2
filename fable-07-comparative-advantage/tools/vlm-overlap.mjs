// vlm-overlap.mjs — 完工质检关卡：每景抽 3 帧（25%/55%/85%），VLM 查文字重叠/裁切/贴边
// 用法: node vlm-overlap.mjs <EP>  → 全部 PASS exit 0；任一 FAIL exit 2
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import { execFileSync } from 'child_process';

const EP = process.argv[2];
if (!EP) { console.error('用法: node vlm-overlap.mjs <EP>'); process.exit(1); }
const BASE = `/home/z/my-project/fable${EP}`;
const tl = JSON.parse(fs.readFileSync(`${BASE}/video/src/timeline.json`, 'utf-8'));
const SEG_DIR = `${BASE}/assets/segments`;
const FRAME_DIR = `${BASE}/assets/check_frames`;
fs.mkdirSync(FRAME_DIR, { recursive: true });

// 收集所有分段
const segs = fs.readdirSync(SEG_DIR).filter(f => /^seg_\d+\.mp4$/.test(f)).sort();

function extractFrame(segIdx, globalFrame) {
  const seg = `${SEG_DIR}/${segs[segIdx]}`;
  const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=nb_frames', '-of', 'json', seg]).toString());
  const segFrames = info.streams[0].nb_frames;
  return { seg, local: Math.min(globalFrame, segFrames - 1) };
}

async function main() {
  const zai = await ZAI.create();
  let fails = [], checked = 0;

  for (const scene of tl.scenes) {
    const points = [0.25, 0.55, 0.85];
    for (let p = 0; p < points.length; p++) {
      const gFrame = scene.start + Math.floor(scene.duration * points[p]);
      // 找到该帧所在分段
      let segIdx = Math.floor(gFrame / 1500);
      if (segIdx >= segs.length) segIdx = segs.length - 1;
      const { seg, local } = extractFrame(segIdx, gFrame - segIdx * 1500);
      const png = `${FRAME_DIR}/${scene.id}_${p}.png`;
      try {
        execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', seg, '-vf', `select=eq(n\\,${Math.max(0, local)})`, '-frames:v', '1', png]);
      } catch (e) { console.error(`${scene.id}#${p} 抽帧失败: ${e.message.slice(0, 50)}`); continue; }
      if (!fs.existsSync(png) || fs.statSync(png).size < 5000) continue;

      const b64 = fs.readFileSync(png).toString('base64');
      let verdict = null;
      for (let attempt = 1; attempt <= 4 && verdict == null; attempt++) {
        try {
          await new Promise(r => setTimeout(r, 5000));
          const resp = await zai.chat.completions.createVision({
            model: 'glm-4.6v',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: '这是一张1080x1920的抖音知识视频画面。请严格检查文字排版：1)是否有文字相互重叠遮挡 2)是否有文字溢出画面边缘或被截断 3)文字与背景对比度是否可读。只检查文字问题。没有问题只回答"PASS"，有问题回答"FAIL: 问题描述"。' },
                { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
              ],
            }],
            thinking: { type: 'disabled' }
          });
          verdict = resp.choices[0]?.message?.content?.slice(0, 300) || '';
        } catch (e) {
          const is429 = /429/.test(e.message);
          console.error(`${scene.id}#${p} VLM第${attempt}次失败: ${e.message.slice(0, 40)}`);
          await new Promise(r => setTimeout(r, is429 ? 22000 : 8000));
        }
      }
      if (verdict == null) { console.log(`${scene.id}#${p}: VLM不可用，跳过`); continue; }
      checked++;
      const ok = /^PASS/i.test(verdict.trim());
      console.log(`${scene.id}#${p} ${ok ? '✓' : '✗'} ${verdict.trim().slice(0, 100)}`);
      if (!ok) fails.push({ scene: scene.id, point: p, verdict: verdict.slice(0, 200) });
    }
  }

  console.log(`\n检查 ${checked} 帧，失败 ${fails.length}`);
  if (fails.length) {
    console.log('\n=== 需修复的景 ===');
    for (const f of fails) console.log(`  ${f.scene}#${f.point}: ${f.verdict}`);
    process.exit(2);
  }
  console.log('全部 PASS ✓ 完工质检通过');
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
