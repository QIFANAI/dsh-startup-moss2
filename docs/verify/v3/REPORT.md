# MOSS2 v0.3 验收报告（VERIFY-V3）

> 角色：verifier（task-3 / VERIFY-V3）｜ 生成：2026-11-07（Asia/Shanghai）
> 权威规格：`docs/design-spec-v3.md`（v0.3 增量唯一权威源）+ `docs/design-spec-v2.md`（v0.2 基线契约）
> 证据根目录：`docs/verify/v3/`（文件级索引见 `docs/verify/v3/INDEX.json`，含每条证据的 sha256）
> 判定口径：自动断言通过 ≠ 视觉正确；**关键 phase 另做人工目检**（清单见 §4，逐条标注已确认路径）。

---

## 0. 结论摘要（先给结果）

| 用户 6 项反馈 | 结论 | 关键证据（自动断言 + 截图） |
|---|---|---|
| ① 红圈中红色「信号灯」呼吸闪烁 | **PASS** | `accept-v3: brand-eye-breathing-animation / brand-eye-visible-modulation`；`skin/eye-breath-t0.png` vs `t1600.png`（人工目检） |
| ② 输入卡 3 个边角呼吸闪烁（四角） | **PASS** | `accept-v3: composer-corner-breathing-animation / composer-corners-visible-modulation`；`skin/corner-breath-t0/t1600.png` |
| ③ 进度条与数字百分比同频、必须到 100% | **PASS** | `accept-v3: progress-pct-fill-spark-synced (worst=0) / progress-100-at-11s`；`splash/10-t11_2.png`（人工目检：100% + BOOT COMPLETE） |
| ④ immersive 下所有下拉错位、无法选择（阻断级） | **PASS** | `accept-v3: menu-immersive-权限/模式-fixed-and-no-layout-growth`（pos=fixed、docH 不增长）；`ui/12-menu-immersive-权限.png`（人工目检）；`live-final: live-menu-fixed-*` |
| ⑤ 第二幕红色准心锁定 MOSS 完整特效 | **PASS** | `accept-v3: act2-lock-phases-ordered / lock-reticle-near-eye（Δ=0px）`；`splash/03-t5_6.png`、`05-t7_42.png`（人工目检） |
| ⑥ 程序化 BGM/音效（重点第二幕机械感） | **PASS**（客观指标） | `_work/demo/audio-render-report.json`：ok=true、11.8s、44.1k/16bit/立体声、LUFS −20.0、True Peak −1.3 dBFS；`splash/moss2-boot-audio.wav`（可听）；主观听感未做双盲评估（§7） |

**全量计数（最终冻结版本，2026-11-07 01:26–01:31 复跑）**

| 套件 | 结果 |
|---|---|
| `npm test`（5 个文件） | **120/120 PASS**（host 35、assets 24、splash 28、client 21、css-regress 12），exit=0 |
| `_work/verify2/run.mjs` 8 场景矩阵 | **190/190 PASS**（normal 30、system-reduce 34、skip 20、missing-video 23、saver 22、immersive 20、glass 21、preview 20），0 FAIL |
| `_work/ui/accept-v3.mjs --scenario all` | **22/22 PASS**（splash 10 + ui 12，异常断言共享 1 条），exceptions=0 |
| `_work/ui/accept-v3.mjs --scenario splash` | **10/10 PASS**，exceptions=0 |
| `_work/ui/accept-v3.mjs --scenario ui` | **13/13 PASS**，exceptions=0 |
| `_work/ui/accept-v3.mjs --scenario ui --reduce`（系统 reduce） | **13/13 PASS**，exceptions=0 |
| `_work/ui/live-final.mjs`（用户真实宿主 64819，只读） | **7/7 PASS × 3 次连续复跑**（verifier）；skin-weaver 另报 9 次连续 7/7；见 §6.1 |
| `_work/skin/v03/assert-css-v03.mjs`（皮肤自查，参考） | 11/11 PASS |

> 报告与 `docs/DELIVERY-REPORT-v0.3.md` §5 的数字已交叉核对：npm test 120/120、verify2 190/190、splash 10/10、ui 13/13、accept-v3 all 22/22、live-final 7/7、音频指标（True Peak −1.3 dBFS / LUFS −20.0 / 11.8s）完全一致。

**发现问题**：真 bug 2 条（均已修复并复验：client.js 升级补播竞态、音频限幅峰值超标）；断言过期 2 条（smoke-host 版本号 0.2.0→0.3.0，已改）；测试工具误报/缓存 2 类（preview 探针读取早于渲染、client bundle immutable 缓存导致 live-final 假失败，均已修/已记录）。详见 §6。

---

## 1. 验收环境与冻结基线

### 1.1 环境

| 项 | 值 |
|---|---|
| OS / shell | Windows 11 / PowerShell 7（pwsh） |
| Node | `C:\Users\26547\.local\node-v24.21.0-win-x64\node.exe`（v24.21.0） |
| 浏览器 | headless Chrome 157.0.8103.26（`--headless=new`，1920×1020 / 1536×960 两种视口） |
| 隔离真宿主 | `http://127.0.0.1:57123`（`_work/verify-home`，profile=VERIFY）；测试时配置 = immersive / high / full / mode=always / reducedMotion=false（每次矩阵/验收后已恢复） |
| 用户真实宿主 | `http://127.0.0.1:64819`（**只读加载/点击，未重启、未改用户配置**）— 仅用于 `live-final.mjs` 升级补播终验 |
| 系统偏好 | 本机 Windows 已关闭系统动画 → Chromium 恒报 `prefers-reduced-motion: reduce`（真实回归场景，不删） |

### 1.2 冻结基线（本轮验收对象）

| 文件 | 字节 | SHA256（全文） | mtime |
|---|---|---|---|
| `lib/splash.js` | 135096 | `24E0FD4582121CA51592D7803FC6EC1342B96217026CB461950C644E07E3CF2A` | 2026-11-07 01:06:33 |
| `lib/splash.css` | 59908 | `D49BF551B1E2276B5C23A3FB073BB6B1A8D5F7D0617B9314671EA4614E5D7655` | 2026-11-07 00:38:13 |
| `lib/client.js` | 60682 | `306DA521DB23C119D6A8E53087C2E7C0782E0D6A74527DDFDB7A0BF80BA6B061` | 2026-11-07 01:14:57（竞态修复后冻结） |
| `lib/skin.css` | 86179 | `51A4CE3BC2C66461B9B7D38573630800DDB6CE64ECDC9F76E769DD0FAFD3997F` | 2026-11-07 00:50:38 |
| `lib/index.js` | 23277 | `CC621117FC4C40A20B23EC32B0261CCADBA18FFA6E7EF002E2F873BFC518561C` | 2026-11-06 18:54:24（本轮未改） |
| `preview/index.html` | 71214 | `1F3FE16924E7F6A0B419A22DA284C6DBC2A50F0455AA3D21EDECDF6B7D7567B1` | 2026-11-07 00:57:51（v0.3 探针版） |
| `package.json` | 1825 | `A5DCC4A7C588E4FD44976DE5D72F62E861486547BB06B66A497E2E7DB1DCB6FC` | 版本 0.3.0（Lead 改） |

> 以上 6 个 lib/资产指纹与 `_work/verify2/assertions.json` 的 `libHashes`、`docs/DELIVERY-REPORT-v0.3.md` §3 完全一致；本轮最终验收全部基于这组冻结代码。

> 注：隔离宿主 57123 的进程启动早于 `package.json` 升 0.3.0，其内存态注入版本仍为 0.2.0（资产 URL `?v=0.2.0` 属环境态）。client/splash 逻辑不依赖该值（`SPLASH_REV` 为硬编码 `v0.3-r1`）；`smoke-host` 用新 Node 进程验证了 **新注入 payload = 0.3.0**。未重启宿主以免打断并行验收。

### 1.3 证据分级

1. **自动断言**（可复跑）：`test/**`、`_work/verify2/run.mjs`、`_work/ui/accept-v3.mjs`、`_work/ui/live-final.mjs`、`_work/skin/v03/assert-css-v03.mjs`。
2. **人工目检**：accept-v3 截图中关键 phase（§4 清单，逐条注明路径与看到的内容）。
3. **独立复算**：音频用 ffprobe/ffmpeg ebur128（`E:\douy\_tools\ffmpeg\`）对 WAV 重新测量，不复用 splash-smith 的结论。

### 1.4 验收执行时间线（最终冻结版本）

| 时间（Asia/Shanghai） | 动作 | 结果 |
|---|---|---|
| 01:06:33 | splash-smith 冻结 `lib/splash.js`/`splash.css`；Lead 通报全冻结 | 哈希核对一致 |
| 01:14:57 | skin-weaver 修复 `lib/client.js` 竞态后冻结；Lead 确认 6 个哈希 | 与 `DELIVERY-REPORT` §3 一致 |
| 01:26:41 | `npm test` + verify2 8 场景（`_work/verify2/assertions.json` 记录 libHashes） | 120/120、190/190 |
| 01:26:48 | `accept-v3 --scenario all` | 22/22 |
| 01:27:25 | `accept-v3 --scenario ui --reduce` | 13/13 |
| 01:29–01:35 | `live-final` 真实 64819 只读 × 3 次连续复跑 | 7/7 ×3 |
| 01:30–01:32 | `accept-v3 --scenario splash`（1:30）/ `--scenario ui`（1:31）单场景补跑 | 10/10、13/13 |
| 01:32–01:38 | 归档 `docs/verify/v3/` + 本报告 | 112 文件 / 119MB / INDEX.json |

---

## 2. 用户 6 项反馈逐条验收

### 2.1 第 1 项：品牌红眼「信号灯」呼吸闪烁

- **实现落点**：`lib/client.js` `MossEyeMark()` → `.dsh-moss-eye__halo/__ring/__core/__glint`；`lib/skin.css` §5.12 `moss-eye-ring-breath 3.2s` + `moss-eye-ring-signal 7.5s`（两个 30% 谷）、`moss-eye-core-breath 2.6s` + `moss-eye-core-signal 7.5s`。
- **自动断言**：
  - `test/smoke-css-regress.mjs` B1/B2/B3（class、时长、keyframes 2px→8px 红光、双击两谷、`--calm/--static` 停、系统 reduce 不停）。
  - `accept-v3`（真宿主 57123，immersive）：`brand-eye-breathing-animation` → `animationName = "moss-eye-ring-breath, moss-eye-ring-signal"`、`duration = "3.2s, 7.5s"`；`brand-eye-core-animation` → `"moss-eye-core-breath, moss-eye-core-signal"` / `"2.6s, 7.5s"`；两帧亮度差 `brand-eye-visible-modulation.meanAbsDiff = 1.77~2.42`（阈值 0.4）。
  - 系统 reduce（`--reduce` 场景）：同一元素动画仍 running、两帧差 1.32（**未被系统 reduce 停掉**，v0.3 设计决定）。
- **截图（人工目检）**：`skin/eye-breath-t0.png` 与 `skin/eye-breath-t1600.png`（270×270 裁剪，3.2s 相位差 1.6s）：红环亮度/光晕有可见差异（数据：变化像素 7.0%、maxAbs 17.36；幅度克制，符合「不能变成霓虹灯」）。
- **`--calm` 对照**：`skin/calm-full.png`（skin-weaver 证据：ring/core/glint animationName=none，两帧 redExcess Δ=0）；系统 reduce 对照 `skin/system-reduce-full.png`（动画照常）。

### 2.2 第 2 项：输入卡四角括号呼吸闪烁

- **实现落点**：`lib/skin.css` §5.7 `[data-composer-card]::before` 单 timeline `moss-corner-breath 10.8s`（= 3×3.6s 呼吸 = 2×5.4s 双击），opacity .42↔1 + drop-shadow 0→5px，每 5.4s 两组 30ms 暗脉冲；`--moss-corner-a` 变量承载 focus 提亮（.50→.86，不写死 opacity/filter）。
- **自动断言**：`smoke-css-regress` C1/C2；`accept-v3`：`composer-corner-breathing-animation` → `moss-corner-breath / 10.8s`；两帧差 `composer-corners-visible-modulation.meanAbsDiff = 3.84~4.5`（阈值 0.2）。系统 reduce 下仍为 `moss-corner-breath`（未被停）。
- **截图（人工目检）**：`skin/corner-breath-t0.png` / `skin/corner-breath-t1600.png`（输入卡左上角红色 L 折线 + 蓝色 focus 扫描线可见）。

### 2.3 第 3 项：进度条/百分比统一并真正到 100%

- **实现落点**：`bootProgress(t)` 单一真值 + `quantizeProgress` → `pct=Math.round(p*100)`、`fill=scaleX(p)`、`spark=translate3d(p*trackWidth)`；`trackWidth` 实时测 `.ms-progress.clientWidth`（本环境 1801 / 1441 两种视口），不再用 boot 时 `frameW`；`.ms-bottom`/`.ms-pct` 移入 `.ms-global-hud`，4.36–11.0 持续可见，11.0 = 100% + `data-complete="1"` + `BOOT COMPLETE / 加载完成`。
- **自动断言**（accept-v3，10 帧 freeze）：
  - `progress-pct-fill-spark-synced`：**worst=0**（pct/100 与 progress、fill 三者误差 0；spark = progress×trackWidth 严格一致）；
  - `progress-monotonic`：t=3.2→11.2 十帧 progress = 0.25/0.37/0.47/0.59/0.65/0.69/0.75/0.82/0.89/**1**，单调不减；
  - `progress-100-at-11s`：t=11.2 → pct=100、progress=1、fill=1、spark=1801（=trackWidth，光点贴右端）；
  - 进度层在 `.ms-global-hud` 内：`verify2 preview-v3-global-progress-layer`（preview 页探针，20/20 场景内）。
- **截图（人工目检）**：`splash/10-t11_2.png` → 地球全屏 + 右下 **“BOOT COMPLETE / 加载完成” + 100%**，左下进度条填充到底、光点在末端；`splash/03-t5_6.png` → 47%；`splash/05-t7_42.png` → 65%。
- **跳过路径**：`smoke-splash` v0.3 断言（`SKIP_AT=10.0` + `render(SKIP_AT)`）；`verify2 skip 场景 20/20`（含 Esc 后 ≤1.2s 进入地球幕、进度不闪回 0）。

### 2.4 第 4 项（阻断级）：immersive 下拉菜单错位根因修复

- **根因**（v0.2）：`lib/skin.css` §5.10 给 `[role="menu"]/[role="listbox"]` 加 `position:relative`，覆盖宿主 portal 的 `position:fixed` → 菜单掉进文档流、出现在视口下方 433px、`scrollHeight` 1020→1597/1792、页面内容上移、无法点选。
- **修复**：删除定位覆盖；§5.10 四角括号改为纯绘制 `background-image`（同时画在 role=menu 与宿主 `_material` 子层，否则被宿主底色盖住）。
- **自动断言**：
  - 静态守门 `test/smoke-css-regress.mjs` A1/A2/A3/A4/A5：菜单/listbox 规则**不得**含 position/inset/top/left/right/bottom/z-index/display/float；角括号必须同时覆盖 `_material` 子层；不得 `position !important`；dialog 规则不得含布局属性（12/12 PASS，且已用 4 组缺陷注入反向验证，§3.4）。
  - 真宿主 57123 immersive（accept-v3）：`menu-immersive-权限` → `pos=fixed, rect={x:669,y:467,w:144,h:110}`、`docH 1020→1020`、`scrollY 0→0`；`menu-immersive-模式` → `pos=fixed, rect={x:746,y:500,w:324,h:272}`、`docH` 不变；`menu-+-visible-and-no-layout-growth`（+ 面板在视口内、docH 不变）；`menu-permission-has-full-access-item`/`permission-selected`（可点选「完全权限」，并触发了安全确认→启用）。
  - 系统 reduce 下同样 13/13 PASS（定位不受系统偏好影响）。
  - 真实宿主 64819（`live-final`，只读）：`live-menu-fixed-工作区内修改`（fixed @ 669,433 / docH 1020）、`live-menu-fixed-标准模式`（fixed @ 796,500）。
- **截图（人工目检）**：`ui/12-menu-immersive-权限.png` → immersive 下白/玻璃菜单在输入卡上方正确弹出，包含「仅可查看 / 工作区内修改 / **完全权限**（已勾选）」，页面无上移错位；`ui/02-menu-immersive-权限.png`（reduce 轮）；`skin/picked-permission.png`、`skin/picked-mode.png`（57123 真实点选生效）；`skin/menu-mode-live.png`（64819 真实环境菜单）。

### 2.5 第 5 项：第二幕「红色准心锁定 MOSS」完整特效序列（最出彩的一幕）

- **实现落点**：`lib/splash.js` §5 —— `.ms-tgt-layer`（`.ms-tgt-grid`/`.ms-tgt-scan`/`.ms-tgt-corner`×4/`.ms-tgt-ghost`×3/`.ms-tgt-reticle` 含 ring-o/ring-i/ticks/cross/dot/dist/locklabel/`.ms-tgt-data`/`.ms-tgt-chroma`）+ `.ms-lock-shock`×2 + `.ms-moss-vignette`；主眼坐标复用 `EYE={x:0.3740,y:0.5380}` + `computeEyePoint()`；`MOSS_MOTION` 150 帧能量包络以常量内联（无新资产请求）。
- **时间线**（代码 TL 常量）：search 3.90–4.30 → capture 4.30–5.20 → track 5.20–6.40 → converge 6.40–7.06 → lock 7.06–7.42 → maintain 7.42–8.10。
- **自动断言**：
  - `accept-v3: lock-reticle-near-eye` → t=7.42/7.9 的 `__DSH_MOSS2_LOCK__`：`reticle=(718.08,551.04)` 与 `eye=(718.08,551.04)` **偏差 0px**（阈值 ≤8px；探针为 stage 坐标，两者同源），`locked=true`；
  - `act2-lock-phases-ordered` → 十帧相位序列 `search → capture → track → converge → maintain...` 有序；
  - `moss-video-untouched` → 视频 computed `filter=contrast(1.08) brightness(0.9) saturate(0.96)`、`transform=none`、`playbackRate=1`（与 v0.2 一致；新特效全部是叠加层）；
  - 静态：`test/smoke-splash.mjs` v0.3 §5 断言（DOM 完整性、EYE 坐标、MOSS_MOTION 内联、`video[data-act=moss]` 不被写 filter/transform）。
- **截图（人工目检）**：
  - `splash/03-t5_6.png`（t=5.6 跟踪阶段）：MOSS 机体全屏 + 顶部 `TRACKING // 跟踪中`、X/Y/DIST 105.4m/LOCK 23%、右下准心带 8 段刻度环、四角括号与细网格、左下遥测、进度 47%；
  - `splash/05-t7_42.png`（t=7.42 锁定）：准心收口在 **MOSS 主眼**、`LOCKED · 550W`、DIST 000.0m / LOCK 100%、冲击波环、「MOSS 已上线 + 让人类永远保持理智…」引文、进度 65%；
  - `splash/06-t7_9.png`（维持阶段，档案同目录）；另 verify2 `normal/t7.4` 冻结帧同证。
- **降级**：系统 reduce 下保留完整叙事（verify2 system-reduce 34/34）；`--calm`（`ms-calm`）只保留核心锁定（静态断言见 smoke-splash/splash.css `.ms-calm .ms-tgt-*`）。

### 2.6 第 6 项：程序化 BGM + 事件化音效（重点第二幕机械感）

- **实现落点**：`lib/splash.js` `buildAudioGraph(ctx, opts)`（纯构建、支持 AudioContext 与 OfflineAudioContext）：sub drone + D 小调 pad + 事件化 SFX（硬切金属撞击/伺服 whir/液压/卡扣/收敛/riser/7.42 锁定重音/维持 drone），MOSS 运动能量包络驱动；`DynamicsCompressor` + 末级安全限幅；`skip/finish/dispose` 300ms 淡出 + `close()`；任何失败静默降级（`__DSH_MOSS2_AUDIO_STATE__`）。
- **自动断言**：`smoke-splash` v0.3 §6（buildAudioGraph、createDynamicsCompressor/createOscillator/createBufferSource、AUDIO_FADE、`window.AudioContext || webkitAudioContext` 兜底、catch→probe 静默降级、`__DSH_MOSS2_BUILD_AUDIO__`）；`smoke-splash` 既有「audio degrades silently」（AudioContext 最多创建 2 次、无 alert、有 try/catch）。
- **可听性证据（独立复算，未复用作者结论）**：
  - `splash/moss2-boot-audio.wav`：**11.800s / 44100Hz / 2ch / 16bit PCM**（ffprobe 独立复算）；
  - **Integrated −20.0 LUFS / LRA 3.8 LU / True Peak −1.3 dBFS**（ffmpeg ebur128 独立复算，`E:\douy\_tools\ffmpeg`）；作者报告 `audio-render-report.json`：ok=true，事件 107、节点 243；
  - 各幕窗口 RMS/峰值见 `reports/audio-analysis.json`（硬切 3.85–4.1s peak −4.49dB、锁定重音 7.35–7.6s peak −1.53dB、11.1s 后淡出 −38dB，符合「第二幕重点 + 交接淡出」）；
  - 频谱图 `splash/audio-spectrum.png`。
- **演示视频**：`_work/demo/moss2-boot-demo-v3.mp4`（Lead 用启动动画帧 + 本 WAV 合成）：ffprobe 独立复核 = **1600×1000 / 30fps / 视频 12.30s、AAC 44.1kHz 立体声 11.823s、总时长 12.312s、4.86MB**。
- **未验证**：主观听感未做双盲评估（客观指标已达交付线，§7）。

---

## 3. 全量回归结果

### 3.1 `npm test`（package.json test 链 = 5 个文件）

| 文件 | 断言数 | 结果 |
|---|---|---|
| `test/smoke-host.mjs` | 35 | 35/35 PASS |
| `test/smoke-assets.mjs` | 24 | 24/24 PASS |
| `test/smoke-splash.mjs` | 28（v0.2 起 19 + v0.3 新增 9） | 28/28 PASS |
| `test/smoke-client.mjs` | 21 | 21/21 PASS |
| `test/smoke-css-regress.mjs`（**本轮新增**） | 12（v0.3 皮肤/客户端回归守门） | 12/12 PASS |
| **合计** | **120** | **120/120 PASS，exit=0** |

### 3.2 `_work/verify2/run.mjs` 8 场景矩阵（隔离真宿主 57123）

| 场景 | 断言 | 结论 | 关键点 |
|---|---|---|---|
| normal | 30/30 | PASS | 11.8s 全时间线、四幕可见、MOSS 视频属性、交接 |
| system-reduce | 34/34 | PASS | 系统 reduce 下视频/启动动画不阉割、仍 11.8s、动画保留 |
| skip | 20/20 | PASS | Esc 跳过 ≤1.2s 进地球幕、进度不反向 |
| missing-video | 23/23 | PASS | 视频 404 时海报兜底、11.8s 内完成、无异常 |
| saver | 22/22 | PASS | 零视频请求、海报版完整走完 |
| immersive | 20/20 | PASS | immersive 皮肤 + 背景在动 + UI 截图 |
| glass | 21/21 | PASS | glass 皮肤 + 默认 veil/blur + 背景在动 |
| preview | 20/20 | PASS | 重播/分幕跳转/三档/滑杆/动态背景演示 + v0.3 探针 4 条（进度层/进度同步/特效 DOM/锁定帧） |
| **合计** | **190/190** | **0 FAIL** | 汇总：`_work/verify2/assertions.json`；报告在 `_work/verify2/report-<场景>.json` |

### 3.3 `_work/ui/accept-v3.mjs`（Lead 独立验收器，最终冻结版本复跑）

| 运行 | 断言 | 结果 |
|---|---|---|
| `--scenario splash` | 10 | **10/10 PASS**，`exceptions=[]` |
| `--scenario ui` | 13 | **13/13 PASS**，`exceptions=[]` |
| `--scenario all`（splash + ui 合并） | 22 | **22/22 PASS**，`exceptions=[]` |
| `--scenario ui --reduce`（系统 reduce） | 13 | **13/13 PASS**，`exceptions=[]` |
| `_work/ui/live-final.mjs`（真实宿主 64819，只读） | 7 | **7/7 PASS × 3 次连续复跑**（verifier，01:29–01:35）；skin-weaver 另报 9 次连续 7/7 |

- 关键数值：`progress-pct-fill-spark-synced` **worst=0**；`progress-100-at-11s` → pct=100/progress=1/fill=1/spark=1801（trackWidth=1801）；`lock-reticle-near-eye` → reticle 与 eye 均 `(718.08, 551.04)`，**偏差 0px**；菜单 `pos=fixed`、`docH 1020` 不变；`moss-video-untouched` → filter/transform/playbackRate 与 v0.2 一致。
- 报告 JSON：`reports/accept-v3-report-{splash,ui,all}.json`、`reports/accept-v3-report-ui-reduce.json`、`reports/live-final-report.json`。

#### 3.3.1 验收过程中发现的两个测试侧陷阱（非产品缺陷，已修/已记录）

1. **preview 探针读取时序**：`preview/index.html` 的 v0.3 读数每 900ms 轮询一次；verify2 preview 场景点击「锁定帧 7.42s」后立即读取会读到上一帧（10.4s）的旧值（`reticle=(0,0)`、phase=maintain）。修复：preview 暴露 `window.__MOSS2_READ_V3__` 强制刷新，run.mjs 点击后先刷新再读 → preview 20/20。
2. **client bundle 的 immutable 长缓存**：宿主把 client 半侧打成 `/plugins/??...,dsh-startup-moss2/client.js,...&rev=…` 合并 bundle，响应头 `cache-control: public, max-age=31536000, immutable`。复用同一 headless profile 时，**client.js 的改动不会生效**（verifier 首次在修复后重跑 live-final 仍 6/7 即此原因；清空测试 profile `_work/verify3/chrome-profile-live-final` 后 7/7）。Lead 已在 `accept-v3.mjs`/`live-final.mjs` 加 `Network.setCacheDisabled`；本报告所有最终数字均为加缓存禁用后复跑。

### 3.4 断言更新与反向验证（本轮 test/** 改动）

- **A) 版本断言过期修复**：`test/smoke-host.mjs` 两处 `0.2.0 → 0.3.0`（injected payload / config API version）。
- **B) 新增 `test/smoke-css-regress.mjs`（12 条）**：从 `_work/skin/v03/assert-css-v03.mjs` 移植并加固，并已加入 package.json `scripts.test` 链（Lead 执行）。**反向验证（防恒真绿灯）**：
  - 在缺陷副本中重新注入 v0.2 的 `position:relative` 菜单规则 → A1/A2 报 FAIL；
  - `moss-eye-ring-breath 3.2s → 4.2s` → B2 报 FAIL；
  - 删除 `_material` 子层角括号 → A2 报 FAIL；
  - `SPLASH_REV` 改坏 → D1 报 FAIL；
  - 以上均 exit=1（缺陷副本用法：`$env:DSH_MOSS2_REGRESS_ROOT=<缺陷根>; node test/smoke-css-regress.mjs`）。
- **C) `test/smoke-splash.mjs` 扩到 28 条（v0.3 增量 9 条）**：进度单一真值/全局层完成态/跳过路径、第二幕特效 DOM/主眼坐标/MOSS_MOTION、MOSS 视频红线、程序化音频、只读探针、splash.css 特效与完成态样式。
- **D) `preview/index.html` 更新（生成器 `_work/verify2/build-preview.mjs` 同步升级，避免手改被覆盖）**：
  - 标题/徽标 v0.3；新增「锁定帧 7.42s」跳转按钮；
  - `#moss2-progress-readout`（读 `__DSH_MOSS2_PROGRESS__`，校验进度层在 `.ms-global-hud`）+ `#moss2-lock-readout`（读 `__DSH_MOSS2_LOCK__` + 第二幕特效 DOM：四角×4/假目标×3/冲击波×2/vignette/准心↔主眼 Δpx）；
  - 暴露 `window.__MOSS2_PREVIEW_V3__` 与 `window.__MOSS2_READ_V3__`（强制刷新，供外部探针）；
  - 重播/分幕跳转/滑杆/三档全部保持：verify2 preview 场景 20/20。
  - **`_work/verify2` 最小改动记录**：`run.mjs` 新增 preview v0.3 断言 4 条 + 锁定帧读取时序修正；`lib/probe.mjs` 的 `PREVIEW_PROBE` 新增 v3/v3Buttons 字段；`build-preview.mjs` 升 v0.3 探针。均为 `_work/verify2/**`（本轮授权最小改动），未触碰 `lib/**`。

### 3.5 皮肤半侧自查（参考）

`_work/skin/v03/assert-css-v03.mjs` **11/11 PASS**；skin-weaver 的 64819 真实环境菜单矩阵 9 类浮层全 fixed/docH 不变（`_work/skin/v03/out/final-64819/report.json`）、57123 真实点选「完全权限/创造模式」（`out/full-57123/report.json`）。

---

## 4. 人工目检截图清单（自动断言之外的第二道核验）

| # | 截图 | 看到什么 | 对应验收项 |
|---|---|---|---|
| 1 | `docs/verify/v3/splash/03-t5_6.png` | t=5.6 第二幕跟踪：MOSS 全屏、TRACKING // 跟踪中、准心+刻度环、四角括号、细网格、DIST 105.4m、LOCK 23%、进度 47% | ⑤（+③） |
| 2 | `docs/verify/v3/splash/05-t7_42.png` | t=7.42 锁定：准心收口在 MOSS 主眼、LOCKED · 550W、LOCK 100%、冲击波、MOSS 已上线+引文、进度 65% | ⑤ |
| 3 | `docs/verify/v3/splash/06-t7_9.png` / `splash/verify2-normal/normal-t7.4.png` | 锁定维持阶段 | ⑤ |
| 4 | `docs/verify/v3/splash/10-t11_2.png` | t=11.2：地球全屏、**BOOT COMPLETE / 加载完成 + 100%**、进度条到底且光点在末端 | ③ |
| 5 | `docs/verify/v3/ui/12-menu-immersive-权限.png` | immersive 下拉菜单 fixed 定位、位于输入卡上方、含「完全权限」勾选、页面未上移 | ④ |
| 6 | `docs/verify/v3/ui/02-menu-immersive-权限.png`（系统 reduce 轮，1:32 最终） | 同上；reduce 下菜单仍 fixed 正确、页面未上移；断言在 `reports/accept-v3-report-ui-reduce.json`（13/13） | ④ |
| 7 | `docs/verify/v3/ui/16-after-select-quanquan.png` | 真实点选「完全权限」后的 UI | ④ |
| 8 | `docs/verify/v3/skin/eye-breath-t0.png` vs `eye-breath-t1600.png` | 品牌红眼红环/光晕两帧可见差异（270×270 裁剪） | ① |
| 9 | `docs/verify/v3/skin/corner-breath-t0.png` vs `corner-breath-t1600.png` | 输入卡左上角红折线两帧差异 + focus 蓝扫描线 | ② |
| 10 | `docs/verify/v3/ui/live-64819/upgrade-replay-t7.2s.png` | 真实宿主 64819 刷新后补播 v0.3 启动动画（第二幕帧） | §6.1 修复复验 |

> 也已目检：`ui/preview/preview-03b-lock-frame.png`（preview 页 t=7.42 冻结帧，准心贴主眼 + `LOCKED · 550W` + 进度读数），确认 preview 探针与真宿主行为一致。

---

## 5. 与 v0.2 的差异（本轮引入）

1. **进度语义**：v0.2 进度条属于幕 II（8.1s 随 HUD 消失、停在 ~74%）；v0.3 单一真值 `bootProgress` + 全局固定层，持续可见到 11.0s=100% + 完成态，11.0–11.8 淡出。`api.progress` / `__DSH_MOSS2_SPLASH__.progress` **语义未改**（仍 lastT/DURATION，供旧断言）；新进度只走 `__DSH_MOSS2_PROGRESS__`。
2. **第二幕**：v0.2 只有 gaze 准心（7.10 起）；v0.3 增加完整捕获→跟踪→收敛→锁定→维持特效序列（全部叠加层，视频元素属性与 v0.2 完全一致）。
3. **音频**：v0.2 只有简单 BGM/少事件；v0.3 分层 BGM（D 小调→F/A 解决）+ 事件化机械音效 + 压缩器/限幅 + 离线渲染可听证据。
4. **皮肤**：新增品牌红眼呼吸/双击、输入卡四角呼吸/双击；修复 immersive 菜单 portal 定位（阻断级）；新增 `SPLASH_REV` 升级即重播 + client 侧宿主路径补播（修复竞态后）。
5. **DOM**：`.ms-bottom/.ms-pct` 从 `.ms-act--moss` 移入 `.ms-global-hud`（class 名保持 v0.2 契约）；新增 `.ms-tgt-*/.ms-lock-shock/.ms-moss-vignette`；新增只读探针 global（`__DSH_MOSS2_PROGRESS__/__DSH_MOSS2_LOCK__/__DSH_MOSS2_AUDIO_STATE__/__DSH_MOSS2_BUILD_AUDIO__`）。
6. **版本/缓存**：0.2.0→0.3.0；client `FALLBACK_VERSION=0.3.0`、`SPLASH_REV='v0.3-r1'`。

---

## 6. 发现的问题（真 bug / 断言过期 / 已修验证）

### 6.1 真 bug #1：client.js `maybeReplayOnUpgrade` 时序竞态（Lead 在真实宿主发现，skin-weaver 修复）

- **现象**：真实 desktop 宿主（64819）上，splash 初始 `state='boot'` 被 client 误判为「已在播」→ 只写 rev 不补播 → 用户刷新一次即永久错过 v0.3 启动动画（`live-final` 中 `FAIL upgrade-replay-triggered`）。
- **修复前复现**（verifier 独立复跑，`_work/ui/live-final.mjs`）：**6/7 PASS**，FAIL = `upgrade-replay-triggered {splashRoot:false, state:"disabled", upgradeReplay:false}`，同时 `upgrade-rev-written` 已 PASS（即 rev 写了但没播，正是竞态）。
- **修复方式**（`lib/client.js`，冻结版）：轮询启动层决策落定（60ms/≤10s）——`playing/handoff/preview/done` 才算「宿主本次已播」只补写 rev；`host-skip/disabled/SKIP` 才补播（调 splash 公开 `replay()`，60ms 轮询确认 `playing+root` 后**才写 rev**，失败 2 次重试后不写、下次刷新再试）；`boot/unset` 一律继续等，**绝不把 boot 当在播**。
- **修复后复验**：verifier **7/7 PASS × 3 次连续复跑**（01:29/01:32/01:34，`reports/live-final-report.json`；截图 `ui/live-64819/upgrade-replay-t7.2s.png`）；skin-weaver 另报 9 次连续 7/7。
- **复验注意（缓存）**：client bundle 是 `immutable` 长缓存（见 §3.3.1），复跑 live-final 必须禁用缓存或换新 profile，否则会读到旧 bundle 造成「假失败」——verifier 首次修复后复跑遇到，已在最终数字中排除。
- 归属：发现 Lead / 修复 skin-weaver / 验收 verifier（client.js 改动后已重跑 npm test + verify2 + accept-v3 全部通过）。

### 6.2 真 bug #2：音频峰值超标（splash-smith 自查发现并修复）

- 首版离线渲染 `audio-render-report.json` 曾 `ok=false`：采样峰值 0 dBFS / True Peak −0.1 dBFS（超过 −1 dBFS 目标，存在削波风险）。
- 限幅修复后复测：**ok=true**，True Peak **−1.3 dBFS**、Integrated **−20.0 LUFS**、无削波（verifier 用 ffmpeg ebur128 独立复算一致）。
- 归属：splash-smith（`_work/demo/**`、`lib/splash.js` 混音链）；verifier 只做独立复算，未改 lib。

### 6.3 断言过期（已修，非产品 bug）

1. `test/smoke-host.mjs` 两处版本断言 0.2.0→0.3.0（Lead 升 version 后）；现 35/35。
2. `test/smoke-splash.mjs` v0.2 断言未覆盖 v0.3 进度/第二幕/音频（新增 9 条，19→28）。
3. 测试工具误报（非产品 bug）：preview 页 v0.3 读数 900ms 轮询，verify2 锁定帧探针首版读到上一帧旧值 → 已加 `window.__MOSS2_READ_V3__` 强制刷新，preview 20/20。

### 6.4 已知限制（非缺陷）

- `accept-v3` 的「工作区」「模型」两个下拉**触发点**在当前宿主欢迎页状态找不到（`found:false, skipped:true`，不计入 FAIL）；immersive 定位修复由「权限/模式」两个 portal 菜单 + `live-final` 的「工作区/标准模式」+ skin-weaver 64819 九类浮层矩阵覆盖。
- 「创作模式」在宿主真实文案为 **创造模式**（skin-weaver 按真实文案点选，`skin/picked-mode.png`）。

---

## 7. 未验证项 / 假设 / 风险（如实声明，不标 ✅）

1. **预览版说明 modal**：本轮未再次抓到该一次性弹窗现场（宿主已读状态无法重置）；同类型 dialog 已由「完全权限确认框」实测（immersive 440×270 视口内、可点选、docH 不变）与静态守门 A4 覆盖，但**该弹窗本身未见现场**。
2. **主观听感**：音频只做客观测量（LUFS/True Peak/时长/ffprobe/频谱图），未做主观听感或双盲评估；「机械感/与 MOSS 运动同步」的听感判断需用户实际试听。
3. **闪烁频率 ≤3Hz**（第二幕/红眼/四角）：设计上由正弦包络与低频 timeline 保证（静态+代码审阅），**未用频闪计或高频采样量化**；系统 reduce 下叙事完整由 verify2 system-reduce 覆盖，但未量化频闪。
4. **双击闪烁 30ms 谷**：以「暂停动画 + 精确定位 currentTime」测得（skin-weaver 证据 `skin/eye-blink-valley.png`），实时播放时的人眼主观强度未单独评估。
5. **高 DPI / 非 1920×1020 窗口**：动效幅度、菜单定位只在 1920×1020（DPR=1）与 1536×960（verify2）下验证；其他缩放/窗口尺寸未验证。
6. **隔离宿主 57123 进程内存版本**：启动于 package.json 升 0.3.0 之前，`config.version`/注入 payload 的 `?v=0.2.0` 为环境态；未重启宿主（避免打断并行验收），lib 行为不依赖该值（smoke-host 用新进程验证新注入 payload=0.3.0）。
7. **真实宿主 64819**：只做只读加载/点击（未重启、未改用户配置）；升级补播与菜单修复由 `live-final` 7/7 覆盖，但**用户真实环境的长期稳定性/多会话**未做长跑。
8. **窄窗口/移动端**：桌面 Web 宿主为唯一目标，未覆盖移动端。
9. 皮肤呼吸/LED 效果的「克制程度」属审美判断，已按规格幅度实现（红眼呼吸 3.2s、双击 120ms/7.5s），最终以用户主观感受为准。

---

## 8. 交付物清单

| 交付物 | 路径 | 说明 |
|---|---|---|
| v0.3 插件本体 | `lib/**`（Lead 打包，dist 见 `docs/DELIVERY-REPORT-v0.3.md` §4） | splash/client/skin/index + assets |
| 交付报告（Lead） | `docs/DELIVERY-REPORT-v0.3.md` | 本报告 §0/§3 的数字已与其 §5 交叉核对一致 |
| 验收证据根 | `docs/verify/v3/`（`INDEX.json`：**112 个文件 / ~119 MB / 每条证据 sha256**） | 本报告 + splash/ui/skin 截图 + 26 份结构化报告 JSON |
| 启动动画演示视频 | `_work/demo/moss2-boot-demo-v3.mp4` | 1600×1000 / 30fps / 12.31s / AAC 44.1k 立体声 / 4.86MB（ffprobe 独立复核） |
| 程序化启动音频（可听） | `_work/demo/moss2-boot-audio.wav`（归档副本：`docs/verify/v3/splash/moss2-boot-audio.wav`） | 11.800s / 44.1kHz / 16bit / 2ch；LUFS −20.0、True Peak −1.3 dBFS（独立复算） |
| 音频分析报告 | `_work/demo/audio-render-report.json`、`_work/demo/audio-analysis.json`、`_work/demo/moss2-boot-audio-spectrum.png` | ffprobe/响度/各幕 RMS 峰值/频谱 |
| 复跑脚本 | `test/*.mjs`、`_work/verify2/run.mjs`、`_work/ui/accept-v3.mjs`、`_work/ui/live-final.mjs`、`_work/skin/v03/assert-css-v03.mjs`、`_work/verify3/archive-v3.mjs` | 全部可复跑 |

### 8.1 交付验收结论（一句话）

v0.3 六项用户反馈全部落地并通过自动断言 + 人工目检；四组回归计数 = **npm test 120/120、verify2 190/190、accept-v3（splash 10/10 · ui 13/13 · all 22/22 · ui--reduce 13/13）、live-final 7/7 × 3 次连续复跑**；无未修复真 bug，无未解释 FAIL。

---

## 9. 证据索引（docs/verify/v3/）

```
docs/verify/v3/
├─ REPORT.md                      ← 本文件
├─ INDEX.json                     ← 全部归档文件 src/dest/bytes/sha256 索引
├─ splash/                        ← accept-v3 逐帧（t=3.2/4.6/5.6/6.8/7.42/7.9/8.6/9.4/10.2/11.2）
│  ├─ 01-t3_2.png … 10-t11_2.png
│  ├─ verify2-normal/             ← v0.2 契约关键帧（第二幕/进度/交接）
│  ├─ verify2-system-reduce/ …    ← 各降级场景关键帧
│  ├─ moss2-boot-audio.wav        ← 程序化 BGM/音效（可听证据）
│  └─ audio-spectrum.png
├─ ui/                            ← immersive 菜单/权限点选/预览页探针/真实宿主
│  ├─ 01–08-*.png                 ← 系统 reduce 轮（01:32，最终覆盖）
│  ├─ 11–18-*.png                 ← accept-v3 all / normal 轮（01:27）
│  ├─ 12-menu-immersive-权限.png / 13-menu-immersive-模式.png / 15-menu-permission.png …
│  ├─ perm-confirm-dialog.png     ← 「完全权限」安全确认框（57123）
│  ├─ preview/preview-03b-lock-frame.png …
│  └─ live-64819/                 ← 真实宿主升级补播/菜单/呼吸截图（只读）
├─ skin/                          ← 红眼/四角呼吸两帧、--calm、系统 reduce、点选生效、菜单角括号放大
└─ reports/                       ← 26 份结构化报告 JSON（accept-v3 / verify2 / live-final / audio / splash / skin）
```

**复跑命令**

```powershell
$node = "C:\Users\26547\.local\node-v24.21.0-win-x64\node.exe"
cd E:\dshdesign\dsh-startup-moss2
npm test
& $node _work/verify2/run.mjs --scenarios normal,system-reduce,skip,missing-video,saver,immersive,glass,preview
& $node _work/ui/accept-v3.mjs --scenario all
& $node _work/ui/accept-v3.mjs --scenario ui --reduce
& $node _work/ui/live-final.mjs          # 用户真实宿主 64819（只读）
& $node _work/verify3/archive-v3.mjs     # 重新归档证据
```
