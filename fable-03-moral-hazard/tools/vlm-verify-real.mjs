// vlm-verify-real.mjs — 用 VLM 验证真实素材内容是否与预期相符
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const FILES = process.argv.slice(2);

async function main() {
  const zai = await ZAI.create();
  for (const file of FILES) {
    const b64 = fs.readFileSync(file).toString('base64');
    const resp = await zai.chat.completions.createVision({
      model: 'glm-4.6v',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: '用一句话描述这张照片的主体内容（人物在做什么/拍的是什么物体/场景），并说明它适合用于哪个话题：保险理赔、金融危机、商务签约、其他。' },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
        ],
      }],
      thinking: { type: 'disabled' }
    });
    console.log(`=== ${file.split('/').pop()} ===`);
    console.log(resp.choices[0]?.message?.content?.slice(0, 200) || 'NO RESPONSE');
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
