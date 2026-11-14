# MOSS2 v0.4 设计规格（增量）— 用户 5 项反馈的落地方案

> 生成：2026-11-07（Asia/Shanghai）｜ 状态：**v0.4 唯一增量权威源**，与 `design-spec-v2.md`（四幕基线）、
> `design-spec-v3.md`（进度/准心/音频/皮肤呼吸基线）叠加生效；冲突时以本文件为准。
> 背景：用户看完 v0.3 成品后给出 5 条反馈（原话见 §1）。本文件把 5 条反馈拆成可执行契约。
> 本文所有时间均指**启动动画绝对时间 t（秒，从第 0 帧算起）**；「本地时间」另注。

---

## 0. 一句话

v0.3 的四幕叙事保留；v0.4 做 5 件事：**① 第二幕终局「对焦」框必须与 MOSS 主眼严格同轴对称 + 加真实机械关节音效
② 第二→三幕转场重做为「准心十字线长成分割线」的连续镜头 ③ 第三幕地球冷态不喷射、第四幕点火才喷射
④ 第四幕→UI 交接扩成三段式（BOOT COMPLETE → 冰白闪光 → UI 分区显影）
⑤ 皮肤红眼信号灯与输入卡四角括号呼吸幅度拉到最大（用户点名：能调多大调多大）。**

总时长由 11.80s → **12.80s**（+1.00s；为 ②③④ 各让出 0.2–0.6s）。四幕边界：
`0–0.50 / 0.50–3.90 / 3.90–8.30 / 8.30–10.35 / 10.35–11.95 / 11.95–12.80`。

---

## 1. 用户原话 → 工程落地

| # | 用户原话 | 落地要求 |
|---|---|---|
| 1a | 第二幕的 MOSS 机器人最后的「对焦」，也就是方框没有对齐 | 第二幕锁定后（7.42s 起）的「聚焦框」必须**四角对称、几何中心严格等于 `computeEyePoint()` 换算出的主眼坐标（误差 ≤1.5px）**，框为正方形（允许 1–2% 视觉缩放差），不得再出现 v0.3 的「扁宽 + 右偏 ~35px」。同时终局给「对焦行程」：框从 1.16× 收口到 1.00× 并做一次轻微过冲回落；锁定后 7.42–8.06 保持稳定对齐（不再抖动位移）。 |
| 1b | 也没有 MOSS 机器人伴随机械臂活动的机械关节音效 | 第二幕机械音重做：以**视频逐帧运动包络**（`_work/v04/assets-analysis/moss.json` 的 `motion` / `keyEvents`）驱动**听得见**的关节音（伺服电机 + 齿轮棘轮 + 液压 + 锁扣），音量必须显著高于 v0.3 的「背景铺底级」；关节事件与画面运动峰/停止点对齐（误差 ≤0.10s）。 |
| 2 | 第二幕到第三幕，也就是类似转场的那一幕过渡的太草率 | 第二→三幕改为**连续镜头**：8.06–8.30 准心十字线向四边延伸 → 竖线变成幕 III 的分割线、横线变成一次水平闪光；8.30 分割成立时只闪 0.10s（不再硬切大白闪）；分割线由中心向上下「画」出来（scaleY 0→1），地球一侧以数据擦除（data wipe）+ 冷色显影方式出现，而不是直接贴上去。给足 0.32s 铺陈 + 0.34s 成立。 |
| 3 | 第三幕一半 MOSS 一半流浪地球时地球应该还没有开始「喷射」，第三幕结束进入最后一幕再开始喷射 | **幕 III 的地球必须是「冷态未点火」**：没有等离子喷射尾迹；进入幕 IV（10.35s）瞬间「点火」——喷射尾迹随一次冰蓝点火闪光 + 曝光拉升出现在画面里。实现优先用「地球特写裁切（把尾迹裁出画面）+ 冷调色」方案（见 §5，数据依赖 earth.json），不使用假素材、不新增资产。 |
| 4 | 最后一幕流浪地球到操作界面的过渡太过简短草率 | 交接由 0.8s 的「直接淡出」改为 **1.0s 三段式（11.80–12.80）+ UI 2.0s 显影**：11.80–12.30 「BOOT COMPLETE / 系统就绪」定格印章 + HUD 收束退场；12.30–12.50 冰白闪光满屏（有 0.14s 峰值）；12.38–12.80 启动层 420ms 淡出、UI 分区显影（skin 侧约 2.0s 分级入场，比 v0.3 的 0.5s 明显加长）。闪白期间地球背景必须无缝换到真实 ambient（同帧同裁切，不允许亮度/位置跳变）。 |
| 5 | 对话框的三个直角框和「探索未至之境」左侧红色信号灯呼吸闪烁几乎感受不到，调到你能调的最大的程度 | 皮肤侧两条呼吸动效**幅度拉满**：红眼（品牌徽标 SVG 的 halo/ring/core/glint）与输入卡四角括号的亮度、光晕、缩放、双击闪烁幅度全部提到视觉上「一眼可见」的上限（仍遵守 ≤3Hz 光敏安全线）。**并修复四角只看到 3 个的问题**（真实宿主 composer 卡右下角被盖住/缺失 → 必须 4 角都在，且列进断言）。 |

---

## 2. v0.4 时间线（唯一真值，§2.1 常量与 §2.2 表必须与实现逐字一致）

### 2.1 顶层常量（`lib/splash.js` §0）

```
DURATION      = 12.80
DURATION_MS   = 12800
HARD_STOP_MS  = 14000      // splash 内部兜底；**宿主 BOOTSTRAP_JS 兜底 13000→14000**（实测：splash 起播比页面
                           // 晚 ~0.7s，宿主 13.0s 兜底会等于 splash 12.42s 提前打断淡出——v0.4 已改 lib/index.js 14000）
ARM_AT        = 11.55      // 交接 seek（真实 ambient 与启动层地球同帧）
SKIP_AT       = 10.35      // ESC 跳过 → 直接到幕 IV 起点（点火前）
PROGRESS_SHOW = 4.36
PROGRESS_KNEE = 10.35      // 跳过相位对应的名义进度
PROGRESS_END  = 12.30      // t=12.30 进度必须 100%，12.30–12.80 保持完成态
FADE_AT       = 12.38      // 启动层开始淡出
FADE_MS       = 420        // 12.38 → 12.80 淡出
```

- `bootProgress(t)`：0→10.35 线性到 10.35/12.80；10.35→12.30 补到 1；继续用 `0.88*raw+0.12*easeInOut(raw)`；
  `t>=12.30` 恒 1。数字/填充/光点三真值契约与 v0.3 相同（同一 `quantizeProgress`）。
- `TL`（秒）：

```
proEnd 0.50
neuroIn 0.50 / neuroFadeEnd 1.18 / neuroPushEnd 3.90 / (幕 I 其余时间点不变)
cut 3.90 / flashEnd 3.99
mossIn 3.90 / mossFadeEnd 4.48 / mossTitle 4.16 / mossLogStart 4.32 / mossLogStep 0.27 / mossTel 4.62
mossBar 4.36
tgtGrid     [3.90, 4.30]
tgtCapture  [4.30, 5.20]
tgtTrack    [5.20, 6.50]      // +0.10
tgtConverge [6.50, 7.42]      // +0.10（终点 = 锁定瞬间）
gazeIn      7.16              // 红眼点亮（实测视频本地 3.267s，v0.3 的 7.06 偏早，v0.4 修正）
gazeLock    7.42
tgtLock     [7.42, 7.78]      // 冲击波/印章/震动
tgtFocus    [7.42, 8.06]      // 新增：终局对焦行程（框收口 + 过冲回落 + 四角 seat 脉冲）
tgtMaintain [7.78, 8.20]      // 锁定维持（呼吸/数据流）
tgtOut      [8.14, 8.34]
online 7.46 / quote 7.55 / mossHudOut [8.02, 8.26]   // v0.4 复核：红眼 7.16 点亮，上线文案 7.46 起更合逻辑
mossSplitPrep [8.06, 8.30]    // 新增：准心十字线延伸 → 分割线（见 §4）
split 8.30 / splitFlashEnd 8.44
splitSeamDraw [8.30, 8.62]    // 分割线由中心向上下画出
splitLabelL [8.62, 8.94] / splitLabelR [8.76, 9.08]
handover [9.12, 9.46] / handoverOut [9.98, 10.18]
engineHint [9.82, 10.18]      // 右幕「ENGINE IGNITION / 引擎点火」预告（只有文字与接缝光，不得有喷射）
sweep [10.02, 10.35]          // 接缝向左扫、地球展开
splitOut [10.32, 10.44]
earth 10.35
ignite [10.35, 10.95]         // 幕 IV 点火（见 §5）
earthCap [10.72, 11.12] / earthMark [10.98, 11.36]
earthPushEnd 11.80            // 地球 scale 1.30→1.13 缓慢推近
arm 11.55 / preHandoff [11.70, 11.95]
bootComplete [11.80, 12.30]   // 交接手势段 1（§6）
flash [12.30, 12.52]          // 实现键名 TL.handoffFlash（与 render 一致）
fade 12.38 / done 12.80
```

### 2.2 相位表

| 相位 id | 标签 | from | to |
|---|---|---|---|
| prologue | 黑场 | 0 | 0.50 |
| neuro | I 神经接口 | 0.50 | 3.90 |
| moss | II MOSS 苏醒 | 3.90 | 8.30 |
| split | III 转场 | 8.30 | 10.35 |
| earth | IV 流浪地球 | 10.35 | 11.95 |
| handoff | 交接 | 11.95 | 12.80 |

- 里程碑：`500 neuro`、`3900 cut`、`8300 split`、`10350 earth`、`11550 arm`、`11800 bootComplete`、
  `12300 flash`、`12380 fade`、`12800 done`。`startHandoff()` 只在 12.38 调一次。
- `PHASES` / `__DSH_MOSS2_SPLASH__.duration` / `data-duration` 全部 12.8。
- `preview`/`freeze(t)` 在 0–12.8 全域可用；`frozenSeek` 的地球本地时间 = `at-8.30`（幕 III 起播），
  幕 IV 起用点火段（见 §5）。

---

## 3. 第二幕：终局「对焦」对齐 + 机械关节音效

### 3.1 对齐几何（硬断言）

现状（v0.3 实测，1536×960）：`.ms-tgt-corner` 四角收敛后形成 **140.4×86.2 px 的扁框**，框心 (587.8,526.2)，
主眼 (553,516.5) → **右偏 34.8px / 下偏 9.7px**；`.ms-gaze-corner` 另有 ~8px 对角偏移。这是用户反馈 1a 的根因。

新契约：
1. **唯一的终局聚焦框** = 新增 DOM `.ms-tgt-focus`（四角 `.ms-tgt-focus__corner` ×4 + 四边中点 tick ×4 +
   内部十字/圆环沿用既有 `.ms-tgt-*`），由 JS 逐帧写 `left/top`（屏幕坐标 px）与 `transform`。
2. 几何：`FOCUS_HALF = clamp(72, 0.104 * min(frameW, frameH), 116)`（1536×960 → 99.8px；1920×1080 → 112.3px）。
   终局（t≥7.78）四角锚点必须严格等于
   `TL=(ex-FOCUS_HALF, ey-FOCUS_HALF)`、`TR=(ex+FOCUS_HALF, ey-FOCUS_HALF)`、
   `BL=(ex-FOCUS_HALF, ey+FOCUS_HALF)`、`BR=(ex+FOCUS_HALF, ey+FOCUS_HALF)`，
   其中 `(ex,ey)=computeEyePoint()`。四角元素用 `translate(-50%,-50%)` 定位，**框的几何中心 = 主眼**。
   框必须正方形（宽高差 ≤2px），四角臂长 `FOCUS_HALF*0.30`、线宽 2.5px、颜色 `var(--ms-moss-hi)`、内发光。
3. 对焦行程（tgtFocus 7.42→8.06）：
   - 7.42–7.62：当前框（v0.3 的收敛位置）**快速收口**到终局框，`focusIn = easeOut(seg(t,7.42,7.62))`，缩放 1.16→1.00；
   - 7.62–7.72：过冲回落 `scale = 1 + 0.035*sin(pi*seg(t,7.62,7.72))`；
   - 7.78–8.06：完全静止对齐（**不允许任何 jitter/位移**），只允许 opacity/glow 呼吸（≤1.2Hz）；
   - 7.42 起：`.ms-gaze` 旧框、`.ms-tgt-corner` 旧收敛框必须 **全部隐藏/移除**（避免两套框叠加再次错位）；
     旧 `.ms-tgt-corner` 只保留到 7.42 前的捕获/收敛用途，7.42 后 opacity=0。
4. 断言（verifier）：在 t=7.42/7.60/7.78/7.95/8.05 五帧，`.ms-tgt-focus` 四角 `getBoundingClientRect()` 中心
   与 `__DSH_MOSS2_LOCK__.eye` 的 `FOCUS_HALF` 偏差 ≤1.5px；`|框宽-框高| ≤2px`；`__DSH_MOSS2_LOCK__.focusAligned === true`。
5. `__DSH_MOSS2_LOCK__` 新增字段：`focus:{x,y,half,w,h,aligned}`（对象复用，逐帧写）。
6. 主眼坐标 `EYE` 允许按 `_work/v04/assets-analysis/moss.json` 的 `eyeMedian` 微调一次
   （偏差 >0.002 才改，改后必须重跑全部对齐断言）。

### 3.2 机械关节音效（重做第二幕 SFX）

数据源：`_work/v04/assets-analysis/moss.json` 的 `motion.full` / `motion.arm` / `keyEvents`（内联进 `lib/splash.js`
为常量 `MOSS_MOTION_FULL` / `MOSS_MOTION_ARM`，格式 `{fps:30, frames:[...]}`；不新增网络请求）。
第二幕 = 幕 II 4.60s（t 3.90–8.30，本地 0–4.40s）。

音频设计（WebAudio 程序化，`buildAudioGraph` 内）：
1. **伺服电机层**（持续，t 4.00–6.60）：sawtooth 55→135Hz 扫频 + bandpass(Q≈2.2) + 运动包络幅度调制；
   **峰值 0.030–0.038**（v0.3 为 0.012，用户听不到），随 `motion.full` 起伏（0.35–1.0 倍）。
2. **机械关节层**（事件化，驱动 = `motion.arm` 的导数峰 + `keyEvents` 里的 stop/settle）：
   每次事件 = 三件套叠加，峰值 0.030–0.055：
   - 「齿轮棘轮」：6–10 个 8ms 短脉冲（square 900–1600Hz，间隔 12–18ms），像步进关节；
   - 「金属关节」：FM triangle 110–220Hz 下滑 + highpass 噪声 burst（工具已有 `metalHit`，扩展参数）；
   - 「液压泄压」：bandpass 噪声 1800→600Hz 扫频 90–160ms，峰值 0.02–0.032。
   事件表：以 `keyEvents` 中 `motionPeak` / `settle` / `speedChange` 为锚（±0.02s），**至少 6 个**；
   其中「机械臂停稳/锁死」的两个事件（6.4–7.0 区间的 settle）必须最重（0.05）。
   若分析与主观听感冲突，以「画面动 → 有声音，画面停 → 有落锁声」为准。
3. **锁扣重音**：7.42 保留 v0.3 sub 冲击 + 金属撞击，追加一次 0.09s 后的「锁扣二段咔哒」（0.028）+ 尾音 ringing；
   7.62 终局对焦到位加一声短促「聚焦伺服」tick（0.02）。
4. **混音**：保持 v0.3 的 master/compressor/limiter 与峰值上限；新增事件峰值仍 ≤0.12；
   整体 SFX bus 不改（sfxDrive 1.66）。**可听性验收（客观）**：v0.3 WAV 在 4.0–8.0s 的
   `mean_volume ≈ -19.1 dBFS / max ≈ -1.9 dBFS`（实测基线），本版不要求整体再 +3dB（会被末级限幅压平），
   而要求「关节事件相对于床的对比度」：
   - 新增只读探针 `__DSH_MOSS2_AUDIO_EVENTS__ = [{kind, at, peak}]`（buildAudioGraph 内 push，
     离线渲染时同样生成；kind 至少区分 'joint' / 'latch' / 'lock' / 'ignite'）；
   - 4.0–7.2s 内 `kind='joint'` 事件 ≥6 个，且每个事件 at 与 `moss.json` 的 motionPeak / arm_step / motion_stop 关键帧
     偏差 ≤0.10s（**v0.4 实测期望落点**：4.23 / 4.40 / 4.57 / 4.73（全帧运动峰）、5.17（峰5）、
     5.53 / 5.87 / 6.03 / 6.87（机械臂微动 arm_step，5× 局部中位）、6.63（镜头锁死 motion_stop）、7.17（红眼点火），±0.10s）；
   - 离线 WAV 二次分析（脚本 `_work/v04/audio-band-check.py`）：4.0–7.2s 内 500–4000Hz 频段
     「60ms 瞬态能量 vs 局部 400ms 床」**≥6 个事件达到 +8dB 对比**，事件时点命中率 ≥6/11（±0.10s）；
   - 7.42 锁定重音仍是 6.5–8.5s 内的最高峰值（max_volume 锚点）；
   - 整体不得出现 >0 dBFS 样本（True Peak ≤ -1.0 dBFS）。
5. 证据：`node _work/demo/render-audio.mjs` 重新生成 `_work/demo/moss2-boot-audio.wav`（时长 12.80s±0.05，
   44.1k/16bit），并在报告里给第二幕（4.0–8.0s）与 v0.3 WAV 的 RMS/LUFS 对比。

---

## 4. 第二 → 第三幕转场（重做）

目标：从「准心锁定」无缝长成「左右分割」，不要硬切 + 大白闪。

1. **8.06–8.30 预转场**（`mossSplitPrep`）：
   - 准心十字线（`.ms-tgt-cross` 的横/竖线）从当前长度**延伸到屏幕边缘**（横线 = 全宽，竖线 = 全高），
     同时十字线亮度提到 1.0、颜色从红向冰白过渡（HSL 插值用 JS 写 `--ms-seam-color` 或直接写 rgba）；
   - 对焦框四角向外飞散（fly out）→ 8.30 时正好成为幕 III 的四个画面角标（新增 `.ms-split__corner` ×4，
     与 `.ms-tgt-focus` 的收尾位置做位置插值：从终局框四角 → 视口四角内侧 26px）；
   - 8.24 起屏幕轻微「拉丝」：水平方向 1px 扫描线从左到右闪一次（复用 `.ms-scan` 或新增 `.ms-split__flashline`）。
2. **8.30 分割成立**：
   - 闪白改为 **0.10s、峰值 0.30**（v0.3 是 0.36@0.06s），不再刺眼；
   - 分割线（`.ms-split__seam`）由中心向上下「画出」：`scaleY 0→1`（0.32s，easeOut）；接缝 = 2px 核心亮线
  + 42px 柔光（`::before`）+ 8px 数据刻线（`.ms-split__ticks`）。
   - 左 half：MOSS 画面**冻结 + 降饱和 + 轻压暗**（`.ms-split__moss .ms-clip` 加 filter：`saturate(.82) brightness(1.18)`，
  左半区平均亮度目标 ≥30/255、MOSS 机体与红眼可辨；v0.4 最终实测 9.2s 左半区均值 30.7、红眼像素 1529），
     左上角标签「550W · CONTROL TRANSFER / 控制权移交」滑入（字距 0.4em 展开）；
   - 右 half：地球以 **data wipe** 出现——4 条水平扫描带（新增 `.ms-split__wipe` ×3 或 1 个带 4 条渐变背景的元素）
     在 8.30–8.62 从右向左扫过地球侧，扫过后地球保留（**冷态、无喷射**，见 §5）；右下角标签
     「THE WANDERING EARTH / 流浪地球」滑入。
3. **9.12–9.46 移交卡**：`.ms-split__handover` 保留，字距/描线动画加强；新增 3 个「数据包」小光点
   （`.ms-seam-packet` ×3）沿接缝从上/中/下三个位置由左（MOSS）向右（地球）流动，9.12–9.90 循环 2 次，
   抵达时接缝对应位置闪一下（给「控制权正在转移」的叙事感）。
4. **9.82–10.18 点火预告**：右 half 底部出现小型 `ENGINE IGNITION // 引擎点火` 文案（字号 9px，字距 0.3em，冷蓝），
   接缝颜色由红→冰蓝过渡，接缝亮度提升 30%（**只是预告，地球仍然没有喷射**）。
5. **10.02–10.35 扫过**：接缝向左扫（现有 `sweep`），地球侧从冷调向点火前的高光过渡；左 half 压到全黑。
   10.32–10.44 幕 III 覆盖层退场。
6. 动效红线：所有闪烁 ≤3Hz；`.ms-calm` 下去掉 wipe/扫描/数据包与飞散动画，只保留 0.3s 的淡入切分；系统 reduce 不停。

---

## 5. 第三幕地球「冷态未点火」+ 第四幕点火

数据源：`_work/v04/assets-analysis/earth.json`（planets/plasma/jetSegments）。**实测结论（2026-11-07，1920×1080）**：
30s 内没有「无喷射」时段（最暗 20.27–21.77s 仍为最亮值的 ~19%），尾迹全程可见 → 幕 III **必须**用圆形遮罩
只留「静默行星 + 大气边缘」；行星圆盘中心 ≈ video 归一化 `(0.498, 0.497)`，半径 ≈ 205px
（rx≈0.1068 按宽 / ry≈0.190 按高），30s 内漂移 ≤~0.02 归一化可视为固定；尾迹亮核
`x∈[0.60,0.97] y∈[0.33,0.67]`，从行星右缘（x≈0.605）向右延伸。实现：

1. **幕 III 地球呈现**（8.30–10.35）：
   - 地球 video 挂 **圆形遮罩**：`mask-image: radial-gradient(circle at <行星局部中心>, #000 0 R*1.20, rgba(0,0,0,.85) R*1.24, transparent R*1.34)`，
     R = 行星半径（按元素本地像素、含 object-fit:cover 换算）→ 只剩「静默行星 + 大气边缘」，尾迹完全不可见；
   - 构图：行星移到右 half 内（屏幕目标 ≈ `x=0.70*W, y=0.50*H`），`transform: translate3d(Tx,0,0) scale(S3)`，
     S3≈1.26–1.32，Tx 由 JS 按 frameW/frameH 现算，保证行星完整可见、不压接缝；
   - `filter: brightness(1.06) saturate(.72) contrast(1.06)`（冷、暗、未点火；v0.4 最终值，实测冷/热区域均值
     7.9/17.0 = 46%，满足 <55%；再压暗会过黑）；`playbackRate` 允许 0.65；
   - 若遮罩边缘仍露出尾迹亮核，追加径向暗角 overlay 兜底（颜色 `#01040a`）。
2. **幕 IV 点火**（10.35–10.95）：
   - 10.35 起 `scale` 从 E3_SCALE 连续过渡到 1.13（0.60s，easeInOut），同时滤色从冷调过渡到
     `brightness(1.75) saturate(1.22)`（与 ambient 一致）；
   - 10.38–10.67 冰蓝点火闪光（**峰值 10.46 = 喷流进入画面同帧**）：新增 `.ms-ignite-flash`（径向渐变 + 行星边缘光弧），峰值不透明度 0.85，
     0.10s 起 0.17s 落；同时 `playbackRate` 回 1.0；
   - 新增 `.ms-ignite-burst` ×2：以地球圆盘中心为原点的扩散光环（scale 0.4→2.6，0.55s，fade），
     颜色 `--ms-plasma`；
   - 喷射出现的瞬间（点火闪光峰值）必须与地球尾迹进入画面同帧（误差 ≤0.05s）；
   - 字幕：10.72 起「流浪地球计划 · 已启动 / 地球发动机 全功率」，10.98 起「550W · MOSS / 移交完成」，
     排版比 v0.3 更强（字号 +1px、字距 +0.04em、入场用 0.22s 上滑 + 模糊递减）。
3. **时序**：`startEarth()` 在 10.35 触发：切点火段（按 earth.json 的 `jetSegment` 选择 `earth` 视频 currentTime；
   若视频本身无 jet 段则停留当前段），设 `playbackRate`，并把 `.ms-act--earth` 冷态 class 移除。
4. **断言**：t=9.4 / 10.2 截图里地球右侧**不得出现**高亮蓝白尾迹（用像素断言：earth pane 右 35% 区域
   蓝色高亮像素占比 < 0.4% 且均值亮度低于 t=10.9 同区域的 55%）；t=10.6/10.9 必须出现尾迹（同区域均值亮度
   ≥ 前者的 1.8 倍）；`__DSH_MOSS2_EARTH_STATE__ = {phase, scale, playbackRate, jetVisible, jetAt}` 只读探针。
5. **交接一致性**：幕 IV 结束时（11.55 armHandoff）地球层必须已经回到 `scale(1.12~1.13)` 且与 ambient 相同的
   filter/裁切，11.80 之后不允许再改地球层 transform/filter（否则交接跳变）。armHandoff 传给 client 的
   `currentTime` 必须是**点火段地球视频**的 currentTime（保证 ambient 换场后画面接上）。

---

## 6. 第四幕 → UI 交接（重做，1.0s 三段式 + UI 2.0s 显影）

契约（splash ↔ client/skin 跨文件）：
1. **11.55 `armHandoff`**：按现有 API；同时 splash 把地球层锁定为「交接基准帧」（不再 seek/改 playbackRate）。
2. **11.80–12.30 段 1「BOOT COMPLETE」**：
   - splash 派发 `window.dispatchEvent(new CustomEvent('dsh-moss2:handoff', {detail:{at: 11.8, t: 12.3}}))`；
   - 画面：地球继续缓慢推近；顶栏/页脚/四角/标尺/扫描线在 11.80–12.15 收束淡出；进度条 12.30 走到 100%，
     `.ms-pct` 完成态（`BOOT COMPLETE / 加载完成`）在 12.05 起以 0.22s 放大压入（scale 1.12→1.0）；
   - 新增 `.ms-boot-stamp`（中心偏下）：`BOOT COMPLETE` 大字标 + `系统就绪 · DEEPSEEK HARNESS` 副标，
     11.86 起 clip-path 从左揭开、12.06 起 0.20s 淡出；
   - HUD 退场方式：四角括号/标尺向外 fly-out（0.30s），顶栏/页脚向上/下位移 10px 淡出；不允许整体硬切。
3. **12.30–12.80 段 2「冰白闪光换场」**：
   - 12.30–12.42 闪光 layer 升到峰值 `opacity 0.92`（颜色 `#eaf8ff`），0.10s 后开始落；12.52 回到 0；
   - 闪白期间（12.38）启动层开始 420ms ease-in 淡出（`root.style.transition='opacity 420ms cubic-bezier(.4,0,.2,1)'`）；
   - 地球层的 `.ms-clip` / video transform 保持不动，靠 root 整体 opacity 淡出 → 露出下方已同帧的 ambient；
   - 12.80 `finish('natural')`（保持 dispatch `dsh-moss2:done`）。
4. **client 侧（skin-weaver）**：`window.addEventListener('dsh-moss2:handoff', ...)` → `enterUI(2000)`；
   若没收到事件，保留 `dsh-moss2:done` 兜底（`enterUI(1400)`）。`dsh-moss-enter` 动画重写成 **1.6–2.0s 分级显影**：
   - 背景 ambient 不得二次淡入（保持 v0.2 铁律）；
   - 侧栏 0ms / 顶栏 80ms / 主列滚动体 160ms / 输入卡 260ms / 右侧装饰 340ms，每条 620–760ms，
     用 `opacity + translate3d + blur(6px→0)`，末尾统一 `cubic-bezier(.16,1,.3,1)`；
   - 新增「玻璃上浮」一次：`#root` 内的主容器在 0–0.9s 做 `scale(.994→1)`（只对不为 fixed 的容器做，避免动到滚轮）。
5. 断言：`__DSH_MOSS2_HANDOFF__` 12.80 前 ok=true；12.30–12.80 任一帧 root opacity 单调递减；
   12.80 后 root 不存在、`html.moss-lock` 被移除、`dsh-moss-enter` 在 12.80 之后 ≥0.8s 仍在（UI 显影未结束）。

---

## 7. 皮肤呼吸灯（拉到最大）+ 四角修复

### 7.1 品牌红眼（`lib/skin.css` §5.12，client 的 `MossEyeMark()` 结构不变）
- `.dsh-moss-eye__ring`：周期 2.2s；`stroke-opacity .18 ↔ 1.0`；`stroke-width 1 ↔ 1.6`（用 `vector-effect` 不变形时可用 filter 代替）;
  `filter: drop-shadow(0 0 1px rgba(255,61,31,.5)) ↔ drop-shadow(0 0 18px rgba(255,61,31,1)) drop-shadow(0 0 40px rgba(255,61,31,.55))`；
- `.dsh-moss-eye__core`：周期 1.8s；`fill-opacity .45 ↔ 1`；`scale(.62 ↔ 1.55)`；
  glow `drop-shadow(0 0 2px) ↔ drop-shadow(0 0 16px)+drop-shadow(0 0 34px)`；
- `.dsh-moss-eye__halo`：周期 2.2s；`stroke-opacity .10 ↔ .85`；`scale(1 ↔ 1.12)`；
- `.dsh-moss-brandmark-wrap`（HTML span，可加 `::before`）：新增径向红色光晕 `::before`，
  `opacity .10 ↔ .55`、`scale(.75 ↔ 1.35)`，周期 2.2s（与 ring 同相）→ hero 34px 处形成明显「信号灯呼吸」；
- 双击信号灯：周期 6.0s，`stroke-opacity`/`fill-opacity` 在两处各做 2 个 ~70ms、谷值 0.08 的暗脉冲（整体仍 ≤3Hz）；
- 亮度上限：ring 的红色 RGB 用 `var(--m-moss)`；允许对 hero 徽标整体乘 `drop-shadow`，不得引入闪烁 >3Hz。
- 动效策略不变：只在 `--calm`/`--static` 停；系统 prefers-reduced-motion 不停（v0.3 决定，见 design-spec-v3 §3.1）。

### 7.2 输入卡四角括号（`[data-composer-card]::before`）
- 基础 α `--moss-corner-a` 从 .50 → **.92**（focus-within 1.0）；
- 臂长 14px → **18px**；线宽 1px → **2px**（用 2px 的 background-size 第二维 + 位置微调，保持 4 角对齐）；
- 呼吸：周期 3.2s；`opacity .22 ↔ 1.0`；`filter drop-shadow(0 0 0) ↔ drop-shadow(0 0 14px rgba(255,61,31,.9))`；
- 双击闪烁：每 6.4s 一次，谷值 0.10、每个 ~70ms（两连击间隔 90ms）；
- 额外「角标脉冲」：`::before` 的 `background-position` 不动，给 `::after` 加一条「四角向外的能量外扩」？
  **不做**（避免布局/动效风险），用光晕 + 透明度已足够「一眼可见」；
- 4 角必须齐全：在真实宿主 1920×1020 下逐一截图/取色断言 TL/TR/BL/BR 四角均有 ≥6 个红色像素
  且呼吸谷/峰值可测；若右下角被宿主子元素遮挡，提升 `::before` 的 `z-index`（但不得影响点击）或调整 `inset`。

---

## 8. 版本 / 生效 / 升级重播

- `package.json` version → **0.4.0**；`lib/client.js`：`FALLBACK_VERSION='0.4.0'`、`SPLASH_REV='v0.4-r1'`、
  客户端自举兜底 13000 → 14000；**`lib/index.js` 的 BOOTSTRAP_JS 宿主兜底 13000 → 14000**（v0.4 实测：splash 起播
  比页面 load 晚 ~0.7s，宿主 13.0s 兜底会落在 splash≈12.42s、提前打断 12.38–12.80 的淡出；改后宿主兜底≈splash 13.3s）。
- `lib/index.js` 若无需新资产/新路由则**不改**（避免宿主重启依赖；v0.4 不新增资产文件）。
- `test/smoke-*.mjs` 的硬编码时间线同步：11.8→12.8、11800→12800、10.60→11.55、13.0→14.0（splash 内）、
  8.1→8.3、10.0→10.35、11.0→11.8；`smoke-css-regress` 的红眼/括号动画断言同步到 §7 的新数值/结构。
- README/CHANGELOG/INSTALL 更新到 0.4.0；preview/index.html 重建（`node _tools/build-preview.mjs`）。

---

## 9. 写范围（协作契约）

| 角色 | 写范围 | 任务 |
|---|---|---|
| Lead | `docs/**`、`package.json`、`README.md`、`CHANGELOG.md`、`INSTALL.md`、`_work/v04/**`、集成与真宿主验收 | 规格/版本/整合/验收/交付/关机 |
| splash-smith | `lib/splash.js`、`lib/splash.css`、`_work/splash/v04/**` | §2、§3、§4、§5、§6 段 1–3 |
| skin-weaver | `lib/client.js`、`lib/skin.css`、`_work/skin/v04/**` | §5.4 交接协同、§6 client 侧、§7 |
| verifier | `test/**`、`preview/**`、`_work/verify4/**`、`docs/verify/v4/**` | 断言更新、场景矩阵、截图/音频/视频证据 |

- 唯一真值：本文件 + `lib/splash.js` 的 `TL` 常量。改时间线先改本文件 → 再改实现 → 再改测试。
- 冲突处理：`lib/splash.js` / `lib/splash.css` 只允许 splash-smith 写；`lib/skin.css` / `lib/client.js` 只允许
  skin-weaver 写；Lead 只在最终整合时改（改前先通知 owner）。

---

## 10. 验收（全部要证据）

1. **对齐**：§3.1 断言 5 帧全 PASS（偏差 ≤1.5px、正方形误差 ≤2px）；截图 t=7.42/7.78/8.05 人工目检「框正对主眼、四角对称」。
2. **音效**：§3.2 可听性契约全部 PASS（`__DSH_MOSS2_AUDIO_EVENTS__` 关节事件 ≥6、时点 ±0.10s、
   WAV 短时能量峰 ≥6 个且高出局部床 ≥8dB、7.42 为 6.5–8.5s 最高峰、True Peak ≤ -1.0dBFS、无 >0dBFS 样本）；
   WAV 时长 12.80±0.05、可播放。
3. **转场**：8.06–8.62 逐 0.08s 帧序列无「硬切/突兀黑帧」；分割线 scaleY 由 0→1；四角 fly-out 连续
   （相邻 ≥40ms 采样帧位移 ≤450px 且方向一致、无回跳）。
4. **地球**：§5.4 像素断言 PASS；t=9.4/10.2 无喷射（冷态区域均值亮度 < t=10.9 同区域的 55%，
   即幕 III 冷态需在 v0.4 首版基础上再压暗约 12%）、t=10.6/10.9 有喷射（≥ 冷态的 1.8 倍）；
   喷流进入画面与点火闪光峰值同帧 = 10.46±0.05s。
5. **交接**：§6.5 断言 PASS；12.30–12.80 逐帧 root opacity 单调递减；UI 显影 2.0s 可见（截图 12.9/13.3/13.8）。
6. **呼吸**：真实宿主（57123 隔离 verify profile）1920×1020：红眼 ring/core 在 t 与 t+1.1s 两帧的亮度差 ≥25%；
   四角括号四角齐全且谷/峰亮度差 ≥30%；`--calm` 停、系统 reduce 不停。
7. **回归**：`npm test` 全绿（更新后 5 套）；verify4 场景矩阵（normal/system-reduce/skip/missing-video/saver/immersive/glass/preview）全 PASS；
   `preview/index.html` 分幕跳转可用；无未捕获异常；MOSS 视频属性（filter/transform/src/playbackRate）未被改动。
8. **交付**：`docs/design-spec-v4.md`（本文件）、`docs/DELIVERY-REPORT-v0.4.md`、逐相位截图、锁帧对齐证据、
   可听 WAV、演示视频、`_重启接续.md` 更新、`dist`/`releases` 0.4.0 组合包。
