# dsh-startup-moss2 · v0.2 启动动画（splash）真宿主验收报告

> 状态：**FINAL（2026-11-06 19:5x 冻结版）** — 被测代码指纹见 `_work/verify2/assertions.json` / `_work/verify2/REPORT.md` §1。
> 生成：2026-11-06（Asia/Shanghai）｜执行：verifier（独立验收，不改 lib/ 产品代码）
> 唯一设计权威源：`docs/design-spec-v2.md`（§4 时间线 / §6 DOM+API 契约 / §10 验收）
> 环境：隔离真宿主 port **57123**（profile `verify`，DSH_HOME=`_work/verify-home`，插件 `link:` 安装）
> 浏览器：headless Chrome（独立实例 port **9344**，1536×960，DPR 1），CDP 驱动 `_work/verify2/lib/cdp.mjs`

## 1. 结论（冻结版最终矩阵）

| 场景 | 断言 | 结论 | 证据 |
|---|---|---|---|
| normal（no-preference） | **30/30** | **PASS** | `docs/verify/splash-v2/normal/`、`sheet-normal.png` |
| system-reduce（模拟本机系统关动画） | **34/34** | **PASS** | `docs/verify/splash-v2/system-reduce/`、`sheet-system-reduce.png` |
| skip（Esc） | **20/20** | **PASS** | `docs/verify/splash-v2/skip/`、`sheet-skip.png` |
| missing-video（全 mp4 请求 abort → 404 降级） | **23/23** | **PASS** | `docs/verify/splash-v2/missing-video/`、`sheet-missing-video.png` |
| saver（quality=saver，零视频请求） | **22/22** | **PASS** | `docs/verify/splash-v2/saver/`、`sheet-saver.png` |
| immersive（皮肤沉浸档） | **20/20** | **PASS** | `docs/verify/skin-v2/immersive/` |
| glass（皮肤默认档） | **21/21** | **PASS** | `docs/verify/skin-v2/glass/` |
| preview（真宿主 `/dsh-moss2/preview`） | **15/15** | **PASS** | `docs/verify/skin-v2/preview/` |
| **合计** | **185/185，0 FAIL** | **PASS** | `_work/verify2/assertions.json` |

关键数值（normal 冻结版）：未捕获异常 **0**；三支视频 paused=false 且 currentTime 递增（neuro advances=28 / moss=163 / earth=42）；交接后背景两帧截图差 meanAbs=**4.21**、ratio=**0.143**（>0 证明在动）；交接几何 rect≤2px/transform 相同（页面内采样器窗口 22 条全 PASS）；交接后连续三帧 splash t=10.6/11.0/11.4 的 |ΔcurrentTime| 最小 **0.028s**（≤0.3）；finishRel **12.22s**（root 出现→移除 12.01s，含 host 引导延迟）。

## 2. 复现命令

```powershell
Set-Location E:\dshdesign\dsh-startup-moss2
$node = "C:\Users\26547\.local\node-v24.21.0-win-x64\node.exe"

# 全场景矩阵（默认 8 场景；lib/index.js 改动后加 --restart-host）
& $node _work\verify2\run.mjs
& $node _work\verify2\run.mjs --scenarios normal,system-reduce,skip,missing-video,saver
& $node _work\verify2\run.mjs --restart-host          # 冻结后最终版

# 冻结后串行：全矩阵 → 演示录制 → 对比度 → 证据打包 → npm test
& $node _work\verify2\record.mjs
& $node _work\verify2\contrast.mjs
& $node _work\verify2\finalize.mjs
npm test
```

冻结版状态：`npm test` **99/99 全绿**（host 35 / assets 24 / splash 19 / client-skin 21）；完整断言明细见 `_work/verify2/REPORT.md` 与 `docs/verify/splash-v2/assertions.json`。

## 3. 截图索引（每个场景 13 个时间点，冻结后回填逐张核对结论）

spec §10.2 指定时间点：t=0.6 / 2.2 / 3.6 / 4.2 / 5.2 / 6.8 / 7.4 / 8.3 / 8.8 / 9.4 / 10.2 / 11.2 / 12.5（秒）
落盘：`_work/verify2/shots/<scenario>/<scenario>-t<t>.png`（1536×960）。

| 幕 | 时间窗口 | 应所见（spec §4） | 截图 | 核对 |
|---|---|---|---|---|
| 黑场 | 0.00–0.50 | 纯黑 + 冰白细线 + `DEEPSEEK HARNESS // BOOT` | `normal/normal-t0.6.png`（freeze 0.6） | **PASS**（t=0.6 已入 I 幕，黑场见录屏 0–0.5s） |
| I 神经接口 | 0.50–3.90 | BCI 面板视频 + `DEEPSEEK HARNESS` 品牌 + `NEURAL INTERFACE · 神经接口` + 启动日志/LINK 环 | `normal/normal-t0.6/2.2/3.6.png` | **PASS** |
| II MOSS 苏醒 | 3.90–8.10 | 全屏 MOSS 实拍 + `550W / MOSS SYSTEM / 中国航天局 · 量子计算机` + 遥测/进度条 + 7.10 红眼锁定 + 引文 | `normal/normal-t4.2/5.2/6.8/7.4.png` | **PASS** |
| III 转场 | 8.10–10.00 | 竖直对半（左 MOSS/右地球）+ 接缝 8.90 起左扫 + `移交控制权` | `normal/normal-t8.3/8.8/9.4.png` | **PASS** |
| IV 地球 | 10.00–11.80 | 地球全屏 + `流浪地球计划 · 已启动 / 地球发动机 全功率`；10.60 armHandoff | `normal/normal-t10.2/11.2.png` | **PASS**（armHandoff ok，ctDiff 0.03–0.11s） |
| 交接后 UI | ≥11.80 | 启动层撤除、`dsh-moss-enter` 分区显影、动态地球背景 | `normal/normal-t12.5.png` | **PASS**（背景两帧差 meanAbs 4.21、ratio 0.143） |

## 4. 断言口径（spec §10 映射）

| spec §10 | 断言 id（`_work/verify2/report-*.json`） | 说明 |
|---|---|---|
| 1 真宿主冒烟 / 品牌位冲突 | `exceptions` / `brand-slot` | Runtime.exceptionThrown=0；不得出现 `single slot "sidebar.brand.mark"` |
| 2 正常播放序列 | `act1-window` `act2-window` `act3-window` `split-dom` `video-neuro` `video-moss` `video-earth` `duration` | 每幕可见窗口；三支视频 paused=false 且 currentTime 递增；总时长 11.8s |
| 3 背景真的在动 | `ambient-play` `ambient-src` `bg-motion-canvas` `bg-motion-shot` | 交接后 ambient 在播；两帧像素差 > 0（canvas 采样 + 真截图 2s 间隔） |
| 4 系统 reduce 不阉割 | `media` `reduce-full` `reduce-3videos` `reduce-moss-visible` `reduce-earth-visible` | Emulation reduce 下三支视频照播、仍 11.8s、MOSS/地球可见 |
| 5 Esc 跳过 | `skip-earth` `skip-handoff` `skip-finished` `skip-no-moss` `skip-ambient` | ≤1.2s 进地球幕并 armHandoff；启动层撤除；之后 ambient 在播 |
| 6 资源缺失降级 | `missing-sim` `missing-duration` `missing-netfail` `missing-fallback` `missing-poster` `static-cause` | 全 mp4 abort 后仍 ≤13s 交接、无异常、海报兜底、--static 仅由降级引起 → **PASS** |
| 7 saver | `saver-config` `saver-no-video-request` `saver-no-splash-video` `saver-poster` `static-cause` | 零 .mp4 网络请求；启动层视频无 src；海报可见；仍完整走完 |
| 9 交接无跳帧 | `handoff-published` `handoff-class` `handoff-geometry` `handoff-frame-sync` `handoff-frame-diff` | 以 `__DSH_MOSS2_HANDOFF__.at` 为界：handoff 后 1.5s 内 rect≤2px/transform 一致；splash t=10.6/11.0/11.4 三帧 |ΔcurrentTime|≤0.3s；11.2→12.5 画面均差 <32 |
| 10 UI 可读性 | 见 `docs/verify/skin-v2/README.md` | veil=58 默认观感/对比度复核 |
| 11 包体 + npm test | `_work/verify2/report-*.json` + `npm test` | lib/assets ≤26MB；四个 smoke 全绿 |

## 5. 未验证项 / 环境限制（诚实清单）

- [ ] 真实 Electron 窗口内录屏验收（本报告全部来自 headless Chrome + 真宿主 HTTP/JS 运行时）
- [ ] 声音听感（WebAudio 程序化音效；headless `--mute-audio`，只验证失败静默降级路径）
- [ ] 4K / 高刷屏观感、GPU 合成性能
- [ ] 真实鼠标点击 Esc 之外的宿主快捷键冲突（Esc 用 CDP `Input.dispatchKeyEvent` 注入）
- [ ] 用户机器若配置了 `reducedMotion=true`（显式）时的 --calm 观感（静态契约已断言；运行时截图待第二版视觉冻结后补）
