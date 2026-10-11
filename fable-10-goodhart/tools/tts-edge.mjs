// tts-edge.mjs — 分句级 TTS（edge-tts 引擎，绕过 z-ai 配额）
// 用法: node tts-edge.mjs <EP> [仅处理某景]
// 与 tts-clause.mjs 同构：按标点切句 → 逐句合成(edge-tts CLI) → 静音修剪 → 设计停顿拼接
// 产出: fable{EP}/assets/audio/{id}.wav + durations.json + clauses.json（与 z-ai 版完全兼容）
// ASR 回检: 若 z-ai 可用则做，不可用则跳过（edge-tts 合成忠实度高）
import fs from 'fs';
import { execSync } from 'child_process';
import ZAI from 'z-ai-web-dev-sdk';

const EP = process.argv[2];
if (!EP) { console.error('用法: node tts-edge.mjs <EP> [sceneId]'); process.exit(1); }
const EP_DIR = `/home/z/my-project/fable${EP}`;
const CFG = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/scenes.json`, 'utf-8'));
const OUT_DIR = `${EP_DIR}/assets/audio`;
const TMP = `${OUT_DIR}/tmp`;
fs.mkdirSync(TMP, { recursive: true });

const VOICE = process.env.EDGE_VOICE || 'zh-CN-yunxiNeural';
const RATE = process.env.EDGE_RATE || '+8%';
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

function trimSilence(file) {
  const out = file.replace('.wav', '.trim.wav');
  execSync(`ffmpeg -y -v error -i ${file} -af "silenceremove=start_periods=1:start_threshold=-42dB:start_silence=${KEEP_HEAD},areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=${KEEP_TAIL},areverse" ${out}`);
  return out;
}

function dur(file) {
  return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${file}`).toString().trim());
}

function ttsEdge(text, wavFile) {
  const mp3File = wavFile.replace('.wav', '.mp3');
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      execSync(`edge-tts --voice ${VOICE} --rate=${RATE} --text "${text.replace(/"/g, '')}" --write-media ${mp3File} 2>/dev/null`, { timeout: 60000 });
      if (!fs.existsSync(mp3File) || fs.statSync(mp3File).size < 2000) throw new Error('too small');
      execSync(`ffmpeg -y -v error -i ${mp3File} -ar 24000 -ac 1 ${wavFile}`);
      return true;
    } catch (e) {
      console.error(`  [${text.slice(0, 8)}…] edge第${attempt}次失败: ${e.message.slice(0, 50)}`);
      execSync(`sleep ${3 * attempt}`);
    }
  }
  return false;
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

async function asrOne(zai, file) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const b64 = fs.readFileSync(file).toString('base64');
      const result = await zai.audio.asr.create({ file_base64: b64 });
      return result?.text || '';
    } catch (e) {
      console.error(`  ASR第${attempt}次失败（429时跳过回检）: ${e.message.slice(0, 40)}`);
      await new Promise(r => setTimeout(r, 8000));
    }
  }
  return null;
}

async function main() {
  const only = process.argv[3];
  const durations = {}, clausesMap = {}, problems = [];
  let zai = null;
  try { zai = await ZAI.create(); } catch { zai = null; }
  let asrOK = 0, asrSkip = 0;

  for (const scene of CFG.scenes) {
    if (only && scene.id !== only) continue;
    const wavFile = `${OUT_DIR}/${scene.id}.wav`;
    if (fs.existsSync(wavFile)) {
      let cl = null;
      try { cl = JSON.parse(fs.readFileSync(`${OUT_DIR}/${scene.id}.clauses.json`, 'utf-8')); } catch {}
      if (cl && cl.sceneDuration && cl.engine === 'edge') {
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
        if (!ttsEdge(c.text, raw)) { failed = true; break; }
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

    if (zai) {
      const heard = await asrOne(zai, wavFile);
      if (heard == null) {
        asrSkip++;
        console.log(`  ⚠ ASR 不可用，跳过回检`);
      } else {
        asrOK++;
        const sim = similarity(heard, scene.narration);
        if (sim < 0.85) {
          problems.push({ scene: scene.id, issue: `相似度 ${sim.toFixed(2)}`, heard });
          console.log(`  ⚠ 回检相似度 ${sim.toFixed(2)} < 0.85`);
        } else {
          console.log(`  ✓ 回检相似度 ${sim.toFixed(2)}`);
        }
      }
    } else {
      asrSkip++;
      console.log(`  （z-ai 不可用，跳过回检）`);
    }

    const sceneDuration = dur(wavFile);
    const out = { sceneId: scene.id, sceneDuration: +sceneDuration.toFixed(3), engine: 'edge', voice: VOICE, clauses: clauseTiming };
    fs.writeFileSync(`${OUT_DIR}/${scene.id}.clauses.json`, JSON.stringify(out, null, 2));
    durations[scene.id] = +sceneDuration.toFixed(3);
    clausesMap[scene.id] = out;
  }

  fs.writeFileSync(`${OUT_DIR}/durations.json`, JSON.stringify(durations, null, 2));
  fs.writeFileSync(`${OUT_DIR}/clauses.json`, JSON.stringify(clausesMap, null, 2));
  const total = Object.values(durations).reduce((a, b) => a + b, 0);
  console.log(`\n引擎: edge-tts ${VOICE} rate=${RATE}`);
  console.log(`总时长: ${total.toFixed(1)}s ≈ ${Math.floor(total / 60)}分${Math.round(total % 60)}秒`);
  console.log(`ASR 回检: 成功 ${asrOK} 景 / 跳过 ${asrSkip} 景`);
  if (problems.length) {
    console.log('\n待人工复核:');
    for (const p of problems) console.log(`  ${p.scene}: ${p.issue} | ASR听到: ${p.heard.slice(0, 50)}`);
  }
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
