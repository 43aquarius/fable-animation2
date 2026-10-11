// gen-docx.cjs — 通用抖音文字稿 docx（copywriting 场景规范：Profile B 字体、行距400、无封面目录）
// 用法: node gen-docx.cjs <EP>   读 fable{EP}/assets/docx-config.json + scenes.json 终稿旁白
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, Header, Footer, PageNumber, WidthType,
} = require("docx");
const fs = require("fs");

const EP = process.argv[2];
if (!EP) { console.error("用法: node gen-docx.cjs <EP>"); process.exit(1); }
const BASE = `/home/z/my-project/fable${EP}`;
const CFG = JSON.parse(fs.readFileSync(`${BASE}/assets/docx-config.json`, "utf-8"));
const SCENES = JSON.parse(fs.readFileSync(`${BASE}/assets/scenes.json`, "utf-8")).scenes;

const P = {
  primary: "8A2E1F", secondary: "9B6B4F", accent: "C74336",
  body: "333333", light: "777777", line: "D8C8BE",
  thBg: "F3EBDD", tdBg: "FCF8F1",
};
const F_HEAD = { ascii: "Calibri", eastAsia: "SimHei" };
const F_BODY = { ascii: "Calibri", eastAsia: "Microsoft YaHei" };

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 360, after: 160, line: 400 },
    children: [new TextRun({ text, bold: true, size: 30, color: P.primary, font: F_HEAD })],
  });
}
function marker(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100, line: 380 },
    children: [new TextRun({ text, bold: true, size: 22, color: P.secondary, font: F_HEAD })],
  });
}
function narration(runs) {
  return new Paragraph({
    spacing: { after: 120, line: 400 },
    indent: { firstLine: 480 },
    children: runs.map(r => new TextRun({
      text: r.t, bold: !!r.em, size: 24,
      color: r.em ? P.accent : P.body, font: F_BODY,
    })),
  });
}
function noteP(text) {
  return new Paragraph({
    spacing: { before: 240, line: 360 },
    border: { top: { style: BorderStyle.SINGLE, size: 4, color: P.line, space: 8 } },
    children: [new TextRun({ text, italics: true, size: 20, color: P.light, font: F_BODY })],
  });
}
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };
function makeTable(header, rows, widths) {
  const bd = { style: BorderStyle.SINGLE, size: 2, color: P.line };
  const borders = { top: bd, bottom: bd, left: bd, right: bd };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths.map(w => Math.round(w * 83)),
    rows: [
      new TableRow({
        children: header.map(h => new TableCell({
          margins: cellMargins, borders,
          shading: { fill: P.thBg },
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 22, color: P.primary, font: F_HEAD })] })],
        })),
      }),
      ...rows.map((r, i) => new TableRow({
        children: r.map(c => new TableCell({
          margins: cellMargins, borders,
          shading: { fill: i % 2 ? P.tdBg : "FFFFFF" },
          children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 21, color: P.body, font: F_BODY })] })],
        })),
      })),
    ],
  });
}
function tableTitle(text) {
  return new Paragraph({
    spacing: { before: 160, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: P.secondary, font: F_HEAD })],
  });
}

// 从 scenes.json 生成口播全文（终稿逐字一致）
const scriptSections = [];
let group = null;
for (const s of SCENES) {
  const chapter = CFG.chapters[s.id] || "正文";
  if (!group || group.chapter !== chapter) {
    group = { chapter, items: [] };
    scriptSections.push(group);
  }
  group.items.push({ id: s.id, text: s.narration.replace(/\n/g, " ") });
}

const children = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 80, line: 480, lineRule: "atLeast" },
    children: [new TextRun({ text: `《${CFG.title}》`, bold: true, size: 36, color: P.primary, font: F_HEAD })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60, line: 360 },
    children: [new TextRun({ text: `一个关于「${CFG.concept}」的经济学寓言 · 抖音视频文字稿`, size: 24, color: P.secondary, font: F_BODY })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200, line: 320 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: P.line, space: 8 } },
    children: [new TextRun({ text: `${CFG.specLine}`, size: 20, color: P.secondary, font: F_BODY })],
  }),
];

children.push(sectionHeading("一、口播全文（与视频逐字一致）"));
for (const sec of scriptSections) {
  children.push(marker(`〔${sec.chapter}〕`));
  for (const it of sec.items) children.push(narration([{ t: it.text }]));
}

children.push(sectionHeading("二、概念解释与隐喻对照"));
children.push(narration([{ t: CFG.conceptExplain }]));
children.push(narration([{ t: "本片的全部隐喻与概念的对应关系如下表，发布后可截取为评论区科普素材或下期回顾。" }]));
children.push(tableTitle("表 1 寓言元素与经济学概念对照"));
children.push(makeTable(["故事里", "经济学里", "一句话解释"], CFG.metaphorRows, [30, 34, 36]));

children.push(sectionHeading("三、分镜摘要"));
children.push(tableTitle("表 2 分镜摘要"));
children.push(makeTable(["景", "画面", "剧情要点"], CFG.storyboardRows.map((r, i) => [String(i + 1), r[0], r[1]]), [10, 44, 46]));

children.push(sectionHeading("四、抖音标题方案"));
children.push(tableTitle("表 3 标题备选（均控制在 55 字内，附平台话题标签）"));
children.push(makeTable(["方案", "标题文案"], CFG.titleOptions, [26, 74]));
children.push(marker(`〔发布建议：${CFG.titleAdvice}〕`));

children.push(sectionHeading("五、发布与运营建议"));
for (const t of CFG.opsTips) children.push(narration([{ t }]));

children.push(noteP(`注：视频、封面与全部工程文件已上传至 GitHub 仓库 43aquaris/fable-animation2，成品视频发布于该仓库 Release；本文字稿与视频旁白逐字一致，可直接用于复盘、二创或改编授权说明。`));

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
      children: [new TextRun({ text: `经济学寓言 · 第${EP}期 · 概念当铺`, size: 18, color: "999999", font: F_BODY })],
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "999999" })],
    })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(`${BASE}/assets/${CFG.title}_视频文字稿_抖音版.docx`, buf);
  console.log("docx 已生成:", `${BASE}/assets/${CFG.title}_视频文字稿_抖音版.docx`);
});
