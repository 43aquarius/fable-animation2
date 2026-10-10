// vlm-check.mjs — 用 VLM 质检渲染静帧
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
          { type: 'text', text: '这是一张1080x1920的抖音知识视频画面。请严格检查：1)是否有文字溢出画面边缘或被截断 2)是否有文字相互重叠遮挡 3)文字与背景对比度是否足够清晰可读 4)整体排版是否协调。请用中文简短回答，如果没有问题就回答"PASS"，有问题则具体指出问题位置。' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      }],
      thinking: { type: 'disabled' }
    });
    console.log(`=== ${file.split('/').pop()} ===`);
    console.log(resp.choices[0]?.message?.content?.slice(0, 500) || 'NO RESPONSE');
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
