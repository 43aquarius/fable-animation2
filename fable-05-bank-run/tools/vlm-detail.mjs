// vlm-detail.mjs — 对关键帧做视觉内容详细描述
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
          { type: 'text', text: '详细描述这张 1080x1920 视频画面的视觉布局：有哪些元素、位置关系如何、视觉是否协调、有什么明显缺陷（错位、遮挡、空洞区域、元素太挤或太空）。用中文 4-6 句话。' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      }],
      thinking: { type: 'disabled' }
    });
    console.log(`=== ${file.split('/').pop()} ===`);
    console.log(resp.choices[0]?.message?.content?.slice(0, 400) || 'NO RESPONSE');
    await new Promise(r => setTimeout(r, 2000));
  }
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
