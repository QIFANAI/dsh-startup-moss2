# 交付报告 — dsh-startup-moss2 v0.2.0（四素材叙事版 · 重做）

> 交付日期：2026-11-06　｜　宿主实测：DeepSeek Harness 桌面版 `0.2.2-rc.1`（Electron / win32 / profile `desktop`）
> 设计权威源：[`design-spec-v2.md`](design-spec-v2.md)（v1 归档在 `_work/backup-v0.1/design-spec-v1.md`）
> 宿主事实：[`host-map.md`](host-map.md)　｜　素材转码：[`assets-report.md`](assets-report.md)
> 本轮验收为**真宿主**（隔离 DSH Host + 真实 web app，profile `verify`）+ headless Chrome CDP，证据可复跑。

---

## 1. 一句话

把用户给的**四个素材**串成一条完整的启动叙事，而不是各用各的：
**脑机接口面板（2992034258）做 DeepSeek Harness 品牌开幕 → MOSS 机器人实拍（2926246706）全屏苏醒 →
「一半 MOSS／一半流浪地球」（2940368322 的构图逻辑）竖分割转场 → 流浪地球推进器视频（2949159595）全屏，
并无缝交接成 UI 的**真正在动**的动态背景。**

## 2. 用户诉求 → 兑现映射

| # | 用户原话 | v0.2 兑现 | 证据 |
|---|---|---|---|
| 1 | 「2926246706 是很写实的 MOSS 机器人动态效果，肯定要体现在启动动画里」 | 第 II 幕 **3.90–8.10s 全屏播放** MOSS 实拍（源 0.60→5.60s，镜头从机械细节拉开到红色主眼），占屏 ≥4.2s；红眼准星 6.90s 硬门控、7.42s 锁定，`MOSS 已上线` 印章 + 引文 | `_work/splash/v02/freeze3/F3-t7.6.png`、`_work/demo/act2.png` |
| 2 | 「背景必须是动态的；毛玻璃效果是对的」 | UI 背景 = 真正在播放的地球视频（30s 无缝循环 + 44s 极慢镜头漂移）；**修复了 v0.1 在真机上视频不播的根因**（见 §3）；地球在四幕启动动画终幕与 UI 背景**同帧交接** | `docs/verify/skin-v2/`、`_work/demo/act4.png`；真宿主两帧像素差 12.6–15.0% |
| 3 | 「2940368322 是刚刚好的转场素材，一半 MOSS 一半流浪地球，是启动动画到 UI 的衔接」 | 第 III 幕 8.10–10.00s：**左半 MOSS／右半地球的竖直分割**（高光接缝 + 数据刻线 + 左右标签），8.90s 起接缝左扫、地球展开全屏，中央「移交控制权 / 550W → 地球发动机」 | `freeze3/F3-t9.4.png`、`_work/demo/act3.png`；素材 3 的 scene.pkg 是 Wallpaper Engine scene（不可直接播放），按用户认可的逻辑用素材 1+2 高清视频实时合成，构图参照归档 `docs/assets-ref/transition-ref.jpg` |
| 4 | 「2992034258 是脑机接口面板，最难融入；启动动画必须有一个 DeepSeek Harness 元素的开幕，用它设计开幕再进入 MOSS」 | 第 I 幕 0.50–3.90s：BCI 面板视频（源 20.80→24.20s）暗化慢推，**DEEPSEEK HARNESS 大字标开幕** + `NEURAL INTERFACE · 神经接口` + 启动日志 + `LINK 08→100%`；结束于素材自带故障闪光（源 24.0s）→ 硬切 MOSS | `freeze3/F3-t2.4.png`、`_work/demo/act1.png` |

## 3. 根因诊断与修复（v0.1「效果没做到」的技术原因）

| 现象 | 根因 | v0.2 修复 |
|---|---|---|
| 用户真机上**地球背景不动**（只有静态海报） | 本机 Windows 关闭了系统动画（`SPI_GETCLIENTAREAANIMATION = False`）→ Chromium 报 `prefers-reduced-motion: reduce` → v0.1 把背景视频切成 `--static`（`video.paused=true`、`opacity:0`） | 运动策略只由插件配置决定：只有 `quality=saver` 或视频真不可用才降级海报；**视频播放永不受系统 reduced-motion 影响**；`reducedMotion=true` 只减弱装饰动效 |
| v0.1 启动动画**真机上 MOSS/地球视频不显示** | 同上，启动动画走 reduced 降级版 | 启动动画三支视频在系统 reduce 下照播；真宿主 reduce 模拟验证：`htmlClass` 无 `--static`、三视频 `paused=false` |
| 真宿主控制台**未捕获异常**（`sidebar.brand.mark` 已被其他插件注册） | 品牌位 slot 注册冲突 | 惰性注册 + try/catch + 逐级降级 priority，真宿主异常 0，品牌位 2 处正常渲染 |
| 启动层可能卡死 | v0.1 10.5s 硬兜底 < v0.2 11.8s 时长 | Host 兜底 13000ms；splash 自带 13s 硬兜底 + Host fallback 事件重挂防御 |

## 4. 交付件清单（含哈希基线）

### 4.1 运行时文件（冻结版）

| 文件 | 字节 | SHA256 前 16 | 说明 |
|---|---|---|---|
| `lib/index.js` | 23,277 | `CC621117FC4C40A2` | Host：路由 / 首屏注入（13s 兜底 / 运动策略）/ 配置 API / facts / Range 资产 |
| `lib/client.js` | 51,034 | `7F2DDACCADF79A33` | 浏览器：皮肤 / 背景视频生命周期 / `armHandoff` / 启动自举 / 设置页 / 品牌位降级 |
| `lib/skin.css` | 76,665 | `F51EAD3BD8C0FE25` | 视频背景层 + 深空玻璃 + MOSS HUD + 降级矩阵 + 镜头漂移 |
| `lib/splash.js` | 89,916 | `87D7719F960E813B` | 11.80s 四幕启动运行时（rAF 时间线 / 3 视频 / WebAudio / 跳过 / 兜底 / API 合并） |
| `lib/splash.css` | 47,872 | `02AD0C346490E198` | 四幕 HUD / 竖分割接缝 / 全局装饰 / 响应式 1280×720–2560×1440 |
| `preview/index.html` | 65,578 | `9C9A88AF468241A0` | 预览页（重播 / 分幕跳转 I–IV / 三档 / veil+blur 滑杆） |
| `package.json` | 1,664 | `792403C4D02BDC95` | 版本 0.2.0 |

### 4.2 Web 资产（`lib/assets` 合计 15,384,802 B = 14.67 MiB ≤ 26MB 红线）

| 产物 | 字节 | 规格 | SHA256 前 12 |
|---|---|---|---|
| `earth/earth-1080.mp4` | 7,657,545 | 1920×1080 / 30fps / 30.000s / 无缝循环 | `d62e1758b096` |
| `earth/earth-720.mp4` | 3,319,794 | 1280×720 / 30fps / 30.000s | `f3772c03e841` |
| `earth/earth-poster.webp` / `.jpg` | 26,848 / 99,748 | 1920×1080 | `5b73cafb198f` / `612be4fce840` |
| `neuro/neuro-boot-1080.mp4` | 1,784,602 | 1920×1080 / 25fps / 3.400s | `93caee745206` |
| `neuro/neuro-boot-720.mp4` | 937,830 | 1280×720 / 25fps / 3.400s | `6972e6401bb1` |
| `neuro/neuro-boot-poster.webp` | 183,354 | 1920×1080 | `c92236a886ca` |
| `moss/moss-cinema-1080.mp4` | 932,134 | 1920×1080 / 30fps / 5.000s | `96fc15b361a5` |
| `moss/moss-cinema-720.mp4` | 418,771 | 1280×720 / 30fps / 5.000s | `f6d34426bdcd` |
| `moss/moss-cinema-poster.webp` | 24,176 | 1920×1080 | `eed03e869a30` |
| `fonts/jetbrains-mono-{400,500}.woff2` + `OFL.txt` | 21,088 / 21,820 / 4,399 | OFL 1.1 | — |
| `manifest.json` | 14,977 | 10 条资产，bytes/sha256 与磁盘逐件一致 | `d9a8490324fe` |

### 4.3 组合包

- `releases/dsh-startup-moss2-0.2.0.tgz`（`npm pack`）
- `dist/MOSS2-组合包.zip`（拖给 DSH 即装，含安装说明 / 使用说明 / 交付报告 / install/verify 脚本 / SHA256 清单）
- 演示视频（工作区）：`_work/demo/moss2-boot-demo.mp4`（13.3s / 1536×960 / 30fps / ≤4MB）

## 5. 验证结果（全部可复跑）

### 5.1 静态断言（`npm test` = 4 个 smoke）

| 测试 | 结果 | 覆盖 |
|---|---|---|
| `test/smoke-host.mjs` | **35/35 PASS** | 模块导出 / DEFAULTS / 归一化 / 6 路由 / 13 件资产白名单 + 旧资产 404 / Range 206 / tapIndex 注入（13s 兜底 / 无 reduced-motion 静态降级） |
| `test/smoke-assets.mjs` | **24/24 PASS** | 10 件资产存在 + 体积上限 + 文件签名 / 海报尺寸 / OFL / manifest 逐件 sha256+bytes / 旧 moss-eye 已删除 / 源素材未改动 |
| `test/smoke-splash.mjs` | **19/19 PASS** | 语法 / DOM 契约 / 四幕文案与时间线 / API / v0.2 三视频 URL / **不读 prefers-reduced-motion** / audio 静默降级 / dispose |
| `test/smoke-client.mjs` | **21/21 PASS** | 语法 / ModuleLoader / FALLBACK=DEFAULTS / 运动策略根因 / armHandoff(t%duration) / 品牌位降级 / 资产白名单 / 三档降级 / 契约 |

### 5.2 真宿主场景矩阵（隔离 DSH Host port 57123 + headless Chrome CDP）

> 运行器：`_work/verify2/run.mjs`（`--restart-host` 加载最终 Host 代码）｜结论：`_work/verify2/REPORT.md` / `assertions.json`

| 场景 | 断言 | 结论 | 关键证据 |
|---|---|---|---|
| normal（no-preference） | 30/30 | PASS | 四幕截图 + 视频 paused=false / currentTime 递增 / 交接同帧 |
| system-reduce（模拟本机系统 reduce） | 34/34 | PASS | `htmlClass` 无 `--static`、三视频照播、11.8s 全 HUD |
| skip（Esc） | 20/20 | PASS | ≤1.2s 进地球幕、armHandoff 成功、撤层 ≤2.6s、交接后 ambient 在播 |
| missing-video（三视频 404） | 23/23 | PASS | CSS 兜底完整走完、0 异常、11.8s 交接 |
| saver（仅海报） | 22/22 | PASS | splash 0 个 mp4 请求、海报版走完 |
| immersive / glass | 20/20 / 21/21 | PASS | 三档皮肤 + HUD |
| preview（预览页） | 15/15 | PASS | 重播 / 分幕跳转 / 三档 / 滑杆 / 动态背景 Δ |
| 合计 | **185/185** | **全 PASS** | `_work/verify2/assertions.json` |

关键运行时数值（真宿主）：
- 启动层生命周期：正常 11.80s 结束、根节点移除、`dsh-moss2:done` → UI 900ms 分区显影；`exceptions=0`、`console error=0`。
- 交接：splash 10.60s 调 `armHandoff`（requested 2.50 → applied 2.50，duration 30）；交接后启动层地球与 ambient `currentTime` 差 ≤0.3s、rect ≤2px、transform 相同（scale 1.12）。
- 背景真的在动：截图两帧像素差 12.6–15.0%（默认/系统 reduce 均 >0，不是海报）；视频 `paused=false`。
- 品牌位：`.dsh-moss-brandmark` 2 处正常渲染，冲突异常 0（修复前基线 4 条异常）。
- 可读性：正文对比度复核见 `_work/verify2/`（notext 法）；默认 veil=58 下 4.5:1 目标复核通过。

### 5.3 视觉验收

- 逐相位定稿图（内部 elapsed 对齐）：`_work/splash/v02/freeze3/F3-t*.png`（14 张）+ `F3-report.json`
  （0.25 / 2.4 / 3.5 / 4.2 / 4.6 / 5.6 / 7.2 / 7.6 / 8.3 / 9.4 / 10.4 / 10.8 / 11.05 / 12.5s）
- 官方 cdp 时间点：`_work/splash/v02/accept/A3-*`、`B2-*`
- 场景：`_work/splash/v02/scenarios/`（skip / missing / saver / replay / reduce / calm）
- 皮肤：`_work/skin/v02/kFinalD-*`、`kFinalR-*`（默认/系统 reduce 下地球+玻璃+品牌位）
- 分辨率适配：`_work/splash/v02/res/r720-*`（1280×720）、`r1440-*`（2560×1440）
- 归档：`docs/verify/splash-v2/`、`docs/verify/skin-v2/`（verifier 最终版）

## 6. 关键设计决策

1. **四幕叙事而非四个特效堆叠**：素材之间的关系链是「神经接口 → MOSS → 转场 → 地球」，颜色脚本为 青绿(BCI) → 红(MOSS) → 红/蓝对半 → 地球蓝。
2. **素材 3 的处理**：`scene.pkg` 是 Wallpaper Engine scene（非视频流、不可直接播放），按其构图逻辑用素材 1+2 的高清视频实时合成竖分割转场；其 preview 作为设计参照归档，不打包。
3. **交接无跳帧**：启动层地球层与 UI ambient 层同资产、同裁切（`object-fit:cover` / `50% 50%` / `scale(1.12)`），splash 在 10.60s 主动 `armHandoff(t)` 把底层 seek 到同一帧；`--handoff` 1.5s 内锁定漂移。
4. **视频永远播**：系统 reduced-motion 只影响装饰动效（扫描线/呼吸/漂移），视频与启动动画不受影响——这是本轮最重要的根因修复。
5. **背景可见性**：`moss-bg-drift` 44s 缓慢镜头漂移（平移 ≤2.5%、scale 1.12→1.155）叠加视频自身运动，确保「流浪」的动感持续可见；`veil=58` 默认下地球清晰可见。
6. **不改宿主布局**：装饰全 `pointer-events:none`、`z-index ≤ 900`；Host 兜底 13s；任何异常不白屏。

## 7. 安装 / 生效

- 拖 `dist/MOSS2-组合包.zip` 给 DSH 对话框 → 按包内 `00-给DSH的安装说明.md`（`plugin_manager install_bundle`）。
- **生效方式（本轮已实测）**：
  - 浏览器/Web GUI 用户：**刷新页面**即可（splash.js/css/skin.css 由 Host 每次请求读盘；client bundle rev 随文件变化）；
  - 桌面版 Host 半侧：本轮已用 `_tools/live-reload.ps1` 对 `desktop` profile 触发 HMR 重组合，**实测热重载成功**：
    `/dsh-moss2/config` 返回 `version=0.2.0`、`neuro/neuro-boot-720.mp4` 返回 200；随后用独立 headless Chrome 加载 live host（57000）验证：
    四幕启动动画正常、`exceptions=0`、`console=0`、地球 `earth-1080.mp4?v=0.2.0` 在播（系统 reduce 模拟下仍 `paused=false`）。**用户只需刷新 DSH 页面。**
  - 若热重载未生效：完全退出 DSH（含托盘）再重开。
  - **播一次提示**：旧会话 `sessionStorage` 已有 v0.1「已播」标记，为让本次刷新一定看到四幕，已把 `~/.dsh/dsh-startup-moss2.json` 的 `mode` 临时改为 `daily`（当天一次）；看完可在 设置 → MOSS 主题 改回 `session`。
- 卸载：`plugin_manager remove_bundle dsh-startup-moss2`；不改宿主文件，配置残留 `~/.dsh/dsh-startup-moss2.json` 可手动删。

## 8. 组合包内容

```
00-给DSH的安装说明.md        ← 让 agent 照做即可
01-使用说明与排错.md         ← = INSTALL.md
02-交付报告.md               ← 本文件
dsh-startup-moss2-0.2.0.tgz  ← 插件包（含 10 件 Web 资产，约 15.4MB）
tools/install-moss2.ps1      ← 命令行安装器
tools/verify-moss2.ps1       ← 安装后自检（v0.2 资产清单）
校验清单.sha256              ← 包内每个文件的 sha256
```

## 9. 未验证项（诚实清单，不标 ✅）

1. **真实 Electron 窗口内的最终观感**：本轮用隔离真 DSH Host + headless Chrome 验收（同一 Host/web app/插件代码），
   未在用户正在使用的 desktop profile Electron 窗口里逐帧确认（需重载 Host 后刷新）。
2. **声音听感**：WebAudio 启动音在 headless 下静音未试听；AudioContext 不可用时的静默路径已断言。
3. **真实 GPU / 4K 屏性能**：`backdrop-filter`（幕 I 中央暗带）与三视频解码在低端 GPU 的开销未量化；
   若掉帧，优先删除 `.ms-neuro-center::before` 的 `backdrop-filter`，叙事不受影响。
4. Windows 原生标题栏（WCO 三键）与皮肤的融合未逐帧验收（原生按键不在 DOM）。
5. 设置页在真实设置面板中的视觉与保存交互（DOM/逻辑已在真宿主验证，未人工点击）。
6. 宿主小版本升级后类名哈希若变化，装饰选择器可能部分失配（token 覆盖不受影响）。
7. ~~用户主 profile 的 HMR 热重载效果~~ → **已实测通过**（见 §7：desktop Host 已重载到 0.2.0；独立 headless Chrome 加载 live host 四幕正常、exceptions=0）。

## 10. 回滚

```powershell
# DSH 里让 agent 执行：
#   plugin_manager remove_bundle dsh-startup-moss2
# 或命令行（若 dsh 在 PATH）：
dsh plugin remove dsh-startup-moss2
```

卸载不改宿主文件；配置残留可手动删。若重载后白屏：先 `remove_bundle`，再重开 DSH；v0.1 源码备份在 `_work/backup-v0.1/`。
