import React from 'react';
import {
  AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame,
  interpolate, spring, Easing,
} from 'remotion';
import './fonts';
import timeline from './timeline.json';

// ============ 调色板：夜靛青 · 琥珀金 · 朱砂红（明代边城暮色） ============
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
  water: 'rgba(64,110,150,0.55)',
};

const SERIF = "'SC', 'Noto Serif SC', serif";
const SANS = "'SANS', 'Noto Sans SC', sans-serif";

type Caption = { text: string; start: number; duration: number };
type Scene = {
  id: string; type: string; image: string | null;
  narration: string; emphasis: string[];
  start: number; duration: number; audioFrames: number;
  captions: Caption[]; ui: any;
};

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

// 强调色：故事危机期绛红，转机与概念期琥珀金
const GOLD_SCENES = new Set(['s11', 's12', 's13', 's14', 's15', 's16', 's17', 's18']);
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
    <span key={i} style={p.em ? { color, fontWeight: 900 } : undefined}>{p.t}</span>
  ));
}

// ============ 底部字幕带（y1302 独立区，与画面内容物理隔离） ============
const CaptionView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const cap = scene.captions.find((c) => frame >= c.start && frame < c.start + c.duration);
  if (!cap) return null;
  const prog = frame - cap.start;
  const opacity = interpolate(prog, [0, 3, cap.duration - 4, cap.duration], [0, 1, 1, 0], clamp);
  const y = interpolate(spring({ frame: prog, fps: 30, config: { damping: 100 } }), [0, 1], [14, 0]);
  const lines = cap.text.split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length));
  const fontSize = maxLen > 12 ? 50 : maxLen > 10 ? 54 : 58;
  return (
    <div style={{
      position: 'absolute', top: 1302, width: '100%',
      display: 'flex', justifyContent: 'center', opacity, alignItems: 'center', flexDirection: 'column',
      transform: `translateY(${y}px)`,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontSize, fontFamily: SERIF, fontWeight: 600, color: C.paper,
          letterSpacing: 2, lineHeight: 1.32, textShadow: '0 3px 16px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)',
          textAlign: 'center',
        }}>
          {renderEmphasis(line, scene.emphasis, emphColor(scene.id))}
        </div>
      ))}
    </div>
  );
};

// ============ 顶部水印（y188，独立区） ============
const Watermark: React.FC = () => (
  <div style={{
    position: 'absolute', top: 178, width: '100%',
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: C.gold,
      border: `1.5px solid ${C.chipBorder}`, borderRadius: 8, padding: '6px 18px',
      letterSpacing: 3, background: C.chipBg,
    }}>概念当铺</div>
    <div style={{ fontFamily: SANS, fontSize: 24, color: C.gray, letterSpacing: 4 }}>经济学寓言</div>
  </div>
);

// ============ 通用背景 ============
const Backdrop: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.inkSoft} 0%, ${C.ink} 34%, #10131C 72%, ${C.inkSoft} 100%)` }}>
    {children}
  </AbsoluteFill>
);

// 顶部弱光晕（置于背景之上、内容之下）
const Glow: React.FC = () => (
  <div style={{
    position: 'absolute', top: -140, left: '50%', transform: 'translateX(-50%)',
    width: 900, height: 420, borderRadius: '50%',
    background: 'radial-gradient(ellipse at center, rgba(217,166,83,0.10) 0%, rgba(217,166,83,0) 70%)',
  }} />
);

// ============ 水墨插画场景（Ken Burns） ============
const ImageScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const prog = frame / Math.max(1, scene.duration);
  const scale = interpolate(prog, [0, 1], [1.06, 1.16]);
  const tx = interpolate(prog, [0, 1], [-12, 12]);
  return (
    <AbsoluteFill>
      <Img src={staticFile(`images/${scene.image}.png`)} style={{
        position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
        transform: `scale(${scale}) translateX(${tx}px)`,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,16,22,0.42) 0%, rgba(14,16,22,0) 30%, rgba(14,16,22,0) 62%, rgba(14,16,22,0.55) 100%)' }} />
    </AbsoluteFill>
  );
};

// ============ 开场钩子（大字） ============
const HookScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const lines = ui.lines || [];
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 46,
      }}>
        {lines.map((line: string, i: number) => {
          const sp = spring({ frame: frame - 8 - i * 16, fps: 30, config: { damping: 14 } });
          const size = line.length > 7 ? 108 : 128;
          return (
            <div key={i} style={{
              fontFamily: SERIF, fontWeight: 900, fontSize: size, letterSpacing: 8,
              color: i === lines.length - 1 ? C.redBright : C.paper,
              textShadow: '0 6px 30px rgba(0,0,0,0.8)',
              transform: `scale(${interpolate(sp, [0, 1], [0.7, 1])}) translateY(${interpolate(sp, [0, 1], [40, 0])}px)`,
              opacity: interpolate(sp, [0, 1], [0, 1]),
            }}>{line}</div>
          );
        })}
        <div style={{
          fontFamily: SANS, fontSize: 40, color: C.paperDim, letterSpacing: 6, marginTop: 20,
          opacity: interpolate(frame, [40, 70], [0, 1], clamp),
        }}>{ui.sub}</div>
        <div style={{
          width: 220, height: 4, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`,
          marginTop: 30, opacity: interpolate(frame, [30, 60], [0, 1], clamp),
        }} />
      </div>
    </Backdrop>
  );
};

// ============ 印章揭晓 ============
const RevealScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const sealIn = spring({ frame: frame - 20, fps: 30, config: { damping: 9, stiffness: 120 } });
  const sealScale = interpolate(sealIn, [0, 1], [2.4, 1]);
  const sealRot = interpolate(sealIn, [0, 1], [-18, -8]);
  const wordIn = spring({ frame: frame - 70, fps: 30, config: { damping: 15 } });
  const shine = interpolate(frame, [90, 120, 150], [0, 1, 0], clamp);
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 60,
      }}>
        <div style={{
          width: 300, height: 300, borderRadius: 24,
          border: `9px solid ${C.red}`, position: 'relative',
          transform: `scale(${sealScale}) rotate(${sealRot}deg)`,
          opacity: interpolate(sealIn, [0, 1], [0, 1]),
          boxShadow: `0 0 ${60 + shine * 50}px rgba(199,67,54,${0.3 + shine * 0.3})`,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: SERIF, fontWeight: 900, fontSize: 92, color: C.red, letterSpacing: 8,
          }}>{ui.word?.slice(0, 2)}</div>
          <div style={{
            fontFamily: SERIF, fontWeight: 900, fontSize: 92, color: C.red, letterSpacing: 8,
            position: 'absolute', bottom: 28,
          }}>{ui.word?.slice(2, 4)}</div>
        </div>
        <div style={{
          fontFamily: SERIF, fontWeight: 900, fontSize: 104, color: C.paper, letterSpacing: 14,
          transform: `translateY(${interpolate(wordIn, [0, 1], [50, 0])}px)`,
          opacity: interpolate(wordIn, [0, 1], [0, 1]),
          textShadow: '0 6px 30px rgba(0,0,0,0.8)',
        }}>{ui.word}</div>
        <div style={{
          fontFamily: SANS, fontSize: 34, color: C.gold, letterSpacing: 10,
          opacity: interpolate(frame, [100, 130], [0, 1], clamp),
        }}>{ui.en}</div>
        <div style={{
          fontFamily: SERIF, fontSize: 40, color: C.paperDim, letterSpacing: 2, marginTop: 10,
          opacity: interpolate(frame, [130, 160], [0, 1], clamp),
        }}>{ui.sub}</div>
      </div>
    </Backdrop>
  );
};

// ============ 概念纠正（错误说法 vs 正确说法） ============
const ConceptScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const wIn = spring({ frame: frame - 10, fps: 30, config: { damping: 18 } });
  const rIn = spring({ frame: frame - 80, fps: 30, config: { damping: 18 } });
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40,
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: C.paper, letterSpacing: 10, textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
          {ui.title}
        </div>
        <div style={{
          width: 860, padding: '34px 40px', borderRadius: 20,
          background: 'rgba(21,24,34,0.88)', border: `2px solid rgba(155,148,138,0.4)`,
          opacity: interpolate(wIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(wIn, [0, 1], [30, 0])}px)`,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 30, color: C.gray, letterSpacing: 3, marginBottom: 10 }}>常见理解</div>
          <div style={{ fontFamily: SERIF, fontSize: 54, fontWeight: 600, color: C.paperDim, textDecoration: 'line-through', textDecorationColor: C.red, textDecorationThickness: 4 }}>
            {ui.wrong?.replace('以为：', '')}
          </div>
        </div>
        <div style={{
          width: 860, padding: '34px 40px', borderRadius: 20,
          background: 'rgba(42,30,20,0.9)', border: `2.5px solid ${C.gold}`,
          boxShadow: `0 0 50px rgba(217,166,83,0.25)`,
          opacity: interpolate(rIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(rIn, [0, 1], [30, 0])}px)`,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 30, color: C.gold, letterSpacing: 3, marginBottom: 10 }}>实际上</div>
          <div style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 900, color: C.goldBright }}>
            {ui.right?.replace('其实：', '')}
          </div>
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: 36, color: C.paperDim, letterSpacing: 2, textAlign: 'center',
          opacity: interpolate(frame, [150, 180], [0, 1], clamp), lineHeight: 1.5, width: 860,
        }}>{ui.note}</div>
      </div>
    </Backdrop>
  );
};

// ============ 货币数量论天平 ============
const BalanceScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const tilt = interpolate(frame, [120, 200], [0, -11], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const lGrow = interpolate(frame, [40, 140], [0, 1], clamp);
  const rShrink = interpolate(frame, [40, 140], [0, 1], clamp);
  const beamLen = 780;
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: C.paper, letterSpacing: 8, marginBottom: 18 }}>{ui.title}</div>
        <div style={{ fontFamily: SANS, fontSize: 36, color: C.gold, letterSpacing: 3, marginBottom: 40, padding: '12px 30px', border: `1.5px solid ${C.chipBorder}`, borderRadius: 12, background: C.chipBg }}>
          {ui.formula}
        </div>
        <div style={{ position: 'relative', width: beamLen + 160, height: 460 }}>
          {/* 横梁 */}
          <div style={{
            position: 'absolute', top: 100, left: 80, width: beamLen, height: 14, borderRadius: 7,
            background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright}, ${C.gold})`,
            transform: `rotate(${tilt}deg)`, transformOrigin: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }} />
          {/* 支点 */}
          <div style={{
            position: 'absolute', top: 107, left: 80 + beamLen / 2 - 30, width: 60, height: 230,
            background: `linear-gradient(180deg, ${C.gold} 0%, #8A6B32 100%)`, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
          }} />
          {/* 左盘：钱（渐重） */}
          <div style={{
            position: 'absolute', top: 120 + 90, left: 80 + beamLen * 0.14 - 130, width: 260,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            transform: `translateY(${Math.sin(tilt * Math.PI / 180) * beamLen * 0.36}px)`,
          }}>
            <div style={{ width: 240, height: 8, background: C.gold, opacity: 0.85 }} />
            <div style={{
              width: 200 + lGrow * 40, padding: '20px 10px', borderRadius: 14,
              background: 'rgba(42,30,20,0.95)', border: `2.5px solid ${C.gold}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              boxShadow: `0 ${8 + lGrow * 20}px ${20 + lGrow * 30}px rgba(0,0,0,0.5)`,
            }}>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: C.goldBright }}>{ui.left.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 24, color: C.paperDim, textAlign: 'center', lineHeight: 1.4 }}>{ui.left.note}</div>
            </div>
          </div>
          {/* 右盘：货（渐轻） */}
          <div style={{
            position: 'absolute', top: 120 + 90, left: 80 + beamLen * 0.86 - 130, width: 260,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            transform: `translateY(${-Math.sin(tilt * Math.PI / 180) * beamLen * 0.36}px)`,
          }}>
            <div style={{ width: 240, height: 8, background: C.gray, opacity: 0.85 }} />
            <div style={{
              width: 200 - rShrink * 40, padding: '20px 10px', borderRadius: 14,
              background: 'rgba(21,24,34,0.95)', border: `2px solid rgba(155,148,138,0.6)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 46, color: C.paperDim }}>{ui.right.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 24, color: C.gray, textAlign: 'center', lineHeight: 1.4 }}>{ui.right.note}</div>
            </div>
          </div>
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 600, color: C.redBright, letterSpacing: 4, marginTop: 26, opacity: interpolate(frame, [200, 230], [0, 1], clamp) }}>
          {ui.note}
        </div>
      </div>
    </Backdrop>
  );
};

// ============ 坎蒂隆水漫城池 ============
const CantillonScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const rise = interpolate(frame, [80, 260], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const waterY = 620 - rise * 320; // 水面从 y620 升到 y300
  const waveX = (frame * 6) % 120;
  return (
    <Backdrop>
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 78, color: C.paper, letterSpacing: 8, marginTop: 30 }}>{ui.title}</div>
        <div style={{ fontFamily: SERIF, fontSize: 38, color: C.paperDim, marginTop: 12, marginBottom: 24 }}>{ui.sub}</div>
        {/* 城池剖面 */}
        <div style={{ position: 'relative', width: 920, height: 560, borderRadius: 20, overflow: 'hidden', border: '2px solid rgba(155,148,138,0.35)', background: 'linear-gradient(180deg, rgba(21,24,34,0.6), rgba(14,16,22,0.6))' }}>
          {/* 高处：粮仓/大户 */}
          <div style={{
            position: 'absolute', top: 40, left: 60, width: 380, padding: '18px 24px', borderRadius: 14,
            background: 'rgba(42,30,20,0.95)', border: `2.5px solid ${C.gold}`,
            opacity: interpolate(frame, [30, 60], [0, 1], clamp),
          }}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.goldBright }}>{ui.first.label}</div>
            <div style={{ fontFamily: SANS, fontSize: 26, color: C.paperDim, marginTop: 6 }}>{ui.first.note}</div>
          </div>
          {/* 低处：普通人家 */}
          <div style={{
            position: 'absolute', top: 390, left: 480, width: 380, padding: '18px 24px', borderRadius: 14,
            background: 'rgba(30,16,16,0.95)', border: `2px solid ${C.red}`,
            opacity: interpolate(frame, [180, 220], [0, 1], clamp),
          }}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color: C.redBright }}>{ui.last.label}</div>
            <div style={{ fontFamily: SANS, fontSize: 26, color: C.paperDim, marginTop: 6 }}>{ui.last.note}</div>
          </div>
          {/* 水 */}
          <div style={{
            position: 'absolute', left: 0, right: 0, top: waterY, bottom: 0,
            background: `linear-gradient(180deg, ${C.water} 0%, rgba(40,80,120,0.75) 100%)`,
          }}>
            <svg width="920" height="40" viewBox="0 0 920 40" style={{ position: 'absolute', top: -20, left: -waveX }}>
              <path d="M0 20 Q 30 0 60 20 T 120 20 T 180 20 T 240 20 T 300 20 T 360 20 T 420 20 T 480 20 T 540 20 T 600 20 T 660 20 T 720 20 T 780 20 T 840 20 T 900 20 T 960 20 T 1020 20 T 1080 20 V 40 H 0 Z" fill={C.water} />
            </svg>
            <div style={{ position: 'absolute', top: 30, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 28, color: '#BFE0F5', letterSpacing: 6, opacity: 0.9 }}>
              新钱
            </div>
          </div>
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 600, color: C.goldBright, letterSpacing: 3, marginTop: 30, opacity: interpolate(frame, [240, 270], [0, 1], clamp) }}>
          有人趁水发财，有人被水没顶
        </div>
      </div>
    </Backdrop>
  );
};

// ============ 价格阶梯 ============
const PriceLadderScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const bars = ui.bars || [];
  const maxValue = Math.max(...bars.map((b: any) => b.value));
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 84, color: C.paper, letterSpacing: 8, marginBottom: 60 }}>{ui.title}</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 70, height: 500 }}>
          {bars.map((b: any, i: number) => {
            const h = (b.value / maxValue) * 400;
            const grow = interpolate(frame, [30 + i * 45, 100 + i * 45], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
            const flash = i === bars.length - 1;
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{
                  fontFamily: SERIF, fontWeight: 900, fontSize: 56,
                  color: flash ? C.redBright : C.goldBright,
                }}>{b.text}</div>
                <div style={{
                  width: 190, height: h * grow, borderRadius: '14px 14px 0 0',
                  background: flash
                    ? `linear-gradient(180deg, ${C.red} 0%, #7A1F18 100%)`
                    : `linear-gradient(180deg, ${C.gold} 0%, #7A5B26 100%)`,
                  boxShadow: flash ? '0 0 40px rgba(199,67,54,0.4)' : '0 0 30px rgba(217,166,83,0.25)',
                }} />
                <div style={{ fontFamily: SANS, fontSize: 30, color: C.paperDim, letterSpacing: 2 }}>{b.label}</div>
              </div>
            );
          })}
        </div>
        <div style={{ width: 800, height: 3, background: `linear-gradient(90deg, transparent, ${C.gray}, transparent)`, marginTop: 4 }} />
        <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 600, color: C.redBright, letterSpacing: 2, marginTop: 40, opacity: interpolate(frame, [180, 210], [0, 1], clamp) }}>
          {ui.note}
        </div>
      </div>
    </Backdrop>
  );
};

// ============ 良币退场 ============
const GreshamScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const lIn = spring({ frame: frame - 10, fps: 30, config: { damping: 16 } });
  const rIn = spring({ frame: frame - 50, fps: 30, config: { damping: 16 } });
  const sink = interpolate(frame, [100, 220], [0, 90], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const bills = Array.from({ length: 7 }, (_, i) => i);
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 56,
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 80, color: C.paper, letterSpacing: 8 }}>{ui.title}</div>
        <div style={{ display: 'flex', gap: 40 }}>
          {/* 银锭下沉 */}
          <div style={{
            width: 430, height: 470, borderRadius: 22, position: 'relative',
            background: 'rgba(21,24,34,0.9)', border: `2px solid rgba(155,148,138,0.5)`,
            opacity: interpolate(lIn, [0, 1], [0, 1]), overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40,
          }}>
            <div style={{
              width: 150, height: 150, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 30%, #F0EAD8 0%, #C9C2AC 55%, #8E8874 100%)`,
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              transform: `translateY(${sink}px)`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontFamily: SERIF, fontWeight: 900, fontSize: 62, color: '#5A5546',
            }}>{ui.left.char}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: C.paper, marginTop: 26 }}>{ui.left.label}</div>
            <div style={{ fontFamily: SANS, fontSize: 28, color: C.paperDim, marginTop: 10, textAlign: 'center', lineHeight: 1.5 }}>{ui.left.note}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(180deg, transparent, rgba(10,11,16,0.95))' }} />
          </div>
          {/* 宝钞飞舞 */}
          <div style={{
            width: 430, height: 470, borderRadius: 22, position: 'relative',
            background: 'rgba(42,30,20,0.9)', border: `2.5px solid ${C.gold}`,
            opacity: interpolate(rIn, [0, 1], [0, 1]), overflow: 'hidden',
            display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40,
          }}>
            {bills.map((i) => {
              const t = (frame * 0.9 + i * 90) % 500;
              const x = 60 + (i * 53) % 300;
              return (
                <div key={i} style={{
                  position: 'absolute', top: 480 - t, left: x, width: 76, height: 44, borderRadius: 6,
                  background: 'linear-gradient(135deg, #E8D9A8, #C9A75A)', opacity: 0.75,
                  transform: `rotate(${(i * 37 + frame * 3) % 40 - 20}deg)`,
                  border: '1.5px solid #A8853D',
                }} />
              );
            })}
            <div style={{
              width: 150, height: 150, borderRadius: '50%', zIndex: 2,
              background: `radial-gradient(circle at 35% 30%, ${C.goldBright} 0%, ${C.gold} 55%, #8A6B32 100%)`,
              boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontFamily: SERIF, fontWeight: 900, fontSize: 62, color: '#4A3510',
            }}>{ui.right.char}</div>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 48, color: C.goldBright, marginTop: 26, zIndex: 2 }}>{ui.right.label}</div>
            <div style={{ fontFamily: SANS, fontSize: 28, color: C.paperDim, marginTop: 10, textAlign: 'center', lineHeight: 1.5, zIndex: 2 }}>{ui.right.note}</div>
          </div>
        </div>
      </div>
    </Backdrop>
  );
};

// ============ 真实历史照片轮播 ============
const PhotosScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const photos = ui.photos || [];
  const per = Math.floor(scene.duration / photos.length);
  const idx = Math.min(photos.length - 1, Math.floor(frame / Math.max(1, per)));
  const local = frame - idx * per;
  const inOp = interpolate(local, [0, 12], [0, 1], clamp);
  const kenScale = interpolate(local, [0, per], [1.02, 1.1]);
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 34,
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: C.paper, letterSpacing: 8 }}>{ui.title}</div>
        <div key={idx} style={{
          width: 920, height: 560, borderRadius: 18, overflow: 'hidden',
          border: `2.5px solid ${C.chipBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          opacity: inOp,
        }}>
          <Img src={staticFile(`real/${photos[idx].file}.jpg`)} style={{
            width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kenScale})`,
          }} />
        </div>
        <div key={`cap-${idx}`} style={{
          fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: C.goldBright, letterSpacing: 1,
          opacity: interpolate(local, [8, 20], [0, 1], clamp), textAlign: 'center', width: 900,
        }}>{photos[idx].cap}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
          {photos.map((_: any, i: number) => (
            <div key={i} style={{
              width: i === idx ? 44 : 16, height: 8, borderRadius: 4,
              background: i === idx ? C.gold : 'rgba(155,148,138,0.4)',
            }} />
          ))}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 30, color: C.paperDim, letterSpacing: 2, opacity: interpolate(frame, [per * photos.length - 40, per * photos.length - 20], [0, 1], clamp) }}>
          {ui.note}
        </div>
      </div>
    </Backdrop>
  );
};

// ============ 通胀曲线（SVG 折线，支持双系列对比） ============
const CurveScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const points = ui.points || [];
  const points2 = ui.points2 || null;
  const W = 880, H = 500, padL = 70, padB = 70, padT = 30;
  const allVals = [...points.map((p: any) => p.y), ...(points2 ? points2.map((p: any) => p.y) : [])];
  const maxV = Math.max(...allVals) * 1.15;
  const xs = points.map((_: any, i: number) => padL + (i * (W - padL - 30)) / (points.length - 1));
  const ys = points.map((p: any) => H - padB - (p.y / maxV) * (H - padB - padT));
  const lineDraw = interpolate(frame, [60, 180], [0, 1], clamp);
  const full = xs.map((x: number, i: number) => `${x},${ys[i]}`).join(' ');
  const nVisible = 1 + Math.round(lineDraw * (points.length - 1));
  const visible = full.split(' ').slice(0, nVisible).join(' ');
  const flash = interpolate(frame, [200, 230, 260], [0, 1, 0], clamp);
  const xs2 = points2 ? points2.map((_: any, i: number) => padL + (i * (W - padL - 30)) / (points2.length - 1)) : [];
  const ys2 = points2 ? points2.map((p: any) => H - padB - (p.y / maxV) * (H - padB - padT)) : [];
  const full2 = xs2.map((x: number, i: number) => `${x},${ys2[i]}`).join(' ');
  const visible2 = full2.split(' ').slice(0, nVisible).join(' ');
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 30,
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 80, color: C.paper, letterSpacing: 8 }}>{ui.title}</div>
        <div style={{ fontFamily: SANS, fontSize: 32, color: C.paperDim, letterSpacing: 3 }}>{ui.subtitle}</div>
        <div style={{ width: W, height: H, position: 'relative' }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
              <line key={i} x1={padL - 10} x2={W - 20} y1={H - padB - r * (H - padB - padT)} y2={H - padB - r * (H - padB - padT)} stroke="rgba(155,148,138,0.25)" strokeWidth="1.5" />
            ))}
            <line x1={padL - 10} x2={W - 20} y1={H - padB} y2={H - padB} stroke="rgba(155,148,138,0.6)" strokeWidth="2.5" />
            {ui.yLabels ? ui.yLabels.map((t: string, i: number) => {
              const r = i / (ui.yLabels.length - 1);
              return (
                <text key={i} x={padL - 44} y={H - padB - r * (H - padB - padT) + 8} fill={C.gray} fontSize="24" fontFamily="sans-serif">{t}</text>
              );
            }) : ['0', '2', '4', '6', '8'].map((t, i) => (
              <text key={i} x={padL - 34} y={H - padB - (i / 4) * (H - padB - padT) + 8} fill={C.gray} fontSize="24" fontFamily="sans-serif">{t}</text>
            ))}
            {points.map((p: any, i: number) => (
              <text key={`x-${i}`} x={xs[i]} y={H - padB + 40} fill={C.paperDim} fontSize="26" fontFamily="sans-serif" textAnchor="middle">{p.x}</text>
            ))}
            {points2 && (
              <polyline points={visible2} fill="none" stroke={C.gold} strokeWidth="5" strokeDasharray="14 10" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <polyline points={visible} fill="none" stroke={C.redBright} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p: any, i: number) => {
              const show = i < nVisible;
              const isPeak = i === points.length - 1;
              return show ? (
                <circle key={i} cx={xs[i]} cy={ys[i]} r={isPeak ? 13 + flash * 6 : 9} fill={isPeak ? C.redBright : C.red} stroke={C.ink} strokeWidth="3" />
              ) : null;
            })}
            {points.map((p: any, i: number) => {
              const show = i < nVisible;
              return show ? (
                <text key={`v-${i}`} x={xs[i]} y={ys[i] - 22} fill={i === points.length - 1 ? C.redBright : '#E8A79A'} fontSize="30" fontWeight="bold" fontFamily="serif" textAnchor="middle">{p.y}</text>
              ) : null;
            })}
          </svg>
          {ui.legend ? (
            <div style={{ position: 'absolute', top: 8, right: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ui.legend.map((l: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: interpolate(frame, [100 + i * 15, 120 + i * 15], [0, 1], clamp) }}>
                  <div style={{ width: 40, height: 6, borderRadius: 3, background: l.color, opacity: l.dash ? 0.8 : 1 }} />
                  <div style={{ fontFamily: SANS, fontSize: 26, color: C.paperDim }}>{l.text}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: C.redBright, letterSpacing: 2,
          opacity: interpolate(frame, [190, 220], [0, 1], clamp), textAlign: 'center', width: 900,
        }}>{ui.note}</div>
      </div>
    </Backdrop>
  );
};

// ============ 隐喻映射表 ============
const MappingScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const rows = ui.rows || [];
  const rowH = Math.min(78, (1000 - 200) / rows.length - 8);
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 74, color: C.paper, letterSpacing: 6, marginBottom: 40 }}>{ui.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.max(8, rowH * 0.14), width: 960 }}>
          {rows.map((r: string[], i: number) => {
            const sp = spring({ frame: frame - 15 - i * 14, fps: 30, config: { damping: 17 } });
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                opacity: interpolate(sp, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(sp, [0, 1], [-40, 0])}px)`,
              }}>
                <div style={{
                  flex: 1, height: rowH, borderRadius: 12, padding: '0 22px',
                  background: 'rgba(21,24,34,0.92)', border: '1.5px solid rgba(155,148,138,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SERIF, fontSize: rowH * 0.44, fontWeight: 600, color: C.paper,
                }}>{r[0]}</div>
                <div style={{
                  width: 64, height: 4, background: C.gold, borderRadius: 2,
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', right: -4, top: -5,
                    borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: `10px solid ${C.gold}`,
                  }} />
                </div>
                <div style={{
                  flex: 1.15, height: rowH, borderRadius: 12, padding: '0 22px',
                  background: 'rgba(42,30,20,0.95)', border: `1.5px solid ${C.chipBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SERIF, fontSize: rowH * 0.42, fontWeight: 700, color: C.goldBright,
                }}>{r[1]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Backdrop>
  );
};

// ============ 结尾 CTA ============
const CtaScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const tIn = spring({ frame: frame - 10, fps: 30, config: { damping: 15 } });
  const sIn = spring({ frame: frame - 60, fps: 30, config: { damping: 18 } });
  const tagIn = spring({ frame: frame - 130, fps: 30, config: { damping: 12 } });
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 44,
      }}>
        <div style={{
          fontFamily: SERIF, fontWeight: 900, fontSize: 64, color: C.gold, letterSpacing: 10,
          opacity: interpolate(tIn, [0, 1], [0, 1]),
          borderBottom: `3px solid ${C.chipBorder}`, paddingBottom: 16,
        }}>{ui.title}</div>
        <div style={{
          fontFamily: SERIF, fontSize: 46, fontWeight: 600, color: C.paper, lineHeight: 1.65,
          width: 880, textAlign: 'center', letterSpacing: 1,
          opacity: interpolate(sIn, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(sIn, [0, 1], [30, 0])}px)`,
        }}>{ui.story}</div>
        <div style={{
          padding: '20px 70px', borderRadius: 16,
          background: `linear-gradient(135deg, ${C.red} 0%, #9A2E22 100%)`,
          transform: `scale(${interpolate(tagIn, [0, 1], [0.6, 1])}) rotate(${interpolate(tagIn, [0, 1], [-8, -3])}deg)`,
          opacity: interpolate(tagIn, [0, 1], [0, 1]),
          boxShadow: '0 14px 50px rgba(199,67,54,0.4)',
          display: 'flex', alignItems: 'center', gap: 22,
        }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 56, color: '#FFE9DB', letterSpacing: 6 }}>{ui.tag}</div>
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 30, color: C.gray, letterSpacing: 6, marginTop: 20,
          opacity: interpolate(frame, [170, 200], [0, 1], clamp),
        }}>关注概念当铺 · 每期当进一个硬核概念</div>
      </div>
    </Backdrop>
  );
};

// ============ 通用矩阵表（行列对比，行序渐入） ============
const MatrixScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const rows = ui.rows || [];
  const colHeads = ui.colHeads || [];
  const noteIn = interpolate(frame, [60 + rows.length * 30, 100 + rows.length * 30], [0, 1], clamp);
  const highlightCell = ui.highlight || null; // [rowIdx, colIdx]
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: C.paper, letterSpacing: 6, marginBottom: 46 }}>{ui.title}</div>
        <div style={{ width: 940, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 表头 */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1.1 }} />
            {colHeads.map((h: string, i: number) => (
              <div key={i} style={{
                flex: 1, minHeight: 74, borderRadius: 12, padding: '10px 10px',
                background: 'rgba(42,30,20,0.95)', border: `2px solid ${C.chipBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: SANS, fontSize: h.length > 8 ? 24 : 28, fontWeight: 700, color: C.goldBright, textAlign: 'center', lineHeight: 1.3,
              }}>{h}</div>
            ))}
          </div>
          {rows.map((r: any, i: number) => {
            const sp = spring({ frame: frame - 12 - i * 16, fps: 30, config: { damping: 17 } });
            return (
              <div key={i} style={{
                display: 'flex', gap: 12,
                opacity: interpolate(sp, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(sp, [0, 1], [26, 0])}px)`,
              }}>
                <div style={{
                  flex: 1.1, minHeight: 96, borderRadius: 12, padding: '14px',
                  background: 'rgba(21,24,34,0.92)', border: '1.5px solid rgba(155,148,138,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: SERIF, fontSize: r.head.length > 10 ? 28 : 34, fontWeight: 700, color: C.paper, textAlign: 'center', lineHeight: 1.25,
                }}>{r.head}</div>
                {r.cells.map((cell: string, j: number) => {
                  const isHi = highlightCell && highlightCell[0] === i && highlightCell[1] === j;
                  const clen = cell.length;
                  const fs = isHi ? (clen > 6 ? 42 : 52) : (clen > 12 ? 34 : clen > 8 ? 38 : 42);
                  return (
                    <div key={j} style={{
                      flex: 1, minHeight: 96, borderRadius: 12, padding: '14px 10px',
                      background: isHi ? 'rgba(42,30,20,0.98)' : 'rgba(21,24,34,0.92)',
                      border: isHi ? `2.5px solid ${C.gold}` : '1.5px solid rgba(155,148,138,0.35)',
                      boxShadow: isHi ? '0 0 36px rgba(217,166,83,0.35)' : undefined,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: SERIF, fontSize: fs, fontWeight: isHi ? 900 : 600,
                      color: isHi ? C.goldBright : C.paper, textAlign: 'center', lineHeight: 1.25,
                    }}>{cell}</div>
                  );
                })}
              </div>
            );
          })}
        </div>
        {ui.note ? (
          <div style={{
            fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: C.goldBright, letterSpacing: 2, marginTop: 42,
            opacity: noteIn, textAlign: 'center', width: 900, lineHeight: 1.4,
          }}>{ui.note}</div>
        ) : null}
      </div>
    </Backdrop>
  );
};

// ============ 链条步骤（顺序渐入，箭头连接） ============
const StepsScene: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const ui = scene.ui;
  const steps = ui.steps || [];
  const n = steps.length;
  const stepH = Math.min(170, (1000 - 160) / n - 26);
  return (
    <Backdrop>
      <Glow />
      <div style={{
        position: 'absolute', top: 250, height: 1000, width: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 76, color: C.paper, letterSpacing: 6, marginBottom: 40 }}>{ui.title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {steps.map((s: any, i: number) => {
            const sp = spring({ frame: frame - 10 - i * 24, fps: 30, config: { damping: 16 } });
            const isLast = i === n - 1;
            return (
              <React.Fragment key={i}>
                <div style={{
                  width: 900, minHeight: stepH, borderRadius: 16, padding: '18px 30px',
                  background: isLast ? 'rgba(42,30,20,0.96)' : 'rgba(21,24,34,0.92)',
                  border: isLast ? `2.5px solid ${C.gold}` : '1.5px solid rgba(155,148,138,0.4)',
                  boxShadow: isLast ? '0 0 40px rgba(217,166,83,0.3)' : undefined,
                  display: 'flex', alignItems: 'center', gap: 26,
                  opacity: interpolate(sp, [0, 1], [0, 1]),
                  transform: `translateX(${interpolate(sp, [0, 1], [-50, 0])}px)`,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                    background: isLast ? `linear-gradient(135deg, ${C.gold}, #8A6B32)` : 'rgba(155,148,138,0.2)',
                    border: `2px solid ${isLast ? C.goldBright : 'rgba(155,148,138,0.5)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: SERIF, fontWeight: 900, fontSize: 34, color: isLast ? '#4A3510' : C.paper,
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: Math.min(44, stepH * 0.34), fontWeight: 900, color: isLast ? C.goldBright : C.paper, letterSpacing: 1 }}>{s.head}</div>
                    <div style={{ fontFamily: SANS, fontSize: Math.min(30, stepH * 0.22), color: C.paperDim, marginTop: 6, lineHeight: 1.4 }}>{s.note}</div>
                  </div>
                </div>
                {!isLast && (
                  <div style={{
                    width: 0, height: 24, borderLeft: `3px dashed rgba(155,148,138,0.5)`, margin: '4px 0',
                    opacity: interpolate(frame, [10 + i * 24 + 14, 10 + i * 24 + 26], [0, 1], clamp),
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {ui.note ? (
          <div style={{
            fontFamily: SERIF, fontSize: 38, fontWeight: 600, color: C.redBright, letterSpacing: 2, marginTop: 36,
            opacity: interpolate(frame, [40 + n * 24, 70 + n * 24], [0, 1], clamp),
          }}>{ui.note}</div>
        ) : null}
      </div>
    </Backdrop>
  );
};

// ============ 场景调度 ============
const SceneRouter: React.FC<{ scene: Scene }> = ({ scene }) => {
  switch (scene.type) {
    case 'hook': return <HookScene scene={scene} />;
    case 'reveal': return <RevealScene scene={scene} />;
    case 'concept': return <ConceptScene scene={scene} />;
    case 'balance': return <BalanceScene scene={scene} />;
    case 'cantillon': return <CantillonScene scene={scene} />;
    case 'priceLadder': return <PriceLadderScene scene={scene} />;
    case 'gresham': return <GreshamScene scene={scene} />;
    case 'photos': return <PhotosScene scene={scene} />;
    case 'curve': return <CurveScene scene={scene} />;
    case 'mapping': return <MappingScene scene={scene} />;
    case 'cta': return <CtaScene scene={scene} />;
    case 'matrix': return <MatrixScene scene={scene} />;
    case 'steps': return <StepsScene scene={scene} />;
    default:
      if (scene.image) return <ImageScene scene={scene} />;
      return <Backdrop />;
  }
};

// ============ 主组件 ============
export const FableVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {timeline.scenes.map((scene: Scene) => (
        <Sequence key={scene.id} from={scene.start} durationInFrames={scene.duration}>
          <SceneRouter scene={scene} />
          <CaptionView scene={scene} />
          <Audio src={staticFile(`audio/${scene.id}.wav`)} />
        </Sequence>
      ))}
      <Watermark />
    </AbsoluteFill>
  );
};
