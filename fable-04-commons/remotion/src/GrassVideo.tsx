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

// ============ 调色板：草野青绿 · 暮金 · 赭红 ============
const C = {
  ink: '#0C1210',
  inkSoft: '#121A16',
  paper: '#F0EBDA',
  paperDim: 'rgba(240,235,218,0.72)',
  red: '#A8402F',
  redBright: '#E0704F',
  gold: '#C9A24B',
  goldBright: '#EFC873',
  green: '#5F8F5C',
  greenBright: '#8FBF7A',
  gray: '#9B948A',
  chipBg: 'rgba(18,26,22,0.94)',
  chipBorder: '#56604C',
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

// 强调色：下行期(s01-s08,s13)用赭红，转机与概念期(s09-s12,s15-s18)用暮金
const GOLD_SCENES = new Set(['s09', 's10', 's11', 's12', 's15', 's17', 's18']);

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
  if (scene.id === 's13' && frame >= 520 && frame < 583) return null;
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
      color: 'rgba(240,235,218,0.42)',
      textShadow: '0 1px 8px rgba(0,0,0,0.65)',
    }}
  >
    经济学寓言 · 肆
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
          fontSize: 92,
          color: C.paper,
          lineHeight: 1.3,
          textShadow: '0 6px 30px rgba(0,0,0,0.85)',
        }}
      >
        全村没一个坏人
        <br />
        <span style={{ color: C.redBright }}>草场还是死了</span>
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: SANS,
          fontSize: 29,
          letterSpacing: 11,
          color: 'rgba(240,235,218,0.72)',
        }}
      >
        经济学寓言 · 第四集
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
            'linear-gradient(to bottom, rgba(12,18,16,0.30) 0%, rgba(12,18,16,0.02) 20%, rgba(12,18,16,0) 42%, rgba(12,18,16,0.55) 62%, rgba(12,18,16,0.92) 80%, #0C1210 100%)',
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

// ============ 一只羊的账（s03：收益归己 / 成本摊公） ============
const SheepMathScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  // 时机：羊卡 40f；左边收益 130f；右边摊派 300f；结论 440f
  const gainW = interpolate(frame, [130, 190], [0, 620], clamp);
  const dotsIn = interpolate(frame, [300, 380], [0, 1], clamp);
  const conclusionOp = interpolate(frame, [440, 468, 486, 503], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 30%, rgba(201,162,75,0.10) 0%, rgba(18,26,22,0) 60%)' }} />
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
        老三家的一笔账
      </div>

      {/* 羊卡 */}
      <div
        style={{
          position: 'absolute',
          top: 420,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [40, 66], [0, 1], clamp),
        }}
      >
        <div
          style={{
            background: 'rgba(18,26,22,0.94)',
            border: `2.5px solid ${C.chipBorder}`,
            borderRadius: 16,
            padding: '20px 44px',
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 48,
            color: C.paper,
          }}
        >
          多养 <span style={{ color: C.greenBright }}>一只羊</span>
        </div>
      </div>

      {/* 左：收益（归自己） */}
      <div style={{ position: 'absolute', top: 620, left: 90, width: 440 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 34,
            color: C.goldBright,
            opacity: interpolate(frame, [130, 152], [0, 1], clamp),
          }}
        >
          入冬卖羊 · 净赚
        </div>
        <div
          style={{
            marginTop: 14,
            height: 46,
            borderRadius: 23,
            background: 'rgba(18,26,22,0.94)',
            border: '2px solid #3A4438',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: gainW, height: '100%', background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright})`, borderRadius: 23 }} />
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 40,
            opacity: interpolate(frame, [150, 175], [0, 1], clamp),
          }}
        >
          <span style={{ color: C.goldBright }}>+100文</span>
          <span style={{ color: C.paper }}>归老三家</span>
        </div>
      </div>

      {/* 右：损耗（全村摊） */}
      <div style={{ position: 'absolute', top: 620, right: 90, width: 440, textAlign: 'right' }}>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize: 34,
            color: C.redBright,
            opacity: interpolate(frame, [300, 322], [0, 1], clamp),
          }}
        >
          草场损耗 · 八十七户摊
        </div>
        {/* 87 个小点，每个只分一丝 */}
        <div
          style={{
            marginTop: 22,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'flex-end',
            width: 430,
          }}
        >
          {Array.from({ length: 87 }, (_, i) => {
            const t = Math.max(0, Math.min(1, dotsIn * 1.6 - i * 0.007));
            return (
              <div
                key={i}
                style={{
                  width: 34,
                  height: 12,
                  borderRadius: 6,
                  background: `rgba(224,112,79,${0.25 + 0.45 * t})`,
                  opacity: t,
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 40,
            color: C.redBright,
            opacity: interpolate(frame, [380, 402], [0, 1], clamp),
          }}
        >
          摊到自家，不到一文
        </div>
      </div>

      {/* 天平式对比线 */}
      <div
        style={{
          position: 'absolute',
          top: 1060,
          left: 150,
          width: 780,
          height: 5,
          background: `linear-gradient(90deg, ${C.gold} 0%, rgba(240,235,218,0.2) 50%, ${C.red} 100%)`,
          borderRadius: 3,
          opacity: interpolate(frame, [400, 428], [0, 1], clamp),
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 1090,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [405, 430], [0, 1], clamp),
          fontFamily: SANS,
          fontSize: 28,
          letterSpacing: 6,
          color: 'rgba(240,235,218,0.55)',
        }}
      >
        收益全归自己 · 成本大家摊
      </div>

      {/* 结论 */}
      <div
        style={{
          position: 'absolute',
          top: 1210,
          width: '100%',
          textAlign: 'center',
          opacity: conclusionOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 56,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
        }}
      >
        这买卖，<span style={{ color: C.goldBright }}>傻子才不做</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 家家的算盘（s04：87 户加羊，羊数翻倍，草根变虚） ============
const SheepStackScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  // 87 户逐个亮起 60-260f；羊数翻倍滚动 330-430f；草根虚 470f
  const doubleT = interpolate(frame, [330, 430], [0, 1], clamp);
  const sheepCount = Math.round(870 + 870 * doubleT);
  const grassH = interpolate(frame, [60, 514], [170, 66], clamp);
  const grassColor = interpolate(frame, [120, 480], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 34%, rgba(143,191,122,0.08) 0%, rgba(18,26,22,0) 58%)' }} />
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
        八十七户，都不是傻子
      </div>

      {/* 户群点阵 */}
      <div
        style={{
          position: 'absolute',
          top: 430,
          left: 90,
          width: 900,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {Array.from({ length: 87 }, (_, i) => {
          const t = interpolate(frame, [60 + i * 2.3, 76 + i * 2.3], [0, 1], clamp);
          return (
            <div
              key={i}
              style={{
                width: 58,
                height: 58,
                borderRadius: 12,
                background: `rgba(143,191,122,${0.1 + 0.34 * t})`,
                border: `2px solid rgba(143,191,122,${0.2 + 0.65 * t})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SERIF,
                fontSize: 26,
                color: `rgba(240,235,218,${0.35 + 0.55 * t})`,
                opacity: t,
              }}
            >
              户
            </div>
          );
        })}
      </div>

      {/* 羊数翻倍计数器 */}
      <div
        style={{
          position: 'absolute',
          top: 1010,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 30,
          opacity: interpolate(frame, [310, 338], [0, 1], clamp),
        }}
      >
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 40, color: C.paperDim }}>全村羊数</div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 84,
            color: C.goldBright,
            textShadow: '0 4px 26px rgba(0,0,0,0.7)',
            minWidth: 340,
            textAlign: 'center',
          }}
        >
          {sheepCount}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 54,
            color: C.redBright,
            padding: '8px 22px',
            border: `3px solid ${C.red}`,
            borderRadius: 14,
            transform: `rotate(-4deg) scale(${interpolate(spring({ frame: frame - 420, fps: 30, config: { damping: 12, stiffness: 120 } }), [0, 1], [1.6, 1])})`,
            opacity: interpolate(frame, [420, 432], [0, 1], clamp),
          }}
        >
          ×2
        </div>
      </div>

      {/* 草的高度条（变矮变黄） */}
      <div style={{ position: 'absolute', top: 1150, left: 150, width: 780 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 30,
            color: C.paperDim,
            opacity: interpolate(frame, [340, 366], [0, 1], clamp),
          }}
        >
          <span>草原看着还绿</span>
          <span style={{ color: C.redBright }}>草根已经虚了</span>
        </div>
        <div
          style={{
            marginTop: 12,
            height: grassH,
            borderRadius: 14,
            background: `linear-gradient(180deg, rgba(143,191,122,${0.85 - 0.45 * grassColor}) 0%, rgba(201,162,75,${0.25 + 0.5 * grassColor}) 100%)`,
            border: '1.5px solid rgba(240,235,218,0.18)',
          }}
        />
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 恶性循环（s06：草越差羊越多） ============
const LOOP_NODES = [
  { x: 90, y: 430, label: '草\n变差' },
  { x: 580, y: 430, label: '羊掉膘\n卖不上价' },
  { x: 580, y: 830, label: '再添几只\n凑收入' },
  { x: 90, y: 830, label: '羊更多\n草更差' },
];

const DoomLoopScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const titleOp = interpolate(frame, [10, 24], [0, 1], clamp);
  const cycStart = 50;
  const step = 78;
  const active = frame < cycStart ? -1 : Math.floor((frame - cycStart) / step) % 4;
  const stopOp = interpolate(frame, [380, 406, 440, 452], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(168,64,47,${interpolate(frame, [cycStart, cycStart + 70], [0, 0.12], clamp)}) 0%, rgba(18,26,22,0) 60%)`,
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
        转了五年的圈
      </div>

      <svg width={1080} height={1300} style={{ position: 'absolute', top: 320, left: 0 }}>
        <ellipse
          cx={540}
          cy={670}
          rx={330}
          ry={290}
          fill="none"
          stroke="rgba(201,162,75,0.35)"
          strokeWidth={3}
          strokeDasharray="14 18"
          strokeDashoffset={-frame * 1.4}
        />
      </svg>

      {LOOP_NODES.map((n, i) => {
        const isActive = i === active;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: n.x,
              top: n.y,
              width: 410,
              height: 190,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              background: isActive ? 'rgba(168,64,47,0.16)' : 'rgba(18,26,22,0.9)',
              border: `2.5px solid ${isActive ? C.red : '#3A4438'}`,
              borderRadius: 18,
              boxShadow: isActive ? '0 0 44px rgba(168,64,47,0.4)' : 'none',
              transform: `scale(${isActive ? 1.05 : 0.98})`,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 38,
              color: isActive ? C.paper : 'rgba(240,235,218,0.66)',
              lineHeight: 1.45,
              whiteSpace: 'pre',
            }}
          >
            {n.label}
          </div>
        );
      })}

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
          boxShadow: '0 16px 60px rgba(168,64,47,0.45)',
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
        越差
        <br />
        越多
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1240,
          width: '100%',
          textAlign: 'center',
          opacity: stopOp,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 46,
          color: C.paperDim,
        }}
      >
        谁也停不下来
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 八十七个几只（s08：复盘乘法） ============
const EightySevenScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const qOp = interpolate(frame, [20, 44, 200, 224], [0, 1, 1, 0], clamp);
  const ansS = spring({ frame: frame - 240, fps: 30, config: { damping: 13, stiffness: 130 } });
  const ansScale = interpolate(ansS, [0, 1], [2.2, 1]);
  const multOp = interpolate(frame, [330, 356, 420, 444], [0, 1, 1, 0], clamp);
  const bigOp = interpolate(frame, [435, 462, 488, 503], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: '#0A100D', opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 34%, rgba(201,162,75,0.12) 0%, rgba(10,16,13,0) 60%)' }} />
      <div
        style={{
          position: 'absolute',
          top: 400,
          width: '100%',
          textAlign: 'center',
          opacity: qOp,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 54,
          color: C.paper,
          textShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }}
      >
        毁于天灾，还是人祸？
      </div>
      <div
        style={{
          position: 'absolute',
          top: 545,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: frame >= 240 ? Math.min(1, (frame - 240) / 6) : 0,
        }}
      >
        <div
          style={{
            transform: `scale(${ansScale}) rotate(-3deg)`,
            background: C.red,
            borderRadius: 16,
            padding: '18px 46px',
            boxShadow: '0 18px 70px rgba(168,64,47,0.45)',
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 62,
            color: '#F7EFDE',
            letterSpacing: 8,
          }}
        >
          都不是
        </div>
      </div>

      {/* 乘法式 */}
      <div
        style={{
          position: 'absolute',
          top: 830,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 34,
          opacity: multOp,
        }}
      >
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 62, color: C.paper }}>每家只多放几只</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 60, color: C.goldBright }}>×</div>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 62, color: C.goldBright }}>87 户</div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1000,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: bigOp,
        }}
      >
        <div
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 84,
            color: C.redBright,
            textShadow: '0 6px 40px rgba(0,0,0,0.9)',
            textAlign: 'center',
          }}
        >
          八十七个「几只」
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 四条新规矩（s10：规则卡） ============
const RulesScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const rules = [
    { at: 60, mark: '一', text: '草场划成八十七片，一家一片', note: '写进村簿', tone: 'gold' },
    { at: 150, mark: '二', text: '轮着放：春啃东坡，秋换西坡', note: '轮牧', tone: 'plain' },
    { at: 240, mark: '三', text: '两个后生当护草员', note: '工钱全村摊', tone: 'plain' },
    { at: 330, mark: '四', text: '羊进错了片，罚三倍', note: '犯规真罚', tone: 'red' },
    { at: 420, mark: '五', text: '羊数不由各家定', note: '每年开春，按草的长势定', tone: 'gold' },
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 28%, rgba(143,191,122,0.10) 0%, rgba(18,26,22,0) 58%)' }} />
      <div
        style={{
          position: 'absolute',
          top: 290,
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
        祠堂里定下的新规矩
      </div>
      <div style={{ position: 'absolute', top: 410, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {rules.map((r, i) => {
          const s = spring({ frame: frame - r.at, fps: 30, config: { damping: 100 } });
          const op = interpolate(frame, [r.at, r.at + 10], [0, 1], clamp);
          const y = interpolate(s, [0, 1], [34, 0]);
          if (frame < r.at) return null;
          const isGold = r.tone === 'gold';
          const isRed = r.tone === 'red';
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '20px 28px',
                background: 'rgba(18,26,22,0.93)',
                border: `2.5px solid ${isGold ? C.gold : isRed ? C.red : '#3A4438'}`,
                borderRadius: 14,
                boxShadow: isRed ? '0 0 30px rgba(168,64,47,0.2)' : 'none',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isRed ? 'rgba(168,64,47,0.2)' : isGold ? 'rgba(201,162,75,0.16)' : 'rgba(143,191,122,0.12)',
                  border: `2px solid ${isRed ? C.red : isGold ? C.gold : 'rgba(143,191,122,0.5)'}`,
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 34,
                  color: isRed ? C.redBright : isGold ? C.goldBright : C.greenBright,
                }}
              >
                {r.mark}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paper, lineHeight: 1.35 }}>{r.text}</div>
                <div style={{ marginTop: 4, fontFamily: SANS, fontSize: 22, color: 'rgba(240,235,218,0.55)' }}>{r.note}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1330,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [520, 546, 568, 575], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 42,
          color: C.goldBright,
        }}
      >
        吵了三天，二十几户，按了手印
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 真实素材场景（s13） ============
const RealPhoto: React.FC<{
  src: string; label: string; source: string; from: number; to: number; idx: number;
}> = ({ src, label, source, from, to, idx }) => {
  const frame = useCurrentFrame();
  const visible = frame >= from && frame < to;
  if (!visible) return null;
  const prog = frame - from;
  const life = to - from;
  const op = interpolate(prog, [0, 10, life - 10, life], [0, 1, 1, 0], clamp);
  const zoom = interpolate(prog, [0, life], idx % 2 === 0 ? [1.03, 1.13] : [1.13, 1.03]);
  const s = spring({ frame: prog, fps: 30, config: { damping: 100 } });
  const y = interpolate(s, [0, 1], [26, 0]);
  return (
    <AbsoluteFill style={{ opacity: op }}>
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
      <AbsoluteFill style={{ background: 'rgba(10,16,13,0.45)' }} />
      <div
        style={{
          position: 'absolute',
          top: 210,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateY(${y}px)`,
        }}
      >
        <div
          style={{
            width: 920,
            height: 690,
            overflow: 'hidden',
            borderRadius: 22,
            boxShadow: '0 30px 110px rgba(0,0,0,0.85)',
            border: '1px solid rgba(240,235,218,0.18)',
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
      <div
        style={{
          position: 'absolute',
          top: 990,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            background: 'rgba(10,16,13,0.86)',
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
        <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: 3, color: 'rgba(240,235,218,0.62)' }}>
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
    <AbsoluteFill style={{ background: '#0A100D', opacity: fadeIn }}>
      <RealPhoto src="real/real_overfish.jpg" label="太平洋的鱼 · 谁都能下网" source="真实照片 · 远洋捕捞" from={0} to={285} idx={0} />
      <RealPhoto src="real/real_air.jpg" label="大气层 · 谁都能排" source="真实照片 · 工业排放" from={285} to={435} idx={1} />
      <RealPhoto src="real/real_bikes.jpg" label="堆成山的共享单车" source="真实照片 · 共享单车坟场" from={435} to={583} idx={2} />
      <div
        style={{
          position: 'absolute',
          top: 480,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [522, 548, 570, 583], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 72,
          color: C.paper,
          textShadow: '0 6px 40px rgba(0,0,0,0.95)',
          zIndex: 5,
        }}
      >
        每一片
        <div style={{ marginTop: 14, color: C.redBright }}>都是草洼村的草场</div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s14 概念揭晓印章：公地悲剧 ============
const StampScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const stampAt = 100; // “叫公地悲剧”发音时刻
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
    <AbsoluteFill style={{ background: '#080C0A' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(168,64,47,${interpolate(
            frame,
            [stampAt, stampAt + 20],
            [0, 0.16],
            clamp
          )}) 0%, rgba(8,12,10,0) 55%)`,
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
          color: 'rgba(240,235,218,0.88)',
        }}
      >
        这个没有坏人也能发生的悲剧
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
              boxShadow: '0 22px 90px rgba(168,64,47,0.5), inset 0 0 60px rgba(0,0,0,0.18)',
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
              公地悲剧
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
        <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 12, color: 'rgba(240,235,218,0.55)' }}>
          TRAGEDY OF THE COMMONS
        </div>
        <div style={{ marginTop: 16, fontFamily: SERIF, fontSize: 27, letterSpacing: 5, color: C.gold }}>
          公共经济学 · Hardin 1968 / Ostrom 2009 诺贝尔经济学奖
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
        background: isStory ? C.chipBg : 'rgba(201,162,75,0.14)',
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
  const punchOp = interpolate(frame, [530, 556, 586, 602], [0, 1, 1, 0], clamp);
  const rows: [string, string][] = [
    ['村后的公地', '非排他性资源'],
    ['多养一只的账', '收益私有 · 成本公有'],
    ['谁先减谁吃亏', '囚徒困境'],
    ['草根没了', '集体非理性'],
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 18%, rgba(201,162,75,0.09) 0%, rgba(18,26,22,0) 55%)' }} />
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
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 640 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ position: 'absolute', top: i * 160, width: '100%', height: 90 }}>
            <MapRow left={r[0]} right={r[1]} at={60 + i * 95} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1120,
          width: '100%',
          textAlign: 'center',
          opacity: punchOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 48,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
          lineHeight: 1.5,
        }}
      >
        个人的算盘越打越精
        <br />
        <span style={{ color: C.goldBright }}>公共的家底越算越薄</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s16 哈丁与奥斯特罗姆 ============
const HardinScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const paperIn = spring({ frame: frame - 30, fps: 30, config: { damping: 14, stiffness: 90 } });
  const paperScale = interpolate(paperIn, [0, 1], [0.92, 1]);
  const pathsOp = interpolate(frame, [150, 178], [0, 1], clamp);
  const ostromOp = interpolate(frame, [630, 660], [0, 1], clamp);
  const answerOp = interpolate(frame, [795, 826, 880, 906], [0, 1, 1, 0], clamp);
  const nobelOp = interpolate(frame, [860, 888, 918, 930], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 26%, rgba(201,162,75,0.11) 0%, rgba(18,26,22,0) 55%)' }} />
      {/* 论文卡 */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          transform: `scale(${paperScale})`,
          opacity: interpolate(frame, [30, 52], [0, 1], clamp),
        }}
      >
        <div
          style={{
            width: 700,
            background: 'rgba(240,235,218,0.96)',
            borderRadius: 10,
            padding: '34px 44px',
            boxShadow: '0 24px 90px rgba(0,0,0,0.6)',
            transform: 'rotate(-1.5deg)',
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: 4, color: '#6B6355' }}>SCIENCE · 1968 · 六页论文</div>
          <div style={{ marginTop: 12, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: '#2A2620' }}>《公地悲剧》</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 600, fontSize: 30, color: '#55503F' }}>生物学家 · 哈丁</div>
        </div>
      </div>

      {/* 哈丁的两条路 */}
      <div
        style={{
          position: 'absolute',
          top: 700,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          opacity: pathsOp,
        }}
      >
        {[
          { t: '卖掉', s: '私有化' },
          { t: '归官', s: '管制' },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              padding: '24px 40px',
              borderRadius: 16,
              background: 'rgba(18,26,22,0.94)',
              border: '2.5px solid #3A4438',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: C.paperDim }}>{p.t}</div>
            <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 24, color: 'rgba(240,235,218,0.5)' }}>{p.s}</div>
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            top: 100,
            width: '100%',
            textAlign: 'center',
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 30,
            color: 'rgba(240,235,218,0.55)',
          }}
        >
          哈丁说，公地只有两条出路
        </div>
      </div>

      {/* 奥斯特罗姆的田野 */}
      <div
        style={{
          position: 'absolute',
          top: 940,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: ostromOp,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 18,
            alignItems: 'center',
            background: 'rgba(18,26,22,0.94)',
            border: `2.5px solid ${C.green}`,
            borderRadius: 16,
            padding: '20px 34px',
          }}
        >
          {['瑞士草场', '日本山林', '西班牙灌溉渠'].map((t, i) => (
            <div key={i} style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: C.greenBright }}>
              {t}
            </div>
          ))}
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: C.paperDim }}>用了一千年，没坏</div>
        </div>
      </div>

      {/* 答案 */}
      <div
        style={{
          position: 'absolute',
          top: 1160,
          width: '100%',
          textAlign: 'center',
          opacity: answerOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 76,
          color: C.goldBright,
          textShadow: '0 6px 40px rgba(0,0,0,0.85)',
        }}
      >
        第三条路：村里自己管
      </div>
      {/* 诺奖注脚 */}
      <div
        style={{
          position: 'absolute',
          top: 1300,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: nobelOp,
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
            background: 'rgba(201,162,75,0.08)',
          }}
        >
          奥斯特罗姆 · 2009 诺贝尔经济学奖 · 第一位女性得主
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s17 解药对照（渔港真实照片为底） ============
const Map3Scene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const titleOp = interpolate(frame, [12, 26], [0, 1], clamp);
  const punchOp = interpolate(frame, [600, 628, 690, 716], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill>
        <Img
          src={staticFile('real/real_harbor.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'brightness(0.3) saturate(0.7)',
            transform: `scale(${interpolate(frame, [0, scene.duration], [1.1, 1.18])})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(12,18,16,0.55), rgba(12,18,16,0.75))' }} />
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
        柴棍线的后代 <span style={{ color: C.goldBright }}>→</span> 今天
      </div>
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 560 }}>
        <div style={{ position: 'absolute', top: 0, width: '100%', height: 100 }}>
          <MapRow left="渔业配额" right="划片的后代" at={60} small />
        </div>
        <div style={{ position: 'absolute', top: 150, width: '100%', height: 100 }}>
          <MapRow left="碳交易" right="罚三倍的后代" at={195} small />
        </div>
        <div style={{ position: 'absolute', top: 300, width: '100%', height: 100 }}>
          <MapRow left="小区业委会" right="祠堂议事的后代" at={330} small />
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
        土办法，<span style={{ color: C.goldBright }}>是正经经济学</span>
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
          color: 'rgba(240,235,218,0.4)',
        }}
      >
        背景图 · 真实照片（渔港与渔网）
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
  const ctaOp = interpolate(frame, [420, 452], [0, 1], clamp);
  const ctaY = interpolate(ctaOp, [0, 1], [-36, 0]);
  const pulse = 1 + Math.sin(Math.max(0, frame - 452) * 0.06) * 0.02;
  const endFade = interpolate(frame, [scene.duration - 26, scene.duration], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 36%, rgba(143,191,122,0.13) 0%, rgba(12,18,16,0) 60%)' }} />
      <div style={{ position: 'absolute', top: 400, width: '100%', textAlign: 'center', opacity: quoteOp }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 74, color: C.paper }}>
          坏，不需要坏人
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 74,
            color: C.goldBright,
          }}
        >
          救回来，也不需要圣人
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 38,
            color: 'rgba(240,235,218,0.8)',
            lineHeight: 1.6,
          }}
        >
          哈丁说无解，奥斯特罗姆说有解
          <br />
          解，就在人怎么相处
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
            boxShadow: '0 14px 60px rgba(201,162,75,0.55)',
            transform: `scale(${pulse})`,
          }}
        >
          关注我
        </div>
        <div style={{ marginTop: 46, fontFamily: SERIF, fontWeight: 700, fontSize: 47, color: C.paper }}>
          下一期：<span style={{ color: C.redBright }}>银行挤兑</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 33, color: 'rgba(240,235,218,0.7)' }}>
          一句闲话，挤倒一家好银行
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
    {scene.type === 'sheepMath' && <SheepMathScene scene={scene} />}
    {scene.type === 'sheepStack' && <SheepStackScene scene={scene} />}
    {scene.type === 'doomLoop' && <DoomLoopScene scene={scene} />}
    {scene.type === 'eightySeven' && <EightySevenScene scene={scene} />}
    {scene.type === 'rules' && <RulesScene scene={scene} />}
    {scene.type === 'real' && <RealScene scene={scene} />}
    {scene.type === 'titleReveal' && <StampScene scene={scene} />}
    {scene.type === 'map1' && <Map1Scene scene={scene} />}
    {scene.type === 'hardin' && <HardinScene scene={scene} />}
    {scene.type === 'map3' && <Map3Scene scene={scene} />}
    {scene.type === 'outro' && <OutroScene scene={scene} />}
    {scene.id !== 's01' && scene.id !== 's14' && <Watermark />}
  </>
);

export const GrassVideo: React.FC = () => {
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
