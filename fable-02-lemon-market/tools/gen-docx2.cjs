// gen-docx2.cjs — 《月泉马市》视频文字稿（抖音版）docx 生成
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
  { mark: "〔0:00 开场钩子 · 马市黄昏〕", paras: [
    [{ t: "西域有座月泉城，马市养活了城里三代人。三十年后，马市没了。没遭兵灾，没闹马瘟，也没人使坏。它是自己，一步一步，把自己逼死的。" }],
  ]},
  { mark: "〔0:14 正文 · 鼎盛与隐患〕", paras: [
    [{ t: "鼎盛那几年，月泉马市一天能走三千匹马。大宛的宝驹，河曲的骏马，还有叫不上名的驽马，都拴在同一排栅栏里。客商从四面八方赶来，银子拍在案上，眼睛都不眨。" }],
    [{ t: "坏就坏在，马这东西，外人看不透。牵出来个个皮毛油亮，蹄子锃亮。是宝驹还是病马，只有马贩子心里有数。你在马市里蹲上三天，也就能看出个毛色。" }],
    [{ t: "买家不傻。看不出来，就只肯出中间价。宝驹值一百两，病马值二十两，那就出六十两，买到什么算什么。全城都这么干，谁也不肯多掏一个铜板。" }],
  ]},
  { mark: "〔0:56 正文 · 一轮一轮的崩塌〕", paras: [
    [{ t: "第一个撑不住的，是卖宝驹的康掌柜。他一匹宝驹，本钱就要九十两。六十两卖出去，卖一匹，亏一匹。年关那天，他把栅栏一收，赶着马群，去了别的城。" }],
    [{ t: "康掌柜一走，市面上的好马少了一成。买家掂量掂量，中间价还得再压。这回，轮到卖骏马的亏本了。当夜，又有十几家收拾行头，悄悄拔了桩子。" }],
    [{ t: "就这么一轮压一轮。价钱每落一次，就走掉一批好马。到第十年，栅栏里拴着的，十匹里有八匹是瘸马病马。马贩子私底下管它们，叫柠檬马。" }],
    [{ t: "最后，连最老实的买家都咂摸出味儿来了。能留到今天的马，还用挑吗？他们连中间价都不肯出了，只出废马价。这点钱，连一冬天的草料都填不上。" }],
    [{ t: "第二十年，月泉马市只剩一排空栅栏，沙土埋了半截拴马桩。靠马市吃饭的牙行、草料铺、客栈，一间接一间熄了灯。没有仇家，没有禁令。这个市场，是被一件" }, { t: "看不见的东西", em: true }, { t: "，慢慢杀死的。" }],
  ]},
  { mark: "〔2:11 转折 · 阿依婆的木牌〕", paras: [
    [{ t: "第三十年，集市口来了个赶骆驼的老太太，人称阿依婆。她在空市口立了块木牌，上面刻着一行字：凡我卖出的马，一年内腿瘸眼瞎，赔十倍价银。全城的人都笑她疯了。" }],
    [{ t: "笑归笑，买家都在算同一笔账：敢赔十倍，说明她的马经得起赔。卖瘸马的敢学吗？不敢，赔一次就倾家荡产。一个月后，全城买家绕开所有马贩，只认阿依婆的摊子。" }],
    [{ t: "后来，别的马贩也一块一块立起了牌子，画押，找牙人作保。三年后，月泉马市又活了。救回它的，不是官府，也不是谁的良心。是一块敢赔十倍的木牌。" }],
  ]},
  { mark: "〔2:56 揭晓 · 从马市到二手车市场〕", paras: [
    [{ t: "故事讲完了。你以为这是古人的烦恼？你今天走进二手车市场，听车商拍着胸口说车况极佳的时候，你就站在月泉城的马市里。毛病藏在漆面底下，底细只有卖家有数。" }],
    [{ t: "这个能把好市场活活逼死的病，经济学里有个名字，叫" }, { t: "逆向选择。", em: true }],
  ]},
  { mark: "〔3:20 概念拆解 · 对照讲解〕", paras: [
    [{ t: "拆开讲。马贩子知道底细，买家不知道，这叫信息不对称。买家按平均质量出价，好马卖不上好价，只好先走，坏马留下，市场一轮一轮掉血，这就是柠檬市场。1970年，经济学家阿克洛夫把它写成论文，题目就叫《柠檬市场》。三十年后，这篇论文替他拿回了诺贝尔奖。" }],
    [{ t: "阿克洛夫把市场的死法画成一个圈：买家看不见质量，只敢出平均价；平均价，必让最好的马先亏本；好马一撤，平均质量再跌，价钱只能再压。一圈比一圈狠，转到最后，市场只剩柠檬，价格归零。当年这篇论文被三家顶级期刊退稿，理由是太简单。后来，它成了经济学被引用最多的文章之一。" }],
    [{ t: "救活马市的阿依婆，经济学里也有名字，叫信号发送。敢赔十倍，等于把马的质量，变成看得见、又模仿不了的信号。卖瘸马的学不起，这块牌子才值钱。你今天看到的质保、七天无理由退换、大品牌砸几个亿打广告，都是那块木牌的后代。第三方检测、平台评分，就是新时代的牙人作保。" }],
  ]},
  { mark: "〔4:35 结尾 · 金句与CTA〕", paras: [
    [{ t: "阿克洛夫用一篇论文讲明白一件事：市场最怕的不是坏人，是不知道。坏的能明码标价，都有得谈；看不见底细的市场，好东西会自己走光。关注我。下一期讲它的孪生兄弟：买了保险就敢浪，签了合同就摆烂，那叫道德风险。" }],
  ]},
];

// ---------- 隐喻对照表数据 ----------
const metaphorRows = [
  ["月泉马市", "市场（Market）", "买卖双方与定价机制的载体"],
  ["看不透的马", "质量信息不对称的商品", "关键信息只有卖家掌握"],
  ["康掌柜的宝驹", "优质商品", "成本高，最先被低价逼退"],
  ["柠檬马（瘸马病马）", "劣质品（「柠檬」）", "论文标题《柠檬市场》的由来"],
  ["全城统一的中间价", "平均质量定价", "买家按期望值出价"],
  ["好马一轮一轮撤走", "逆向选择（Adverse Selection）", "价格先赶走的是最好的"],
  ["空掉的栅栏与熄灯的铺子", "市场崩溃 · 交易归零", "死亡螺旋的终点"],
  ["阿依婆十倍赔偿的木牌", "信号发送（Signaling）", "斯宾塞同年诺奖的另一半"],
  ["牙人作保画押", "第三方认证", "质保、检测、平台评分的雏形"],
  ["精明买家只出废马价", "理性预期", "买家看穿剩下的都是柠檬"],
];

const storyboardRows = [
  ["0:00", "黄昏古城马市全景 + 开场大字钩子", "一座马市把自己逼死了"],
  ["0:14", "鼎盛马市，三千匹马与客商", "好马驽马同栏的隐患"],
  ["0:29", "买家围观油亮的马，马贩笑容莫测", "只有马贩子心里有数"],
  ["0:43", "木案上的银锭与讨价还价", "全城只出中间价"],
  ["0:56", "康掌柜收摊离场，牵走好马", "卖一匹亏一匹"],
  ["1:11", "火把下的连夜撤离", "中间价再压，骏马商也走"],
  ["1:24", "冷清栅栏里的瘦马", "十匹八匹柠檬马"],
  ["1:37", "老练买家皱眉转身", "只肯出废马价"],
  ["1:51", "废弃空马市，残阳空栅栏", "被看不见的东西杀死"],
  ["2:11", "阿依婆与她的木牌", "赔十倍价银的承诺"],
  ["2:27", "马摊前排起长队", "只认阿依婆的摊子"],
  ["2:41", "立牌画押、牙人作保", "市场三年后复活"],
  ["2:56", "现代黑场金字", "你买二手车的那天"],
  ["3:12", "绛红大印章", "揭晓：逆向选择"],
  ["3:20", "寓言对照表动画", "马市元素四组映射 + 诺奖注脚"],
  ["3:42", "死亡螺旋循环图", "四节点一圈比一圈狠"],
  ["4:08", "木牌图+解药对照行", "信号发送与第三方认证"],
  ["4:35", "金句+关注CTA", "下期预告：道德风险"],
];

const titleOptions = [
  ["方案一（悬念型·推荐）", "一座养活三代人的马市，把自己逼死了。#经济学 #涨知识 #诺贝尔奖"],
  ["方案二（反差型）", "没有天灾没有坏人，这个市场照样死了。#经济学 #商业思维 #涨知识"],
  ["方案三（共鸣型）", "你不敢信二手车贩子？这个马市寓言讲透了原因。#二手车 #经济学 #涨知识"],
  ["方案四（问题型）", "为什么越便宜的市场越坑人？诺奖论文一篇讲透。#经济学 #科普 #商业"],
  ["方案五（人物型）", "敢赔十倍的老太太，救活了一座死掉的市场。#故事 #经济学 #思维"],
];

// ---------- 组装文档 ----------
const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80, line: 480, lineRule: "atLeast" },
    children: [new TextRun({ text: "《月泉马市》", bold: true, size: 36, color: P.primary, font: F_HEAD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 360 },
    children: [new TextRun({ text: "一个关于「逆向选择」的经济学寓言 · 抖音视频文字稿", size: 24, color: P.secondary, font: F_BODY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8C8BE", space: 8 } },
    children: [new TextRun({ text: "时长 4:57 ｜ 竖屏 1080×1920 ｜ 30fps ｜ 配音 xiaochen×1.08 ｜ 全片字幕已烧制 ｜ 横竖屏双封面", size: 20, color: P.secondary, font: F_BODY })],
  }),
];

children.push(sectionHeading("一、口播全文（与视频逐字一致）"));
for (const sec of script) {
  children.push(marker(sec.mark));
  for (const para of sec.paras) children.push(narration(para));
}

children.push(sectionHeading("二、概念解释与隐喻对照"));
children.push(narration([{ t: "逆向选择（Adverse Selection）是信息经济学的核心概念：在买卖双方信息不对称的市场里，买家无法分辨商品质量，只能按平均质量出价；这个平均价必然让最优质的商品率先退出，导致市场平均质量进一步下降、价格进一步走低，形成恶性循环，最终劣质品（「柠檬」）驱逐优质品，极端情况下市场彻底消失。乔治·阿克洛夫1970年在《经济学季刊》发表《柠檬市场：质量不确定性与市场机制》，2001年与斯宾塞、斯蒂格利茨共同获诺贝尔经济学奖。研究生层面还会延伸讨论信号发送与甄别机制、混同均衡与分离均衡、保险市场的死亡螺旋等议题。" }]));
children.push(narration([{ t: "本片的全部隐喻与概念的对应关系如下表，发布后可截取为评论区科普素材或下期回顾。" }]));
children.push(tableTitle("表 1 寓言元素与经济学概念对照"));
children.push(makeTable(["故事里", "经济学里", "一句话解释"], metaphorRows, [30, 34, 36]));

children.push(sectionHeading("三、分镜摘要（18 景）"));
children.push(tableTitle("表 2 分镜时间轴摘要"));
children.push(makeTable(["时间码", "画面", "剧情要点"], storyboardRows, [14, 44, 42]));

children.push(sectionHeading("四、抖音标题方案"));
children.push(tableTitle("表 3 标题备选（均控制在 55 字内，附平台话题标签）"));
children.push(makeTable(["方案", "标题文案"], titleOptions, [26, 74]));
children.push(marker("〔发布建议：优先方案一，悬念结构利于完播；财经垂类账号可换方案四〕"));

children.push(sectionHeading("五、发布与运营建议"));
[
  "发布时间：工作日 12:00-13:00 或 18:00-20:00，周末 10:00-12:00，避开深夜知识类低谷时段。",
  "封面：竖版封面用于抖音主发布，横版封面（1920x1080）用于视频号、B站、小红书等横屏或方图场景，两版主标题文案保持一致。",
  "置顶评论：可放「隐喻对照表」精简版文字，把科普价值沉淀在评论区，提升互动率与收藏量。",
  "合集规划：本片为「经济学寓言」系列第一期，片尾已预告下一期（道德风险），建议建立合集承接追更流量。",
  "字幕：全片字幕已内嵌，无需再开自动字幕；若重剪，注意保持关键词金色/红色强调样式的一致性。",
  "联动第一集：机器学习寓言《背题神童》（过拟合）可放在合集或评论区互相引流，形成跨学科账号人设。",
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
      children: [new TextRun({ text: "经济学寓言 · 第一期", size: 18, color: "999999", font: F_BODY })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" })],
    })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/fable2/assets/月泉马市_视频文字稿_抖音版.docx", buf);
  console.log("docx 已生成");
});
