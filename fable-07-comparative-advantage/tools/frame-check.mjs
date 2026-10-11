// frame-check.mjs — 批量 VLM 检查指定帧文件
// 用法: node frame-check.mjs <EP> <dir>   检查 test_frames 下所有 png
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const EP = process.argv[2];
const DIR = process.argv[3] || `/home/z/my-project/fable${EP}/assets/test_frames`;
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png')).sort();

async function main() {
  const zai = await ZAI.create();
  let fails = 0;
  for (const f of files) {
    const b64 = fs.readFileSync(`${DIR}/${f}`).toString('base64');
    let verdict = null;
    for (let attempt = 1; attempt <= 5 && verdict == null; attempt++) {
      try {
        await new Promise(r => setTimeout(r, 4000));
        const resp = await zai.chat.completions.createVision({
          model: 'glm-4.6v',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: '这是一张1080x1920的抖音知识视频画面。请严格检查：1)是否有文字相互重叠遮挡 2)是否有文字溢出画面边缘或被截断（贴边）3)文字与背景对比度是否可读。只查文字问题。没有问题只回答"PASS"，有问题回答"FAIL: 位置+问题描述"。' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
            ],
          }],
          thinking: { type: 'disabled' }
        });
        verdict = resp.choices[0]?.message?.content?.slice(0, 250) || '';
      } catch (e) {
        const is429 = /429/.test(e.message);
        console.error(`${f} 第${attempt}次失败: ${e.message.slice(0, 40)}`);
        await new Promise(r => setTimeout(r, is429 ? 22000 : 8000));
      }
    }
    if (verdict == null) { console.log(`${f}: VLM 不可用`); continue; }
    const ok = /^PASS/i.test(verdict.trim());
    if (!ok) fails++;
    console.log(`${f} ${ok ? '✓ PASS' : '✗ ' + verdict.replace(/\n/g, ' ')}`);
  }
  console.log(fails === 0 ? '\n全部 PASS' : `\n${fails} 帧需修复`);
  if (fails) process.exit(2);
}
main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
