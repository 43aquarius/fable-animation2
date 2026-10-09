// images2.mjs — 第二期：敦煌重彩风格的马市场景插图（竖构图）+ 横版封面底图
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const OUT = '/home/z/my-project/fable2/assets/images';
const STYLE = '，敦煌重彩古风插画风格，赭石土黄土红与石青石绿点缀，大漠黄昏暖色调，苍茫西域丝路古城气息，竖构图，画面中不要出现文字，高质量细节';

const PROMPTS = {
  s01_dusk: '黄昏时分的西域古城，土黄色城墙下连片的马市，长长的拴马木栅栏延伸，稀疏的驼队剪影行走在城门外沙道上，暮色苍凉',
  s02_peak: '盛大的古代西域马市，密密麻麻的骏马拴在长栅栏边，各色商队人群穿行交易，旌旗招展，气氛鼎沸',
  s03_look: '几个买马人围着一批皮毛油亮的骏马仔细打量，精瘦的马贩子在一旁笑容莫测地抚着马鬃，马匹昂首喷气',
  s04_price: '集市木案上摊着铜钱和银锭，买马人与马贩子隔着案相对而坐讨价还价，双方手势僵持',
  s05_leave: '富态的马贩掌柜收摊离场，伙计们牵着几匹神骏高大鬃毛飞扬的好马走出市场大门，掌柜回头望了一眼空荡的市集',
  s06_night: '夜里火把照耀下的马市，几名马贩子神色仓皇地连夜拆栅栏收帐篷，装载货物的骆驼候在一旁',
  s07_lemon: '冷清的马市，栅栏里只拴着几匹瘦骨嶙峋垂头丧气的马，黄沙弥漫，摊位空了大半',
  s08_smart: '一名裹头巾的老练商人背着手皱眉审视栅栏里的瘦马，摇头转身要走，身后几个马贩子表情尴尬',
  s09_empty: '彻底废弃的空马市，成排空栅栏积满沙尘，拴马桩歪斜断裂，残阳如血照在空场上，一片死寂',
  s10_sign: '满脸皱纹坚毅干瘦的西域老妇人站在集市口，身后立着一块高大的崭新木牌，几匹骆驼卧在一旁，暮色低垂',
  s11_queue: '老妇人的马摊前排起长队，各地买家捧着银两耐心等候，摊前几匹毛色发亮的骏马昂首而立',
  s12_alive: '重现生机的马市，新栅栏新招牌立起，买家与马贩当面在契书上按手印，牙人举着木牌作保，人群熙攘',
  cover_base: '干瘦坚毅的西域老妇人半身像，头巾与粗布斗篷，目光锐利望向观者，身后的黄昏马市里立着一块木牌，远处空栅栏与沙丘',
};

// 横版封面底图（用于 1920x1080 横屏封面）
const LAND_PROMPTS = {
  cover_base_land: '黄昏西域古城马市全景，连排空栅栏与拴马桩延伸向远方，集市口立着一块醒目木牌，一位老妇人与骆驼的剪影立在牌旁，苍茫暮色，横向宽阔构图',
};
const LAND_STYLE = '，敦煌重彩古风插画风格，赭石土黄土红与石青石绿点缀，大漠黄昏暖色调，苍茫西域丝路古城气息，横构图，画面中不要出现文字，高质量细节';

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
  const zai = await ZAI.create();
  let ok = 0, total = 0;
  for (const [name, prompt] of Object.entries(PROMPTS)) { total++; if (await gen(zai, name, prompt, STYLE, '768x1344')) ok++; }
  for (const [name, prompt] of Object.entries(LAND_PROMPTS)) { total++; if (await gen(zai, name, prompt, LAND_STYLE, '1344x768')) ok++; }
  console.log(`\n完成 ${ok}/${total} 张`);
  if (ok < total) process.exit(1);
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
