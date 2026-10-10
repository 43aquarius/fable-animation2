// humanize4.mjs — 第四期《草洼村》(公地悲剧)：用 blader/humanizer 的 SKILL.md 方法论优化口播稿
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const EP = process.argv[2] || '4';
const DRAFT = `/home/z/my-project/fable${EP}/assets/script-draft.md`;
const SKILL = '/home/z/my-project/humanizer/SKILL.md';
const OUT = `/home/z/my-project/fable${EP}/assets/script-humanized.md`;

const draft = fs.readFileSync(DRAFT, 'utf-8');
const skill = fs.readFileSync(SKILL, 'utf-8');

const systemPrompt = `${skill}

---

## 任务适配（本次运行的特殊上下文）

你在 humanizer 的 File mode 下运行。待处理文本是一篇中文视频口播稿（抖音知识类视频的旁白），讲草原牧村共享草场退化的寓言，最后揭晓经济学概念"公地悲剧"。处理时遵循以下适配规则：

1. 输出语言：简体中文。输出 ONLY 最终改写后的口播稿，不要解释、不要评论、不要列出模式清单。
2. 保留全部【】小节标记及其顺序，它们是分镜标记。
3. 这是虚构故事（fiction），故事的发明性细节受豁免：不要删减情节、人物、对白。你的工作是让"叙述语言"像人写的、像说书人讲的，而不是删内容。
4. 保留这些刻意设计的句子（对比双方都承载信息，属于允许保留的对比）："草是公家的，羊是自家的"、"这买卖，傻子才不做"、"你减一只，省下的草，也是进了别人家羊的肚子"、"八十七个几只"、"限的不是羊，是保住你家羊的草"、"个人的算盘越打越精，公共的家底越算越薄"、"坏，不需要坏人；救回来，也不需要圣人"。
5. 中文里的 AI 味对应形态同样要清除：凑数排比三连、"不仅仅是X，更是Y"句式、空洞升华句、每段结尾复述上段的总结句、套话开场、营销词、形容词堆叠。
6. 口播稿要"上口"：句子长短交错，短句为主；一个句子里不要塞两个从句；读出声不拗口。
7. 不要使用破折号（——），改用逗号、句号或冒号。
8. 术语保留：公地悲剧、非排他性、囚徒困境、集体非理性、配额、碳交易、诺贝尔奖。解释要口语化但准确。
9. 数字与人名事实保留原样：一百文、一文、八十七户、翻了一倍、三倍、第三年、第五年、第七年、三年、五年、十年、一千年、1968年、2009年、草洼村、老三、哈丁、奥斯特罗姆、科学、瑞士、日本、西班牙。
10. 结尾的"关注我"引导句和下期预告保留。
11. 各小节长度保持在原稿的 90% 到 105% 之间，不要大幅缩写。
12. 重要：必须做实质性的语言打磨（至少 8 个小节有可见改动），不得原样返回。重点顺口检查：s08"八十七个几只"的口语节奏、s13 排比例子的轻重、s16 长句的换气点。`;

async function main() {
  console.log('原文长度:', draft.length, '字');
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `请用 humanizer 方法论改写以下口播稿：\n\n${draft}` }
    ],
    thinking: { type: 'disabled' }
  });
  const out = completion.choices[0]?.message?.content;
  if (!out || out.trim().length < 200) throw new Error('输出过短或为空');
  fs.writeFileSync(OUT, out);
  console.log('优化稿长度:', out.length, '字');
  console.log('已写入:', OUT);
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
