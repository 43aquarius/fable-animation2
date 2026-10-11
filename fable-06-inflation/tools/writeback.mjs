// writeback.mjs — 将 script-humanized.md 的旁白回写到 scenes.json 的 narration 字段
// 用法: node writeback.mjs <EP>
import fs from 'fs';

const EP = process.argv[2];
if (!EP) { console.error('用法: node writeback.mjs <EP>'); process.exit(1); }
const EP_DIR = `/home/z/my-project/fable${EP}`;
const HUMANIZED = `${EP_DIR}/assets/script-humanized.md`;
const SCENES = `${EP_DIR}/assets/scenes.json`;

const text = fs.readFileSync(HUMANIZED, 'utf-8');
const blocks = {};
let cur = null;
for (const line of text.split('\n')) {
  const m = line.match(/^【(s\d+)】\s*$/);
  if (m) { cur = m[1]; blocks[cur] = []; continue; }
  if (cur && line.trim()) blocks[cur].push(line.trim());
}
const narrations = {};
for (const [id, lines] of Object.entries(blocks)) narrations[id] = lines.join('\n');

const data = JSON.parse(fs.readFileSync(SCENES, 'utf-8'));
const sceneList = data.scenes ?? data;
let changed = 0;
for (const sc of sceneList) {
  if (narrations[sc.id] == null) { console.error(`⚠ ${sc.id} 在 humanized 稿中缺失`); continue; }
  if (sc.narration !== narrations[sc.id]) changed++;
  sc.narration = narrations[sc.id];
}
fs.writeFileSync(SCENES, JSON.stringify(data, null, 2));
console.log(`回写完成：${sceneList.length} 景，其中 ${changed} 景旁白更新`);
console.log('各景字数:', sceneList.map(s => s.narration.length).join(', '));
