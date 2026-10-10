// gen-docx4.cjs — 《草洼村》视频文字稿（抖音版）docx 生成
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
  { mark: "〔0:00 开场钩子 · 草原全景〕", paras: [
    [{ t: "草原深处有个草洼村，一片大草场养活了六代人。到了第七代，村子空了。没旱灾，没蝗灾，也没坏人作恶。羊越养越多，草越吃越少，最后草根都没了。全村没一个人做错事，可全村" }, { t: "破了产。", em: true }],
  ]},
  { mark: "〔0:18 正文 · 公地与算盘〕", paras: [
    [{ t: "草场是老辈传下的规矩：村后那片，谁都能放，不收一文钱。想圈自己的地，得跟村里买，贵得吓人。所以家家都认准一个理：草是公家的，羊是自家的。羊往公地放，天经地义。" }],
    [{ t: "老三家先算明白了一笔账。多买一只羊羔，开春放上公地，入冬卖了，净赚一百文。羊要吃草，草场的损耗，全村八十七户一起摊，摊到他头上，不到一文。这买卖，傻子才不做。" }],
    [{ t: "坏就坏在，八十七户，都不是傻子。你不多养，别人也在多养，草横竖是要被吃的，不吃白不吃。那年秋天，全村的羊翻了一倍。草原看着还绿，草根已经虚了。" }],
  ]},
  { mark: "〔1:08 正文 · 崩盘的循环〕", paras: [
    [{ t: "第三年，草只到脚踝。羊开始掉膘，毛色发暗。有人在祠堂里嘀咕：该少养点了。话没落地就被人顶了回去：你先减？你减一只，省下的草，也是进了别人家羊的肚子。" }],
    [{ t: "掉膘的羊卖不上价，村里人想的办法，是再添几只，把总收入凑回来。于是草越差，羊越多；羊越多，草越差。这个圈，村里人转了五年，谁也停不下来。" }],
    [{ t: "第七年开春，草没有长出来。风一起，沙子埋了脚背。羊没草吃，全村抛售，羊价当天就崩了。卖羊的钱撑不到半年，八十七户，走的走，散的散。" }],
    [{ t: "后来有外乡人路过废墟，问守坟的老头：这村子，毁于天灾还是人祸？老头想了半天：都不是。每家都只多放了那么几只。八十七家加在一起，就是" }, { t: "八十七个几只", em: true }, { t: "。草场就是这么死的。" }],
  ]},
  { mark: "〔2:13 转折 · 祠堂里的线〕", paras: [
    [{ t: "再后来，县里派来个年轻人，把没走的二十几户叫进坍了半边的祠堂。他没骂人，也没提收地的事，就蹲在地上，拿柴棍画了几道线。" }],
    [{ t: "草场划成八十七片，一家一片，写进村簿。轮着放，春天啃东坡，秋天换西坡。两个后生当护草员，工钱全村摊。羊进错了片，罚三倍。羊数也不由各家定，每年开春，按草的长势定。" }],
    [{ t: "有人拍了桌子：羊是我自家的，凭什么限我？年轻人说：对，羊是你的。可草没了，你的羊吃什么？限的不是羊，是保住你家羊的草。吵了三天，二十几户，按了手印。" }],
    [{ t: "三年，草过脚踝。五年，草过膝，羊群比崩盘那年还壮。十年，草洼村的草场，比老照片里祖上那辈还厚。这回没靠官府，也没靠圣人，靠的是地上那几道柴棍画的线。" }],
  ]},
  { mark: "〔3:19 揭晓 · 从草场到太平洋〕", paras: [
    [{ t: "故事讲完了。你以为这是村里的老黄历？太平洋的鱼，谁都能下网，捞上来归你，空了归大家。大气层，谁都能排，省下的成本归你，热了归全球。城市里堆成山的共享单车，照片你刷到过。每一片，都是草洼村的草场。" }],
    [{ t: "这个没有坏人也能发生的悲剧，经济学里有个名字，叫" }, { t: "公地悲剧。", em: true }],
  ]},
  { mark: "〔3:46 概念拆解 · 对照讲解〕", paras: [
    [{ t: "拆开讲。草场谁都能用，这叫非排他性。多养一只羊，收益归自己，成本大家摊，这叫收益私有、成本公有。谁先减羊谁吃亏，谁也不会先停手，这叫囚徒困境。个人的算盘越打越精，公共的家底越算越薄。" }],
    [{ t: "1968年，生物学家哈丁在《科学》杂志上写了篇六页的论文，标题就叫《公地悲剧》。他说，公地只有两条出路：要么卖掉，要么归官。四十年后，政治学家奥斯特罗姆跑了瑞士的高山草场、日本的村有山林、西班牙的灌溉渠，发现这些公地，有的用了一千年都没坏。她的答案：村里自己管。2009年，她成了第一个拿诺贝尔经济学奖的女人。" }],
    [{ t: "奥斯特罗姆把这些土办法总结成八条原则，草洼村全占了。边界划清楚：八十七片，一家一片。规矩自己定：写进村簿。监督在眼皮底下：护草员是自家后生。犯规真罚：三倍。你今天的渔业配额、碳交易、小区业委会，都是那几道柴棍线的后代。" }],
  ]},
  { mark: "〔5:03 结尾 · 金句与CTA〕", paras: [
    [{ t: "草洼村的故事，哈丁说无解，奥斯特罗姆说有解，解就在人怎么相处。一群人守着一份公共的家底，坏，不需要坏人；救回来，也不需要圣人。关注我。下一期讲钱的事：一家好好的银行，怎么被一句闲话，三天挤倒。那叫银行挤兑。" }],
  ]},
];

// ---------- 隐喻对照表数据 ----------
const metaphorRows = [
  ["村后的公地", "非排他性资源", "谁都能用，拦不住人"],
  ["多养一只羊", "个体理性选择", "收益归己，成本摊薄"],
  ["一百文归己，一文摊各家", "收益私有 · 成本公有", "公地悲剧的账本结构"],
  ["谁先减羊谁吃亏", "囚徒困境", "单方面收手就是吃亏"],
  ["草越差，羊越多", "恶性循环 · 超载响应", "用数量对冲单价下跌"],
  ["八十七个「几只」", "个体理性 → 集体非理性", "家家加总，即为灾难"],
  ["柴棍画的线", "奥斯特罗姆自主治理", "划界 · 轮牧 · 监督 · 罚则"],
  ["护草员与三倍罚款", "就近监督与分级制裁", "成本低，还护得住"],
  ["渔业配额 · 碳交易", "公地治理的现代版", "草洼村方案的国家化"],
];

const storyboardRows = [
  ["0:00", "丰美草原全景 + 开场大字钩子", "全村没一个坏人，草场还是死了"],
  ["0:18", "牧村与共享草场插画", "草是公家的，羊是自家的"],
  ["0:34", "一只羊的账本动画", "一百文归自己，不到一文摊各家"],
  ["0:51", "87 户点阵 + 羊数翻倍动画", "家家加羊，草根发虚"],
  ["1:08", "草矮羊瘦插画", "你先减？省下的草进别人的羊肚子"],
  ["1:26", "恶性循环四节点动画", "草越差羊越多，谁也停不下来"],
  ["1:41", "沙化草场插画", "羊价当天就崩了"],
  ["1:57", "复盘乘法大字动画", "八十七个「几只」"],
  ["2:13", "祠堂柴棍画线插画", "转折：地上那几道线"],
  ["2:24", "新规矩五卡动画", "划片 · 轮牧 · 护草员 · 罚三倍 · 按草定羊"],
  ["2:44", "祠堂争论插画", "限的不是羊，是保住你家羊的草"],
  ["3:00", "丰茂草场插画", "十年后，草比祖上还厚"],
  ["3:19", "真实照片三连（捕捞/排放/单车坟场）", "每一片都是草洼村的草场"],
  ["3:39", "赭红大印章", "揭晓：公地悲剧"],
  ["3:46", "寓言对照表动画", "四组映射 + 金句"],
  ["4:07", "哈丁论文卡 + 奥斯特罗姆动画", "两条出路 vs 第三条路"],
  ["4:38", "渔港真实照片 + 解药对照行", "配额 / 碳交易 / 业委会"],
  ["5:03", "金句 + 关注 CTA", "下期预告：银行挤兑"],
];

const titleOptions = [
  ["方案一（悬念型·推荐）", "全村没一个坏人，草场还是死了。#经济学 #涨知识 #诺贝尔奖"],
  ["方案二（反差型）", "人人都会算账的时代，草场就是这么算死的。#经济学 #环保 #涨知识"],
  ["方案三（共鸣型）", "共享单车为什么堆成山？科学家五十年前就算好了。#共享经济 #经济学 #科普"],
  ["方案四（问题型）", "为什么公海越捞越空？一个草原村子的死法讲透原因。#海洋 #经济学 #科普"],
  ["方案五（人物型）", "一个女人跑了四十年田野，推翻了教科书上的断言。#人物 #经济学 #思维"],
];

// ---------- 组装文档 ----------
const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80, line: 480, lineRule: "atLeast" },
    children: [new TextRun({ text: "《草洼村》", bold: true, size: 36, color: P.primary, font: F_HEAD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 360 },
    children: [new TextRun({ text: "一个关于「公地悲剧」的经济学寓言 · 抖音视频文字稿", size: 24, color: P.secondary, font: F_BODY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D8C8BE", space: 8 } },
    children: [new TextRun({ text: "时长 5:27 ｜ 竖屏 1080×1920 ｜ 30fps ｜ 配音 xiaochen×1.08 ｜ 全片字幕已烧制 ｜ 横竖屏双封面 ｜ 动画讲解 + 真实素材", size: 20, color: P.secondary, font: F_BODY })],
  }),
];

children.push(sectionHeading("一、口播全文（与视频逐字一致）"));
for (const sec of script) {
  children.push(marker(sec.mark));
  for (const para of sec.paras) children.push(narration(para));
}

children.push(sectionHeading("二、概念解释与隐喻对照"));
children.push(narration([{ t: "公地悲剧（Tragedy of the Commons）是公共经济学的核心概念：当一项资源人人可用（非排他性）而使用权又不设限（非竞争性未受约束）时，每个使用者的理性选择都是多占一点，因为收益全归自己、成本由所有人分摊；个体理性加总为集体非理性，资源最终被过度使用直至枯竭。加勒特·哈丁1968年在《科学》杂志以《公地悲剧》为题提出该框架；埃莉诺·奥斯特罗姆基于瑞士草场、日本村有林、西班牙灌渠等长期存续的自治案例，提出自主治理八原则（清晰边界、本地规则、集体选择、就近监督、分级制裁、冲突解决、最低限度承认、嵌套式组织），并因此获得2009年诺贝尔经济学奖，成为首位获此奖的女性。研究生层面还会延伸讨论非排他性与竞争性的二维资源分类、外部性与庇古税、科斯谈判、可转让配额（ITQ）与共有产权制度设计等议题。" }]));
children.push(narration([{ t: "本片的全部隐喻与概念的对应关系如下表，发布后可截取为评论区科普素材或下期回顾。" }]));
children.push(tableTitle("表 1 寓言元素与经济学概念对照"));
children.push(makeTable(["故事里", "经济学里", "一句话解释"], metaphorRows, [30, 34, 36]));

children.push(sectionHeading("三、分镜摘要（18 景）"));
children.push(tableTitle("表 2 分镜时间轴摘要"));
children.push(makeTable(["时间码", "画面", "剧情要点"], storyboardRows, [14, 44, 42]));

children.push(sectionHeading("四、抖音标题方案"));
children.push(tableTitle("表 3 标题备选（均控制在 55 字内，附平台话题标签）"));
children.push(makeTable(["方案", "标题文案"], titleOptions, [26, 74]));
children.push(marker("〔发布建议：优先方案一，悬念结构利于完播；环保/科普垂类账号可换方案四〕"));

children.push(sectionHeading("五、发布与运营建议"));
[
  "发布时间：工作日 12:00-13:00 或 18:00-20:00，周末 10:00-12:00，避开深夜知识类低谷时段。",
  "封面：竖版封面用于抖音主发布，横版封面（1920x1080）用于视频号、B站、小红书等横屏或方图场景，两版主标题文案保持一致。",
  "置顶评论：可放「隐喻对照表」精简版文字，把科普价值沉淀在评论区，提升互动率与收藏量。",
  "合集规划：本片为「经济学寓言」系列第四期，承接第三期（道德风险）片尾预告，片尾已预告第五期（银行挤兑），建议建立合集承接追更流量。",
  "制作说明：机制段落（一只羊的账、羊数翻倍、恶性循环、八十七个几只、新规矩、哈丁与奥斯特罗姆）为 Remotion 原生动画讲解，气氛段落保留 AI 插画，揭晓段落引入真实照片素材（远洋捕捞、工业排放、共享单车坟场、渔港）。",
  "联动前三期：机器学习寓言《背题神童》（过拟合）、经济学寓言《月泉马市》（逆向选择）、《镖路》（道德风险）可放合集互相引流，形成系列账号人设。",
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
      children: [new TextRun({ text: "经济学寓言 · 第四期", size: 18, color: "999999", font: F_BODY })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" })],
    })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/fable4/assets/草洼村_视频文字稿_抖音版.docx", buf);
  console.log("docx 已生成");
});
