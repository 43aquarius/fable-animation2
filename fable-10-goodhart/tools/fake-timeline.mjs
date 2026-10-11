// fake-timeline.mjs — 生成临时时间轴（按字数估时长），供渲染前视觉测试
// 用法: node fake-timeline.mjs <EP>
import fs from 'fs';
import { execSync } from 'child_process';

const EP = process.argv[2];
const EP_DIR = `/home/z/my-project/fable${EP}`;
const CFG = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/scenes.json`, 'utf-8'));
const FPS = CFG.fps;

let cursor = 0;
const scenes = CFG.scenes.map((s) => {
  const est = s.narration.length / 4.3; // xiaochen 1.08 约每秒 4.3 字
  const audioFrames = Math.ceil(est * FPS);
  const duration = audioFrames + 14;
  const sc = {
    id: s.id, type: s.type, image: s.image || null, ui: s.ui || null,
    narration: s.narration, emphasis: s.captionEmphasis || [],
    start: cursor, duration, audioFrames,
    captions: s.narration.replace(/[。！？；，：、]/g, '|').split('|').filter(Boolean).slice(0, 12).map((t, i, arr) => ({
      text: t.length > 14 ? t.slice(0, Math.ceil(t.length / 2)) + '\n' + t.slice(Math.ceil(t.length / 2)) : t,
      start: Math.round(i * audioFrames / arr.length),
      duration: Math.round(audioFrames / arr.length),
    })),
  };
  cursor += duration;
  return sc;
});

const out = { fps: FPS, width: CFG.width, height: CFG.height, totalFrames: cursor, scenes, fake: true };
fs.writeFileSync(`${EP_DIR}/video/src/timeline.json`, JSON.stringify(out, null, 2));
console.log(`临时时间轴: ${cursor} 帧 = ${(cursor / FPS).toFixed(1)}s`);

// 占位图（灰底 + 场景名），保证 ImageScene 可渲染
for (const s of CFG.scenes) {
  if (s.image) {
    const f = `${EP_DIR}/video/public/images/${s.image}.png`;
    if (!fs.existsSync(f)) {
      fs.mkdirSync(`${EP_DIR}/video/public/images`, { recursive: true });
      execSync(`python3 -c "
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGB', (768, 1344), (28, 32, 44))
d = ImageDraw.Draw(img)
f = ImageFont.truetype('/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-SemiBold.ttf', 40)
d.text((60, 640), 'PLACEHOLDER ${s.image}', font=f, fill=(120, 120, 130))
img.save('${f}')
"`);
    }
  }
}
// 占位真实照片
const REQ = `${EP_DIR}/assets/real-requests.json`;
if (fs.existsSync(REQ)) {
  const reqs = JSON.parse(fs.readFileSync(REQ, 'utf-8'));
  fs.mkdirSync(`${EP_DIR}/video/public/real`, { recursive: true });
  for (const r of reqs) {
    const f = `${EP_DIR}/video/public/real/${r.name}.jpg`;
    if (!fs.existsSync(f)) {
      execSync(`python3 -c "
from PIL import Image, ImageDraw, ImageFont
img = Image.new('RGB', (1200, 800), (50, 46, 40))
d = ImageDraw.Draw(img)
f = ImageFont.truetype('/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-SemiBold.ttf', 40)
d.text((60, 380), 'REAL ${r.name}', font=f, fill=(140, 130, 110))
img.save('${f}', quality=88)
"`);
    }
  }
}
console.log('占位图就绪');
