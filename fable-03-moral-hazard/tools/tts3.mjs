// tts3.mjs — 第三期：为每个分镜生成旁白音频，输出时长清单
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import { execSync } from 'child_process';

const EP = process.argv[2] || '3';
const CFG = JSON.parse(fs.readFileSync(`/home/z/my-project/fable${EP}/assets/scenes.json`, 'utf-8'));
const OUT_DIR = `/home/z/my-project/fable${EP}/assets/audio`;

async function main() {
  const zai = await ZAI.create();
  const durations = {};

  for (const scene of CFG.scenes) {
    const file = `${OUT_DIR}/${scene.id}.wav`;
    if (fs.existsSync(file)) {
      const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${file}`).toString().trim());
      durations[scene.id] = d;
      console.log(`${scene.id}: 已存在 ${d.toFixed(1)}s，跳过`);
      continue;
    }
    let ok = false;
    const MAX_ATTEMPT = 10;
    for (let attempt = 1; attempt <= MAX_ATTEMPT && !ok; attempt++) {
      try {
        await new Promise(r => setTimeout(r, 3000));
        const resp = await zai.audio.tts.create({
          input: scene.narration,
          voice: CFG.voice,
          speed: CFG.ttsSpeed,
          response_format: 'wav',
          stream: false
        });
        const buf = Buffer.from(new Uint8Array(await resp.arrayBuffer()));
        if (buf.length < 2000) throw new Error('audio too small: ' + buf.length);
        fs.writeFileSync(file, buf);
        ok = true;
      } catch (e) {
        const is429 = /429/.test(e.message);
        console.error(`${scene.id} 第${attempt}次失败: ${e.message.slice(0, 60)}`);
        await new Promise(r => setTimeout(r, is429 ? 25000 * attempt : 8000 * attempt));
      }
    }
    if (!ok) { console.error(`${scene.id} 生成失败`); process.exit(1); }
    const d = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${file}`).toString().trim());
    durations[scene.id] = d;
    console.log(`${scene.id}: ${d.toFixed(1)}s (${scene.narration.length}字, ${(scene.narration.length / d).toFixed(2)}字/秒)`);
  }

  fs.writeFileSync(`${OUT_DIR}/durations.json`, JSON.stringify(durations, null, 2));
  const total = Object.values(durations).reduce((a, b) => a + b, 0);
  console.log(`\n总时长: ${total.toFixed(1)}s ≈ ${Math.floor(total / 60)}分${Math.round(total % 60)}秒`);
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
