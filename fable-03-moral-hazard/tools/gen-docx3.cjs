// gen-docx3.cjs — 《镖路》视频文字稿（抖音版）docx 生成
// 场景：copywriting（口播稿）｜Profile B 字体｜行距 400｜无封面无目录单节
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType,
} = require("docx");
const fs = require("fs");

// ---------- 调色板（copywriting 场景） ----------
const P = {
  primary: "1A1A1A",
  body: "333333",
  secondary: "666666",
  accent: "B0712A",
  surface: "FBF7EE",
};

const F_HEAD = { ascii: "Calibri", eastAsia: "SimHei" };
const F_BODY = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

// ---------- 组件 ----------
function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200, line: 400 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.primary, font: F_HEAD })],
  });
}

function marker(text) {
  return new Paragraph({
    spacing: { before: 160, after: 80, line: 360 },
    children: [new TextRun({ text, size: 21, color: "999999", italics: true, font: F_BODY })],
  });
}

function narration(runs) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { firstLine: 420 },
    spacing: { before: 120, after: 120, line: 400 },
    children: runs.map(r => new TextRun({
      text: r.t, size: 24, color: r.em ? P.accent : P.body, bold: !!r.em, font: F_BODY,
    })),
  });
}

function noteP(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 360 },
    children: [new TextRun({ text, size: 20, color: P.secondary, font: F_BODY })],
  });
}

const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function makeTable(header, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "D8C8BE" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8C8BE" },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E5DCD3" },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: header.map((h, i) => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: P.surface },
          margins: cellMargins,
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          children: [new Paragraph({ spacing: { line: 320 }, children: [new TextRun({ text: h, bold: true, size: 21, color: P.primary, font: F_BODY })] })],
        })),
      }),
      ...rows.map(r => new TableRow({
        cantSplit: true,
        children: r.map((cell, i) => new TableCell({
          margins: cellMargins,
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          children: [new Paragraph({ spacing: { line: 320 }, children: [new TextRun({ text: cell, size: 21, color: P.body, font: F_BODY })] })],
        })),
      })),
    ],
  });
}

function tableTitle(text) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: 240, after: 120, line: 360 },
    children: [new TextRun({ text, bold: true, size: 21, color: P.secondary, font: F_BODY })],
  });
}

// ---------- 口播稿内容（与视频逐字一致） ----------
const script = [
  { mark: "〔0:00 开场钩子 · 平遥黄昏〕", paras: [
    [{ t: "雍正年间，平遥城有家永丰号，票号生意做得极大。可东家有块心病：银子押去扬州，十年里，路越走越险，镖越丢越多。镖师换了一茬又一茬，个个是千里挑一的好手。路还是那条路，人还是那样的人。出事的，是" }, { t: "别的东西。", em: true }],
  ]},
  { mark: "〔0:22 正文 · 早年好光景与旧合约〕", paras: [
    [{ t: "早年不是这样。那时走镖，镖头比东家还上心：铜锣开道，白天赶路，逢镇必歇。一趟扬州，稳稳当当七天。东家按趟付银，一趟三两，外加酒钱。宾主相得，二十年没红过脸。" }],
    [{ t: "永丰号的规矩，是老东家亲手定的：按趟结钱。平安送到，拿三两；路上怎么走，几点歇，带几个人，镖局自己掂量。东家只问一句：到了没有。山里夜里的事，他看不见，也听不见。" }],
    [{ t: "新镖头姓赵，是个算盘精。他趴在地图上算了一夜：官道走七天，黑风峪只走三天。一年多走四趟，趟趟白花花的银子。黑风峪名字渗人？他呵呵一笑：哪有那么巧，回回撞上山匪？" }],
    [{ t: "算盘越打越顺。跟车的伙计，从八个减到四个，省一半工钱；骡马挑瘦的租，省三成草料；夜行不宿镇，又省下店钱。一笔是一笔，都算得干净利落。省下来的银子，一文不剩，全进了镖局的柜。" }],
  ]},
  { mark: "〔1:30 正文 · 出事与越防越贵〕", paras: [
    [{ t: "第三年秋，黑风峪果然出了事。夜里赶路，头车翻进山涧，两千两官银滚了半条沟。赵镖头亲自押着残银回平遥，按行规赔了镖价：一千两，赔五十。剩下的窟窿，永丰号自己认。" }],
    [{ t: "老东家疼得三天没吃下饭。赵镖头像没事人一样：赔五十两，这趟还净赚。这笔账他夜里早算好了：十趟里丢一趟，赔出去的，追不回省出来的。镖，接着走。" }],
    [{ t: "老东家不放心，派伙计跟车查岗。镖师前脚过了镇口，后脚就拐进黑风峪。查一次，躲一次。跟车的从两个加到六个，工钱年年翻。年底一盘账，老东家眼前一黑：押镖的本钱，十年翻了四倍。" }],
  ]},
  { mark: "〔2:23 转折 · 少东家与新合约〕", paras: [
    [{ t: "年关，留洋回来的少东家接过账本，看了一夜。天亮只问两句：快赶一天省下的银子，归谁？翻车赔的窟窿，又归谁？账房答：省的归镖局，赔的归票号。少东家合上账本：这不结了。" }, { t: "利是他的，险是我的", em: true }, { t: "，他凭什么替我省着走？" }],
    [{ t: "开春，永丰号换了新合约，只改两条。头一条：平安准点，每趟加赏二两。第二条：路上丢一箱，镖局赔十倍。满城都笑永丰号钱多烧的：这不白送镖局银子吗？赵镖头盯着那张新契，也盯了一夜。这一夜，他算的不是快，是稳。" }],
    [{ t: "第二天起，黑风峪再没见过永丰号的镖车。跟车的伙计，赵镖头自己加回了八个，一个不许减。夜路停了，宁可多走两天。没人查岗，没人盯着。镖还是那些镖，人还是那个人，走的已经不是那条路了。" }],
    [{ t: "十年下来，永丰号再没丢过一趟镖，押镖的本钱，反倒降回了从前。老东家到死也没想通：人心，怎么能说变就变？少东家在坟前烧了一本账：爹，人心从来没变过。变的是那张纸。" }],
  ]},
  { mark: "〔3:47 揭晓 · 从镖路到你的生活〕", paras: [
    [{ t: "故事讲完了。你以为这是古人的烦恼？买了全保的车，剐蹭一下还心疼吗？停车还挑地方吗？公司报销的差旅，还挑最便宜的航班吗？零八年，华尔街捅出大娄子，最后谁买单？每一个，都是黑风峪。" }],
    [{ t: "这个藏在合同背后、悄悄改写人行为的病，经济学里有个名字，叫" }, { t: "道德风险。", em: true }],
  ]},
  { mark: "〔4:14 概念拆解 · 对照讲解〕", paras: [
    [{ t: "拆开讲。镖局在路上怎么走，票号看不见，这叫隐藏行动。按趟结钱，快慢都一样，这叫固定报酬。省下的归镖局，赔的归票号，风险和利益劈成两半，这叫激励错位。合同怎么写，人就怎么活。" }],
    [{ t: "上一期的柠檬市场，是签约前看不清对方，叫逆向选择。这一期，是签约后看不住对方的手，叫道德风险。俩兄弟，一个管选人，一个管用人，2001年一起拿了诺贝尔奖。经济学开的药方，一共三味。第一味，盯着他，可查岗的成本，十年翻了四倍。第二味，换合约，把他的利跟你的险捆在一起。第三味，让他自己也押点什么。" }],
    [{ t: "你今天签的合同里，都藏着少东家的算盘。车险里的免赔额，是让你也赔一点，剐蹭了才心疼；绩效和期权，是把你未来的利，跟公司的险捆在同一根绳上；押金、对赌，就是赔十倍的现代版。看不见的地方，人只认合同，不认良心。" }],
  ]},
  { mark: "〔5:24 结尾 · 金句与CTA〕", paras: [
    [{ t: "少东家看明白的事，经济学家又算了一百年：人心不用变，纸得换。坏合约让好人铤而走险，好合约让懒人精打细算。关注我。下一期换个战场：一片谁都能放羊的草场，家家都算得精，最后草没了，羊也没了。那叫公地悲剧。" }],
  ]},
];

// ---------- 隐喻对照表数据 ----------
const metaphorRows = [
  ["永丰号票号", "委托人（Principal）", "出钱的一方，承担最终风险"],
  ["赵镖头与镖局", "代理人（Agent）", "办事的一方，掌握隐藏行动"],
  ["山路上怎么走的选择", "隐藏行动（Hidden Action）", "签约之后，委托人看不见的行为"],
  ["按趟结钱、一趟三两", "固定报酬合约", "快慢一个价，冒险的收益归自己"],
  ["利归镖局，险归票号", "风险与激励错位", "道德风险的病灶所在"],
  ["黑风峪夜路", "代理人的冒险行为", "省下的归自己，出事别人赔"],
  ["查岗跟车、加伙计", "监督（Monitoring）", "成本高，还防不住躲猫猫"],
  ["新约：加赏二两、赔十倍", "激励相容（Incentive Compatibility）", "把代理人的利益和委托人对齐"],
  ["伙计自己加回八个", "行为随激励改变", "同一个人，换合约就换行为"],
  ["免赔额、绩效期权、押金", "现代激励工具", "让代理人也押点什么，同一条船"],
];

const storyboardRows = [
  ["0:00", "平遥黄昏全景 + 开场大字钩子", "杀镖的不是山匪"],
  ["0:22", "清晨官道镖队插画", "宾主相得的二十年"],
  ["0:40", "旧合约条款卡动画", "按趟结钱，看不见"],
  ["0:57", "商路地图双路线动画", "官道七天 vs 黑风峪三天"],
  ["1:13", "省钱账本动画（伙计/骡马/夜行）", "省下的银子进镖局的柜"],
  ["1:30", "夜黑风峪翻车插画", "一千两赔五十，窟窿自己认"],
  ["1:48", "十趟丢一趟算术动画", "赔出去的追不回省出来的"],
  ["2:03", "票号账房烛光插画", "押镖本钱十年翻四倍"],
  ["2:23", "利险分裂大字动画", "利是他的，险是我的"],
  ["2:43", "新合约条款卡动画", "加赏二两，赔十倍"],
  ["3:10", "地图路线回放动画", "人还是那个人，路换了"],
  ["3:29", "十年后太平镖队插画", "人心没变，变的是那张纸"],
  ["3:47", "真实照片三连（车损/华尔街/雷曼）", "每一个都是黑风峪"],
  ["4:05", "朱砂大印章", "揭晓：道德风险"],
  ["4:14", "寓言对照表动画", "三组映射 + 金句"],
  ["4:34", "两兄弟与三味药动画", "逆向选择 + 道德风险 + 药方"],
  ["5:03", "签约真实照片 + 解药对照行", "免赔额 / 期权 / 押金"],
  ["5:24", "金句 + 关注 CTA", "下期预告：公地悲剧"],
];

const titleOptions = [
  ["方案一（悬念型·推荐）", "镖师没换，合约换了，镖就再没丢过。#经济学 #涨知识 #诺贝尔奖"],
  ["方案二（反差型）", "杀镖的不是山匪，是一张写错的合约。#经济学 #商业思维 #涨知识"],
  ["方案三（共鸣型）", "买了全保就敢浪？三百年前山西票号早算过这笔账。#保险 #经济学 #科普"],
  ["方案四（问题型）", "为什么你雇的人总让你失望？经济学诺奖开了三味药。#职场 #经济学 #涨知识"],
  ["方案五（人物型）", "留洋少东家改了两行字，救了祖传的票号。#故事 #经济学 #思维"],
];

// ---------- 组装文档 ----------
const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80, line: 480, lineRule: "atLeast" },
    children: [new TextRun({ text: "《镖路》", bold: true, size: 36, color: P.primary, font: F_HEAD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 360 },
    children: [new TextRun({ text: "一个关于「道德风险」的经济学寓言 · 抖音视频文字稿", size: 24, color: P.secondary, font: F_BODY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8C8BE", space: 8 } },
    children: [new TextRun({ text: "时长 5:48 ｜ 竖屏 1080×1920 ｜ 30fps ｜ 配音 xiaochen×1.08 ｜ 全片字幕已烧制 ｜ 横竖屏双封面 ｜ 动画讲解 + 真实素材", size: 20, color: P.secondary, font: F_BODY })],
  }),
];

children.push(sectionHeading("一、口播全文（与视频逐字一致）"));
for (const sec of script) {
  children.push(marker(sec.mark));
  for (const para of sec.paras) children.push(narration(para));
}

children.push(sectionHeading("二、概念解释与隐喻对照"));
children.push(narration([{ t: "道德风险（Moral Hazard）是信息经济学的核心概念：委托人与代理人签订合约之后，代理人的行为难以观察（隐藏行动），而合约的报酬结构决定了他怎么行动。当冒险的收益归代理人、损失的代价归委托人时，代理人会系统性地更敢冒险、更敢摆烂，哪怕他本性并不坏。2001年，阿克洛夫、斯宾塞、斯蒂格利茨因信息不对称研究共同获诺贝尔经济学奖；研究生层面还会延伸讨论委托代理模型、激励相容约束、参与约束、最优风险分担、效率工资、锦标赛理论，以及保险市场的免赔额与共同保险设计等议题。" }]));
children.push(narration([{ t: "本片的全部隐喻与概念的对应关系如下表，发布后可截取为评论区科普素材或下期回顾。" }]));
children.push(tableTitle("表 1 寓言元素与经济学概念对照"));
children.push(makeTable(["故事里", "经济学里", "一句话解释"], metaphorRows, [30, 34, 36]));

children.push(sectionHeading("三、分镜摘要（18 景）"));
children.push(tableTitle("表 2 分镜时间轴摘要"));
children.push(makeTable(["时间码", "画面", "剧情要点"], storyboardRows, [14, 44, 42]));

children.push(sectionHeading("四、抖音标题方案"));
children.push(tableTitle("表 3 标题备选（均控制在 55 字内，附平台话题标签）"));
children.push(makeTable(["方案", "标题文案"], titleOptions, [26, 74]));
children.push(marker("〔发布建议：优先方案一，悬念结构利于完播；职场/管理垂类账号可换方案四〕"));

children.push(sectionHeading("五、发布与运营建议"));
[
  "发布时间：工作日 12:00-13:00 或 18:00-20:00，周末 10:00-12:00，避开深夜知识类低谷时段。",
  "封面：竖版封面用于抖音主发布，横版封面（1920x1080）用于视频号、B站、小红书等横屏或方图场景，两版主标题文案保持一致。",
  "置顶评论：可放「隐喻对照表」精简版文字，把科普价值沉淀在评论区，提升互动率与收藏量。",
  "合集规划：本片为「经济学寓言」系列第三期，承接第二期（逆向选择）片尾预告，片尾已预告第四期（公地悲剧），建议建立合集承接追更流量。",
  "制作说明：本片按新规范升级，机制段落（合约卡、商路地图、算账、利险分裂等）改为 Remotion 原生动画讲解，气氛段落保留 AI 插画，揭晓段落首次引入真实照片素材（车损、2008 金融危机、雷曼兄弟）。",
  "联动前两期：机器学习寓言《背题神童》（过拟合）、经济学寓言《月泉马市》（逆向选择）可放在合集或评论区互相引流，形成系列账号人设。",
].forEach(t => children.push(narration([{ t }])));

children.push(noteP("注：视频、封面与全部工程文件已上传至 GitHub 仓库 43aquaris/fable-animation2，成品视频发布于该仓库 Release；本文字稿与视频旁白逐字一致，可直接用于复盘、二创或改编授权说明。"));

const doc = new Document({
  styles: { default: { document: {
    run: { font: F_BODY, size: 24, color: P.body },
    paragraph: { spacing: { line: 400 } },
  }}},
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
      },
    },
    headers: { default: new Header({ children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: "经济学寓言 · 第三期", size: 18, color: "999999", font: F_BODY })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" })],
    })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/fable3/assets/镖路_视频文字稿_抖音版.docx", buf);
  console.log("docx 已生成");
});
