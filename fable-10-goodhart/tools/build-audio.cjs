// build-audio.cjs — 通用混音：从 timeline.json 重建音轨（adelay+amix），48k 双声道
// 用法: node build-audio.cjs <EP>
const fs = require('fs');
const { execFileSync } = require('child_process');

const EP = process.argv[2];
if (!EP) { console.error('用法: node build-audio.cjs <EP>'); process.exit(1); }
const BASE = `/home/z/my-project/fable${EP}`;
const tl = JSON.parse(fs.readFileSync(`${BASE}/video/src/timeline.json`, 'utf-8'));
const FPS = tl.fps;
const totalSec = tl.totalFrames / FPS;

const args = ['-y', '-v', 'error'];
const filters = [];
tl.scenes.forEach((s, i) => {
  args.push('-i', `${BASE}/assets/audio/${s.id}.wav`);
  const ms = Math.round((s.start / FPS) * 1000);
  filters.push(`[${i}:a]adelay=${ms}:all=1[a${i}]`);
});
const mixInputs = tl.scenes.map((_, i) => `[a${i}]`).join('');
filters.push(`${mixInputs}amix=inputs=${tl.scenes.length}:normalize=0:duration=longest[mix]`);
filters.push(`[mix]apad=whole_dur=${totalSec.toFixed(3)}[out]`);
fs.writeFileSync(`${BASE}/assets/filter.txt`, filters.join(';'));
args.push('-filter_complex_script', `${BASE}/assets/filter.txt`, '-map', '[out]', '-ar', '48000', '-ac', '2', `${BASE}/assets/mix.wav`);

execFileSync('ffmpeg', args, { timeout: 240, stdio: ['ignore','pipe','pipe'] });
console.log('mix.wav 完成，目标时长', totalSec.toFixed(1), 's');
