// build-timeline.mjs — 通用时间轴：字幕时长取分句实测（tts-clause 的 clauses.json）
// 用法: node build-timeline.mjs <EP>
import fs from 'fs';

const EP = process.argv[2];
if (!EP) { console.error('用法: node build-timeline.mjs <EP>'); process.exit(1); }
const EP_DIR = `/home/z/my-project/fable${EP}`;
const CFG = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/scenes.json`, 'utf-8'));
const CLAUSES = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/audio/clauses.json`, 'utf-8'));
const DUR = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/audio/durations.json`, 'utf-8'));
const FPS = CFG.fps;

// 字幕显示：每分句一条字幕（≤14 字直接整句；超长在空格安全点二分）
function captionText(raw) {
  const clean = raw.replace(/[「」《》""]/g, '');
  if (clean.length <= 14) return clean;
  // 超长句拆两行用 \n，字幕组件按行渲染
  const mid = Math.ceil(clean.length / 2);
  return clean.slice(0, mid) + '\n' + clean.slice(mid);
}

const DEFAULT_TAIL = 14;
const TAILS = {}; // 可在 scenes.json 的 tailFrames 字段覆盖

function build() {
  let cursor = 0;
  const scenes = CFG.scenes.map((s) => {
    const audioSec = DUR[s.id];
    if (audioSec == null) throw new Error(`缺少音频时长: ${s.id}`);
    const cl = CLAUSES[s.id];
    if (!cl || !cl.clauses) throw new Error(`缺少分句数据: ${s.id}（先跑 tts-clause.mjs）`);
    const audioFrames = Math.ceil(audioSec * FPS);
    const tail = s.tailFrames ?? TAILS[s.id] ?? DEFAULT_TAIL;
    const duration = audioFrames + tail;

    // 字幕逐条对齐分句实测时间（帧级）
    const captions = cl.clauses.map((c) => ({
      text: captionText(c.text),
      start: Math.round(c.start * FPS),
      duration: Math.max(8, Math.round(c.duration * FPS) + (c.kind === 'soft' ? 6 : 10)),
    }));

    const scene = {
      id: s.id, type: s.type, image: s.image || null, ui: s.ui || null,
      narration: s.narration, emphasis: s.captionEmphasis || [],
      start: cursor, duration, audioFrames, captions,
    };
    cursor += duration;
    return scene;
  });

  const totalFrames = cursor;
  const out = { fps: FPS, width: CFG.width, height: CFG.height, totalFrames, scenes };
  fs.writeFileSync(`${EP_DIR}/video/src/timeline.json`, JSON.stringify(out, null, 2));
  console.log(`总帧数: ${totalFrames} = ${(totalFrames / FPS).toFixed(1)}s ≈ ${Math.floor(totalFrames / FPS / 60)}分${Math.round((totalFrames / FPS) % 60)}秒`);
  for (const s of scenes) console.log(`${s.id} [${s.type}] start=${s.start} dur=${s.duration} 字幕数=${s.captions.length}`);
}

build();
