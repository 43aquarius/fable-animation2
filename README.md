# fable-animation2 · 经济学寓言《月泉马市》

「研究生概念寓言」系列第二期：**经济学 · 逆向选择 / 柠檬市场**（阿克洛夫《柠檬市场》1970，2001 年诺贝尔经济学奖）。

一座西域马市，三十年间没有天灾、没有坏人，却一步一步把自己逼死；一位赶骆驼的老太太用一块「敢赔十倍」的木牌把它救活。故事结尾才揭晓概念，随后逐层拆解隐喻与概念的对应关系。

- **成品视频**：见本仓库 [Releases](https://github.com/43aquarius/fable-animation2/releases)（抖音竖屏 1080×1920、4:57、30fps、h264 + aac 192k、响度 -14 LUFS）
- **封面**：横竖两版（1080×1920 / 1920×1080），见 `fable-02-lemon-market/covers/`
- **口播文字稿**：`fable-02-lemon-market/script/月泉马市_视频文字稿_抖音版.docx`（口播全文 + 隐喻对照表 + 分镜摘要 + 抖音标题方案 + 运营建议）

## 仓库结构

```
fable-02-lemon-market/
├── script/     口播稿三稿（初稿 → humanizer 优化稿 → 终稿）
│               scenes.json 分镜配置（18 景，含旁白/字幕/强调词）
│               抖音版文字稿 docx
├── covers/     竖屏封面 cover-portrait-1080x1920.png
│               横屏封面 cover-landscape-1920x1080.png
├── remotion/   Remotion 4 视频工程（React 组件 + 时间轴 + 音频 + 插画 + 字体）
└── tools/      全流程脚本（见下）
```

## 制作流程（tools/ 目录按序执行）

1. `humanize2.mjs` —— 用 [blader/humanizer](https://github.com/blader/humanizer) 的规则集（SKILL.md v3.1.0）经 LLM 引擎优化口播稿，清除 AI 味
2. `tts2.mjs` —— 逐景生成旁白（18 段 WAV，voice=xiaochen ×1.08）
3. `images2.mjs` —— 生成敦煌重彩风插画（12 场景图 + 竖版封面底图 + 横版封面底图）
4. `build-timeline2.mjs` —— 由音频时长生成帧级时间轴 `remotion/src/timeline.json`（字幕按标点分块、按字数比例分配）
5. `render-segments.sh` —— Remotion 分段静音渲染（断点续传，规避超时）
6. `build-audio2.cjs` + ffmpeg —— 混音轨重建 + 双遍 loudnorm（-14 LUFS / TP -1.5 dB）
7. `cover2.py` —— PIL 合成横竖两版封面
8. `gen-docx2.cjs` —— 生成抖音版文字稿 docx
9. `vlm-check.mjs` —— 视觉质检（关键帧与封面的排版 / 溢出 / 对比度）

## 本地重建视频

```bash
cd fable-02-lemon-market/remotion
npm install
npx remotion render LemonMarketFable out/video.mp4 --muted --concurrency=2
# 再按 tools/ 中 build-audio2 + ffmpeg 流程混音封装（或直接下载 Release 成品）
```

## 系列信息

- 第一期：机器学习寓言《背题神童》（过拟合），机器学习系列
- 本期：经济学寓言《月泉马市》（逆向选择 / 柠檬市场）
- 下期预告：道德风险（Moral Hazard）——信息不对称的孪生兄弟

## 隐喻对照（速览）

| 故事里 | 经济学里 |
|---|---|
| 看不透的马 | 质量信息不对称的商品 |
| 康掌柜的宝驹 | 优质商品（先被低价逼退） |
| 柠檬马 | 劣质品（「柠檬」，论文标题由来） |
| 全城的中间价 | 平均质量定价 |
| 好马一轮一轮撤走 | 逆向选择（价格先赶走最好的） |
| 阿依婆十倍赔偿的木牌 | 信号发送 Signaling（斯宾塞同届诺奖） |
| 牙人作保画押 | 第三方认证（质保 / 检测 / 平台评分） |
