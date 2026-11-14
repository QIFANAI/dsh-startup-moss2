# MOSS2 v0.4 独立验收报告（verifier）

- 生成时间：2026-11-06T21:22:29.001Z
- 权威规格：[`docs/design-spec-v4.md`](../../design-spec-v4.md)
- 结论：**PASS**（77/77 断言通过，0 FAIL）
- 机器可读索引：[`docs/verify/v4/INDEX.json`](./INDEX.json)

## 1. 覆盖总览

| 验收组 | 来源 | 断言数 | 通过 | FAIL |
|---|---|---|---|---|
| npm test（5 套静态 smoke） | `_work/verify4/npm-test.log` | 5 | 5 | 0 |
| verify4 场景矩阵（真宿主 57123，8 场景） | `_work/verify4/assertions.json` | 8 | 8 | 0 |
| accept-v4 数值验收（spec §10.1/§10.2A/§10.3/§10.4/§10.5/§10.6） | `_work/verify4/accept-v4.json` | 50 | 50 | 0 |
| 音频证据（WAV 二次分析 + ebur128） | `_work/verify4/audio-report.json` | 13 | 13 | 0 |
| 演示视频（12.80s 含音轨） | `_work/demo/record-v4-report.json` | 1 | 1 | 0 |

## 2. 环境与输入指纹

- 隔离真宿主：`http://127.0.0.1:57123`（verify profile；宿主兜底 14000ms）
- 几何/像素断言：dev harness `http://127.0.0.1:8788/harness?splash=1` + `freeze(t)` 定格（真实 `lib/splash.js`/`splash.css`）
- UI/呼吸断言：真宿主 1920×1020；焦点/转场 1536×960（spec §3.1.2 示例尺寸）
- Chrome：`{"port":9381,"reused":true,"version":"Chrome/157.0.8103.26"}`

| 文件 | sha256 |
|---|---|
| `lib/index.js` | `2fc853e0e2e9b45cfbd4cdeca3fde9d93ee0e94b2676f681359271cf863345c4` |
| `lib/splash.js` | `d093461008d1338c8b73e4bcf9edfbf2feeb8f3523519c75ecf6acdfda19c863` |
| `lib/splash.css` | `5c03a661b7c2461f8faa460e76dbb738d0ecbd392dfb5f10369e619cd8387a6a` |
| `lib/client.js` | `03fe0f035ccd7287c0bf49c284d3ba9a445d775981b128f33b74eed78812ea8b` |
| `lib/skin.css` | `93f4f376d873f336a7defa26d7955279432567f9b6fc1fa17673d6d3cdee03b2` |
| `package.json` | `0ff9d2a0ee9b5e8610cbfd807014effbb8e5fcce11472645fb4821a7cc3674d2` |
| `preview/index.html` | `c61ec697727242d2404f379bc8ea5b2025b2f7e1b496acd669cad790bac4aafb` |

## 3. 断言明细

### 3.1 npm test（5 套静态 smoke）
来源：[`_work/verify4/npm-test.log`](../../../_work/verify4/npm-test.log)

| 断言 | PASS | 说明 |
|---|---|---|
| `smoke:host` host | PASS | 35/35 checks passed |
| `smoke:asset` asset | PASS | 24/24 checks passed |
| `smoke:splash` splash | PASS | 61/61 checks passed |
| `smoke:client/skin` client/skin | PASS | 27/27 checks passed |
| `smoke:v0.3 css/js regression` v0.3 css/js regression | PASS | 18/18 checks passed |

### 3.2 verify4 场景矩阵（真宿主 57123，8 场景）
来源：[`_work/verify4/assertions.json`](../../../_work/verify4/assertions.json)

| 断言 | PASS | 说明 |
|---|---|---|
| `scene:normal` normal | PASS | 38/38 PASS |
| `scene:system-reduce` system-reduce | PASS | 40/40 PASS |
| `scene:skip` skip | PASS | 27/27 PASS |
| `scene:missing-video` missing-video | PASS | 30/30 PASS（1 SKIP） |
| `scene:saver` saver | PASS | 29/29 PASS（1 SKIP） |
| `scene:immersive` immersive | PASS | 5/5 PASS |
| `scene:glass` glass | PASS | 5/5 PASS |
| `scene:preview` preview | PASS | 26/26 PASS |

### 3.3 accept-v4 数值验收（spec §10.1/§10.2A/§10.3/§10.4/§10.5/§10.6）
来源：[`_work/verify4/accept-v4.json`](../../../_work/verify4/accept-v4.json)

| 断言 | PASS | 说明 |
|---|---|---|
| `focus/viewport` 几何验收尺寸 1536×960（spec §3.1.2） | PASS | PASS |
| `focus/half-value` FOCUS_HALF = clamp(72, 0.104*min(W,H), 116) = 99.84（±0.5px） | PASS | PASS |
| `focus/corners-aligned` 五帧四角 bbox 中心 vs eye±FOCUS_HALF 偏差 ≤1.5px | PASS | PASS |
| `focus/center-aligned` 五帧框几何中心 = 主眼（偏差 ≤1.5px） | PASS | PASS |
| `focus/box-square` 五帧框为正方形：四角 bbox |w-h| ≤2px 且 |w-2*half| ≤2px | PASS | PASS |
| `focus/aligned-flag` focus.aligned=true 且 __DSH_MOSS2_LOCK__.focusAligned=true | PASS | PASS |
| `focus/old-frames-hidden` 7.42 起旧 .ms-gaze / .ms-tgt-corner 全部隐藏（opacity≈0） | PASS | PASS |
| `focus/no-jitter-7.78-8.06` 7.78/7.95/8.05 三帧框完全静止（四角 bbox 位移 ≤1px，无 jitter） | PASS | PASS |
| `transition/frames` 8.06–8.62 每 0.04s 共 15 帧全部定格成功 | PASS | PASS |
| `transition/seam-scaleY-0to1` 8.30–8.62 分割线 scaleY 由 0→1 单调不降（容差 .02） | PASS | PASS |
| `transition/seam-highlight` 接缝核心亮线宽 2±1px、高 ≥视口 90%、柔光/::before 存在 | PASS | PASS |
| `transition/no-black-frame` 序列中无黑帧（全帧均值亮度 ≥12） | PASS | PASS |
| `transition/no-hard-cut` 相邻 0.04s 帧无硬切突变（亮度差 ≤110，无全白帧） | PASS | PASS |
| `transition/flyout-corners` 对焦框四角 fly-out → 8.30 成为幕 III 四角标（位于视口四角内 26px±30px） | PASS | PASS |
| `transition/flyout-continuous` 四角 fly-out 连续（相邻帧位移 ≤450px 且向目标角单调靠近，无回跳） | PASS | PASS |
| `transition/data-wipe` 右 half 地球 data wipe 元素出现（8.30–8.62） | PASS | PASS |
| `transition/split-visible` 幕 III 分割层可见（opacity/display 正常） | PASS | PASS |
| `earth/frames` t=9.4/10.2/10.6/10.9 四帧定格成功 | PASS | PASS |
| `earth/cold-no-plasma` 幕 III 冷态：地球区蓝色高亮像素占比 <0.4%（t=9.4/10.2） | PASS | PASS |
| `earth/cold-dimmer` 幕 III 冷态亮度 < 点火后（t=10.9）同区域 55% | PASS | PASS |
| `earth/ignite-brighter` 点火后亮度 ≥ 冷态 1.8 倍（t=10.6/10.9 vs t=10.2） | PASS | PASS |
| `earth/probe-fields` __DSH_MOSS2_EARTH_STATE__ 发布 phase/scale/playbackRate/jetVisible/jetAt | PASS | PASS |
| `earth/jet-visible` 冷态 jetVisible=false（9.4/10.2）→ 点火后 jetVisible=true（10.6/10.9） | PASS | PASS |
| `earth/playback-rate` 幕 III playbackRate=0.65 → 幕 IV=1.0 | PASS | PASS |
| `earth/jet-flash-sync` 喷射进入画面 = 点火闪光峰值 = 10.46s（jetAt 10.46±0.05） | PASS | PASS |
| `handoff/flash` 12.30–12.52 冰白闪光峰值亮度 ≥190（0.92 白闪，freeze 定格）且之后回落（UI 帧 <峰值-60） | PASS | PASS |
| `handoff/fade-monotonic` 12.38–12.80 root opacity 逐帧单调递减（容差 .01，直到 root 移除） | PASS | PASS |
| `handoff/fade-start` 启动层淡出起点 12.38（样式设定 12.38，实测首帧变化 ≤12.56） | PASS | PASS |
| `handoff/root-gone` 12.80 后 root 移除 | PASS | PASS |
| `handoff/lock-removed` 12.80 后 html.moss-lock 移除 | PASS | PASS |
| `handoff/enter-hold` dsh-moss-enter 在 12.80 之后 ≥0.8s 仍在（UI 显影未结束；时间线采样 ±80ms） | PASS | PASS |
| `handoff/ui-reveal` UI 分区显影在 12.80 后 ≥1.0s 仍在（证据图 3 张） | PASS | PASS |
| `handoff/handoff-event` 11.80 派发 dsh-moss2:handoff（detail at=11.8 / t=12.3） | PASS | PASS |
| `handoff/probe-ok-before-1280` __DSH_MOSS2_HANDOFF__.ok=true 在 12.80 前发布 | PASS | PASS |
| `handoff/progress-100-at-12.30` t≥12.34 进度 100% 且完成态 | PASS | PASS |
| `handoff/moss-video-redline` MOSS 视频 filter/transform/playbackRate/src 未被 JS 改动 | PASS | PASS |
| `handoff/no-exceptions` 交接段无未捕获异常 | PASS | PASS |
| `audio/probe` __DSH_MOSS2_AUDIO_EVENTS__ 发布 [{kind,at,peak}] | PASS | PASS |
| `audio/joint-count` 4.0–7.2s 内 kind=joint 事件 ≥6 | PASS | PASS |
| `audio/joint-timing` joint 事件 at 与 8 个期望落点偏差 ≤0.10s（≥6 命中） | PASS | PASS |
| `audio/event-peaks` 事件峰值 0<peak≤0.12 | PASS | PASS |
| `audio/kinds` kind 覆盖 joint/latch/lock/ignite（至少 3 类） | PASS | PASS |
| `audio/lock-accent` 7.42 锁扣重音事件（kind=lock/latch ±0.10s） | PASS | PASS |
| `breathing/ui-settled` 真实宿主 UI 显影完成（splash 撤层） | PASS | PASS |
| `breathing/eye-found` 品牌红眼存在于真实宿主 UI | PASS | PASS |
| `breathing/eye-amplitude` 红眼 ring/core 亮度谷峰差 ≥25%（实测 16 帧） | PASS | PASS |
| `breathing/corners-present` 输入卡四角括号四角齐全（每角红色像素 ≥6） | PASS | PASS |
| `breathing/corners-amplitude` 四角括号谷/峰亮度差 ≥30% | PASS | PASS |
| `breathing/calm-stops` --calm 停止红眼/四角呼吸（animation:none） | PASS | PASS |
| `breathing/reduce-does-not-stop` 系统 prefers-reduced-motion:reduce 下红眼/四角呼吸仍在（v0.3 设计决定） | PASS | PASS |

### 3.4 音频证据（WAV 二次分析 + ebur128）
来源：[`_work/verify4/audio-report.json`](../../../_work/verify4/audio-report.json)

| 断言 | PASS | 说明 |
|---|---|---|
| `audio/wav-exists` 新 WAV 存在（_work/demo/moss2-boot-audio.wav） | PASS | {"bytes":2257964} |
| `audio/baseline-exists` v0.3 基线 WAV 存在（对比参考） | PASS | {"path":"E:\\dshdesign\\dsh-startup-moss2\\_work\\verify4\\baseline\\moss2-boot-audio-v03.wav"} |
| `audio/python-analysis` Python/numpy 二次能量分析可执行 | PASS | {"durationSec":12.8} |
| `audio/wav-format` WAV 可播放：44.1kHz / 16bit / 2ch / PCM | PASS | {"codec":"pcm_s16le","sample_rate":"44100","channels":2,"bits_per_sample":16,"format":"wav"} |
| `audio/wav-duration` 时长 12.80±0.05s | PASS | {"durationSec":12.8,"target":"12.80±0.05"} |
| `audio/no-over-0dbfs` 无 >0 dBFS 样本 | PASS | {"samplesOver0dBFS":0,"peakSampleDbfs":-1.81} |
| `audio/joint-peaks-count` 4.0–7.2s 短时（80ms）能量峰 ≥6 个（高出局部 400ms 床 ≥8dB） | PASS | {"peakCount":7,"peaks":[{"t":4.26,"contrastDb":9.12,"energyDb":-15.48,"bedDb":-24.6},{"t":5.22,"contrastDb":13.87,"energyDb":-12.73,"bedDb":-26.6},{"t":5.58,"contrastDb":12.83,"energyDb":-13.94,"bedDb":-26.77},{"t":5.92,"contrastDb":8.76,"energyDb":-11.42,"bedDb":-20.17},{"t":6.24,"contrastDb":8.55,"energyDb":-13.62,"bedDb":-22.16},{"t":6.66,"contrastDb":10.78,"energyDb":-14.78,"bedDb":-25.56},{"t |
| `audio/joint-peaks-contrast` 每个能量峰高出局部床 ≥8dB | PASS | {"weak":[],"thresholds":{"shortWinMs":80,"bedWinMs":400,"minContrastDb":8}} |
| `audio/lock-anchor` 6.5–8.5s 最高峰 = 7.42±0.10s（锁扣重音锚点） | PASS | {"anchor":{"t":7.5,"energyDb":-7.75},"target":"7.42±0.10"} |
| `audio/baseline-reference` 给出 4.0–8.0s mean/max volume 与 v0.3 基线对比（参考，不作门槛） | PASS | {"new":{"meanVolumeDbfs":-16.73,"maxVolumeDbfs":-1.81,"samples":352800},"v03":{"meanVolumeDbfs":-19.08,"maxVolumeDbfs":-1.86,"samples":352800}} |
| `audio/true-peak` True Peak ≤ -1.0 dBFS（ebur128 peak=true Summary） | PASS | {"truePeakDb":-1.5,"ebur128":{"ok":true,"integratedLufs":-17.7,"lraLu":7.2,"truePeakDb":-1.5,"status":0}} |
| `audio/spectrum-evidence` 频谱图证据已生成（听感结构） | PASS | {"file":"_work/verify4/audio-spectrum.png"} |
| `audio/render-audio-events` 离线渲染同样生成 __DSH_MOSS2_AUDIO_EVENTS__（joint ≥6） | PASS | {"count":12,"kinds":["joint","latch","lock","ignite"]} |

### 3.5 演示视频（12.80s 含音轨）
来源：[`_work/demo/record-v4-report.json`](../../../_work/demo/record-v4-report.json)

| 断言 | PASS | 说明 |
|---|---|---|
| `demo/mp4` 演示视频可用（时长/流/音轨） | PASS | duration=12.980227s frames=196 streams=[{"type":"video","codec":"h264","w":1600,"h":1000,"rate":"30/1"},{"type":"audio","codec":"aac","rate":"0/0","sr":"44100","ch":2}] |

## 4. 关键数值证据

| 项 | 证据 |
|---|---|
| 对焦五帧 | {"frames":[{"t":7.42,"maxDev":0.03,"devs":[{"corner":"tl","dx":0,"dy":-0.02,"dist":0.02},{"corner":"tr","dx":0.02,"dy":-0.02,"dist":0.03},{"corner":"bl","dx":0,"dy":-0.01,"dist":0.01},{"corner":"br","dx":0.02,"dy":-0.01,"dist":0.02}]},{"t":7.6,"maxDev":0.03,"devs":[{"corner":"tl","dx":0,"dy":-0.02,"dist":0.02},{"corner":"tr","dx":0.02,"dy":-0.02,"dist":0.03},{"corner":"bl","dx":0,"dy":-0.01,"dist":0.01},{"corner":"br","dx":0.02,"dy":-0.01,"dist":0.02}]},{"t":7.78,"maxDev":0.03,"devs":[{"corner":"tl","dx":0,"dy":-0.02,"dist":0.02},{"corner":"tr","dx":0.02,"dy":-0.02,"dist":0.03},{"corner":"bl", |
| 框正方形/静止 | {"frames":[{"t":7.42,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85},"square":0.01,"widthVs2Half":0.02},{"t":7.6,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85},"square":0.01,"widthVs2Half":0.02},{"t":7.78,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85},"square":0.01,"widthVs2Half":0.02},{"t":7.95,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85},"square":0.01,"widthVs2Half":0.02},{"t":8.05,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85},"square":0.01,"widthVs2Half":0.02}]} / {"maxShift":0,"boxes":[{"t":7.78,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85}},{"t":7.95,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85}},{"t":8.05,"box":{"x":456.19,"y":417,"w":199.7,"h":199.69,"cx":556.04,"cy":516.85}}]} |
| 转场 seam scaleY | {"first":0,"last":1,"steps":[]} |
| 地球冷态像素 | {"t94":{"ratio":0,"blue":0,"total":193680},"t102":{"ratio":0}} / {"t94":7.41,"t102":7.99,"t109":20.06} |
| 地球点火亮度 | {"t102":7.99,"t106":22.19,"t109":20.06} / {"jetAt":10.46,"expected":"10.46±0.05"} |
| 交接淡出 | {"count":28,"bad":null,"first":{"wall":1794000038535,"t":12.32740000000596,"op":1,"root":true,"state":"playing"},"last":{"wall":1794000039007,"t":12.796700000017882,"op":0.0783146,"root":true,"state":"handoff"},"goneWall":1794000039047} / {"firstBelow":{"wall":1794000038751,"t":12.541400000005961,"op":0.987137,"root":true,"state":"handoff"}} |
| UI 显影 | {"at800":{"ago":794,"enter":true,"anims":7},"enterSamples":50} |
| 红眼/四角呼吸 | {"samples":[12.4,14.9,16.7,12.5,15.6,15.8,11.9,17.7,12,15.6,11.8,16.4,15.3,12.4,17.1,13.4],"max":17.7,"min":11.8,"diffRatio":0.329} / {"tl":{"maxRedPixels":44,"ampRatio":0.715,"means":[11.7,31.8,38.6,17,14,26.1,38.7,15.4,14.8,41.1,13.8,19.8,36.5,36,12.9,16.6]},"tr":{"maxRedPixels":44,"ampRatio":0.67,"means":[31.5,51.8,46.2,20.9,28.6,38.9,45.5,37.5,31.1,38.8,27.7,33.5,63.5,44.1,29.1,29.3]},"bl":{"maxRedPixels":44,"ampRatio":0.755,"means":[12.3,33.4,33.8,12.4,16.7,33.2,34.2,11.3,16.3,27.7,10,21.2,40,27.5,9.8,21.4]},"br":{"maxRedPixels":44,"ampRatio":0.614,"means":[21.9,44.5,39.9,18.6,24,43.8,36.3,18.2,29.9,29.3,21.9,28.2,47.3,32.2,19.2,35.9]}} |

音频 WAV（`_work/demo/moss2-boot-audio.wav`）：

- 时长 12.800000s；True Peak -1.5 dBFS；4.0–8.0s mean/max = {"meanVolumeDbfs":-16.73,"maxVolumeDbfs":-1.81,"samples":352800}（v0.3 基线 {"meanVolumeDbfs":-19.08,"maxVolumeDbfs":-1.86,"samples":352800}，仅参考）
- 4.0–7.2s 短时（80ms/20ms hop）能量峰 7 个（局部 400ms 床取扣除 ±60ms 事件窗的中位能量，≥8dB）：[4.26,5.22,5.58,5.92,6.24,6.66,6.9]
- 6.5–8.5s 最高峰：{"t":7.5,"energyDb":-7.75}（7.42 锁扣重音锚点）

演示视频：[_work/demo/moss2-boot-demo-v4.mp4](../../../_work/demo/moss2-boot-demo-v4.mp4)（12.980227s，196 帧，H.264+AAC，viewport 1600×1000，audio 44100Hz/2ch）

- [demo-v4-t7.45.png](../../../_work/demo/demo-v4-t7.45.png)
- [demo-v4-t10.9.png](../../../_work/demo/demo-v4-t10.9.png)
- [demo-v4-t11.2.png](../../../_work/demo/demo-v4-t11.2.png)
- [demo-v4-t12.75.png](../../../_work/demo/demo-v4-t12.75.png)

## 5. 逐帧 / 场景截图

### 5.1 accept-v4 定格帧（1536×960 harness / 1920×1020 真宿主）

**focus**（5）

- [focus-t7_42.png](../../../_work/verify4/accept/focus-t7_42.png)
- [focus-t7_6.png](../../../_work/verify4/accept/focus-t7_6.png)
- [focus-t7_78.png](../../../_work/verify4/accept/focus-t7_78.png)
- [focus-t7_95.png](../../../_work/verify4/accept/focus-t7_95.png)
- [focus-t8_05.png](../../../_work/verify4/accept/focus-t8_05.png)

**transition**（15）

- [trans-t8_06.png](../../../_work/verify4/accept/trans-t8_06.png)
- [trans-t8_1.png](../../../_work/verify4/accept/trans-t8_1.png)
- [trans-t8_14.png](../../../_work/verify4/accept/trans-t8_14.png)
- [trans-t8_18.png](../../../_work/verify4/accept/trans-t8_18.png)
- [trans-t8_22.png](../../../_work/verify4/accept/trans-t8_22.png)
- [trans-t8_26.png](../../../_work/verify4/accept/trans-t8_26.png)
- [trans-t8_3.png](../../../_work/verify4/accept/trans-t8_3.png)
- [trans-t8_34.png](../../../_work/verify4/accept/trans-t8_34.png)
- [trans-t8_38.png](../../../_work/verify4/accept/trans-t8_38.png)
- [trans-t8_42.png](../../../_work/verify4/accept/trans-t8_42.png)
- [trans-t8_46.png](../../../_work/verify4/accept/trans-t8_46.png)
- [trans-t8_5.png](../../../_work/verify4/accept/trans-t8_5.png)
- [trans-t8_54.png](../../../_work/verify4/accept/trans-t8_54.png)
- [trans-t8_58.png](../../../_work/verify4/accept/trans-t8_58.png)
- [trans-t8_62.png](../../../_work/verify4/accept/trans-t8_62.png)

**earth**（4）

- [earth-t10_2.png](../../../_work/verify4/accept/earth-t10_2.png)
- [earth-t10_6.png](../../../_work/verify4/accept/earth-t10_6.png)
- [earth-t10_9.png](../../../_work/verify4/accept/earth-t10_9.png)
- [earth-t9_4.png](../../../_work/verify4/accept/earth-t9_4.png)

**handoffFlash**（7）

- [handoff-flash-t12_26.png](../../../_work/verify4/accept/handoff-flash-t12_26.png)
- [handoff-flash-t12_3.png](../../../_work/verify4/accept/handoff-flash-t12_3.png)
- [handoff-flash-t12_34.png](../../../_work/verify4/accept/handoff-flash-t12_34.png)
- [handoff-flash-t12_38.png](../../../_work/verify4/accept/handoff-flash-t12_38.png)
- [handoff-flash-t12_42.png](../../../_work/verify4/accept/handoff-flash-t12_42.png)
- [handoff-flash-t12_46.png](../../../_work/verify4/accept/handoff-flash-t12_46.png)
- [handoff-flash-t12_5.png](../../../_work/verify4/accept/handoff-flash-t12_5.png)

**handoffUi**（3）

- [handoff-ui-100.png](../../../_work/verify4/accept/handoff-ui-100.png)
- [handoff-ui-450.png](../../../_work/verify4/accept/handoff-ui-450.png)
- [handoff-ui-900.png](../../../_work/verify4/accept/handoff-ui-900.png)

### 5.2 场景矩阵截图

| 场景 | 目录 | 张数 |
|---|---|---|
| normal | `_work/verify4/shots/normal` | 21 |
| system-reduce | `_work/verify4/shots/system-reduce` | 9 |
| skip | `_work/verify4/shots/skip` | 23 |
| missing-video | `_work/verify4/shots/missing-video` | 21 |
| saver | `_work/verify4/shots/saver` | 21 |
| immersive | `_work/verify4/shots/immersive` | 3 |
| glass | `_work/verify4/shots/glass` | 3 |
| preview | `_work/verify4/shots/preview` | 14 |

## 6. FAIL 清单

无。

## 7. 未验证项 / 口径说明

- **MOSS 视频红线**采用「JS 未写 inline filter/transform、src/playbackRate 未被改」口径；`.ms-act--moss .ms-video` 的 CSS 色彩分级（v0.2 设计）属静态样式，已记录 computed 值但不判违规。
- **音频床能量口径**：局部 400ms 床取「扣除 ±60ms 事件窗后的中位能量」，避免事件抬高自身基线（若用朴素滑动均值会把 8dB 对比度低估至约 5dB）。
- **转场“无硬切”**以每 0.04s 定格帧的全帧均值亮度连续性与无全白帧判定；真实 wall-clock 播放同帧性由 50ms 采样器与 freeze 帧共同佐证。
- **preview 页**由 verifier 生成脚本 `_work/verify4/build-preview-v4.mjs` 重建（v0.4.0 badge、10 个关键帧跳转、focus/earth 读数）；生成器 `_tools/build-preview.mjs` 属 Lead 写范围，未改。
- 用户正在使用的真实宿主 50022 全程未触碰；所有真宿主验收均在隔离 verify profile 57123 完成。
- **矩阵 SKIP（2 项，非 FAIL）**：saver / missing-video 场景按设计不加载视频，`moss-video-redline` 不适用（由 `saver-no-video-request` / `saver-no-splash-video` / `missing-video-error-caught` 覆盖）。
- 宿主 13.0s 兜底（lib/index.js）按 spec 不改；隔离宿主已重启为 14000 兜底并实测。

## 8. 复现命令

```powershell
npm test                                            # 5 套静态 smoke
node _work/verify4/run.mjs                          # 8 场景矩阵（真宿主 57123）
node _work/verify4/accept-v4.mjs                    # §10 数值验收（harness + 真宿主）
node _work/demo/render-audio.mjs                    # 重新渲染 12.80s WAV
node _work/verify4/analyze-audio.mjs                # WAV 二次分析 / True Peak / 关节对比度
node _work/verify4/build-preview-v4.mjs             # 重建 preview/index.html
node _work/demo/record-v4.mjs                       # 录制演示视频（含音轨）
node _work/verify4/make-report.mjs                  # 汇总本报告 + INDEX.json
```
