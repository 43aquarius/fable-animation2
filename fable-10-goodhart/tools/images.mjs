// images.mjs — 通用 AI 插画生成：读 fable{EP}/assets/image-prompts.json
// 格式: { "style": "...", "styleLand": "...", "prompts": { "s01_xxx": "描述", ... }, "landPrompts": { ... } }
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const EP = process.argv[2];
if (!EP) { console.error('用法: node images.mjs <EP>'); process.exit(1); }
const EP_DIR = `/home/z/my-project/fable${EP}`;
const OUT = `${EP_DIR}/assets/images`;
const CFG = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/image-prompts.json`, 'utf-8'));
fs.mkdirSync(OUT, { recursive: true });

const STYLE = CFG.style;
const LAND_STYLE = CFG.styleLand || CFG.style;

async function gen(zai, name, prompt, style, size) {
  const file = `${OUT}/${name}.png`;
  if (fs.existsSync(file)) { console.log(`${name}: 已存在，跳过`); return true; }
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      await new Promise(r => setTimeout(r, attempt === 1 ? 3500 : 8000));
      const resp = await zai.images.generations.create({ prompt: prompt + style, size });
      const b64 = resp.data?.[0]?.base64;
      if (!b64) throw new Error('empty base64');
      const buf = Buffer.from(b64, 'base64');
      if (buf.length < 30000) throw new Error('image too small: ' + buf.length);
      fs.writeFileSync(file, buf);
      console.log(`${name}: 完成 ${buf.length} bytes`);
      return true;
    } catch (e) {
      const is429 = /429/.test(e.message);
      console.error(`${name} 第${attempt}次失败: ${e.message.slice(0, 60)}`);
      await new Promise(r => setTimeout(r, is429 ? 25000 : 10000));
    }
  }
  return false;
}

async function main() {
  const zai = await ZAI.create();
  let fail = 0;
  for (const [name, p] of Object.entries(CFG.prompts)) {
    if (!(await gen(zai, name, p, STYLE, '768x1344'))) fail++;
  }
  if (CFG.landPrompts) {
    for (const [name, p] of Object.entries(CFG.landPrompts)) {
      if (!(await gen(zai, name, p, LAND_STYLE, '1344x768'))) fail++;
    }
  }
  if (fail) { console.error(`${fail} 张生成失败`); process.exit(1); }
  console.log('全部插画完成');
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
