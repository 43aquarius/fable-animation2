// build-timeline2.mjs — 第二期时间轴：读取 scenes.json + 音频时长，生成分镜时间轴（帧级）
import fs from 'fs';

const CFG = JSON.parse(fs.readFileSync('/home/z/my-project/fable2/assets/scenes.json', 'utf-8'));
const DUR = JSON.parse(fs.readFileSync('/home/z/my-project/fable2/assets/audio/durations.json', 'utf-8'));
const FPS = CFG.fps;

// 每个场景的尾部呼吸帧
const TAILS = { s01: 18, s13: 16, s14: 48, s15: 18, s16: 18, s17: 18, s18: 78 };
const DEFAULT_TAIL = 14;

// 字幕分块：按标点切句，超长硬切
function chunkCaptions(text) {
  const clauses = [];
  let cur = '';
  for (const ch of text) {
    cur += ch;
    if ('。！？；，：、'.includes(ch)) { clauses.push(cur); cur = ''; }
  }
  if (cur) clauses.push(cur);

  const out = [];
  for (const c of clauses) {
    const clean = c.replace(/[。！？；：、，「」《》""]/g, '');
    if (!clean) continue;
    if (clean.length > 14) {
      let s = clean;
      while (s.length > 14) {
        const cut = s.length > 20 ? 12 : Math.ceil(s.length / 2);
        out.push(s.slice(0, cut));
        s = s.slice(cut);
      }
      if (s) out.push(s);
    } else {
      out.push(clean);
    }
  }
  return out;
}

function build() {
  let cursor = 0;
  const scenes = CFG.scenes.map((s) => {
    const audioSec = DUR[s.id];
    if (audioSec == null) throw new Error(`缺少音频时长: ${s.id}`);
    const audioFrames = Math.ceil(audioSec * FPS);
    const tail = TAILS[s.id] ?? DEFAULT_TAIL;
    const duration = audioFrames + tail;
    const chunks = s.id === 's14' ? [] : chunkCaptions(s.narration); // s14 的印章即字幕

    const totalChars = chunks.reduce((a, c) => a + c.length, 0) || 1;
    let cStart = 0;
    const captions = chunks.map((text) => {
      const d = Math.max(10, Math.round((audioFrames * text.length) / totalChars));
      const cap = { text, start: cStart, duration: d };
      cStart += d;
      return cap;
    });

    const scene = {
      id: s.id, type: s.type, image: s.image || null,
      narration: s.narration, emphasis: s.captionEmphasis || [],
      start: cursor, duration,
      audioFrames, captions
    };
    cursor += duration;
    return scene;
  });

  const out = { fps: FPS, width: CFG.width, height: CFG.height, totalFrames: cursor, scenes };
  fs.writeFileSync('/home/z/my-project/fable2/video/src/timeline.json', JSON.stringify(out, null, 2));
  console.log(`总帧数: ${cursor} = ${(cursor / FPS).toFixed(1)}s ≈ ${Math.floor(cursor / FPS / 60)}分${Math.round((cursor / FPS) % 60)}秒`);
  for (const s of scenes) console.log(`${s.id} [${s.type}] start=${s.start} dur=${s.duration} 字幕数=${s.captions.length}`);
}

build();
