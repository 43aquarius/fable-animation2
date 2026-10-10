# fable-animation2 · 经济学寓言系列

「研究生概念寓言」视频流水线：每期用一个原创寓言讲透一个经济学概念，**故事结束才揭晓概念**，随后逐层拆解隐喻与概念的对应关系。由 [blader/humanizer](https://github.com/blader/humanizer) 规则集优化口播语言，[Remotion](https://github.com/remotion-dev/remotion) 程序化生成视频。

从第二期起，本仓库专注**经济学大类**概念，全部成品视频发布于本仓库 [Releases](https://github.com/43aquarius/fable-animation2/releases)。

## 系列导航

| 期数 | 寓言 | 概念 | 分支 | 成品 |
|---|---|---|---|---|
| 第二集 | 《月泉马市》 | 逆向选择 / 柠檬市场（阿克洛夫，2001 诺奖） | `fable-02-lemon-market/` | Release `fable-02` |
| 第三集 | 《镖路》 | 道德风险（信息不对称的孪生兄弟） | `fable-03-moral-hazard/` | Release `fable-03` |
| 第四集 | 《草洼村》 | 公地悲剧（Hardin 1968 / Ostrom 2009 诺奖） | `fable-04-commons/` | Release `fable-04` |
| 第五集 | 《同和钱庄》 | 银行挤兑（Diamond-Dybvig，2022 诺奖） | `fable-05-bank-run/` | Release `fable-05` |

- 第一期（机器学习《背题神童》· 过拟合）见 [fabel-animation](https://github.com/43aquaris/fabel-animation) 仓库。
- 片尾预告：下一期 **通货膨胀**（最后贷款人的钱从哪来，印多了会怎样）。

## 视频规格（三期一致）

抖音竖屏 1080×1920、30fps、h264 + aac 192k、响度 -14 LUFS、全片烧制字幕、每期约 5-6 分钟；每期含**横竖双封面**（1080×1920 / 1920×1080）。

## 仓库结构（每期同构）

```
fable-XX-name/
├── script/     口播稿三稿（初稿 → humanizer 优化稿 → 终稿）
│               episode.json / scenes.json 分镜配置（18 景，含旁白/类型/强调词）
│               抖音版文字稿 docx（口播全文 + 隐喻对照表 + 分镜摘要 + 标题方案 + 运营建议）
├── covers/     竖屏封面 cover-portrait-1080x1920.png
│               横屏封面 cover-landscape-1920x1080.png
├── remotion/   Remotion 4 视频工程（React 组件 + 时间轴 + 音频 + 插画 + 真实素材 + 字体）
└── tools/      全流程脚本（见下）
```

## 制作流程（tools/ 目录按序执行）

1. `humanizeX.mjs` —— 用 humanizer 的规则集（SKILL.md v3.1.0）经 LLM 引擎优化口播稿，清除 AI 味
2. `make-scenes.mjs` —— episode.json + 终稿 → scenes.json（分镜与强调词配置）
3. `tts3.mjs` —— 逐景生成旁白（18 段 WAV，voice=xiaochen ×1.08）
4. `images3.mjs` —— 按各期画风生成插画（场景图 + 横竖版封面底图，prompt 见 `script/image-prompts.json`）
5. `build-timeline3.mjs` —— 由音频时长生成帧级时间轴 `remotion/src/timeline.json`（字幕按标点分块、按字数比例分配）
6. `render3.sh` —— Remotion 分段静音渲染（断点续传，规避超时）
7. `build-audio3.cjs` + `build-final3.sh` —— 混音轨重建 + 双遍 loudnorm（-14 LUFS / TP -1.5 dB）+ 无损封装
8. `coverX.py` —— PIL 合成横竖两版封面
9. `gen-docxX.cjs` —— 生成抖音版文字稿 docx
10. `vlm-check.mjs` / `vlm-verify-real.mjs` —— 视觉质检（关键帧与封面的排版 / 溢出 / 对比度）

## 第三期起的制作升级

- **动画讲解优先**：寓言中的机制性段落（合约卡、商路地图、资金池、谣言传播网络、恶性循环、双结局等）改用 Remotion 原生动画呈现，气氛性段落保留 AI 插画；
- **真实素材**：揭晓与解药段落引入经 VLM 核验的真实照片（2008 金融危机、过度捕捞、共享单车坟场、大萧条挤兑、硅谷银行等），画面内标注来源。

## 本地重建视频

```bash
cd fable-03-moral-hazard/remotion   # 或其他期目录
npm install
npx remotion render EscortFable out/video.mp4 --muted --concurrency=2
# 再按 tools/ 中 build-audio + build-final 流程混音封装（或直接下载 Release 成品）
```

## 隐喻对照（速览 · 第三期《镖路》）

| 故事里 | 经济学里 |
|---|---|
| 镖路上的选择 | 隐藏行动（Hidden Action） |
| 按趟结钱 | 固定报酬合约 |
| 省归镖局，赔归票号 | 风险与激励错位 |
| 加赏二两 / 赔十倍 | 激励相容（Incentive Compatibility） |
| 派伙计查岗 | 监督成本 |
| 免赔额 / 期权 / 押金 | 现代激励工具 |

第四期《草洼村》：公地→非排他性资源，一只羊的账→收益私有成本公有，谁先减谁吃亏→囚徒困境，柴棍画的线→奥斯特罗姆自主治理。

第五期《同和钱庄》：随时取三年回→期限转换，三成现银→存款准备金，一句闲话→信心冲击，怕倒去取→个体理性，联保官银→最后贷款人与存款保险。
