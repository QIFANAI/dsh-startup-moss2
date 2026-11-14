# DELIVERY REPORT — dsh-startup-moss2 v0.4.0（用户 5 项反馈 · 对焦版）

> 生成：2026-11-07 05:25（Asia/Shanghai）｜ 交付状态：**已完成并全绿（77/77 断言 0 FAIL）**
> 设计权威源：`docs/design-spec-v4.md`（v0.4 增量）+ `docs/design-spec-v3.md` + `docs/design-spec-v2.md`
> 验证证据：`docs/verify/v4/`、`_work/verify4/`、`_work/splash/v04/`、`_work/skin/v04/`、`_work/v04/`
> 上一版：`docs/DELIVERY-REPORT-v0.3.md`

---

## 0. 结论（先看这段）

用户 5 条反馈已全部落地并经**数值与逐帧证据**验证：

| # | 用户反馈 | 结果 |
|---|---|---|
| 1a | 第二幕终局「对焦」方框没对齐 | **修复**：v0.3 实测为 140.4×86.2 扁框、框心右偏 34.8px/下偏 9.7px；v0.4 新增 `.ms-tgt-focus` 对称框，7.42–8.05 五帧四角中心 vs 主眼偏差 **0.024px**、框 **199.70×199.69**（1536×960）/ **212.2×212.1**（1600×1020），锁定后完全静止；旧 gaze/角框全部隐藏 |
| 1b | 没有随机械臂活动的机械关节音效 | **新增**：内联视频 150 帧运动包络，13 条关节/锁止事件（4.23–7.17s，逐事件 push 到 `__DSH_MOSS2_AUDIO_EVENTS__`）；离线 WAV 500–4000Hz 频段 6 个事件对比 ≥8dB；第二幕 RMS 比 v0.3 **+2.35dB**；TP **-1.5dBFS** 无削波 |
| 2 | 第二→三幕转场太草率 | **重做**：8.06–8.30 准心十字线延伸为分割线、对焦框四角 fly-out；8.30 分割线 scaleY 画入、左 MOSS 冻结（均值亮度 30.7/255、红眼可见）、右地球 data-wipe 冷态显影、接缝数据包、点火预告；闪白从硬切 0.36@0.06s 降为 0.10s 峰值 0.30 |
| 3 | 第三幕地球还没开始喷射 | **修复**：幕 III 圆形遮罩只留「静默行星 + 大气边缘」（尾迹不可见：右 35% 蓝高亮 0.021%），冷调亮度 46.6% 于点火后；幕 IV **10.46s** 点火闪光峰值同帧喷流进入画面（10.6/10.9 为冷态 **2.15×**） |
| 4 | 最后一幕→操作界面过渡太简短草率 | **重做**：11.80 BOOT COMPLETE 印章 + HUD 收束 → 12.30 冰白闪光（峰值 0.92）→ 12.38 起 420ms 淡出（实测 12.464→12.8 opacity 0.999→0.018 单调）→ 12.80 finish；UI 侧 `dsh-moss-enter` 1.6–2.0s 分级显影（handoff 事件 11.811s 触发、hold 2001ms），背景 ambient 不二次淡入 |
| 5 | 呼吸闪烁几乎感受不到；四角只看到 3 个 | **拉满**：红眼 ring/core/halo/wrap 五层幅度最大化（hero 1.1s 两帧 lumaΔ46.2%/redΔ87.5%、侧栏 45.1%/85.4%）；四角括号 2px/18px/α.92/光晕14px/谷.10，真实宿主每角 **68 红像素**（v0.3 仅 11–27）、谷峰差 **94–99%**，四角齐全 |

总时长 11.80s → **12.80s**；`lib/index.js` 本轮有改（宿主兜底 13000→14000，需宿主重载——关机重启自然生效）。

## 1. 冻结哈希（v0.4.0）

| 文件 | 字节 | SHA256 前 16 |
|---|---|---|
| `lib/index.js` | 23,276 | 2FC853E0E2E9B45C |
| `lib/client.js` | 63,888 | 03FE0F035CCD7287 |
| `lib/skin.css` | 94,683 | 93F4F376D873F336 |
| `lib/splash.js` | 186,456 | D093461008D1338C |
| `lib/splash.css` | 75,218 | 5C03A661B7C2461F |
| `preview/index.html` | 74,226 | C61EC697727242D2 |
| `package.json` | 1,825 | 0FF9D2A0EE9B5E86（0.4.0） |

## 2. 逐项交付明细

（见 §2.1–2.5，最终定稿时由 Lead 汇总各 owner REPORT 的数值与证据路径。）

### 2.1 第二幕终局对焦（§3.1）
- 新增 `.ms-tgt-focus`（四角 + 四边 tick + 内环），`FOCUS_HALF=clamp(72,0.104*min(W,H),116)`；几何中心 = `computeEyePoint()`。
- 主眼坐标修正 `EYE=(0.3758,0.5384)`（视频逐帧实测 0.375806/0.538880，点亮后漂移 1.35px）；红眼点亮 `gazeIn=7.16`。
- 行程：7.42–7.62 收口 1.16×→1.00×、7.62–7.72 过冲回落、7.78 后完全静止（无 jitter）。
- 旧框治理：`.ms-gaze-corner`/`.ms-tgt-corner` 7.42 起 opacity 0（不再两套框叠加）。
- 证据：`_work/splash/v04/report-1536x960.json`（5 帧 maxDev 0.024）、`_work/v04/lead-review/report-1600x1020.json`、截图 `_work/v04/lead-review/lead-1600x1020-t7_78.png`。

### 2.2 机械关节音效（§3.2）
- `MOSS_JOINTS` 13 条（4.23/4.40/4.57/4.73/5.17/5.23/5.53/5.87/6.03/6.17/6.63 latch/6.87/7.17 focus），随视频运动峰与机械臂微动（arm 区 5× 局部中位）对齐。
- 离线 WAV：12.800s / 44.1k / 16bit / 2ch / TP -1.5dBFS / 无削波；500–4000Hz 6 个事件 ≥8dB 对比、命中 6/11；全片峰值在 7.42 锁定重音。
- 证据：`_work/demo/moss2-boot-audio.wav`、`_work/demo/audio-render-report.json`、`_work/splash/v04/audio/band-check-v04.txt`、`_work/v04/audio-band-check.py`。

### 2.3 第二→三幕转场（§4）
- 8.06–8.30 预转场（十字线延伸、四角 fly-out、8.24 拉丝）；8.30 分割线 scaleY 0→1；左 MOSS 冻结（saturate .82 / brightness 1.18、左半区均值 30.71、红眼像素 1529）；右幕 data-wipe 4 条扫描带；接缝数据包 ×3；9.82 点火预告；10.02–10.35 左扫。
- 证据：`_work/splash/v04/shots/m-1536x960-t8_*.png`、`_work/verify4/accept/`。

### 2.4 三幕冷态地球 / 四幕点火（§5）
- 素材分析：`_work/v04/assets-analysis/earth.json`（尾迹全程存在、最亮 4.57–6.07s、最暗 20.27–21.77s、行星几何）。
- 幕 III：圆形遮罩（行星半径通配）+ 冷调 `brightness(1.06) saturate(.72) contrast(1.06)`，seek 20.27s / 0.65×；右 35% 蓝高亮 0.021%。
- 幕 IV：10.35 起遮罩放大 + scale/translate 回落 + 滤色过渡；10.46 闪光峰值 = 喷流进入画面；10.6/10.9 冷态 2.15×；11.55 ct=5.77；11.80 后 transform/filter 冻结。
- 证据：`_work/splash/v04/shots/m-1536x960-t9_4/10_2/10_35/10_46/10_6/10_9.png`。

### 2.5 四幕→UI 交接（§6）+ 皮肤呼吸（§7）
- splash：11.80 `dsh-moss2:handoff`、BOOT COMPLETE 印章（12.06–12.36）、HUD 收束、12.30–12.52 闪光、12.38 420ms 淡出、12.80 finish；root opacity 单调 0.999→0.018。
- skin：`enterUI(2000, base 620ms)` 真链路 hold 2014ms；`dsh-moss-enter` 1.6–2.0s 分级显影（12.9/13.3/13.8 三帧）；ambient 恒 1 不二次淡入。
- 呼吸：见 §0 第 5 行；`--calm` 停、系统 reduce 不停（Δ25–55%）。
- 证据：`_work/skin/v04/out/compare-corners-before-after.png`、`out/breath/`、`out/enter-realtime/`、`_work/splash/v04/probe-handoff*.mjs`、`_work/v04/lead-opacity-live.mjs`、`_work/v04/lead-live-fast.mjs`。

## 3. 场景/回归矩阵（全部 PASS）

- `npm test`（5 套 smoke，v0.4 契约）：**165/165**（host 35、assets 24、splash 61、client 27、css-regress 18）
- `_work/verify4/run.mjs` 8 场景矩阵（真宿主 57123）：**200 断言 0 FAIL / 2 SKIP**（normal 38、system-reduce 40、skip 27、missing-video 30、saver 29、immersive 5、glass 5、preview 26）
- `_work/verify4/accept-v4.mjs`：**50/50 PASS**（对焦/转场/地球/交接/音频/呼吸）
- `_work/splash/v04/regress-v04.mjs`：21/21 PASS（normal/skip/calm/saver/missing-video，零未捕获异常）
- 真宿主（57123 profile=verify，真实 web app）：lead-real-host 12 项检查全过（handoff 事件 11.809s、audio ctx ok、audioEvents 13、ambient 播放、root 移除、skin 应用、零异常）；12.45–12.8 采样盲区已由高频率 opacity 探针补齐（12.464→12.8：0.999→0.018 单调）
- 证据：`docs/verify/v4/REPORT.md` + `INDEX.json`（**77/77 PASS，0 FAIL**）

## 4. 生效与安装

- 插件以 `link:` 安装于 `~/.dsh/profiles/desktop`；v0.4 改了 `lib/index.js`（宿主兜底 13→14s），**需宿主重载**；
  本次交付以「优化完成后自动关机」收尾，**下次开机 DSH 启动即加载 v0.4.0**，并按 `SPLASH_REV=v0.4-r1`
  变化自动补播一次新启动动画（用户配置 mode=daily）。
- 回滚：`_work/splash/v04/backup/`（v0.3 splash.js/css 原件）；`lib/` 其余文件可用 v0.3 tgz（`releases/dsh-startup-moss2-0.3.0.tgz`）恢复。

## 5. 已知问题 / 降级行为

- 仅刷新页面不重启宿主时，旧宿主 13.0s 兜底可能比新时间线早约 0.4s 触发（会截断交接尾巴）；**验收请用重载后的宿主**。
- `saver` 档无视频、只用海报：幕 III 冷态遮罩/点火闪烁仍可用（CSS 层）；`--calm` 下装饰动画减少但叙事保留。
- 系统 `prefers-reduced-motion: reduce` 永不停视频与时间线（本机 Windows 即 reduce，属硬红线）。

## 6. 性能

- 第二幕新增叠加层均为合成层（transform/opacity 驱动），无每帧布局读写；第三幕新增 1 个圆遮罩（CSS mask，逐帧仅改渐变字符串，已做 `__msMask` 缓存）；视频仍为三支非同时播放（幕 I/II/III–IV）。
- 第四幕地球层 11.80 后冻结 transform/filter，交接零跳变。

## 7. 文件清单（v0.4 改动）

- 改：`lib/splash.js`（+51KB → 186KB）、`lib/splash.css`（59.9→75.2KB）、`lib/skin.css`（86.2→94.7KB）、`lib/client.js`（60.7→63.9KB）、`lib/index.js`（13s→14s 兜底）、`package.json`（0.4.0）、`README.md`、`CHANGELOG.md`、`INSTALL.md`、`_重启接续.md`
- 新：`docs/design-spec-v4.md`、`docs/DELIVERY-REPORT-v0.4.md`、`_work/v04/**`（含素材逐帧分析）、`_work/splash/v04/**`、`_work/skin/v04/**`、`_work/verify4/**`、`docs/verify/v4/**`
- 未新增资产文件；`lib/assets/**` 未变。

## 8. 未验证项（诚实清单）

> 完整清单与口径见 `docs/verify/v4/REPORT.md`「未验证项」；以下为 Lead 汇总。

1. 用户真实 Electron 窗口内的**主观听感**（关节音是否够「机械」、BGM 平衡）与交接观感——已给客观指标与可听 WAV，但需用户本人确认。
2. 真宿主 57123 的最终全量矩阵结果（本报告定稿时若未跑完则标注；harness 与真宿主 UI 证据已分别覆盖）。
3. 7.42 锁定重音与 6.87 关节事件在 100ms 窗内峰值并列于 limiter 天花板（未严格区分高低；两者都属「重音」可接受）。
4. 超宽屏 21:9 / 4:3 的构图余量（已在 1536×960、1600×1020、1920×1020 验证；更极端靠 clamp 与 cover 兜底）。
5. Windows WCO 原生标题栏与本皮肤的像素级叠合（非 DOM，只能人工看）。
6. 低端 GPU 4K 屏性能（叠加层已按合成层优化，未做 4K 实测）。
7. 真宿主内 7.16s 眼点亮与 7.42 锁定的音频对齐主观感受（视频 currentTime 与 WebAudio 时钟的 ±1 帧）。
