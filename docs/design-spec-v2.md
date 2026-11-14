# MOSS2 v0.2.0 设计规格 —「四素材 · 四幕叙事」启动动画 + 流浪地球动态背景

> 生成：2026-11-06 19:0x（Asia/Shanghai）｜ 取代 `docs/design-spec.md`（v1 归档，勿删）
> 状态：**本文件是 v0.2.0 的唯一设计权威源**。实现、资产、皮肤、验收出现分歧时以本文件为准。
> 用户原话拆解见 §1；素材 → 幕映射见 §2；精确时间线见 §4；技术契约见 §6–§8；验收见 §10。

---

## 0. 一句话

把四个素材串成一条完整的叙事链：
**DeepSeek Harness 神经接口开幕（素材2992034258）→ MOSS 机器人苏醒（素材2926246706）→ 一半 MOSS／一半流浪地球的转场（素材2940368322 的构图逻辑）→ 流浪地球全屏、动态视频作为 UI 背景（素材2949159595）**。

## 1. 用户诉求拆解（必须逐条兑现）

| # | 用户原话 | 落地要求 |
|---|---|---|
| 1 | 「2926246706 是很写实的 MOSS 机器人的动态效果，肯定要体现在启动动画里」 | 启动动画第二幕**全屏播放 MOSS 实拍视频**（不是小圆窗里的小眼睛），占屏 ≥ 4 秒 |
| 2 | 「2949159595 是真正的流浪地球，地球装推进器在宇宙中流浪；背景必须是动态的，毛玻璃效果是对的」 | UI 背景 = **真正在播放**的地球视频（循环 + 缓慢镜头漂移），玻璃压暗保证可读性 |
| 3 | 「2940368322 是刚刚好的转场素材，一半 MOSS 一半流浪地球，逻辑是对的，是启动动画到 UI 的衔接」 | 启动动画第三幕：**竖直对半分割**，左 MOSS／右地球，接缝扫过 → 地球全屏 → 交接 UI |
| 4 | 「2992034258 是脑机接口概念面板，最难融入；启动动画必须有一个 DeepSeek Harness 元素的开幕，用它设计开幕，然后进入 MOSS」 | 启动动画第一幕：**BCI 面板 + DEEPSEEK HARNESS 品牌开幕**，结束于面板自身的故障闪光 → 切入 MOSS |

**根因修复（v0.1 最重要的失败点）**：本机 Windows 已关闭系统动画（`SPI_GETCLIENTAREAANIMATION = False`），Chromium 因此报告
`prefers-reduced-motion: reduce`。v0.1 把系统偏好当作硬开关 → 真实环境里地球视频**只显示海报帧、不播放**，启动动画走「降级版」且不显示 MOSS 视频。
这正是用户说「背景动起来不难吧 / 效果根本没做到」的直接原因。v0.2 规定：

> **视频播放（地球背景、启动动画三支视频）永不被系统 reduced-motion 偏好关闭。**
> 系统偏好/配置 `reducedMotion` 只允许减少装饰性动画（扫描线、呼吸、旋转装饰），不得停视频、不得缩短启动动画、不得隐藏 MOSS。

## 2. 素材 → 幕 映射

| 幕 | 素材 | 素材在本插件中的形态 | 作用 |
|---|---|---|---|
| I 神经接口 | `2992034258/最终.mp4`（1920×1080@25，30s） | 转码 `neuro-boot-1080/720.mp4`：**源 t=20.80→24.20（3.40s）** | DSH 品牌开幕；末尾保留素材自带故障闪光（源 t≈24.0），作为切入 MOSS 的剪辑点 |
| II MOSS 苏醒 | `2926246706/1月31日.mp4`（1920×1080@30，16.18s） | 转码 `moss-cinema-1080/720.mp4`：**源 t=0.60→5.60（5.00s）** | 全屏 MOSS 实拍：镜头从机械细节拉开、红色主眼出现（素材自身运镜即「苏醒」） |
| III 转场 | `2940368322`（Wallpaper Engine scene，`scene.pkg` + preview.jpg） | **不直接播放**（见下）——用素材 1、2 视频以 CSS 分割合成复刻其构图 | 左半 MOSS／右半地球的竖分割 → 接缝扫过 → 地球接管全屏 |
| IV 流浪地球 / UI 背景 | `2949159595/流浪地球_15_1.mp4`（1920×1080@60，180s） | 转码 `earth-1080/720.mp4`：**源 t≈30→60（30.00s）无缝循环**（沿用 v0.1 已验证产物；实测 30.000s） | 启动动画终幕 + UI 常驻动态背景；终幕与 UI 背景**同一资产、同一裁切**，交接无跳帧 |

**关于素材 3**：`2940368322` 是 Wallpaper Engine 的 *scene* 工程（`scene.pkg` + 自定义 shader），不是视频流，离开 WE 引擎无法直接播放；
用户已明确「质感和滤镜肯定和上面两个素材不一样，但**逻辑是对的**」。因此按用户认可的逻辑，用素材 1（MOSS）+ 素材 4（地球）两支高清视频
实时合成「一半一半」的竖分割转场，并把素材 3 的 `preview.jpg` 作为设计参照归档到 `docs/assets-report.md`。
**禁止**把 `scene.pkg` 打进插件包（14MB 且不可播放）。

## 3. 色彩脚本（素材之间的关系）

- 幕 I：**青绿**（BCI 面板原色）+ 冰白（DSH 品牌）→ 科技/神经
- 幕 II：**MOSS 红**（#ff3b30 附近）+ 机体灰白 + 深空黑 → 凝视/在场
- 幕 III：左红右蓝的**对半**，接缝为冰白高光 → 交接
- 幕 IV：**地球蓝/等离子青** + 深空黑，红色只保留 ≤3% 屏面的 MOSS 印记（顶栏遥测点）
- 红色语义不变：只在 MOSS 凝视/状态/告警；地球蓝=数据与交互。

## 4. 启动动画时间线（总长 11.80s，±0.05s）

| 区间 | 幕 | 画面 | 叠加 HUD/文案 |
|---|---|---|---|
| 0.00–0.50 | 黑场 | 纯黑；左下一根冰白细线从左向右扫过；`DEEPSEEK HARNESS` 微字标浮现 | `DEEPSEEK HARNESS // BOOT` |
| 0.50–3.90 | I 神经接口 | `neuro-boot` 视频淡入（opacity 0→0.92，scale 1.04→1.14 慢推）；上/下暗渐变 + 轻微高斯（CSS `<filter>` 或叠层，禁止重滤镜整屏模糊视频主体）；3.50 起素材自带故障闪光 | 中央 `DEEPSEEK HARNESS` 大字标（宽字距，clip-path 从左到右揭开 + 扫光），副标 `NEURAL INTERFACE · 神经接口`；左下启动日志 3 行打字；右下 `LINK 08→100%` 进度环；顶部 `BCI-1 · 意识上传通道` |
| 3.90–8.10 | II MOSS | 硬切（红/白 1 帧闪白 60ms）→ `moss-cinema` 全屏淡入；视频自带「机械细节→MOSS 主眼」拉开运镜；四周暗角 + 红色边缘辉光随节奏呼吸 | 左上 `550W` 大字 + `MOSS SYSTEM / 中国航天局 · 量子计算机`；右侧启动日志 `T+01.60 系统自检 通过` …（逐行）；左下真实遥测 PROFILE/WORKSPACE/MODEL/SESSIONS；底部进度条 `BOOT SEQUENCE 11.8s`；右下 `INITIALIZING xx%`；7.10 起红色凝视准星锁定 MOSS 主眼，`MOSS 已上线`，引文「让人类永远保持理智，确实是一种奢求。」 |
| 8.10–10.00 | III 转场 | 竖直分割线在中央亮起：**左半= MOSS（视频末帧保持/继续播放），右半=地球视频从第 0 帧开始**；8.10–8.90 保持对半（0.8s，正是素材 3 的构图）；8.90–10.00 接缝向左扫过（地球 clip 从 50%→0% 展开为全屏），接缝带冰白高光 + 6px 数据刻线 | 分割期左右各一行小字：左 `550W · 控制权 imminent`、右 `THE WANDERING EARTH`；扫过时中央 `移交控制权 / 550W → 地球发动机` |
| 10.00–11.00 | IV 地球 | 地球全屏；**裁切/缩放与 UI ambient 层完全一致**（`object-fit:cover; object-position:50% 50%; transform:scale(1.12)（earth 实际 30.00s，代码不得写死 28）`）；轻微暗角；10.60 调用 `armHandoff(earthTime)` 把真实背景层 seek 到同一帧并在底层播放 | 底部一行 `流浪地球计划 · 已启动` + `地球发动机 全功率`；右上角极小 `550W · MOSS / 移交完成` |
| 11.00–11.80 | 交接 | 启动层地球层淡出 300ms（真实 ambient 已同帧在底，不可见跳变）；HTML class 去掉 `moss-lock`；`dsh-moss-enter` 由 client 在 splash 结束时加（UI 900ms 分区显影） | 无 |

**跳过（Esc / 隐藏按钮）**：跳到 10.00 相位（地球全屏、无 MOSS/BCI），400ms 淡入后走 10.00–11.80；`allowSkip=false` 时忽略。
**强制结束（10.5s 兜底）**：任何异常都要在启动开始后 13.0s 内结束并交接，禁止卡死。
**模式**：`mode=session/daily/always` 逻辑沿用 v0.1（`sessionStorage` 键 `dsh-moss2-shown`），但 `mode` 只控制「是否播放」，不控制内容长短。

## 5. 资产规范（严格文件名，Host 白名单必须一致）

目录 `lib/assets/`（新增 `neuro/`、`moss/` 改写）：

| 文件 | 规格 | 体积上限 | 来源 / 参数 |
|---|---|---|---|
| `neuro/neuro-boot-1080.mp4` | 1920×1080 / 25fps / 3.40s / H.264 High / yuv420p / bt709 / 无音轨 / faststart | ≤ 4.0 MB | `2992034258/最终.mp4` -ss 20.80 -t 3.40，`scale=1920:1080:flags=lanczos`，crf 24 |
| `neuro/neuro-boot-720.mp4` | 1280×720 / 25fps / 3.40s | ≤ 1.6 MB | 同上，`scale=1280:720`，crf 24 |
| `neuro/neuro-boot-poster.webp` | 1920×1080 q80（clip 第 0 帧） | ≤ 200 KB | ffmpeg -ss 20.80 -frames:v 1 |
| `moss/moss-cinema-1080.mp4` | 1920×1080 / 30fps / 5.00s / 同上 | ≤ 6.0 MB | `2926246706/1月31日.mp4` -ss 0.60 -t 5.00，crf 24，轻调色 `eq=contrast=1.06:saturation=0.94` |
| `moss/moss-cinema-720.mp4` | 1280×720 / 30fps / 5.00s | ≤ 2.6 MB | 同上 |
| `moss/moss-cinema-poster.webp` | 1920×1080 q80 | ≤ 200 KB | clip 第 0 帧 |
| `earth/earth-1080.mp4` | 1920×1080 / 30fps / **30.00s** / 无缝循环 | ≤ 8.0 MB | **沿用 v0.1 已验证产物**（实测 30.000s，xfade 回卷） |
| `earth/earth-720.mp4` | 1280×720 / 30fps / **30.00s** | ≤ 3.5 MB | 同上 |
| `earth/earth-poster.webp` / `.jpg` | 1920×1080 | ≤ 220KB / ≤ 400KB | 沿用 v0.1 |
| `fonts/jetbrains-mono-{400,500}.woff2` + OFL.txt | — | — | 沿用 v0.1（OFL 1.1） |

**删除**：`moss/moss-eye-720.mp4`、`moss/moss-eye-poster.webp`（v0.1 小圆窗方案废弃；品牌位用内联 SVG）。
**质量档**：`quality=high` → 1080 三支；`standard` → 720 三支；`saver` → 全部只海报（视频不加载）。
**manifest**：`lib/assets/manifest.json` 记录每个产物 role/size/duration/fps/sha256/source in-out/ffmpeg 命令；`smoke-assets` 逐件核对。

## 6. Splash DOM / API 契约（升级 v1，勿破坏下列名字）

```
<div id="dsh-moss-root" aria-hidden="true">      ← Host 首屏注入，splash.js 填充内容
  <div class="ms-stage">
    <section class="ms-act ms-act--neuro">  <video class="ms-video" data-act="neuro" poster=…>  <div class="ms-veil">  <div class="ms-hud">…</section>
    <section class="ms-act ms-act--moss">   <video class="ms-video" data-act="moss">   … </section>
    <section class="ms-act ms-act--earth">  <video class="ms-video" data-act="earth"> … </section>
    <div class="ms-split">                  ← 分割转场：.ms-split__moss（左，moss 末帧） + .ms-split__earth（右，earth clip） + .ms-split__seam
    <div class="ms-global-hud">…</div>
  </div>
</div>
```

- 根节点 z-index：`2147483000`；`html.moss-lock` 锁滚动。
- HTML class：`dsh-moss-charging`（启动中，可选）、交接用 `dsh-moss-enter`（client 加）。
- 全局变量：`window.__DSH_MOSS2_SPLASH__ = { version, state:'boot'|'playing'|'handoff'|'done', duration:11.8, phases }`；
  `window.__DSH_MOSS2_REPLAY__ = fn`；`window.__DSH_MOSS2_SKIP__`（未播放时 true）；`window.__DSH_MOSS2_API__` 由 splash/client **合并**写入（不得互相覆盖）。
- Splash 暴露的 API（与 v0.1 同名兼容）：`skip() / finish() / replay() / freeze(bool) / dispose() / state() / progress() / reduced() / duration`。
- 交接：splash 在 10.60s 调 `window.__DSH_MOSS2_API__.armHandoff(t)`（t = 启动层地球视频 `currentTime`），
  client 收到后把 ambient 视频 `currentTime=t` 并确保 `play()`；splash 11.00 淡出地球层，11.80 `finish()`。
- 资源 URL：`ASSET_BASE + 'neuro/neuro-boot-' + q + '.mp4?v=' + VERSION`（`q` = 1080/720；saver 不用视频）。所有 `<video muted playsinline preload="auto">`，`autoplay` 由 JS 调 `play()`。
- **不发 WebAudio 也可接受，但要保留**：`__DSH_MOSS2_API__.audio` 可选；声音必须有失败静默降级。

## 7. 皮肤/背景契约（`lib/client.js` + `lib/skin.css`）

1. **运动策略（根因修复）**：`shouldUseStatic` 只看 `quality==='saver'` 或视频不可用；**删除** `prefers-reduced-motion` 对视频/启动的判断。
   `reducedMotion=true`（用户在设置里显式开启）→ 加 `dsh-moss-skin--calm`：装饰动画停、扫描线停、呼吸停；**视频照播**。README 必须写清这一点。
2. 背景层 DOM 不变（`#dsh-moss-ambient` + `.ma-still/.ma-video/.ma-veil/.ma-vignette/.ma-grain/.ma-scan/.ma-rim`），`#root{z-index:1}`。
3. `.ma-video` 保持 `object-fit:cover; object-position:50% 50%; transform:scale(1.12)（earth 实际 30.00s，代码不得写死 28）`；新增**极慢镜头漂移**：
   `animation: moss-bg-drift 44s ease-in-out infinite alternate`，幅度 ≤2.5% 平移 + 1.12→1.155 缩放（`prefers-reduced-motion` 不得停它，`--calm` 可停）。
4. `armHandoff(t)`：seek ambient `currentTime=t`（`duration=28` 时对 t 取模）；确保播放；返回 boolean。
5. 品牌位冲突修复：`sidebar.brand.mark` 已存在注册（另一个插件，id 前缀 `tk`）→ v0.2 必须 **try/catch 降级**：
   先尝试 `priority` 高于已有占位（按宿主 slot API：注册优先级不同可 shadow，最低者渲染；用能覆盖的优先级），失败则放弃品牌位并 `console.warn` 一次，**不得抛出未捕获异常**。conversation.hero 品牌位同理。
6. 皮肤观感：保留 v0.1 玻璃；背景可见度优先于过暗。`veil` 默认仍 58，但 `ma-vignette` 亮度可微调，确保地球在默认设置下肉眼可见在动（验收：连续两帧差异非零）。
7. 设置项：`reducedMotion` 文案改为「减弱装饰动效（不影响视频背景）」；其余字段不变。

## 8. 配置（三处一致：`lib/index.js` DEFAULTS / `lib/client.js` FALLBACK / `lib/splash.js` 读取）

字段不变：`enabled, mode, skin, quality, veil, blur, hud, sound, volume, allowSkip, reducedMotion`。
`skin` 档位 `off/glass/immersive` 不变；`hud` 不变。**不新增字段**（避免三处漂移），运动策略修改在语义层。

## 9. 宿主路由（`lib/index.js`）

- `/dsh-moss2/asset/<白名单>` 白名单替换为 §5 新文件（删除 moss-eye）。
- `/dsh-moss2/splash.js|splash.css|skin.css|config|preview` 保持；`?v=` 用 `package.json` version（0.2.0）刷新缓存。
- 首屏注入的 `window.__DSH_MOSS2__` 形状不变（config 字段在顶层 + version/facts）。
- 若 `splash.js` 需要新全局：只新增 `window.__DSH_MOSS2_SPLASH__`（已存在契约）与 API 方法，不改注入结构。

## 10. 验收（必须全部有证据，截图场景用 headless 真宿主，见 `_tools/cdp.mjs`）

1. **真宿主冒烟**：`node _tools/cdp.mjs` 加载 `http://127.0.0.1:57000/`（伪造本地 cookie），**无未捕获异常**（`sidebar.brand.mark` 冲突必须消失）。
2. **正常播放序列**：在 t=0.6/2.2/3.6/4.2/5.2/6.8/7.4/8.3/8.8/9.4/10.2/11.2/12.5 截图，逐张核对 §4 每一幕；视频元素 `paused=false`、`currentTime` 递增。
3. **背景真的在动**：交接后间隔 2s 抓两帧，`#dsh-moss-ambient video` 区域像素差异 > 0（不是海报）。
4. **系统 reduced-motion 不阉割**：CDP `Emulation.setEmulatedMedia(prefers-reduced-motion:reduce)` 下重跑：三支视频仍 `paused=false`，启动动画仍 11.8s，MOSS 与地球均可见。
5. **Esc 跳过**：按 Esc 后 ≤1.2s 进入地球幕并交接。
6. **资源缺失降级**：改 URL 404 模拟 → 海报/纯 CSS 兜底，11.8s 内仍交接，无异常。
7. **`quality=saver`**：不加载任何视频请求（Network 断言），启动动画仍完整走完（海报版）。
8. **静音/声音失败**：AudioContext 异常时静默继续。
9. **交接无跳帧**：11.0–12.5 连续截图，地球画面位置/缩放不突变。
10. **UI 可读性**：默认 veil=58 下正文对比度 ≥4.5:1（沿用 v0.1 方法复核一张）。
11. **包体**：`lib/assets` ≤ 26MB；`npm test` 全绿（更新后的 smoke-host/assets/splash/client）。

## 11. 写入范围与协作

| 角色 | 写范围 |
|---|---|
| Lead | `docs/design-spec-v2.md`、`lib/index.js`、`package.json`、`README.md`、`docs/DELIVERY-REPORT-*.md`、`CHANGELOG.md`、`INSTALL.md`、integ 修复 |
| asset-lab | `lib/assets/**`、`_work/assets/**`、`docs/assets-report.md` |
| splash-smith | `lib/splash.js`、`lib/splash.css`、`_work/splash/**` |
| skin-weaver | `lib/client.js`、`lib/skin.css`、`_work/skin/**` |
| verifier | `_work/verify2/**`、`docs/verify/**`、`test/**`、`preview/**` |

**依赖顺序**：资产（草稿版先出）→ splash/skin 集成 → verifier 验收。任何跨范围修改先发给 Lead 仲裁。
