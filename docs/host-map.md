# DSH 0.2.2-rc.1 宿主测绘（皮肤 / 启动动画接入点）

> **实测对象**：`E:\dsh\resources\app.asar`（`@deepseek-ai/dsh-desktop` 0.2.2-rc.1，`dshBuildCommit=c59d10aff167ad7eefead4b3a9082fb57c8fbfe8`）。
> **可复跑断言**：`node _ref/host/assert-host.mjs --md > docs/verify/host-assertions.md`（当前 **60 PASS / 0 FAIL**，asar sha256 见该报告）。
> **提取物**：`_ref/host/`（14 个包源码 + 2 个 shell 资源 + Electron `lib/`）、`_ref/host/css/`（CSS 字符串解码产物 + prettify 版）、`_ref/ui-theme/`。
> **口径**：所有 `文件:行号` 都指 **asar 内原始文件**；`SHELL_CSS` 因原文是单行 minified，行号指 prettify 版 `_ref/host/css/shell.index.css.txt`（并标注原始行 1）。

**简写（除 Electron 外均在 `dsh/node_modules/@deepseek-ai/` 下）**

| 简写 | 真实路径 |
|---|---|
| `THEME` | `dsh-client-ui-theme/lib/client.js` |
| `LAYOUT` | `dsh-client-ui-layout/lib/client.js` |
| `CONV` | `dsh-client-ui-conversation/lib/client.js` |
| `CHAT` | `dsh-client-ui-chat/lib/client.js` |
| `SIDEBAR` | `dsh-client-ui-sidebar/lib/client.js` |
| `WS` | `dsh-client-ui-workspace/lib/client.js` |
| `PM` | `dsh-client-ui-plugin-manager/lib/client.js` |
| `RENDERER` | `dsh-client-ui-renderer/lib/client.js` |
| `SHELL_JS` | `dsh-web-frontend/dist/assets/index-BgUyXZcc.js` |
| `SHELL_CSS` | `dsh-web-frontend/dist/assets/index-lh_YM6sT.css`（prettify 行号） |
| `WSRV` | `dsh-host-webserver/lib/index.js` |
| `CONN` | `dsh-client-connection/lib/index.js` |
| `MODS` | `dsh-client-modules/lib/client.js` |
| `PRELOAD` | Electron `lib/preload-app.cjs` |
| `MAIN` | Electron `lib/main.js` |

---

## 0. 最小可用集（皮肤作者只看这一节就够）

### 0.1 作用域与主题开关

| 用途 | 写法 | 依据 |
|---|---|---|
| 皮肤作用域 | `html.dsh-<skin>`（自己加的 class；宿主不占用 `html` class） | — |
| 深色宿主 | `body[data-ds-dark-theme]`（属性在 **body**，不是 html） | LAYOUT:614-620（`ThemePresenter.apply`：`body.setAttribute("data-ds-dark-theme","")`） |
| 浅色宿主 | `body:not([data-ds-dark-theme])` | 同上 |
| 主题来源（含 system） | `html[data-ds-theme-source="light|dark|system"]` | LAYOUT:617 |
| 平台 | `html[data-platform="win32|darwin"]`（**仅 Electron preload 写**，Web 浏览器无此属性） | PRELOAD:57 |
| Windows 顶栏 | `html[data-windows-titlebar]`（仅 win32 Electron） | PRELOAD:1664 |
| 全屏 | `html[data-fullscreen]`（仅 win32/darwin） | PRELOAD:72 |
| 输入模态 | `html[data-input-modality="pointer"]` | THEME 侧 focus.css（`SHELL_CSS` 中含该规则）、PRELOAD:1557 |

### 0.2 必须覆盖的 token（不覆盖 = 视频被挡住）

| token | light 默认 | dark 默认 | 谁在用它画 |
|---|---|---|---|
| `--dsw-alias-bg-base` | `var(--dsw-static-neutral-bluish-00)` (#fff) | `...-bluish-950` | body 背景、AppFrame、bottomRow、conversation 根、composerSeat 渐变 |
| `--dsw-alias-bg-layer-1` | bluish-00 | bluish-875 | 面板/卡片底（多数 popover、helper） |
| `--dsw-alias-bg-layer-2` | bluish-00 | bluish-850 | 对话框、浮层 |
| `--dsw-alias-bg-layer-3` | bluish-00 | bluish-800 | 输入条内部、指示器 |
| `--dsw-alias-bg-overlay` | bluish-150 | bluish-700 | 覆盖层 |
| `--dsw-alias-bg-module-platform` | bluish-60 | bluish-800 | 平台模块条（tab 条、选择器） |
| `--dsw-specific-sidebar-fill` | bluish-50 | bluish-900 | **侧栏整列 + Windows 原生标题栏颜色** |
| `--dsw-specific-input-major` | bluish-00 | bluish-850 | **输入卡底** |
| `--dsw-specific-menu` | `var(--dsw-menu-surface-fill)`；darwin 覆盖 `#f8f9faf0` | `#303136a3`；darwin `#303136f0` | 菜单/浮层 |
| `--dsw-menu-surface-fill` | `#fcfdfeb3` | `#303136a3` | 右键上下文菜单材质 |
| `--dsw-alias-bg-mask-1/2/3` | `#0000003d / #0000001f / #0000007a` | `#00000080 / #0003 / #0000007a` | 弹窗遮罩、抽屉遮罩 |

> 完整 440 个 token（含 light+dark 双值、声明行）见 `_ref/host/css/tokens-table.md`。
> **不要**改 82 个 `--dsw-static-*`（调色板基色）：它们是 alias 的取值来源，改了等于重定义整套配色且没有语义收益。

### 0.3 必须"拆掉"的 7 个绘制面（详见 §3）

```css
/* 1) 文档画布 */            body { background: transparent }        /* SHELL_CSS:4168-4173 原为 bg-base */
/* 2) 应用框架 */            [class*="frame" i]  ← .mP3x-q_frame    /* LAYOUT:74 原为 bg-base */
/* 3) 侧栏列 */             .mP3x-q_sidebarCol /* specific-sidebar-fill */  LAYOUT:74
/* 4) 侧栏根 */             [class*="sidebarCol" i] > * 内的侧栏根 .wtg9ga_root /* SIDEBAR:116 亦画 sidebar-fill */
/* 5) 会话根 */             .an3WzG_root /* bg-base */               CONV:20057
/* 6) 输入卡 */             [data-composer-card] /* specific-input-major */  CONV:21701
/* 7) 输入卡上方渐变遮罩 */  [data-composer-seat] /* 激活态 sticky 渐变吃 bg-base */ CONV:20057
```

Windows 额外：`[data-windows-titlebar] .mP3x-q_frame` 与 `.mP3x-q_frame:before` 用 `--dsw-specific-sidebar-fill` 画顶条（LAYOUT:74），必须一起改；`.mP3x-q_centerCol` 在 Windows 下也画 `bg-base`（LAYOUT:74）。macOS 下 `html[data-platform=darwin] body{background:transparent}` 且 `.mP3x-q_frame{background:0 0}`（SHELL_CSS:4176 / LAYOUT:74）——已天然透明，但启用了 `vibrancy:"sidebar"`。

### 0.4 稳定语义钩子（PASS 的最小集，全部有行号见 §4）

`header[data-window-drag]`、`[class*="sidebarCol" i]`、`[data-composer-card]`、`[data-composer-seat]`、`[data-conversation-scroll]`、`[role="tab"][aria-selected]`、`[role="treeitem"][aria-selected]`、`[aria-current="page"]`、`[role="dialog"]` / `[class*="_dialog" i]` / `[class*="_mask" i]`、`.md-code-block`、`[role="menu"]`、`[class*="viewsMoreMenu" i]` / `[class*="moreMenu" i]` / `[class*="addMenu" i]`、`[data-slot]`、`[data-shell-overlay]`。

---

## 1. 宿主身份与提取物

| 项 | 值 | 依据 |
|---|---|---|
| Desktop 包 | `@deepseek-ai/dsh-desktop@0.2.2-rc.1` | asar 根 `package.json` |
| Electron 入口 | `lib/main.js`；preload：`preload-app.cjs` / `preload-welcome.cjs` / `preload-mandatory.cjs` / `preload-update-dialog.cjs` / `preload-platform-account.cjs` | asar 根 `package.json` `main` + `lib/*` |
| Web 前端 | `dsh-web-frontend@0.2.2-rc.1`（Vite 构建：`dist/index.html` + `assets/index-*.js/.css`） | `dsh-web-frontend/dist/index.html` |
| UI 包数量 | `@deepseek-ai/dsh-client-ui-*` 68 个（全部 `client.js` 走同一模块加载契约） | `_ref/host/scan-hooks.tsv`（436 个 client/index 文件全扫） |
| 主题包 | `dsh-client-ui-theme`（8 张 CSS 表，编译后作为 JS 字符串注入 `<style data-plugin-css>`） | THEME:1464-1485；注入模式见 LAYOUT:76-82 |

**本测绘生成的提取物**

| 路径 | 内容 |
|---|---|
| `_ref/host/dsh/node_modules/@deepseek-ai/<pkg>/` | layout / conversation / sidebar / chat / workspace / settings / settings-shell / renderer / modules / plugin-manager / settings-account / host-webserver / web / web-app / desktop-host / client-connection |
| `_ref/host/dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/` | index.html + 全量 assets |
| `_ref/host/electron/lib/` | Electron 主进程与 5 个 preload |
| `_ref/ui-theme/` | ui-theme 源码 + README（token 权威源） |
| `_ref/host/css/*.txt` | 从 JS 字符串解码出的 CSS（37 个文件）+ `shell.index.css.txt` / `shell.vendor.css.txt` prettify 版 |
| `_ref/host/css/tokens.tsv` / `tokens.rules.tsv` | 800 条 token 声明 / 17199 条 CSS 规则的结构化表 |
| `_ref/host/css/tokens-table.md` | **440 token 全量表（light/dark + 声明行 + 非 body 覆盖附录）** |
| `_ref/host/scan-hooks.tsv` | 全 asar 436 文件的钩子扫描结果 |
| `_ref/host/assert-host.mjs` | 60 条可复跑宿主断言 |
| `docs/verify/host-assertions.md` | 断言报告（生成时间 + asar sha256 + 逐条证据） |
| `_tools/extract-css.mjs` / `parse-tokens.mjs` / `build-token-table.mjs` / `prettify.mjs` / `grep-asar.mjs` | 提取/解析工具链 |

---

## 2. Token 全量表

### 2.1 规模与声明点

| 分组 | 数量 | 声明点 | 依据 |
|---|---|---|---|
| `--dsw-alias-*` 语义 | **114** | `body{...}` / `body[data-ds-dark-theme]{...}` | THEME:1470（同一个 CSS 字符串内两组块） |
| `--dsw-specific-*` 组件专用 | **10** | 同上 | THEME:1470 |
| `--dsw-static-*` 调色板 | **82** | `body{...}`（dark 不重定义） | THEME:1470 |
| `--dsw-font-*` 排版 | 182 | `body` | THEME:1470/1482 |
| `--dsw-radius-*` | 6（`xs 4 / sm 8 / md 12 / lg 16 / xl 20 / panel 28` px） | `:root` | THEME:1464 |
| `--dsw-shadow-*` / `--dsw-elevation-*` | 9 | `body` / `body,body *` | THEME:1482 |
| `--dsw-linear-*` / `--dsw-gradient-*` | 5 | `body` | THEME:1476/1482 |
| 其它 `--dsw-*`（mask-blur/menu-backdrop-filter/corner-shape/focus-ring） | 5 | `body` / `:root` / `@supports` | THEME:1467/1470/1482 |
| `--dsh-*` 宿主布局变量 | 11 | 各组件 | 见 §2.4 |
| 其它 | 16 | — | — |
| **合计** | **440**（dark 覆盖 215，其余 225 沿用 light 或为常量） | | `_ref/host/css/tokens-table.md` |

其它与皮肤相关的常量：`--dsw-font-family`（默认系统栈）、`--dsw-font-family-brand:"Montserrat"`、`--ds-font-family-code`、`--ds-ease-in-out:cubic-bezier(.4,0,.2,1)`、`--ds-transition-duration:.2s / fast .1s / slow .3s`、`--dsh-hairline-width`（按 DPR 计算的 0.5px 边框，由 ui-theme 样式安装器写在根上）。

> **重要副作用**：`ThemePresenter.apply` 会把「当前主题的 tokens」以 **inline style** 写到 `body`（LAYOUT:627-632），并把字号/字体族也写成 inline（LAYOUT:621-626）。内置 light/dark 的 `tokens` 为空，所以只有注册的第三方主题会 inline 覆盖；皮肤若用 `ctx.theme.register`（见 §6.5）拿到的 token 覆盖优先级最高，纯 CSS 覆盖则需要考虑 `body` inline 竞争。

### 2.2 语义层核心（40 条，完整表见 tokens-table.md）

| token | light | dark |
|---|---|---|
| `--dsw-alias-bg-base` | `var(--dsw-static-neutral-bluish-00)` `#fff` | `...-bluish-950` |
| `--dsw-alias-bg-layer-1` | `-bluish-00` | `-bluish-875` |
| `--dsw-alias-bg-layer-2` | `-bluish-00` | `-bluish-850` |
| `--dsw-alias-bg-layer-3` | `-bluish-00` | `-bluish-800` |
| `--dsw-alias-bg-overlay` | `-bluish-150` | `-bluish-700` |
| `--dsw-alias-bg-module-platform` | `-bluish-60` | `-bluish-800` |
| `--dsw-alias-bg-mask-1` | `#0000003d` | `#00000080` |
| `--dsw-alias-bg-mask-2` | `#0000001f` | `#0003` |
| `--dsw-alias-bg-mask-3` | `#0000007a` | `#0000007a` |
| `--dsw-alias-bg-skeleton` | `#0000000a` | `#ffffff14` |
| `--dsw-alias-label-primary` | `-bluish-1000` (`#0f1115`) | `-bluish-50` |
| `--dsw-alias-label-secondary` | `-bluish-700` | `-bluish-300` |
| `--dsw-alias-label-tertiary` | `-bluish-600` | `-bluish-400` |
| `--dsw-alias-label-caption` | `-bluish-400` | `-bluish-600` |
| `--dsw-alias-label-dimmed` | `-bluish-200` | `-bluish-750` |
| `--dsw-alias-brand-primary` | `-bluish-1000`（近黑） | `-bluish-50`（近白） |
| `--dsw-alias-brand-primary-new-colorprimary-new-color` | `#4176e6` | `var(--dsw-static-deepseek-450)` |
| `--dsw-alias-state-business-primary` | `-deepseek-500` | `-deepseek-400` |
| `--dsw-alias-state-success-primary` | `-green-500` | `-green-500` |
| `--dsw-alias-state-error-primary` | `-red-600` | `-red-400` |
| `--dsw-alias-state-warn-primary` | `-amber-500` | `-amber-500` |
| `--dsw-alias-state-done-primary` | `-violet-600` | `-violet-400` |
| `--dsw-alias-border-l1..l4` | `#0000000a / 1a / 1f / 29` | `#ffffff0f / 1f / 29 / 33` |
| `--dsw-alias-interactive-bg-hover` | （见完整表） | （见完整表） |
| `--dsw-alias-scrollbar-bg-l1/l2`、`-hover-l1/l2` | 见完整表 | 见完整表 |
| `--dsw-alias-markdown-code-block` | 见完整表 | 见完整表 |
| `--dsw-alias-menu-group-header-fill` | `#f8f9faf0` | `#303136f0` |
| `--dsw-alias-settings-card-fill/stroke` | `= bg-layer-2 / border-l4`（定义在 THEME:1464 的第二个 `body` 块） | 同 |

`--dsw-specific-*`（10 条全量）：

| token | light | dark |
|---|---|---|
| `--dsw-specific-bubble` | `-deepseek-50` | `-bluish-850` |
| `--dsw-specific-bubble-highlight` | `-deepseek-200` | `-bluish-750` |
| `--dsw-specific-input-major` | `-bluish-00` | `-bluish-850` |
| `--dsw-specific-login-input` | `-bluish-50` | `-bluish-900` |
| `--dsw-specific-menu` | `var(--dsw-menu-surface-fill)` → `#fcfdfeb3`；**darwin** `#f8f9faf0` | `#303136a3`；**darwin** `#303136f0` |
| `--dsw-specific-selector` | `-bluish-60` | `-bluish-800` |
| `--dsw-specific-sidebar-fill` | `-bluish-50` | `-bluish-900` |
| `--dsw-specific-sidebar-nav-item-active` | `-bluish-100` | `-bluish-750` |
| `--dsw-specific-sidebar-nav-item-active-accent` | `-deepseek-100` | `-bluish-800` |
| `--dsw-specific-tip` | `-bluish-60` | `-bluish-800` |

### 2.3 Token 陷阱（实测）

1. **`--dsw-alias-bg-layer-4` 不存在**：`SHELL_CSS`（helpButton hover）与 `LAYOUT` 有 `var(--dsw-alias-bg-layer-4)` 引用，但主题只定义 1–3 → 该值解析为空（透明）。断言 T10 负向验证。
2. **`--dsw-unstable-*`**：主题表里有 `--dsw-unstable-*` 命名空间（见完整表「其余 --dsw-*」组），皮肤不要依赖。
3. **菜单双 token**：共享菜单用 `--dsw-menu-surface-fill`（+ `--dsw-menu-backdrop-filter`），其它浮层用 `--dsw-specific-menu`；ui-theme README:55 明确要求「platform code must preserve those token values」。见 §9.3。
4. **darwin 专属覆盖**：`html[data-platform=darwin] body{--dsw-specific-menu:#f8f9faf0}` / `...body[data-ds-dark-theme]{#303136f0}`（THEME:1470）——Windows 走 `--dsw-menu-surface-fill`（带 alpha），mac 走近不透明 hex。
5. **`--dsh-font-family-text` / `-code` / `-terminal` 由 ThemePresenter 写成 body inline style**（LAYOUT:622-626），皮肤改字体栈要压 `!important` 或走主题 API。

### 2.4 与布局直接相关的 `--dsh-*` 变量（全部有声明点）

| 变量 | 值 | 声明点 |
|---|---|---|
| `--dsh-frame-top-clearance` | `48px`（darwin）/ `var(--dsh-windows-titlebar-height)`（win） | LAYOUT:74 |
| `--dsh-frame-chrome-top` | `var(--dsh-windows-titlebar-height)`（win），全屏 `0px` | LAYOUT:74 |
| `--dsh-frame-overlay-top` | `calc(top-clearance + 20px)`，全屏 `20px` | LAYOUT:74 |
| `--dsh-frame-leading-clearance` | 84 / 160px（依抽屉/收起/darwin） | LAYOUT:74 |
| `--dsh-windows-titlebar-height` | **`40px`，preload 写在 `html.style` 行内** | PRELOAD:1665 |
| `--dsh-windows-content-radius` | `16px` | LAYOUT:74 |
| `--dsh-windows-menu-start` | fallback `48px`（PRELOAD:1547 `left:var(--dsh-windows-menu-start,48px)`）；`html[data-windows-titlebar]:has([data-sidebar-collapsed=true])` 时 `84px`（见 tokens-table 附录） | PRELOAD:1547 + `_ref/host/css/tokens-table.md` |
| `--dsh-composer-side-clearance` | `16px`（embedded `8px`） | CONV:20057 |
| `--dsh-composer-card-max-width` | `calc(var(--dsh-chat-content-width)+32px)` | CONV:20057 |
| `--dsh-composer-stack-gap` / `-dock-inset` / `-text-max-height` | 6 / 8 / 336px | CONV:20057 |
| `--dsh-sidebar-inline-padding` / `-row-padding` / `-label-gap` / `-paint-inset` | 8 / 12 / 6 / 3 px | SIDEBAR:116 |
| `--dsh-hairline-width` | 按 DPR 计算的 0.5px | ui-theme README:64 |

---

## 3. 绘制层：谁真正画底色

### 3.1 DOM 与绘制树

```
body[data-ds-dark-theme?]                       ← 画 bg-base（SHELL_CSS:4168-4173）
└─ #root                                        ← html,body,#root{height:100%;margin:0}（SHELL_CSS:4164）
   └─ 根槽位锚点（`div[data-slot="root"]`，`display:contents`；RENDERER:1124/1857。若 shell 直接挂载则该层不存在——见 U11）
      └─ .mP3x-q_frame                          ← 画 bg-base（LAYOUT:74）；Windows 改画 sidebar-fill
         ├─ .mP3x-q_sidebarCol                  ← 画 specific-sidebar-fill（LAYOUT:74）
         │  └─ .wtg9ga_root                     ← 再画一次 specific-sidebar-fill（SIDEBAR:116；darwin 透明）
         ├─ .mP3x-q_centerCol                   ← 默认不画；Windows/darwin 画 bg-base（LAYOUT:74）
         │  └─ .an3WzG_root                     ← 画 bg-base（CONV:20057）
         │     ├─ header.an3WzG_header          ← 不画底，只有 border-bottom（CONV:20057）
         │     ├─ .an3WzG_body                  ← 不画底
         │     │  └─ [data-composer-seat]       ← 激活态 sticky + 渐变遮罩（吃 bg-base，CONV:20057）
         │     └─ .GRgSLq_root > [data-composer-card]  ← 画 specific-input-major + elevation-soft（CONV:21701）
         ├─ .mP3x-q_rightbarCol                 ← darwin 画 bg-base（LAYOUT:74）
         ├─ .mP3x-q_bottomRow [data-shell-bottom] ← 画 bg-base（LAYOUT:74）
         ├─ .mP3x-q_overlayLayer [data-shell-overlay] ← z-index:20，不画底（LAYOUT:74 / JSX LAYOUT:401-405）
         └─ .mP3x-q_leadingSeat [data-shell-leading] ← 不画底（JSX LAYOUT:406-411）
```

### 3.2 逐条规则（原文 + 来源）

| # | 选择器 | 规则原文（关键部分） | 来源 |
|---|---|---|---|
| P1 | `html,body,#root` | `height:100%;margin:0` | `SHELL_CSS:4164`（原文行 1） |
| P2 | `body` | `font-family:var(--dsw-font-family,...); color:var(--dsw-alias-label-primary,#0f1115); background:var(--dsw-alias-bg-base,#fff); text-autospace:normal` | `SHELL_CSS:4168-4175` |
| P3 | `html[data-platform=darwin],html[data-platform=darwin] body` | `background:transparent` | `SHELL_CSS:4176-4178` |
| P4 | `html[data-platform=darwin] body` | `isolation:isolate` | `SHELL_CSS:4179-4181` |
| P5 | `html[data-platform=darwin] [data-window-drag]` | `-webkit-app-region:drag` | `SHELL_CSS:4182-4184` |
| P6 | `html[data-platform=darwin] [data-window-drag-recall]` | `-webkit-app-region:no-drag` | `SHELL_CSS:4185-4187` |
| P7 | `.mP3x-q_frame` | `box-sizing:border-box;background:var(--dsw-alias-bg-base);grid-template-rows:minmax(0,1fr) auto;height:100%;display:grid;position:relative;overflow:hidden` | LAYOUT:74 |
| P8 | `[data-windows-titlebar] .mP3x-q_frame` | `--dsh-windows-content-radius:16px;box-sizing:border-box;padding-top:var(--dsh-windows-titlebar-height);background:var(--dsw-specific-sidebar-fill)` | LAYOUT:74 |
| P9 | `[data-windows-titlebar] .mP3x-q_frame:before` | `content:"";height:var(--dsh-windows-titlebar-height);background:var(--dsw-specific-sidebar-fill);-webkit-app-region:drag;position:absolute;inset:0 0 auto` | LAYOUT:74 |
| P10 | `.mP3x-q_sidebarCol` | `background:var(--dsw-specific-sidebar-fill);border-right:.5px solid var(--dsw-alias-border-l3);grid-area:1/1;min-width:0;overflow:hidden` | LAYOUT:74 |
| P11 | `[data-platform=darwin] .mP3x-q_frame:not([data-sidebar-drawer]) .mP3x-q_sidebarCol` | `background:linear-gradient(...#7a9bf01a...), color-mix(...sidebar-fill 97%, #7a9bf0) 40%, transparent)`（darwin 玻璃） | LAYOUT:74 |
| P12 | `.mP3x-q_centerCol` | `flex-direction:column;grid-area:1/2;min-width:0;display:flex;overflow:hidden`（**无背景**） | LAYOUT:74 |
| P13 | `[data-platform=darwin] .mP3x-q_centerCol` / `[data-windows-titlebar] .mP3x-q_centerCol` | `background:var(--dsw-alias-bg-base)`（win 另加圆角 16px 左上） | LAYOUT:74 |
| P14 | `.mP3x-q_bottomRow` | `background:var(--dsw-alias-bg-base);grid-column:1/-1;overflow:auto` | LAYOUT:74 |
| P15 | `.mP3x-q_drawerMask` | `background:var(--dsw-alias-bg-mask-1);backdrop-filter:var(--dsw-mask-blur)` | LAYOUT:74 |
| P16 | `.mP3x-q_overlayLayer` | `z-index:20;pointer-events:none;position:absolute;inset:0` + `>*{pointer-events:auto}` | LAYOUT:74 |
| P17 | `.wtg9ga_root`（侧栏根） | `background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);height:100%;padding:6px var(--dsh-sidebar-inline-padding)` | SIDEBAR:116 |
| P18 | `[data-platform=darwin] .wtg9ga_root` | `background:0 0` | SIDEBAR:116 |
| P19 | `.an3WzG_root` | `background:var(--dsw-alias-bg-base);height:100%;display:flex;position:relative` | CONV:20057 |
| P20 | `.an3WzG_root[data-phase=active] .an3WzG_composerSeat`（含 embeddedBody） | `z-index:9;will-change:transform;overflow-anchor:none;background:linear-gradient(180deg, color-mix(in srgb, var(--dsw-alias-bg-base) 0%, transparent) 0px, var(--dsw-alias-bg-base) 36px);margin-top:auto;position:sticky;bottom:0` | CONV:20057 |
| P21 | `.GRgSLq_card`（= `[data-composer-card]`） | `box-sizing:border-box;width:100%;max-width:var(--dsh-composer-card-max-width);--dsw-elevation-stroke-color:var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-panel);background:var(--dsw-specific-input-major);box-shadow:var(--dsw-elevation-soft);...;display:flex;position:relative` | CONV:21701 |
| P22 | `.V68kMG_row` / `.-TO4SG_row`（回放/日志行）等 | 不逐一列，见 `_ref/host/css/tokens.rules.tsv` | 各包 |

> **`--dsw-elevation-*` 是"描边+阴影"复合值**：`--dsw-elevation-stroke:0 0 0 .5px var(--dsw-elevation-stroke-color)`、`panel/prominent/soft` 均以其为首项（THEME:1482）。皮肤想彻底透明化必须连 `box-shadow` 一起清（`box-shadow:none`），否则会留下 0.5px 描边。

### 3.3 会挡住视频的"隐形遮罩"清单（易漏）

1. `[data-composer-seat]` 激活态渐变（P20）— 输入卡上方的 36px 不透明带。
2. `.mP3x-q_drawerMask`（P15）— 移动端/抽屉模式遮罩，`backdrop-filter:var(--dsw-mask-blur)`（当前 `none`，但 token 可被皮肤/主题改）。
3. 菜单材质 `backdrop-filter: blur(40px) saturate(150%)`（THEME:1482）— 在视频背景上会"糊一块"，需要重设。
4. `_boot_*` 启动层（§7.3）— 首屏期间铺满 `bg-base`。
5. `--dsw-alias-bg-mask-1..3` 系列（对话框遮罩、同屏遮罩）。

---

## 4. 选择器 PASS/FAIL 表（逐条证据）

| # | 选择器 | 结论 | 证据（asar 内） | 备注 / 建议用法 |
|---|---|---|---|---|
| S1 | `#root header[data-window-drag]` | **PASS** | CONV:20638-20646 `ConversationHeader` → `jsxs("header",{className:clsx(ConversationRoot_module_css_default.header,...),"data-window-drag":true,children:[div.headerLeading, titleRow/slot]})` | 由 conversation 包**运行时渲染**，静态 shell 里 grep 不到。另有 PM:7082/7109（`moreHead`/`pageHead`）、settings-account:1340（PlatformOverlay header）同类。**Windows 下 `-webkit-app-region:drag` 规则只在 darwin 生效（SHELL_CSS:4182）**，拖拽靠原生 titleBarOverlay |
| S2 | `[class*="sidebarCol" i]` | **PASS** | LAYOUT:74 CSS `.mP3x-q_sidebarCol`；class map LAYOUT:93 `"sidebarCol":"mP3x-q_sidebarCol"` | 哈希前缀会变，只用语义后缀匹配 |
| S3 | `[data-composer-card]` | **PASS** | CONV:22018 `div[tabIndex=-1].clsx(InputBar.card,…),"data-composer-card":true` | 见 §9.2 |
| S4 | `[data-composer-seat]` | **PASS** | CONV:20595 `div.clsx(composerSeat), "data-composer-seat":"", "data-conversation-region":"composer"` | 还会出现 `[data-conversation-region="composer"]` |
| S5 | `[data-conversation-scroll]` | **PASS** | CONV:20198 / 20608 / 21311；CHAT:207（CSS 选择器）、CHAT:828（`closest()` 查询） | 宿主自己也在用，稳定 |
| S6 | `[role="tablist"] [role="tab"][aria-selected]` | **PASS** | SHELL_JS:132（segmented tabs：`role:"tab","aria-selected":…`）、SHELL_JS:194（dockkit `role:"tablist"` strip） | Conversation view tabs 也走同一套 |
| S7 | `[role="treeitem"][aria-selected]` | **PASS** | WS:2452 / WS:2563 `role:"treeitem","aria-selected":selected` | 会话列表行 |
| S8 | `[aria-current]` | **PASS** | SIDEBAR:216 `"aria-current": active ? "page" : void 0`；SHELL_JS:132（菜单项也写 `"page"`） | 值固定 `"page"`；建议同时兼容 `[aria-current="true"]` |
| S9 | `dialog`（原生元素） | **FAIL** | 全 asar 436 个 client/assets 扫描无 `<dialog` 字面量 | 用 S9' 替代 |
| S9' | `[role="dialog"]` / `[role="alertdialog"]` | **PASS** | SHELL_JS:132 `role:"dialog","aria-modal":"true"`；SHELL_JS:168 同上；aria 规则见 SHELL_CSS:4191 | 弹窗都是 div+role |
| S10 | `[class*="_dialog" i]` | **PASS** | `_dialog_14mp3_33`（SHELL_JS:123 class map）；多处包内也有（CHAT:8891 等） | 哈希会变，只用 `[class*="_dialog" i]` |
| S11 | `[class*="_mask" i]` | **PASS** | `_mask_14mp3_18`（SHELL_JS:123）、`_mask_19zw2_19`（SHELL_JS:132） | 同上 |
| S12 | `.md-code-block` | **PASS** | SHELL_JS:168 `className:de(Un.block,"md-code-block",…)`；SHELL_CSS:2805 代码块样式 | 非哈希全局类，最稳 |
| S13 | `[role="menu"]` | **PASS** | SHELL_JS:132（menu 组件）、SHELL_JS:194（dockkit tab menu） | 菜单项 `[role="menuitem"]` 亦可用 |
| S14 | `[class*="viewsMoreMenu" i]` | **PASS** | CONV:20057 CSS `.an3WzG_viewsMoreMenu{width:288px;…}`；class map CONV:20730 | — |
| S15 | `[class*="moreMenu" i]` | **PASS** | SIDEBAR:116/142/251（class map + CSS）；sidebar-right:371 等也有 | 泛匹配 `moreMenu` 会同时命中 `viewsMoreMenu`，注意特异性 |
| S16 | `[class*="addMenu" i]` | **PASS** | PM:4219 `.V7pFBG_addMenu{width:320px;max-width:calc(100vw - 48px)}` + `[role=menuitem]` 样式；class map PM:4232-4234 | 上一代在 plugin-manager，本代仍在 |
| S17 | `[data-slot]` | **PASS** | RENDERER:1124 `"data-slot": slotKey; style:{display:"contents"}`；另有 `[data-slot-error]`（RENDERER:643） | 新增稳定钩子：`[data-slot="root"]`、`[data-slot="sidebar"]` 等 |
| S18 | `[data-windows-titlebar]` | **PASS** | PRELOAD:1664 `root.dataset.windowsTitlebar=""`（仅 win32） | 见 §8 |
| S19 | `html[data-platform]` | **PASS** | PRELOAD:57 `document.documentElement.dataset.platform = process.platform` → 值为 `"win32"` / `"darwin"` | Web 浏览器无该属性 |
| S20 | `html[data-fullscreen]` | **PASS** | PRELOAD:69-73（仅 win32/darwin，`"true"` 或删除） | — |
| S21 | `[data-conversation-region]` | **PASS** | CONV:20595 | 值：`composer` 等 |
| S22 | `[data-shell-overlay]` / `[data-shell-leading]` / `[data-shell-bottom]` | **PASS** | LAYOUT:395-411 JSX + LAYOUT:74 CSS | HUD 挂载建议点（overlay 层 z-index:20、pointer-events:none） |
| S23 | `[data-composer-overlay]` | **PASS** | CONV:22018 内 `div.overlayAnchor,"data-composer-overlay":true` | 输入卡内锚点 |
| S24 | `[data-input-scroll]` / `[data-composer-input]` / `[data-composer-dock]` / `[data-queue-dock]` | **PASS** | CONV 的 data-* 清单（见 §5） | 输入区细分钩子 |

**FAIL 汇总**：只有 S9 原生 `dialog` 不存在（宿主统一用 `div[role=dialog]`）。上一代 §9 的 19 条里没有真正的失效项。

---

## 5. 新增/完整的稳定钩子清单（data-*）

来自 `_ref/host/scan-hooks.tsv` 与逐包 `data-*` 提取（asar 内全扫）：

| 包 | data-* 属性 |
|---|---|
| conversation | `data-composer-card` `data-composer-dock` `data-composer-input` `data-composer-overlay` `data-composer-placeholder` `data-composer-seat` `data-content-phase` `data-conversation-content` `data-conversation-header-corner` `data-conversation-header-leading` `data-conversation-region` `data-conversation-scroll` `data-conversation-session` `data-conversation-tabs` `data-input-scroll` `data-phase` `data-queue-dock` `data-sending` `data-side` `data-status` `data-submission-echo` `data-width-handle` `data-window-drag` |
| chat | `data-chat-turn` `data-chat-turn-spacer` `data-chat-flow` `data-chat-node-key` `data-chat-following-tail` `data-message-bubble` `data-message-attachments` `data-streaming` `data-turn-process*`（8 个）`data-step-process*`（5 个）`data-context-*`（15 个）`data-composer-stat` `data-scroll-up/down` `data-shimmer-decoration` `data-preview` `data-error` |
| layout | `data-animating` `data-dragging` `data-sidebar-collapsed` `data-sidebar-drawer` `data-sidebar-instant` `data-sidebar-mask` `data-global-panel` `data-rightbar-*`（5 个） `data-shell-bottom` `data-shell-leading` `data-shell-overlay` `data-side` |
| sidebar | `data-sidebar-opener` `data-sidebar-toggle` `data-shortcut-modal` `data-modal-autofocus` `data-copy-version` `data-window-drag` |
| workspace | `data-row-key` `data-context-menu-trigger` `data-modal-autofocus` |
| renderer | `data-slot` `data-slot-error` `data-dsh-boot` `data-factory-error` `data-chain-overlay-fallback` |
| 其它 | `[data-menu-material]`（菜单材质，THEME:1482）、`[data-dsh-automatic-focus]`（THEME:1464）、`[data-windows-menu]`（Windows caption 菜单 shadow host，PRELOAD:1543）、`[data-shell-overlay]` |

---

## 6. 客户端插件契约

### 6.1 package.json（实证：`~/.dsh/profiles/desktop/node_modules/dsh-startup-vyron/package.json`）

```jsonc
{
  "type": "module",
  "main": "lib/index.js",              // Host 半侧（Cordis 插件：export {apply, inject, name}）
  "exports": { ".": "./lib/index.js", "./client": "./lib/client.js", "./package.json": "./package.json" },
  "dsh": {
    "bundle": { "patch": "./cordis.patch.yml" },       // bundle 挂载 patch
    "client": { "platform": "web", "inject": ["@deepseek-ai/dsh-client-ui-settings"] }
  }
}
```

- `cordis.patch.yml` 只需 `- insert: [{ id: <name>, name: <包名> }]`（vyron 实证）。
- `dsh.client.platform` 目前只接受 `"web"`（模块系统按 Web 载体组装）；`inject` 是声明要一起加载的兄弟 client 包（用于确保依赖包的 CSS/slot 类型在）。
- `dsh.client` 字段由 `dsh-client-modules` 在启动时扫描并校验（MODS README:73-95；断言 C5）。

### 6.2 浏览器入口形状（强约束）

```js
// lib/client.js —— 必须恰好是这个形状（MODS:1 实证，所有 68 个 ui 包同构）
window.__ModuleLoader__.load({
  id: "@scope/pkg-name",          // 与包名一致；stripClientSuffix 后作模块 id
  factory: (require) => {
    // 所有副作用（CSS <style> 注入、DOM 挂载、ctx 使用）都必须在 factory 内！
    // 加载 = 只注册 factory；物化 = 首次 import/require（MODS:16-23）
    const react = require("react");
    const jsxRuntime = require("react/jsx-runtime");
    // ... module.exports / exports.xxx
    return module.exports;
  }
});
```

- 未在 factory 内注册的 bundle 会报 `loaded without registering "<id>" via __ModuleLoader__.load`（MODS:760/877）。
- 替换 bootstrap 模块 = 必须刷新页面（MODS:675）。
- 弹窗/设置页等插件 UI 走 slots（§6.4），不要直接往 `#root` append React 树。

### 6.3 `require` 可用的平台种子（SHELL_JS:196 静态表，断言 C2）

`react` · `react/jsx-runtime` · `react-dom` · `react-dom/client` · `@deepseek-ai/cordis` · `zod` · `@tanstack/react-virtual` · `@deepseek-ai/dsh-client-store` · `@deepseek-ai/dsh-client-ui-slots` · `@deepseek-ai/dsh-client-ui-primitives` · `@deepseek-ai/dsh-client-ui-dockkit`

> 皮肤插件通常只需 `react` / `react/jsx-runtime`；纯 CSS 皮肤可以完全不 require（但 factory 仍需存在）。
> 注意：`@deepseek-ai/dsh-client-ui-slots` / `-primitives` / `-dockkit` / `-store` **不在 asar 的 node_modules 里**（提取命中 0 文件）——它们是 shell 的静态平台种子，只能通过 `require()` 拿到，不能当作可安装依赖写进 `dependencies`。

### 6.4 slots API（断言 C3）

| API | 形状 | 证据 |
|---|---|---|
| `ctx.slots.inject(slotName, callback)` | 槽位就绪时执行 callback；返回 disposer | CONV:19937 起大量使用（`ctx.slots.inject("conversation.chat.node", () => …)`） |
| `ctx.slots.register(contribution)` | 在 callback 内注册；`{ id, order?, component/render, … }` | 同上（CHAT:9234-9268） |
| `ctx.slots.registerFactory(definition)` | 注册被共享的 slot 类型定义（framework 层用） | CHAT:9229 |
| `ctx.effect(() => disposer)` | 生命周期绑定 | CONV:19937 |

常用槽位（实测存在，`.client.js` 内 `renderSlot`/`ctx.slots.inject` 命中行）：

| 槽位 | 命中文件:行 |
|---|---|
| `root` | CHAT:3402（`renderSlot("root")` 的消费方） |
| `main.conversation` | CONV:20270 |
| `sidebar` | CHAT:14820 |
| `rightbar` / `shell.bottom` / `shell.leading` | LAYOUT:389 / LAYOUT:399 / LAYOUT:347 |
| `conversation.header.leading` / `conversation.session.header` | CONV:20644 / CONV:20645 |
| `conversation.chat.node` / `conversation.chat.reasoning.body` | CHAT:3384 / CHAT:8227 |
| `conversation.composer` / `conversation.composer.bar` | CONV:20583 / CONV:20557 |
| `conversation.input.overlay` / `.attachments` / `.dock` | CONV:22028 / CONV:22034 / CONV:19937 |
| `settings.section` / `settings.section.icon` / `settings.launcher` | settings-account:5420 / ui-settings README:47 / settings-account:5415 |
| `settings.general.item` | CHAT:15357 |
| `settings.plugins.tab` | **仅 ui-settings README:45 声明，当前构建无消费者注册**（可注册但运行时未验证） |
| `settings.onboarding` | 同上（README 声明，无消费者） |
槽位锚点 DOM：`div[data-slot="<slotName>"]`（inline 槽位是 `span`，RENDERER:1124）。

### 6.5 主题注册 API（皮肤的更稳路径）

`ctx.theme.register(definition)`（THEME:2057，断言未覆盖但已读实现）：

```ts
definition = {
  id: string,                 // 不能是 "system"，重复 id 抛错
  colorScheme: "light" | "dark",
  tokens?: Record<string,string>,   // alias token 覆盖 → 由 ThemePresenter 以 inline style 写到 body（LAYOUT:629-632）
  icons?: Record<symbolId, svgDocument>  // 替换产品图标（校验 svg/viewBox/无 style/script）
}
// 返回 disposer；dispose 正在使用的主题会把偏好重置为默认
```

- 注册后用户在「设置 → 通用 → 外观」里选中该主题才生效；纯 CSS 皮肤可跳过此 API。
- 图标替换是「启动动画 + 皮肤」最干净的换 logo 途径（比 CSS `content:` 稳）。

### 6.6 CSS 注入（宿主自己的做法，皮肤可照抄）

```js
const tagId = "@scope/pkg/MySkin.module.css";
if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
  const tag = document.createElement("style");
  tag.dataset.plugin = "@scope/pkg";
  tag.dataset.pluginCss = tagId;
  tag.textContent = css;
  document.head.appendChild(tag);
}
```
证据：LAYOUT:76-82（所有 ui 包统一模式）。这样卸载/HMR 时宿主能按 `data-plugin-css` 回收。

---

## 7. Host 契约

### 7.1 `webServer`（注入 `['webServer','connection']`；vyron 实证）

| API | 签名 | 证据 | 状态 |
|---|---|---|---|
| `register(route)` | `{ kind:"exact"|"prefix", path, handler(req,res) | resource(req,peer) }` → disposer；重复 `(kind,path)` 抛错 | WSRV:375-382 | **不变** |
| `registerUpgrade(route)` | `{ path, handler }` | WSRV:389 | 不变 |
| `registerFallback(fallback)` | handler 或 `{resource}` | WSRV:405 | 不变 |
| `tapIndex(transform)` | `(html: string) => string`，纯函数，按注册顺序应用（在结构化行之后）→ disposer | WSRV:450-456；渲染顺序 WSRV:658 | **仍在** |
| `applyIndexTaps(html)` | 只跑 raw transforms | WSRV:633 | 仍在 |
| `collectIndexInjections(peer)` | 收集结构化注入表，每次调用 emit 一次 `webserver/index-inject` | WSRV:646；事件名 WSRV:640 | **0.2.2 新增** |
| `renderIndex(html, peer)` | 先渲染结构化行，再跑 taps | WSRV:658 | **0.2.2 新增** |
| `readResource(request, peer)` | 无 HTTP 读取资源响应 | WSRV:427 | 新增 |
| `port` / `host` / `protocol` / `origin` getter | — | WSRV:342-367 | — |
| `connection.requestRejection(request)` | 仍在 | CONN:737 | **不变** |

**结论**：上一代 `webServer.tapIndex((html)=>…)` + `webServer.register({kind:'prefix',path:'/vyron-assets',resource})` 的写法在 0.2.2-rc.1 **继续有效**。启动动画的首屏注入建议仍走 `tapIndex`（比结构化行自由），并且**要在 `renderIndex` 之后**才被应用 → 注入的 HTML 一定出现在最终 index 响应里（`renderIndex` 先结构化行、后 taps，WSRV:658 的 doc 明示）。

### 7.2 首屏 HTML 与静态资源

| 事实 | 值 | 证据 |
|---|---|---|
| index.html 位置 | `dsh-web-frontend/dist/index.html`（1009 B） | WEBAPP:77（`require.resolve("@deepseek-ai/dsh-web-frontend/package.json")` + `dist/index.html`） |
| body 内容 | 仅 `<div id="root"></div>` | `dist/index.html:19` |
| 无注入标记 | 无 `<!--inject-->`、无占位注释 → 只能字符串替换/插入 | 同上（断言 H6） |
| 资源前缀 | `./assets/index-<hash>.js`、`./assets/vendor-<hash>.js`、两个 CSS | 同上 |
| 静态资源服务 | `dsh-web-app`/`dsh-web-frontend` 组合；插件自己的静态资源建议用 `webServer.register({kind:'prefix', path:'/plugins-assets/<pkg>/', resource})` | vyron 实证；WSRV:375 |
| bundle 路由 | 宿主 client 插件走 `/plugins/??...&rev=...` combo（MODS README:85-92） | MODS README |

### 7.3 启动画面（宿主自带）

| 事实 | 证据 |
|---|---|
| 启动层 DOM：`<div data-dsh-boot>`，由 module 加载前注入 `#root`，React 用 `hydrateRoot` 接管 | RENDERER:1843-1852（`BootHandoff`、`container.querySelector(":scope > [data-dsh-boot]")`）、SHELL_JS:196（`cr(ar.boot).dataset.dshBoot=""`） |
| 结构：`.boot`（_boot_u7vgf_3）> `.card`（wordmark "HARNESS" + spinner + hint "Loading plugins…"） | SHELL_JS:196；`SHELL_CSS:22/40/46/53/58/67` |
| 背景：`background:var(--dsw-alias-bg-base, var(--dsh-boot-bg, Canvas))`，`height:100%;display:grid;place-items:center` | `SHELL_CSS:22-31` |
| 自带 CSS 变量：`--dsh-boot-label-primary/secondary/tertiary`、`--dsh-boot-border`、`--dsh-boot-brand`（dark 覆盖在 `body[data-ds-dark-theme] ._boot_*`） | `SHELL_CSS:22` / `SHELL_CSS:33` |
| 进度弧：spinner 的 `--dsh-boot-arc`，`style.setProperty("--dsh-boot-arc", 72+progress*216 deg)` | SHELL_JS:196；`SHELL_CSS:67` |
| 加载失败态：`.failed/.failedTitle/.failedItem`（"Failed to load plugins"） | SHELL_JS:196；`SHELL_CSS:81/87/93` |
| 启动期间 `body[data-ds-dark-theme]` 等已由「pre-plugin palette」脚本先写入，避免首帧白闪 | ui-theme README:48 |

**对启动动画插件的含义**：宿主启动层在 `#root` 内、由 shell 静态 JS 渲染，**插件 JS 还没来得及跑**。所以要"接管启动画面"只有两条路：
1. `webServer.tapIndex` 往 index.html 里注入自己的 overlay（`body` 直下、`position:fixed; inset:0; z-index` 高于 `#root`），由注入的脚本自己计时/退场；插件 client.js 只负责后续挂皮肤 class 与交接信号。
2. 纯 CSS 伪装：覆盖 `._boot_*`（哈希类名，需 `[class*="_boot_" i]`）与 `[data-dsh-boot]` 的样式，但**无法替换 DOM 结构**（video/canvas 放不进去，只能用 `::before` + `background-image` 或 `content:url()`）。
   → 推荐 1，且用 `[data-dsh-boot]` 的移除时机（hydration 完成）作为交接等待点（可用 MutationObserver）。

### 7.4 Electron 侧（窗口 / 标题栏 / 平台标记）

| 事实 | 值 | 证据 |
|---|---|---|
| 主窗口 | 1280×820，`show:false` 起步，`webPreferences:{nodeIntegration:false, contextIsolation:true, sandbox:true, webviewTag:primary}` | MAIN:20103-20137 |
| Windows 标题栏 | `titleBarStyle:"hidden"` + `titleBarOverlay:{height:40, color:chromeFallbackFill(), symbolColor: dark?"#f9fafb":"#0f1115"}` | MAIN:20110-20116 |
| darwin | `titleBarStyle:"hiddenInset"`, `trafficLightPosition:{x:16,y:18}`, `vibrancy:"sidebar"`, `backgroundColor:"#00000000"` | MAIN:20118-20127 |
| 原生标题栏兜底色 | `chromeFallbackFill()` = dark `#1b1b1c` / light `#f9fafb` | MAIN:20087-20089 |
| 标题栏颜色动态更新 | preload 用隐藏探针测 `--dsw-specific-sidebar-fill`/`--dsw-alias-label-primary` 的 computed 值 → IPC `windowsAppearance` → `mainWindow.setTitleBarOverlay({color,symbolColor})` | PRELOAD:1673-1700；MAIN:21084-21088 |
| 探针触发条件 | MutationObserver 只看 `html[lang]`、`body[data-ds-dark-theme]`、`body[style]` | PRELOAD:1702-1710 |
| 启动隐藏/显示 | `createWindow(preload, show=false, primary)`；`show` 由外层控制 | MAIN:20103 |
| 架构标记写入时机 | preload 在文档创建时立刻写 `data-platform`（若 documentElement 为 null 则等 DOMContentLoaded） | PRELOAD:55-61 |

> **皮肤可利用点**：Windows 原生标题栏（40px，含三颗原生窗口按钮）**颜色可被 CSS token 间接控制**——改 `--dsw-specific-sidebar-fill` 后，只要再触发一次探针重测（例如写一次 `body.style.setProperty(...)` 或切换 `data-ds-dark-theme`），main 就会 `setTitleBarOverlay` 跟随。**但无法做透明/视频**：那是 Electron 原生覆盖层，不吃 CSS 背景。

---

## 8. 平台矩阵与顶栏安全区（回答 Lead Q1/Q2）

### 8.1 html / body 属性组合（实测逻辑）

| 环境 | `html[data-platform]` | `html[data-windows-titlebar]` | `html.style` 行内 | 其它 html 属性 | body 属性 |
|---|---|---|---|---|---|
| **Windows Electron** | `"win32"`（PRELOAD:57） | **存在**（空值，PRELOAD:1664） | `--dsh-windows-titlebar-height:40px`（PRELOAD:1665）、`color-scheme:<scheme>`（LAYOUT:616） | `data-ds-theme-source="light|dark|system"`（LAYOUT:617）、`data-input-modality`、可选 `data-fullscreen="true"`、`lang` | `data-ds-dark-theme`（深色时）、行内字号/字体族 |
| **macOS Electron** | `"darwin"` | 无 | `color-scheme` | `data-ds-theme-source`、可选 `data-fullscreen`、`lang` | 同上 |
| **Web 浏览器（dsh web）** | 无 | 无 | `color-scheme` | `data-ds-theme-source`、`data-input-modality`、`lang` | 同上 |

- `--dsh-windows-titlebar-height` 的值：**固定 `40px`**（PRELOAD:1665），同时 Electron 的 `titleBarOverlay.height` 也是 `40`（MAIN:20113）——两处一致，无 44px 变体。
- shell 读取它的逻辑：`e2()`（SHELL_JS:194）—— `hasAttribute("data-windows-titlebar") && !hasAttribute("data-fullscreen")` 时取 `parseFloat(html.style.getPropertyValue("--dsh-windows-titlebar-height"))`，非有限数按 0；overlay top = 该值 + 20。全屏时 top = 0。
- 布局层：`html[data-windows-titlebar]{--dsh-frame-top-clearance:var(--dsh-windows-titlebar-height); --dsh-frame-chrome-top:同}`（LAYOUT:74）→ **内容区整体下移 40px**。

### 8.2 顶栏（HUD）安全区建议

| 区域 | 占用者 | 皮肤可安全绘制范围 |
|---|---|---|
| `top:0; height:40px`（Windows） | Electron 原生 caption（拖拽）+ 右侧 **原生最小化/最大化/关闭**（不在 DOM）+ 左侧 shadow-DOM 菜单条 `div[data-windows-menu]`（`position:fixed;top:0;left:var(--dsh-windows-menu-start,48px)`；侧栏收起时 84px） | 除上述区域外可用；**右上角建议留 ≥140px**（3 颗 Windows 按钮，46–47px/颗） |
| 40px 以下 | `.an3WzG_header`（76px 高，含 titleRow 30px） | header 内可用；右侧放 `::after` 前需 `position:relative`（见 §9.1） |
| 全屏时 | `--dsh-frame-chrome-top:0`，原生按钮浮在页面之上 | 顶部再留 40px 更稳 |

> macOS：无 `data-windows-titlebar`，`--dsh-frame-top-clearance:48px`；红绿灯在 `x:16,y:18`（MAIN:20120），左上角 80×48 区域避开。

---

## 9. 三处结构细节（回答 Lead Q3/Q4/Q5）

### 9.1 `header[data-window-drag]`（ConversationHeader）

```jsx
// CONV:20638-20646
<header className={clsx(styles.header, blank && styles.headerBlank)} data-window-drag>
  <div className={styles.headerLeading} data-conversation-header-leading="">
    {renderSlot("conversation.header.leading", {})}
  </div>
  {sessionId === undefined
    ? <div className={styles.titleRow} />
    : renderSlot("conversation.session.header", { hideChrome: blank })}
</header>
```

CSS（`.an3WzG_header`，CONV:20057）：

| 规则 | 值 | 对皮肤的含义 |
|---|---|---|
| `box-sizing` / `display` | `border-box` / **`grid`** + `grid-template-columns:auto minmax(0,1fr)` | **不是 flex**；`::after` 作为伪元素会成为 grid item（除非绝对定位） |
| 高 | `min-height:76px`；`:where(:not(:has(.tabs)))` 时 `min-height:0;padding-bottom:10px`；`headerBlank`：`min-height:0;padding-bottom:0;border-bottom:none` | 空白会话 header 高度会塌到内容高 |
| 背景 | **无**（只有 `border-bottom:.5px solid var(--dsw-alias-border-l3)`） | header 是透明的，透出的是 `.mP3x-q_centerCol` / `.an3WzG_root` 的 `bg-base` |
| `position` | **未声明**（static） | 要在 header 右上放遥测章：先 `header[data-window-drag]{position:relative}` 再 `::after{position:absolute}`；否则绝对值会相对 `.mP3x-q_frame`（它才是 `position:relative`） |
| `overflow` | 未声明（visible） | 无裁剪，`::after` 可溢出 |
| padding | `10px 28px 0 20px` | 右上留白 28px |
| 子结构 | `.headerLeading`（`flex:none;grid-area:1/1;display:flex;gap:8px`）、`.titleRow`（`min-height:30px;grid-column:2;display:flex;align-items:center;padding-inline-start:max(0px,calc(var(--dsh-frame-leading-clearance,0px) - 20px))`）、`.headerUtilities`（`margin-left:20px`）、`.headerCorner`（`margin-right:-16px`） | 遥测章若放 header 右侧，建议 `inset-inline-end:28px` 对齐 padding |
| darwin no-drag | `.headerLeading/.headerActions/.headerUtilities/.headerCorner` 在 darwin 下 `-webkit-app-region:no-drag` | Windows 无此规则 |
| 其它页面的同类 header | PM:7082 `header.moreHead`、PM:7109 `header.pageHead`、settings-account:1340 `header.PlatformOverlay.header`、PM:5615 `div.detailTop` | 用 `header[data-window-drag]` 泛匹配会命中这些页面，装饰需容忍 |

### 9.2 `[data-composer-card]`（输入卡）

```jsx
// CONV:22018（InputBar）
<div className={clsx(InputBar.card, workspaceTrigger && InputBar.cardWorkspaceTrigger)}
     data-composer-card tabIndex={-1} ref={cardRef}>
  <div className={InputBar.overlayAnchor} data-composer-overlay>…slot conversation.input.overlay…</div>
  …accessory / attachments / editor / rows…
</div>
```
父级：`.GRgSLq_root`（`flex-direction:column;align-items:center;padding:0 var(--dsh-composer-side-clearance) 4px`，CONV:20057）→ 外层 `[data-composer-seat]`（`div.an3WzG_composerSeat[data-conversation-region=composer]`，CONV:20595）→ `.an3WzG_composerStack`。

| 属性 | 值 | 用途 |
|---|---|---|
| `position` | **`relative`**（宿主已给） | 四角括号/声呐环可直接 `::before/::after` 或内部 absolute 子层 |
| `border-radius` | **`var(--dsw-radius-panel)` = 28px** | 描边/环跟随 `--dsw-radius-panel` 即可 |
| `background` | `var(--dsw-specific-input-major)` | 要透视频必须置为透明/半透明 |
| `box-shadow` | `var(--dsw-elevation-soft)`（含 `0 0 0 .5px var(--dsw-elevation-stroke-color)`） | 要清干净需 `box-shadow:none` 或改 `--dsw-elevation-stroke-color` |
| 宽 | `width:100%; max-width:var(--dsh-composer-card-max-width)` | 描边不能假设固定宽 |
| `z-index`/`overflow` | 未声明 / 未声明 | — |
| `tabIndex` | `-1`（可被 focus 的卡片） | — |
| 内部锚点 | `[data-composer-overlay]`（`.overlayAnchor`） | 放装饰的首选内部挂点 |

### 9.3 菜单材质：`--dsw-specific-menu` 与 `--dsw-menu-backdrop-filter`

宿主有**两套**菜单材质，皮肤必须都覆盖（ui-theme README:55 明文要求）：

| 用法 | 选择器/属性 | token | 证据 |
|---|---|---|---|
| 共享菜单材质（context menu、MenuSurface） | `.material{background:var(--dsw-menu-surface-fill);backdrop-filter:var(--dsw-menu-backdrop-filter)}` / `.panel:before` | `--dsw-menu-surface-fill`（L `#fcfdfeb3` / D `#303136a3`）+ `--dsw-menu-backdrop-filter`（`blur(40px) saturate(150%)`） | `SHELL_CSS:521/533`；THEME:1482 |
| 其它浮层（anchored panel/menu） | `background:var(--dsw-specific-menu); backdrop-filter:var(--dsw-menu-backdrop-filter)` | `--dsw-specific-menu` = `var(--dsw-menu-surface-fill)`，但 **darwin 覆盖为 `#f8f9faf0`/`#303136f0`** | CHAT:8882（`.xXe6ja_panel`）、CONV:21380（`.A6Bq1a_panel`）、CONV:19505（`.F07MqG_panel:before`）、THEME:1470 |
| 菜单材质的"描边色" | `body[data-ds-dark-theme] [data-menu-material]{--dsw-elevation-stroke-color:var(--dsw-alias-border-l3)}` | `--dsw-elevation-stroke-color` | THEME:1482 |
| 分组标题底 | `--dsw-alias-menu-group-header-fill`（`#f8f9faf0`/`#303136f0`，94% 不透明） | THEME:1470；ui-theme README:55 |
| 遮罩 | `--dsw-alias-bg-mask-*` + `--dsw-mask-blur`（当前 `none`；ui-theme README 要求 modal mask 不要 backdrop blur） | THEME:1482 / README:55 |

结论：菜单/弹窗要"玻璃 + 视频透出"，需同时覆盖 `--dsw-menu-surface-fill`、`--dsw-specific-menu`（含 darwin 覆盖）、`--dsw-menu-backdrop-filter`、`--dsw-elevation-stroke-color`、`--dsw-alias-bg-layer-2` 与 `--dsw-mask-blur`。

---

## 10. 与 vyron（0.2.1-rc.5）skin-spec §9 的差异

| vyron §9 条 | vyron 结论 | 0.2.2-rc.1 复核 | 差异 |
|---|---|---|---|
| #1–#4 自定义 class/主题/档位/降级 class | 自有契约 | 不涉及宿主 | 无变化 |
| #5 `#root header[data-window-drag]` | PASS（ui-conversation + ui-plugin-manager） | **PASS**：CONV:20638-20646、PM:7082/7109、settings-account:1340 | 不变；但**Windows 下该属性不再承担拖拽**（app-region 规则仅 darwin，SHELL_CSS:4182），拖拽改由原生 titleBarOverlay + `.mP3x-q_frame:before` 承担 |
| #6 `header[data-window-drag]::after`（皮肤自设 `position:relative`） | 同 #5 | **PASS，且仍是必需**：header 仍无 `position`（CONV:20057） | 不变 |
| #7 `[class*="sidebarCol" i]` | PASS `.mP3x-q_sidebarCol` | **PASS**（LAYOUT:74/93，哈希前缀同为 `mP3x-q`） | 不变 |
| #8 `[data-composer-card]` | PASS，含 `position:relative` + `border-radius:var(--dsw-radius-panel)` | **PASS**（CONV:21701/22018） | 不变 |
| #9 `[data-composer-seat]` | PASS（预留未用） | **PASS**（CONV:20595）；新增 `[data-conversation-region="composer"]` | 增强 |
| #10 `[role="tablist"] [role="tab"][aria-selected="true"]` | PASS | **PASS**（SHELL_JS:132/194） | 不变 |
| #11 `[role="treeitem"][aria-selected="true"]` | PASS | **PASS**（WS:2452/2563） | 不变 |
| #12 `[aria-current="page"]` / `"true"` | PASS | **PASS**：值为 `"page"`（SIDEBAR:216） | 不变 |
| #13 `viewsMoreMenu`/`moreMenu`/`addMenu`/`[role="menu"]` | PASS | **全部 PASS**：CONV:20730、SIDEBAR:142、PM:4219/4232、SHELL_JS:132/194 | `addMenu` 需用 `[class*="addMenu" i]`（哈希 `V7pFBG_addMenu`） |
| #14 `dialog` / `[class*="_dialog" i]` / `[class*="_mask" i]` | PASS（含 `<dialog>`） | **部分变化**：`[role="dialog"]`、`[class*="_dialog" i]`、`[class*="_mask" i]` PASS；**原生 `<dialog>` 不存在**（全 asar 0 命中） | **FAIL 项**：去掉 `dialog` 选择器即可 |
| #15 `.md-code-block` | PASS | **PASS**（SHELL_JS:168、SHELL_CSS:2805；trajectory:4540 也有） | 不变 |
| #16 `:not([data-input-modality="pointer"]) :focus-visible` | PASS | **PASS**：`html[data-input-modality=pointer] body :focus-visible:not(:read-write)`（THEME focus.css / SHELL_CSS） | 不变 |
| #17 自定义 `html.vyron-enter` | 自有 | 不涉及宿主 | 无 |
| #18 113 token 覆盖 | 77 static + 113 alias | **实测 114 alias + 82 static + 10 specific = 440 总计** | alias 由 113→114（+1）；skin 若按旧清单写会漏 1 个 |
| #19 `[class*="navCell" i][class*="active" i]` | FAIL（当时就没） | **仍无** | 不变 |
| #20 `:has(body[data-ds-dark-theme])` | 用于浅色兜底 | **PASS**：dark 属性确实在 body（LAYOUT:619） | 不变 |

**新增（0.2.2 独有、值得用）**：
- `[data-slot]` / `[data-slot="<name>"]`（RENDERER:1124）
- `[data-shell-overlay]`（z-index:20 覆盖层）、`[data-shell-leading]`、`[data-shell-bottom]`（LAYOUT:395-411）
- `[data-windows-titlebar]` + `--dsh-windows-titlebar-height:40px`（Windows 顶栏 40px 安全区）
- `[data-dsh-boot]` + `--dsh-boot-arc`（宿主启动层，可作启动动画交接点）
- `[data-conversation-region]`、`[data-conversation-content]`、`[data-conversation-header-leading/corner]`、`[data-composer-overlay]`
- `ctx.theme.register`（品牌图标/alias token 的官方扩展点，THEME:2057）
- `webServer` 结构化 index 注入（`collectIndexInjections` / `index-inject` 事件 / `renderIndex`，WSRV:640-658）

**结论**：vyron 的 skin.css 选择器表在新版**基本全绿**（唯一要删的是 `dialog` 裸选择器）。真正需要改的是 **Windows 顶栏 40px 安全区** 与 **新增启动层交接点**。

---

## 11. 未验证项与风险

| # | 项 | 现状 | 风险/影响 |
|---|---|---|---|
| U1 | `vibrancy`/原生标题栏在真机上的实际观感 | 只读代码（MAIN:20118-20127 / 20110-20116），未在 Windows 真机截图验证 | Windows 原生 caption 颜色能否与视频皮肤协调，需要真机看 |
| U2 | `.mP3x-q_frame:before`（`-webkit-app-region:drag` 的伪元素）是否真被 Electron 当作拖拽区 | 代码如此写；Chromium 对伪元素 app-region 的支持未在本机验证 | 若无效，Windows 拖拽依赖 titleBarOverlay 原生区（40px 顶条） |
| U3 | `data-input-modality` 的写入者 | 只在 THEME/PRELOAD 里读到消费方与规则，未找到写入者（可能在 ui-primitives，未提取） | 焦点环兜底选择器可能需换写法 |
| U4 | Windows 顶条上原生窗口按钮的确切宽度 | Electron Window Controls Overlay 的标准值（46–47px/颗），未实测 | HUD 右侧避让建议 ≥140px；真机需复测 |
| U5 | 视频背景在 Electron 下的性能 | 未测 | 需 composited layer 预算；建议 ≤2 个 video 层 |
| U6 | `--dsw-alias-bg-layer-4` 的空值行为 | 断言证明"未定义 + 被引用"，未在真机确认视觉表现 | 该处 hover 背景会透明 |
| U7 | 皮肤 token 覆盖与 ThemePresenter inline style 的竞争 | 内置 light/dark 的 `tokens` 为空 → 无 inline 冲突；但注册主题会 inline | 若皮肤注册主题又用 CSS 覆盖，CSS 可能输给 inline |
| U8 | `dsh.client.platform` 是否只有 `"web"` | 仅见 vyron 的 `"web"` 与本机 68 个包，未读校验分支的完整枚举 | 非 web 值可能导致不加载 |
| U9 | 宿主启动层与注入 overlay 的 z-index 关系 | boot 层无显式 z-index（`SHELL_CSS:22`），注入层需自行设高值 | 建议 `z-index:2147483000` 并 `pointer-events:none` |
| U10 | 行号稳定性 | 行号基于 0.2.2-rc.1（asar sha256 见断言报告）；上游小版本可能移位 | 用断言脚本复跑即可重新定位 |
| U11 | `#root` 与 `.mP3x-q_frame` 之间是否确有一层 `div[data-slot="root"]` | renderer 的 slot 锚点统一为 `div[data-slot=…]{display:contents}`（RENDERER:1124），但根槽位由 shell 挂载（LAYOUT:98-99 注释「the web shell renders only 'root'」），该层是否为 DOM 中真实节点未逐一验证 | 皮肤写 `#root > .mP3x-q_frame` 的子选择器可能不稳；一律用 `.mP3x-q_frame` 类选择器（display:contents 不打断 `>`？会打断，别用） |
