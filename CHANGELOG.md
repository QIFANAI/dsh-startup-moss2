# CHANGELOG — dsh-startup-moss2

## 0.5.0-public — 2026-11-14（GitHub 无损开源 · 完整素材版）

- 公开仓库：<https://github.com/QIFANAI/dsh-startup-moss2>，tag `v0.5.0`。
- **无损 / 无阉割**：`lib/`（含 `lib/assets/earth|moss|neuro|audio` 全部视频与音效）、`docs/`（含 `docs/verify/` 验收归档）、
  `test/`、`preview/`、`locale/` 与作者本机 v0.5.0 一致；未删除任何第三方素材。
- Release 附件：`dsh-startup-moss2-0.5.0.tgz`（17,567,506 B，SHA256 `8e4b198c…`）与
  `MOSS550W·流浪地球启动动画+UI皮肤组合包.zip`（17,599,691 B，SHA256 `d77aee5f…`）。
- 口径调整（仅为公开仓库一致性）：`README.md` / `INSTALL.md` / `LICENSE` / `THIRD-PARTY-NOTICES.md` / `package.json` /
  `cordis.patch.yml` 中「不得公开分发」的旧表述改为「完整素材公开分享 + 版权归原权利人 + 异议即移除」；
  **运行时代码零改动**。详见 `docs/PUBLIC-RELEASE.md`。

## 0.5.0 — 2026-11-09（用户反馈三项 · 动态地球 + 柔化交接 + 实录音效）

用户在 v0.4 成品上给的 3 条反馈逐条落地（权威规格 `docs/design-spec-v0.5.md`）。总时长 12.80s → **13.90s**。

### 1) 幕 IV 地球从点火起就是动态的（反馈 1 的根因修复）
- **根因**：earth 素材 GOP=8.33s（仅 4 个关键帧）。10.35s 从 20.27s 回 seek 到 4.57s 时，真宿主实测 `seeked`
  事件直到 **12.24s** 才触发 → 91%（11.28s）画面仍是 20.27s 冷帧、92%（11.4s）才跳到亮帧；幕 III 的
  8.30s seek 也要 1~2s。用户看到的「在截图 2 之前都是图片」即此。
- **修复**：① earth 720/1080 重编码为**短 GOP（g=15，关键帧间隔 0.5s）+ faststart**（帧内容不变，PSNR
  720p 50.8dB / 1080p 52.1dB），seek 实测 1.4s → 10–20ms；② 幕 III 冷态帧在**媒体 load 时预 seek** 到
  20.27s，8.30 只 `play()+0.65x`；③ 点火闪光窗口 10.38–10.67 → **10.35–10.95**，覆盖 seek 完成；
  ④ `__DSH_MOSS2_EARTH_STATE__` 新增 `preSeeked/seekAt/seekedAt/seekMs/igniteSeekMs`。
- 验收：真宿主 10.60–11.80s 地球 `currentTime` 单调递增、无 >0.3s 冻结；10.90 vs 11.20 帧像素差显著；
  10.7/11.0/11.3 均为亮态+等离子尾迹。

### 2) 100% → 操作界面交接放慢/柔化（反馈 2）
- 100% 从 12.30s 提前到 **12.10s**，并**定格保持 0.60s**（12.10–12.70）。
- 12.70–13.30 冰白 **bloom**（峰值 0.86，0.32s 缓升 / 0.28s 回落），替代 v0.4 的 0.14s 硬闪。
- 13.05 起启动层 **810ms warp 溶解**（opacity 1→0 + scale 1→1.03，`cubic-bezier(.4,0,.2,1)`），
  13.90 结束；旧 12.38–12.80 的 420ms 淡出取消。
- UI 分级显影 620–760ms → **900–1150ms/段**（base 620→1250ms，13.05 与启动层同帧起跑），
  `cubic-bezier(.22,1,.36,1)`、位移 18–22px、blur 8px→0。
- **ambient 背景同步**：启动层期间 ambient 视频全程暂停并预 seek 到揭示帧（减少并行解码、避免交接冻结）；
  揭示时刻与启动层地球**同帧同速起播**；`done/fallback/watchSplashDone/15.5s` 四路兜底强制放行；
  只读探针 `__DSH_MOSS2_AMBIENT_HANDOFF__`（6 字段）。
- 三层兜底同步 17000ms：宿主 BOOTSTRAP_JS / splash HARD_STOP / client 自举；宿主兜底变更需重载宿主。

### 3) MOSS 机械臂音效换成用户实录音轨（反馈 3）
- 用户素材 `带音效moss机器人.mp4`（4K HEVC / 30fps / 6.207s）与本项目 `moss-cinema-720.mp4` 同源同构图：
  192×108 灰度帧匹配唯一极小值 **-18 帧 = -0.600s**（mae 4.43 vs 次优 5.15）→ 用户音轨 [0.600, 5.000]
  与幕 II 绝对 [3.90, 8.30] 逐帧对齐。
- 新增资产 `lib/assets/audio/moss-arm-sfx.m4a`（AAC-LC 48k 立体声 128k / 4.40s / 72,507B / 峰值 -1.9dBFS，
  20ms 首淡入 + 50ms 尾淡出，保持用户原始动态不做响度归一）。
- 删除 v0.4 程序化 MOSS 关节/伺服/rumble 合成层（与运动无关），由该音轨接管 3.90–8.30；
  解码失败回退旧合成层（`MOSS_ARM_FALLBACK`，不静默）；BGM/其它幕音效时间不变。
- 探针：`__DSH_MOSS2_AUDIO_STATE__.armSfx`（6 字段）+ `__DSH_MOSS2_AUDIO_EVENTS__` 增 `arm-sfx` 事件；
  离线渲染 `_work/v05/audio/moss2-boot-audio-v05.wav`（13.90s）与频谱/相关性证据。

### 其它
- 地球视频在 UI 环境改为「启动层期间暂停、揭示时起播」，降低启动期并行解码压力。
- `lib/index.js`：新增音频资产白名单 + BOOTSTRAP 兜底 17000ms；`package.json` 0.5.0。
- 测试：5 套 smoke 全部更新到 v0.5 契约；新增 `_work/verify5/` 场景矩阵与独立验收器、`docs/verify/v5/`。
- **生效方式变化**：v0.5 改了 `lib/index.js` 与 `lib/client.js` → 需**完全退出 DSH（含托盘）重开**；
  升级后首次加载会因 `SPLASH_REV=v0.5-r1` 自动补播一次。

## 0.4.0 — 2026-11-07（用户反馈五项 · 对焦版）

用户在 v0.3 成品上给的 5 条反馈逐条落地（权威规格 `docs/design-spec-v4.md`）。总时长 11.80s → **12.80s**。

### 1) 第二幕终局「对焦」+ 机械关节音效
- **根因修复**：v0.3 的四角收敛框实测是 140.4×86.2px 扁框、框心右偏 34.8px / 下偏 9.7px（1536×960）。
  v0.4 新增 `.ms-tgt-focus` 对称聚焦框：四角以 `computeEyePoint()` 为几何中心、正方形 200×200（1536×960），
  7.42–8.06s 收口（1.16×→1.00×）+ 7.62–7.72 过冲回落 + 7.78 后完全静止；逐帧偏差 ≤1.5px（7.42 帧因收口起始
  允许 2.5px，7.6+ ≤1.5px）。旧 `.ms-gaze-corner`/`.ms-tgt-corner` 旧框在锁定后隐藏，不再叠出两套框。
- 主眼坐标按视频分析修正 `EYE=(0.3758,0.5384)`；红眼点亮时间修正为 t=7.16（视频本地 3.267s）。
- **机械关节音效**：内联 MOSS 视频逐帧运动包络（150 帧 @30fps，whole-frame + arm 区域），重做第二幕 SFX：
  伺服电机层（随运动包络起伏、峰值 0.030–0.038）、齿轮棘轮 + 金属关节 + 液压泄压事件（≥6 个，落在
  4.10/4.43/4.60/4.73/5.05/5.55/6.30/6.48 附近）、7.16 眼点亮的镜头对焦伺服音、7.42 锁扣二段。
  新增只读探针 `__DSH_MOSS2_AUDIO_EVENTS__`；离线 WAV 二次分析验证关节事件峰值高出局部床 ≥8dB。

### 2) 第二 → 第三幕连续转场
- 8.06–8.30s：准心十字线向屏幕四边延伸、颜色由红转冰白，对焦框四角 fly-out 成为下一幕画面角标；
  8.30 分割成立时闪白改为 0.10s / 峰值 0.30（不再是硬切大白闪）。
- 分割线由中心向上下 `scaleY 0→1` 画出；左半 MOSS 冻结 + 降饱和压暗；右半地球以 data-wipe 扫描带显影；
  接缝新增 3 个数据包由 MOSS 侧流向地球侧；9.82s 起右幕 `ENGINE IGNITION / 引擎点火` 预告。
- 幕 III 时长 1.90s → 2.05s。

### 3) 第三幕地球冷态 / 第四幕点火
- 视频分析确认 30s 素材全程带等离子尾迹（无天然无喷射段）→ 幕 III 用**圆形遮罩**只留「静默行星 + 大气边缘」，
  构图移到右半屏内（scale/translate 逐帧计算），冷调色（brightness 1.30 / saturate .78）；
- 幕 IV 10.35s 点火：遮罩半径连续放大到全屏 + 冰蓝点火闪光（峰值 0.92/0.14s）+ 2 个扩散光环 +
  曝光拉升到 ambient 同参（brightness 1.75 / saturate 1.22），同时 seek 到最亮喷射段 4.57s（playbackRate 1.0）；
  11.55 armHandoff 时地球 currentTime ≈5.77s（仍在最亮段），11.80 后不再改地球层 transform/filter；
- 新增只读探针 `__DSH_MOSS2_EARTH_STATE__`；像素断言：t=9.4/10.2 无喷射、t=10.6+ 喷射出现（≥1.8x）。

### 4) 第四幕 → UI 交接（三段式）
- 11.80–12.30：`BOOT COMPLETE` 印章 + HUD 收束（四角/标尺 fly-out、顶栏/页脚位移淡出）、
  进度条 12.30 到 100% 完成态；11.80 派发 `dsh-moss2:handoff` 事件。
- 12.30–12.52：冰白闪光（峰值 0.92）换场；12.38 起启动层 420ms 淡出、12.80 finish。
- skin 侧：`dsh-moss-enter` 重写为 1.6–2.0s 分级显影（侧栏/顶栏/主列/输入卡/装饰错峰 + blur 6px→0），
  背景 ambient 不二次淡入；client 监听 handoff 事件 → `enterUI(2000)`。

### 5) 皮肤呼吸幅度拉满 + 四角修复
- 品牌红眼：halo/ring/core/glint 的亮度、光晕、缩放、双击幅度全面加大，并新增 `.dsh-moss-brandmark-wrap::before`
  红色光晕层；输入卡四角括号：线宽 1px→2px、臂长 14→18px、α .50→.92、呼吸 .22↔1.0 + 光晕 0→14px、6.4s 双击。
- 「四角只看到 3 个」根因：右下角与宿主蓝色发送按钮几何重叠 + v0.3 谷值亮度过低。已提高 z-index/幅度并逐角断言
  四角齐全（每角红色像素 ≥6、谷峰亮度差 ≥30%）。
- 动效策略不变：显式 `reducedMotion`/saver 才停，系统 `prefers-reduced-motion` 不停；闪烁 ≤3Hz。

### 工程
- 版本 0.4.0；`SPLASH_REV='v0.4-r1'`（升级后刷新自动补播一次）；客户端自举兜底 13s→14s；`lib/index.js` 未改（无新资产）。
- 新增 `docs/design-spec-v4.md`、`_work/v04/assets-analysis/`（视频逐帧运动/等离子分析）、`_work/verify4/` 验收器；
  5 套 smoke 测试同步到 v0.4 契约；重构 `_work/demo/` 音频与演示脚本到 12.8s。
- MOSS 视频元素红线继续遵守：`src/currentTime/playbackRate/filter/transform` 一律不动。

## 0.3.0 — 2026-11-07（用户反馈六项 · 打光版）

用户在 v0.2 成品上给的 6 条反馈逐条落地（权威规格 `docs/design-spec-v3.md`）。

### 1) 品牌红眼「信号灯」呼吸闪烁
- 空态 hero 品牌徽标（MOSS 红眼 inline SVG，34px）与侧栏品牌位（20px）的红环/红点/白高光加呼吸 + 双击闪烁：
  红环 3.2s 呼吸 + `drop-shadow` 光晕 2→8px，红点 2.6s 呼吸，每 7.5s 一次信号灯双击。
- 只由显式 `reducedMotion=true`（`--calm`）/`--static` 停止；系统 `prefers-reduced-motion` **不**停
  （本机 Windows 关系统动画恒报 reduce，v0.1 的失败根因；此效果是用户点名要的）。

### 2) 输入卡四角括号呼吸闪烁
- `[data-composer-card]` 四角括号（含用户框出的左上/右上/左下）3.6s 呼吸 + 每 5.4s 快速双击闪烁；
  focus 时在呼吸基础上加强亮度，不写死 opacity；`--calm/--static` 停，系统 reduce 不停。

### 3) 启动进度条与数字百分比逻辑统一
- 单一真值 `bootProgress(t)`：百分比数字、填充光条 `scaleX`、光点位移三者同值；光点用实测轨道宽度
  （不再用固定 `frameW`）。
- 进度条+百分比从幕 II HUD 移到全局固定层：4.36→11.0s 持续可见，**11.0s 恰好 100%** 并显示
  `BOOT COMPLETE / 加载完成` 完成态，11.0–11.8s 保持 100% 淡出（v0.2 是 8.1s 就随幕 II 消失、永远到不了 100%）。
- 跳过路径进度不反向。

### 4) 修复 immersive 下所有下拉菜单错位/点不动的根因
- 根因：`lib/skin.css` 旧 §5.10 用 `:where([role="menu"],[role="listbox"]) { position: relative }` 给浮层
  角括号做定位上下文，覆盖了宿主 portal 的 `position: fixed` → 下拉菜单掉进 document 流、出现在视口下方
  ~433px、`scrollHeight` 1020→1597/1792、欢迎页内容上移错位、菜单点不到（无法选工作区/模式/权限/模型）。
- 修复：删除该定位覆盖；角括号改为画在菜单表面 + 宿主 `._material` 子层的 4 层 `background-image`
  （只写 `background-*`，不碰 position/inset/display/z-index）。immersive 下工作区/模式/模型/权限/账号菜单
  全部 `fixed` 于触发点附近、`scrollHeight` 恒 1020、可点选「完全权限」「创造模式」。
- 回归守门：`test/smoke-css-regress.mjs` 断言 menu/listbox/dialog 规则不得含布局关键属性。

### 5) 第二幕「红色准心锁定 MOSS」完整特效序列
- 新增 `search → capture → track → converge → maintain` 五相位：全屏网格、红色扫描线、四角捕获框、
  假目标闪灭、准心沿路径移动并收敛到 MOSS 主眼、7.42s 锁定冲击波 + 轻微震动 + `LOCKED · 550W` 印章，
  锁定后维持扫描/数据流/能量驱动红色 rim。第二幕成为视觉最重的一幕。
- MOSS 视频元素 `src/currentTime/playbackRate/filter/transform` 一律未动（特效全为叠加层）；
  主眼坐标复用 `EYE={x:.3740,y:.5380}` + `computeEyePoint()`；运动能量包络取自
  `_work/assets/moss-motion.json`（150 帧 @30fps，内联常量驱动呼吸/抖动）。
- `--calm` 只保留核心锁定；系统 reduce 保留叙事、闪烁 ≤3Hz。

### 6) 程序化 BGM + 音效（重点第二幕 MOSS 机械感）
- 分层 BGM：48/96/55Hz sub drone + D 小调 pad，3.90s 硬切 duck，第 IV 幕转 F 大调解决；
- 事件化 SFX：幕 I BCI/打字/电弧；幕 II 伺服 whir、液压嘶声、机械卡扣、准心收敛音、锁定重音
  （sub 冲击 + 金属咔哒 + 高频三连 beep + ringing）并与 MOSS 运动能量包络同步；幕 III whoosh/riser；
  幕 IV 温暖 pad + 行星轰鸣；主链 DynamicsCompressor + 限幅，skip/finish/dispose 300ms 淡出。
- 新增可听证据：`_work/demo/moss2-boot-audio.wav`（11.8s / 44.1k / 16bit / 立体声，由
  `_work/demo/render-audio.mjs` 用 OfflineAudioContext 渲染同一份 `buildAudioGraph`）。

### 升级即重播
- `client.js` 引入硬编码构建标记 `SPLASH_REV='v0.3-r1'`：升级后**只刷新页面**就自动补播一次 v0.3 启动动画
  （真宿主首屏由旧版 `lib/index.js` 决策、不认新标记，故 client 侧用 `__DSH_MOSS2_REPLAY__` 补播并写回标记），
  之后按 session/daily 原有语义。**不需要重启宿主**。

### 工程
- 版本 0.3.0；新增 `test/smoke-css-regress.mjs`（12 项 CSS/JS 回归守门，含反向验证）并入 `npm test`；
- 新增 Lead 独立验收器 `_work/ui/accept-v3.mjs`（splash/ui/motion 场景，含进度同步、锁定位置、菜单布局、
  呼吸动效两帧亮度差、系统 reduce）；验收证据归档 `docs/verify/v3/`；
- 未改动 `lib/index.js` 资产白名单/路由（无新资产），客户端文件刷新页面即生效。

## 0.2.0 — 2026-11-06（四素材叙事版 · 重做）

### 启动动画（11.8 秒 · 四幕）
- **幕 I 神经接口（0.5–3.9s）**：`2992034258` 脑机接口概念面板视频（源 20.80→24.20s）慢推 + 暗化，
  DeepSeek Harness 品牌开幕（大字标 clip-path 揭幕 + 扫光）、`NEURAL INTERFACE · 神经接口`、启动日志、`LINK 08→100%`；
  末尾利用素材自带故障闪光作为切入 MOSS 的剪辑点。
- **幕 II MOSS 苏醒（3.9–8.1s）**：`2926246706` MOSS 机器人实拍视频（源 0.60→5.60s）**全屏**播放，
  镜头从机械细节拉开到红色主眼；`550W` / `MOSS SYSTEM · 中国航天局量子计算机` / 启动日志 / 真实遥测 /
  `INITIALIZING` / 红眼准星锁定 / `MOSS 已上线` + 引文「让人类永远保持理智，确实是一种奢求。」。
- **幕 III 转场（8.1–10.0s）**：复刻 `2940368322`「一半 MOSS／一半流浪地球」构图——左半 MOSS、右半地球的竖分割，
  接缝高光 + 数据刻线，8.9s 起接缝左扫、地球展开全屏。
- **幕 IV 流浪地球（10.0–11.8s）**：`2949159595` 地球推进器视频全屏；10.6s `armHandoff` 与 UI 背景层同帧交接，
  11.0s 启动层淡出，UI 900ms 分区显影。地球层与 ambient 层同资产、同裁切，交接无跳帧。
- 零点击自动播放；`Esc` 跳过（跳到地球幕）；13.0s 硬兜底；WebAudio 程序化音效（失败静默）；资源 404 兜底。
- **修复根因**：视频播放不再受系统 `prefers-reduced-motion` 影响（本机 Windows 关闭系统动画，v0.1 因此真机上
  MOSS 与地球视频都不播放，只显示静态海报）。`reducedMotion=true` 现在只减弱装饰动效。

### UI 皮肤 / 动态背景
- 修复「真机上背景不动」：运动策略改由插件配置决定，视频常播；新增 `moss-bg-drift` 44s 极慢镜头漂移（幅度 ≤2.5%）。
- 新增 `armHandoff(t)` 交接 API：启动层退出前把真实背景层 seek 到同一帧，实现无跳帧交接。
- 修复品牌位 slot 冲突（`sidebar.brand.mark` 已被其他插件注册）：try/catch + 优先级降级，不再抛未捕获异常。

### 资产
- 新增 `neuro/neuro-boot-{1080,720}.mp4` + poster；`moss/moss-cinema-{1080,720}.mp4` + poster；
  earth 1080/720 沿用 v0.1 已验证 30.00s 无缝循环；manifest 与 assets-report 重写。
- 删除 v0.1 小圆窗方案资产 `moss/moss-eye-720.mp4` / `moss/moss-eye-poster.webp`。

### 工程
- 版本 0.2.0；Host 资产白名单、首屏自举（13000ms 硬兜底 / 运动策略）同步更新；
- 真宿主验收：隔离 DSH Host（profile `verify`）+ headless Chrome CDP 场景矩阵（normal / 系统 reduce / skip / 404 / saver / 沉浸档）；
- 演示视频 `_work/demo/moss2-boot-demo.mp4`；预览页支持分幕跳转与重播。

## 0.1.0 — 2026-11-06

首版：MOSS 550W · 流浪地球主题（DSH 启动动画 + UI 皮肤）。

### 启动动画
- 8.2 秒 MOSS/550W 开机序列：黑场红点呼吸 → 红点炸开 IRIS → 圆窗 MOSS 红眼视频 → 双环刻度旋转 →
  等宽启动日志逐行 → 进度条/百分比 → 真实遥测（PROFILE / WORKSPACE / MODEL / SESSIONS）→
  `MOSS 已上线` + 引文 → 红色扫描收束 → 900ms 分区显影交接。
- 零点击自动播放；`Esc` 可跳过（可关）；首帧纯 CSS 即时可见，不等待任何网络资源。
- WebAudio 程序化开机声（低频底 + 提示音 + 收束扫频），无音频文件依赖；不可用时静默降级。
- 资源缺失兜底：海报 404 → 纯 CSS 深空；视频 404/解码失败 → CSS/SVG 红眼；字体 404 → 系统等宽。
- `prefers-reduced-motion` / 用户「减弱动态」→ 3 秒纯淡入淡出版。

### UI 皮肤
- **动态视频背景**：地球循环视频（1080p / 720p 两档）+ 海报首屏兜底，双层压暗（中心轻/四角重）+ 暗角 + 颗粒；
  视频失败/节能档/减少动态时停在海报帧，**不退化纯色**。
- 深空玻璃：侧栏 / 主列 / 输入卡 / 浮层半透明 + `backdrop-filter`；MOSS 红只用于「凝视/在场/告警」。
- HUD：顶栏 `550W · MOSS ｜ 时钟 ｜ 系统在线` 遥测章、当前会话红刻线、输入卡四角括号、代码块等离子轨、
  空态 MOSS 引文、侧栏品牌位与空态品牌位换成 MOSS 红眼（inline SVG）。
- 三档：`off` / `glass`（默认）/ `immersive`；浅色宿主强制深色驾驶舱（皮肤设定）。
- 降级矩阵：`saver` 画质 / `prefers-reduced-motion` / `--noblur` / 页面隐藏暂停 / 视频失败。
- 设置页：播放（开关/时机/Esc/声音/音量）+ 皮肤档位 + 背景画质/压暗/模糊/减弱动态；保存即时生效；恢复默认。

### 工程
- Host：`/dsh-moss2` 下 6 条路由（config / skin.css / splash.css / splash.js / preview / asset 白名单 + Range 206）、
  `webServer.tapIndex` 首屏注入、facts 采集、配置原子写（`~/.dsh/dsh-startup-moss2.json`）。
- Client：`window.__ModuleLoader__` 插件契约，皮肤应用 / 背景视频生命周期 / 启动层自举 / 设置页 / 品牌位 slot。
- 预览页：`/dsh-moss2/preview`（皮肤三档 + veil/blur + 启动动画重播 + 空态/会话态切换）。
- 测试：`test/smoke-{host,assets,splash,client}.mjs`。
- 宿主测绘：DSH 0.2.2-rc.1，60 条断言全绿（`docs/verify/host-assertions.md`）。
- 素材：Wallpaper Engine 第三方素材，仅本机自用；字体 JetBrains Mono (OFL 1.1)。

### 已知限制
- 浅色宿主同样为深色驾驶舱（设计设定）。
- 与上一代启动插件互斥（同一 profile 只启用一个）。
- 见 `README.md` §8「未验证项」。
