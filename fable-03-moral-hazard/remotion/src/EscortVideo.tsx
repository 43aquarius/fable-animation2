import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
} from 'remotion';
import './fonts';
import timeline from './timeline.json';

// ============ 调色板：夜靛青 · 灯火金 · 朱砂（晋商镖路） ============
const C = {
  ink: '#0D0F14',
  inkSoft: '#14161D',
  paper: '#EFE7D5',
  paperDim: 'rgba(239,231,213,0.72)',
  red: '#B33A2E',
  redBright: '#E86A54',
  gold: '#D9A653',
  goldBright: '#F5C876',
  steel: '#7E97B8',
  gray: '#9B948A',
  chipBg: 'rgba(20,22,29,0.94)',
  chipBorder: '#5E5648',
};

const SERIF = "'SC', 'Noto Serif SC', serif";
const SANS = "'SANS', 'Noto Sans SC', sans-serif";

type Caption = { text: string; start: number; duration: number };
type Scene = {
  id: string;
  type: string;
  image: string | null;
  narration: string;
  emphasis: string[];
  start: number;
  duration: number;
  audioFrames: number;
  captions: Caption[];
};

// ============ 工具 ============
const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

// 强调色：下行/出事期(s01,s04-s09,s13)用朱砂，转机与概念期(s10-s12,s15-s18)用灯火金
const GOLD_SCENES = new Set(['s10', 's11', 's12', 's15', 's17', 's18']);

function emphColor(sceneId: string) {
  return GOLD_SCENES.has(sceneId) ? C.goldBright : C.redBright;
}

function renderEmphasis(text: string, emphasis: string[], color: string) {
  const pieces: { t: string; em: boolean }[] = [{ t: text, em: false }];
  for (const w of emphasis) {
    if (!w) continue;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      if (p.em || !p.t.includes(w)) continue;
      const parts = p.t.split(w);
      const rep: { t: string; em: boolean }[] = [];
      for (let j = 0; j < parts.length; j++) {
        if (parts[j]) rep.push({ t: parts[j], em: false });
        if (j < parts.length - 1) rep.push({ t: w, em: true });
      }
      pieces.splice(i, 1, ...rep);
    }
  }
  return pieces.map((p, i) => (
    <span key={i} style={p.em ? { color, fontWeight: 900 } : undefined}>
      {p.t}
    </span>
  ));
}

// ============ 字幕 ============
const CaptionView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  if (scene.id === 's13' && frame >= 470 && frame < 546) return null;
  const cap = scene.captions.find((c) => frame >= c.start && frame < c.start + c.duration);
  if (!cap) return null;
  const prog = frame - cap.start;
  const opacity = interpolate(prog, [0, 3, cap.duration - 4, cap.duration], [0, 1, 1, 0], clamp);
  const y = interpolate(spring({ frame: prog, fps: 30, config: { damping: 100 } }), [0, 1], [14, 0]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 1302,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          transform: `translateY(${y}px)`,
          fontSize: 58,
          fontFamily: SERIF,
          fontWeight: 600,
          color: C.paper,
          letterSpacing: 2,
          textShadow: '0 3px 16px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)',
        }}
      >
        {renderEmphasis(cap.text, scene.emphasis, emphColor(scene.id))}
      </div>
    </div>
  );
};

// ============ 顶部水印（系列标识） ============
const Watermark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: 188,
      width: '100%',
      textAlign: 'center',
      fontFamily: SANS,
      fontSize: 23,
      letterSpacing: 9,
      color: 'rgba(239,231,213,0.42)',
      textShadow: '0 1px 8px rgba(0,0,0,0.65)',
    }}
  >
    经济学寓言 · 叁
  </div>
);

// ============ s01 开场大标题（前 4 秒抖音钩子） ============
const HookTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [4, 14, 106, 122], [0, 1, 1, 0], clamp);
  const y = interpolate(frame, [4, 22], [34, 0], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        top: 316,
        width: '100%',
        textAlign: 'center',
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 96,
          color: C.paper,
          lineHeight: 1.3,
          textShadow: '0 6px 30px rgba(0,0,0,0.85)',
        }}
      >
        杀镖的
        <br />
        <span style={{ color: C.redBright }}>不是山匪</span>
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: SANS,
          fontSize: 29,
          letterSpacing: 11,
          color: 'rgba(239,231,213,0.72)',
        }}
      >
        经济学寓言 · 第三集
      </div>
    </div>
  );
};

// ============ 水墨场景（图像 + Ken Burns + 字幕） ============
const ImageScene: React.FC<{ scene: Scene; idx: number }> = ({ scene, idx }) => {
  const frame = useCurrentFrame();
  const zoomIn = idx % 2 === 0;
  const scale = interpolate(frame, [0, scene.duration], zoomIn ? [1.06, 1.16] : [1.16, 1.06]);
  const fadeIn = interpolate(frame, [0, 6], [0, 1], clamp);
  const fadeOut = interpolate(frame, [scene.duration - 6, scene.duration], [1, 0], clamp);
  const opacity = Math.min(fadeIn, fadeOut);
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill>
        <Img
          src={staticFile(`images/${scene.image}.png`)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(to bottom, rgba(13,15,20,0.30) 0%, rgba(13,15,20,0.02) 20%, rgba(13,15,20,0) 42%, rgba(13,15,20,0.55) 62%, rgba(13,15,20,0.92) 80%, #0D0F14 100%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.46) 100%)',
        }}
      />
      {scene.id === 's01' && <HookTitle />}
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 合约卡场景（s03 旧合约 / s10 新合约） ============
const Clause: React.FC<{
  at: number; mark: string; text: string; tone: 'gold' | 'red' | 'plain'; note?: string;
}> = ({ at, mark, text, tone, note }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - at, fps: 30, config: { damping: 100 } });
  const op = interpolate(frame, [at, at + 10], [0, 1], clamp);
  const y = interpolate(s, [0, 1], [36, 0]);
  if (frame < at) return null;
  const markColor = tone === 'gold' ? C.goldBright : tone === 'red' ? C.redBright : C.paperDim;
  return (
    <div
      style={{
        opacity: op,
        transform: `translateY(${y}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 26,
        padding: '22px 30px',
        background: 'rgba(20,22,29,0.92)',
        border: `2.5px solid ${tone === 'gold' ? C.gold : tone === 'red' ? C.red : '#3A3F4C'}`,
        borderRadius: 14,
        boxShadow: tone === 'red' ? '0 0 34px rgba(179,58,46,0.25)' : 'none',
      }}
    >
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 34, color: markColor, whiteSpace: 'nowrap' }}>
        {mark}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 36, color: C.paper, lineHeight: 1.4 }}>
          {text}
        </div>
        {note && (
          <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 24, color: 'rgba(239,231,213,0.6)' }}>
            {note}
          </div>
        )}
      </div>
    </div>
  );
};

const ContractScene: React.FC<{ scene: Scene; mode: 'old' | 'new' }> = ({ scene, mode }) => {
  const frame = useCurrentFrame();
  const isNew = mode === 'new';
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const cardIn = spring({ frame: frame - 14, fps: 30, config: { damping: 14, stiffness: 90 } });
  const cardScale = interpolate(cardIn, [0, 1], [0.92, 1]);
  // 新合约：深夜氛围 + 结尾“稳”字氛围
  const nightDim = isNew ? interpolate(frame, [470, 560], [0, 0.5], clamp) : 0;
  const finalOp = isNew ? interpolate(frame, [640, 672], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 30%, rgba(217,166,83,${isNew ? 0.16 : 0.1}) 0%, rgba(20,22,29,0) 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [8, 22], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        {isNew ? '永丰号 · 新镖约' : '永丰号 · 镖约'}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 420,
          left: 90,
          right: 90,
          display: 'flex',
          flexDirection: 'column',
          gap: 26,
          transform: `scale(${cardScale})`,
        }}
      >
        {isNew ? (
          <>
            <Clause at={120} mark="第一条" text="平安准点 · 加赏二两" tone="gold" note="稳稳当当送到，多给二两银子" />
            <Clause at={240} mark="第二条" text="路上丢一箱 · 赔十倍" tone="red" note="翻车的窟窿，镖局自己认" />
          </>
        ) : (
          <>
            <Clause at={60} mark="第 一 条" text="平安送到 · 银三两" tone="plain" note="按趟结钱，快慢一个价" />
            <Clause at={210} mark="第 二 条" text="怎么走 · 几点歇 · 带几人" tone="plain" note="镖局自己掂量" />
            <Clause at={400} mark="东家只问" text="到了没有" tone="plain" note="山里夜里的事，看不见" />
          </>
        )}
      </div>
      {/* 旧合约：结尾“看不见”暗幕 */}
      {!isNew && (
        <div
          style={{
            position: 'absolute',
            top: 1080,
            width: '100%',
            textAlign: 'center',
            opacity: interpolate(frame, [445, 475, 490, 500], [0, 1, 1, 0], clamp),
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 64,
            color: 'rgba(239,231,213,0.9)',
            textShadow: '0 4px 26px rgba(0,0,0,0.8)',
          }}
        >
          看不见
        </div>
      )}
      {/* 新合约：满城笑话气泡 */}
      {isNew && (
        <div
          style={{
            position: 'absolute',
            top: 1030,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            opacity: interpolate(frame, [350, 380, 460, 486], [0, 1, 1, 0], clamp),
          }}
        >
          <div
            style={{
              background: 'rgba(20,22,29,0.94)',
              border: `2px solid ${C.chipBorder}`,
              borderRadius: 999,
              padding: '16px 36px',
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 34,
              color: C.paperDim,
            }}
          >
            满城都笑：这不是白送镖局银子吗
          </div>
        </div>
      )}
      {/* 新合约：夜色 + “不是快，是稳” */}
      {isNew && (
        <>
          <AbsoluteFill style={{ background: '#07080C', opacity: nightDim }} />
          <div
            style={{
              position: 'absolute',
              top: 560,
              width: '100%',
              textAlign: 'center',
              opacity: finalOp,
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 84,
              color: C.goldBright,
              textShadow: '0 6px 40px rgba(0,0,0,0.9)',
            }}
          >
            算的不是快
            <div style={{ marginTop: 18, fontSize: 96, color: C.paper }}>是稳</div>
          </div>
        </>
      )}
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 商路地图（s04 选险路 / s11 换回官道） ============
// 地图：起点(左) → 终点(右)。上路=官道（平缓，钢蓝），下路=黑风峪（陡折，朱砂）
const PATH_SAFE = 'M 90 640 C 300 600, 480 560, 990 540';
const PATH_RISK = 'M 90 640 C 260 760, 560 900, 990 540';

const RouteMapScene: React.FC<{ scene: Scene; mode: 'choose' | 'change' }> = ({ scene, mode }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const choose = mode === 'choose';

  // s04 时机：官道 180f，黑风峪 250f，+四趟 320f，镖车走上险路 360f
  // s11 时机：官道金光 30f，黑风峪熄灭 60f，伙计 4→8 140f，夜路停 280f，金句 430f
  const safeHot = choose ? interpolate(frame, [180, 205], [0, 1], clamp) * interpolate(frame, [350, 380], [1, 0.35], clamp) : interpolate(frame, [30, 60], [0, 1], clamp);
  const riskHot = choose ? interpolate(frame, [250, 275], [0, 1], clamp) : interpolate(frame, [30, 60], [1, 0], clamp);
  const truckT = choose
    ? interpolate(frame, [360, 460], [0, 1], clamp)
    : interpolate(frame, [60, 170], [0, 1], clamp);

  // 镖车在路径上的位置（choose: 险路；change: 官道）
  const pathPos = (t: number) => {
    // 贝塞尔近似取点
    const p0 = { x: 90, y: 640 };
    const c1 = choose ? { x: 260, y: 760 } : { x: 300, y: 600 };
    const c2 = choose ? { x: 560, y: 900 } : { x: 480, y: 560 };
    const p3 = { x: 990, y: 540 };
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
    };
  };
  const truck = pathPos(truckT);

  // s11: 伙计计数 4 → 8
  const crewN = choose ? 4 : Math.min(8, 4 + Math.floor(interpolate(frame, [140, 200], [0, 4], clamp)));
  const crewShow = !choose && frame > 100;

  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(126,151,184,0.10) 0%, rgba(20,22,29,0) 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 290,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [10, 26], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        {choose ? '镖头的地图' : '第二天'}
      </div>

      {/* 地图画布 */}
      <svg width={1080} height={1000} style={{ position: 'absolute', top: 340, left: 0 }}>
        {/* 底纹山影 */}
        <path d="M 0 980 Q 200 830 400 900 T 760 850 T 1080 920 L 1080 1000 L 0 1000 Z" fill="rgba(126,151,184,0.08)" />
        <path d="M 0 960 Q 300 880 540 930 T 1080 890" fill="none" stroke="rgba(239,231,213,0.10)" strokeWidth={2} />
        {/* 官道 */}
        <path d={PATH_SAFE} fill="none" stroke={`rgba(126,151,184,${0.35 + 0.6 * safeHot})`} strokeWidth={14} strokeLinecap="round" />
        {/* 黑风峪 */}
        <path d={PATH_RISK} fill="none" stroke={`rgba(232,106,84,${choose ? 0.3 + 0.55 * riskHot : 0.22})`} strokeWidth={14} strokeLinecap="round" strokeDasharray={choose ? undefined : '26 20'} />
        {/* 走过的进度光 */}
        {!choose && (
          <path
            d={PATH_SAFE}
            fill="none"
            stroke={C.goldBright}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray="1600"
            strokeDashoffset={1600 - 1600 * truckT}
            opacity={0.9}
          />
        )}
        {choose && truckT > 0.02 && (
          <path
            d={PATH_RISK}
            fill="none"
            stroke={C.redBright}
            strokeWidth={16}
            strokeLinecap="round"
            strokeDasharray="1700"
            strokeDashoffset={1700 - 1700 * truckT}
            opacity={0.85}
          />
        )}
        {/* 起终点 */}
        <circle cx={90} cy={640} r={16} fill={C.goldBright} />
        <circle cx={990} cy={540} r={16} fill={C.paper} />
      </svg>

      {/* 地名标签 */}
      <div style={{ position: 'absolute', top: 905, left: 60, fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paperDim }}>
        平遥
      </div>
      <div style={{ position: 'absolute', top: 812, left: 950, fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paperDim }}>
        扬州
      </div>

      {/* 官道标签 */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: 330,
          opacity: safeHot,
          background: 'rgba(20,22,29,0.94)',
          border: `2.5px solid rgba(126,151,184,${0.4 + 0.6 * safeHot})`,
          borderRadius: 12,
          padding: '12px 24px',
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 34,
          color: C.steel,
        }}
      >
        官道 · 七天
        {choose && safeHot > 0.5 && (
          <span style={{ marginLeft: 14, fontSize: 26, color: 'rgba(239,231,213,0.5)' }}>太平</span>
        )}
      </div>
      {/* 黑风峪标签 */}
      <div
        style={{
          position: 'absolute',
          top: 1105,
          left: 330,
          opacity: Math.max(choose ? riskHot : interpolate(frame, [0, 60], [1, 0.45], clamp), 0.45),
          background: 'rgba(20,22,29,0.94)',
          border: `2.5px solid rgba(179,58,46,${choose ? 0.4 + 0.6 * riskHot : 0.3})`,
          borderRadius: 12,
          padding: '12px 24px',
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 34,
          color: C.redBright,
          textDecoration: choose ? 'none' : 'line-through',
        }}
      >
        黑风峪 · 三天
        {choose && riskHot > 0.5 && (
          <span style={{ marginLeft: 14, fontSize: 26, color: 'rgba(239,231,213,0.5)' }}>险</span>
        )}
      </div>

      {/* s04：一年四趟收益 chip */}
      {choose && (
        <div
          style={{
            position: 'absolute',
            top: 1180,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            opacity: interpolate(frame, [320, 348, 452, 480], [0, 1, 1, 0], clamp),
          }}
        >
          <div
            style={{
              background: 'rgba(217,166,83,0.12)',
              border: `1.5px solid ${C.gold}`,
              borderRadius: 999,
              padding: '12px 34px',
              fontFamily: SANS,
              fontSize: 30,
              letterSpacing: 2,
              color: C.goldBright,
            }}
          >
            一年多走四趟 · 趟趟白花花的银子
          </div>
        </div>
      )}

      {/* s11：伙计恢复 + 夜路停 */}
      {crewShow && (
        <div
          style={{
            position: 'absolute',
            top: 1150,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <div
            style={{
              opacity: interpolate(frame, [110, 135], [0, 1], clamp),
              background: 'rgba(20,22,29,0.94)',
              border: `2.5px solid ${C.gold}`,
              borderRadius: 14,
              padding: '16px 30px',
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 36,
              color: C.paper,
            }}
          >
            跟车伙计
            <span style={{ color: C.goldBright, fontSize: 44, margin: '0 16px' }}>
              4 → {crewN}
            </span>
            一个不许减
          </div>
          <div
            style={{
              opacity: interpolate(frame, [280, 308, 400, 430], [0, 1, 1, 0], clamp),
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 34,
              color: C.paperDim,
              textDecoration: 'line-through',
              textDecorationColor: C.redBright,
            }}
          >
            夜路 · 停了
          </div>
        </div>
      )}

      {/* s11 结尾金句 */}
      {!choose && (
        <div
          style={{
            position: 'absolute',
            top: 430,
            width: '100%',
            textAlign: 'center',
            opacity: interpolate(frame, [430, 462, 540, 570], [0, 1, 1, 0], clamp),
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 62,
            color: C.paper,
            textShadow: '0 5px 30px rgba(0,0,0,0.8)',
          }}
        >
          人还是那个人
          <div style={{ marginTop: 14, fontSize: 68, color: C.goldBright }}>路，换了</div>
        </div>
      )}

      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 省钱账（s05：三笔账 → 银子进镖局柜） ============
const LedgerScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const rows = [
    { at: 75, label: '跟车伙计', from: '八个', to: '四个', gain: '省一半工钱' },
    { at: 180, label: '骡马', from: '壮骡', to: '瘦骡', gain: '省三成草料' },
    { at: 285, label: '夜行', from: '宿镇', to: '不宿', gain: '省下店钱' },
  ];
  // 银子流向镖局柜：400f 起
  const coinT = interpolate(frame, [400, 470], [0, 1], clamp);
  const boxFill = coinT;
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{ background: 'radial-gradient(circle at 50% 34%, rgba(217,166,83,0.10) 0%, rgba(20,22,29,0) 58%)' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [10, 24], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        账房里，省下的每一笔
      </div>
      <div style={{ position: 'absolute', top: 430, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 30 }}>
        {rows.map((r, i) => {
          const s = spring({ frame: frame - r.at, fps: 30, config: { damping: 100 } });
          const op = interpolate(frame, [r.at, r.at + 10], [0, 1], clamp);
          const x = interpolate(s, [0, 1], [-40, 0]);
          if (frame < r.at) return null;
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateX(${x}px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(20,22,29,0.92)',
                border: '2.5px solid #3A3F4C',
                borderRadius: 14,
                padding: '24px 32px',
              }}
            >
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 38, color: C.paper, minWidth: 190 }}>
                {r.label}
              </div>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, color: C.paperDim }}>
                <span style={{ textDecoration: 'line-through', textDecorationColor: 'rgba(232,106,84,0.8)' }}>{r.from}</span>
                <span style={{ color: C.redBright, margin: '0 12px' }}>→</span>
                <span style={{ color: C.paper, fontWeight: 900 }}>{r.to}</span>
              </div>
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.goldBright, whiteSpace: 'nowrap' }}>{r.gain}</div>
            </div>
          );
        })}
      </div>

      {/* 银子流进镖局的柜 */}
      <div
        style={{
          position: 'absolute',
          top: 1120,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 40,
          opacity: interpolate(frame, [395, 425], [0, 1], clamp),
        }}
      >
        {/* 银锭 */}
        {[0, 1, 2].map((i) => {
          const t = Math.max(0, Math.min(1, coinT * 1.4 - i * 0.18));
          const y = interpolate(t, [0, 1], [-90, 0]);
          return (
            <div
              key={i}
              style={{
                width: 64,
                height: 40,
                borderRadius: 18,
                background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.gold} 70%)`,
                transform: `translateY(${y}px)`,
                opacity: coinT > 0 ? 1 : 0.4,
                boxShadow: '0 4px 18px rgba(217,166,83,0.4)',
              }}
            />
          );
        })}
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 54, color: C.goldBright }}>→</div>
        {/* 钱柜 */}
        <div
          style={{
            width: 260,
            height: 150,
            borderRadius: 16,
            border: `3px solid ${C.gold}`,
            background: `linear-gradient(180deg, rgba(217,166,83,${0.05 + 0.3 * boxFill}) 0%, rgba(217,166,83,0.02) 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: boxFill > 0.5 ? '0 0 46px rgba(217,166,83,0.35)' : 'none',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: C.paper, letterSpacing: 6 }}>镖局</div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1310,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [430, 458, 490, 503], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 48,
          color: C.goldBright,
        }}
      >
        一文不剩，全进了镖局的柜
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 风险算术（s07：十趟丢一趟，赔的追不回省的） ============
const RiskMathScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  // 十趟镖：30f 起逐个出现；第 7 趟在 230f 变红（出事）
  const trips = Array.from({ length: 10 }, (_, i) => i);
  const lostIdx = 6;
  const barIn = interpolate(frame, [280, 330], [0, 1], clamp);
  const stampS = spring({ frame: frame - 345, fps: 30, config: { damping: 13, stiffness: 130 } });
  const stampScale = interpolate(stampS, [0, 1], [2.2, 1]);
  const stampOp = interpolate(frame, [345, 353], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 30%, rgba(179,58,46,${interpolate(frame, [230, 280], [0, 0.12], clamp)}) 0%, rgba(20,22,29,0) 58%)` }}
      />
      <div
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [10, 24], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        赵镖头夜里算的账
      </div>

      {/* 十趟镖 */}
      <div
        style={{
          position: 'absolute',
          top: 460,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 22,
        }}
      >
        {trips.map((i) => {
          const ap = interpolate(frame, [30 + i * 14, 44 + i * 14], [0, 1], clamp);
          const isLost = i === lostIdx && frame >= 230;
          const lostPulse = isLost ? 1 + Math.sin(Math.max(0, frame - 230) * 0.5) * 0.05 : 1;
          return (
            <div
              key={i}
              style={{
                width: 66,
                height: 66,
                borderRadius: 14,
                opacity: ap,
                background: isLost ? 'rgba(179,58,46,0.28)' : 'rgba(20,22,29,0.94)',
                border: `2.5px solid ${isLost ? C.red : '#3A3F4C'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 34,
                color: isLost ? C.redBright : 'rgba(239,231,213,0.72)',
                transform: `scale(${lostPulse})`,
                boxShadow: isLost ? '0 0 30px rgba(179,58,46,0.4)' : 'none',
              }}
            >
              {isLost ? '失' : '镖'}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 556,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [235, 260], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 32,
          color: C.redBright,
        }}
      >
        十趟里丢一趟
      </div>

      {/* 两根对比条 */}
      <div style={{ position: 'absolute', top: 680, left: 110, right: 110, display: 'flex', flexDirection: 'column', gap: 46 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paper, marginBottom: 14 }}>
            <span>省出来的 · 十趟</span>
            <span style={{ color: C.goldBright }}>一百三十两</span>
          </div>
          <div style={{ height: 42, borderRadius: 21, background: 'rgba(20,22,29,0.94)', border: '2px solid #3A3F4C', overflow: 'hidden' }}>
            <div style={{ width: `${86 * barIn}%`, height: '100%', background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright})`, borderRadius: 21 }} />
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paper, marginBottom: 14 }}>
            <span>赔出去的 · 一趟</span>
            <span style={{ color: C.redBright }}>五十两</span>
          </div>
          <div style={{ height: 42, borderRadius: 21, background: 'rgba(20,22,29,0.94)', border: '2px solid #3A3F4C', overflow: 'hidden' }}>
            <div style={{ width: `${33 * barIn}%`, height: '100%', background: `linear-gradient(90deg, ${C.red}, ${C.redBright})`, borderRadius: 21 }} />
          </div>
        </div>
      </div>

      {/* 净赚印章 */}
      <div
        style={{
          position: 'absolute',
          top: 1080,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: stampOp,
        }}
      >
        <div
          style={{
            transform: `scale(${stampScale}) rotate(-4deg)`,
            background: C.red,
            borderRadius: 18,
            padding: '22px 44px',
            boxShadow: '0 18px 70px rgba(179,58,46,0.45)',
          }}
        >
          <span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: '#F7EFDE', letterSpacing: 10 }}>
            这趟，净赚
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1240,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [375, 400, 428, 442], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 44,
          color: C.paperDim,
        }}
      >
        镖，接着走
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 利险分裂（s09：少东家的两句话） ============
const SplitScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const q1Op = interpolate(frame, [195, 220, 290, 312], [0, 1, 1, 0], clamp);
  const q2Op = interpolate(frame, [300, 325, 360, 380], [0, 1, 1, 0], clamp);
  // 答案：375f 起
  const ansIn = interpolate(frame, [375, 405], [0, 1], clamp);
  const bigOp = interpolate(frame, [500, 532, 590, 612], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: '#0B0D12', opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 34%, rgba(217,166,83,0.13) 0%, rgba(11,13,18,0) 60%)' }} />
      <div
        style={{
          position: 'absolute',
          top: 330,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [10, 24], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        天亮，只问两句
      </div>

      {/* 两个问题 */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          width: '100%',
          textAlign: 'center',
          opacity: q1Op,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 54,
          color: C.paper,
          textShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}
      >
        快省下的银子，归谁？
      </div>
      <div
        style={{
          position: 'absolute',
          top: 580,
          width: '100%',
          textAlign: 'center',
          opacity: q2Op,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 54,
          color: C.paper,
          textShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}
      >
        翻车的窟窿，归谁？
      </div>

      {/* 答案：一分为二 */}
      <div
        style={{
          position: 'absolute',
          top: 750,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
          opacity: ansIn,
        }}
      >
        <div
          style={{
            padding: '30px 44px',
            borderRadius: 18,
            background: 'rgba(217,166,83,0.12)',
            border: `3px solid ${C.gold}`,
            boxShadow: '0 0 44px rgba(217,166,83,0.22)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: C.goldBright }}>省的</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: C.paper }}>归镖局</div>
        </div>
        <div
          style={{
            padding: '30px 44px',
            borderRadius: 18,
            background: 'rgba(179,58,46,0.12)',
            border: `3px solid ${C.red}`,
            boxShadow: '0 0 44px rgba(179,58,46,0.22)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: C.redBright }}>赔的</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 700, fontSize: 44, color: C.paper }}>归票号</div>
        </div>
      </div>

      {/* 中分线 */}
      <div
        style={{
          position: 'absolute',
          top: 960,
          left: 210,
          width: 660,
          height: 5,
          background: `linear-gradient(90deg, ${C.gold} 0%, rgba(239,231,213,0.25) 50%, ${C.red} 100%)`,
          borderRadius: 3,
          opacity: ansIn,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 990,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [405, 430, 470, 492], [0, 1, 1, 0], clamp),
          fontFamily: SANS,
          fontSize: 28,
          letterSpacing: 6,
          color: 'rgba(239,231,213,0.55)',
        }}
      >
        利益与风险 · 劈成两半
      </div>

      {/* 大字 */}
      <div
        style={{
          position: 'absolute',
          top: 1090,
          width: '100%',
          textAlign: 'center',
          opacity: bigOp,
        }}
      >
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 74, color: C.goldBright }}>
          利，是他的
        </div>
        <div style={{ marginTop: 16, fontFamily: SERIF, fontWeight: 900, fontSize: 74, color: C.redBright }}>
          险，是我的
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 真实素材场景（s13：照片卡 + 来源标注 + Ken Burns） ============
const RealPhoto: React.FC<{
  src: string; label: string; source: string; from: number; to: number; idx: number;
}> = ({ src, label, source, from, to, idx }) => {
  const frame = useCurrentFrame();
  const visible = frame >= from && frame < to;
  if (!visible) return null;
  const prog = frame - from;
  const life = to - from;
  const op = interpolate(prog, [0, 10, life - 10, life], [0, 1, 1, 0], clamp);
  const zoom = interpolate(prog, [0, life], idx % 2 === 0 ? [1.02, 1.12] : [1.12, 1.02]);
  const s = spring({ frame: prog, fps: 30, config: { damping: 100 } });
  const y = interpolate(s, [0, 1], [30, 0]);
  return (
    <AbsoluteFill style={{ opacity: op }}>
      {/* 模糊填充底 */}
      <Img
        src={staticFile(src)}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(38px) brightness(0.32) saturate(0.7)',
          transform: 'scale(1.25)',
        }}
      />
      <AbsoluteFill style={{ background: 'rgba(11,13,18,0.45)' }} />
      {/* 照片卡（竖构图全幅，横构图卡片） */}
      <div
        style={{
          position: 'absolute',
          top: idx === 0 ? 0 : 190,
          width: '100%',
          height: idx === 0 ? '100%' : 1070,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${idx === 0 ? 0 : y}px)`,
        }}
      >
        <div
          style={{
            width: idx === 0 ? '100%' : 920,
            height: idx === 0 ? '100%' : 690,
            overflow: 'hidden',
            borderRadius: idx === 0 ? 0 : 22,
            boxShadow: '0 30px 110px rgba(0,0,0,0.85)',
            border: idx === 0 ? 'none' : '1px solid rgba(239,231,213,0.18)',
          }}
        >
          <Img
            src={staticFile(src)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: `scale(${zoom})`,
            }}
          />
        </div>
      </div>
      {/* 标签 + 来源 */}
      <div
        style={{
          position: 'absolute',
          top: idx === 0 ? 908 : 900,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            background: 'rgba(11,13,18,0.86)',
            border: `2px solid ${C.gold}`,
            borderRadius: 999,
            padding: '14px 34px',
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 38,
            color: C.goldBright,
            textShadow: '0 2px 14px rgba(0,0,0,0.8)',
          }}
        >
          {label}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: 3, color: 'rgba(239,231,213,0.62)' }}>
          {source}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const RealScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: '#0B0D12', opacity: fadeIn }}>
      <RealPhoto src="real/real_scratch.jpg" label="全保的车 · 剐蹭还心疼吗" source="真实照片 · 车损现场" from={0} to={270} idx={0} />
      <RealPhoto src="real/real_lehman_box.jpg" label="零八年 · 华尔街捅娄子" source="真实照片 · 2008 金融危机 华尔街" from={270} to={405} idx={1} />
      <RealPhoto src="real/real_lehman_sign.jpg" label="最后谁买单" source="真实照片 · 雷曼兄弟 2008 年倒闭" from={405} to={546} idx={2} />
      {/* 结尾大字（每一个都是黑风峪） */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [470, 500, 540, 561], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 78,
          color: C.paper,
          textShadow: '0 6px 40px rgba(0,0,0,0.95)',
          zIndex: 5,
        }}
      >
        每一个
        <div style={{ marginTop: 14, color: C.redBright }}>都是黑风峪</div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s14 概念揭晓印章：道德风险 ============
const StampScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const stampAt = 128; // “叫道德风险”发音时刻
  const leadOp = interpolate(frame, [0, 8], [0, 1], clamp);
  const leadFade = interpolate(frame, [stampAt - 6, stampAt + 4], [1, 0.28], clamp);
  const s = spring({ frame: frame - stampAt, fps: 30, config: { damping: 13, stiffness: 130, mass: 0.9 } });
  const scale = interpolate(s, [0, 1], [2.8, 1]);
  const stOp = frame >= stampAt ? Math.min(1, (frame - stampAt) / 4) : 0;
  const shake =
    frame > stampAt && frame < stampAt + 16
      ? Math.sin((frame - stampAt) * 2.3) * (16 - (frame - stampAt)) * 0.55
      : 0;
  const subOp = interpolate(frame, [stampAt + 12, stampAt + 28], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: '#0A0B0F' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(179,58,46,${interpolate(
            frame,
            [stampAt, stampAt + 20],
            [0, 0.16],
            clamp
          )}) 0%, rgba(10,11,15,0) 55%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 560,
          width: '100%',
          textAlign: 'center',
          opacity: leadOp * leadFade,
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 44,
          color: 'rgba(239,231,213,0.88)',
        }}
      >
        这个藏在合同背后的病
        <br />
        经济学里有个名字
      </div>
      {frame >= stampAt && (
        <div
          style={{
            position: 'absolute',
            top: 742,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              transform: `scale(${scale}) rotate(${shake * 0.18 - 2}deg) translateX(${shake}px)`,
              opacity: stOp,
              background: C.red,
              borderRadius: 20,
              padding: '30px 40px',
              boxShadow: '0 22px 90px rgba(179,58,46,0.5), inset 0 0 60px rgba(0,0,0,0.18)',
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 148,
                color: '#F7EFDE',
                letterSpacing: 14,
                lineHeight: 1,
                paddingRight: 6,
              }}
            >
              道德风险
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: 1128,
          width: '100%',
          textAlign: 'center',
          opacity: subOp,
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 12, color: 'rgba(239,231,213,0.55)' }}>
          MORAL HAZARD
        </div>
        <div style={{ marginTop: 16, fontFamily: SERIF, fontSize: 27, letterSpacing: 5, color: C.gold }}>
          信息经济学 · 2001年诺贝尔经济学奖
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============ 对照行组件 ============
const Chip: React.FC<{ text: string; kind: 'story' | 'econ'; small?: boolean }> = ({ text, kind, small }) => {
  const isStory = kind === 'story';
  return (
    <div
      style={{
        background: isStory ? C.chipBg : 'rgba(217,166,83,0.14)',
        border: `2.5px solid ${isStory ? C.chipBorder : C.gold}`,
        borderRadius: 14,
        padding: small ? '12px 22px' : '16px 28px',
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: small ? 32 : 40,
        color: isStory ? C.paper : C.goldBright,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

const MapRow: React.FC<{ left: string; right: string; at: number; small?: boolean }> = ({ left, right, at, small }) => {
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - at, fps: 30, config: { damping: 100 } });
  const op = interpolate(frame, [at, at + 9], [0, 1], clamp);
  const y = interpolate(s, [0, 1], [40, 0]);
  if (frame < at) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        opacity: op,
        transform: `translateY(${y}px)`,
      }}
    >
      <Chip text={left} kind="story" small={small} />
      <div style={{ fontSize: 40, color: C.goldBright, fontFamily: SANS, fontWeight: 700 }}>→</div>
      <Chip text={right} kind="econ" small={small} />
    </div>
  );
};

// ============ s15 概念对照表 ============
const Map1Scene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const titleOp = interpolate(frame, [10, 24], [0, 1], clamp);
  const punchOp = interpolate(frame, [480, 508, 560, 585], [0, 1, 1, 0], clamp);
  const rows: [string, string][] = [
    ['镖路上的选择', '隐藏行动'],
    ['按趟结钱', '固定报酬'],
    ['省归镖局 · 赔归票号', '激励错位'],
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{ background: 'radial-gradient(circle at 50% 18%, rgba(217,166,83,0.09) 0%, rgba(20,22,29,0) 55%)' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 330,
          width: '100%',
          textAlign: 'center',
          opacity: titleOp,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        寓 言 <span style={{ color: C.goldBright }}>→</span> 经济学
      </div>
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 560 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ position: 'absolute', top: i * 178, width: '100%', height: 90 }}>
            <MapRow left={r[0]} right={r[1]} at={60 + i * 95} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1080,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: punchOp,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 56,
            color: C.paper,
            textShadow: '0 4px 26px rgba(0,0,0,0.7)',
          }}
        >
          合同怎么写，<span style={{ color: C.goldBright }}>人就怎么活</span>
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s16 两兄弟与三味药 ============
const RemediesScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const bro = (at: number, title: string, sub: string, concept: string, tone: 'steel' | 'red') => {
    const op = interpolate(frame, [at, at + 12], [0, 1], clamp);
    const y = interpolate(spring({ frame: frame - at, fps: 30, config: { damping: 100 } }), [0, 1], [30, 0]);
    const active = tone === 'red';
    return (
      <div
        style={{
          opacity: op,
          transform: `translateY(${y}px)`,
          flex: 1,
          padding: '22px 26px',
          borderRadius: 16,
          background: 'rgba(20,22,29,0.94)',
          border: `2.5px solid ${active ? C.red : C.steel}`,
          boxShadow: active ? '0 0 36px rgba(179,58,46,0.2)' : 'none',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: 3, color: 'rgba(239,231,213,0.6)' }}>{sub}</div>
        <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: active ? C.redBright : C.steel }}>
          {concept}
        </div>
        <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: C.paperDim }}>{title}</div>
      </div>
    );
  };
  const drugs = [
    { at: 530, no: '药一', name: '盯着他', effect: '监督 · 查岗', note: '成本十年翻了四倍', bad: true },
    { at: 655, no: '药二', name: '换合约', effect: '利和险捆在一起', note: '少东家的新合约', bad: false },
    { at: 775, no: '药三', name: '让他押点什么', effect: '押金 · 名声 · 身家', note: '同一条船', bad: false },
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 22%, rgba(217,166,83,0.10) 0%, rgba(20,22,29,0) 55%)' }} />
      <div
        style={{
          position: 'absolute',
          top: 285,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [10, 24], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        信息不对称 · 两兄弟
      </div>

      {/* 两兄弟卡片 */}
      <div style={{ position: 'absolute', top: 400, left: 70, right: 70, display: 'flex', gap: 30, height: 220 }}>
        {bro(30, '签约前 · 看不清对方', '上一期 · 柠檬市场', '逆向选择', 'steel')}
        {bro(150, '签约后 · 看不住手', '这一期 · 镖路', '道德风险', 'red')}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 645,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [370, 396, 430, 452], [0, 1, 1, 0.9], clamp),
        }}
      >
        <div
          style={{
            border: `1.5px solid ${C.gold}`,
            borderRadius: 999,
            padding: '12px 34px',
            fontFamily: SANS,
            fontSize: 28,
            letterSpacing: 2,
            color: C.goldBright,
            background: 'rgba(217,166,83,0.08)',
          }}
        >
          2001年 · 一起拿了诺贝尔奖
        </div>
      </div>

      {/* 三味药 */}
      <div
        style={{
          position: 'absolute',
          top: 760,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [440, 466], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 42,
          letterSpacing: 6,
          color: C.paper,
        }}
      >
        经济学开的药方，一共三味
      </div>
      <div style={{ position: 'absolute', top: 860, left: 60, right: 60, display: 'flex', gap: 24 }}>
        {drugs.map((d, i) => {
          const op = interpolate(frame, [d.at, d.at + 12], [0, 1], clamp);
          const y = interpolate(spring({ frame: frame - d.at, fps: 30, config: { damping: 100 } }), [0, 1], [30, 0]);
          if (frame < d.at) return <div key={i} style={{ flex: 1 }} />;
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                flex: 1,
                padding: '20px 14px',
                borderRadius: 16,
                background: 'rgba(20,22,29,0.94)',
                border: `2.5px solid ${d.bad ? '#4A4F5C' : C.gold}`,
                textAlign: 'center',
              }}
            >
              <div style={{ fontFamily: SANS, fontSize: 22, color: 'rgba(239,231,213,0.55)', letterSpacing: 2 }}>{d.no}</div>
              <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 900, fontSize: 36, color: d.bad ? C.paperDim : C.goldBright }}>
                {d.name}
              </div>
              <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 600, fontSize: 25, color: C.paperDim }}>{d.effect}</div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: SANS,
                  fontSize: 20,
                  color: d.bad ? C.redBright : 'rgba(217,166,83,0.85)',
                }}
              >
                {d.note}
              </div>
            </div>
          );
        })}
      </div>
      {/* 收尾串联：新合约 = 药二 + 药三 */}
      <div
        style={{
          position: 'absolute',
          top: 1210,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [820, 848, 862, 880], [0, 1, 1, 0], clamp),
        }}
      >
        <div
          style={{
            border: `2px solid ${C.gold}`,
            borderRadius: 999,
            padding: '14px 38px',
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 34,
            color: C.goldBright,
            background: 'rgba(217,166,83,0.1)',
          }}
        >
          永丰号新合约 = 药二 + 药三
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s17 解药对照（签约真实照片为底） ============
const Map3Scene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const titleOp = interpolate(frame, [12, 26], [0, 1], clamp);
  const punchOp = interpolate(frame, [500, 528, 570, 595], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill>
        <Img
          src={staticFile('real/real_signing.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.3) saturate(0.7)',
            transform: `scale(${interpolate(frame, [0, scene.duration], [1.1, 1.18])})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(13,15,20,0.55), rgba(13,15,20,0.75))' }} />
      <div
        style={{
          position: 'absolute',
          top: 330,
          width: '100%',
          textAlign: 'center',
          opacity: titleOp,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        新合约的后代 <span style={{ color: C.goldBright }}>→</span> 今天
      </div>
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 560 }}>
        <div style={{ position: 'absolute', top: 0, width: '100%', height: 100 }}>
          <MapRow left="车险免赔额" right="让你也赔一点" at={60} small />
        </div>
        <div style={{ position: 'absolute', top: 150, width: '100%', height: 100 }}>
          <MapRow left="绩效 · 期权" right="利和险同一条绳" at={195} small />
        </div>
        <div style={{ position: 'absolute', top: 300, width: '100%', height: 100 }}>
          <MapRow left="押金 · 对赌" right="赔十倍的现代版" at={330} small />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1020,
          width: '100%',
          textAlign: 'center',
          opacity: punchOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 52,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.8)',
        }}
      >
        看不见的地方，<span style={{ color: C.goldBright }}>人只认合同</span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1815,
          width: '100%',
          textAlign: 'center',
          fontFamily: SANS,
          fontSize: 21,
          letterSpacing: 2,
          color: 'rgba(239,231,213,0.4)',
        }}
      >
        背景图 · 真实照片（签约文件）
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s18 结尾 CTA ============
const OutroScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const quoteOp = interpolate(frame, [16, 34, 390, 422], [0, 1, 1, 0], clamp);
  const ctaOp = interpolate(frame, [420, 452], [0, 1], clamp);
  const ctaY = interpolate(ctaOp, [0, 1], [-36, 0]);
  const pulse = 1 + Math.sin(Math.max(0, frame - 452) * 0.06) * 0.02;
  const endFade = interpolate(frame, [scene.duration - 26, scene.duration], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 36%, rgba(217,166,83,0.14) 0%, rgba(13,15,20,0) 60%)' }} />
      <div style={{ position: 'absolute', top: 430, width: '100%', textAlign: 'center', opacity: quoteOp }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 78, color: C.paper }}>
          人心不用变
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 92,
            color: C.goldBright,
          }}
        >
          纸得换
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 40,
            color: 'rgba(239,231,213,0.8)',
            lineHeight: 1.6,
          }}
        >
          坏合约，让好人铤而走险
          <br />
          好合约，让懒人精打细算
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 435,
          width: '100%',
          textAlign: 'center',
          opacity: ctaOp,
          transform: `translateY(${ctaY}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: C.gold,
            borderRadius: 999,
            padding: '27px 70px',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 56,
            color: '#161207',
            boxShadow: '0 14px 60px rgba(217,166,83,0.55)',
            transform: `scale(${pulse})`,
          }}
        >
          关注我
        </div>
        <div style={{ marginTop: 46, fontFamily: SERIF, fontWeight: 700, fontSize: 47, color: C.paper }}>
          下一期：<span style={{ color: C.redBright }}>公地悲剧</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 33, color: 'rgba(239,231,213,0.7)' }}>
          谁都能放羊的草场，最后草没了
        </div>
      </div>
      <CaptionView scene={scene} />
      <AbsoluteFill style={{ background: '#000000', opacity: endFade }} />
    </AbsoluteFill>
  );
};

// ============ 场景路由 ============
const SceneContent: React.FC<{ scene: Scene; idx: number }> = ({ scene, idx }) => (
  <>
    <Audio src={staticFile(`audio/${scene.id}.wav`)} />
    {scene.type === 'image' && <ImageScene scene={scene} idx={idx} />}
    {scene.type === 'contractOld' && <ContractScene scene={scene} mode="old" />}
    {scene.type === 'contractNew' && <ContractScene scene={scene} mode="new" />}
    {scene.type === 'routeChoose' && <RouteMapScene scene={scene} mode="choose" />}
    {scene.type === 'routeChange' && <RouteMapScene scene={scene} mode="change" />}
    {scene.type === 'ledger' && <LedgerScene scene={scene} />}
    {scene.type === 'riskMath' && <RiskMathScene scene={scene} />}
    {scene.type === 'split' && <SplitScene scene={scene} />}
    {scene.type === 'real' && <RealScene scene={scene} />}
    {scene.type === 'titleReveal' && <StampScene scene={scene} />}
    {scene.type === 'map1' && <Map1Scene scene={scene} />}
    {scene.type === 'remedies' && <RemediesScene scene={scene} />}
    {scene.type === 'map3' && <Map3Scene scene={scene} />}
    {scene.type === 'outro' && <OutroScene scene={scene} />}
    {scene.id !== 's01' && scene.id !== 's14' && <Watermark />}
  </>
);

export const EscortVideo: React.FC = () => {
  const tl = timeline as unknown as { scenes: Scene[] };
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {tl.scenes.map((s, i) => (
        <Sequence key={s.id} from={s.start} durationInFrames={s.duration}>
          <SceneContent scene={s} idx={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
