# host contract assertions — DSH 0.2.2-rc.1

> 本文件由 `_ref/host/assert-host.mjs --md` 生成，是**可复跑**的宿主契约断言报告；数字与行号为生成时刻实测值。

- generated: 2026-11-06T05:54:20.910Z
- asar: `E:\dsh\resources\app.asar`
- asar size: 213202918 bytes
- asar sha256: `5fa8a6b21bceb8f3e99e30efa2270efd0cc773a11e42aa0488f804a64b34e637`
- entries scanned: 22102
- result: **60 PASS / 0 FAIL** (60 claims)
- repro: `node _ref/host/assert-host.mjs --md > docs/verify/host-assertions.md`

| id | 断言 | 结果 | 证据 |
|---|---|---|---|
| T1 | ui-theme 定义 --dsw-alias-* token ≥ 110 个 | PASS | `114 个（dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js）` |
| T2 | ui-theme 定义 --dsw-static-* token ≥ 80 个 | PASS | `82 个` |
| T3 | ui-theme 定义 --dsw-specific-* token ≥ 10 个 | PASS | `10 个` |
| T4 | 浅色 token 声明点为 body{...} | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1470 (body 块内)` |
| T5 | 深色 token 声明点为 body[data-ds-dark-theme]{...} | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1470` |
| T6 | --dsw-alias-bg-base dark 值 = static neutral-bluish-950 | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1470` |
| T7 | --dsw-specific-sidebar-fill 存在且 dark 覆盖 | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1470 (共 2 处声明)` |
| T8 | --dsw-menu-backdrop-filter 与 --dsw-menu-surface-fill 存在 | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1482 (backdrop-filter); dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1470 (surface-fill)` |
| T9 | darwin 专用菜单覆盖 html[data-platform=darwin] body{--dsw-specific-menu:#f8f9faf0} | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js:1470` |
| T10 | [负断言] --dsw-alias-bg-layer-4 被引用但未定义 | PASS | `未声明；被 dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-lh_YM6sT.css 引用（var() 回退为空）` |
| P1 | shell CSS: html,body,#root{height:100%;margin:0} | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-lh_YM6sT.css:1 (minified 单行；prettify 版 4164)` |
| P2 | shell CSS: body{background:var(--dsw-alias-bg-base | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-lh_YM6sT.css:1 (prettify 版 4168-4173)` |
| P3 | layout AppFrame: .frame{background:var(--dsw-alias-bg-base)} | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:74 (AppFrame.module.css)` |
| P4 | layout: .sidebarCol{background:var(--dsw-specific-sidebar-fill)} | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:74` |
| P5 | layout: Windows 顶条 [data-windows-titlebar] .frame:before 用 sidebar-fill 且 -webkit-app-region:drag | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:74` |
| P6 | conversation: .root{background:var(--dsw-alias-bg-base)} | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20057` |
| P7 | conversation: composerSeat 激活态 sticky + 渐变遮罩吃 bg-base | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20057` |
| P8 | layout: overlay 层 [data-shell-overlay] z-index:20 position:absolute | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:74` |
| S1 | 选择器钩子存在：#root header[data-window-drag] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20638` |
| S2 | 选择器钩子存在：[class*="sidebarCol" i] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js:93` |
| S3 | 选择器钩子存在：[data-composer-card] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:22018` |
| S4 | 选择器钩子存在：[data-composer-seat] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20595` |
| S5 | 选择器钩子存在：[data-conversation-scroll] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20198` |
| S6 | 选择器钩子存在：[role="tab"] + aria-selected | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:132` |
| S7 | 选择器钩子存在：[role="treeitem"][aria-selected] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-workspace/lib/client.js:2452` |
| S8 | 选择器钩子存在：[aria-current] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js:216` |
| S9 | 选择器钩子存在：[role="dialog"] | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:132` |
| S10 | 选择器钩子存在：[class*="_dialog" i] | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:123` |
| S11 | 选择器钩子存在：[class*="_mask" i] | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:123` |
| S12 | 选择器钩子存在：.md-code-block | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:168` |
| S13 | 选择器钩子存在：[role="menu"] | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:132` |
| S14 | 选择器钩子存在：[class*="viewsMoreMenu" i] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20099` |
| S15 | 选择器钩子存在：[class*="moreMenu" i] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-sidebar/lib/client.js:116` |
| S16 | 选择器钩子存在：[class*="addMenu" i] | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-plugin-manager/lib/client.js:4219` |
| S17 | 选择器钩子存在：[data-slot]（slot 挂载点） | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-renderer/lib/client.js:1124` |
| S18 | 选择器钩子存在：[data-windows-titlebar] | PASS | `lib/preload-app.cjs:1664` |
| S19 | 选择器钩子存在：html[data-platform]（Electron preload 写入） | PASS | `lib/preload-app.cjs:57` |
| S20 | 选择器钩子存在：html[data-fullscreen]（仅 win32/darwin） | PASS | `lib/preload-app.cjs:72` |
| S21 | [负断言] 原生 <dialog> 元素不存在 | PASS | `全 asar 无 <dialog 字面量` |
| S22 | ConversationHeader 是 <header data-window-drag> 且含 headerLeading/titleRow | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20640` |
| S23 | header CSS: grid 布局、min-height:76px、无 position 声明（需皮肤自加 relative） | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:20057` |
| S24 | composer card CSS: position:relative + border-radius:var(--dsw-radius-panel) | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:21701` |
| C1 | 浏览器入口契约 window.__ModuleLoader__.load({id, factory}) | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-modules/lib/client.js:1 (dsh-client-modules 自身入口)` |
| C2 | 平台种子模块表含 react/react-dom/zod/cordis/ui-slots | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:196 (平台种子表)` |
| C3 | ctx.slots.inject / register / registerFactory 存在 | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:19937 / dsh/node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js:19937` |
| C4 | settings.section 槽位仍存在（ui-settings README） | PASS | `dsh-client-ui-settings/README.md:45` |
| C5 | dsh.client 声明字段被 modules 包校验（inject/platform） | PASS | `dsh-client-modules/README.md:12` |
| H1 | webServer.tapIndex(transform) 存在且返回 disposer | PASS | `dsh/node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js:450` |
| H2 | webServer.register({kind,path,handler|resource}) 存在 | PASS | `dsh/node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js:375` |
| H3 | 结构化注入层 collectIndexInjections/renderIndex/applyIndexTaps 存在 | PASS | `dsh/node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js:646 / dsh/node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js:658 / dsh/node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js:633` |
| H4 | webserver/index-inject 事件存在 | PASS | `dsh/node_modules/@deepseek-ai/dsh-host-webserver/lib/index.js:640` |
| H5 | connection.requestRejection(request) 仍存在 | PASS | `dsh/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js:737` |
| H6 | 首屏 index.html 仅含 <div id="root"></div>（无注入标记位） | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/index.html:19` |
| H7 | index.html 由 dsh-web-frontend/dist 提供（web-app 解析） | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-app/lib/index.js:77` |
| H8 | Electron BrowserWindow: win32 titleBarStyle:hidden + titleBarOverlay{height:40} | PASS | `lib/main.js:16575` |
| H9 | Windows 原生标题栏颜色随渲染进程测量值更新（setTitleBarOverlay） | PASS | `lib/main.js:21088` |
| H10 | --dsh-windows-titlebar-height 由 preload 写为 40px | PASS | `lib/preload-app.cjs:1665` |
| H11 | Windows 原生 caption 颜色探针读 --dsw-specific-sidebar-fill / --dsw-alias-label-primary | PASS | `lib/preload-app.cjs:1673` |
| H12 | 启动画面节点 [data-dsh-boot] 与 --dsh-boot-arc | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:196 / dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-BgUyXZcc.js:196` |
| H13 | boot 容器背景吃 --dsw-alias-bg-base | PASS | `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-lh_YM6sT.css:1 (prettify 版 22)` |
