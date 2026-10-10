// gen-docx5.cjs — 《同和钱庄》视频文字稿（抖音版）docx 生成
// 场景：copywriting（口播稿）｜Profile B 字体｜行距 400｜无封面无目录单节
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType,
} = require("docx");
const fs = require("fs");

const P = {
  primary: "1A1A1A",
  body: "333333",
  secondary: "666666",
  accent: "B0712A",
  surface: "FBF7EE",
};

const F_HEAD = { ascii: "Calibri", eastAsia: "SimHei" };
const F_BODY = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

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
  { mark: "〔0:00 开场钩子 · 市镇清晨〕", paras: [
    [{ t: "江南有个青石镇，镇上的同和钱庄，掌柜厚道，账目干净，放出去的款子笔笔收得回。就是这么一家好钱庄，三天，倒了。没有坏账，没有亏空，也没有贼。扳倒它的，是一句" }, { t: "没影儿的话。", em: true }],
  ]},
  { mark: "〔0:17 正文 · 钱庄的生意经〕", paras: [
    [{ t: "钱庄怎么赚钱？东街张婶存进一百两，钱庄不能让银子睡觉，转手借给酒坊，三年期，利钱高三成。存户的银子随时能取，贷出去的款三年才回。这门生意的命门，就卡在随时和三年中间。" }],
    [{ t: "老掌柜有分寸。柜上永远压着三成现银。天天有人存，天天有人取，进的多、出的少，账总转得开。二十年没出过岔子，镇上人存钱，跟把银子搁自家柜里一样放心。" }],
    [{ t: "出事那天，下着雨。米行的老板娘来取银子，跟柜上的人闲聊，说她听人讲：同和放给丝行的那笔大钱，收不回来了。她本是随口一说。可排在她后头的几个人，都听见了。" }],
    [{ t: "这话过三条街，进七家茶馆，只用半天。传话的人还自己添料：有人说丝行掌柜跑了，有人说钱庄亏了三万两，有人连官府要封账都编出来了。没人去查。查，要走路；信，只要点头。" }],
    [{ t: "绸缎庄的吴老板，头一个赶到。他其实不信。可他算了笔账：万一呢？今天不取，明天人人去取，我就取不出来了。取，顶多折几个利钱；不取，可能连本都捞不回。这笔账，傻子才不算。" }],
    [{ t: "第二天鸡叫，同和门口排起了队。挑担的、开铺的、当家的娘子，把一条街站满了。队里多数人，跟吴老板一样：不是怕钱庄坏，是怕别人怕。" }],
  ]},
  { mark: "〔2:54 正文 · 三天崩塌〕", paras: [
    [{ t: "老掌柜开柜，把三成现银全掏了出来，一炷香就见了底。可大头的银子在酒坊的窖里、丝行的机上，锁在三年期的契书里。柜上付不出，队尾开始砸门。到这一步，钱庄已经死了：它不是资不抵债，是拿不出今天的现钱。" }],
    [{ t: "第三天，同和封了门板。掌柜变卖家产，赔了六成，酒坊的贷款烂在半路，存户折了四成本金。事后官府查账：同和的账，比镇上哪一家钱庄都干净。它是被怕倒本身，挤倒的。" }],
    [{ t: "复盘一下，这句没影儿的话，分两步杀人。第一步，让人怕。第二步，怕的人去取钱。取钱这个动作，把怕变成了真的。经济学管这叫自我实现的预言：你信它倒，它就真的倒。" }],
    [{ t: "后来镇上重开钱庄，规矩变了。十几家钱庄立了联保的约：一家遭挤兑，其余各家开柜，替它兑银子。官府再压一笔官银做底。从那以后，一句闲话，再没掀动过哪家钱庄。" }],
    [{ t: "因为人人都看明白了：真挤不动了。怕，退了潮；信，就跟着回来了。往后二十年，青石镇再没倒过一家钱庄。不是钱庄变乖了，是跑的理由没了。" }],
  ]},
  { mark: "〔3:58 揭晓 · 从钱庄到硅谷银行〕", paras: [
    [{ t: "故事讲完了。你以为这是古人的事？1933年大萧条，美国一年倒了四千家银行，罗斯福下令全国银行歇业整顿；2023年3月，硅谷银行，两天被挤倒。照片里那些排队的背影，跟同和门口的，是同一批人。" }],
    [{ t: "这个好银行也会得的猝死病，经济学里有个名字，叫" }, { t: "银行挤兑。", em: true }],
  ]},
  { mark: "〔4:26 概念拆解 · 对照讲解〕", paras: [
    [{ t: "拆开讲。储户的钱随取随用，贷款三年才回，这叫期限转换，是银行的本职。柜上压三成现银，这叫存款准备金。一句闲话搅动人心，这叫信心冲击。人人怕倒都去取钱，这叫个体理性。挤兑，就是个体理性凑出来的集体死局。" }],
    [{ t: "这门学问做到顶，是2022年的诺贝尔奖。戴蒙德和迪布维格把挤兑写成了数学：一家银行，天生有两个结局。好的那个，人人相安，钱生钱。坏的那个，人人抢跑，三天清盘。站到哪边，不看银行好坏，看大家信哪边。所以才需要那个局外人：中央银行，在人心塌的时候掏钱出来，名号就叫最后贷款人。" }],
    [{ t: "今天的银行，站在三道闸后面。第一道，准备金，柜上先压一成现银。第二道，存款保险，五十万以内国家兜底，你不用跑，跑的理由就没了。第三道，最后贷款人，央行开柜。你手机银行里那串数字，全靠这三道闸撑着。" }],
  ]},
  { mark: "〔5:43 结尾 · 金句与CTA〕", paras: [
    [{ t: "同和钱庄死于一句话，现代银行活在三道闸。信心这东西，聚起来要二十年，散掉，只要一个上午。关注我。下一期接着讲钱：最后贷款人掏出来的钱从哪来？印多了，会怎样？那叫通货膨胀。" }],
  ]},
];

// ---------- 隐喻对照表数据 ----------
const metaphorRows = [
  ["同和钱庄", "银行（商业银行）", "期限转换的中介"],
  ["存一百两，随时能取", "活期存款 · 随时提取", "流动性的供给方"],
  ["借给酒坊，三年才回", "长期贷款", "流动性的需求方"],
  ["柜上压三成现银", "存款准备金", "应对日常提现的缓冲"],
  ["米行老板娘的闲话", "信心冲击（恐慌信号）", "挤兑的导火索"],
  ["吴老板的账", "个体理性（抢跑博弈）", "先取先得的囚徒困境"],
  ["一炷香见底", "流动性枯竭", "资不抵债之外的死法"],
  ["钱庄联保 + 官银做底", "最后贷款人 · 存款保险", "现代三道闸的雏形"],
  ["怕退了潮，信回来了", "均衡切换", "信心决定结局的理论核心"],
];

const storyboardRows = [
  ["0:00", "水乡市镇清晨插画 + 开场大字钩子", "一家好钱庄死于一句话"],
  ["0:17", "资金池动画：存入与借出", "命门：随时和三年"],
  ["0:35", "准备金动画：三成现银", "二十年没出过岔子"],
  ["0:50", "雨天巷口窃语插画", "一句没影儿的话"],
  ["1:06", "谣言传播网络动画", "过三条街，进七家茶馆"],
  ["1:24", "吴老板的账动画", "取或不取：万一呢"],
  ["1:41", "钱庄门口长队插画", "不是怕钱庄坏，是怕别人怕"],
  ["1:54", "资金池放干动画", "三成见底，贷款锁死三年"],
  ["2:14", "封门插画 + 判词", "不是资不抵债，是拿不出今天的现钱"],
  ["2:30", "自我实现循环动画", "信它倒，它就真的倒"],
  ["2:48", "联保网络动画", "其余各家开柜，替它兑银子"],
  ["3:02", "太平市镇插画", "怕退了潮，信回来了"],
  ["3:58", "真实照片三连（1933/SVB人群/关门告示）", "排队的背影是同一批人"],
  ["4:18", "银朱大印章", "揭晓：银行挤兑"],
  ["4:26", "寓言对照表动画", "四组映射 + 集体死局"],
  ["4:35", "双结局动画 + 2022诺奖", "好结局坏结局，看大家信哪边"],
  ["5:01", "三道闸动画", "准备金 / 存款保险 / 最后贷款人"],
  ["5:43", "金句 + 关注 CTA", "下期预告：通货膨胀"],
];

const titleOptions = [
  ["方案一（悬念型·推荐）", "没坏账没亏空，这家好钱庄三天就倒了。#经济学 #涨知识 #诺贝尔奖"],
  ["方案二（反差型）", "杀死一家好银行的，从来不是坏账。#金融 #经济学 #涨知识"],
  ["方案三（共鸣型）", "你在银行门口排队的样子，1933 年和 2023 年都发生过。#银行 #历史 #科普"],
  ["方案四（问题型）", "为什么存了保险的银行还会倒？诺奖模型两分钟讲透。#金融 #经济学 #科普"],
  ["方案五（数字型）", "信心，聚起来要二十年，散掉只要一个上午。#思维 #经济学 #商业"],
];

// ---------- 组装文档 ----------
const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80, line: 480, lineRule: "atLeast" },
    children: [new TextRun({ text: "《同和钱庄》", bold: true, size: 36, color: P.primary, font: F_HEAD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 360 },
    children: [new TextRun({ text: "一个关于「银行挤兑」的经济学寓言 · 抖音视频文字稿", size: 24, color: P.secondary, font: F_BODY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8C8BE", space: 8 } },
    children: [new TextRun({ text: "时长 5:17 ｜ 竖屏 1080×1920 ｜ 30fps ｜ 配音 xiaochen×1.08 ｜ 全片字幕已烧制 ｜ 横竖屏双封面 ｜ 动画讲解 + 真实素材", size: 20, color: P.secondary, font: F_BODY })],
  }),
];

children.push(sectionHeading("一、口播全文（与视频逐字一致）"));
for (const sec of script) {
  children.push(marker(sec.mark));
  for (const para of sec.paras) children.push(narration(para));
}

children.push(sectionHeading("二、概念解释与隐喻对照"));
children.push(narration([{ t: "银行挤兑（Bank Run）是金融经济学的核心现象：银行把随时可取的短期存款转换为长期贷款（期限转换），天然只保留部分准备金；一旦储户因恐慌集中提款，即使资产质量良好、资可抵债，也会因流动性枯竭而倒闭。挤兑存在多重均衡：人人相安则银行健康运转，人人抢跑则自我实现地摧毁银行。道格拉斯·戴蒙德与菲利普·迪布维格在1983年的经典模型中将其形式化（Diamond-Dybvig 模型），提出存款保险可以消除坏均衡；二人获2022年诺贝尔经济学奖（与本·伯南克同获）。研究生层面还会延伸讨论序贯服务约束、首达先得规则、协调博弈与全局博弈（global games）、最后贷款人（白芝浩规则）与央行流动性工具、以及 2023 年硅谷银行案例中数字化挤兑的新特征等议题。" }]));
children.push(narration([{ t: "本片的全部隐喻与概念的对应关系如下表，发布后可截取为评论区科普素材或下期回顾。" }]));
children.push(tableTitle("表 1 寓言元素与经济学概念对照"));
children.push(makeTable(["故事里", "经济学里", "一句话解释"], metaphorRows, [30, 34, 36]));

children.push(sectionHeading("三、分镜摘要（18 景）"));
children.push(tableTitle("表 2 分镜时间轴摘要"));
children.push(makeTable(["时间码", "画面", "剧情要点"], storyboardRows, [14, 44, 42]));

children.push(sectionHeading("四、抖音标题方案"));
children.push(tableTitle("表 3 标题备选（均控制在 55 字内，附平台话题标签）"));
children.push(makeTable(["方案", "标题文案"], titleOptions, [26, 74]));
children.push(marker("〔发布建议：优先方案一，悬念结构利于完播；金融/财经垂类账号可换方案二〕"));

children.push(sectionHeading("五、发布与运营建议"));
[
  "发布时间：工作日 12:00-13:00 或 18:00-20:00，周末 10:00-12:00，避开深夜知识类低谷时段。",
  "封面：竖版封面用于抖音主发布，横版封面（1920x1080）用于视频号、B站、小红书等横屏或方图场景，两版主标题文案保持一致。",
  "置顶评论：可放「隐喻对照表」精简版文字，把科普价值沉淀在评论区，提升互动率与收藏量。",
  "合集规划：本片为「经济学寓言」系列第五期，承接第四期（公地悲剧）片尾预告，片尾已预告第六期（通货膨胀），建议建立合集承接追更流量。",
  "制作说明：机制段落（资金池、准备金、谣言传播、吴老板的账、池子放干、自我实现循环、联保网络、双结局、三道闸）为 Remotion 原生动画讲解，气氛段落保留 AI 插画，揭晓段落引入真实照片素材（大萧条银行挤兑、硅谷银行人群与关门告示）。",
  "联动前四期：机器学习寓言《背题神童》（过拟合）、经济学寓言《月泉马市》（逆向选择）、《镖路》（道德风险）、《草洼村》（公地悲剧）可放合集互相引流，形成系列账号人设。",
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
      children: [new TextRun({ text: "经济学寓言 · 第五期", size: 18, color: "999999", font: F_BODY })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" })],
    })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/fable5/assets/同和钱庄_视频文字稿_抖音版.docx", buf);
  console.log("docx 已生成");
});
