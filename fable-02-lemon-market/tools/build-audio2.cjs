// build-audio2.mjs — 从 timeline.json 重建第二期混音轨（execFileSync 免 shell 转义）
const fs = require('fs');
const { execFileSync } = require('child_process');

const tl = JSON.parse(fs.readFileSync('/home/z/my-project/fable2/video/src/timeline.json', 'utf-8'));
const FPS = tl.fps;
const totalSec = tl.totalFrames / FPS;

const args = ['-y', '-v', 'error'];
const filters = [];
tl.scenes.forEach((s, i) => {
  args.push('-i', `/home/z/my-project/fable2/assets/audio/${s.id}.wav`);
  const ms = Math.round((s.start / FPS) * 1000);
  filters.push(`[${i}:a]adelay=${ms}:all=1[a${i}]`);
});
const mixInputs = tl.scenes.map((_, i) => `[a${i}]`).join('');
filters.push(`${mixInputs}amix=inputs=${tl.scenes.length}:normalize=0:duration=longest[m]`);
filters.push(`[m]apad=whole_dur=${totalSec.toFixed(3)}[out]`);
fs.writeFileSync('/home/z/my-project/fable2/assets/filter.txt', filters.join(';'));
args.push('-filter_complex_script', '/home/z/my-project/fable2/assets/filter.txt', '-map', '[out]', '-ar', '48000', '-ac', '2', '/home/z/my-project/fable2/assets/mix.wav');

execFileSync('ffmpeg', args, { stdio: 'inherit', timeout: 120 });
console.log('mix.wav 完成，目标时长', totalSec.toFixed(1), 's');
