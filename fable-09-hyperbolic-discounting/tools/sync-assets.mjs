// sync-assets.mjs — 将 assets 的音频/插画/真实素材同步进 video/public/
// 用法: node sync-assets.mjs <EP>
import fs from 'fs';
import { execSync } from 'child_process';

const EP = process.argv[2];
if (!EP) { console.error('用法: node sync-assets.mjs <EP>'); process.exit(1); }
const BASE = `/home/z/my-project/fable${EP}`;
const CFG = JSON.parse(fs.readFileSync(`${BASE}/assets/scenes.json`, 'utf-8'));

function cp(src, dst) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(dst.split('/').slice(0, -1).join('/'), { recursive: true });
    execSync(`cp "${src}" "${dst}"`);
    return true;
  }
  return false;
}

let audio = 0, images = 0, real = 0;
for (const sc of CFG.scenes) {
  if (cp(`${BASE}/assets/audio/${sc.id}.wav`, `${BASE}/video/public/audio/${sc.id}.wav`)) audio++;
  if (sc.image && cp(`${BASE}/assets/images/${sc.image}.png`, `${BASE}/video/public/images/${sc.image}.png`)) images++;
  if (sc.type === 'photos' && sc.ui?.photos) {
    for (const p of sc.ui.photos) {
      if (cp(`${BASE}/assets/real/${p.file}.jpg`, `${BASE}/video/public/real/${p.file}.jpg`)) real++;
    }
  }
}
console.log(`同步完成：音频 ${audio}，插画 ${images}，真实素材 ${real}`);
if (audio < CFG.scenes.length) console.log('⚠ 有景缺音频（先跑 tts-clause）');
