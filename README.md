# fable-animation2 · 经济学寓言系列（概念当铺）

「研究生概念寓言」视频流水线：每期用一个原创寓言讲透一个经济学概念，**故事结束才揭晓概念**，随后逐层拆解隐喻与概念的对应关系。由 [blader/humanizer](https://github.com/blader/humanizer) 规则集优化口播语言，[Remotion](https://github.com/remotion-dev/remotion) 程序化生成视频。

从第二期起，本仓库专注**经济学大类**概念，全部成品视频发布于本仓库 [Releases](https://github.com/43aquarius/fable-animation2/releases)。

**品牌：「概念当铺」** —— 每期视频"当"进一个艰深概念，"赎"回一个故事。片尾预告下一件当品。

## 系列导航

| 期数 | 寓言 | 概念 | 分支 | 成品 |
|---|---|---|---|---|
| 第二集 | 《月泉马市》 | 逆向选择 / 柠檬市场（阿克洛夫，2001 诺奖） | `fable-02-lemon-market/` | Release `fable-02` |
| 第三集 | 《镖路》 | 道德风险（信息不对称的孪生兄弟） | `fable-03-moral-hazard/` | Release `fable-03` |
| 第四集 | 《草洼村》 | 公地悲剧（Hardin 1968 / Ostrom 2009 诺奖） | `fable-04-commons/` | Release `fable-04` |
| 第五集 | 《同和钱庄》 | 银行挤兑（Diamond-Dybvig，2022 诺奖） | `fable-05-bank-run/` | Release `fable-05` |
| 第六集 | 《围城宝钞》 | 通货膨胀（货币数量论 / 坎蒂隆效应） | `fable-06-inflation/` | Release `fable-06` |
| 第七集 | 《巧匠笨徒》 | 比较优势（李嘉图 1817） | `fable-07-comparative-advantage/` | Release `fable-07` |
| 第八集 | 《三年学徒》 | 信号传递（斯宾塞 1973，2001 诺奖） | `fable-08-signaling/` | Release `fable-08` |
| 第九集 | 《明天的糖》 | 双曲贴现（现时偏好 / 承诺机制） | `fable-09-hyperbolic-discounting/` | Release `fable-09` |
| 第十集 | 《捕蛇令》 | 古德哈特定律（指标失真 / 眼镜蛇效应） | `fable-10-goodhart/` | Release `fable-10` |

- 第一期（机器学习《背题神童》· 过拟合）见 [fabel-animation](https://github.com/43aquaris/fabel-animation) 仓库。
- 第五集片尾预告第六集"最后贷款人的钱从哪来"→ 第六集《围城宝钞》承接。
- 第十集片尾预告下一件当品：**外部性**（上游的村子把水卖了，下游只能喝泥汤）。

## 视频规格

抖音竖屏 1080×1920、30fps、h264 + aac 192k、响度 -14 LUFS、全片烧制字幕、每期约 5-6 分钟；每期含**横竖双封面**（1080×1920 / 1920×1080）。

## 第六期起的制作升级

- **分句级 TTS**：旁白按标点切句独立合成，静音修剪后以设计停顿（逗号 260ms / 句号 560ms / 叹问 660ms）拼接，断句完全可控；成音后经 ASR 回检与原文比对（相似度阈值 0.85）。
- **字幕精确同步**：字幕时长取自分句实测时长（而非按字数比例估算）。
- **防重叠布局系统**：全组件内容限制在 y250-1250 安全区内纵向流式排布（flex + gap，禁用绝对定位互叠），字幕带独立于 y1310；字号按文本长度分档自适应。成片再经 VLM 逐帧抽样终检（文字重叠 / 裁切 / 贴边）。
- **动画讲解优先**：机制性段落全部 Remotion 原生动画，气氛段落保留 AI 插画，揭晓段落用真实照片。

## 仓库结构（每期同构）

```
fable-XX-name/
├── script/     口播稿（初稿 → humanizer 优化稿 → 终稿）
│               episode-config.json / scenes.json（18 景分镜与强调词）
│               image-prompts.json（插画 prompt）
│               抖音版文字稿 docx
├── covers/     横竖双封面
├── remotion/   Remotion 4 视频工程（React 组件 + 时间轴 + 音频 + 插画 + 真实素材 + 字体）
└── tools/      全流程脚本（humanize / make-scenes / tts-clause / build-timeline / images-gen /
                real-photos / render4 / build-audio / build-final / cover / gen-docx / vlm-overlap）
```

## 本地重建视频

```bash
cd fable-06-inflation/remotion   # 或其他期目录
npm install
npx remotion render Fable06 out/video.mp4 --muted --concurrency=2
# 再按 tools/ 中 build-audio + build-final 流程混音封装（或直接下载 Release 成品）
```
