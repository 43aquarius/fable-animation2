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

// ============ 调色板：夜靛青 · 琥珀金 · 绛红（丝路夜市） ============
const C = {
  ink: '#0E1016',
  inkSoft: '#151822',
  paper: '#F2E9D6',
  paperDim: 'rgba(242,233,214,0.72)',
  red: '#C74336',
  redBright: '#F0755E',
  gold: '#D9A653',
  goldBright: '#F5C876',
  gray: '#9B948A',
  chipBg: 'rgba(21,24,34,0.94)',
  chipBorder: '#6B5E3F',
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

// 强调色：下坡期(s01-s09,s13,s16)用绛红，转机与概念期(s10-s12,s15,s17,s18)用琥珀金
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
  // s13：大字出现期间隐藏底部字幕，避免同屏重复
  if (scene.id === 's13' && frame >= 58 && frame < 235) return null;
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
      color: 'rgba(242,233,214,0.42)',
    }}
  >
    经济学寓言 · 壹
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
        一座马市
        <br />
        <span style={{ color: C.redBright }}>把自己逼死了</span>
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: SANS,
          fontSize: 29,
          letterSpacing: 11,
          color: 'rgba(242,233,214,0.72)',
        }}
      >
        经济学寓言 · 第一集
      </div>
    </div>
  );
};

// ============ 大漠场景（图像 + Ken Burns + 字幕） ============
const MarketScene: React.FC<{ scene: Scene; idx: number }> = ({ scene, idx }) => {
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
            'linear-gradient(to bottom, rgba(14,16,22,0.30) 0%, rgba(14,16,22,0.02) 20%, rgba(14,16,22,0) 42%, rgba(14,16,22,0.55) 62%, rgba(14,16,22,0.92) 80%, #0E1016 100%)',
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

// ============ s13 现代揭晓（从古道切到现代二手车市场） ============
const EconRevealScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const line1Op = interpolate(frame, [62, 80, 148, 160], [0, 1, 1, 0], clamp);
  const line2Op = interpolate(frame, [115, 133, 215, 228], [0, 1, 1, 0], clamp);
  const l1y = interpolate(line1Op, [0, 1], [26, 0]);
  const l2y = interpolate(line2Op, [0, 1], [20, 0]);
  const divW = interpolate(frame, [125, 205], [0, 230], clamp);
  return (
    <AbsoluteFill style={{ background: '#0C0E13', opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 32%, rgba(217,166,83,0.20) 0%, rgba(12,14,19,0) 62%)',
        }}
      />
      <div style={{ position: 'absolute', top: 545, width: '100%', textAlign: 'center' }}>
        <div
          style={{
            opacity: line1Op,
            transform: `translateY(${l1y}px)`,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 76,
            color: C.paper,
            textShadow: '0 4px 26px rgba(0,0,0,0.7)',
          }}
        >
          你买<span style={{ color: C.goldBright }}>二手车</span>的那天
        </div>
        <div
          style={{
            opacity: line2Op,
            transform: `translateY(${l2y}px)`,
            marginTop: 30,
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 50,
            color: 'rgba(242,233,214,0.92)',
          }}
        >
          就站在月泉城的马市里
        </div>
        <div
          style={{
            margin: '44px auto 0',
            width: divW,
            height: 5,
            background: C.red,
            borderRadius: 3,
          }}
        />
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s14 概念揭晓印章：逆向选择 ============
const StampScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const stampAt = 150; // “叫逆向选择”发音时刻
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
          background: `radial-gradient(circle at 50% 46%, rgba(199,67,54,${interpolate(
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
          color: 'rgba(242,233,214,0.88)',
        }}
      >
        这个能把好市场活活逼死的病
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
              boxShadow: '0 22px 90px rgba(199,67,54,0.5), inset 0 0 60px rgba(0,0,0,0.18)',
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
              逆向选择
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
        <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 12, color: 'rgba(242,233,214,0.55)' }}>
          ADVERSE SELECTION
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
  const chipOp = interpolate(frame, [430, 452], [0, 1], clamp);
  const rows: [string, string][] = [
    ['看不见底细的马', '信息不对称'],
    ['康掌柜的宝驹', '优质商品'],
    ['瘸马病马', '劣质品·柠檬'],
    ['全城的中间价', '平均质量定价'],
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 18%, rgba(217,166,83,0.09) 0%, rgba(21,24,34,0) 55%)',
        }}
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
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 700 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ position: 'absolute', top: i * 168, width: '100%', height: 90 }}>
            <MapRow left={r[0]} right={r[1]} at={50 + i * 95} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1210,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: chipOp,
        }}
      >
        <div
          style={{
            border: `1.5px solid ${C.gold}`,
            borderRadius: 999,
            padding: '12px 36px',
            fontFamily: SANS,
            fontSize: 28,
            letterSpacing: 3,
            color: C.goldBright,
            background: 'rgba(217,166,83,0.08)',
          }}
        >
          阿克洛夫《柠檬市场》1970 · 诺贝尔奖 2001
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s16 死亡螺旋（四节点循环） ============
const NODE_W = 420;
const NODE_H = 190;
const NODES = [
  { x: 80, y: 430, label: '买家只出\n平均价' },
  { x: 580, y: 430, label: '最好的马\n先亏本' },
  { x: 580, y: 830, label: '好马撤\n质量再跌' },
  { x: 80, y: 830, label: '价钱\n只能再压' },
];

const SpiralScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const titleOp = interpolate(frame, [10, 24], [0, 1], clamp);
  const chipOp = interpolate(frame, [520, 545], [0, 1], clamp);
  const cycStart = 44;
  const step = 72; // 每个节点的高亮时长
  const active = frame < cycStart ? -1 : Math.floor((frame - cycStart) / step) % 4;
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(199,67,54,${interpolate(
            frame,
            [cycStart, cycStart + 60],
            [0, 0.10],
            clamp
          )}) 0%, rgba(21,24,34,0) 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 300,
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
        市场的死法，是一个圈
      </div>

      {/* 虚线椭圆环：流动感 */}
      <svg width={1080} height={1300} style={{ position: 'absolute', top: 320, left: 0 }}>
        <ellipse
          cx={540}
          cy={670}
          rx={330}
          ry={290}
          fill="none"
          stroke="rgba(217,166,83,0.35)"
          strokeWidth={3}
          strokeDasharray="14 18"
          strokeDashoffset={-frame * 1.4}
        />
      </svg>

      {NODES.map((n, i) => {
        const isActive = i === active;
        const glow = spring({ frame: frame - (cycStart + i * step), fps: 30, config: { damping: 100 } });
        const pop = interpolate(glow, [0, 1], [0.94, 1]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: n.x,
              top: n.y,
              width: NODE_W,
              height: NODE_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: isActive ? 'rgba(199,67,54,0.16)' : 'rgba(21,24,34,0.9)',
              border: `2.5px solid ${isActive ? C.red : '#3A3F4C'}`,
              borderRadius: 18,
              boxShadow: isActive ? '0 0 44px rgba(199,67,54,0.4)' : 'none',
              transform: `scale(${isActive ? 1.05 : pop})`,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 38,
              color: isActive ? C.paper : 'rgba(242,233,214,0.66)',
              lineHeight: 1.45,
              whiteSpace: 'pre',
              transition: 'none',
            }}
          >
            {n.label}
          </div>
        );
      })}

      {/* 中心印章 */}
      <div
        style={{
          position: 'absolute',
          top: 586,
          left: 424,
          width: 232,
          height: 168,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.red,
          borderRadius: 16,
          boxShadow: '0 16px 60px rgba(199,67,54,0.45)',
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 44,
          letterSpacing: 6,
          color: '#F7EFDE',
          textAlign: 'center',
          lineHeight: 1.35,
          transform: `rotate(-3deg) scale(${interpolate(
            spring({ frame: frame - 30, fps: 30, config: { damping: 12, stiffness: 120 } }),
            [0, 1],
            [1.6, 1]
          )})`,
          opacity: interpolate(frame, [30, 40], [0, 1], clamp),
        }}
      >
        死亡
        <br />
        螺旋
      </div>

      {/* 底部学术注脚 */}
      <div
        style={{
          position: 'absolute',
          top: 1230,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: chipOp,
        }}
      >
        <div
          style={{
            border: `1.5px solid ${C.gold}`,
            borderRadius: 999,
            padding: '12px 34px',
            fontFamily: SANS,
            fontSize: 27,
            letterSpacing: 2,
            color: C.goldBright,
            background: 'rgba(217,166,83,0.08)',
          }}
        >
          三家顶级期刊退稿 → 2001 诺贝尔经济学奖
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s17 解药对照（木牌图为底） ============
const Map3Scene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const titleOp = interpolate(frame, [12, 26], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill>
        <Img
          src={staticFile(`images/${scene.image}.png`)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.38) saturate(0.85)',
            transform: `scale(${interpolate(frame, [0, scene.duration], [1.1, 1.18])})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(14,16,22,0.55), rgba(14,16,22,0.72))' }} />
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
        马市解药 <span style={{ color: C.goldBright }}>→</span> 经济学
      </div>
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 560 }}>
        <div style={{ position: 'absolute', top: 0, width: '100%', height: 100 }}>
          <MapRow left="十倍赔偿的木牌" right="信号发送" at={60} small />
        </div>
        <div style={{ position: 'absolute', top: 150, width: '100%', height: 100 }}>
          <MapRow left="质保 · 退换 · 品牌广告" right="木牌的后代" at={370} small />
        </div>
        <div style={{ position: 'absolute', top: 300, width: '100%', height: 100 }}>
          <MapRow left="第三方检测 · 平台评分" right="新时代的牙人" at={650} small />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1000,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [120, 150], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 40,
          color: C.goldBright,
          letterSpacing: 4,
        }}
      >
        敢赔十倍，就是质量
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s18 结尾 CTA ============
const OutroScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const quoteOp = interpolate(frame, [16, 34, 380, 412], [0, 1, 1, 0], clamp);
  const ctaOp = interpolate(frame, [408, 440], [0, 1], clamp);
  const ctaY = interpolate(ctaOp, [0, 1], [-36, 0]);
  const pulse = 1 + Math.sin(Math.max(0, frame - 440) * 0.06) * 0.02;
  const endFade = interpolate(frame, [scene.duration - 26, scene.duration], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 36%, rgba(217,166,83,0.14) 0%, rgba(14,16,22,0) 60%)',
        }}
      />
      <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center', opacity: quoteOp }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 66, color: C.paper }}>
          市场最怕的不是坏人
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 88,
            color: C.goldBright,
          }}
        >
          是不知道
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 38,
            color: 'rgba(242,233,214,0.8)',
            lineHeight: 1.6,
          }}
        >
          看不见底细的市场
          <br />
          好东西会自己走光
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
          下一期：<span style={{ color: C.redBright }}>道德风险</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 33, color: 'rgba(242,233,214,0.7)' }}>
          买了保险，就敢浪了
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
    {scene.type === 'image' && <MarketScene scene={scene} idx={idx} />}
    {scene.type === 'econReveal' && <EconRevealScene scene={scene} />}
    {scene.type === 'titleReveal' && <StampScene scene={scene} />}
    {scene.type === 'map1' && <Map1Scene scene={scene} />}
    {scene.type === 'spiral' && <SpiralScene scene={scene} />}
    {scene.type === 'map3' && <Map3Scene scene={scene} />}
    {scene.type === 'outro' && <OutroScene scene={scene} />}
    {scene.id !== 's01' && scene.id !== 's14' && <Watermark />}
  </>
);

export const MarketVideo: React.FC = () => {
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
