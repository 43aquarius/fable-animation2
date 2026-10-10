// build-audio3.cjs — 从 timeline.json 重建混音轨（execFileSync 免 shell 转义）
const fs = require('fs');
const { execFileSync } = require('child_process');

const EP = process.argv[2] || '3';
const tl = JSON.parse(fs.readFileSync(`/home/z/my-project/fable${EP}/video/src/timeline.json`, 'utf-8'));
const FPS = tl.fps;
const totalSec = tl.totalFrames / FPS;

const args = ['-y', '-v', 'error'];
const filters = [];
tl.scenes.forEach((s, i) => {
  args.push('-i', `/home/z/my-project/fable${EP}/assets/audio/${s.id}.wav`);
  const ms = Math.round((s.start / FPS) * 1000);
  filters.push(`[${i}:a]adelay=${ms}:all=1[a${i}]`);
});
const mixInputs = tl.scenes.map((_, i) => `[a${i}]`).join('');
filters.push(`${mixInputs}amix=inputs=${tl.scenes.length}:normalize=0:duration=longest[m]`);
filters.push(`[m]apad=whole_dur=${totalSec.toFixed(3)}[out]`);
fs.writeFileSync(`/home/z/my-project/fable${EP}/assets/filter.txt`, filters.join(';'));
args.push('-filter_complex_script', `/home/z/my-project/fable${EP}/assets/filter.txt`, '-map', '[out]', '-ar', '48000', '-ac', '2', `/home/z/my-project/fable${EP}/assets/mix.wav`);

execFileSync('ffmpeg', args, { stdio: 'inherit', timeout: 300000, maxBuffer: 1024 * 1024 * 64 });
console.log('mix.wav 完成，目标时长', totalSec.toFixed(1), 's');
