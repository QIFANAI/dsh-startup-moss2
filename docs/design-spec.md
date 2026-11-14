> ⚠️ **本文件为 v0.1 设计规格（历史归档）**。v0.2 的唯一设计权威源是 [design-spec-v2.md](design-spec-v2.md)：
> 四素材四幕叙事、11.80s 时间线、运动策略根因修复、资产清单、验收口径均以 v2 为准。
> 本文件保留用于追溯 v0.1 的设计动机与调色板/宿主契约，**不要再按本文件实现或验收**。

# MOSS2 · 流浪地球 550W — 设计规格（唯一权威源）

> 版本 v1.0 ｜ 2026-11-06 ｜ 作者：Lead ｜ 适用：`dsh-startup-moss2` v0.1.0
> 冲突裁决顺序：本文件 > `docs/host-map.md`（宿主事实）> 各模块自述。
> 本文所有数值即验收基线；任何偏离必须回写本文件并说明原因。

---

## 1. 一句话与定位

把 DSH 变成 **550W / MOSS 的驾驶舱**：开机先走一段 8 秒的 MOSS 启动序列，随后主界面的「底色」不再是色块，而是**一颗在黑色深空里缓慢自转的地球 + 蓝色等离子尾迹**（工作区素材 `2949159595`），UI 以深空玻璃面板悬浮其上；红色只属于 MOSS 本人（凝视与告警），蓝色属于地球与数据。

三条不可退让：

1. **背景必须是动态影像**（`earth-1080.mp4` / `earth-720.mp4`），不是任何 CSS 颜色填充；视频不可用时退化为同一帧海报，绝不退化成纯色。
2. **可读性优先于炫技**：正文对比度 ≥ 4.5:1，二级文字 ≥ 4.5:1（14px 级），任何装饰都不得进入正文的视觉通道。
3. **不碰宿主排布**：不改字号/行高/字体栈/间距/宽度/定位（宿主元素上只写颜色、背景、边框、阴影、滤镜）；新增装饰层一律 `pointer-events:none`，`z-index ≤ 900`（低于宿主弹窗）。

## 2. 主题语言（MOSS 550W）

### 2.1 调色板（锁定值）

| 变量 | 值 | 角色 |
|---|---|---|
| `--m-void` | `#04070c` | 深空底（视频黑场、兜底底色） |
| `--m-void-2` | `#070c14` | 次级底 |
| `--m-ink` | `#0b1220` | 玻璃基色（面板 RGB 组底） |
| `--m-white` | `#e9f1fa` | 主文字 / 品牌白（MOSS 机体白） |
| `--m-steel` | `#b7c7d8` | 次级文字 |
| `--m-steel-2` | `#93a6ba` | 三级文字 |
| `--m-steel-3` | `#6f8299` | 说明/占位 |
| `--m-earth` | `#4f8bff` | 地球蓝：链接、焦点、选中 |
| `--m-plasma` | `#8fd3ff` | 等离子青：数据高光、代码导轨 |
| `--m-moss` | `#ff3d1f` | **MOSS 红**：仅用于「MOSS 在场」与告警装饰（红眼、状态灯、当前项刻线） |
| `--m-moss-dim` | `#a32410` | MOSS 红暗部 |
| `--m-amber` | `#ffb454` | 城市灯光琥珀：暖高光、warn 装饰 |
| `--m-success` | `#45d6a0` | 成功态（沿用宿主语义） |
| `--m-line` | `rgba(150,200,255,.10)` | 1px 结构线 |
| `--m-line-2` | `rgba(150,200,255,.18)` | 强结构线 |
| `--m-glass` | `rgba(6,11,19,.58)` | 标准玻璃底 |
| `--m-glass-2` | `rgba(9,15,25,.68)` | 抬升玻璃底 |
| `--m-glass-3` | `rgba(12,20,32,.76)` | 浮层玻璃底 |

**语义纪律**：`brand-primary` 用机体白（`#e6f0fb`）——宿主深色主题的主按钮本来就是近白，保持原语感；`state-error` 保持红 `#ff5a4d`；**MOSS 红只做手势/在场/装饰**，不得替代 error，也不得大面积铺底（单块 ≤ 屏面 3%）。地球蓝只做交互强调，不铺底。

### 2.2 字体

- 正文/UI：**沿用宿主字体栈**，一个 `font-family` 都不改。
- 装饰/HUD（数字、遥测、代号、坐标）：`--m-font-mono` = `"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace`，捆绑 `lib/assets/fonts/jetbrains-mono-{400,500}.woff2`（OFL，附 `OFL.txt`）。中文落入系统 CJK 字体兜底，属预期。
- 字号：装饰层 9–11px，字距 `.08em–.16em`，全大写/大写拉丁 + 中文短句。

### 2.3 装饰语法（MOSS HUD 词典）

只允许以下 9 种装饰母题，禁止自由发挥导致风格漂移：

1. **刻线尺**：1px 短线阵列（`repeating-linear-gradient`），用于四角与侧栏边缘。
2. **四角括号**：L 形 1px 折线，画面四角与输入卡四角。
3. **红眼**：同心圆 + 中心红点 + 呼吸光晕（SVG 或 CSS 径向渐变），代表 MOSS 在场。
4. **遥测条**：等宽小字 + 冒号对齐的键值行（`550W : MOSS`）。
5. **扫描线**：1px 水平亮线 + 12% 透明扫描带，速度极慢（≥14s 一层）。
6. **拨轮刻度**：环形 `conic-gradient` 刻度 + 缓慢旋转（60s/圈，反向 18s/圈）。
7. **状态灯**：3px 圆点 + 呼吸（红=凝视中 / 青=数据流 / 绿=就绪）。
8. **等离子轨**：2px 渐变导轨（青→透明），用于代码块、选中项、卡片左缘。
9. **颗粒/暗角**：噪声 ≤3% + 四角暗角，用于把 UI 从背景影像上「压」出来。

### 2.4 动效

- 所有持续动画 ≤ 2 个合成层；时长 ≥ 8s 的缓慢循环一律 `alternate` 或线性无限，不做弹跳。
- 禁止动 layout 属性；只动 `opacity` / `transform` / `background-position` / `filter`。
- `prefers-reduced-motion: reduce` 或用户开「减弱动态」→ 视频停在海报帧、旋转/扫描/呼吸全部停止，只保留 ≤300ms 的淡入见。
- 启动层与皮肤交接：900ms 分区显影（见 §6.4）。

## 3. 资产契约（文件名即接口，asset-lab 产出）

```
lib/assets/
  earth/earth-1080.mp4    1920x1080 30fps H.264 无缝循环 无音轨 ≤8MB   high 画质
  earth/earth-720.mp4     1280x720  30fps H.264 无缝循环 无音轨 ≤3.5MB standard 画质
  earth/earth-poster.webp 1920x1080 循环首帧（首屏立即出现） ≤220KB
  earth/earth-poster.jpg  同上兜底（老 WebView / webp 失败） ≤400KB
  moss/moss-eye-720.mp4   ≤8s 循环 MOSS 红眼特写 无音轨 ≤2.5MB
  moss/moss-eye-poster.webp ≤160KB
  fonts/jetbrains-mono-400.woff2, jetbrains-mono-500.woff2, OFL.txt
  manifest.json           每个产物的 role/size/sha256/生成命令
```

- 首屏策略：**海报立即显示** → 视频 `canplay` 后 300ms 淡入。视频 404/解码失败 → 保留海报，皮肤照常工作（`.moss-static`）。
- 视频必须 `muted playsinline loop preload="auto"`；`document.hidden` 时暂停，可见时恢复；`visibilitychange` 无泄漏。

## 4. 皮肤架构与契约

### 4.1 class / 属性 / 变量契约（client.js ↔ skin.css ↔ splash.js）

| 契约 | 注入者 | 值 | 消费方 |
|---|---|---|---|
| `html.dsh-moss-skin` | client.js | 皮肤作用域根；off 档不存在 → skin.css 整体零生效 | skin.css 全部规则前缀 |
| `html.dsh-moss-skin--glass` | client.js | 玻璃档（默认） | skin.css 档位 |
| `html.dsh-moss-skin--immersive` | client.js | 沉浸档（附加 HUD） | skin.css 档位 |
| `html.dsh-moss-skin--static` | client.js | 视频不可用 / saver 画质 / reduced-motion | 停运动、用海报 |
| `html.dsh-moss-skin--paused` | client.js | 页面隐藏 | 暂停动画与视频 |
| `html.dsh-moss-skin--noblur` | client.js | `@supports` 不支持 backdrop-filter | 提高不透明度兜底 |
| `html.dsh-moss-enter` | splash.js（交接）/ client.js（无启动动画时） | 900–1300ms 后移除 | 分区显影 |
| `--moss-veil` | client.js（0–100） | 背景压暗强度，默认 58 | 视频遮罩层 opacity |
| `--moss-blur` | client.js（0–40 px） | 玻璃模糊，默认 16 | backdrop-filter 半径 |
| `--moss-clock` | client.js（每秒） | `HH:MM:SS UTC+8` 文本 | 顶栏 `content:` |
| `#dsh-moss-ambient` | client.js，body 首子节点 | 视频背景 DOM（见 4.2） | skin.css |
| `#dsh-moss-hud` | client.js，body 末尾 | 帧级 HUD 文本层（可选，pointer-events:none） | skin.css |
| `html[data-moss-quality="high|standard|saver"]` | client.js | 供 CSS 选择画质相关细节 | skin.css |
| `html[data-moss-hud="off|normal|full"]` | client.js | HUD 密度 | skin.css |

### 4.2 背景 DOM 契约（client.js 生成，skin.css 负责样式）

```html
<div id="dsh-moss-ambient" aria-hidden="true">
  <img class="ma-still" alt="" src="/dsh-moss2/asset/earth/earth-poster.webp">
  <video class="ma-video" muted playsinline loop preload="auto"
         poster="/dsh-moss2/asset/earth/earth-poster.webp"></video>
  <div class="ma-veil"></div>      <!-- 主压暗：径向 + 线性双梯度，吃 --moss-veil -->
  <div class="ma-vignette"></div>  <!-- 四角暗角 -->
  <div class="ma-grain"></div>     <!-- SVG 噪声 ≤3% -->
  <div class="ma-scan"></div>      <!-- 扫描线，immersive 才有 -->
  <div class="ma-rim"></div>       <!-- 底部红/青光晕呼吸 -->
</div>
```

### 4.3 图层与 z-index

```
html > body
  #dsh-moss-ambient   position:fixed; inset:0; z-index:0; pointer-events:none
  #root               position:relative; z-index:1        ← 不改尺寸/布局
  宿主浮层（菜单/dialog）  宿主自己的 z-index（不动）
  #dsh-moss-hud       position:fixed; inset:0; z-index:900; pointer-events:none
  #dsh-moss-root      position:fixed; inset:0; z-index:2147483000（启动层）
```

`#dsh-moss-ambient` 永远在 `#root` 之下；`html.moss-lock` 期间启动层最上。

### 4.4 玻璃表面与 token 覆盖

全部覆盖同时落在 `html.dsh-moss-skin` 与 `html.dsh-moss-skin body`（特异性 0,1,2 > 宿主 `body[data-ds-dark-theme]` 的 0,1,1），逐 token 给 dark/light 两组（浅色宿主也强制深色驾驶舱，文档中明示）。**首批必覆盖 token（以 host-map 实测名单为准，缺一不可）**：

`--dsw-alias-bg-base`（透明）· `bg-layer-1/2/3` · `bg-overlay` · `bg-module-platform` · `bg-multi-select` · `bg-document-preview` · `bg-skeleton` · `bg-mask-1/2/3` · `border-l1/l2/l3/l4` · `label-primary/secondary/tertiary/caption/placeholder/disabled` · `brand-primary/brand-text` · `button-primary-fill/hover` · `state-error/warn/success/idle/business` · `specific-sidebar-fill` · `specific-menu*` · `tailwind/scrollbar*`（以实测为准）。

玻璃档的 `bg-layer-1/2/3` 用 `rgba()` 半透明（α 0.58–0.78），并在**主要表面**叠加 `backdrop-filter: blur(var(--moss-blur)) saturate(1.15)`。允许 backdrop-filter 的表面只能有 4 类：应用主列、侧栏列、输入卡、浮层面板；其余表面用纯半透明，禁止逐个加模糊（合成层预算 ≤6）。

主要表面视觉（示例值，最终以 skin.css 实测为准）：侧栏 `rgba(4,8,14,.52)` + 右缘 1px `--m-line-2`；主列 `rgba(6,11,19,.38)`（让视频更透）；输入卡 `rgba(9,15,25,.72)` + 四角括号；顶栏 `rgba(5,9,16,.46)` + 底部 1px 渐变线。

### 4.5 三档

| 档 | 内容 |
|---|---|
| `off` | 仅启动动画，宿主原样 |
| `glass` | 视频背景 + 玻璃表面 + 顶栏状态章 + 四角括号 + 当前项红刻线 + 输入卡括号（默认） |
| `immersive` | glass + 侧栏刻线尺 / 角落遥测 / 扫描线 / 颗粒 / 空态红眼水印 / 等离子导轨 / 状态灯呼吸 |

### 4.6 降级矩阵

| 条件 | 行为 |
|---|---|
| 视频 404 / 解码失败 | `.moss-static`：只留海报 + 遮罩，皮肤不变 |
| `saver` 画质 | 不加载视频，只显示海报（`.moss-static`） |
| `prefers-reduced-motion` / 用户减弱动态 | `.moss-static`，全部循环动画停 |
| `@supports not (backdrop-filter)` | `.moss-noblur`：玻璃 α 提高到 0.82+，无模糊 |
| 页面隐藏 | `.moss-paused`：视频暂停、CSS 动画暂停 |
| 浅色宿主 | 强制深色驾驶舱（token 覆盖同样生效），文档明示 |

## 5. 启动动画（lib/splash.js + splash.css）

### 5.1 时间线（总 8.2s，零点击自动，Esc 可跳过）

| t(s) | 画面 | 备注 |
|---|---|---|
| 0.00 | 全黑 + 极淡网格 + 中央 1px 红点呼吸 | 首帧立即可见，不等网络 |
| 0.35 | 红点炸开为 IRIS 环（Ø120），4 辐条 | 纯 CSS |
| 0.60 | 左上标题块淡入：`550W` / `MOSS SYSTEM` / `中国航天局 · 量子计算机` | 大字 `550W` 用等宽 |
| 1.10 | IRIS 扩张至 Ø420，圆窗内浮现 MOSS 红眼视频（后 0.3s 淡入） | 视频 `moss-eye-720.mp4` |
| 1.40 | 外环刻度 60s/圈、内环 18s/圈反向 | |
| 1.60 | 右侧逐行启动日志（6 行 ×180ms）：`系统自检 · 通过` / `权限核验 · 通过` / `行星发动机 · 10,000 组在线` / `领航员空间站 · 已对接` / `数据链路 · 已加密` / `正在接入 DEEPSEEK HARNESS` | 等宽 11px |
| 2.40 | 底部 1px 进度条 + 右下百分比大数字 0→100（7.4s 缓动） | `requestAnimationFrame` |
| 3.00 | 左下遥测面板淡入：`PROFILE / WORKSPACE / MODEL / SESSIONS`（真实 facts，取不到显示 `—`） | facts 由 Host 注入 |
| 5.20 | 短促红色脉冲；日志补 `MOSS 已就位` | |
| 6.00 | 中央大字幕 `MOSS 已上线` + 下方引文 `「让人类永远保持理智，确实是一种奢求。」` | |
| 7.10 | 横向红色扫描线一闪 → 收束 | |
| 7.40 | 启动层 700ms 淡出，`html.dsh-moss-enter` 交接，环境视频 900ms 淡入 | |
| 8.20 | 移除 `#dsh-moss-root`，解 `moss-lock`，释放滚动 | 10.5s 硬兜底 |

- **跳过**：Esc（若 `allowSkip`）→ 250ms 淡出直达交接；无 SKIP 按钮。
- **可访问性**：`role="presentation"`、`aria-hidden="true"`，键盘焦点保持宿主；启动期间锁滚动（`html.moss-lock{overflow:hidden}`）。
- **音频**：WebAudio 程序化 5 声（55Hz 低频底 + 3 记提示音 + 收束扫频），默认开、音量 0.5；`AudioContext` 不可用或 `resume()` 失败 → 静默继续，不弹权限、不阻断。所有节点随启动层销毁而断开。

### 5.2 视觉规范

- 底色 `--m-void`，叠层：背景 `earth-poster.webp`（`filter:brightness(.32) saturate(.9)` + 径向遮罩，opacity .8）+ 网格（60px/12px 两级，α .05）+ 扫描线 + 噪点。
- 主色只允许：白（文字）、`--m-moss`（红眼/刻度/进度）、`--m-plasma`（数据线）、`--m-steel-3`（次要文本）。
- IRIS 圆窗：`clip-path: circle()` 或 `mask` + 内外双层 1px 环 + 刻度；红眼视频 `filter: contrast(1.08) saturate(1.15)`，圆窗外缘 40px 红光 `box-shadow`。
- 中文引文用小字（12px，`--m-steel-2`），不抢大字幕。
- 字体：标题/数字用 `--m-font-mono`；中文短句用宿主字体栈。

### 5.3 交接（与皮肤衔接）

`splash.js` 结束前：`html.classList.add('dsh-moss-enter')` → ambient 900ms 淡入、侧栏/顶栏/输入卡 0–900ms 分时显影（`animation-fill-mode:both`）→ 1300ms 移除该 class。若无启动动画（关闭/已显示过），client.js 在首帧后直接播放同一段 `enter` 收束，保证加载不「硬切」。

## 6. HUD 细节规范（client.js + skin.css）

> 宿主事实已核（DSH 0.2.2-rc.1，见 `docs/host-map.md`）：
> - `#root header[data-window-drag]` **存在且可用**：conversation 包的 `ConversationHeader` 运行时渲染
>   `<header class="…_header" data-window-drag>`（空态带 `…_headerBlank`），内部 `headerLeading` + `titleRow`/`conversation.session.header`。
> - Windows 自定义标题栏：`html[data-windows-titlebar]` 存在时，`.mP3x-q_frame{padding-top:var(--dsh-windows-titlebar-height)}`，
>   拖拽条是 `.mP3x-q_frame:before`（高 `var(--dsh-windows-titlebar-height)`，底色 `--dsw-specific-sidebar-fill`）；
>   该高度是**运行时写在 html 行内样式上的 CSS 变量**，禁止写死像素。
> - 宿主自带 boot 画面 `[data-dsh-boot]`（"Loading plugins…"）在 `#root` 内，被启动层（z-index 2147483000）覆盖。
> - `addMenu` 类名已不存在；弹窗为 `role="dialog"` + `[class*="_dialog" i]`，遮罩 `[class*="_mask" i]`；无原生 `<dialog>`。

| 位置 | glass 档 | immersive 档 |
|---|---|---|
| 顶栏 `#root header[data-window-drag]` | `position:relative` 后 `::after` 遥测章：红点 + `550W · MOSS ｜ <clock> ｜ 系统在线`（等宽 10px，`content: var(--moss-clock, "--:--:--")`），右侧留 ≥150px 避让窗口按钮，≤1100px 宽隐藏 | 同左 + 顶部 1px 渐变线 + 四角括号 |
| Windows 标题条 `[data-windows-titlebar] .mP3x-q_frame:before` | 半透明玻璃、下方 1px `--m-line`；不得遮挡拖拽（`pointer-events:none` 由宿主保证，只做背景） | 同左 + 右侧遥测章若顶栏被标题条盖住则改挂此层 |
| 应用四角 | 无 | 四角 24px L 括号（`html::before/::after` 或 `#root::before`） |
| 侧栏 `[class*="sidebarCol" i]` | 右缘 1px 线 | 右缘 + 左侧微刻线尺 + 底部 `MOSS // WATCHING` |
| 当前会话行 `[role="treeitem"][aria-selected="true"]` | 左缘 2px 红刻线 + 4% 红晕 | 同左 + 行尾状态点 |
| 输入卡 `[data-composer-card]` | 四角括号（红，α .5）+ focus 时扫描线 | 同左 + 声呐环 |
| 当前 tab `[role="tab"][aria-selected="true"]` | 2px 等离子底线 | 同左 + 底部光晕 |
| 代码块 `.md-code-block` | 左缘 2px 等离子轨 | 同左 + 角标 `SYS` |
| 空态 `conversation.hero.*` | 无 | 红眼水印（α .08）+ 引文 |
| 菜单/弹窗 | 半透明 + 1px 描边（`--dsw-specific-menu` 接管） | 同左 + 角括号 |

所有伪元素 `pointer-events:none`；不得遮挡可点击区域（`z-index` 与宿主浮层分离）。

## 7. 可读性与性能红线（验收项）

1. 正文（14px）在**最亮视频帧 + 当前 veil** 合成后的玻璃上对比度 ≥ **4.5:1**；二级文字 ≥ 4.5:1；装饰文字不做正文用。<br>验收：用 `earth-poster` 最亮区做背景色合成计算，并把结果写入 README「对比度实测」表。
2. 合成层（`will-change`/`filter`/`backdrop-filter`/`transform`）峰值 ≤ **6 层**。
3. 常驻动画 ≤ **4 个**（视频解码不算层）：扫描线、状态灯、刻线尺位移、环境 rim 呼吸；`immersive` 也不得超过。
4. 首屏：splash 首帧 ≤ 120ms 可见（纯 CSS/SVG，无网络依赖）；视频不阻塞首帧。
5. 空闲时 CPU：视频暂停 + CSS 动画暂停后，无 rAF 轮询（`document.hidden` 时定时器全部挂起）。
6. 内存：≤ 1 个视频元素常驻（按画质切换时不叠加第二个）。

## 8. 配置 schema（`~/.dsh/dsh-startup-moss2.json`）

| key | 类型 | 默认 | 说明 |
|---|---|---|---|
| `enabled` | bool | `true` | 启动动画开关 |
| `mode` | enum | `session` | `session` 每会话一次 / `daily` 每天一次 / `always` 每次 |
| `skin` | enum | `glass` | `off` / `glass` / `immersive` |
| `quality` | enum | `standard` | `high`(1080) / `standard`(720) / `saver`(仅海报) |
| `veil` | 0–100 | `58` | 背景压暗强度，越大越实 |
| `blur` | 0–40 | `16` | 玻璃模糊 px |
| `hud` | enum | `normal` | `off` / `normal` / `full` |
| `sound` | bool | `true` | 启动音 |
| `volume` | 0–100 | `50` | 启动音音量 |
| `allowSkip` | bool | `true` | Esc 跳过 |
| `reducedMotion` | bool | `false` | 减弱动态 |

配置走插件自带 HTTP API `/dsh-moss2/config`，原子写文件；设置页与 splash 共用同一份。字段在 `lib/index.js`、`lib/client.js`、`lib/splash.js` 三处必须一致（smoke 测试断言）。

## 9. 交付物清单

```
package.json  cordis.patch.yml  README.md  INSTALL.md  CHANGELOG.md  LICENSE  icon.svg
locale/zh.json  locale/en.json
lib/index.js  lib/client.js  lib/skin.css  lib/splash.js  lib/splash.css
lib/assets/**（§3）
preview/index.html（皮肤+启动可视化预览，可离线打开）
docs/design-spec.md（本文）  docs/host-map.md  docs/assets-report.md  docs/verify/**
test/smoke-host.mjs  test/smoke-client.mjs  test/smoke-splash.mjs  test/smoke-assets.mjs
releases/dsh-startup-moss2-0.1.0.tgz
```

## 10. 验收（全部通过才算完成）

- [ ] 静态：`npm test` 全绿（host 路由 / config 归一化 / CSS 解析与选择器自检 / 资产存在与体积 / 三处字段一致）
- [ ] 宿主：`html.dsh-moss-skin` 生效后 `#root` 下所有主要表面为半透明玻璃；`getComputedStyle` 抽验 ≥6 个代表元素
- [ ] 背景：动态视频在播放（`video.readyState ≥ 3` 且 `paused === false`），off 档不加载视频
- [ ] 启动：完整播完 8.2s 自动交接；Esc 跳过正常；视频缺失时海报兜底
- [ ] 降级：reduced-motion / saver / noblur 三态各截图对比
- [ ] 可读性：对比度表 ≥ 4.5:1；最亮帧截图目检正文清晰
- [ ] 实机：安装进 desktop profile 后真实窗口截图（含空态与会话态各一张）
- [ ] 未验证项清单随交付（不许标 ✅）

## 11. 边界

- 素材为 Wallpaper Engine 第三方素材：**仅本机自用，不发布公共 registry、不二次分发**；对外只发自有代码与 OFL 字体。
- 不与上一代 `dsh-startup-moss` / `dsh-startup-vyron` / `dsh-startup-elisa` 同时启用（同一个 profile 只允许一个启动/皮肤插件）。
- 浅色宿主一律强制深色驾驶舱（这是皮肤设定，不是缺陷）。

## 12. 变更记录

| 日期 | 版本 | 变更 | 触发 |
|---|---|---|---|
| 2026-11-06 | v1.0 | 首版：定位/调色板/契约/三档/启动时间线/验收 | 用户需求「MOSS 主题 + 动态视频背景」 |
