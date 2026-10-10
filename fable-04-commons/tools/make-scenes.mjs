// make-scenes.mjs — 通用：episode.json(场景类型/强调词) + script-final.md(旁白) → scenes.json
import fs from 'fs';

const EP = process.argv[2];
const BASE = `/home/z/my-project/fable${EP}/assets`;
const cfg = JSON.parse(fs.readFileSync(`${BASE}/episode.json`, 'utf-8'));
const md = fs.readFileSync(`${BASE}/script-final.md`, 'utf-8');

// 解析【sXX 标题】小节
const narrations = {};
for (const m of md.matchAll(/【(s\d\d)[^】]*】\n([\s\S]*?)(?=\n【|\n*$)/g)) {
  narrations[m[1]] = m[2].trim();
}

const scenes = cfg.sceneOrder.map((id) => {
  const sc = cfg.scenes[id];
  if (!narrations[id]) throw new Error(`script-final.md 缺少 ${id}`);
  return {
    id,
    type: sc.type,
    image: sc.image || null,
    captionEmphasis: sc.emphasis || [],
    narration: narrations[id],
  };
});

const out = {
  fps: 30, width: 1080, height: 1920,
  voice: 'xiaochen', ttsSpeed: 1.08,
  series: cfg.series, episode: cfg.episode,
  concept: cfg.concept, conceptEn: cfg.conceptEn, conceptSub: cfg.conceptSub,
  title: cfg.title,
  scenes,
};
fs.writeFileSync(`${BASE}/scenes.json`, JSON.stringify(out, null, 2));
const total = scenes.reduce((a, s) => a + s.narration.length, 0);
console.log(`scenes.json 生成: ${scenes.length} 景, 共 ${total} 字`);
