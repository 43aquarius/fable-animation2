// humanize4.mjs — 第四期《草洼村》(公地悲剧)：用 blader/humanizer 的 SKILL.md 方法论优化口播稿
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const EP = process.argv[2] || '5';
const DRAFT = `/home/z/my-project/fable${EP}/assets/script-draft.md`;
const SKILL = '/home/z/my-project/humanizer/SKILL.md';
const OUT = `/home/z/my-project/fable${EP}/assets/script-humanized.md`;

const draft = fs.readFileSync(DRAFT, 'utf-8');
const skill = fs.readFileSync(SKILL, 'utf-8');

const systemPrompt = `${skill}

---

## 任务适配（本次运行的特殊上下文）

你在 humanizer 的 File mode 下运行。待处理文本是一篇中文视频口播稿（抖音知识类视频的旁白），讲江南市镇钱庄被一句谣言挤兑倒闭的寓言，最后揭晓经济学概念"银行挤兑"。处理时遵循以下适配规则：

1. 输出语言：简体中文。输出 ONLY 最终改写后的口播稿，不要解释、不要评论、不要列出模式清单。
2. 保留全部【】小节标记及其顺序，它们是分镜标记。
3. 这是虚构故事（fiction），故事的发明性细节受豁免：不要删减情节、人物、对白。你的工作是让"叙述语言"像人写的、像说书人讲的，而不是删内容。
4. 保留这些刻意设计的句子（对比双方都承载信息，属于允许保留的对比）："命门，就卡在随时和三年中间"、"查，要走路；信，只要点头"、"这笔账，傻子才不算"、"不是怕钱庄坏，是怕别人怕"、"不是资不抵债，是拿不出今天的现钱"、"它是被怕倒本身，挤倒的"、"你信它倒，它就真的倒"、"怕，退了潮；信，就跟着回来了"、"聚起来要二十年，散掉，只要一个上午"。
5. 中文里的 AI 味对应形态同样要清除：凑数排比三连、"不仅仅是X，更是Y"句式、空洞升华句、每段结尾复述上段的总结句、套话开场、营销词、形容词堆叠。
6. 口播稿要"上口"：句子长短交错，短句为主；一个句子里不要塞两个从句；读出声不拗口。
7. 不要使用破折号（——），改用逗号、句号或冒号。
8. 术语保留：银行挤兑、期限转换、存款准备金、存款保险、最后贷款人、中央银行、自我实现的预言、个体理性、集体、诺贝尔奖、通货膨胀。解释要口语化但准确。
9. 数字与人名事实保留原样：一百两、三成、三万两、六成、四成、一成、三年、二十年、半天、三天、两天、一炷香、四千家、五十万、1933年、2023年、2022年、罗斯福、戴蒙德、迪布维格、青石镇、同和钱庄、硅谷银行。
10. 结尾的"关注我"引导句和下期预告保留。
11. 各小节长度保持在原稿的 90% 到 105% 之间，不要大幅缩写。
12. 重要：必须做实质性的语言打磨（至少 8 个小节有可见改动），不得原样返回。重点顺口检查：s02"随时和三年"的对仗节奏、s15 拆解段五连句的呼吸感、s16 长句（戴蒙德和迪布维格把挤兑写成了数学）的换气点。`;

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
