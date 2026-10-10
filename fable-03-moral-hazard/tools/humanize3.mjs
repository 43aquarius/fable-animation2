// humanize3.mjs — 第三期《镖路》(道德风险)：用 blader/humanizer 的 SKILL.md 方法论优化口播稿
// 引擎：z-ai-web-dev-sdk (GLM)，规则：humanizer v3.1.0 完整规则集
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const DRAFT = '/home/z/my-project/fable3/assets/script-draft.md';
const SKILL = '/home/z/my-project/humanizer/SKILL.md';
const OUT = '/home/z/my-project/fable3/assets/script-humanized.md';

const draft = fs.readFileSync(DRAFT, 'utf-8');
const skill = fs.readFileSync(SKILL, 'utf-8');

// humanizer 的 "File mode"：只输出最终文本。加上中文口播稿的适配说明。
const systemPrompt = `${skill}

---

## 任务适配（本次运行的特殊上下文）

你在 humanizer 的 File mode 下运行。待处理文本是一篇中文视频口播稿（抖音知识类视频的旁白），讲清代晋商票号押镖的寓言，最后揭晓经济学概念"道德风险"。处理时遵循以下适配规则：

1. 输出语言：简体中文。输出 ONLY 最终改写后的口播稿，不要解释、不要评论、不要列出模式清单。
2. 保留全部【】小节标记及其顺序，它们是分镜标记。
3. 这是虚构故事（fiction），故事的发明性细节受豁免：不要删减情节、人物、对白。你的工作是让"叙述语言"像人写的、像说书人讲的，而不是删内容。
4. 保留这些刻意设计的句子（对比双方都承载信息，属于 humanizer 规则允许保留的对比）："利是他的，险是我的"、"省的归镖局，赔的归票号"、"镖还是那些镖，人还是那个人"、"人心从来没变过。变的是那张纸"、"坏合约让好人铤而走险，好合约让懒人精打细算"、"合同怎么写，人就怎么活"。
5. 中文里的 AI 味对应形态同样要清除：排比三连（凑数的"三个一组"）、"不仅仅是X，更是Y"句式、空洞的升华句、每段结尾复述上一段的一句话总结、套话开场（"让我们一起"、"今天我们来聊聊"）、营销词（"震撼"、"深刻"、"极致"）、形容词堆叠。
6. 口播稿要"上口"：句子长短交错，短句为主；一个句子里不要塞两个从句；读出声不拗口。
7. 不要使用破折号（——），改用逗号、句号或冒号。
8. 术语保留：道德风险、逆向选择、隐藏行动、固定报酬、激励错位、激励相容、监督成本、免赔额、柠檬市场、诺贝尔奖。解释要口语化但准确。
9. 数字与人名事实保留原样：三两、二两、五十、一千两、十倍、四个、八个、十年、四倍、零八年、2001年、平遥、扬州、黑风峪、永丰号、赵镖头、少东家。
10. 结尾的"关注我"引导句和下期预告保留。
11. 各小节长度保持在原稿的 90% 到 105% 之间，不要大幅缩写。
12. 重要：上一次运行返回了与原文逐字相同的内容，这是不合格的输出。本次必须做实质性的语言打磨（至少 8 个小节有可见改动）。已知待改进点（必须处理）：
    - s16 "经济学开出的药，一共三味：盯着他，监督，可雇人查岗的成本……" 结构冗长含混，改为清爽的"第一味/第二味/第三味"口头结构，监督成本的说明显式挂在第一味上；
    - s13 "零八年，华尔街闯下塌天的祸，最后一买单的是谁？"中"闯下塌天的祸"与"最后一买单"读着拗口，改顺；
    - s05 "每一笔账都漂亮"表达含糊，改为更具体口语；
    - s08 "查一次，绕一次，躲一次"三连可精简为两连，避免凑数排比；
    - 其余各小节逐一朗读检查，凡读出声拗口处都要顺。`;

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
