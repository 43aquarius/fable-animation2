// humanize.mjs — 通用 humanizer 优化（blader/humanizer SKILL.md 方法论）
// 用法: node humanize.mjs <EP>
// 每期适配参数读 fable{EP}/assets/humanize-config.json
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const EP = process.argv[2];
if (!EP) { console.error('用法: node humanize.mjs <EP>'); process.exit(1); }
const EP_DIR = `/home/z/my-project/fable${EP}`;
const DRAFT = `${EP_DIR}/assets/script-draft.md`;
const SKILL = '/home/z/my-project/humanizer/SKILL.md';
const OUT = `${EP_DIR}/assets/script-humanized.md`;
const AD = JSON.parse(fs.readFileSync(`${EP_DIR}/assets/humanize-config.json`, 'utf-8'));

const draft = fs.readFileSync(DRAFT, 'utf-8');
const skill = fs.readFileSync(SKILL, 'utf-8');

const systemPrompt = `${skill}

---

## 任务适配（本次运行的特殊上下文）

你在 humanizer 的 File mode 下运行。待处理文本是一篇中文视频口播稿（抖音知识类视频的旁白），讲${AD.story}，最后揭晓经济学概念"${AD.concept}"。处理时遵循以下适配规则：

1. 输出语言：简体中文。输出 ONLY 最终改写后的口播稿，不要解释、不要评论、不要列出模式清单。
2. 保留全部【】小节标记及其顺序，它们是分镜标记。
3. 这是虚构故事（fiction），故事的发明性细节受豁免：不要删减情节、人物、对白。你的工作是让"叙述语言"像人写的、像说书人讲的，而不是删内容。
4. 保留这些刻意设计的句子（对比双方都承载信息，属于允许保留的对比）：
${AD.protectedSentences.map(s => `"${s}"`).join('、')}。
5. 中文里的 AI 味对应形态同样要清除：凑数排比三连、"不仅仅是X，更是Y"句式、空洞升华句、每段结尾复述上段的总结句、套话开场、营销词、形容词堆叠。
6. 口播稿要"上口"：句子长短交错，短句为主；一个句子里不要塞两个从句；读出声不拗口。
7. 不要使用破折号（——），改用逗号、句号或冒号。
8. 术语保留：${AD.keepTerms.join('、')}。解释要口语化但准确。
9. 数字与人名事实保留原样：${AD.keepNumbers.join('、')}。
10. 结尾的"关注我"引导含义与下期预告（${AD.next}）保留。
11. 各小节长度保持在原稿的 90% 到 105% 之间，不要大幅缩写。
12. 重要：必须做实质性的语言打磨（至少 8 个小节有可见改动），不得原样返回。重点顺口检查：${AD.focusHints}`;

async function main() {
  console.log('原文长度:', draft.length, '字');
  const zai = await ZAI.create();
  let out = null;
  for (let attempt = 1; attempt <= 8 && !out; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: `请用 humanizer 方法论改写以下口播稿：\n\n${draft}` }
        ],
        thinking: { type: 'disabled' }
      });
      out = completion.choices[0]?.message?.content;
      if (!out || out.trim().length < 200) { out = null; throw new Error('输出过短或为空'); }
    } catch (e) {
      const is429 = /429/.test(e.message);
      console.error(`第${attempt}次失败: ${e.message.slice(0, 80)}`);
      await new Promise(r => setTimeout(r, is429 ? 30000 * attempt : 8000 * attempt));
    }
  }
  if (!out) { console.error('humanize 失败'); process.exit(1); }
  fs.writeFileSync(OUT, out);
  console.log('优化稿长度:', out.length, '字');
  console.log('已写入:', OUT);
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
