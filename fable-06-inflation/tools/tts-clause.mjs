// tts-clause.mjs — 分句级 TTS 引擎（第 6 期起标准流程，通用版）
// 用法: node tts-clause.mjs <EP> [仅处理某景]
// 每景旁白按标点切句 → 逐句合成 → 静音修剪 → 设计停顿拼接 → ASR 回检
// 产出: fable{EP}/assets/audio/{id}.wav + durations.json + clauses.json + {id}.clauses.json
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import { execSync } from 'child_process';

const EP = process.argv[2];
if (!EP) { console.error('用法: node tts-clause.mjs <EP> [sceneId]'); process.exit(1); }
const EP_DIR = `/home/z/my-project/fable${EP}`;
const CFG = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/scenes.json`, 'utf-8'));
const OUT_DIR = `${EP_DIR}/assets/audio`;
const TMP = `${OUT_DIR}/tmp`;
fs.mkdirSync(TMP, { recursive: true });

// 设计停顿：顿号/逗号 260ms，句号/分号/冒号 560ms，叹号/问号 660ms
const PAUSE = { soft: 0.26, hard: 0.56, emotive: 0.66 };
const KEEP_HEAD = 0.05, KEEP_TAIL = 0.10;

function splitClauses(text) {
  const clauses = [];
  let cur = '';
  for (const ch of text) {
    cur += ch;
    if ('。！？；，：、'.includes(ch)) {
      const clean = cur.slice(0, -1).replace(/[「」《》""]/g, '').trim();
      if (clean) {
        let kind = 'hard';
        if ('，、'.includes(ch)) kind = 'soft';
        else if ('！？'.includes(ch)) kind = 'emotive';
        clauses.push({ text: clean, kind });
      }
      cur = '';
    }
  }
  if (cur.trim()) {
    const clean = cur.replace(/[「」《》""]/g, '').trim();
    if (clean) clauses.push({ text: clean, kind: 'hard' });
  }
  return clauses;
}

function similarity(a, b) {
  const norm = (s) => s.replace(/[，。！？、；：「」《》\s""'']/g, '');
  const A = norm(a), B = norm(b);
  if (!A.length || !B.length) return 0;
  const grams = (s) => { const g = new Map(); for (let i = 0; i < s.length - 1; i++) { const k = s.slice(i, i + 2); g.set(k, (g.get(k) || 0) + 1); } return g; };
  const ga = grams(A), gb = grams(B);
  let hit = 0;
  for (const [k, v] of ga) if (gb.has(k)) hit += Math.min(v, gb.get(k));
  return (2 * hit) / (A.length - 1 + B.length - 1);
}

function trimSilence(file) {
  const out = file.replace('.wav', '.trim.wav');
  execSync(`ffmpeg -y -v error -i ${file} -af "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=${KEEP_HEAD},areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=${KEEP_TAIL},areverse" ${out}`);
  return out;
}

function dur(file) {
  return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${file}`).toString().trim());
}

async function ttsOne(zai, text, file) {
  const MAX = 12;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      await new Promise(r => setTimeout(r, attempt === 1 ? 4800 : 6000));
      const resp = await zai.audio.tts.create({
        input: text, voice: CFG.voice, speed: CFG.ttsSpeed,
        response_format: 'wav', stream: false
      });
      const buf = Buffer.from(new Uint8Array(await resp.arrayBuffer()));
      if (buf.length < 2000) throw new Error('audio too small: ' + buf.length);
      fs.writeFileSync(file, buf);
      return true;
    } catch (e) {
      const is429 = /429/.test(e.message);
      console.error(`  [${text.slice(0, 8)}…] 第${attempt}次失败: ${e.message.slice(0, 50)}`);
      await new Promise(r => setTimeout(r, is429 ? 22000 : 8000));
    }
  }
  return false;
}

async function asrOne(zai, file) {
  const MAX = 5;
  for (let attempt = 1; attempt <= MAX; attempt++) {
    try {
      const b64 = fs.readFileSync(file).toString('base64');
      const result = await zai.audio.asr.create({ file_base64: b64 });
      return result?.text || '';
    } catch (e) {
      const is429 = /429/.test(e.message);
      console.error(`  ASR第${attempt}次失败: ${e.message.slice(0, 50)}`);
      await new Promise(r => setTimeout(r, is429 ? 22000 : 6000));
    }
  }
  return null;
}

async function main() {
  const zai = await ZAI.create();
  const only = process.argv[3];
  const durations = {}, clausesMap = {}, problems = [];

  for (const scene of CFG.scenes) {
    if (only && scene.id !== only) continue;
    const wavFile = `${OUT_DIR}/${scene.id}.wav`;
    if (fs.existsSync(wavFile)) {
      let cl = null;
      try { cl = JSON.parse(fs.readFileSync(`${OUT_DIR}/${scene.id}.clauses.json`, 'utf-8')); } catch {}
      if (cl && cl.sceneDuration) {
        durations[scene.id] = cl.sceneDuration;
        clausesMap[scene.id] = cl;
        console.log(`${scene.id}: 已存在 ${cl.sceneDuration.toFixed(1)}s，跳过`);
        continue;
      }
    }
    const clauses = splitClauses(scene.narration);
    console.log(`\n${scene.id}: ${clauses.length} 句`);
    const parts = [], clauseTiming = [];
    let cursor = 0;
    let failed = false;

    for (let i = 0; i < clauses.length; i++) {
      const c = clauses[i];
      const raw = `${TMP}/${scene.id}_${String(i).padStart(2, '0')}.wav`;
      if (!fs.existsSync(raw)) {
        const ok = await ttsOne(zai, c.text, raw);
        if (!ok) { failed = true; break; }
      }
      const trimmed = trimSilence(raw);
      const d = dur(trimmed);
      parts.push(trimmed);
      clauseTiming.push({ text: c.text, start: +cursor.toFixed(3), duration: +d.toFixed(3), kind: c.kind });
      cursor += d;
      if (i < clauses.length - 1) cursor += PAUSE[c.kind];
      console.log(`  ${String(i + 1).padStart(2)}/${clauses.length} "${c.text.slice(0, 10)}" ${d.toFixed(2)}s +${PAUSE[c.kind]}s`);
    }
    if (failed) { console.error(`${scene.id} 有句子生成失败，中止本景`); continue; }

    const listFile = `${TMP}/${scene.id}_list.txt`;
    fs.writeFileSync(listFile, parts.map(p => `file '${p}'`).join('\n'));
    execSync(`ffmpeg -y -v error -f concat -safe 0 -i ${listFile} -ar 24000 -ac 1 ${wavFile}`);

    const heard = await asrOne(zai, wavFile);
    if (heard == null) {
      problems.push({ scene: scene.id, issue: 'ASR 失败', heard: '' });
      console.log(`  ⚠ ASR 失败（跳过回检）`);
    } else {
      const sim = similarity(heard, scene.narration);
      if (sim < 0.85) {
        problems.push({ scene: scene.id, issue: `相似度 ${sim.toFixed(2)}`, heard });
        console.log(`  ⚠ 回检相似度 ${sim.toFixed(2)} < 0.85`);
      } else {
        console.log(`  ✓ 回检相似度 ${sim.toFixed(2)}`);
      }
    }

    const sceneDuration = dur(wavFile);
    const out = { sceneId: scene.id, sceneDuration: +sceneDuration.toFixed(3), clauses: clauseTiming };
    fs.writeFileSync(`${OUT_DIR}/${scene.id}.clauses.json`, JSON.stringify(out, null, 2));
    durations[scene.id] = +sceneDuration.toFixed(3);
    clausesMap[scene.id] = out;
  }

  fs.writeFileSync(`${OUT_DIR}/durations.json`, JSON.stringify(durations, null, 2));
  fs.writeFileSync(`${OUT_DIR}/clauses.json`, JSON.stringify(clausesMap, null, 2));
  const total = Object.values(durations).reduce((a, b) => a + b, 0);
  console.log(`\n总时长: ${total.toFixed(1)}s ≈ ${Math.floor(total / 60)}分${Math.round(total % 60)}秒`);
  if (problems.length) {
    console.log('\n待人工复核:');
    for (const p of problems) console.log(`  ${p.scene}: ${p.issue} | ASR听到: ${p.heard.slice(0, 50)}`);
  } else {
    console.log('全部场景 ASR 回检通过 ✓');
  }
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
