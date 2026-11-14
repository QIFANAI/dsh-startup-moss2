# MOSS 550W · 流浪地球 — DSH 启动动画 + UI 皮肤插件（v0.5 · 动态地球 + 柔化交接 + 实录音效）

> 给 **DeepSeek Harness**（Electron 桌面版）换一套「550W / MOSS 驾驶舱」：
> 开机先走一段 **13.9 秒的四幕启动电影**，随后主界面的底色是**一颗真正在动的流浪地球**
> （推进器等离子尾迹 + 缓慢镜头漂移），UI 以深空玻璃面板悬浮其上；红色只属于 MOSS 本人。
>
> 四素材四幕叙事（**脑机接口开幕 → MOSS 苏醒全屏 → 一半 MOSS／一半流浪地球转场 → 地球全屏动态背景**）不变。
> **v0.5 按用户 3 条反馈精修**：① 幕 IV 地球从「点火」起就一直是**真正的动态视频**（v0.4 因素材长 GOP，seek
> 冻结 1.9s，91%→92% 画面是静帧硬跳；v0.5 素材改短 GOP + 冷态预 seek + 点火闪光窗口延长，真宿主实测 seek
> 10–20ms）；② 充能 100% → 操作界面的交接放慢：100% 定格 0.6s → 冰白 bloom → 810ms warp 溶解 + UI 分级显影
> 900–1150ms/段，且 ambient 背景在揭示瞬间与启动层**同帧同速**起播（不再冻结/跳帧）；③ MOSS 机械臂音效换成
> **用户自制实录音轨**（`带音效moss机器人.mp4` 音轨，与 MOSS 视频逐帧对齐，-18 帧 = -0.600s）。
>
> 设计权威源：**[`docs/design-spec-v0.5.md`](docs/design-spec-v0.5.md)**（v0.5 增量）+ v4 / v3 / v2。

> **公开仓库（完整素材版）**：本仓库是 v0.5.0 的**无损开源版**——`lib/assets/**` 内嵌的地球 / MOSS / 脑机接口视频、
> 用户自制机械臂音效全部随仓库发布（与作者本机 v0.5.0 一致）。安装包见
> [Releases](https://github.com/QIFANAI/dsh-startup-moss2/releases)；取舍清单见 [docs/PUBLIC-RELEASE.md](docs/PUBLIC-RELEASE.md)。

- 插件 ID：`dsh-startup-moss2`　版本：`0.5.0`　宿主实测：DSH `0.2.2-rc.1`
- 设计权威源：[`docs/design-spec-v0.5.md`](docs/design-spec-v0.5.md)（v0.5 增量）+ [`docs/design-spec-v4.md`](docs/design-spec-v4.md)（v0.4）+ [`docs/design-spec-v3.md`](docs/design-spec-v3.md)（v0.3）+ [`docs/design-spec-v2.md`](docs/design-spec-v2.md)（四幕基线）
- 宿主测绘：[`docs/host-map.md`](docs/host-map.md)
- 资产说明：[`docs/assets-report.md`](docs/assets-report.md)
- 交付报告：[`docs/DELIVERY-REPORT-v0.5.md`](docs/DELIVERY-REPORT-v0.5.md)

---

## 1. 四幕叙事（13.9 秒）

| 幕 | 时间 | 素材 | 画面 | 叠加文案 |
|---|---|---|---|---|
| 0 | 0.0–0.5s | — | 深空黑场 + 冰白细线扫过 | `DEEPSEEK HARNESS // BOOT` |
| **I 神经接口** | 0.5–3.9s | `2992034258/最终.mp4`（脑机接口概念面板） | BCI 面板视频慢推 + 暗化；故障闪光（素材自带）结尾 | **DEEPSEEK HARNESS** 品牌开幕 + `NEURAL INTERFACE · 神经接口`、启动日志、`LINK 08→100%` |
| **II MOSS 苏醒** | 3.9–8.3s | `2926246706/1月31日.mp4`（MOSS 机器人实拍） | **全屏 MOSS**：镜头从机械细节拉开到红色主眼；准心序列 `TARGET SEARCH → 捕获 → 跟踪 → 收敛 → 7.42s 锁定 → 7.42–8.06s 终局对焦`（四角对称聚焦框钉住主眼、过冲回落、四角 seat 脉冲）；8.06–8.30 准心十字线延伸成分割线 | `550W` / `MOSS SYSTEM · 中国航天局量子计算机` / 启动日志 / 真实遥测 / `LOCKED · 550W` / 「让人类永远保持理智，确实是一种奢求。」 |
| **III 转场** | 8.3–10.35s | `2940368322`（一半 MOSS／一半流浪地球）的构图逻辑 | **左半 MOSS（冻结降饱和）／右半地球（冷态、未喷射）** 竖分割：分割线由中心画出、右幕 data-wipe 显影、接缝数据包流动、`ENGINE IGNITION` 预告，接缝左扫 → 地球全屏；**地球冷态帧在媒体 load 时预 seek（20.27s）→ 8.30 即刻动态** | `550W · CONTROL TRANSFER / 控制权移交`、`THE WANDERING EARTH / 流浪地球`、`移交控制权 / 550W → 地球发动机` |
| **IV 流浪地球** | 10.35–11.95s | `2949159595/流浪地球_15_1.mp4`（地球推进器） | 地球全屏；**10.35s 点火**：冰蓝闪光（窗口 10.35–10.95，覆盖 seek 完成）+ 扩散光环 + 曝光拉升，等离子尾迹随点火进入画面并持续动态；缓慢推近 | `ENGINE IGNITION`、`流浪地球计划 · 已启动 / 地球发动机 全功率`、`550W · MOSS / 移交完成` |
| **交接** | 11.80–13.9s | — | **四段式柔化**：11.80 BOOT COMPLETE 印章 + HUD 收束（至 12.35）；**12.10 到 100% 并定格保持 0.6s**；12.70–13.30 冰白 bloom（峰值 0.86）；13.05–13.86 启动层 810ms warp 溶解（opacity + scale 1→1.03）；UI 分级显影 base 1250ms + 900–1150ms/段（13.05 与溶解同帧起跑），ambient 背景同帧同速起播 | `BOOT COMPLETE / 系统就绪`、`BOOT COMPLETE / 加载完成` |

**启动进度条**：`BOOT SEQUENCE 13.9s` 进度条 + `INITIALIZING xx%` 从 4.36s 持续显示，
数字/光条/光点同频，**12.10s 恰好 100%** 并显示 `BOOT COMPLETE / 加载完成` 完成态，12.10–13.90 保持完成态随溶解退场。

**声音（v0.5 重做第二幕）**：分层 BGM（sub drone / D 小调 pad → 第 IV 幕 F 大调解决）由 WebAudio 实时合成；
幕 II 的 MOSS 机械臂音效改为**用户自制实录音轨** `lib/assets/audio/moss-arm-sfx.m4a`（4.400s，AAC-LC 48k 立体声，
与 MOSS 视频逐帧对齐：用户片 [0.600, 5.000] ↔ 本片 MOSS 本地 [0, 4.400] ↔ 启动动画绝对 [3.90, 8.30]），
走独立 arm 总线（峰值保护后完整混音 −17.8 LUFS / True Peak −1.4 dBFS），BGM 在幕 II duck −6dB 让位；
解码失败自动回退 v0.4 程序化关节层。可听离线渲染版本：`_work/v05/audio/moss2-boot-audio-v05.wav`
（13.90s / 44.1kHz / 16bit / 立体声，由 `_work/demo/render-audio.mjs` 生成）。

## 2. 动态背景（用户硬要求）

- 主界面背景 = `earth-1080.mp4`（1920×1080 / 30fps / 30s 无缝循环）或 `earth-720.mp4`（1280×720，v0.5 起为**短 GOP g=15** 版本）。
- **视频始终播放**：不再受系统 `prefers-reduced-motion` 影响（v0.1 在关闭系统动画的机器上会退化成静态海报，v0.2 已修复）。
- 叠加 `moss-bg-drift` 极慢镜头漂移（44s 往复，幅度 ≤2.5%），让「流浪」的动感在深空里持续可见。
- **启动动画期间 ambient 背景暂停**（被启动层完全遮挡，减少并行解码）；揭示瞬间与启动层地球同帧同速起播。
- 视频 404/解码失败 → 停在海报帧；`saver` 档 → 只加载海报；`prefers-reduced-motion` 系统偏好只影响装饰动画。

## 3. 安装

### 方式 A：拖给 DSH 装（推荐，离线 · 无损）

把 [Releases](https://github.com/QIFANAI/dsh-startup-moss2/releases) 里的 `MOSS550W·流浪地球启动动画+UI皮肤组合包.zip` 拖进 DSH 对话框，说「帮我安装这个插件」，
按包内 `00-给DSH的安装说明.md` 执行。组合包已内嵌完整的 `dsh-startup-moss2-0.5.0.tgz`
（48 个文件，含 earth 1080p+720p 短 GOP 视频、neuro/moss 视频、`audio/moss-arm-sfx.m4a` 实录音效、
字体与全部文档），**不联网、不删减素材**；装完用包内 `tools/verify.ps1` 逐文件校验。

### 方式 B：直接装本目录（开发 / 自用）

```powershell
# 在 DSH 里让 agent 执行：
#   plugin_manager install_bundle  target = <本目录>\releases\dsh-startup-moss2-0.5.0.tgz
# 或桌面版自带的 dsh 命令（可以管理 desktop profile）：
#   "<DSH 安装目录>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add <tgz 绝对路径>
```

- 用 tgz 安装得到的是 profile 内的独立副本（`node_modules`），不会把 profile 链回源码目录；
- npm 版 `dsh` CLI（0.2.2-rc.1）会拒绝管理 `desktop` profile，请改用上面的 `plugin_manager`
  工具或桌面版自带 `dsh` 命令。

**生效方式（v0.5 变化）**：v0.5 改了 **Host 半侧 `lib/index.js`**（新增音频资产白名单 + 启动兜底 17000ms）
与 `lib/client.js`（版本标记 / ambient 交接）→ 需要**完全退出 DSH（含托盘）后重开**才生效；
升级后首次加载会因构建标记 `SPLASH_REV=v0.5-r1` 自动补播一次新启动动画，之后按「每会话/每天一次」的语义。
（v0.2–v0.4 的纯客户端刷新即生效不再适用。）

装完在 **设置 → MOSS 主题** 里调档位；启动动画默认「每个浏览器会话一次」。

### 卸载 / 回滚

```powershell
# 在 DSH 里让 agent 执行： plugin_manager remove_bundle  target = dsh-startup-moss2
# 或桌面版自带的 dsh 命令：
#   "<DSH 安装目录>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-startup-moss2
```

本插件不改宿主任何文件；卸载后宿主恢复原样（配置留在 `~/.dsh/dsh-startup-moss2.json`，可手动删）。

## 4. 配置（设置 → MOSS 主题，或 `~/.dsh/dsh-startup-moss2.json`）

| key | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 启动动画总开关 |
| `mode` | `session` | `session` 每会话一次 / `daily` 每天一次 / `always` 每次打开 |
| `skin` | `glass` | `off` 皮肤关闭 / `glass` 玻璃（推荐）/ `immersive` 沉浸（完整 HUD） |
| `quality` | `standard` | `high` 1080p / `standard` 720p（推荐）/ `saver` 仅海报不加载视频 |
| `veil` | `58` | 背景压暗 0–100，越大越实、越小地球越清楚 |
| `blur` | `16` | 玻璃模糊 0–40px，0 = 纯半透明更省电 |
| `hud` | `normal` | `off` / `normal` / `full` |
| `sound` | `true` | 启动音（BGM 实时合成 + 幕 II 用户实录音轨） |
| `volume` | `50` | 启动音音量 0–100 |
| `allowSkip` | `true` | Esc 跳过启动动画（跳到 10.35s 幕 IV 起点） |
| `reducedMotion` | `false` | **只减弱装饰动效（扫描线/呼吸/漂移），不影响视频背景与启动动画视频** |

## 5. 档位与降级

| 档 | 内容 |
|---|---|
| `off` | 只有启动动画，界面回归宿主原样 |
| `glass`（默认） | 视频背景 + 玻璃表面 + 顶栏遥测章 + 四角括号 + 当前项红刻线 + 输入卡括号 |
| `immersive` | glass + 侧栏刻线尺 / 四角括号 / 扫描线 / 颗粒 / 空态红眼水印 / 等离子导轨 / 状态灯呼吸 |

自动降级：视频 404/解码失败 → 海报 + 玻璃照常；`saver` 档 → 不加载视频/音频；
不支持 `backdrop-filter` → 提高不透明度兜底；页面隐藏 → 视频暂停、动画暂停；
启动动画任何异常 → **17s** 内硬兜底交接（宿主 BOOTSTRAP_JS、splash HARD_STOP、client 自举三层均为 17000ms，落点在新时长 13.90s 之后）；
ambient 交接兜底：`done` / `fallback` / 启动层结束 / 15.5s 定时器任一路径强制恢复播放，背景不会永久静止。
**系统 `prefers-reduced-motion` 永不停视频、永不停启动动画**；只有显式 `reducedMotion=true` 才减弱装饰动效。

> **浅色宿主说明**：本皮肤是深色驾驶舱设定，浅色主题下也强制深色（这是皮肤设定，不是缺陷）。
> **互斥**：同一 profile 只建议启用一个启动/皮肤插件（与 `dsh-startup-moss` / `dsh-startup-vyron` / `dsh-startup-elisa` 二选一）。

## 6. 验收证据

> 说明：`_work/` 为作者本机的构建 / 验收工作区（2.5 GB），**不随开源仓库发布**；仓库内保留 `docs/verify/` 全部验收归档与报告。
> 公开仓库的完整取舍清单见 [docs/PUBLIC-RELEASE.md](docs/PUBLIC-RELEASE.md)。

- **v0.5 验收总判：PASS，0 FAIL**（静态 183/183 + 场景矩阵 48/48，verifier 独立于实现者）：
  [`docs/verify/v5/REPORT.md`](docs/verify/v5/REPORT.md) / [`INDEX.json`](docs/verify/v5/INDEX.json)
- v0.5 场景矩阵与数值验收器（可复跑，真宿主 + dev harness + 降级 + 音频）：`_work/verify5/`（`run-final.mjs` 一键）
- v0.5 Lead 独立验收（串行低负载；earth 动态/溶解/ambient 同步/探针）：`_work/v05/lead/accept-*/`
- v0.5 音频证据（帧对齐 / 混音规格 / 相关性 / 频段 / 峰值）：`_work/v05/audio/`（`SPEC.md` / `REPORT.md` / WAV）
- v0.5 视觉逐相位截图与视频：`_work/v05/splash-smith/frames/`、`_work/v05/handoff-smith/live-shots/`
- v0.4 验收（历史）：`docs/verify/v4/`（77/77 断言）、`_work/verify4/`
- v0.3 验收（历史归档）：`docs/verify/v3/`
- 启动动画四幕截图 + 场景矩阵（历史）：`docs/verify/splash-v2/`、`docs/verify/v3/`；皮肤降级矩阵：`docs/verify/skin-v2/`
- 真宿主运行时断言（CDP，真实 DSH Host + 真实 web app）：`_work/verify2/REPORT.md`
- 完整交付报告（含哈希基线、验证结论、未验证项）：[`docs/DELIVERY-REPORT-v0.5.md`](docs/DELIVERY-REPORT-v0.5.md)

## 7. 目录

```
package.json  cordis.patch.yml  icon.svg  locale/
lib/
  index.js        Host：路由 / 首屏注入 / 配置 API / facts / Range 资产服务 / 17s 兜底
  client.js       浏览器：皮肤应用 / 背景视频管理（ambient 交接同步）/ 启动自举 / 品牌位 / 升级重播标记（SPLASH_REV）
  skin.css        皮肤（视频背景层 + 玻璃表面 + HUD + 红眼/四角呼吸 + 降级矩阵 + 900–1150ms 分级显影）
  splash.js       启动动画运行时（13.9s 四幕时间线 / 地球短 GOP 预 seek + 点火 / 柔化交接 bloom+溶解 / WebAudio BGM + 用户实录音效）
  splash.css
  assets/         earth/（1080p+720p 短 GOP 循环+海报） neuro/（BCI 开幕视频+海报） moss/（MOSS 实拍视频+海报）
                  audio/moss-arm-sfx.m4a（用户自制的 MOSS 机械臂实录音效，4.400s） fonts/
preview/index.html   可视化预览（启动动画分幕 + 皮肤三档，v0.5 重建）
docs/            design-spec-v0.5.md（v0.5 增量权威）/ v4 / v3 / v2 / host-map.md / assets-report.md / verify/v5/
test/            smoke-host / smoke-assets / smoke-splash / smoke-client / smoke-css-regress（v0.5 契约）
_work/verify5/   v0.5 场景矩阵 + 验收器 + 一键 run-final.ps1
_work/v05/       v0.5 实现与独立验收证据（lead / splash-smith / handoff-smith / audio / verify-host 复现）
_work/demo/      演示视频 + 启动音效 WAV + 渲染脚本（v0.4 历史）
```

预览：verify 宿主里打开 `http://127.0.0.1:57123/dsh-moss2/preview`（带 `?splash=1` 直接看启动动画，`?tier=immersive` 看沉浸档）。

## 8. 素材与版权

- 地球视频、MOSS 机体视频、脑机接口面板视频来自 Steam Wallpaper Engine 创意工坊（源目录见 `THIRD-PARTY-NOTICES.md`），
  **版权归原权利人**；本仓库按作者决定以完整素材版公开分享（非商业个人同人用途），不主张任何权利，权利人异议即移除。
  工作区原始素材目录（`2949159595/` 等）只读保留，不随仓库发布。
- 素材 3（`2940368322`）是 Wallpaper Engine *scene* 工程（`scene.pkg` + shader），离开 WE 引擎无法直接播放；
  本插件按其「一半 MOSS／一半流浪地球」的构图逻辑，用素材 1+2 的高清视频实时合成转场（用户已确认该逻辑成立）。
- **v0.5 新增音效 `audio/moss-arm-sfx.m4a` 来自用户自制的 `带音效moss机器人.mp4` 音轨**（用户素材，已获用户
  明确要求用于本插件）；素材作者本人同意随本仓库公开分享，版权归其所有。
- 字体 JetBrains Mono：SIL OFL 1.1（`lib/assets/fonts/OFL.txt`）。BGM 为 WebAudio 实时合成。代码 MIT（`LICENSE`）。

## 9. 未验证项（诚实清单）

1. Windows 原生标题栏（WCO 三键）与本皮肤在真实 Electron 窗口里的逐帧观感（CDP 真宿主已验，原生标题栏非 DOM 无法截图断言）。
2. 低端 GPU / 4K 屏性能（v0.5 启动期 ambient 已暂停以降低并行解码；`quality=saver` / `reducedMotion` 可降级）。
3. 用户 profile（desktop / daily / immersive / high）刷新后的最终观感——已用真实 desktop 配置的 headless 页面 + 升级补播链路实测，
   但用户窗口内的真人观感（尤其 13.05–13.9 溶解与 bloom 亮度是否合口味）需用户本人确认。
4. 第三方注册主题（`ctx.theme.register`）与本皮肤叠加行为。
5. 启动音效的主观听感（离线 WAV 已做客观指标、对齐、事件时点与削波校验，未人工试听；用户实录音轨本身按用户母带保持动态）。
6. 用户原素材 `带音效moss机器人.mp4` 与 `moss-cinema` 的帧匹配仅做灰度 MAE 验证（-18 帧唯一极小值），未做逐像素色差验证。
7. 第三幕地球遮罩在极端宽高比（21:9 / 4:3）下的构图余量（已在 1536×960、1600×1020 验证，超宽屏靠 clamp 兜底）。

## 10. 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| 0.5.0 | 2026-11-09 | 用户 3 条反馈：① 幕 IV 地球从点火起持续动态（earth 短 GOP g=15 重编码 + 冷态预 seek + 点火闪光窗口延长；旧版 seek 冻结 1.9s 导致 91%→92% 静帧硬跳）② 100%→UI 交接柔化（100% 定格 0.6s + 冰白 bloom + 810ms warp 溶解 + UI 900–1150ms 分级显影 + ambient 同帧同速起播 + 17s 三层兜底）③ MOSS 机械臂音效换成用户实录音轨（-18 帧对齐，独立 arm 总线，BGM duck −6dB，缺资产回退合成层）；总时长 12.8s→13.9s；Host 半侧变更需重载宿主 |
| 0.4.0 | 2026-11-07 | 用户 5 条反馈：① 第二幕终局对焦框严格对称钉在主眼（v0.3 右偏 34.8px / 扁框 140×86 → 200×200 对称，偏差 ≤1.5px）+ 新增机械关节音效（伺服/棘轮/液压/锁止，对齐视频运动峰）② 二→三幕连续镜头（准心十字线延伸成分割线、data-wipe、接缝数据包）③ 三幕地球冷态不喷射、四幕点火才出等离子尾迹 ④ 四→UI 交接扩为 BOOT COMPLETE→冰白闪光→UI 分区显影三段式（1.6–2.0s）⑤ 红眼信号灯与输入卡四角括号呼吸幅度拉满、修复四角只看到 3 个；总时长 12.8s |
| 0.3.0 | 2026-11-07 | 用户六项反馈：红眼/输入卡四角呼吸闪烁；启动进度条与百分比统一并真正到 100%；第二幕「红色准心锁定 MOSS」五相位特效序列；重写程序化 BGM/机械音效（附可听 WAV）；修复 immersive 下所有下拉菜单错位/点不到的阻断 bug（可正常选「完全权限」「创造模式」）；升级后刷新自动重播 |
| 0.2.0 | 2026-11-06 | 四素材四幕启动动画（BCI 开幕 → MOSS 全屏 → 半 MOSS/半地球转场 → 地球全屏）；修复系统 reduced-motion 导致视频不播的根因；背景加镜头漂移；修复品牌位 slot 冲突 |
| 0.1.0 | 2026-11-06 | 首版：MOSS 550W 8.2s 启动动画 + 视频背景皮肤 + 设置页 + 品牌位 |
