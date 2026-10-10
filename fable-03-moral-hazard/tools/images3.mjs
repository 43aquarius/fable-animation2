// images3.mjs — 第三期：晋中水墨淡彩风格的镖路场景插图（竖构图）+ 横版封面底图
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const EP = process.argv[2] || '3';
const OUT = `/home/z/my-project/fable${EP}/assets/images`;

// 每期一个画风流：第三期 = 晋中水墨淡彩 · 青灰夜靛 · 灯火暖金
const STYLE = '，清代晋中水墨淡彩插画风格，青灰砖城墙深靛夜色与暖金灯火点缀，古朴苍润水墨笔意，电影感构图，竖构图，画面中不要出现文字，高质量细节';

const PROMPTS = {
  s01_dusk: '黄昏的清代平遥古城全景，青灰城墙连绵，城内深宅大院与镖局旗幡，街上一支镖车队伍的剪影正出城，灯笼初上火光点点，暮色苍茫',
  s02_convoy: '清晨黄土官道上的镖队，镖车列队前行镖旗飘扬，镖师骑马持刀护卫，铜锣开道，路旁田野远山，晨光明亮',
  s06_crash: '深夜暴雨后的黑山峡谷，一辆镖车翻覆在山涧，木箱碎裂银锭散落沟底，几名镖师举着火把慌乱寻找，湿黑山岩气氛惊惶',
  s08_account: '清代票号账房内景，老东家对着烛火愁坐，案上账册算盘堆积，窗外夜色深重，烛光昏黄压抑',
  s12_peace: '十年后夕阳下的黄土官道，一支镖队从容前行，跟车伙计齐整，远处平遥城郭安详，暖金色暮光洒满道路',
  cover_base: '清代青年掌柜半身像，长衫马褂手执一张新契书，目光清亮坚毅望向观者，背景是暮色中的平遥城墙与镖车灯火',
};

const LAND_PROMPTS = {
  cover_base_land: '黄土高原分岔山路全景，左边是平缓明亮的大官道，右边是幽深险峻的峡谷小道，一支镖队正走在官道上，晨雾山色苍茫，横向宽阔构图',
};
const LAND_STYLE = '，清代晋中水墨淡彩插画风格，青灰山色深靛峡谷与暖金晨光点缀，古朴苍润水墨笔意，电影感构图，横构图，画面中不要出现文字，高质量细节';

const EP_STYLE = {
  3: [STYLE, LAND_STYLE],
};

async function gen(zai, name, prompt, style, size) {
  const file = `${OUT}/${name}.png`;
  if (fs.existsSync(file)) { console.log(`${name}: 已存在，跳过`); return true; }
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 4000));
      const resp = await zai.images.generations.create({ prompt: prompt + style, size });
      const b64 = resp.data?.[0]?.base64;
      if (!b64) throw new Error('empty base64');
      const buf = Buffer.from(b64, 'base64');
      if (buf.length < 30000) throw new Error('image too small: ' + buf.length);
      fs.writeFileSync(file, buf);
      console.log(`${name}: 完成 (${(buf.length / 1024).toFixed(0)}KB)`);
      return true;
    } catch (e) {
      console.error(`${name} 第${attempt}次失败: ${e.message.slice(0, 90)}`);
      await new Promise(r => setTimeout(r, 12000 * attempt));
    }
  }
  console.error(`${name}: 最终失败`);
  return false;
}

async function main() {
  const [style, landStyle] = EP_STYLE[EP] || EP_STYLE[3];
  const prompts = JSON.parse(fs.readFileSync(`/home/z/my-project/fable${EP}/assets/image-prompts.json`, 'utf-8'));
  const zai = await ZAI.create();
  let ok = 0, total = 0;
  for (const [name, prompt] of Object.entries(prompts.portrait)) { total++; if (await gen(zai, name, prompt, style, '768x1344')) ok++; }
  for (const [name, prompt] of Object.entries(prompts.landscape || {})) { total++; if (await gen(zai, name, prompt, landStyle, '1344x768')) ok++; }
  console.log(`\n完成 ${ok}/${total} 张`);
  if (ok < total) process.exit(1);
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
