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

// ============ 调色板：烟雨黛青 · 灯暖黄 · 银朱（江南钱庄） ============
const C = {
  ink: '#0E1114',
  inkSoft: '#141920',
  paper: '#EDE9DC',
  paperDim: 'rgba(237,233,220,0.72)',
  red: '#B03434',
  redBright: '#E86050',
  gold: '#CFA24A',
  goldBright: '#EFCB77',
  blue: '#5E7C9A',
  blueBright: '#8FAECA',
  gray: '#9B948A',
  chipBg: 'rgba(20,25,32,0.94)',
  chipBorder: '#4E5560',
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

// 强调色：危机期(s01-s10)用银朱，解药期(s11-s12,s15-s18)用灯暖金
const GOLD_SCENES = new Set(['s11', 's12', 's15', 's16', 's17', 's18']);

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
  if (scene.id === 's13' && frame >= 530 && frame < 586) return null;
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
      color: 'rgba(237,233,220,0.42)',
      textShadow: '0 1px 8px rgba(0,0,0,0.65)',
    }}
  >
    经济学寓言 · 伍
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
        一家好钱庄
        <br />
        <span style={{ color: C.redBright }}>死于一句话</span>
      </div>
      <div
        style={{
          marginTop: 30,
          fontFamily: SANS,
          fontSize: 29,
          letterSpacing: 11,
          color: 'rgba(237,233,220,0.72)',
        }}
      >
        经济学寓言 · 第五集
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
            'linear-gradient(to bottom, rgba(14,17,20,0.30) 0%, rgba(14,17,20,0.02) 20%, rgba(14,17,20,0) 42%, rgba(14,17,20,0.55) 62%, rgba(14,17,20,0.92) 80%, #0E1114 100%)',
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

// ============ 资金池（s02 钱庄生意 / s03 三成准备金） ============
const PoolScene: React.FC<{ scene: Scene; mode: 'pool' | 'reserve' }> = ({ scene, mode }) => {
  const frame = useCurrentFrame();
  const isReserve = mode === 'reserve';
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  // s02：存入 60f，借出 180f，利钱 340f，随时/三年对比 430f，命门 470f
  // s03：三成金 90f，进出流水 150-330f，二十年 390f
  const depositT = isReserve ? 0 : interpolate(frame, [60, 130], [0, 1], clamp);
  const loanT = isReserve ? 0 : interpolate(frame, [180, 250], [0, 1], clamp);
  const poolH = isReserve ? 0.62 : interpolate(frame, [60, 130, 180, 250], [0.15, 0.45, 0.45, 0.3], clamp);
  const reservePct = isReserve ? interpolate(frame, [60, 110], [0, 1], clamp) : 0;
  // s03：进出的流水点
  const flowT = isReserve ? interpolate(frame, [150, 330], [0, 1], clamp) : 0;
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 34%, rgba(207,162,74,0.10) 0%, rgba(20,25,32,0) 60%)' }} />
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
        {isReserve ? '老掌柜的分寸' : '钱庄怎么赚钱'}
      </div>

      {!isReserve && (
        <>
          {/* 存入 */}
          <div
            style={{
              position: 'absolute',
              top: 470,
              left: 100,
              opacity: interpolate(frame, [55, 80], [0, 1], clamp),
            }}
          >
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 36, color: C.blueBright }}>东街张婶 · 存入</div>
            <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: C.paper }}>一百两</div>
          </div>
          {/* 借出 */}
          <div
            style={{
              position: 'absolute',
              top: 470,
              right: 100,
              textAlign: 'right',
              opacity: interpolate(frame, [175, 200], [0, 1], clamp),
            }}
          >
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 36, color: C.goldBright }}>转手借给酒坊</div>
            <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: C.paper }}>三年期</div>
          </div>
          {/* 银锭飞入飞出 */}
          <div
            style={{
              position: 'absolute',
              top: 600,
              left: interpolate(depositT, [0, 1], [180, 460], clamp),
              opacity: depositT > 0 && depositT < 1 ? 1 : 0.25,
              width: 74,
              height: 46,
              borderRadius: 20,
              background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.gold} 70%)`,
              boxShadow: '0 6px 22px rgba(207,162,74,0.4)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 600,
              left: interpolate(loanT, [0, 1], [620, 540], clamp),
              opacity: loanT > 0 && loanT < 1 ? 1 : 0.25,
              width: 74,
              height: 46,
              borderRadius: 20,
              background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.gold} 70%)`,
              boxShadow: '0 6px 22px rgba(207,162,74,0.4)',
            }}
          />
        </>
      )}

      {/* 资金池 */}
      <div
        style={{
          position: 'absolute',
          top: 700,
          left: 130,
          width: 820,
          height: 300,
          borderRadius: 20,
          border: `3px solid ${C.chipBorder}`,
          background: 'rgba(20,25,32,0.92)',
          overflow: 'hidden',
        }}
      >
        {/* 池底标签 */}
        <div
          style={{
            position: 'absolute',
            top: 205,
            width: '100%',
            textAlign: 'center',
            fontFamily: SANS,
            fontSize: 24,
            letterSpacing: 4,
            color: 'rgba(237,233,220,0.5)',
          }}
        >
          同和钱庄 · 柜上
        </div>
        {/* 水位 */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${poolH * 100}%`,
            background: `linear-gradient(180deg, rgba(143,174,202,0.75) 0%, rgba(94,124,154,0.55) 100%)`,
          }}
        />
        {/* s03：三成现银高亮 */}
        {isReserve && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '30%',
              height: `${0.62 * reservePct * 100}%`,
              background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.gold} 100%)`,
              boxShadow: '0 0 40px rgba(207,162,74,0.5)',
            }}
          />
        )}
        {isReserve && (
          <div
            style={{
              position: 'absolute',
              bottom: 150,
              left: 20,
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 40,
              color: C.goldBright,
              opacity: reservePct,
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
          >
            三成现银 · 压在柜上
          </div>
        )}
      </div>

      {/* s03 进出流水 */}
      {isReserve && (
        <div
          style={{
            position: 'absolute',
            top: 1060,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            opacity: interpolate(frame, [150, 180], [0, 1], clamp),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: C.blueBright }} />
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paper }}>天天有人存</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: C.redBright }} />
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.paper }}>天天有人取</div>
          </div>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 34, color: C.goldBright }}>
            进的多、出的少
          </div>
        </div>
      )}
      {isReserve && (
        <div
          style={{
            position: 'absolute',
            top: 1180,
            width: '100%',
            textAlign: 'center',
            opacity: interpolate(frame, [380, 408, 430, 444], [0, 1, 1, 0], clamp),
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 48,
            color: C.paper,
          }}
        >
          二十年，<span style={{ color: C.goldBright }}>没出过一次岔子</span>
        </div>
      )}

      {/* s02 随时 vs 三年 */}
      {!isReserve && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 1080,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 70,
              opacity: interpolate(frame, [430, 458], [0, 1], clamp),
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.blueBright }}>存户的银子</div>
              <div style={{ marginTop: 6, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: C.paper }}>随时能取</div>
            </div>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: C.redBright, alignSelf: 'center' }}>≠</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: SANS, fontSize: 26, color: C.goldBright }}>贷出去的款</div>
              <div style={{ marginTop: 6, fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: C.paper }}>三年才回</div>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: 1240,
              width: '100%',
              textAlign: 'center',
              opacity: interpolate(frame, [470, 496, 508, 510], [0, 1, 1, 0], clamp),
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 46,
              color: C.redBright,
            }}
          >
            命门，就卡在随时和三年中间
          </div>
        </>
      )}
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 谣言传播（s05：三条街七家茶馆，越传越歪） ============
const SpreadScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const mutations = [
    { at: 255, text: '“丝行掌柜跑了”' },
    { at: 315, text: '“钱庄亏了三万两”' },
    { at: 390, text: '“官府要封账”' },
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 34%, rgba(184,96,80,0.10) 0%, rgba(20,25,32,0) 60%)' }} />
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
        半天，过三条街，进七家茶馆
      </div>

      {/* 街道线 + 七个节点 */}
      <svg width={1080} height={300} style={{ position: 'absolute', top: 430, left: 0 }}>
        <path d="M 90 150 Q 540 60 990 150" fill="none" stroke="rgba(143,174,202,0.4)" strokeWidth={8} strokeLinecap="round" />
        {Array.from({ length: 7 }, (_, i) => {
          const t = i / 6;
          const x = 90 + t * 900;
          const y = 150 - Math.sin(Math.PI * t) * 90;
          const lit = interpolate(frame, [30 + i * 14, 48 + i * 14], [0, 1], clamp);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={26 + 8 * lit}
              fill={`rgba(232,96,80,${0.15 + 0.7 * lit})`}
              stroke={`rgba(237,233,220,${0.2 + 0.6 * lit})`}
              strokeWidth={3}
            />
          );
        })}
      </svg>
      <div style={{ position: 'absolute', top: 415, left: 30, fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: C.blueBright }}>
        同和门口
      </div>
      <div style={{ position: 'absolute', top: 545, left: 905, fontFamily: SERIF, fontWeight: 700, fontSize: 30, color: C.redBright }}>
        茶馆
      </div>

      {/* 添料气泡 */}
      <div style={{ position: 'absolute', top: 800, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
        {mutations.map((m, i) => {
          const s = spring({ frame: frame - m.at, fps: 30, config: { damping: 100 } });
          const op = interpolate(frame, [m.at, m.at + 10], [0, 1], clamp);
          const y = interpolate(s, [0, 1], [26, 0]);
          if (frame < m.at) return null;
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                background: 'rgba(20,25,32,0.95)',
                border: `2.5px solid ${C.red}`,
                borderRadius: 999,
                padding: '16px 42px',
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: 38,
                color: C.paper,
                boxShadow: '0 0 34px rgba(184,52,52,0.28)',
              }}
            >
              {m.text}
            </div>
          );
        })}
      </div>

      {/* 没人去查 */}
      <div
        style={{
          position: 'absolute',
          top: 1150,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [420, 448, 500, 512], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 54,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
        }}
      >
        查，要走路；<span style={{ color: C.redBright }}>信，只要点头</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 聪明人的账（s06：吴老板的两条路） ============
const SmartMathScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const wuOp = interpolate(frame, [30, 58], [0, 1], clamp);
  const doubtOp = interpolate(frame, [150, 178], [0, 1], clamp);
  const whatIfS = spring({ frame: frame - 220, fps: 30, config: { damping: 13, stiffness: 120 } });
  const whatIfScale = interpolate(whatIfS, [0, 1], [2.2, 1]);
  const whatIfOp = interpolate(frame, [220, 228], [0, 1], clamp);
  const optOp = interpolate(frame, [380, 408], [0, 1], clamp);
  const conOp = interpolate(frame, [480, 508, 515, 521], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: '#0C0F13', opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 30%, rgba(143,174,202,0.10) 0%, rgba(12,15,19,0) 58%)' }} />
      <div
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          textAlign: 'center',
          opacity: wuOp,
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 45,
          letterSpacing: 8,
          color: C.paperDim,
        }}
      >
        绸缎庄的吴老板 · 头一个赶到
      </div>
      <div
        style={{
          position: 'absolute',
          top: 420,
          width: '100%',
          textAlign: 'center',
          opacity: doubtOp,
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 44,
          color: 'rgba(237,233,220,0.85)',
        }}
      >
        他其实不信
      </div>

      {/* 万一呢 */}
      <div
        style={{
          position: 'absolute',
          top: 560,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: whatIfOp,
        }}
      >
        <div
          style={{
            transform: `scale(${whatIfScale}) rotate(-3deg)`,
            background: C.red,
            borderRadius: 18,
            padding: '20px 50px',
            boxShadow: '0 18px 70px rgba(184,52,52,0.45)',
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 74,
            color: '#F7EFDE',
            letterSpacing: 8,
          }}
        >
          万一呢？
        </div>
      </div>

      {/* 两条路 */}
      <div
        style={{
          position: 'absolute',
          top: 850,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 50,
          opacity: optOp,
        }}
      >
        <div
          style={{
            width: 420,
            padding: '28px 34px',
            borderRadius: 18,
            background: 'rgba(207,162,74,0.12)',
            border: `3px solid ${C.gold}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: C.goldBright }}>今天取</div>
          <div style={{ marginTop: 12, fontFamily: SERIF, fontWeight: 600, fontSize: 32, color: C.paper }}>
            顶多折几个利钱
          </div>
        </div>
        <div
          style={{
            width: 420,
            padding: '28px 34px',
            borderRadius: 18,
            background: 'rgba(184,52,52,0.12)',
            border: `3px solid ${C.red}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: C.redBright }}>不取</div>
          <div style={{ marginTop: 12, fontFamily: SERIF, fontWeight: 600, fontSize: 32, color: C.paper }}>
            明天人人去取，本都捞不回
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1200,
          width: '100%',
          textAlign: 'center',
          opacity: conOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 52,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
        }}
      >
        这笔账，<span style={{ color: C.redBright }}>傻子才不算</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 池子放干（s08：挤兑机制） ============
const DrainScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  // 三成现银 0-195f 放干；锁死贷款 270f；砸门 435f；判词 495f
  const reserveH = interpolate(frame, [30, 195], [0.62, 0], clamp);
  const outflow = interpolate(frame, [30, 195], [0, 1], clamp);
  const locksOp = interpolate(frame, [270, 300], [0, 1], clamp);
  const shake =
    frame > 435 && frame < 470
      ? Math.sin((frame - 435) * 1.6) * (470 - frame) * 0.06
      : 0;
  const verdictOp = interpolate(frame, [495, 522, 540, 542], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: '#0C0F13', opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 34%, rgba(184,52,52,${interpolate(frame, [30, 120], [0, 0.14], clamp)}) 0%, rgba(12,15,19,0) 58%)`,
        }}
      />
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
        柜上，一炷香见了底
      </div>

      {/* 资金池 */}
      <div
        style={{
          position: 'absolute',
          top: 470,
          left: 130,
          width: 820,
          height: 320,
          borderRadius: 20,
          border: `3px solid ${C.chipBorder}`,
          background: 'rgba(20,25,32,0.92)',
          overflow: 'hidden',
          transform: `translateX(${shake}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${reserveH * 100}%`,
            background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.gold} 100%)`,
            boxShadow: '0 0 34px rgba(207,162,74,0.4)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 20,
            width: '100%',
            textAlign: 'center',
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 44,
            color: reserveH > 0.1 ? C.goldBright : C.redBright,
          }}
        >
          {reserveH > 0.05 ? '三成现银' : '柜上见底'}
        </div>
      </div>

      {/* 取款人潮（红色箭头流出） */}
      <div
        style={{
          position: 'absolute',
          top: 850,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 26,
          opacity: interpolate(frame, [30, 60], [0, 1], clamp),
        }}
      >
        {Array.from({ length: 9 }, (_, i) => {
          const t = Math.max(0, Math.min(1, outflow * 1.5 - i * 0.06));
          const y = interpolate(t, [0, 1], [0, -60]);
          return (
            <div
              key={i}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: `rgba(232,96,80,${0.25 + 0.6 * t})`,
                border: `2.5px solid rgba(232,96,80,${0.3 + 0.7 * t})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: SERIF,
                fontSize: 26,
                color: C.paper,
                transform: `translateY(${y}px)`,
              }}
            >
              取
            </div>
          );
        })}
      </div>

      {/* 锁死的贷款 */}
      <div
        style={{
          position: 'absolute',
          top: 990,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 44,
          opacity: locksOp,
        }}
      >
        {['酒坊的窖里', '丝行的机上'].map((t, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '18px 30px',
              borderRadius: 16,
              background: 'rgba(20,25,32,0.94)',
              border: '2.5px solid #3A4048',
            }}
          >
            <div style={{ fontSize: 38 }}>🔒</div>
            <div>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 32, color: C.paper }}>{t}</div>
              <div style={{ fontFamily: SANS, fontSize: 22, color: 'rgba(237,233,220,0.55)' }}>锁在三年期契书里</div>
            </div>
          </div>
        ))}
      </div>

      {/* 判词 */}
      <div
        style={{
          position: 'absolute',
          top: 1170,
          width: '100%',
          textAlign: 'center',
          opacity: verdictOp,
        }}
      >
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 40, color: 'rgba(237,233,220,0.8)' }}>
          不是资不抵债
        </div>
        <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: C.redBright }}>
          是拿不出今天的现钱
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 自我实现的预言（s10：闭环） ============
const PROP_NODES = [
  { x: 90, y: 430, label: '一句\n闲话' },
  { x: 580, y: 430, label: '人人\n怕倒' },
  { x: 580, y: 830, label: '都去\n取钱' },
  { x: 90, y: 830, label: '钱庄\n真的倒' },
];

const ProphecyScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const cycStart = 60;
  const step = 80;
  const active = frame < cycStart ? -1 : Math.floor((frame - cycStart) / step) % 4;
  const centerOp = interpolate(frame, [360, 392, 470, 492], [0, 1, 1, 0], clamp);
  const punchOp = interpolate(frame, [440, 466, 484, 492], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: '#0C0F13', opacity: fadeIn }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 42%, rgba(184,52,52,${interpolate(frame, [cycStart, cycStart + 80], [0, 0.13], clamp)}) 0%, rgba(12,15,19,0) 60%)`,
        }}
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
        一句闲话，分两步杀人
      </div>

      <svg width={1080} height={1300} style={{ position: 'absolute', top: 320, left: 0 }}>
        <ellipse
          cx={540}
          cy={670}
          rx={330}
          ry={290}
          fill="none"
          stroke="rgba(207,162,74,0.35)"
          strokeWidth={3}
          strokeDasharray="14 18"
          strokeDashoffset={-frame * 1.4}
        />
      </svg>

      {PROP_NODES.map((n, i) => {
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
              background: isActive ? 'rgba(184,52,52,0.16)' : 'rgba(20,25,32,0.9)',
              border: `2.5px solid ${isActive ? C.red : '#3A4048'}`,
              borderRadius: 18,
              boxShadow: isActive ? '0 0 44px rgba(184,52,52,0.4)' : 'none',
              transform: `scale(${isActive ? 1.05 : 0.98})`,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 38,
              color: isActive ? C.paper : 'rgba(237,233,220,0.66)',
              lineHeight: 1.45,
              whiteSpace: 'pre',
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
          top: 570,
          left: 380,
          width: 320,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.red,
          borderRadius: 16,
          boxShadow: '0 16px 60px rgba(184,52,52,0.45)',
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 42,
          letterSpacing: 4,
          color: '#F7EFDE',
          textAlign: 'center',
          lineHeight: 1.4,
          opacity: centerOp,
          transform: `rotate(-3deg) scale(${interpolate(
            spring({ frame: frame - 360, fps: 30, config: { damping: 12, stiffness: 120 } }),
            [0, 1],
            [1.5, 1]
          )})`,
        }}
      >
        自我实现
        <br />
        的预言
      </div>

      <div
        style={{
          position: 'absolute',
          top: 1230,
          width: '100%',
          textAlign: 'center',
          opacity: punchOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 52,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.75)',
        }}
      >
        你信它倒，<span style={{ color: C.redBright }}>它就真的倒</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ 联保网络（s11） ============
const MutualScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  // 邻居钱庄 90-195f 亮起；金流箭头 345f；官银 420f
  const neighbors = Array.from({ length: 8 }, (_, i) => {
    const ang = (Math.PI * 2 * i) / 8 - Math.PI / 2;
    return { x: 540 + Math.cos(ang) * 330, y: 660 + Math.sin(ang) * 250 };
  });
  const arrowsT = interpolate(frame, [330, 400], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, rgba(207,162,74,0.12) 0%, rgba(20,25,32,0) 58%)' }} />
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
        十几家钱庄 · 联保的约
      </div>

      {/* 连线 */}
      <svg width={1080} height={1400} style={{ position: 'absolute', top: 340, left: 0 }}>
        {neighbors.map((n, i) => {
          const lit = interpolate(frame, [90 + i * 13, 110 + i * 13], [0, 1], clamp);
          return (
            <line
              key={i}
              x1={540}
              y1={320}
              x2={n.x}
              y2={n.y + 320}
              stroke={`rgba(207,162,74,${0.15 + 0.5 * lit + 0.3 * arrowsT})`}
              strokeWidth={2.5 + 2 * arrowsT}
              strokeDasharray={arrowsT > 0.3 ? undefined : '10 12'}
            />
          );
        })}
      </svg>

      {/* 中心：同和（被挤） */}
      <div
        style={{
          position: 'absolute',
          top: 560,
          left: 400,
          width: 280,
          height: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(184,52,52,0.2)',
          border: `3px solid ${C.red}`,
          borderRadius: 16,
          boxShadow: `0 0 ${30 + 20 * Math.sin(frame * 0.4)}px rgba(184,52,52,0.4)`,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 40,
          color: C.paper,
        }}
      >
        同和 · 遭挤兑
      </div>

      {/* 邻居节点 */}
      {neighbors.map((n, i) => {
        const lit = interpolate(frame, [90 + i * 13, 110 + i * 13], [0, 1], clamp);
        const s = spring({ frame: frame - (90 + i * 13), fps: 30, config: { damping: 100 } });
        const scale = interpolate(s, [0, 1], [0.6, 1]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: n.x - 90,
              top: n.y + 320 - 44,
              width: 180,
              height: 88,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(20,25,32,0.94)',
              border: `2.5px solid rgba(207,162,74,${0.25 + 0.75 * lit})`,
              borderRadius: 14,
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 28,
              color: `rgba(237,233,220,${0.3 + 0.7 * lit})`,
              transform: `scale(${scale})`,
              opacity: lit,
            }}
          >
            钱庄 {i + 1}
          </div>
        );
      })}

      {/* 替它兑银子 */}
      <div
        style={{
          position: 'absolute',
          top: 1180,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [345, 373, 415, 440], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 54,
          color: C.goldBright,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
        }}
      >
        其余各家开柜，替它兑银子
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1290,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [420, 448, 460, 466], [0, 1, 1, 0], clamp),
        }}
      >
        <div
          style={{
            border: `1.5px solid ${C.gold}`,
            borderRadius: 999,
            padding: '10px 30px',
            fontFamily: SANS,
            fontSize: 26,
            letterSpacing: 2,
            color: C.goldBright,
            background: 'rgba(207,162,74,0.08)',
          }}
        >
          官府再压一笔官银做底
        </div>
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
          filter: 'blur(38px) brightness(0.32) saturate(0.6)',
          transform: 'scale(1.25)',
        }}
      />
      <AbsoluteFill style={{ background: 'rgba(12,15,19,0.5)' }} />
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
            border: '1px solid rgba(237,233,220,0.18)',
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
            background: 'rgba(12,15,19,0.86)',
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
        <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: 3, color: 'rgba(237,233,220,0.62)' }}>
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
    <AbsoluteFill style={{ background: '#0C0F13', opacity: fadeIn }}>
      <RealPhoto src="real/real_run1933.jpg" label="1933 · 一年倒了四千家" source="真实照片 · 大萧条时期的银行挤兑" from={0} to={255} idx={0} />
      <RealPhoto src="real/real_svb_crowd.jpg" label="2023 · 硅谷银行" source="真实照片 · SVB 门口的人群与媒体" from={255} to={405} idx={1} />
      <RealPhoto src="real/real_svb_closed.jpg" label="两天，被挤倒" source="真实照片 · SVB 关门告示与 FDIC" from={405} to={540} idx={2} />
      <div
        style={{
          position: 'absolute',
          top: 480,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [532, 558, 578, 586], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 66,
          color: C.paper,
          textShadow: '0 6px 40px rgba(0,0,0,0.95)',
          zIndex: 5,
        }}
      >
        排队的背影
        <div style={{ marginTop: 14, fontSize: 56, color: C.redBright }}>是同一批人</div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s14 概念揭晓印章：银行挤兑 ============
const StampScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const stampAt = 84; // “叫银行挤兑”发音时刻
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
    <AbsoluteFill style={{ background: '#08090C' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(184,52,52,${interpolate(
            frame,
            [stampAt, stampAt + 20],
            [0, 0.16],
            clamp
          )}) 0%, rgba(8,9,12,0) 55%)`,
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
          color: 'rgba(237,233,220,0.88)',
        }}
      >
        这个好银行也会得的猝死病
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
              boxShadow: '0 22px 90px rgba(184,52,52,0.5), inset 0 0 60px rgba(0,0,0,0.18)',
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
              银行挤兑
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
        <div style={{ fontFamily: SANS, fontSize: 28, letterSpacing: 12, color: 'rgba(237,233,220,0.55)' }}>
          BANK RUN
        </div>
        <div style={{ marginTop: 16, fontFamily: SERIF, fontSize: 27, letterSpacing: 5, color: C.gold }}>
          金融经济学 · Diamond-Dybvig 1983 / 2022 诺贝尔经济学奖
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
        background: isStory ? C.chipBg : 'rgba(207,162,74,0.14)',
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
  const punchOp = interpolate(frame, [560, 590, 650, 680], [0, 1, 1, 0], clamp);
  const rows: [string, string][] = [
    ['存随时取 · 贷三年回', '期限转换'],
    ['柜上压三成现银', '存款准备金'],
    ['一句闲话', '信心冲击'],
    ['人人怕倒都去取', '个体理性'],
  ];
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 18%, rgba(207,162,74,0.09) 0%, rgba(20,25,32,0) 55%)' }} />
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
        寓 言 <span style={{ color: C.goldBright }}>→</span> 经济学
      </div>
      <div style={{ position: 'absolute', top: 470, width: '100%', height: 640 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ position: 'absolute', top: i * 158, width: '100%', height: 90 }}>
            <MapRow left={r[0]} right={r[1]} at={60 + i * 95} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1100,
          width: '100%',
          textAlign: 'center',
          opacity: punchOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 54,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.7)',
        }}
      >
        个体理性，<span style={{ color: C.redBright }}>凑成集体死局</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s16 两个结局（Diamond-Dybvig） ============
const EquilibriaScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const scholarsOp = interpolate(frame, [100, 130], [0, 1], clamp);
  const goodOp = interpolate(frame, [380, 410], [0, 1], clamp);
  const badOp = interpolate(frame, [480, 510], [0, 1], clamp);
  const choiceOp = interpolate(frame, [620, 648, 700, 726], [0, 1, 1, 0], clamp);
  const lenderOp = interpolate(frame, [730, 760, 795, 811], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 24%, rgba(207,162,74,0.11) 0%, rgba(20,25,32,0) 55%)' }} />
      <div
        style={{
          position: 'absolute',
          top: 300,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: interpolate(frame, [10, 34], [0, 1], clamp),
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
            background: 'rgba(207,162,74,0.08)',
          }}
        >
          2022年诺贝尔经济学奖
        </div>
      </div>

      {/* 学者卡 */}
      <div
        style={{
          position: 'absolute',
          top: 410,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: scholarsOp,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 22,
            alignItems: 'center',
            background: 'rgba(20,25,32,0.94)',
            border: `2.5px solid ${C.chipBorder}`,
            borderRadius: 16,
            padding: '20px 36px',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.paper }}>戴蒙德</div>
          <div style={{ fontFamily: SANS, fontSize: 30, color: 'rgba(237,233,220,0.5)' }}>×</div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.paper }}>迪布维格</div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: C.paperDim }}>把挤兑写成了数学</div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 545,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [330, 360], [0, 1], clamp),
          fontFamily: SERIF,
          fontWeight: 700,
          fontSize: 40,
          color: C.paperDim,
        }}
      >
        一家银行，天生有两个结局
      </div>

      {/* 两个结局 */}
      <div
        style={{
          position: 'absolute',
          top: 650,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 46,
        }}
      >
        <div
          style={{
            width: 430,
            padding: '28px 32px',
            borderRadius: 18,
            background: 'rgba(207,162,74,0.10)',
            border: `3px solid ${C.gold}`,
            textAlign: 'center',
            opacity: goodOp,
            transform: `translateY(${interpolate(spring({ frame: frame - 380, fps: 30, config: { damping: 100 } }), [0, 1], [30, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 24, color: C.goldBright, letterSpacing: 3 }}>好结局</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: C.paper }}>人人相安</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: 'rgba(237,233,220,0.75)' }}>
            钱生钱 · 各取所需
          </div>
        </div>
        <div
          style={{
            width: 430,
            padding: '28px 32px',
            borderRadius: 18,
            background: 'rgba(184,52,52,0.10)',
            border: `3px solid ${C.red}`,
            textAlign: 'center',
            opacity: badOp,
            transform: `translateY(${interpolate(spring({ frame: frame - 480, fps: 30, config: { damping: 100 } }), [0, 1], [30, 0])}px)`,
          }}
        >
          <div style={{ fontFamily: SANS, fontSize: 24, color: C.redBright, letterSpacing: 3 }}>坏结局</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 900, fontSize: 40, color: C.paper }}>人人抢跑</div>
          <div style={{ marginTop: 10, fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: 'rgba(237,233,220,0.75)' }}>
            三天清盘 · 集体死局
          </div>
        </div>
      </div>

      {/* 站哪边 */}
      <div
        style={{
          position: 'absolute',
          top: 960,
          width: '100%',
          textAlign: 'center',
          opacity: choiceOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 54,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.75)',
        }}
      >
        站到哪边，不看银行好坏
        <div style={{ marginTop: 10, fontSize: 58, color: C.goldBright }}>看大家信哪边</div>
      </div>

      {/* 最后贷款人 */}
      <div
        style={{
          position: 'absolute',
          top: 1180,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          opacity: lenderOp,
        }}
      >
        <div
          style={{
            background: 'rgba(20,25,32,0.95)',
            border: `3px solid ${C.blue}`,
            borderRadius: 16,
            padding: '20px 36px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.blueBright }}>
            局外人：中央银行
          </div>
          <div style={{ marginTop: 8, fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: C.paperDim }}>
            人心塌的时候掏钱出来 · 名号：<span style={{ color: C.goldBright }}>最后贷款人</span>
          </div>
        </div>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s17 三道闸 ============
const GatesScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const gates = [
    { at: 90, no: '第一道', name: '准备金', note: '柜上先压一成现银' },
    { at: 240, no: '第二道', name: '存款保险', note: '五十万以内，国家兜底' },
    { at: 390, no: '第三道', name: '最后贷款人', note: '央行开柜' },
  ];
  const punchOp = interpolate(frame, [545, 573, 600, 610], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.inkSoft, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 26%, rgba(94,124,154,0.12) 0%, rgba(20,25,32,0) 58%)' }} />
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
        现代银行的三道闸
      </div>
      <div style={{ position: 'absolute', top: 430, left: 90, right: 90, display: 'flex', flexDirection: 'column', gap: 30 }}>
        {gates.map((g, i) => {
          const s = spring({ frame: frame - g.at, fps: 30, config: { damping: 100 } });
          const op = interpolate(frame, [g.at, g.at + 12], [0, 1], clamp);
          const y = interpolate(s, [0, 1], [34, 0]);
          if (frame < g.at) return null;
          return (
            <div
              key={i}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '24px 32px',
                background: 'rgba(20,25,32,0.93)',
                border: `2.5px solid ${C.blue}`,
                borderRadius: 16,
                boxShadow: '0 0 30px rgba(94,124,154,0.18)',
              }}
            >
              <div
                style={{
                  width: 132,
                  textAlign: 'center',
                  fontFamily: SANS,
                  fontSize: 24,
                  color: 'rgba(237,233,220,0.55)',
                  letterSpacing: 2,
                }}
              >
                {g.no}
              </div>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 44, color: C.blueBright, minWidth: 300 }}>
                {g.name}
              </div>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: 'rgba(237,233,220,0.75)' }}>
                {g.note}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1000,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [450, 478, 520, 545], [0, 1, 1, 0], clamp),
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 36,
          color: C.paperDim,
        }}
      >
        你不用跑，跑的理由就没了
      </div>
      <div
        style={{
          position: 'absolute',
          top: 1150,
          width: '100%',
          textAlign: 'center',
          opacity: punchOp,
          fontFamily: SERIF,
          fontWeight: 900,
          fontSize: 50,
          color: C.paper,
          textShadow: '0 4px 26px rgba(0,0,0,0.75)',
        }}
      >
        手机里那串数字，<span style={{ color: C.goldBright }}>全靠三道闸撑着</span>
      </div>
      <CaptionView scene={scene} />
    </AbsoluteFill>
  );
};

// ============ s18 结尾 CTA ============
const OutroScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 8], [0, 1], clamp);
  const quoteOp = interpolate(frame, [16, 34, 370, 402], [0, 1, 1, 0], clamp);
  const ctaOp = interpolate(frame, [410, 442], [0, 1], clamp);
  const ctaY = interpolate(ctaOp, [0, 1], [-36, 0]);
  const pulse = 1 + Math.sin(Math.max(0, frame - 442) * 0.06) * 0.02;
  const endFade = interpolate(frame, [scene.duration - 26, scene.duration], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.ink, opacity: fadeIn }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 36%, rgba(207,162,74,0.14) 0%, rgba(14,17,20,0) 60%)' }} />
      <div style={{ position: 'absolute', top: 410, width: '100%', textAlign: 'center', opacity: quoteOp }}>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 40, color: 'rgba(237,233,220,0.8)' }}>
          同和钱庄死于一句话
          <br />
          现代银行活在三道闸
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 74,
            color: C.paper,
          }}
        >
          信心，聚起来要二十年
        </div>
        <div
          style={{
            marginTop: 20,
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 84,
            color: C.redBright,
          }}
        >
          散掉，只要一个上午
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
            boxShadow: '0 14px 60px rgba(207,162,74,0.55)',
            transform: `scale(${pulse})`,
          }}
        >
          关注我
        </div>
        <div style={{ marginTop: 46, fontFamily: SERIF, fontWeight: 700, fontSize: 47, color: C.paper }}>
          下一期：<span style={{ color: C.redBright }}>通货膨胀</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: SERIF, fontSize: 33, color: 'rgba(237,233,220,0.7)' }}>
          最后贷款人的钱从哪来，印多了会怎样
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
    {scene.type === 'pool' && <PoolScene scene={scene} mode="pool" />}
    {scene.type === 'reserve' && <PoolScene scene={scene} mode="reserve" />}
    {scene.type === 'spread' && <SpreadScene scene={scene} />}
    {scene.type === 'smartMath' && <SmartMathScene scene={scene} />}
    {scene.type === 'drain' && <DrainScene scene={scene} />}
    {scene.type === 'prophecy' && <ProphecyScene scene={scene} />}
    {scene.type === 'mutual' && <MutualScene scene={scene} />}
    {scene.type === 'real' && <RealScene scene={scene} />}
    {scene.type === 'titleReveal' && <StampScene scene={scene} />}
    {scene.type === 'map1' && <Map1Scene scene={scene} />}
    {scene.type === 'equilibria' && <EquilibriaScene scene={scene} />}
    {scene.type === 'gates' && <GatesScene scene={scene} />}
    {scene.type === 'outro' && <OutroScene scene={scene} />}
    {scene.id !== 's01' && scene.id !== 's14' && <Watermark />}
  </>
);

export const BankVideo: React.FC = () => {
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
