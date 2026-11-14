/* ============================================================================
 * dsh-startup-moss2 v0.5 — 启动层运行时「四素材 · 四幕叙事」
 * ----------------------------------------------------------------------------
 * 权威依据：docs/design-spec-v0.5.md（v0.5 唯一增量权威源：§2 幕 IV 地球动态化 /
 *          §3 交接柔化）；v0.4 基线（时间线 / 终局对焦 / 二→三幕连续转场 / 冷态地球
 *          与点火 / 三段式交接）见 docs/design-spec-v4.md，冲突以 v0.5 为准；
 *          素材映射 / DOM/API 见 docs/design-spec-v2.md，进度 / 音频 / 皮肤见 v2/v3。
 *
 * 总时长 13.90s（±0.05s），四幕边界 0 / 0.50 / 3.90 / 8.30 / 10.35 / 11.95 / 13.90：
 *   0.00–0.50  黑场：左下冰白细线左→右扫过 + DEEPSEEK HARNESS 微字标
 *   0.50–3.90  I   神经接口：neuro-boot 视频（0→0.92 淡入，1.04→1.14 慢推）
 *                  + DEEPSEEK HARNESS 大字标（clip 揭开 + 扫光）+ NEURAL INTERFACE
 *                  · 神经接口 + BCI-1 + 3 行打字日志 + LINK 08→100% 进度环
 *                  + 3.50 起素材自带故障闪光（3.74–3.82 为主闪光）
 *   3.90–8.30  II  MOSS 苏醒：moss-cinema 全屏（镜头拉开→红眼点亮→锁定）
 *                  + 550W / MOSS SYSTEM / 中国航天局 · 量子计算机 + 右侧启动日志
 *                  + 左下真实遥测 + 7.10 起红色凝视准星锁定主眼 + MOSS 已上线 + 引文
 *                  + 第二幕特效序列（全部为叠加层，不触碰 MOSS 视频）：
 *                    3.90–4.30 红色边缘辉光 + 全屏细网格 + TARGET SEARCH
 *                    4.30–5.20 4 角括号飞入 + 红色扫描线 + 3 个假目标闪灭
 *                    5.20–6.50 准心从右下弧线跟踪主眼 + 8 段刻度环 + 坐标/DIST/LOCK
 *                    6.50–7.42 角括号向主眼收缩 + 十字线加长 + ACQUIRING + 能量脉冲
 *                    7.16–7.42 红眼点亮 + 锁定收口 + 双冲击波 + ±2px 震动 + LOCKED
 *                    7.42–8.06 终局对焦（v0.4 §3.1：.ms-tgt-focus 四角对称框，几何
 *                    中心严格 = computeEyePoint()，收口 1.16→1.00 + 过冲回落后静止）
 *                    7.78–8.30 锁定维持 + 准心十字线延伸成分割线（§4 预转场）
 *   8.30–10.35 III 转场：中央竖分割，左 MOSS / 右地球（冷态、无等离子尾迹）
 *                  8.30–8.62 分割线由中心向上下画出（scaleY 0→1）+ 右幕 data wipe
 *                  9.12–9.90 接缝数据包 ×3 循环 2 次；9.82 点火预告；10.02 接缝左扫
 *                  （v0.5 §2：地球在媒体 load 时预 seek 到 coldAt=20.27，8.30 只 play + 0.65x）
 *   10.35–11.95 IV 地球：10.35 点火（seek 4.57 + 闪光窗口 10.35–10.95 + 尾迹 + scale→1.13），
 *                  11.55 armHandoff(预测揭示帧)，11.80 后地球层 transform/filter 冻结
 *   11.80–13.90 交接（v0.5 §3.1 柔化）：
 *                  11.80 BOOT COMPLETE 印章 + HUD 收束（派发 dsh-moss2:handoff）
 *                  12.10 进度 100%，12.10–12.70 定格保持（0.60s）
 *                  12.70–13.30 冰白 bloom（峰值 0.86，13.02 转折，13.30 回落）
 *                  13.05–13.86 启动层 warp 溶解 810ms（opacity 1→0 + scale 1→1.03）
 *                  13.90 finish()（移除根、清理媒体/音频/监听、dsh-moss2:done）
 *
 * v0.5 §1.1 进度契约（单一真值，与 v0.3/v0.4 同构）：
 *   - bootProgress(t) ∈ [0,1] 单调不减；4.36s 起进度条 + 百分比移入
 *     .ms-global-hud 固定层持续可见；12.10 到 100%；12.10–13.90 保持完成态随根层溶解。
 *   - pct 数字 / .ms-progress-fill 的 scaleX / .ms-progress-spark 的 translateX
 *     全部由同一个量化后的 progress 驱动；光点位移用实时实测 trackWidth
 *     （el.progress.clientWidth），不再用 boot 时的 frameW。
 *   - 完成态：.ms-pct[data-complete="1"] + 文案 BOOT COMPLETE / 加载完成。
 *   - 跳过路径：ESC → 直接到 10.35（幕 IV 点火前），进度落 bootProgress(10.35)≈0.83。
 *
 * 硬性红线（v0.2 真机失效根因修复，v0.3 延续，v0.4 不变）：
 *   **视频播放永远不受 prefers-reduced-motion 影响。** 本机 Windows 已关系统动画，
 *   Chromium 因此报 reduce；v0.1 据此降级 → 真机上 MOSS / 地球视频都不显示。
 *   本文件【完全不读取】prefers-reduced-motion 来决策任何画面；只有配置
 *   reducedMotion=true（用户显式开启）才加 .ms-calm 减少装饰动画，视频照播、
 *   时间线仍 13.90s、MOSS 与地球均可见。
 *   v0.3 §5 / v0.4 §4 要求的「系统 reduce 下闪烁频率 ≤3Hz」按**全局设计上限**实现：
 *   本文件所有闪烁/脉冲/扫描的频率均 ≤3Hz（含准心呼吸、假目标闪灭、锁定脉冲、
 *   对焦框 glow 呼吸、接缝数据包），因此无需读取系统偏好即可同时满足两条红线。
 *
 * §5 铁律：video[data-act="moss"] 的 src / currentTime / playbackRate / filter /
 *   transform 一律不动（只有 opacity 淡入）。所有第二幕新特效都是叠加层
 *   （CSS/SVG/DOM，pointer-events:none），主眼坐标复用 EYE + computeEyePoint()。
 *   v0.4 新增：终局对焦框 .ms-tgt-focus 四角几何中心逐帧严格对齐主眼（§3.1）。
 *
 * 契约（§6）：
 *   - #dsh-moss-root（Host 注入，本文件填充内容），z-index 2147483000
 *   - DOM：.ms-stage / .ms-act.ms-act--neuro|moss|earth / .ms-video[data-act] /
 *     .ms-veil / .ms-hud / .ms-split(.ms-split__moss|__earth|__seam|__corner×4|
 *     __wipe|__packet×3) / .ms-global-hud
 *     v0.3：.ms-bottom/.ms-pct 移入 .ms-global-hud（class 名不变）；
 *     .ms-tgt-layer(.ms-tgt-grid/.ms-tgt-scan/.ms-tgt-corner×4/.ms-tgt-ghost×3/
 *     .ms-tgt-reticle/.ms-tgt-data) / .ms-lock-shock×2 / .ms-moss-vignette
 *     v0.4 新增：.ms-tgt-focus(.ms-tgt-focus__corner×4/__tick×4/__ring) /
 *     .ms-boot-stamp / .ms-ignite-flash / .ms-ignite-burst×2 / .ms-earth-plume-cover
 *   - window.__DSH_MOSS2_SPLASH__ = { version, state, duration, phases }（对象；
 *     另发 __DSH_MOSS2_SPLASH_STATE__ 别名，绝不置 false）
 *   - window.__DSH_MOSS2_REPLAY__ = fn；__DSH_MOSS2_SKIP__（未播放时 true）
 *   - window.__DSH_MOSS2_API__ = 与 client 合并写（属性描述符合并，保 getter 实时性）
 *   - API：skip / finish / replay / freeze / dispose / state / progress / reduced / duration
 *   - 11.55s 调 __DSH_MOSS2_API__.armHandoff(tPred, {revealIn:1.5})（不存在则静默跳过）
 *     tPred = 启动层地球 currentTime + (13.05-11.55)*playbackRate（预测揭示帧）
 *   - 11.80s 派发 window CustomEvent('dsh-moss2:handoff', {detail:{at:11.8,
 *     revealAt:13.05,fadeAt:13.05,duration:13.9,earthAt:<预测 currentTime>}})
 *     （skin/client 监听 → 排期 ambient 揭示；未收到则保留 dsh-moss2:done 兜底）
 *   - 17.0s 硬兜底；dispose / replay 幂等；资源 404 → 海报 / 纯 CSS 兜底
 *   - saver 档不加载任何视频（只用 poster）；WebAudio 失败静默
 *   - v0.3/v0.4/v0.5 只读探针：__DSH_MOSS2_PROGRESS__ / __DSH_MOSS2_LOCK__
 *     （含 focus:{x,y,half,w,h,aligned}）/ __DSH_MOSS2_AUDIO_STATE__ /
 *     __DSH_MOSS2_BUILD_AUDIO__ / __DSH_MOSS2_EARTH_STATE__
 *     （v0.5 增 preSeeked/seekAt/seekedAt/seekMs/igniteSeekMs）/
 *     __DSH_MOSS2_HANDOFF__（v0.5 增 revealAt/fadeAt/duration/earthAtPred）
 *
 * §6 音频：
 *   - buildAudioGraph(ctx, opts) 同时支持 AudioContext 与 OfflineAudioContext；
 *     分层 BGM（48/96 sub + 55/110 极低音 + D 小调 pad → 10.35 F 大调解决）
 *     + v0.4 事件化机械关节 SFX（伺服电机层 + 齿轮棘轮 + 金属关节 + 液压泄压，
 *     由 moss.json 的 motion.full / motion.arm 导数峰与 keyEvents 驱动，≥6 事件）
 *     + DynamicsCompressor / 软限幅兜底；任何失败静默降级。
 *   - 第二幕 SFX 峰值显著高于 v0.3（伺服 0.030–0.038、关节事件 0.030–0.055）。
 *   - skip / finish / dispose 300ms 淡出后 close()。
 *   - 离线渲染入口：window.__DSH_MOSS2_BUILD_AUDIO__（_work/demo/render-audio.mjs 用）。
 *
 * QA：
 *   - window.__DSH_MOSS2_API__.freeze(t) 定格；freeze(true/false) 冻结/恢复
 *   - window.__DSH_MOSS2_PREVIEW_T__ 或 ?t=<秒> 直接定格在该相位
 *   - window.__DSH_MOSS2_DEBUG__ 只读探针（视频状态/计时器/监听器/音频节点）
 * ========================================================================== */
(function () {
  'use strict'

  if (window.__DSH_MOSS2_BOOTED__) return
  window.__DSH_MOSS2_BOOTED__ = true

  /* ══════════════════════════════════════════════════════════════════════
   * 0. 契约常量 / 时间线（唯一真值，render 与 milestone 共用）
   * ══════════════════════════════════════════════════════════════════════ */
  var ROOT_ID = 'dsh-moss-root'
  var HTML_LOCK = 'moss-lock'
  var HTML_ENTER = 'dsh-moss-enter'
  var DURATION = 13.9             /* v0.5 §1：总时长 13.90s */
  var DURATION_MS = 13900
  var HARD_STOP_MS = 17000        /* v0.5 §5：splash 内部兜底（index/client/splash 三层 17000 一致） */
  var FADE_MS = 810               /* v0.5 §1/§3.1：13.05 起 warp 溶解 810ms */
  var FADE_AT = 13.05             /* v0.5 §1：溶解起点（= revealAt） */
  var ARM_AT = 11.55              /* v0.4 §2.1：armHandoff（真实 ambient 与启动层地球同帧） */
  var REVEAL_IN = 1.5             /* v0.5 §3.3：armHandoff(t, {revealIn:1.5}) = 13.05-11.55 */
  var SKIP_AT = 10.35             /* v0.4 §2.1：Esc 跳过 → 幕 IV 起点（点火前） */
  var SKIP_FADE_MS = 400          /* §4：跳过 400ms 淡入 */
  /* v0.5 §1.1 进度契约：4.36 出现 → 12.10 到 100% → 12.10–13.90 完成态随根层溶解 */
  var PROGRESS_SHOW = 4.36
  var PROGRESS_KNEE = 10.35       /* 跳过相位对应的名义进度（点火前） */
  var PROGRESS_END = 12.10        /* §1.1：t=12.10 时 progress=1 */
  var PROGRESS_NOMINAL = 12.8     /* 名义时间线 12.80s（0–10.35 线性段分母，v0.5 保持曲线不变） */
  var HANDOFF_EVENT = 'dsh-moss2:handoff'  /* v0.5 §3.3：11.80 派发，client 侧排期揭示 */
  var AUDIO_FADE = 0.3            /* §6：skip/finish/dispose 300ms 淡出 */

  /* 资产基址 / 版本：spec §6「ASSET_BASE + …?v=VERSION」 */
  var injected = (window.__DSH_MOSS2__ && typeof window.__DSH_MOSS2__ === 'object') ? window.__DSH_MOSS2__ : {}
  var ASSET_BASE = (typeof injected.assetBase === 'string' && injected.assetBase) ? String(injected.assetBase) : '/dsh-moss2/asset/'
  if (ASSET_BASE.charAt(ASSET_BASE.length - 1) !== '/') ASSET_BASE += '/'
  var VERSION = (injected.version !== undefined && injected.version !== null && String(injected.version) !== '')
    ? String(injected.version)
    : ((window.__DSH_MOSS2_VERSION__ !== undefined && window.__DSH_MOSS2_VERSION__ !== null) ? String(window.__DSH_MOSS2_VERSION__) : '0.0.0')

  /* 时间线（秒）——全部写在这里，render 只消费；v0.5 §1 唯一真值（13.90s） */
  var TL = {
    proEnd: 0.50,
    /* 幕 I（与 v0.3 完全一致，§2.1「幕 I 其余时间点不变」） */
    neuroIn: 0.50,
    neuroFadeEnd: 1.18,
    neuroPushEnd: 3.90,
    neuroTag: [0.90, 1.30],
    neuroTitle: [1.05, 1.72],
    neuroShine: [1.38, 2.30],
    neuroSub: [1.74, 2.14],
    neuroLogStart: 1.90,
    neuroLogStep: 0.36,
    neuroLogType: 0.30,
    neuroLink: [2.14, 2.50],
    neuroLinkFill: [2.20, 3.76],
    glitchStart: 3.50,
    /* 硬切 */
    cut: 3.90,
    flashEnd: 3.99,
    /* 幕 II（3.90–8.30） */
    mossIn: 3.90,
    mossFadeEnd: 4.48,
    mossTitle: 4.16,
    mossLogStart: 4.32,
    mossLogStep: 0.27,
    mossTel: 4.62,
    mossBar: 4.36,
    gazeIn: 7.16,                 /* v0.4：红眼本地 3.267s（moss.json eyeMedian）点亮 */
    gazeLock: 7.42,
    online: 7.46,                 /* v0.4：锁定（7.42）之后才「MOSS 已上线」（Lead 复核节奏） */
    quote: 7.55,
    mossHudOut: [8.02, 8.26],
    /* v0.4 §3：第二幕红色准心锁定 + 终局对焦（MOSS 视频本地时间 = t-3.90） */
    tgtGrid: [3.90, 4.30],
    tgtCapture: [4.30, 5.20],
    tgtTrack: [5.20, 6.50],
    tgtConverge: [6.50, 7.42],
    tgtLock: [7.42, 7.78],        /* 冲击波 / 印章 / 震动 */
    tgtFocus: [7.42, 8.06],       /* 新增：终局对焦行程（收口 + 过冲回落 + 静止） */
    tgtMaintain: [7.78, 8.20],    /* 锁定维持（呼吸 / 数据流） */
    tgtOut: [8.14, 8.34],
    /* 幕 II→III 连续转场（v0.4 §4） */
    mossSplitPrep: [8.06, 8.30],  /* 准心十字线延伸 → 分割线 */
    split: 8.30,
    splitFlashEnd: 8.44,          /* 0.10s 峰值 0.30 的冰白闪（不再硬切大白闪） */
    splitSeamDraw: [8.30, 8.62],  /* 分割线由中心向上下画出 */
    splitLabelL: [8.62, 8.94],
    splitLabelR: [8.76, 9.08],
    handover: [9.12, 9.46],
    handoverOut: [9.98, 10.18],
    engineHint: [9.82, 10.18],    /* 右幕「ENGINE IGNITION / 引擎点火」预告 */
    sweep: [10.02, 10.35],        /* 接缝向左扫、地球展开 */
    splitOut: [10.32, 10.44],
    /* 幕 IV（10.35–11.95） */
    earth: 10.35,
    ignite: [10.35, 10.95],       /* 点火：冰蓝闪光 + 尾迹进入画面 + scale→1.13 */
    earthCap: [10.72, 11.12],
    earthMark: [10.98, 11.36],
    earthPushEnd: 11.80,          /* 地球 scale 1.30→1.13 缓慢推近 */
    /* 交接（v0.5 §3.1 柔化，11.80–13.90） */
    arm: ARM_AT,
    preHandoff: [11.70, 11.95],
    bootComplete: [11.80, 12.10], /* 段 1：BOOT COMPLETE 印章 + HUD 收束 + 进度 100% */
    handoffFlash: [12.70, 13.30], /* 段 2：冰白 bloom（12.70→13.02 升到 0.86 → 13.30 回落） */
    fade: FADE_AT,                /* 段 3：13.05 启动层 warp 溶解 810ms */
    done: DURATION
  }

  var PHASES = [
    { id: 'prologue', label: '黑场', from: 0, to: TL.proEnd },
    { id: 'neuro', label: 'I 神经接口', from: TL.neuroIn, to: TL.cut },
    { id: 'moss', label: 'II MOSS 苏醒', from: TL.mossIn, to: TL.split },
    { id: 'split', label: 'III 转场', from: TL.split, to: TL.earth },
    { id: 'earth', label: 'IV 流浪地球', from: TL.earth, to: TL.preHandoff[1] },
    { id: 'handoff', label: '交接', from: TL.preHandoff[1], to: TL.done }
  ]

  /* v0.4 §5：地球冷态/点火段几何与调色（Lead 2026-11-07 实测 earth.json 结论）：
   *   - 30s 素材全程有等离子尾迹（最暗段也只是最亮的 ~19%）→ 幕 III 用「圆形遮罩
   *     只留行星 + 大气边缘」方案，不靠换时段；
   *   - 视频 1920×1080，行星圆盘中心 ≈ (0.498, 0.497)、半径 ≈ 205px（按高归一化 0.1898），
   *     30s 内自转/漂移 ≤0.02，视为固定；
   *   - 尾迹亮核 x∈[0.60,0.97] / y∈[0.33,0.67]，正好在行星右缘外 → 遮罩必须裁掉；
   *   - 幕 IV 10.35 点火：seek 4.57s（最亮喷射段 4.57–6.07s，plume score 0.81）、
   *     playbackRate 1.0；11.55 armHandoff 时 currentTime ≈5.77s（仍在最亮段）。
   *   v0.5 §2：earth 已重编码为短 GOP（g=15，seek 10–20ms）→ 幕 III 冷态帧在媒体
   *   load 时预 seek 到 coldAt（20.27），8.30 只 play + 0.65x；10.35 点火 seek 仍保留。 */
  var EARTH = {
    planetX: 0.500,       /* 行星圆心（video 归一化 x；earth.json planet.median） */
    planetY: 0.490,       /* 行星圆心（video 归一化 y） */
    planetRH: 0.188,      /* 行星半径（按视频渲染高度归一化 = 203/1080） */
    coldAt: 20.27,        /* 幕 III 冷态段起点（全片最暗窗 20.27–21.77，Lead 指定） */
    jetAt: 4.57,          /* 点火段起点（最亮喷射段 4.57–6.07，score 0.81） */
    jetSegment: 1,        /* 1 = 视频有独立可切段（10.35 时 seek 到 jetAt） */
    jetDelay: 0,          /* 点火 → 尾迹进入画面延迟（本实现 = 遮罩移除瞬间） */
    e3K: 1.26,            /* 幕 III 裁切 scale（Lead 建议 1.26–1.32） */
    e3Cx: 0.664,          /* 幕 III 行星屏幕圆心（视口归一化 x；右半屏内居中偏左） */
    e3Cy: 0.50,           /* 幕 III 行星屏幕圆心（视口归一化 y） */
    maskK: 1.0,           /* 圆形遮罩半径 = 行星屏幕半径 × maskK（紧贴圆盘，裁掉尾迹） */
    kEnd: 1.12            /* 幕 IV / 交接 scale（= ambient skin.css 的 scale(1.12)） */
  }

  /* 素材 → 文件（spec §5；q = 1080 / 720；saver 不用视频） */
  var quality = (injected.quality === 'high' || injected.quality === 'standard' || injected.quality === 'saver') ? injected.quality : 'standard'
  var Q = quality === 'high' ? '1080' : '720'
  function assetUrl(rel, ver) {
    return ASSET_BASE + rel + (ver === false ? '' : ('?v=' + encodeURIComponent(VERSION)))
  }
  var URLS = {
    neuro: quality === 'saver' ? '' : assetUrl('neuro/neuro-boot-' + Q + '.mp4'),
    neuroPoster: assetUrl('neuro/neuro-boot-poster.webp'),
    moss: quality === 'saver' ? '' : assetUrl('moss/moss-cinema-' + Q + '.mp4'),
    mossPoster: assetUrl('moss/moss-cinema-poster.webp'),
    earth: quality === 'saver' ? '' : assetUrl('earth/earth-' + Q + '.mp4'),
    earthPoster: assetUrl('earth/earth-poster.webp')
  }

  /* MOSS 红眼在画面上的归一化坐标（v0.4 §3.1：按 _work/v04/assets-analysis/moss.json
   * eyeMedian 微调为 37.58% / 53.84%；v0.3 为 37.40% / 53.80%）。
   * 所有对齐/准心/对焦框都只消费 computeEyePoint()，不再各自写死坐标。 */
  var EYE = { x: 0.3758, y: 0.5384 }

  /* v0.4 §3.2：MOSS 运动能量包络（内联自 _work/v04/assets-analysis/moss.json
   * motion.wholeSmooth3 / motion.arm；149 值，索引 i ↔ MOSS 视频本地 (i+1)/30s
   * ↔ 绝对 t = 3.90 + (i+1)/30；不新增任何网络请求）。
   * 用途：伺服电机层幅度调制 / 红色 rim 呼吸 / 准心抖动 / 扫描线密度。 */
  var MOSS_FPS = 30
  var MOSS_MOTION = [
    0.468, 0.509, 0.538, 0.567, 0.591, 0.627, 0.666, 0.699, 0.757, 0.782,
    0.809, 0.835, 0.86, 0.902, 0.891, 0.904, 0.899, 0.914, 0.949, 0.962,
    0.972, 0.96, 0.96, 0.973, 0.978, 0.96, 0.92, 0.876, 0.844, 0.822,
    0.796, 0.759, 0.709, 0.665, 0.629, 0.598, 0.581, 0.553, 0.543, 0.503,
    0.478, 0.438, 0.418, 0.398, 0.389, 0.369, 0.356, 0.346, 0.339, 0.323,
    0.3, 0.279, 0.268, 0.257, 0.261, 0.256, 0.279, 0.298, 0.298, 0.265,
    0.257, 0.243, 0.265, 0.258, 0.247, 0.203, 0.175, 0.17, 0.162, 0.141,
    0.138, 0.137, 0.127, 0.113, 0.102, 0.096, 0.086, 0.075, 0.067, 0.063,
    0.049, 0.04, 0.033, 0.031, 0.027, 0.024, 0.026, 0.041, 0.049, 0.054,
    0.044, 0.035, 0.027, 0.027, 0.03, 0.03, 0.038, 0.035, 0.036, 0.025,
    0.025, 0.024, 0.026, 0.026, 0.023, 0.021, 0.023, 0.023, 0.022, 0.02,
    0.022, 0.022, 0.021, 0.019, 0.02, 0.021, 0.019, 0.019, 0.021, 0.021,
    0.018, 0.018, 0.019, 0.019, 0.017, 0.018, 0.019, 0.019, 0.017, 0.017,
    0.021, 0.016, 0.016, 0.014, 0.019, 0.018, 0.017, 0.018, 0.019, 0.018,
    0.016, 0.017, 0.018, 0.017, 0.016, 0.018, 0.018, 0.017, 0.016
  ]
  /* 机械臂区域（x≥0.55, y≤0.55）运动包络：驱动「机械关节」事件表的疏密 */
  var MOSS_MOTION_ARM = [
    0.591, 0.617, 0.657, 0.588, 0.595, 0.617, 0.623, 0.695, 0.671, 0.963,
    0.68, 0.697, 1, 0.718, 0.939, 0.677, 0.596, 0.562, 0.534, 0.687,
    0.438, 0.406, 0.337, 0.319, 0.469, 0.485, 0.329, 0.311, 0.294, 0.276,
    0.371, 0.316, 0.151, 0.134, 0.132, 0.125, 0.124, 0.297, 0.101, 0.297,
    0.121, 0.113, 0.112, 0.117, 0.107, 0.222, 0.103, 0.124, 0.251, 0.202,
    0.087, 0.09, 0.075, 0.065, 0.073, 0.132, 0.069, 0.364, 0.376, 0.067,
    0.058, 0.382, 0.06, 0.364, 0.361, 0.037, 0.044, 0.154, 0.057, 0.043,
    0.046, 0.074, 0.102, 0.038, 0.059, 0.069, 0.055, 0.053, 0.075, 0.063,
    0.109, 0.046, 0.051, 0.085, 0.052, 0.026, 0.049, 0.047, 0.159, 0.107,
    0.101, 0.062, 0.043, 0.049, 0.06, 0.067, 0.047, 0.095, 0.031, 0.051,
    0.034, 0.042, 0.045, 0.042, 0.034, 0.031, 0.036, 0.041, 0.031, 0.043,
    0.028, 0.035, 0.032, 0.023, 0.029, 0.033, 0.024, 0.027, 0.032, 0.027,
    0.021, 0.017, 0.031, 0.026, 0.021, 0.025, 0.039, 0.029, 0.02, 0.026,
    0.03, 0.036, 0.004, 0.027, 0.03, 0.03, 0.02, 0.028, 0.037, 0.029,
    0.02, 0.023, 0.032, 0.02, 0.02, 0.023, 0.029, 0.026, 0.024
  ]
  /* v0.4 §3.2 机械关节事件表（Lead 最终版；t 为绝对时间，偏差目标 ≤0.10s）：
   * 4.23/4.40/4.57/4.73 全帧运动峰（最强四个）→ 伺服+棘轮渐强；
   * 5.17/5.23 峰 5 与臂微动；5.53/5.87/6.03/6.17/6.87 机械臂微动 → 干净短促关节咔哒；
   * 6.63 镜头锁死 → 液压锁止重音；7.17 红眼点火 → 对焦/光圈伺服；7.42 锁定重音。 */
  var MOSS_JOINTS = [
    { at: 4.23, kind: 'joint', peak: 0.056, w: 0.9, style: 'both', loud: true },
    { at: 4.40, kind: 'joint', peak: 0.060, w: 1.0, style: 'both' },
    { at: 4.57, kind: 'joint', peak: 0.064, w: 1.0, style: 'both' },
    { at: 4.73, kind: 'joint', peak: 0.068, w: 1.0, style: 'both', loud: true },
    { at: 5.17, kind: 'joint', peak: 0.050, w: 0.7, style: 'ratchet' },
    { at: 5.23, kind: 'joint', peak: 0.044, w: 0.5, style: 'ratchet' },
    { at: 5.53, kind: 'joint', peak: 0.060, w: 0.8, style: 'ratchet', loud: true },
    { at: 5.87, kind: 'joint', peak: 0.064, w: 0.85, style: 'ratchet' },
    { at: 6.03, kind: 'joint', peak: 0.068, w: 0.9, style: 'ratchet', loud: true },
    { at: 6.17, kind: 'joint', peak: 0.052, w: 0.6, style: 'ratchet' },
    { at: 6.63, kind: 'latch', peak: 0.075, w: 1.0, style: 'latch' },
    { at: 6.87, kind: 'joint', peak: 0.075, w: 1.0, style: 'both', loud: true },
    { at: 7.17, kind: 'joint', peak: 0.040, w: 0.6, style: 'focus', loud: true }
  ]

  /* 文案（§4 原文；未指定的为不违背 spec 的补白） */
  var NEURO_LOG = [
    '> BCI-LINK 神经接口 · 握手完成',
    '> CORTEX MAP 脑皮层映射 · 1,024 通道',
    '> UPLOAD 意识上传通道 · 已建立'
  ]
  var MOSS_LOG = [
    { t: 'T+01.60', n: '系统自检', s: '通过' },
    { t: 'T+01.82', n: '权限核验', s: '通过' },
    { t: 'T+02.04', n: '行星发动机', s: '10,000 组在线' },
    { t: 'T+02.26', n: '领航员空间站', s: '已对接' },
    { t: 'T+02.48', n: '数据链路', s: '已加密' },
    { t: 'T+02.70', n: '550W 主控', s: '就位' },
    { t: 'T+03.20', n: 'MOSS 意识', s: '加载完成' }
  ]

  /* §8 配置（与 lib/index.js DEFAULTS / lib/client.js FALLBACK 三处一致） */
  var DEFAULTS = {
    enabled: true,
    mode: 'session',
    skin: 'glass',
    quality: 'standard',
    veil: 58,
    blur: 16,
    hud: 'normal',
    sound: true,
    volume: 50,
    allowSkip: true,
    reducedMotion: false
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 1. 小工具
   * ══════════════════════════════════════════════════════════════════════ */
  function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key) }
  function bool(value, fallback) {
    if (value === false || value === 'false' || value === 0 || value === '0') return false
    if (value === true || value === 'true' || value === 1 || value === '1') return true
    return fallback
  }
  function num(value, lo, hi, fallback) {
    var n = Number(value)
    if (!isFinite(n)) return fallback
    return n < lo ? lo : (n > hi ? hi : n)
  }
  function oneOf(value, list, fallback) {
    for (var i = 0; i < list.length; i++) if (value === list[i]) return value
    return fallback
  }
  function normalize(input) {
    var src = (input && typeof input === 'object') ? input : {}
    var cfg = {}
    for (var key in DEFAULTS) if (has(DEFAULTS, key)) cfg[key] = DEFAULTS[key]
    cfg.enabled = bool(src.enabled, DEFAULTS.enabled)
    cfg.mode = oneOf(src.mode, ['session', 'daily', 'always'], DEFAULTS.mode)
    cfg.skin = oneOf(src.skin, ['off', 'glass', 'immersive'], DEFAULTS.skin)
    cfg.quality = oneOf(src.quality, ['high', 'standard', 'saver'], DEFAULTS.quality)
    cfg.veil = num(src.veil, 0, 100, DEFAULTS.veil)
    cfg.blur = num(src.blur, 0, 40, DEFAULTS.blur)
    cfg.hud = oneOf(src.hud, ['off', 'normal', 'full'], DEFAULTS.hud)
    cfg.sound = bool(src.sound, DEFAULTS.sound)
    cfg.volume = num(src.volume, 0, 100, DEFAULTS.volume)
    cfg.allowSkip = bool(src.allowSkip, DEFAULTS.allowSkip)
    cfg.reducedMotion = bool(src.reducedMotion, DEFAULTS.reducedMotion)
    return cfg
  }
  function clockNow() {
    return (window.performance && typeof window.performance.now === 'function')
      ? window.performance.now()
      : Date.now()
  }
  function requestFrame(fn) {
    if (typeof window.requestAnimationFrame === 'function') return window.requestAnimationFrame(fn)
    return window.setTimeout(function () { fn(clockNow()) }, 16)
  }
  function cancelFrame(id) {
    if (!id) return
    if (typeof window.cancelAnimationFrame === 'function') window.cancelAnimationFrame(id)
    else window.clearTimeout(id)
  }
  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x) }
  function seg(t, a, b) { return b <= a ? (t >= a ? 1 : 0) : clamp01((t - a) / (b - a)) }
  function easeOut(x) { var p = 1 - x; return 1 - p * p * p }
  function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 }
  function lerp(a, b, p) { return a + (b - a) * p }
  function fact(value) {
    if (value === null || value === undefined || value === '') return '—'
    var text = String(value)
    return text.length > 96 ? text.slice(0, 95) + '…' : text
  }

  /* ── v0.5 §1.1 启动进度唯一真值（单调不减；12.10 恰好 1） ────────────────
   * 0→10.35s 线性（12.80s 名义时间线，10.35 时 ≈0.83，与跳过相位语义一致），
   * 10.35→12.10 收尾线性补到 1，整体叠加一次轻微 easeInOut（视觉更顺，不改单调性）。
   * pct 数字 / fill scaleX / spark translateX 全部消费同一个量化值。 */
  function bootProgress(t) {
    if (!(t > 0)) return 0
    if (t >= PROGRESS_END) return 1
    var raw
    if (t <= PROGRESS_KNEE) {
      raw = t / PROGRESS_NOMINAL
    } else {
      var kneeP = PROGRESS_KNEE / PROGRESS_NOMINAL
      raw = kneeP + (1 - kneeP) * ((t - PROGRESS_KNEE) / (PROGRESS_END - PROGRESS_KNEE))
    }
    return clamp01(0.88 * raw + 0.12 * easeInOut(raw))
  }
  /* 量化到 0.01：保证 pct 数字（整数）/ fill / spark 三者严格同值 */
  function quantizeProgress(p) {
    return Math.round(clamp01(p) * 100) / 100
  }
  /* v0.4 §3.2：MOSS 运动包络采样（moss.json：索引 i ↔ 本地 (i+1)/30s，相邻插值） */
  function mossEnergy(local, armOnly) {
    if (!(local > 0)) return 0
    var arr = armOnly ? MOSS_MOTION_ARM : MOSS_MOTION
    var pos = local * MOSS_FPS - 1
    if (pos < 0) return arr[0]
    var i = Math.floor(pos)
    if (i >= arr.length) return arr[arr.length - 1]
    var a = arr[i]
    var b = arr[i + 1 < arr.length ? i + 1 : i]
    return lerp(a, b, pos - i)
  }
  function mossEnergyAt(t, armOnly) { return mossEnergy(t - TL.mossIn, armOnly) }
  /* v0.3 §5：第二幕目标锁定子相位（data-tgt 标记用） */
  function targetPhase(t) {
    if (t < TL.tgtCapture[0]) return 'search'
    if (t < TL.tgtTrack[0]) return 'capture'
    if (t < TL.tgtConverge[0]) return 'track'
    if (t < TL.tgtLock[0]) return 'converge'
    if (t < TL.tgtLock[1]) return 'lock'
    return 'maintain'
  }
  /* 单个平滑脉冲（0→1→0 正弦包络）；频率由调用点控制，均 ≤3Hz，无硬闪 */
  function pulseAt(t, at, dur) {
    if (dur <= 0) return 0
    var p = (t - at) / dur
    if (p < 0 || p > 1) return 0
    return Math.sin(p * Math.PI)
  }
  /* 绝对坐标定位（px；缓存避免每帧无谓写 style） */
  function setLeftTop(target, x, y) {
    if (!target) return
    var sx = x.toFixed(1) + 'px'
    var sy = y.toFixed(1) + 'px'
    if (target.__msLT !== sx + ',' + sy) {
      target.__msLT = sx + ',' + sy
      target.style.left = sx
      target.style.top = sy
    }
  }

  /* DOM 写入缓存：避免每帧无谓的 style/textContent 赋值（rAF 内不触发布局） */
  function op(el, v) {
    if (!el) return
    var s = v <= 0.002 ? '0' : (v >= 0.998 ? '1' : v.toFixed(3))
    if (el.__msOp !== s) { el.__msOp = s; el.style.opacity = s }
  }
  function tf(el, v) {
    if (!el) return
    if (el.__msTf !== v) { el.__msTf = v; el.style.transform = v }
  }
  function setFilter(el, v) {
    if (!el) return
    if (el.__msFilt !== v) { el.__msFilt = v; el.style.filter = v }
  }
  function leftPct(el, p) {
    if (!el) return
    var s = p.toFixed(3) + '%'
    if (el.__msLeft !== s) { el.__msLeft = s; el.style.left = s }
  }
  function clipPath(el, v) {
    if (!el) return
    if (el.__msClip !== v) { el.__msClip = v; el.style.clipPath = v }
  }
  function textOf(el, v) {
    if (!el) return
    if (el.__msTxt !== v) { el.__msTxt = v; el.textContent = v }
  }
  function display(el, v) {
    if (!el) return
    if (el.__msDsp !== v) { el.__msDsp = v; el.style.display = v }
  }
  function stageVar(name, value) {
    if (!stage) return
    if (stage.__msVars === undefined) stage.__msVars = {}
    if (stage.__msVars[name] !== value) {
      stage.__msVars[name] = value
      try { stage.style.setProperty(name, value) } catch (err) { /* noop */ }
    }
  }

  function queryParam(name) {
    try {
      if (!window.location || typeof window.location.search !== 'string') return null
      var search = window.location.search.replace(/^\?/, '')
      var pairs = search.split('&')
      for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split('=')
        if (decodeURIComponent(kv[0] || '') === name) return decodeURIComponent((kv[1] || '').replace(/\+/g, ' '))
      }
    } catch (err) { /* noop */ }
    return null
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 2. 入口配置 / 事实 / 运行时状态
   * ══════════════════════════════════════════════════════════════════════ */
  var cfg = normalize(injected)
  var facts = (window.__DSH_MOSS2_FACTS__ && typeof window.__DSH_MOSS2_FACTS__ === 'object')
    ? window.__DSH_MOSS2_FACTS__
    : (injected.facts && typeof injected.facts === 'object' ? injected.facts : {})
  var hostVersion = (window.__DSH_MOSS2_VERSION__ === undefined || window.__DSH_MOSS2_VERSION__ === null) ? '' : String(window.__DSH_MOSS2_VERSION__)
  /* 只认显式配置；【绝不读取 prefers-reduced-motion】——见文件头红线 */
  var reduced = cfg.reducedMotion === true

  var previewRaw = window.__DSH_MOSS2_PREVIEW_T__
  if (previewRaw === undefined || previewRaw === null || previewRaw === '') previewRaw = queryParam('t')
  var previewNum = (previewRaw === null || previewRaw === undefined || previewRaw === '') ? NaN : Number(previewRaw)
  var preview = isFinite(previewNum) && previewNum >= 0
  var previewT = preview ? previewNum : 0

  var skipBoot = window.__DSH_MOSS2_SKIP__ === true || window.__DSH_MOSS2_SPLASH__ === false || cfg.enabled === false

  var root = null
  var stage = null
  var el = {}
  var state = 'boot'            /* boot | playing | handoff | done | preview | disabled */
  var timers = []
  var rafId = 0
  var startedAt = 0
  var lastT = 0
  var lastPhase = ''
  var disposed = false
  var sealed = false
  var prevBodyOverflow = null
  var keyListener = null
  var resizeListener = null
  var visibilityListener = null
  var fallbackListener = null
  var skipEl = null
  var hardTimer = 0
  var armTried = false
  var armRetryTimer = 0
  var finishReason = ''
  var holdMode = false

  var flags = {}
  var milestoneTimers = []
  var media = {}
  var logLineEls = []
  var typedEls = []
  var telRowEls = []
  var typeCache = []
  var frameW = 1536
  var frameH = 960
  var trackWidth = 0             /* v0.3 §4：进度条实测宽度（含 resize 监听），光点位移专用 */
  var eyePoint = { x: 0, y: 0 }
  var eyeDirty = true
  var apiObject = null
  var apiRepairTimer = 0
  var splashStateObj = null
  /* v0.3 只读探针（对象复用，逐帧写字段，不每帧 new） */
  var progressProbe = null
  var lockProbe = null
  var audioProbe = null
  var earthStateProbe = null       /* v0.4 §5.4：__DSH_MOSS2_EARTH_STATE__ */
  var audioEventCount = 0
  /* v0.4 §3.1：终局对焦框几何（FOCUS_HALF 每帧 clamp；四角锚点 = 主眼 ± half） */
  var focusHalf = 0
  var focusReady = false

  /* WebAudio */
  var audioCtx = null
  var audioNodes = []
  var audioMaster = null
  var audioGraph = null
  var audioStarted = false

  /* ══════════════════════════════════════════════════════════════════════
   * 3. 定时器 / 键盘 / 锁滚
   * ══════════════════════════════════════════════════════════════════════ */
  function untrack(id) {
    for (var i = 0; i < timers.length; i++) if (timers[i] === id) { timers.splice(i, 1); return }
  }
  function later(fn, ms) {
    var id = window.setTimeout(function () {
      untrack(id)
      try { fn() } catch (err) { /* 单个回调失败不阻断时间线 */ }
    }, Math.max(0, ms))
    timers.push(id)
    return id
  }
  function clearTimers() {
    for (var i = 0; i < timers.length; i++) { try { window.clearTimeout(timers[i]) } catch (err) { /* noop */ } }
    timers.length = 0
    milestoneTimers.length = 0
    if (hardTimer) { try { window.clearTimeout(hardTimer) } catch (err) { /* noop */ } hardTimer = 0 }
    if (apiRepairTimer) { try { window.clearInterval(apiRepairTimer) } catch (err) { /* noop */ } apiRepairTimer = 0 }
    if (armRetryTimer) { try { window.clearTimeout(armRetryTimer) } catch (err) { /* noop */ } armRetryTimer = 0 }
  }

  function lockPage() {
    try {
      document.documentElement.classList.add(HTML_LOCK)
      if (document.body && document.body.style) {
        if (prevBodyOverflow === null) prevBodyOverflow = document.body.style.overflow || ''
        document.body.style.overflow = 'hidden'
      }
    } catch (err) { /* noop */ }
  }
  function unlockPage() {
    try {
      document.documentElement.classList.remove(HTML_LOCK)
      if (document.body && document.body.style) document.body.style.overflow = prevBodyOverflow === null ? '' : prevBodyOverflow
    } catch (err) { /* noop */ }
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 4. DOM（首帧纯 CSS，不等待任何网络资源）
   * ══════════════════════════════════════════════════════════════════════ */
  function shellHtml() {
    return [
      '<div class="ms-stage" data-stage>',

      /* ── 0 黑场 ── */
      '  <div class="ms-prologue" data-prologue>',
      '    <div class="ms-pro-line"></div>',
      '    <div class="ms-pro-word">DEEPSEEK HARNESS</div>',
      '    <div class="ms-pro-cap">INITIALIZING CORE</div>',
      '  </div>',

      /* ── I 神经接口 ── */
      '  <section class="ms-act ms-act--neuro" data-act="neuro">',
      '    <div class="ms-clip">',
      '      <div class="ms-fallback ms-fallback--neuro"></div>',
      '      <video class="ms-video" data-act="neuro" muted playsinline preload="auto" aria-hidden="true"></video>',
      '      <div class="ms-veil ms-veil--neuro"></div>',
      '    </div>',
      '    <div class="ms-hud ms-hud--neuro">',
      '      <div class="ms-bci-tag" data-neuro-tag><i></i><span>BCI-1</span><b>·</b><span>意识上传通道</span></div>',
      '      <div class="ms-neuro-center">',
      '        <div class="ms-neuro-title-wrap">',
      '          <h1 class="ms-neuro-title">DEEPSEEK HARNESS</h1>',
      '          <i class="ms-neuro-shine"></i>',
      '        </div>',
      '        <div class="ms-neuro-sub" data-neuro-sub><span>NEURAL INTERFACE</span><i>·</i><span>神经接口</span></div>',
      '      </div>',
      '      <div class="ms-neuro-log" data-neuro-log></div>',
      '      <div class="ms-link" data-link>',
      '        <svg class="ms-link-ring" viewBox="0 0 120 120" aria-hidden="true">',
      '          <circle class="ms-link-track" cx="60" cy="60" r="53"></circle>',
      '          <circle class="ms-link-arc" data-link-arc cx="60" cy="60" r="53" transform="rotate(-90 60 60)"></circle>',
      '          <circle class="ms-link-dot" data-link-dot cx="60" cy="7" r="2.2"></circle>',
      '        </svg>',
      '        <div class="ms-link-txt"><span class="ms-link-cap">LINK</span><span class="ms-link-num" data-link-num>08</span><span class="ms-link-sign">%</span></div>',
      '      </div>',
      '      <div class="ms-neuro-fault" data-neuro-fault>SIGNAL INTERFERENCE</div>',
      '      <div class="ms-glitch" data-glitch></div>',
      '    </div>',
      '  </section>',

      /* ── II MOSS 苏醒 ── */
      '  <section class="ms-act ms-act--moss" data-act="moss">',
      '    <div class="ms-clip">',
      '      <div class="ms-fallback ms-fallback--moss"></div>',
      '      <video class="ms-video" data-act="moss" muted playsinline preload="auto" aria-hidden="true"></video>',
      '      <div class="ms-veil ms-veil--moss"></div>',
      '    </div>',
      '    <div class="ms-moss-rim" aria-hidden="true"></div>',
      /* ── v0.3 §5：第二幕目标锁定特效层（全部叠加层，MOSS 视频元素不动） ── */
      '    <div class="ms-tgt-layer" data-tgt-layer aria-hidden="true">',
      '      <div class="ms-tgt-grid ms-moss-grid" data-tgt-grid></div>',
      '      <div class="ms-tgt-scan" data-tgt-scan></div>',
      '      <i class="ms-tgt-corner" data-corner="tl"></i>',
      '      <i class="ms-tgt-corner" data-corner="tr"></i>',
      '      <i class="ms-tgt-corner" data-corner="bl"></i>',
      '      <i class="ms-tgt-corner" data-corner="br"></i>',
      '      <i class="ms-tgt-ghost" data-ghost="0"></i>',
      '      <i class="ms-tgt-ghost" data-ghost="1"></i>',
      '      <i class="ms-tgt-ghost" data-ghost="2"></i>',
      '      <div class="ms-tgt-reticle" data-tgt-reticle>',
      '        <i class="ms-tgt-ring-o"></i>',
      '        <i class="ms-tgt-ring-i"></i>',
      '        <i class="ms-tgt-ticks"></i>',
      '        <i class="ms-tgt-cross"></i>',
      '        <i class="ms-tgt-dot"></i>',
      '        <span class="ms-tgt-dist" data-tgt-dist></span>',
      '        <span class="ms-tgt-locklabel" data-tgt-locklabel>LOCKED · 550W</span>',
      '      </div>',
      /* ── v0.4 §3.1：终局对焦框（四角对称；几何中心严格 = computeEyePoint() 主眼） ── */
      '      <div class="ms-tgt-focus" data-tgt-focus aria-hidden="true">',
      '        <i class="ms-tgt-focus__ring" data-focus-ring></i>',
      '        <i class="ms-tgt-focus__corner" data-focus-corner="tl"></i>',
      '        <i class="ms-tgt-focus__corner" data-focus-corner="tr"></i>',
      '        <i class="ms-tgt-focus__corner" data-focus-corner="bl"></i>',
      '        <i class="ms-tgt-focus__corner" data-focus-corner="br"></i>',
      '        <i class="ms-tgt-focus__tick" data-focus-tick="t"></i>',
      '        <i class="ms-tgt-focus__tick" data-focus-tick="r"></i>',
      '        <i class="ms-tgt-focus__tick" data-focus-tick="b"></i>',
      '        <i class="ms-tgt-focus__tick" data-focus-tick="l"></i>',
      '      </div>',
      '      <div class="ms-tgt-data" data-tgt-data>',
      '        <span class="ms-tgt-state" data-tgt-state>TARGET SEARCH</span>',
      '        <span class="ms-tgt-read" data-tgt-read></span>',
      '      </div>',
      '      <div class="ms-tgt-chroma" data-tgt-chroma></div>',
      '    </div>',
      '    <i class="ms-lock-shock ms-lock-shock--a" data-lock-shock="a" aria-hidden="true"></i>',
      '    <i class="ms-lock-shock ms-lock-shock--b" data-lock-shock="b" aria-hidden="true"></i>',
      '    <div class="ms-moss-vignette" data-moss-vignette aria-hidden="true"></div>',
      '    <div class="ms-gaze" data-gaze aria-hidden="true">',
      '      <i class="ms-gaze-ring ms-gaze-ring--o"></i>',
      '      <i class="ms-gaze-ring ms-gaze-ring--i"></i>',
      '      <i class="ms-gaze-corner ms-gaze-corner--tl"></i>',
      '      <i class="ms-gaze-corner ms-gaze-corner--tr"></i>',
      '      <i class="ms-gaze-corner ms-gaze-corner--bl"></i>',
      '      <i class="ms-gaze-corner ms-gaze-corner--br"></i>',
      '      <i class="ms-gaze-cross"></i>',
      '      <i class="ms-gaze-dot"></i>',
      '      <span class="ms-gaze-label">TARGET LOCKED · 550W</span>',
      '    </div>',
      '    <div class="ms-hud ms-hud--moss">',
      '      <div class="ms-moss-title">',
      '        <div class="ms-550w">550W</div>',
      '        <div class="ms-moss-en">MOSS SYSTEM</div>',
      '        <div class="ms-moss-cn">中国航天局 · 量子计算机</div>',
      '      </div>',
      '      <div class="ms-moss-log" data-moss-log></div>',
      '      <div class="ms-moss-tel" data-moss-tel></div>',
      '      <div class="ms-online">',
      '        <i class="ms-online-rule"></i>',
      '        <div class="ms-online-main">MOSS 已上线</div>',
      '        <div class="ms-online-sub">「让人类永远保持理智，确实是一种奢求。」</div>',
      '      </div>',
      '    </div>',
      '  </section>',

      /* ── IV 流浪地球 ── */
      '  <section class="ms-act ms-act--earth" data-act="earth">',
      '    <div class="ms-clip">',
      '      <div class="ms-fallback ms-fallback--earth"></div>',
      '      <video class="ms-video" data-act="earth" muted playsinline preload="auto" loop aria-hidden="true"></video>',
      '      <div class="ms-veil ms-veil--earth"></div>',
      '    </div>',
      /* ── v0.4 §5：点火闪光 / 扩散光环 / 尾迹遮罩（全部叠加层，不触碰视频属性） ── */
      '    <div class="ms-ignite-flash" data-ignite-flash aria-hidden="true"></div>',
      '    <i class="ms-ignite-burst" data-ignite-burst="0" aria-hidden="true"></i>',
      '    <i class="ms-ignite-burst" data-ignite-burst="1" aria-hidden="true"></i>',
      '    <div class="ms-earth-plume-cover" data-plume-cover aria-hidden="true"></div>',
      '    <div class="ms-hud ms-hud--earth">',
      '      <div class="ms-earth-cap" data-earth-cap><span class="ms-earth-cn">流浪地球计划 · 已启动</span><i>/</i><span class="ms-earth-sub">地球发动机 全功率</span></div>',
      '      <div class="ms-earth-mark" data-earth-mark>550W · MOSS <i>/</i> 移交完成</div>',
      '    </div>',
      '  </section>',

      /* ── III 竖直分割转场（覆盖层） ── */
      '  <div class="ms-split" data-split aria-hidden="true">',
      '    <div class="ms-split__moss"><span class="ms-split-label" data-split-label-l>550W · CONTROL TRANSFER</span></div>',
      '    <div class="ms-split__earth"><span class="ms-split-label" data-split-label-r>THE WANDERING EARTH</span></div>',
      '    <div class="ms-split__seam" data-seam><i class="ms-split__ticks"></i></div>',
      /* v0.4 §4.1：准心十字线延伸（横线 = 全宽 / 竖线 = 全高，竖线滑到 50% 后成为分割线） */
      '    <i class="ms-split__prep-h" data-prep-h></i>',
      '    <i class="ms-split__prep-v" data-prep-v></i>',
      /* v0.4 §4.1：8.24 起水平拉丝扫描线 */
      '    <i class="ms-split__flashline" data-flashline></i>',
      /* v0.4 §4.1：对焦框四角 fly-out → 幕 III 画面角标 */
      '    <i class="ms-split__corner" data-split-corner="tl"></i>',
      '    <i class="ms-split__corner" data-split-corner="tr"></i>',
      '    <i class="ms-split__corner" data-split-corner="bl"></i>',
      '    <i class="ms-split__corner" data-split-corner="br"></i>',
      /* v0.4 §4.2：右幕 data wipe（4 条水平扫描带 + 冷色显影） */
      '    <div class="ms-split__wipe" data-split-wipe aria-hidden="true"></div>',
      /* v0.4 §4.3：接缝数据包 ×3（9.12–9.90 循环 2 次，抵达时接缝对应位置闪一下） */
      '    <i class="ms-seam-packet" data-seam-packet="0"></i>',
      '    <i class="ms-seam-packet" data-seam-packet="1"></i>',
      '    <i class="ms-seam-packet" data-seam-packet="2"></i>',
      '    <i class="ms-seam-flash" data-seam-flash="0"></i>',
      '    <i class="ms-seam-flash" data-seam-flash="1"></i>',
      '    <i class="ms-seam-flash" data-seam-flash="2"></i>',
      /* v0.4 §4.4：点火预告（只有文字与接缝光，不得有喷射） */
      '    <div class="ms-split__engine" data-engine-hint><b>ENGINE IGNITION</b><i>//</i><span>引擎点火</span></div>',
      '    <div class="ms-split__handover" data-handover>',
      '      <div class="ms-ho-cn">移交控制权</div>',
      '      <div class="ms-ho-en">550W → 地球发动机</div>',
      '    </div>',
      '  </div>',
      /* ── v0.5 §3.1 段 1：BOOT COMPLETE 定格印章（11.80–12.10 揭开，保持到 12.70） ── */
      '  <div class="ms-boot-stamp" data-boot-stamp aria-hidden="true">',
      '    <i class="ms-boot-stamp__line"></i>',
      '    <div class="ms-boot-stamp__main" data-boot-main>BOOT COMPLETE</div>',
      '    <div class="ms-boot-stamp__sub">系统就绪 · DEEPSEEK HARNESS</div>',
      '  </div>',

      /* ── 全局 HUD / 装饰 ── */
      '  <div class="ms-global-hud" aria-hidden="true">',
      '    <div class="ms-vignette"></div>',
      '    <div class="ms-grain"></div>',
      '    <div class="ms-scan"></div>',
      '    <div class="ms-frame">',
      '      <i class="ms-corner ms-corner--tl"></i><i class="ms-corner ms-corner--tr"></i>',
      '      <i class="ms-corner ms-corner--bl"></i><i class="ms-corner ms-corner--br"></i>',
      '      <i class="ms-ruler ms-ruler--l"></i><i class="ms-ruler ms-ruler--r"></i>',
      '      <i class="ms-ruler ms-ruler--t"></i><i class="ms-ruler ms-ruler--b"></i>',
      '    </div>',
      /* v0.3 §4：进度条 + 百分比移入全局固定层（class 名保持 v0.2 契约），
       * 4.36–11.0 全程可见；11.0 到 100% + BOOT COMPLETE 完成态；11.0–11.8 随根层淡出。 */
      '    <div class="ms-bottom">',
      '      <div class="ms-bottom-label">BOOT SEQUENCE <b>13.9s</b></div>',
      '      <div class="ms-progress"><i class="ms-progress-fill" data-progress-fill></i><i class="ms-progress-spark" data-progress-spark></i></div>',
      '    </div>',
      '    <div class="ms-pct"><span class="ms-pct-cap">INITIALIZING</span><span class="ms-pct-num" data-pct-num>0</span><span class="ms-pct-sign">%</span></div>',
      '    <div class="ms-topbar">',
      '      <span class="ms-topbar-l" data-topbar-l>DEEPSEEK HARNESS <b>//</b> BOOT</span>',
      '      <span class="ms-topbar-r">550W · MOSS <b>//</b> SEQ 0x2F</span>',
      '    </div>',
      '    <div class="ms-footer">',
      '      <span class="ms-foot-l">DEEPSEEK HARNESS <b>//</b> MOSS 550W <b>//</b> 启动序列</span>',
      '      <span class="ms-foot-r" data-foot-r></span>',
      '    </div>',
      '  </div>',

      /* ── 闪光 / 脉冲 / 跳过 ── */
      '  <div class="ms-flash" data-flash></div>',
      '  <div class="ms-pulse" data-pulse></div>',
      '  <div class="ms-skip" data-skip role="button" tabindex="0" aria-label="跳过启动动画"><span>ESC</span> 跳过</div>',
      '  <div class="ms-skipfade" data-skipfade></div>',
      '</div>'
    ].join('\n')
  }

  function cacheEls() {
    stage = root.querySelector('[data-stage]')
    el.prologue = root.querySelector('[data-prologue]')
    el.proLine = root.querySelector('.ms-pro-line')
    el.proWord = root.querySelector('.ms-pro-word')
    el.proCap = root.querySelector('.ms-pro-cap')

    el.actNeuro = root.querySelector('.ms-act--neuro')
    el.actMoss = root.querySelector('.ms-act--moss')
    el.actEarth = root.querySelector('.ms-act--earth')
    el.clipNeuro = el.actNeuro && el.actNeuro.querySelector('.ms-clip')
    el.clipMoss = el.actMoss && el.actMoss.querySelector('.ms-clip')
    el.clipEarth = el.actEarth && el.actEarth.querySelector('.ms-clip')
    el.videoNeuro = root.querySelector('video[data-act="neuro"]')
    el.videoMoss = root.querySelector('video[data-act="moss"]')
    el.videoEarth = root.querySelector('video[data-act="earth"]')
    el.veilNeuro = root.querySelector('.ms-veil--neuro')
    el.veilMoss = root.querySelector('.ms-veil--moss')
    el.veilEarth = root.querySelector('.ms-veil--earth')

    el.neuroTag = root.querySelector('[data-neuro-tag]')
    el.neuroTitleWrap = root.querySelector('.ms-neuro-title-wrap')
    el.neuroShine = root.querySelector('.ms-neuro-shine')
    el.neuroSub = root.querySelector('[data-neuro-sub]')
    el.neuroLog = root.querySelector('[data-neuro-log]')
    el.link = root.querySelector('[data-link]')
    el.linkArc = root.querySelector('[data-link-arc]')
    el.linkDot = root.querySelector('[data-link-dot]')
    el.linkNum = root.querySelector('[data-link-num]')
    el.glitch = root.querySelector('[data-glitch]')
    el.neuroFault = root.querySelector('[data-neuro-fault]')

    el.globalHud = root.querySelector('.ms-global-hud')
    el.mossRim = root.querySelector('.ms-moss-rim')
    /* ── v0.3 §5 第二幕目标锁定叠加层 ── */
    el.tgtLayer = root.querySelector('[data-tgt-layer]')
    el.tgtGrid = root.querySelector('[data-tgt-grid]')
    el.tgtScan = root.querySelector('[data-tgt-scan]')
    el.tgtCorners = root.querySelectorAll('.ms-tgt-corner')
    el.tgtGhosts = root.querySelectorAll('.ms-tgt-ghost')
    el.reticle = root.querySelector('[data-tgt-reticle]')
    el.reticleRingO = root.querySelector('.ms-tgt-ring-o')
    el.reticleRingI = root.querySelector('.ms-tgt-ring-i')
    el.reticleTicks = root.querySelector('.ms-tgt-ticks')
    el.reticleCross = root.querySelector('.ms-tgt-cross')
    el.reticleDot = root.querySelector('.ms-tgt-dot')
    el.reticleDist = root.querySelector('[data-tgt-dist]')
    el.reticleLockLabel = root.querySelector('[data-tgt-locklabel]')
    el.tgtData = root.querySelector('[data-tgt-data]')
    el.tgtState = root.querySelector('[data-tgt-state]')
    el.tgtRead = root.querySelector('[data-tgt-read]')
    el.tgtChroma = root.querySelector('[data-tgt-chroma]')
    /* v0.4 §3.1：终局对焦框 */
    el.tgtFocus = root.querySelector('[data-tgt-focus]')
    el.focusRing = root.querySelector('[data-focus-ring]')
    el.focusCorners = root.querySelectorAll('.ms-tgt-focus__corner')
    el.focusTicks = root.querySelectorAll('.ms-tgt-focus__tick')
    el.lockShocks = root.querySelectorAll('.ms-lock-shock')
    el.mossVignette = root.querySelector('[data-moss-vignette]')
    el.gaze = root.querySelector('[data-gaze]')
    el.gazeRingO = root.querySelector('.ms-gaze-ring--o')
    el.gazeRingI = root.querySelector('.ms-gaze-ring--i')
    el.gazeCorners = root.querySelectorAll('.ms-gaze-corner')
    el.gazeCross = root.querySelector('.ms-gaze-cross')
    el.gazeDot = root.querySelector('.ms-gaze-dot')
    el.gazeLabel = root.querySelector('.ms-gaze-label')
    el.mossTitle = root.querySelector('.ms-moss-title')
    el.title550 = root.querySelector('.ms-550w')
    el.mossEn = root.querySelector('.ms-moss-en')
    el.mossCn = root.querySelector('.ms-moss-cn')
    el.mossLog = root.querySelector('[data-moss-log]')
    el.mossTel = root.querySelector('[data-moss-tel]')
    el.online = root.querySelector('.ms-online')
    el.onlineRule = root.querySelector('.ms-online-rule')
    el.onlineMain = root.querySelector('.ms-online-main')
    el.onlineSub = root.querySelector('.ms-online-sub')
    el.bottom = el.globalHud ? el.globalHud.querySelector('.ms-bottom') : root.querySelector('.ms-bottom')
    el.bottomLabel = el.globalHud ? el.globalHud.querySelector('.ms-bottom-label') : root.querySelector('.ms-bottom-label')
    el.progress = el.globalHud ? el.globalHud.querySelector('.ms-progress') : root.querySelector('.ms-progress')
    el.progressFill = el.globalHud ? el.globalHud.querySelector('[data-progress-fill]') : root.querySelector('[data-progress-fill]')
    el.progressSpark = el.globalHud ? el.globalHud.querySelector('[data-progress-spark]') : root.querySelector('[data-progress-spark]')
    el.pct = el.globalHud ? el.globalHud.querySelector('.ms-pct') : root.querySelector('.ms-pct')
    el.pctNum = el.pct ? el.pct.querySelector('[data-pct-num]') : root.querySelector('[data-pct-num]')
    el.pctCap = el.pct ? el.pct.querySelector('.ms-pct-cap') : null

    el.earthCap = root.querySelector('[data-earth-cap]')
    el.earthMark = root.querySelector('[data-earth-mark]')
    /* v0.4 §5：点火闪光 / 扩散光环 / 尾迹遮罩 */
    el.igniteFlash = root.querySelector('[data-ignite-flash]')
    el.igniteBursts = root.querySelectorAll('[data-ignite-burst]')
    el.plumeCover = root.querySelector('[data-plume-cover]')

    el.split = root.querySelector('[data-split]')
    el.splitMoss = root.querySelector('.ms-split__moss')
    el.splitEarth = root.querySelector('.ms-split__earth')
    el.splitLabelL = root.querySelector('[data-split-label-l]')
    el.splitLabelR = root.querySelector('[data-split-label-r]')
    el.seam = root.querySelector('[data-seam]')
    el.handover = root.querySelector('[data-handover]')
    /* v0.4 §4：预转场十字线 / 拉丝 / 四角 fly-out / data wipe / 数据包 / 点火预告 */
    el.prepH = root.querySelector('[data-prep-h]')
    el.prepV = root.querySelector('[data-prep-v]')
    el.flashline = root.querySelector('[data-flashline]')
    el.splitCorners = root.querySelectorAll('[data-split-corner]')
    el.splitWipe = root.querySelector('[data-split-wipe]')
    el.seamPackets = root.querySelectorAll('[data-seam-packet]')
    el.seamFlashes = root.querySelectorAll('[data-seam-flash]')
    el.engineHint = root.querySelector('[data-engine-hint]')
    /* v0.4 §6：BOOT COMPLETE 定格印章 */
    el.bootStamp = root.querySelector('[data-boot-stamp]')
    el.bootMain = root.querySelector('[data-boot-main]')
    el.bootLine = root.querySelector('.ms-boot-stamp__line')

    el.globalHud = root.querySelector('.ms-global-hud')
    el.frame = root.querySelector('.ms-frame')
    el.topbar = root.querySelector('.ms-topbar')
    el.topbarL = root.querySelector('[data-topbar-l]')
    el.footer = root.querySelector('.ms-footer')
    el.footR = root.querySelector('[data-foot-r]')
    el.flash = root.querySelector('[data-flash]')
    el.pulse = root.querySelector('[data-pulse]')
    el.skip = root.querySelector('[data-skip]')
    el.skipfade = root.querySelector('[data-skipfade]')
    el.scan = root.querySelector('.ms-scan')
    el.grain = root.querySelector('.ms-grain')
    skipEl = el.skip
  }

  function buildNeuroLog() {
    if (!el.neuroLog) return
    var frag = document.createDocumentFragment()
    logLineEls = []
    typedEls = []
    typeCache = []
    for (var i = 0; i < NEURO_LOG.length; i++) {
      var row = document.createElement('div')
      row.className = 'ms-log-line ms-log-line--neuro'
      var typed = document.createElement('span')
      typed.className = 'ms-typed'
      row.appendChild(typed)
      var caret = document.createElement('i')
      caret.className = 'ms-caret'
      row.appendChild(caret)
      row.style.opacity = '0'
      frag.appendChild(row)
      logLineEls.push(row)
      typedEls.push(typed)
      typeCache.push('')
    }
    el.neuroLog.appendChild(frag)
  }

  function buildMossLog() {
    if (!el.mossLog) return
    var frag = document.createDocumentFragment()
    var els = []
    for (var i = 0; i < MOSS_LOG.length; i++) {
      var line = MOSS_LOG[i]
      var row = document.createElement('div')
      row.className = 'ms-log-line'
      var stamp = document.createElement('span')
      stamp.className = 'ms-log-t'
      stamp.textContent = line.t
      var name = document.createElement('span')
      name.className = 'ms-log-name'
      name.textContent = line.n
      var sep = document.createElement('span')
      sep.className = 'ms-log-sep'
      sep.textContent = '·'
      var val = document.createElement('span')
      val.className = 'ms-log-state'
      val.textContent = line.s
      row.appendChild(stamp); row.appendChild(name); row.appendChild(sep); row.appendChild(val)
      row.style.opacity = '0'
      frag.appendChild(row)
      els.push(row)
    }
    el.mossLog.appendChild(frag)
    el.mossLogRows = els
  }

  function buildTelemetry() {
    if (!el.mossTel) return
    var rows = [
      ['PROFILE', fact(facts.profile)],
      ['WORKSPACE', fact(facts.workspace)],
      ['MODEL', fact(facts.model)],
      ['SESSIONS', fact(facts.sessions)]
    ]
    var frag = document.createDocumentFragment()
    telRowEls = []
    var head = document.createElement('div')
    head.className = 'ms-tel-head'
    head.innerHTML = '<i></i><span>TELEMETRY</span><b>//</b><span>550W</span>'
    frag.appendChild(head)
    for (var i = 0; i < rows.length; i++) {
      var row = document.createElement('div')
      row.className = 'ms-tel-row'
      var k = document.createElement('span')
      k.className = 'ms-tel-k'
      k.textContent = rows[i][0]
      var v = document.createElement('span')
      v.className = 'ms-tel-v'
      v.textContent = rows[i][1]
      row.appendChild(k); row.appendChild(v)
      row.style.opacity = '0'
      frag.appendChild(row)
      telRowEls.push(row)
    }
    el.mossTel.appendChild(frag)
    if (el.footR) {
      var ready = facts.ready === true || facts.ready === 'true' || facts.ready === 1
      el.footR.textContent = 'REV ' + fact(facts.version || hostVersion)
        + '  ·  BUNDLES ' + fact(facts.bundleCount)
        + '  ·  ' + (ready ? 'READY' : 'LINK —')
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 5. 视频（渐进增强：404 / 解码失败 / 自动播放被拦都不阻断时间线）
   * ══════════════════════════════════════════════════════════════════════ */
  function mediaFail(m) {
    if (!m || m.failed) return
    m.failed = true
    var section = m.section
    if (section) section.classList.add('ms-act--failed')
    if (m.video) op(m.video, 0)
    window.__DSH_MOSS2_MEDIA_FAILED__ = (window.__DSH_MOSS2_MEDIA_FAILED__ || []).concat([m.act])
  }

  /* v0.5 §2.2.1 / §2.2.5：媒体 seek 计时（seeking/seeked 事件）
   *   - seekAt / seekedAt：启动时间线上的秒数（elapsed()），对应一次 seek 的起止
   *   - seekMs：最近一次 seek 的实测耗时（毫秒）；igniteSeekMs = 10.35 点火 seek 的耗时
   *   - preSeeked：冷态预 seek（earth → EARTH.coldAt）是否已完成
   * 仅在 earth 探针发布，其余媒体同样记录（开销可忽略）。 */
  function markSeeking(m) {
    if (!m || m.seekPending) return
    m.seekPending = true
    m.seekStartMs = clockNow()
    m.seekAt = elapsed()
  }
  function markSeeked(m) {
    if (!m) return
    var nowMs = clockNow()
    if (m.seekPending && m.seekStartMs > 0) {
      m.seekMs = Math.max(0, Math.round(nowMs - m.seekStartMs))
      m.seekedAt = elapsed()
      if (m.seekTag === 'preSeek') m.preSeeked = true
      if (m.seekTag === 'ignite') m.igniteSeekMs = m.seekMs
    }
    m.seekPending = false
    m.seekStartMs = 0
    m.seekTag = ''
  }

  function setupMedia(act, video, url, poster, section, opts) {
    var preSeek = (opts && typeof opts.preSeek === 'number' && isFinite(opts.preSeek) && opts.preSeek > 0) ? opts.preSeek : null
    var m = {
      act: act, video: video, url: url, poster: poster, section: section,
      ready: false, failed: false, saver: quality === 'saver', playTried: false, pendingSeek: null,
      preSeek: preSeek, preSeeked: false, preSeekInitiated: false,
      seekAt: 0, seekedAt: 0, seekMs: 0, igniteSeekMs: 0,
      seekTag: '', seekPending: false, seekStartMs: 0
    }
    if (!video) return m
    video.setAttribute('poster', poster)
    video.addEventListener('seeking', function () { markSeeking(m) })
    video.addEventListener('seeked', function () {
      markSeeked(m)
      /* v0.5：QA 定格时媒体 seek 完成后补一帧 render，刷新地球探针（currentTime/seekMs）与画面 */
      if (state === 'preview') {
        try { render(lastT, true) } catch (errS) { /* noop */ }
      }
    })
    video.addEventListener('loadeddata', function () {
      m.ready = true
      maybePreSeek(m)
      if (m.pendingSeek !== null) applySeek(m)
    })
    video.addEventListener('canplay', function () {
      m.ready = true
      maybePreSeek(m)
    })
    video.addEventListener('loadedmetadata', function () { if (act === 'moss') eyeDirty = true })
    video.addEventListener('error', function () { mediaFail(m) })
    if (m.saver) {
      /* saver：不加载视频，只保留 poster（§5「saver 全部只海报」） */
      video.removeAttribute('src')
      return m
    }
    try {
      video.src = url
      video.load()
    } catch (err) { mediaFail(m) }
    return m
  }

  /* v0.5 §2.2.1：readyState≥1 后立即把预 seek 目标（earth=20.27）写入 currentTime，
   * 沿用 pendingSeek 机制（applySeek 在 readyState<1 时排队）。
   * 只发起一次（preSeekInitiated）；canplay 再触发时不得二次 seek 覆盖后续定点。 */
  function maybePreSeek(m) {
    if (!m || !m.video || m.preSeek === null || m.preSeeked || m.preSeekInitiated || m.failed || m.saver) return
    if (m.video.readyState < 1) return
    m.preSeekInitiated = true
    if (m.pendingSeek === null) m.pendingSeek = m.preSeek
    m.seekTag = 'preSeek'
    applySeek(m)
  }

  function applySeek(m) {
    if (!m || !m.video || m.pendingSeek === null) return
    var target = m.pendingSeek
    m.pendingSeek = null
    try {
      if (m.video.readyState >= 1) m.video.currentTime = Math.max(0, target)
      else { m.pendingSeek = target; return }
    } catch (err) { /* noop */ }
  }

  /* tag：'preSeek'（冷态预 seek，load 时）/ 'ignite'（10.35 点火 seek）/
   *      'frozen'（QA 定格定点，禁用预 seek 覆盖）/ ''（其它） */
  function seekMedia(act, time, tag) {
    var m = media[act]
    if (!m || m.saver || m.failed || !m.video) return
    var target = Math.max(0, time)
    m.seekTag = tag || ''
    if (tag === 'frozen') m.preSeek = null   /* 定格显式定点：不再让 load 预 seek 覆盖 */
    try {
      if (!isFinite(m.video.duration) || m.video.duration <= 0) { m.pendingSeek = target; return }
      if (m.video.readyState >= 1) m.video.currentTime = target
      else m.pendingSeek = target
    } catch (err) { /* noop */ }
  }

  function playMedia(act) {
    var m = media[act]
    if (!m || m.saver || m.failed || !m.video) return false
    /* play() 返回的 promise 必须一律 catch：skip/arm 时 pause 竞态会抛
     * AbortError: play() interrupted by pause()（真机 Chrome 未捕获异常红线）。 */
    m.playTried = true
    try {
      var p = m.video.play()
      if (p && typeof p.catch === 'function') p.catch(function () { /* 自动播放被拦 / pause 竞态：静默 */ })
      return true
    } catch (err) { return false }
  }

  function pauseMedia(act) {
    var m = media[act]
    if (!m || !m.video) return
    try { m.video.pause() } catch (err) { /* noop */ }
  }

  /* v0.4 §5：playbackRate 只允许改地球视频（MOSS 视频红线：永不改 playbackRate） */
  function setPlaybackRate(act, rate) {
    if (act === 'moss') return
    var m = media[act]
    if (!m || !m.video || m.saver || m.failed) return
    var v = Math.max(0.1, Math.min(4, Number(rate) || 1))
    try {
      if (Number(m.video.playbackRate) !== v) m.video.playbackRate = v
      if (v !== 1) { m.video.__msRate = v } else { m.video.__msRate = 1 }
    } catch (err) { /* noop */ }
  }

  function stopMediaAll() {
    for (var key in media) {
      if (!has(media, key)) continue
      var m = media[key]
      if (!m || !m.video) continue
      try { m.video.pause() } catch (err) { /* noop */ }
      try { m.video.removeAttribute('src') } catch (err) { /* noop */ }
      try { m.video.load() } catch (err) { /* noop */ }
    }
    media = {}
  }

  /* 视频内容在视口中的真实几何（object-fit: cover 的换算；MOSS 视频无 transform） */
  function computeEyePoint() {
    var m = media.moss
    eyeDirty = false
    if (!stage) return
    var W = frameW || (stage.clientWidth || 1536)
    var H = frameH || (stage.clientHeight || 960)
    var vw = 1920, vh = 1080
    if (m && m.video && m.video.videoWidth) { vw = m.video.videoWidth; vh = m.video.videoHeight }
    var s = Math.max(W / vw, H / vh)
    var rw = vw * s
    var rh = vh * s
    eyePoint.x = (W - rw) / 2 + EYE.x * rw
    eyePoint.y = (H - rh) / 2 + EYE.y * rh
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 6. WebAudio（v0.3 §6：分层 BGM + 事件化 SFX；任何失败静默降级）
   * ----------------------------------------------------------------------
   * buildAudioGraph(ctx, opts) 是纯构建函数，同时支持 AudioContext 与
   * OfflineAudioContext（离线渲染证据：_work/demo/render-audio.mjs）。
   * opts: { offset: 已过去的启动秒数, volume: 0–100, duration: 总时长 }
   * 返回 { master, compressor, out, bgm, sfx, nodes, events, mix, fadeOut(sec) }。
   * 混音：master = (volume/100)*MIX.masterScale → DynamicsCompressor（阈值/比率/
   * 起振/释放见 MIX）→ 后级 makeup 增益 MIX.outputGain → destination。
   * 每个合成事件峰值仍先 ≤0.12 防爆音，再由 bgm/sfx bus drive 整体抬升后交给
   * compressor 压 crest factor（2026-11-07 按 Lead 实测响度要求调优：
   * volume=100 离线渲染目标 Integrated ≈ -20 LUFS / RMS ≈ -21 dBFS /
   * True Peak ≈ -1.5 dBFS；volume=50 时 Integrated ≈ -26 LUFS 仍清晰可闻）。
   * 所有包络用 setValueAtTime + exponentialRampToValueAtTime
   * （不使用 setTargetAtTime 的指数尾巴）。 */
  /* v0.5 §4：用户机械臂音轨（lib/assets/audio/moss-arm-sfx.m4a，48k AAC-LC 4.40s）
   * - ARM：3.900s 起播 4.40s，独立总线（不进合成器 comp/limiter，保留用户原始动态）；
   * - MOSS_ARM_FALLBACK=true：资产缺失/解码失败时回退 v0.4 合成关节层（console.warn 一次）。
   * - 解码超时 3000ms（2026-11-09 真宿主实测：启动期宿主忙，m4a response 827ms 才回、
   *   音频图 2.27s 才建好；1.5s 在慢机上会被误判超时而回退旧关节音。超时只在请求挂起时
   *   生效，正常路径不受影响；真失败则晚 3s 建图并回退，可接受）。 */
  var MOSS_ARM_ASSET = 'audio/moss-arm-sfx.m4a'
  var MOSS_ARM_FALLBACK = true
  var ARM_DECODE_TIMEOUT_MS = 3000
  var armFallbackWarned = false
  var armLoadSeq = 0
  /* v0.5 §4：BGM 在幕 II 为 arm 音轨让位（-6dB 静态 duck；3.90 硬切 -12dB；8.46 恢复） */
  var BGM_DUCK_DB = -6.0
  var BGM_CUT_DB = -12.0
  var BGM_DUCK = Math.pow(10, BGM_DUCK_DB / 20)
  var BGM_CUT = Math.pow(10, BGM_CUT_DB / 20)

  var MIX = {
    masterScale: 0.90,   /* 主增益映射：(volume/100)*masterScale（v0.2 为 0.42，实测过轻） */
    bgmDrive: 2.50,      /* BGM 床整体 +12dB（床/事件双路混音，Lead 2026-11-07 动态要求） */
    sfxDrive: 1.66,      /* 事件化 SFX 整体 +8.3dB（相对床更高，托起锁定重音） */
    threshold: -12,      /* DynamicsCompressor：只压最顶端，保留身体与锁定冲击感 */
    knee: 6,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    outputGain: 1.55,    /* compressor 后级 makeup（按离线渲染 Integrated ≈ -20LUFS 校准） */
    limitKnee: 0.72,     /* 末级 Waveshaper：|x|<=0.72 完全线性（≈ -2.8dBFS） */
    limitCeil: 0.86     /* 软削波上限 0.86（≈ -1.3dBFS，True Peak 目标 -1.5±0.5） */
  }
  function buildAudioGraph(ctx, opts) {
    var o = opts || {}
    var volume = Number(o.volume)
    if (!isFinite(volume)) volume = cfg.volume
    volume = volume < 0 ? 0 : (volume > 100 ? 100 : volume)
    var offset = Number(o.offset)
    if (!isFinite(offset) || offset < 0) offset = 0
    var duration = Number(o.duration)
    if (!isFinite(duration) || duration <= 0) duration = DURATION
    var nodes = []
    var events = 0
    /* v0.4 §3.2：事件列表探针（离线渲染同样生成；verifier 断言 kind/at/peak） */
    var audioEvents = []
    function logAudioEvent(kind, at, peak) {
      audioEvents.push({ kind: kind, at: Math.round(Number(at) * 1000) / 1000, peak: Math.round(Number(peak) * 10000) / 10000 })
    }
    function track(node) { if (node) nodes.push(node); return node }
    function cap(peak) { var v = Number(peak); if (!isFinite(v) || v < 0.0001) return 0.0001; return v > 0.12 ? 0.12 : v }

    var master = track(ctx.createGain())
    master.gain.setValueAtTime((volume / 100) * MIX.masterScale, ctx.currentTime)
    var comp = track(ctx.createDynamicsCompressor())
    try {
      comp.threshold.setValueAtTime(MIX.threshold, ctx.currentTime)
      comp.knee.setValueAtTime(MIX.knee, ctx.currentTime)
      comp.ratio.setValueAtTime(MIX.ratio, ctx.currentTime)
      comp.attack.setValueAtTime(MIX.attack, ctx.currentTime)
      comp.release.setValueAtTime(MIX.release, ctx.currentTime)
    } catch (err) { /* 老实现缺参数时静默 */ }
    var out = track(ctx.createGain())
    out.gain.setValueAtTime(MIX.outputGain, ctx.currentTime)
    /* 末级安全限幅（§6.5「DynamicsCompressor 兜底」的延伸 + Lead 2026-11-07 响度要求）：
     * Waveshaper 软削波，|x|<=limitKnee 完全线性（不改变 BGM 体感/锁定冲击感），
     * 之上平滑压到 limitCeil，保证任何渲染路径都不会出现 >0dBFS 的硬削波样本，
     * 也顺手兜住极少数单样本渲染伪影。离线 True Peak 校准见 _work/demo/render-audio.mjs。 */
    var limiter = track(ctx.createWaveShaper())
    try {
      var curveLen = 4097
      var curve = new Float32Array(curveLen)
      var knee = MIX.limitKnee
      var ceil = MIX.limitCeil
      for (var ci = 0; ci < curveLen; ci += 1) {
        var cx = -1.2 + (2.4 * ci / (curveLen - 1))
        var ax = cx < 0 ? -cx : cx
        var cy
        if (ax <= knee) cy = cx
        else cy = (cx < 0 ? -1 : 1) * (knee + (1 - Math.exp(-(ax - knee) * 4)) * (ceil - knee))
        curve[ci] = cy
      }
      limiter.curve = curve
      limiter.oversample = 'none' /* 2x 升采样会在锐瞬态上产生 intersample 过冲尖峰，实测会破 -1dBFS */
    } catch (err2) { /* noop */ }
    master.connect(comp)
    comp.connect(out)
    out.connect(limiter)
    limiter.connect(ctx.destination)
    var bgm = track(ctx.createGain()); bgm.gain.setValueAtTime(MIX.bgmDrive, ctx.currentTime); bgm.connect(master)
    var sfx = track(ctx.createGain()); sfx.gain.setValueAtTime(MIX.sfxDrive, ctx.currentTime); sfx.connect(master)

    var base = ctx.currentTime
    /* 确定性噪声（LCG）：同一份 graph 在真机与离线渲染得到相同波形，
     * 便于响度/True Peak 校准与回归对比（替代 Math.random）。 */
    var rngState = 0x9E3779B9
    function rand() {
      rngState = ((rngState * 1664525) + 1013904223) >>> 0
      return rngState / 4294967296
    }
    /* 所有调度时间对齐到采样格：避免 OfflineAudioContext 在「非整数采样起点」上
     * 出现单样本满幅伪影（实测 4.6000000000000005s 的 latch tick 触发过 -1.0 单样本尖峰），
     * 真机 AudioContext 同样受益且听感无差异（偏移 <1 sample）。 */
    function when(sec) {
      var at = base + Math.max(0, sec - offset)
      var grid = ctx.sampleRate > 0 ? ctx.sampleRate : 44100
      return Math.round(at * grid) / grid
    }
    function future(sec) { return sec >= offset - 0.06 }

    function noiseBuffer(seconds) {
      var len = Math.max(1, Math.floor(ctx.sampleRate * Math.max(0.02, seconds)))
      var buffer = ctx.createBuffer(1, len, ctx.sampleRate)
      var data = buffer.getChannelData(0)
      for (var i = 0; i < data.length; i++) data[i] = rand() * 2 - 1
      return buffer
    }
    function applyPoints(param, points) {
      for (var i = 0; i < points.length; i++) {
        var t = when(points[i][0])
        var v = Math.max(0.0001, Math.min(0.12, points[i][1]))
        if (i === 0) { try { param.setValueAtTime(v, t) } catch (e0) { /* noop */ } } else {
          try { param.exponentialRampToValueAtTime(v, t) } catch (e1) { try { param.setValueAtTime(v, t) } catch (e2) { /* noop */ } }
        }
      }
    }
    /* 单音（sine/square/tri/saw + 可选指数扫频） */
    function tone(freq, start, dur, peak, type, endFreq, bus) {
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var osc = track(ctx.createOscillator())
      var gain = track(ctx.createGain())
      osc.type = type || 'sine'
      try { osc.frequency.setValueAtTime(Math.max(20, freq), t) } catch (e0) { /* noop */ }
      if (endFreq) { try { osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur) } catch (e1) { /* noop */ } }
      var atk = Math.min(0.03, dur * 0.25)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(cap(peak), t + atk)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain); gain.connect(bus || sfx)
      osc.start(t); osc.stop(t + dur + 0.03)
      events += 1
    }
    /* 过滤噪声（bandpass/highpass/lowpass + 可选扫频） */
    function noise(start, dur, peak, type, freq, q, endFreq, bus) {
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var src = track(ctx.createBufferSource())
      src.buffer = noiseBuffer(dur)
      var filter = track(ctx.createBiquadFilter())
      filter.type = type || 'bandpass'
      try { filter.frequency.setValueAtTime(Math.max(30, freq || 900), t) } catch (e0) { /* noop */ }
      if (endFreq) { try { filter.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t + dur) } catch (e1) { /* noop */ } }
      filter.Q.setValueAtTime(q || 0.9, t)
      var gain = track(ctx.createGain())
      var atk = Math.min(0.04, dur * 0.3)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(cap(peak), t + atk)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.connect(filter); filter.connect(gain); gain.connect(bus || sfx)
      src.start(t); src.stop(t + dur + 0.03)
      events += 1
    }
    /* 液压嘶声：单条长噪声 + 增益包络 swell（替代 4.6/5.4/6.2 三次新建短噪声源；
     * 规避 OfflineAudioContext 在个别新噪声源起点 +6–9ms 出现的单样本伪影，
     * 真机实时渲染同样受益，听感等价于三次液压嘶声） */
    function hiss(start, dur, points, filterHz, q) {
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var src = track(ctx.createBufferSource())
      src.buffer = noiseBuffer(dur)
      var filter = track(ctx.createBiquadFilter())
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(filterHz || 2600, t)
      filter.Q.setValueAtTime(q || 0.9, t)
      var gain = track(ctx.createGain())
      applyPoints(gain.gain, points)
      src.connect(filter); filter.connect(gain); gain.connect(sfx)
      src.start(t); src.stop(when(start + dur) + 0.03)
      events += 1
    }
    /* 金属撞击（FM 短音 + 噪声 burst） */
    function metalHit(start, peak, baseHz, dur) {
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var carrier = track(ctx.createOscillator())
      carrier.type = 'triangle'
      carrier.frequency.setValueAtTime(baseHz, t)
      carrier.frequency.exponentialRampToValueAtTime(Math.max(20, baseHz * 0.55), t + dur)
      var mod = track(ctx.createOscillator())
      mod.type = 'square'
      mod.frequency.setValueAtTime(baseHz * 3.1, t)
      var modGain = track(ctx.createGain())
      modGain.gain.setValueAtTime(baseHz * 1.8, t)
      modGain.gain.exponentialRampToValueAtTime(1, t + dur)
      mod.connect(modGain); modGain.connect(carrier.frequency)
      var gain = track(ctx.createGain())
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(cap(peak), t + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      carrier.connect(gain); gain.connect(sfx)
      carrier.start(t); carrier.stop(t + dur + 0.03)
      mod.start(t); mod.stop(t + dur + 0.03)
      noise(start, Math.min(0.12, dur), peak * 0.55, 'highpass', 2400, 1.4)
      events += 1
    }
    /* 伺服电机 whir：sawtooth 扫频 + bandpass + 运动包络驱动的幅度起伏 */
    function servo(start, dur, peak, f0, f1) {
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var osc = track(ctx.createOscillator())
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f0, t)
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur)
      var filter = track(ctx.createBiquadFilter())
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(f0 * 3, t)
      filter.frequency.exponentialRampToValueAtTime(f1 * 4, t + dur)
      filter.Q.setValueAtTime(2.2, t)
      var gain = track(ctx.createGain())
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(cap(peak), t + Math.min(0.06, dur * 0.1))
      var steps = Math.min(40, Math.floor(dur / 0.1))
      for (var i = 1; i <= steps; i += 1) {
        var sec = start + dur * i / steps
        var env = mossEnergyAt(sec)
        try { gain.gain.exponentialRampToValueAtTime(cap(peak * (0.32 + 0.68 * env)), when(sec)) } catch (e0) { /* noop */ }
      }
      try { gain.gain.exponentialRampToValueAtTime(0.0001, t + dur) } catch (e1) { /* noop */ }
      osc.connect(filter); filter.connect(gain); gain.connect(sfx)
      osc.start(t); osc.stop(t + dur + 0.05)
      events += 1
    }
    /* 持续低音层/铺底：频段固定 + 显式渐变点（duck 也走这里） */
    function drone(freq, type, points, bus) {
      if (!points || points.length < 2) return
      var lastSec = points[points.length - 1][0]
      if (lastSec < offset - 0.06) return
      var t0 = when(points[0][0])
      var osc = track(ctx.createOscillator())
      osc.type = type || 'sine'
      osc.frequency.setValueAtTime(freq, t0)
      var gain = track(ctx.createGain())
      applyPoints(gain.gain, points)
      osc.connect(gain); gain.connect(bus || bgm)
      osc.start(t0); osc.stop(when(lastSec) + 0.06)
      events += 1
    }
    /* Pad：三/四音 sawtooth → lowpass（慢 LFO 扫滤波）→ 分层增益包络 */
    function pad(freqs, points, filterHz) {
      if (!points || points.length < 2) return
      var lastSec = points[points.length - 1][0]
      if (lastSec < offset - 0.06) return
      var t0 = when(points[0][0])
      var filter = track(ctx.createBiquadFilter())
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(filterHz || 520, t0)
      filter.Q.setValueAtTime(0.7, t0)
      var gain = track(ctx.createGain())
      applyPoints(gain.gain, points)
      filter.connect(gain); gain.connect(bgm)
      for (var i = 0; i < freqs.length; i += 1) {
        var osc = track(ctx.createOscillator())
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(freqs[i], t0)
        try { osc.detune.setValueAtTime(i % 2 === 0 ? -4 : 4, t0) } catch (e0) { /* noop */ }
        var og = track(ctx.createGain())
        og.gain.setValueAtTime(1 / freqs.length, t0)
        osc.connect(og); og.connect(filter)
        osc.start(t0); osc.stop(when(lastSec) + 0.06)
      }
      var lfo = track(ctx.createOscillator())
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.07, t0)
      var lfoGain = track(ctx.createGain())
      lfoGain.gain.setValueAtTime((filterHz || 520) * 0.28, t0)
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency)
      lfo.start(t0); lfo.stop(when(lastSec) + 0.06)
      events += 1
    }

    /* ── BGM 床（v0.5 §4：幕 II 3.90–8.30 由用户机械臂音轨接管，床体 duck 让位） ──
     * 用户音轨是连续全频段成品混音（-15.9 LUFS / 4.40s），实测 BGM 需退到 arm 层以下
     * 约 6dB 才能不掩蔽、不浑低频（标定见 _work/v05/audio/sweep-duck.json / SPEC.md §5）：
     *   3.86 起 -12dB 硬切砸落（保留 v0.4 剪辑重音）→ 4.60 起 -6dB duck → 8.28 结束
     *   → 8.46 恢复 0.019（幕 III 起点）→ 12.70 bloom 后 13.05 起随 warp 溶解淡出
     *   → 13.55 静音（v0.5 总长 13.90s；旧 v0.4 的 12.26/12.30 换场点作废）。 */
    var bedPoints = [[0, 0.0001], [1.4, 0.016], [3.86, 0.016], [3.94, 0.016 * BGM_CUT], [4.60, 0.016 * BGM_DUCK], [8.28, 0.016 * BGM_DUCK], [8.46, 0.019], [10.50, 0.019], [12.70, 0.019], [13.05, 0.012], [13.55, 0.0001]]
    drone(48, 'sine', bedPoints)
    drone(96, 'sine', [[0, 0.0001], [2.0, 0.0042], [3.86, 0.0042], [3.94, 0.0042 * BGM_CUT], [4.60, 0.0042 * BGM_DUCK], [8.28, 0.0042 * BGM_DUCK], [8.46, 0.0050], [10.6, 0.0050], [12.70, 0.0050], [13.05, 0.0030], [13.55, 0.0001]])
    drone(55, 'sine', [[0, 0.0001], [1.8, 0.0066], [3.86, 0.0066], [3.94, 0.0066 * BGM_CUT], [4.60, 0.0066 * BGM_DUCK], [8.28, 0.0066 * BGM_DUCK], [8.46, 0.0080], [10.35, 0.0080], [11.9, 0.0030], [12.70, 0.0030], [13.05, 0.0018], [13.55, 0.0001]])
    drone(110, 'triangle', [[0, 0.0001], [2.2, 0.0025], [3.86, 0.0025], [3.94, 0.0025 * BGM_CUT], [4.60, 0.0025 * BGM_DUCK], [8.28, 0.0025 * BGM_DUCK], [8.46, 0.0025], [10.35, 0.0025], [11.9, 0.0006], [12.70, 0.0006], [13.05, 0.0004], [13.55, 0.0001]])
    /* D 小调 pad（D3/F3/A3）→ 10.35 起 F 大调解决（F2/F3/A3/C4），做「点火/移交」呼吸 */
    pad([146.83, 174.61, 220.0], [[0.55, 0.0001], [1.7, 0.0145], [3.86, 0.0145], [3.94, 0.0145 * BGM_CUT], [4.60, 0.0145 * BGM_DUCK], [8.28, 0.0145 * BGM_DUCK], [8.46, 0.018], [10.30, 0.018], [10.46, 0.0001]], 600)
    pad([87.31, 174.61, 220.0, 261.63], [[10.35, 0.0001], [10.85, 0.057], [11.55, 0.057], [12.70, 0.040], [13.05, 0.022], [13.52, 0.0001]], 900)

    /* ── 幕 I（0.50–3.90）：BCI 连接 / 神经脉冲 / 3 行日志打字 / 故障电弧 ── */
    tone(360, 0.50, 0.42, 0.048, 'sine', 760)
    tone(1140, 0.54, 0.22, 0.015, 'sine')
    tone(1520, 1.06, 0.16, 0.010, 'sine')
    tone(1980, 1.32, 0.09, 0.0075, 'sine')
    tone(2340, 1.58, 0.07, 0.0065, 'sine')
    /* 打字 tick 对齐 NEURO_LOG 三行（1.90/2.26/2.62，每行 typing 0.30s） */
    var li, lk
    for (li = 0; li < 3; li += 1) {
      for (lk = 0; lk < 5; lk += 1) {
        tone(1780 + li * 90, TL.neuroLogStart + li * TL.neuroLogStep + lk * 0.055, 0.03, 0.0075, 'square')
      }
    }
    tone(660, 3.42, 0.30, 0.024, 'sine')
    tone(990, 3.44, 0.30, 0.016, 'sine')
    /* 3.50–3.86 故障段：电弧噪声（bandpass 噪声 + 快速 amplitude gating，纯音频）
     * 动态上压到背景级，让 3.90 硬切砸落明显抬 6–10dB（Lead 2026-11-07） */
    noise(3.52, 0.28, 0.017, 'highpass', 1200, 1.2)
    for (li = 0; li < 4; li += 1) noise(3.52 + li * 0.062, 0.035, 0.008, 'bandpass', 1600 + li * 320, 2.2)
    noise(3.74, 0.18, 0.025, 'highpass', 1600, 1.4)
    noise(3.82, 0.10, 0.021, 'highpass', 2200, 1.6)

    /* ══ v0.4 §3.2：幕 II 机械关节音效（重建）═══════════════════════════
     * 用户反馈「听不到机械关节声」：v0.3 的伺服 0.012 / 卡扣 0.003 是背景铺底级，
     * v0.4 以 moss.json 的运动包络 + keyEvents 事件表驱动：
     *   1) 伺服电机层（3.95–6.55）：sawtooth 55→135Hz + bandpass Q2.2 + 包络调幅，峰值 0.034；
     *   2) 机械关节层（事件化）：齿轮棘轮（6–10 个 8ms 短脉冲）+ 金属关节（FM + 噪声 burst）
     *      + 液压泄压（bandpass 1800→600Hz）；4.23/4.40/4.57/4.73 最强、6.87 纯关节感；
     *   3) 6.63 液压锁止重音 0.052；7.17 红眼点火对焦伺服；7.42 锁定重音 + 0.09s 锁扣二段；
     * 所有事件同步 push 到 __DSH_MOSS2_AUDIO_EVENTS__（只读探针，verifier 断言用）。 */
    /* v0.4：关节事件要「听得见」——三层叠加的合成峰值约为标称 peak 的 2–3 倍
     * （标称 peak 只进探针，用于 verifier 的 0.03–0.055 事件表断言），
     * 叠加后仍低于锁定重音（0.12），由末级软限幅兜住 True Peak。 */
    function burst(freq, start, dur, peak, type, endFreq) {
      /* 带平台段的下扫音（tone() 的指数衰减只够做「咔哒」，不产生 80ms 短时能量） */
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var osc = track(ctx.createOscillator())
      var gain = track(ctx.createGain())
      osc.type = type || 'triangle'
      osc.frequency.setValueAtTime(Math.max(20, freq), t)
      if (endFreq) { try { osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + dur) } catch (e0) { /* noop */ } }
      var pk = cap(peak)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(pk, t + Math.min(0.008, dur * 0.18))
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, pk * 0.55), t + dur * 0.52)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.connect(gain); gain.connect(sfx)
      osc.start(t); osc.stop(t + dur + 0.03)
      events += 1
    }
    function ratchet(start, peak, w, heavy) {
      /* loud 事件：棘轮脉冲也压进 60ms 内（n×gap ≤ 60ms），否则 400ms 床被拉长、
       * 500–4kHz 对比永远够不到 8dB（其余事件保留 8–11 个脉冲的机械声纹理）。 */
      var n = heavy ? 5 : Math.max(8, Math.min(11, Math.round(8 + 3 * w)))
      var gap = heavy ? 0.012 : (0.012 + 0.006 * (1 - w))
      for (var k = 0; k < n; k += 1) {
        var f = 900 + 700 * ((k * 7 + Math.round(w * 100)) % 9) / 9
        /* 900–1600Hz 正好落在 500–4kHz 验收带内：中事件压到 -12dB，避免抬高 loud 事件的床 */
        tone(f, start + k * gap, 0.010, peak * (heavy ? 1.55 : 0.18) * (1 - 0.5 * k / (n + 2)), 'square')
      }
      tone(2350 + 200 * w, start + 0.01, 0.05, peak * (heavy ? 0.6 : 0.1), 'triangle')
      /* 关节落位的低频 body（带平台段；loud 事件把时域峰值让给 7.42 锁定重音） */
      burst(96 + 26 * w, start, 0.14, peak * (heavy ? 0.60 : 1.5), 'triangle', 58)
      burst(58, start + 0.006, 0.20, peak * (heavy ? 0.50 : 1.25), 'sine', 40)
    }
    function jointBody(start, peak, heavy) {
      /* loud 事件的金属撞击噪声也必须 ≤60ms（band 内），中事件只保留低频体感 */
      metalHit(start, peak * (heavy ? 1.10 : 0.65), 110 + 100 * ((start * 37) % 1), heavy ? 0.06 : 0.13)
      noise(start + 0.005, heavy ? 0.05 : 0.10, peak * (heavy ? 0.95 : 0.06), 'highpass', 2200, 1.6)
    }
    /* v0.4 §3.2（Lead 频段验收口径 500–4000Hz）：
     * 60ms 视窗 / 400ms 局部床的对比理论上限 = 20log10(sqrt(400/60)) = 8.24dB，
     * 因此 loud 事件把带内能量做成「严格 60ms、近似方波包络的连续带噪声」，
     * 不在事件前后留任何带入拖尾（否则床一起抬高，对比度上不去）。 */
    function bandNoise(start, dur, peak, freq) {
      if (!future(start) || !(dur > 0)) return
      var t = when(start)
      var src = track(ctx.createBufferSource())
      src.buffer = noiseBuffer(dur + 0.004)
      var flt = track(ctx.createBiquadFilter())
      flt.type = 'bandpass'
      flt.frequency.setValueAtTime(freq, t)
      flt.Q.setValueAtTime(1.0, t)
      var gain = track(ctx.createGain())
      var pk = cap(peak)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(pk, t + 0.004)
      gain.gain.setValueAtTime(pk, t + dur - 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.connect(flt); flt.connect(gain); gain.connect(sfx)
      src.start(t); src.stop(t + dur + 0.01)
      events += 1
    }
    function bandClick(start, peak, heavy) {
      /* 每一个 joint/latch/focus 事件都有 2.2–4kHz 短咔哒（Lead 2026-11-07 频段实测要求）：
       * loud 事件用 60ms 连续带噪声拿满对比度；其余事件用 20ms 带噪声 + 12ms square 脉冲。 */
      if (heavy) {
        bandNoise(start, 0.060, Math.min(0.12, peak * 2.0), 2900)
        bandNoise(start, 0.060, Math.min(0.12, peak * 1.6), 3500)
        return
      }
      bandNoise(start, 0.028, Math.min(0.12, peak * 2.8), 3000)
      tone(2350 + 300 * (Math.round(peak * 1000) % 5), start, 0.014, Math.min(0.12, peak * 2.4), 'square')
    }
    function latchEvent(start, peak) {
      tone(58, start, 0.46, peak * 1.05, 'sine', 38)
      tone(150, start, 0.20, peak * 0.62, 'triangle', 70)
      metalHit(start, Math.min(0.12, peak * 1.15), 190, 0.22)
      noise(start + 0.02, 0.24, peak * 0.55, 'bandpass', 1800, 1.1, 600)
    }
    function focusServo(start, peak) {
      /* 红眼点火：低频光圈上扫 + 60ms 内的高频对焦 tick（带内能量不外溢，
       * 否则 400ms 局部床被拉高、7.17 的频段对比达不到 8dB） */
      burst(180, start, 0.16, peak * 1.6, 'sine', 420)
      tone(620, start, 0.05, peak * 0.9, 'sine', 980)
      tone(1400, start + 0.012, 0.014, peak * 0.8, 'square')
      tone(2400, start + 0.026, 0.012, peak * 0.7, 'square')
    }

    /* 3.90 硬切：低频砸落 + 金属撞击（v0.5 §4.3：保留、-3dB；用户音轨整段接管幕 II） */
    var MOSS_CUT_GAIN = 0.708
    tone(96, 3.90, 0.55, 0.096 * MOSS_CUT_GAIN, 'sine', 38)
    tone(220, 3.90, 0.30, 0.028 * MOSS_CUT_GAIN, 'triangle', 150)
    metalHit(3.90, 0.070 * MOSS_CUT_GAIN, 170, 0.16)
    logAudioEvent('cut', 3.90, 0.096 * MOSS_CUT_GAIN)

    /* ══ v0.5 §4：用户机械臂音轨（opts.armBuffer）══════════════════════════════
     * 用户音轨是成品混音（AAC 48k 4.40s / -16.7 LUFS / TP -1.9dBFS）。实测若走合成器
     * master 链（master→comp(-12dB,4:1)→out 1.55→limiter）会被 makeup 增益推爆：
     * volume=100 整曲 I -9.7 LUFS / True Peak +0.8 dBFS / crest 压掉约 9dB。
     * 故 arm 层走独立总线：armGain=(volume/100)*ARM.level → 专用软限幅 → destination，
     * 保留用户原始动态；BGM 已由 bedPoints 静态 duck 让位。fadeOut 同步淡出 arm。
     * 无 buffer 时回退 v0.4 合成关节层（MOSS_ARM_FALLBACK；console.warn 一次）。 */
    /* SPEC §5 数值：at=3.900 / duration=4.40 / 起播 offset: 0 / ARM_LEVEL=1.00 /
     * 软限幅 knee=0.55、ceil=0.68（真机与离线渲染共用同一份常量） */
    var ARM_PLAY = { at: 3.900, duration: 4.40, offset: 0, level: 1.00, knee: 0.55, ceil: 0.68 }
    var armBuf = (o.armBuffer && typeof o.armBuffer.getChannelData === 'function') ? o.armBuffer : null
    var armGainNode = null
    var armSfx = { ok: false, fallback: true, duration: 0, offset: ARM_PLAY.at, gain: 0, decodedAt: 0 }
    if (armBuf) {
      var armDur = Math.min(ARM_PLAY.duration, Number(armBuf.duration) || ARM_PLAY.duration)
      var armStartRel = ARM_PLAY.at - offset
      var armSeek = armStartRel < 0 ? -armStartRel : 0
      var armDelay = armStartRel > 0 ? armStartRel : 0
      var armPlayDur = armDur - armSeek
      var armGainVal = (volume / 100) * ARM_PLAY.level
      if (armPlayDur > 0.05) {
        var armSrc = track(ctx.createBufferSource())
        armSrc.buffer = armBuf
        armGainNode = track(ctx.createGain())
        armGainNode.gain.setValueAtTime(armGainVal, ctx.currentTime)
        var armShaper = track(ctx.createWaveShaper())
        try {
          var armCurveLen = 4097
          var armCurve = new Float32Array(armCurveLen)
          for (var ai = 0; ai < armCurveLen; ai += 1) {
            var ax = -1.2 + (2.4 * ai / (armCurveLen - 1))
            var aax = ax < 0 ? -ax : ax
            var ay
            if (aax <= ARM_PLAY.knee) ay = ax
            else ay = (ax < 0 ? -1 : 1) * (ARM_PLAY.knee + (1 - Math.exp(-(aax - ARM_PLAY.knee) * 4)) * (ARM_PLAY.ceil - ARM_PLAY.knee))
            armCurve[ai] = ay
          }
          armShaper.curve = armCurve
          armShaper.oversample = 'none'
        } catch (armErr) { /* noop：无软限幅也照播（资产本身已 ≤-1.88dBFS） */ }
        armSrc.connect(armGainNode)
        armGainNode.connect(armShaper)
        armShaper.connect(ctx.destination)
        /* 迟到初始化（skip / ctx 建立晚于 3.90s）：从 buffer 对应位置起播，保持帧对齐。
         * 正常路径 offset=0 → start(when(3.900), 0, 4.40)。 */
        armSrc.start(when(ARM_PLAY.at + armSeek), armSeek, armPlayDur)
        logAudioEvent('arm-sfx', 3.900, armGainVal)
        armSfx = { ok: true, fallback: false, duration: armDur, offset: ARM_PLAY.at, gain: armGainVal,
                   decodedAt: Number(o.armDecodedAt) || 0 }
      } else {
        /* 已过幕 II：不补播，避免与画面错位 */
        armSfx = { ok: true, fallback: false, duration: armDur, offset: ARM_PLAY.at, gain: 0,
                   decodedAt: Number(o.armDecodedAt) || 0 }
      }
    } else if (MOSS_ARM_FALLBACK) {
      /* ── 回退层（v0.4 合成机械臂音效，资产缺失/解码失败时才运行）─────────────
       * 伺服电机层 + rumble hiss + MOSS_JOINTS 13 条关节事件 + 近景低频移动声。
       * 保留原实现；不静默降级：console.warn 一次 + armSfx.fallback=true。 */
      servo(3.95, 2.60, 0.034, 55, 135)
      var rumble = [[3.95, 0.0001]]
      for (var ri = 0; ri <= 10; ri += 1) {
        var rt = 4.35 + ri * 0.22
        rumble.push([rt, 0.0025 + 0.0075 * mossEnergyAt(rt)])
      }
      rumble.push([6.55, 0.0001])
      hiss(3.95, 2.62, rumble, 220, 0.8)
      for (var ji = 0; ji < MOSS_JOINTS.length; ji += 1) {
        var j = MOSS_JOINTS[ji]
        var heavy = !!j.loud
        if (j.style === 'latch') {
          latchEvent(j.at, j.peak)
          bandClick(j.at, j.peak, heavy)
        } else if (j.style === 'focus') {
          focusServo(j.at, j.peak)
          bandClick(j.at, j.peak, heavy)
        } else if (j.style === 'ratchet') {
          ratchet(j.at, j.peak, j.w, heavy)
          jointBody(j.at, j.peak * (heavy ? 0.9 : 0.5), heavy)
          bandClick(j.at, j.peak, heavy)
        } else {
          ratchet(j.at, j.peak, j.w, heavy)
          jointBody(j.at, j.peak, heavy)
          bandClick(j.at, j.peak, heavy)
          if (!heavy) noise(j.at + 0.01, 0.12, j.peak * 0.10, 'bandpass', 1700, 1.2, 700)
        }
        logAudioEvent(j.kind, j.at, j.peak)
      }
      var moveTimes = [4.23, 4.40, 4.57, 4.73, 5.00, 5.17]
      for (var mi = 0; mi < moveTimes.length; mi += 1) {
        var me = mossEnergyAt(moveTimes[mi])
        noise(moveTimes[mi], 0.26, 0.004 + 0.006 * me, 'bandpass', 420 + mi * 60, 1.4)
        tone(120, moveTimes[mi], 0.12, 0.0020 + 0.0026 * me, 'sawtooth', 180)
      }
      try {
        if (!armFallbackWarned) {
          armFallbackWarned = true
          console.warn('[splash] v0.5 arm sfx asset unavailable → fallback to synthetic joint layer')
        }
      } catch (warnErr) { /* noop */ }
    }

    /* 3) 6.50–7.16 收敛（准心收口）：上升 sine + 加速 tick */
    tone(220, 6.50, 0.66, 0.008, 'sine', 880)
    for (li = 0; li < 8; li += 1) tone(1400 + li * 120, 6.52 + li * 0.075, 0.03, 0.0035, 'square')
    /* 7.16 红眼点亮 → 7.42 锁定：张力 riser */
    noise(7.16, 0.26, 0.013, 'bandpass', 220, 1.1, 4200)
    tone(110, 7.16, 0.26, 0.009, 'sawtooth', 480)
    /* 4) 7.42 锁定重音（v0.5 §4.3：用户音轨在绝对 7.414s 已有强瞬态 + 强段
     * （80ms -15.2dBFS，onset 118 > p97 98.6），故整组 -6dB，只保留低频锁扣语义与
     * 尾音，不与用户音轨的锁定重音叠加成双触发。 */
    var LOCK_GAIN = 0.501
    tone(60, 7.42, 0.60, 0.120 * LOCK_GAIN, 'sine', 30)
    tone(140, 7.42, 0.22, 0.050 * LOCK_GAIN, 'triangle', 60)
    tone(90, 7.42, 0.30, 0.060 * LOCK_GAIN, 'triangle', 45)
    metalHit(7.42, 0.115 * LOCK_GAIN, 300, 0.20)
    tone(1760, 7.42, 0.10, 0.014 * LOCK_GAIN, 'sine')
    tone(1980, 7.49, 0.10, 0.014 * LOCK_GAIN, 'sine')
    tone(2200, 7.56, 0.10, 0.013 * LOCK_GAIN, 'sine')
    tone(2640, 7.44, 1.10, 0.012 * LOCK_GAIN, 'sine', 2600)
    tone(55, 7.42, 1.40, 0.018 * LOCK_GAIN, 'sine')
    tone(45, 7.42, 0.80, 0.070 * LOCK_GAIN, 'sine', 28)
    tone(48, 7.42, 0.90, 0.085 * LOCK_GAIN, 'sine', 26)
    logAudioEvent('lock', 7.42, 0.115 * LOCK_GAIN)
    metalHit(7.51, 0.028 * LOCK_GAIN, 520, 0.09)
    tone(3120, 7.51, 0.06, 0.008 * LOCK_GAIN, 'square')
    tone(2400, 7.53, 0.36, 0.007 * LOCK_GAIN, 'sine', 2380)
    /* 7.62 终局对焦到位：短促「聚焦伺服」tick（0.02） */
    tone(1480, 7.62, 0.05, 0.020, 'sine', 1900)
    tone(2650, 7.63, 0.03, 0.010, 'square')
    /* 7.62–8.06 锁定维持：数据 tick（相对锁定重音迅速回落） */
    for (li = 0; li < 4; li += 1) tone(1320 + li * 180, 7.70 + li * 0.12, 0.04, 0.0028, 'square')
    tone(1320, 4.62, 0.04, 0.002, 'square')
    tone(1440, 4.70, 0.04, 0.002, 'square')
    tone(1560, 4.78, 0.04, 0.002, 'square')

    /* ── 幕 III（8.06–10.35）：预转场拉丝 / 分割 whoosh / data wipe / 数据包 / 点火预告 ── */
    noise(8.06, 0.26, 0.020, 'bandpass', 320, 1.0, 2800)
    tone(110, 8.06, 0.26, 0.010, 'sawtooth', 380)
    noise(8.30, 0.34, 0.028, 'bandpass', 700, 1.1, 2400)
    tone(1046.5, 8.32, 0.50, 0.0105, 'sine')
    tone(1568, 8.34, 0.26, 0.006, 'sine')
    tone(880, 8.62, 0.34, 0.006, 'sine', 1320)
    tone(1320, 8.76, 0.30, 0.0055, 'sine', 1760)
    for (li = 0; li < 4; li += 1) noise(8.32 + li * 0.06, 0.10, 0.010, 'bandpass', 2600, 2.0, 1200)
    /* 9.12–9.90 接缝数据包 ×3 循环 2 次：每包抵达接缝一个小 tick（共 6 下） */
    for (var cyc2 = 0; cyc2 < 2; cyc2 += 1) {
      for (li = 0; li < 3; li += 1) {
        var pt2 = 9.12 + cyc2 * 0.39 + li * 0.11
        tone(1980 + li * 220, pt2 + 0.20, 0.03, 0.0055, 'square')
        tone(2960 + li * 180, pt2 + 0.24, 0.02, 0.0035, 'sine')
      }
    }
    /* 9.46 移交卡：三音上行 */
    tone(392, 9.16, 0.30, 0.012, 'sine')
    tone(523.25, 9.26, 0.30, 0.010, 'sine')
    tone(783.99, 9.36, 0.30, 0.008, 'sine')
    /* 9.82–10.18 引擎点火预告：低频预压（只是预告，地球仍然没有喷射） */
    noise(9.82, 0.38, 0.012, 'bandpass', 140, 0.9, 320)
    tone(45, 9.82, 0.40, 0.020, 'sine', 52)
    /* 10.02–10.35 接缝左扫：上升 riser */
    noise(10.02, 0.34, 0.026, 'bandpass', 300, 0.9, 3000)
    tone(60, 10.02, 0.34, 0.016, 'sawtooth', 300)

    /* ── 幕 IV（10.35–12.80）：点火 / 行星轰鸣 / 星光 / 交接三和弦 / BOOT COMPLETE ── */
    tone(30, 10.35, 1.10, 0.095, 'sine', 26)
    tone(87.31, 10.35, 1.40, 0.037, 'sine')
    noise(10.35, 0.24, 0.030, 'lowpass', 800, 0.9)
    /* 10.46 尾迹进入画面（= 点火闪光峰值）：冰蓝点火重音（kind='ignite'） */
    tone(52, 10.46, 0.70, 0.085, 'sine', 30)
    tone(1046.5, 10.46, 0.50, 0.020, 'sine', 1568)
    noise(10.46, 0.42, 0.034, 'highpass', 1200, 1.2)
    tone(3136, 10.47, 0.30, 0.008, 'sine', 2400)
    logAudioEvent('ignite', 10.46, 0.085)
    /* 星光颗粒（10.72 / 10.90 / 11.10 / 11.30） */
    tone(2400, 10.72, 0.08, 0.006, 'sine')
    tone(3100, 10.90, 0.07, 0.005, 'sine')
    tone(2800, 11.10, 0.06, 0.005, 'sine')
    tone(3500, 11.30, 0.06, 0.004, 'sine')
    /* 11.55 armHandoff 三和弦（保留并加强） */
    tone(523.25, 11.55, 0.75, 0.036, 'sine')
    tone(783.99, 11.56, 0.75, 0.027, 'sine')
    tone(1046.5, 11.57, 0.62, 0.017, 'sine')
    /* 11.80 BOOT COMPLETE：温暖两音解决 */
    tone(659.25, 11.80, 0.42, 0.022, 'sine')
    tone(987.77, 11.86, 0.50, 0.018, 'sine')
    tone(1318.5, 11.90, 0.36, 0.010, 'sine')
    /* 12.70 冰白 bloom（v0.5 §1/§3.1：12.70→13.30，峰值 13.02；旧 12.28/12.30 换场点作废）：
     * 高频 shimmer 向 13.02 峰值上扬；13.05 起启动层 warp 溶解（810ms），一条极轻空气
     * noise 抚平收尾，避免 13.3 之后突然静音。 */
    noise(12.70, 0.36, 0.022, 'highpass', 2600, 1.1)
    tone(2637, 12.70, 0.42, 0.010, 'sine', 3951)
    noise(13.05, 0.50, 0.006, 'highpass', 4200, 1.0)

    /* v0.4 §3.2.4：事件探针（真机与离线渲染共用同一份 buildAudioGraph → 都发布） */
    try { window.__DSH_MOSS2_AUDIO_EVENTS__ = audioEvents } catch (errEv) { /* noop */ }

    return {
      ctx: ctx,
      master: master,
      compressor: comp,
      out: out,
      limiter: limiter,
      bgm: bgm,
      sfx: sfx,
      armSfx: armSfx,
      nodes: nodes,
      events: events,
      audioEvents: audioEvents,
      duration: duration,
      mix: MIX,
      gainValue: (volume / 100) * MIX.masterScale,
      fadeOut: function (seconds) {
        var fade = Number(seconds)
        if (!isFinite(fade) || fade <= 0) fade = AUDIO_FADE
        try {
          var now = ctx.currentTime
          var current = 0.0001
          try { current = Math.max(0.0001, Number(master.gain.value) || 0.0001) } catch (e0) { /* noop */ }
          master.gain.cancelScheduledValues(now)
          master.gain.setValueAtTime(current, now)
          master.gain.exponentialRampToValueAtTime(0.0001, now + fade)
        } catch (err) { /* 静默 */ }
        /* v0.5 §4：arm 层独立于 master 链，fadeOut 必须同步淡出（skip/finish 后不留声） */
        try {
          if (armGainNode) {
            var now2 = ctx.currentTime
            var cur2 = Math.max(0.0001, Number(armGainNode.gain.value) || 0.0001)
            armGainNode.gain.cancelScheduledValues(now2)
            armGainNode.gain.setValueAtTime(cur2, now2)
            armGainNode.gain.exponentialRampToValueAtTime(0.0001, now2 + fade)
          }
        } catch (armFadeErr) { /* 静默 */ }
      }
    }
  }

  /* v0.3：音频只读探针（每次 init / stop 后更新，供 verifier 断言） */
  function updateAudioProbe(ok, error) {
    try {
      if (!audioProbe) {
        audioProbe = { ok: false, ctxState: 'none', started: false, nodes: 0, masterGain: 0, events: 0, error: '' }
        window.__DSH_MOSS2_AUDIO_STATE__ = audioProbe
      }
      audioProbe.ok = ok === undefined ? !!audioProbe.ok : !!ok
      audioProbe.ctxState = audioCtx ? String(audioCtx.state || 'unknown') : 'none'
      audioProbe.started = !!audioStarted
      audioProbe.nodes = audioNodes.length
      audioProbe.masterGain = audioGraph
        ? (Number(audioGraph.gainValue) || 0)
        : (audioMaster ? (Number(cfg.volume) / 100) * MIX.masterScale : 0)
      audioProbe.events = audioEventCount
      /* v0.5 §4.3：arm 音轨只读探针（6 字段，verifier 断言） */
      var armState = audioGraph && audioGraph.armSfx ? audioGraph.armSfx : null
      audioProbe.armSfx = {
        ok: !!(armState && armState.ok),
        fallback: armState ? !!armState.fallback : true,
        duration: armState ? (Number(armState.duration) || 0) : 0,
        offset: armState ? (Number(armState.offset) || 3.9) : 3.9,
        gain: armState ? (Number(armState.gain) || 0) : 0,
        decodedAt: armState ? (Number(armState.decodedAt) || 0) : 0
      }
      audioProbe.error = error === undefined || error === null ? '' : String(error)
    } catch (err) { /* noop */ }
  }

  /* v0.5 §4：构建音频图（armBuffer 可空 → 回退合成层）。真机与离线渲染共用同一入口。 */
  function buildAudioNow(armBuffer, armStatus) {
    audioGraph = buildAudioGraph(audioCtx, {
      offset: Math.max(0, elapsed()),
      volume: cfg.volume,
      duration: DURATION,
      armBuffer: armBuffer || null,
      armDecodedAt: armStatus === 'ok' ? clockNow() : 0
    })
    audioNodes = audioGraph.nodes
    audioMaster = audioGraph.master
    audioEventCount = audioGraph.events
    try {
      /* 事件只读探针（离线渲染同样生成，verifier 断言 kind/at/peak） */
      window.__DSH_MOSS2_AUDIO_EVENTS__ = audioGraph.audioEvents || []
    } catch (errE) { /* noop */ }
    try {
      window.__DSH_MOSS2_AUDIO__ = {
        get state() { return audioCtx ? String(audioCtx.state) : 'closed' },
        get graph() { return audioGraph },
        get events() { return audioEventCount }
      }
    } catch (err) { /* noop */ }
    updateAudioProbe(true)
  }

  function initAudio() {
    if (audioStarted || reduced || !cfg.sound || cfg.volume <= 0) { updateAudioProbe(); return }
    audioStarted = true
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext
      if (!Ctor) { audioStarted = false; updateAudioProbe(false, 'AudioContext unavailable'); return }
      audioCtx = new Ctor()
      if (audioCtx.state === 'suspended') {
        var resumed = audioCtx.resume()
        if (resumed && typeof resumed.catch === 'function') resumed.catch(function () { /* silent */ })
      }
      /* 首次用户手势再 resume 一次（Electron 自动播放策略） */
      try {
        var resumeOnce = function () {
          try {
            if (audioCtx && audioCtx.state === 'suspended') {
              var p = audioCtx.resume()
              if (p && typeof p.catch === 'function') p.catch(function () { /* silent */ })
            }
          } catch (err) { /* noop */ }
        }
        window.addEventListener('keydown', resumeOnce, { once: true })
        window.addEventListener('pointerdown', resumeOnce, { once: true })
      } catch (err) { /* noop */ }
      /* v0.5 §4.3：先 fetch+decode 用户机械臂音轨（≤1.5s 超时），再建图；
       * 失败/超时/quality=saver → 无 buffer 路径（回退 v0.4 合成关节层，不静默）。 */
      var seq = ++armLoadSeq
      var settled = false
      var timer = 0
      var finish = function (armBuffer, status) {
        if (settled || seq !== armLoadSeq) return
        settled = true
        try { if (timer) window.clearTimeout(timer) } catch (e0) { /* noop */ }
        if (audioProbe) audioProbe.armStatus = status
        try {
          buildAudioNow(armBuffer, status)
        } catch (errBuild) {
          updateAudioProbe(false, (errBuild && errBuild.message) || errBuild)
          stopAudio(true)
        }
      }
      if (quality === 'saver' || typeof window.fetch !== 'function' || !audioCtx.decodeAudioData) {
        finish(null, quality === 'saver' ? 'saver-skip' : 'unsupported')
        return
      }
      timer = window.setTimeout(function () { finish(null, 'timeout') }, ARM_DECODE_TIMEOUT_MS)
      try {
        window.fetch(assetUrl(MOSS_ARM_ASSET), { cache: 'no-store' })
          .then(function (res) {
            if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status))
            return res.arrayBuffer()
          })
          .then(function (ab) {
            return new Promise(function (resolve, reject) {
              try {
                var ret = audioCtx.decodeAudioData(ab, resolve, reject)
                if (ret && typeof ret.then === 'function') ret.then(resolve, reject)
              } catch (decErr) { reject(decErr) }
            })
          })
          .then(function (buf) { finish(buf, 'ok') })
          .catch(function (errLoad) { finish(null, 'decode-failed:' + ((errLoad && errLoad.message) || errLoad)) })
      } catch (errFetch) {
        finish(null, 'fetch-threw:' + ((errFetch && errFetch.message) || errFetch))
      }
    } catch (err) {
      updateAudioProbe(false, (err && err.message) || err)
      stopAudio(true)
    }
  }

  /* skip/finish/dispose：300ms 淡出后 close（§6）；immediate 用于初始化失败兜底 */
  function stopAudio(immediate) {
    var ctxToClose = audioCtx
    var nodesToDrop = audioNodes
    try {
      if (!immediate && audioGraph && typeof audioGraph.fadeOut === 'function') audioGraph.fadeOut(AUDIO_FADE)
    } catch (err) { /* noop */ }
    audioCtx = null
    audioMaster = null
    audioGraph = null
    audioNodes = []
    audioEventCount = 0
    audioStarted = false
    var wait = immediate ? 0 : Math.round(AUDIO_FADE * 1000) + 40
    try {
      window.setTimeout(function () {
        for (var i = 0; i < nodesToDrop.length; i += 1) { try { nodesToDrop[i].disconnect() } catch (e0) { /* noop */ } }
        if (ctxToClose) {
          try {
            var closing = ctxToClose.close()
            if (closing && typeof closing.catch === 'function') closing.catch(function () { /* silent */ })
          } catch (e1) { /* noop */ }
        }
      }, wait)
    } catch (err) { /* noop */ }
    updateAudioProbe()
    /* 停止后探针语义：ok 保留「初始化是否成功过」，ctxState 明确为 closed */
    if (audioProbe) {
      audioProbe.started = false
      audioProbe.ctxState = 'closed'
      audioProbe.nodes = 0
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 7. Milestones（离散事件；rAF 与 setTimeout 双驱动，幂等）
   * ══════════════════════════════════════════════════════════════════════ */
  /* v0.5 §1/§3.1 里程碑（毫秒）：500 neuro / 3900 cut / 8300 split / 10350 earth /
   * 11550 arm / 11800 bootComplete / 12700 bloom / 13050 fade / 13900 done。
   * startHandoff() 只在 13.05 调一次。 */
  var MILESTONES = [
    { at: 500, key: 'neuro', run: function () { playMedia('neuro') } },
    { at: 3900, key: 'cut', run: startMoss },
    { at: 8300, key: 'split', run: startSplit },
    { at: 10350, key: 'earth', run: startEarth },
    { at: 11550, key: 'arm', run: armHandoffNow },
    { at: 11800, key: 'bootComplete', run: startBootComplete },
    { at: 12700, key: 'bloom', run: startHandoffBloom },
    { at: 13050, key: 'fade', run: startHandoff },
    { at: 13900, key: 'done', run: function () { finish('natural') } }
  ]
  function milestoneByKey(key) {
    for (var i = 0; i < MILESTONES.length; i++) if (MILESTONES[i].key === key) return MILESTONES[i]
    return null
  }

  function runMilestone(m) {
    if (flags[m.key]) return
    flags[m.key] = true
    try { m.run() } catch (err) { /* 单点失败不阻断后续交接 */ }
  }
  function runDueMilestones(t) {
    var ms = t * 1000
    for (var i = 0; i < MILESTONES.length; i++) {
      if (!flags[MILESTONES[i].key] && ms >= MILESTONES[i].at) runMilestone(MILESTONES[i])
    }
  }
  function scheduleMilestones(fromT) {
    for (var i = 0; i < milestoneTimers.length; i++) { try { window.clearTimeout(milestoneTimers[i]) } catch (err) { /* noop */ } }
    milestoneTimers.length = 0
    for (var j = 0; j < MILESTONES.length; j++) {
      var m = MILESTONES[j]
      if (flags[m.key]) continue
      var delay = m.at - fromT * 1000
      if (delay <= 0) continue
      (function (mm) {
        var id = window.setTimeout(function () {
          for (var k = 0; k < milestoneTimers.length; k++) if (milestoneTimers[k] === id) { milestoneTimers.splice(k, 1); break }
          untrack(id)
          runMilestone(mm)
        }, delay)
        milestoneTimers.push(id)
        timers.push(id)
      })(m)
    }
  }

  function startMoss() {
    var m = media.moss
    if (m && m.video && !m.saver && !m.failed) {
      try { m.video.currentTime = 0 } catch (err) { /* noop */ }
    }
    playMedia('moss')
    pauseMedia('neuro')
    if (el.topbarL) textOf(el.topbarL, '550W · MOSS // 启动序列')
  }

  function startSplit() {
    pauseMedia('neuro')
    /* v0.4 §4.2：左 half MOSS 画面冻结（暂停在锁定帧） */
    pauseMedia('moss')
    /* v0.5 §2.2.1：地球冷态帧已在媒体 load 时预 seek 到 EARTH.coldAt(20.27)，
     * 8.30 不再 seek（短 GOP 下预 seek 已完成）；只有实测偏移 >0.75s 才兜底补一次。 */
    var em = media.earth
    var eCt = (em && em.video) ? Number(em.video.currentTime) : NaN
    if (!em || !em.preSeeked || !isFinite(eCt) || Math.abs(eCt - EARTH.coldAt) > 0.75) {
      seekMedia('earth', EARTH.coldAt, 'preSeek')
    }
    /* v0.4 §5：幕 III 地球 = 冷态未点火（圆形遮罩 + 冷调；playbackRate 0.65 慢速漂移） */
    setPlaybackRate('earth', 0.65)
    playMedia('earth')
    if (el.actEarth) { try { el.actEarth.classList.add('ms-earth-cold') } catch (err0) { /* noop */ } }
    if (el.topbarL) textOf(el.topbarL, 'CONTROL TRANSFER // 控制权移交')
    if (el.footR) textOf(el.footR, 'SYS · 550W → EARTH ENGINE')
  }

  /* v0.4 §5.2 / v0.5 §2.2.2：10.35 点火 —— seek 点火段 / playbackRate 1.0 / 移除冷态 class；
   * 冰蓝闪光与扩散光环由 render 按 TL.ignite(10.35–10.95) 驱动，遮罩移除仍 10.46。 */
  function startEarth() {
    setPlaybackRate('earth', 1)
    if (el.actEarth) {
      try { el.actEarth.classList.remove('ms-earth-cold') } catch (err0) { /* noop */ }
      try { el.actEarth.classList.add('ms-earth-ignite') } catch (err1) { /* noop */ }
    }
    var em = media.earth
    if (em) { em.igniteSeekMs = 0 }
    if (EARTH.jetSegment > 0) seekMedia('earth', EARTH.jetAt, 'ignite')
    playMedia('earth')
    if (el.topbarL) textOf(el.topbarL, 'PLANETARY ENGINE // 行星发动机')
    if (el.footR) textOf(el.footR, 'SYS · EARTH ENGINE 全功率')
    try {
      if (!earthStateProbe) publishEarthProbe()
      if (earthStateProbe) { earthStateProbe.ignitedAt = TL.earth; earthStateProbe.jetAt = TL.earth + EARTH.jetDelay }
    } catch (err2) { /* noop */ }
  }

  /* v0.5 §3.1/§3.3：启动层地球的「预测揭示帧」currentTime。
   * pred = currentTime + (targetAt - nowT) * playbackRate，clamp 到 [0,30)；
   * 同一真值用于 11.80 handoff detail.earthAt 与 11.55 armHandoff(tPred)。
   * QA 定格（state=preview）时媒体可能尚未 seek 完成，改按 frozenSeek 同真值推算。 */
  function frozenEarthTime(at) {
    if (at >= TL.earth) return EARTH.jetSegment > 0 ? (EARTH.jetAt + (at - TL.earth)) : (at - TL.split)
    if (at >= TL.split) return EARTH.coldAt + (at - TL.split)
    return 0
  }
  function predictEarthTime(targetAt) {
    var m = media.earth
    var rate = 1
    if (m && m.video) {
      var r = Number(m.video.playbackRate)
      if (isFinite(r) && r > 0) rate = r
    }
    var nowT
    var ct
    if (state === 'preview') {
      nowT = lastT
      ct = frozenEarthTime(lastT)
    } else {
      nowT = elapsed()
      ct = 0
      if (m && m.video) {
        var v = Number(m.video.currentTime)
        if (isFinite(v) && v >= 0) ct = v
      }
    }
    var pred = ct + (Number(targetAt) - nowT) * rate
    if (!isFinite(pred) || pred < 0) pred = 0
    if (pred >= 30) pred = 29.999
    return +pred.toFixed(3)
  }

  /* v0.5 §3.1/§3.3：11.80 派发 dsh-moss2:handoff（client 侧排期 ambient 揭示 + UI 显影）。
   * detail 严格 5 字段 {at, revealAt, fadeAt, duration, earthAt}；earthAt = 13.05 预测帧。 */
  function startBootComplete() {
    var earthAt = predictEarthTime(FADE_AT)
    var detail = {
      at: TL.bootComplete[0],
      revealAt: FADE_AT,
      fadeAt: FADE_AT,
      duration: DURATION,
      earthAt: earthAt
    }
    try {
      window.__DSH_MOSS2_HANDOFF__ = {
        ok: true,
        at: detail.at,
        to: TL.bootComplete[1],
        event: HANDOFF_EVENT,
        firedAt: clockNow(),
        revealAt: detail.revealAt,
        fadeAt: detail.fadeAt,
        duration: detail.duration,
        earthAtPred: earthAt,
        done: false
      }
    } catch (err0) { /* noop */ }
    try { window.dispatchEvent(new CustomEvent(HANDOFF_EVENT, { detail: detail })) } catch (err1) { /* noop */ }
  }

  /* v0.5 §3.1 段 2：12.70 冰白 bloom（峰值 0.86 / 12.70→13.30；render 按 TL.handoffFlash 驱动） */
  function startHandoffBloom() {
    try {
      if (window.__DSH_MOSS2_HANDOFF__) window.__DSH_MOSS2_HANDOFF__.flashAt = TL.handoffFlash[0]
    } catch (err) { /* noop */ }
  }

  /* v0.5 §3.1：11.55 交棒 —— 传给 client 的是「13.05 揭示帧」的预测 currentTime
   * （ambient seek 到同帧），并排期 revealIn=1.5s 后起播；API 不存在时静默跳过。 */
  function armHandoffNow() {
    if (armTried) return
    armTried = true
    try {
      var api = window.__DSH_MOSS2_API__
      var tPred = predictEarthTime(FADE_AT)
      if (api && typeof api.armHandoff === 'function') {
        try {
          var ret = api.armHandoff(tPred, { revealIn: REVEAL_IN })
          window.__DSH_MOSS2_ARMED__ = ret === undefined ? true : !!ret
          window.__DSH_MOSS2_ARMED_TIME__ = tPred
        } catch (err) {
          window.__DSH_MOSS2_ARMED__ = false
          window.__DSH_MOSS2_ARM_ERROR__ = String((err && err.message) || err)
        }
      } else {
        /* client 侧尚未实现：跳过不报错（§3.1）；300ms 后再试一次（预测值随时刻重算） */
        window.__DSH_MOSS2_ARMED__ = false
        if (!armRetryTimer) {
          armRetryTimer = later(function () {
            armRetryTimer = 0
            var api2 = window.__DSH_MOSS2_API__
            if (api2 && typeof api2.armHandoff === 'function') {
              try {
                var t2 = predictEarthTime(FADE_AT)
                var r2 = api2.armHandoff(t2, { revealIn: REVEAL_IN })
                window.__DSH_MOSS2_ARMED__ = r2 === undefined ? true : !!r2
                window.__DSH_MOSS2_ARMED_TIME__ = t2
              } catch (err2) { window.__DSH_MOSS2_ARMED__ = false }
            }
          }, 300)
        }
      }
      try {
        if (window.__DSH_MOSS2_HANDOFF__) window.__DSH_MOSS2_HANDOFF__.earthAtPred = tPred
      } catch (errH) { /* noop */ }
      try { window.dispatchEvent(new CustomEvent('dsh-moss2:arm', { detail: { t: tPred, revealIn: REVEAL_IN } })) } catch (err3) { /* noop */ }
    } catch (err) { /* noop */ }
  }

  /* v0.5 §3.1 段 3：13.05 启动层 warp 溶解 —— 先补一帧完成态（100% 定格 / bloom 中），
   * 再 opacity 1→0 + transform scale(1→1.03)，810ms cubic-bezier(.4,0,.2,1)（不用 blur）。
   * rAF 继续跑以驱动 bloom 回落（13.02→13.30）；13.90 milestone 'done' → finish('natural')。 */
  function startHandoff() {
    if (state === 'done' || state === 'disabled' || state === 'preview') return
    try { render(FADE_AT) } catch (err) { /* noop */ }
    state = 'handoff'
    try {
      if (root) {
        root.style.transition = 'opacity ' + FADE_MS + 'ms cubic-bezier(.4,0,.2,1), transform ' + FADE_MS + 'ms cubic-bezier(.4,0,.2,1)'
        root.style.transformOrigin = '50% 50%'
        /* 强制应用 transition 起始值（transform: none → scale(1.03) 才会插值） */
        root.getBoundingClientRect()
        root.style.transform = 'scale(1.03)'
        root.style.opacity = '0'
        root.style.pointerEvents = 'none'
      }
    } catch (err) { /* noop */ }
    removeKeyListener()
    try {
      if (window.__DSH_MOSS2_HANDOFF__) {
        window.__DSH_MOSS2_HANDOFF__.fadeAt = FADE_AT
        window.__DSH_MOSS2_HANDOFF__.revealAt = FADE_AT
        window.__DSH_MOSS2_HANDOFF__.duration = DURATION
      }
    } catch (err2) { /* noop */ }
    /* 13.90 由 milestone 'done' 触发 finish；若定时器被浏览器节流，再兜一层 */
    later(function () { finish('natural') }, TL.done * 1000 - FADE_AT * 1000 + 80)
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 8. 主渲染（相位数值化：rAF / freeze 同一套真值）
   * ══════════════════════════════════════════════════════════════════════ */
  function phaseOf(t) {
    if (t < TL.proEnd) return 'prologue'
    if (t < TL.cut) return 'neuro'
    if (t < TL.split) return 'moss'
    if (t < TL.earth) return 'split'
    if (t < TL.preHandoff[1]) return 'earth'
    return 'handoff'
  }

  /* ── v0.5 §1.1：全局固定层进度（数字 / 填充条 / 光点 同一真值） ──────────
   * 展示区间 4.36→12.10 到 100%；12.10–13.90 保持完成态并随根层 warp 溶解。
   * 光点位移 = progress * trackWidth（实测 .ms-progress.clientWidth，含 resize）。 */
  function renderProgress(t) {
    if (!el.bottom && !el.pct) return
    var show = seg(t, PROGRESS_SHOW, PROGRESS_SHOW + 0.42)
    var visible = show > 0.002 && t < TL.done + 0.5
    var p = quantizeProgress(bootProgress(t))
    var pct = Math.round(p * 100)
    if (trackWidth <= 0 && el.progress) {
      try { trackWidth = el.progress.clientWidth || 0 } catch (err) { trackWidth = 0 }
    }
    if (el.bottom) {
      display(el.bottom, visible ? '' : 'none')
      op(el.bottom, show)
      op(el.bottomLabel, show * 0.85)
    }
    if (el.progressFill) {
      op(el.progressFill, show)
      tf(el.progressFill, 'scaleX(' + p.toFixed(2) + ')')
    }
    if (el.progressSpark) {
      op(el.progressSpark, show)
      tf(el.progressSpark, 'translate3d(' + (p * trackWidth).toFixed(1) + 'px,0,0)')
    }
    if (el.pct) {
      display(el.pct, visible ? '' : 'none')
      op(el.pct, show)
      textOf(el.pctNum, String(pct))
      /* v0.5 §1.1/§3.1：11.88 起完成态文案 + 0.22s 放大压入（scale 1.12→1.0，12.10 到 100%） */
      var complete = t >= 11.88 || pct >= 100
      if (el.pct.__msComplete !== (complete ? '1' : '0')) {
        el.pct.__msComplete = complete ? '1' : '0'
        try {
          if (complete) el.pct.setAttribute('data-complete', '1')
          else el.pct.removeAttribute('data-complete')
        } catch (err) { /* noop */ }
      }
      if (el.pctCap) textOf(el.pctCap, complete ? 'BOOT COMPLETE / 加载完成' : 'INITIALIZING')
      var press = easeOut(seg(t, 11.88, 12.10))
      tf(el.pct, 'scale(' + (1 + 0.12 * (1 - press)).toFixed(4) + ')')
      if (complete && !flags.complete) {
        flags.complete = true
        try { if (el.progress) el.progress.classList.add('ms-progress--complete') } catch (err) { /* noop */ }
        try { if (el.mossRim) el.mossRim.classList.add('ms-rim--complete') } catch (e2) { /* noop */ }
      }
    }
    if (progressProbe) {
      progressProbe.t = t
      progressProbe.progress = p
      progressProbe.pct = pct
      progressProbe.trackWidth = trackWidth
      progressProbe.fill = p
      progressProbe.spark = p * trackWidth
      progressProbe.complete = pct >= 100
    }
  }

  /* ── v0.3 §5：第二幕红色准心锁定特效序列 ──────────────────────────────
   * 时间线见 TL.tgt*；主眼坐标复用 eyePoint（EYE + computeEyePoint）。
   * 全部为叠加层，不读写 video[data-act=moss] 的 src/currentTime/playbackRate/
   * filter/transform（只有 opacity 由上层 render 控制）。
   * 闪烁频率上限：所有 pulse/呼吸 ≤3Hz（假目标 ~2.3Hz、锁定脉冲 1.1Hz、
   * 扫描线往返 0.83Hz），系统 reduce 场景无需额外分支即满足 ≤3Hz。 */
  var TGT_PHASE_TEXT = {
    search: 'TARGET SEARCH // 目标搜索',
    capture: 'CAPTURE // 目标捕获',
    track: 'TRACKING // 跟踪中',
    converge: 'ACQUIRING // 收敛中',
    lock: 'LOCKED · 550W',
    maintain: 'LOCKED · 550W'
  }
  var TGT_CORNER_X = [0.13, 0.87, 0.13, 0.87]
  var TGT_CORNER_Y = [0.19, 0.19, 0.81, 0.81]
  var TGT_GHOST_X = [0.21, 0.72, 0.84]
  var TGT_GHOST_Y = [0.33, 0.61, 0.24]

  /* ── v0.4 §3.1：终局对焦框 ─────────────────────────────────────────────
   * FOCUS_HALF = clamp(72, 0.104*min(frameW,frameH), 116)；
   * 四角锚点 = (ex±HALF, ey±HALF)，(ex,ey) = computeEyePoint()。
   * 四角元素以 translate(-50%,-50%) 定位 → 元素 rect 中心 = 锚点 = 框角；
   * 对焦行程只缩放（scale 以元素自身中心为原点，rect 中心不变）→ 任意帧
   * 几何中心与主眼偏差恒为 0（断言 ≤1.5px 有充足余量）。
   * 7.78–8.06 完全静止；只允许 wrapper opacity 呼吸（1.1Hz ≤ 1.2Hz）。 */
  function focusHalfFor(W, H) {
    var v = 0.104 * Math.min(W, H)
    if (v < 72) return 72
    if (v > 116) return 116
    return v
  }

  function renderFocusBox(t, calm, ex, ey) {
    if (!el.tgtFocus) return
    var half = focusHalf
    if (el.tgtFocus.__msHalf !== half) {
      el.tgtFocus.__msHalf = half
      try {
        el.tgtFocus.style.setProperty('--ms-focus-box', (half * 0.60).toFixed(2) + 'px')
        el.tgtFocus.style.setProperty('--ms-focus-ring', (half * 1.86).toFixed(2) + 'px')
      } catch (e0) { /* noop */ }
    }
    var focusVis = seg(t, 7.34, 7.46) * (1 - seg(t, TL.tgtFocus[1], TL.tgtFocus[1] + 0.10))
    /* 对焦行程：7.42–7.62 收口 1.16→1.00；7.62–7.72 过冲回落；7.72 起恒 1 */
    var fs
    if (t < TL.tgtFocus[0]) fs = 1.16
    else if (t < 7.62) fs = 1.16 - 0.16 * easeOut(seg(t, TL.tgtFocus[0], 7.62))
    else if (t < 7.72) fs = 1 + 0.035 * Math.sin(Math.PI * seg(t, 7.62, 7.72))
    else fs = 1
    var breath = 1
    if (t >= TL.tgtLock[1]) {
      /* 1.1Hz 呼吸（≤1.2Hz 规格上限），只动 opacity，不动位置/scale */
      breath = 0.90 + 0.10 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.1 * (t - TL.tgtLock[1])))
    }
    op(el.tgtFocus, focusVis * breath)
    var N = el.focusCorners.length
    for (var i = 0; i < N; i++) {
      var dx = (i % 2 === 0) ? -1 : 1
      var dy = (i < 2) ? -1 : 1
      setLeftTop(el.focusCorners[i], ex + dx * half, ey + dy * half)
      tf(el.focusCorners[i], 'translate(-50%,-50%) scale(' + fs.toFixed(4) + ')')
    }
    var M = el.focusTicks.length
    for (var j = 0; j < M; j++) {
      /* 上/右/下/左 四边中点 tick */
      var tx = j === 0 ? ex : (j === 1 ? ex + half : (j === 2 ? ex : ex - half))
      var ty = j === 0 ? ey - half : (j === 1 ? ey : (j === 2 ? ey + half : ey))
      setLeftTop(el.focusTicks[j], tx, ty)
      tf(el.focusTicks[j], 'translate(-50%,-50%) scale(' + fs.toFixed(4) + ')')
    }
    if (el.focusRing) {
      setLeftTop(el.focusRing, ex, ey)
      tf(el.focusRing, 'translate(-50%,-50%) scale(' + (fs * 0.92).toFixed(4) + ')')
    }
    if (lockProbe && lockProbe.focus) {
      var f = lockProbe.focus
      f.x = ex
      f.y = ey
      f.half = half
      f.w = half * 2
      f.h = half * 2
      f.aligned = t >= TL.tgtFocus[0]
      f.scale = fs
    }
  }

  function renderTarget(t, calm, env) {
    if (!el.tgtLayer) return
    if (eyeDirty) computeEyePoint()
    var W = frameW || 1536
    var H = frameH || 960
    var ex = eyePoint.x
    var ey = eyePoint.y
    var phase = targetPhase(t)
    if (el.tgtLayer.__msPhase !== phase) {
      el.tgtLayer.__msPhase = phase
      try { el.tgtLayer.setAttribute('data-tgt', phase) } catch (err) { /* noop */ }
    }
    var out = 1 - seg(t, TL.tgtOut[0], TL.tgtOut[1])
    var enter = seg(t, TL.tgtGrid[0], TL.tgtGrid[0] + 0.16) * out
    var locked = t >= TL.gazeLock
    focusHalf = focusHalfFor(W, H)

    /* ── 全屏细网格（3.90–4.30 淡入；dense 由运动能量微调） ── */
    if (el.tgtGrid) {
      var gridIn = seg(t, TL.tgtGrid[0], TL.tgtGrid[1])
      op(el.tgtGrid, calm ? 0 : gridIn * out * (0.40 + 0.28 * env))
    }
    /* ── 红色扫描线：捕获阶段自上而下扫过；锁定后按能量慢速往返 ── */
    if (el.tgtScan) {
      var scanOp = 0
      var scanY = -1
      if (!calm && t >= TL.tgtCapture[0] && t < TL.tgtCapture[1] + 0.06) {
        var capP = seg(t, TL.tgtCapture[0], TL.tgtCapture[1])
        scanY = easeInOut(capP) * H
        scanOp = Math.sin(Math.PI * capP) * 0.9 * out
      } else if (!calm && t >= TL.tgtMaintain[0] && t < TL.tgtOut[0]) {
        var sweep = ((t - TL.tgtMaintain[0]) / 1.2) % 1
        scanY = sweep * H
        scanOp = (0.10 + 0.22 * env) * out
      }
      if (scanY >= 0) {
        var sy = scanY.toFixed(1) + 'px'
        if (el.tgtScan.__msY !== sy) { el.tgtScan.__msY = sy; el.tgtScan.style.top = sy }
      }
      op(el.tgtScan, scanOp)
    }
    /* ── 4 角括号：捕获阶段从画面四边飞入；收敛阶段向主眼收缩；锁定后围住主眼 ── */
    var corners = el.tgtCorners || []
    var fly = easeOut(seg(t, TL.tgtCapture[0], TL.tgtCapture[0] + 0.62))
    var cv = easeInOut(calm ? seg(t, TL.gazeIn, TL.gazeLock) : seg(t, TL.tgtConverge[0], TL.tgtConverge[1]))
    for (var ci = 0; ci < corners.length; ci += 1) {
      if (calm || locked) { op(corners[ci], 0); continue }
      var dirX = ci % 2 === 0 ? -1 : 1
      var dirY = ci < 2 ? -1 : 1
      var bx = TGT_CORNER_X[ci] * W
      var by = TGT_CORNER_Y[ci] * H
      var x = lerp(bx + dirX * 210, bx, fly)
      var y = lerp(by + dirY * 210, by, fly)
      if (phase === 'track' || phase === 'converge') {
        /* 抖动幅度由运动包络驱动；频率 11.3/8.9 rad/s ≈ 1.8/1.4Hz ≤3Hz */
        var jit = 1.0 + 3.6 * env
        x += Math.sin(t * 11.3 + ci * 2.1) * jit
        y += Math.cos(t * 8.9 + ci * 1.7) * jit
      }
      x = lerp(x, ex, cv * 0.90)
      y = lerp(y, ey, cv * 0.90)
      setLeftTop(corners[ci], x, y)
      tf(corners[ci], 'translate(-50%,-50%) scale(' + lerp(1, 0.58, cv).toFixed(3) + ')')
      var cop = fly
      if (phase === 'maintain') cop *= 0.72
      op(corners[ci], cop * out)
    }
    /* ── 3 个假目标点闪灭（平滑正弦包络，≈2.3Hz）── */
    var ghosts = el.tgtGhosts || []
    for (var gi = 0; gi < ghosts.length; gi += 1) {
      var gop = 0
      if (!calm) {
        gop = Math.max(pulseAt(t, 4.42 + gi * 0.16, 0.20), pulseAt(t, 4.86 + gi * 0.12, 0.16))
      }
      setLeftTop(ghosts[gi], TGT_GHOST_X[gi] * W, TGT_GHOST_Y[gi] * H)
      op(ghosts[gi], gop * out)
    }
    /* ── 准心：5.20 从右下弧线出现 → 7.42 前收口到主眼；calm 直接在主眼收口 ──
     * v0.4 §3.1：7.42 锁定后 `.ms-gaze` 旧框隐藏，准心作为对焦框内部十字/圆环保留；
     * 8.06 起十字线由 .ms-split__prep-h/__prep-v 接管延伸成分割线，准心整体淡出。 */
    var retIn = calm ? seg(t, TL.gazeIn, TL.gazeIn + 0.12) : seg(t, TL.tgtTrack[0], TL.tgtTrack[0] + 0.18)
    var retGone = 1 - seg(t, TL.mossSplitPrep[0], TL.mossSplitPrep[0] + 0.12)
    var retOp = retIn * out * retGone
    /* calm：不做右下→主眼的跟踪运动，直接在主眼处收口；normal：5.20→7.30 弧线收口 */
    var q = calm ? 1 : easeInOut(seg(t, TL.tgtTrack[0], TL.gazeLock - 0.12))
    var offX = W * 0.30 * (1 - q)
    var offY = H * 0.34 * (1 - q) - (calm ? 0 : Math.sin(Math.PI * q) * H * 0.14)
    if (!calm && (phase === 'track' || phase === 'converge')) {
      var rjit = 1.2 + 4.0 * env
      offX += Math.sin(t * 10.7) * rjit
      offY += Math.cos(t * 8.3) * rjit
    }
    var rx = ex + offX
    var ry = ey + offY
    if (el.reticle) {
      setLeftTop(el.reticle, rx, ry)
      op(el.reticle, retOp)
    }
    var contract = easeOut(calm ? seg(t, TL.gazeIn, TL.gazeLock) : seg(t, TL.tgtTrack[0], TL.gazeLock))
    var lockP = seg(t, TL.gazeLock, TL.gazeLock + 0.18)
    /* v0.4 §3.1：锁定后圆环/十字收进对焦框（框半宽 half → 内环直径约 1.2*half） */
    var fitP = seg(t, TL.gazeLock, TL.gazeLock + 0.22)
    var fitO = focusHalf > 0 ? Math.max(0.55, (focusHalf * 2 * 0.96) / 214) : 0.9
    var fitC = focusHalf > 0 ? Math.max(0.55, (focusHalf * 2 * 0.92) / 172) : 1.0
    if (el.reticleRingO) {
      var ringOScale = lerp(lerp(2.5, 1, contract), fitO, fitP)
      tf(el.reticleRingO, 'translate(-50%,-50%) scale(' + ringOScale.toFixed(3) + ')')
      op(el.reticleRingO, retOp * (0.25 + 0.75 * contract))
    }
    if (el.reticleRingI) {
      tf(el.reticleRingI, 'translate(-50%,-50%) scale(' + lerp(1.6, 1, contract).toFixed(3) + ')')
      op(el.reticleRingI, retOp * (0.55 + 0.45 * contract))
    }
    if (el.reticleTicks) {
      var spin = calm ? 0 : (t - TL.tgtTrack[0]) * 46
      tf(el.reticleTicks, 'translate(-50%,-50%) rotate(' + spin.toFixed(1) + 'deg)')
      op(el.reticleTicks, retOp * (0.35 + 0.5 * contract))
    }
    if (el.reticleCross) {
      var crossScale = calm ? 1 : lerp(0.62, 1.65, seg(t, TL.tgtConverge[0], TL.tgtLock[0]))
      var crossFinal = lerp(crossScale, fitC, fitP)
      tf(el.reticleCross, 'translate(-50%,-50%) scale(' + crossFinal.toFixed(3) + ')')
      op(el.reticleCross, retOp * (calm ? 0.9 : (0.45 + 0.55 * contract)))
    }
    if (el.reticleDot) {
      var dotPulse = 1
      if (!calm && t >= TL.gazeLock) dotPulse = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.1 * (t - TL.gazeLock)))
      op(el.reticleDot, retOp * (0.35 + 0.65 * contract) * dotPulse)
    }
    if (el.reticleDist) {
      var distM = 128.6 * (1 - (calm ? seg(t, TL.gazeIn, TL.gazeLock) : seg(t, TL.tgtTrack[0], TL.gazeLock)))
      if (distM < 0.05) distM = 0
      var ds = distM.toFixed(1)
      while (ds.length < 5) ds = '0' + ds
      textOf(el.reticleDist, 'DIST ' + ds + 'm')
    }
    if (el.reticleLockLabel) {
      op(el.reticleLockLabel, lockP * out)
      tf(el.reticleLockLabel, 'translate(-50%,0) scale(' + lerp(1.45, 1, easeOut(lockP)).toFixed(3) + ')')
    }
    /* ── 顶部数据读数（坐标 / DIST / LOCK / 状态）── */
    if (el.tgtData) {
      var dataIn = seg(t, TL.tgtGrid[0], TL.tgtGrid[0] + 0.42) * out
      op(el.tgtData, dataIn)
      var lockPct = calm ? Math.round(100 * seg(t, TL.gazeIn, TL.gazeLock)) : Math.round(6 + 94 * seg(t, TL.tgtTrack[0], TL.gazeLock))
      if (lockPct > 100) lockPct = 100
      var jx = calm ? 0 : Math.sin(t * 7.3) * (2 + 6 * env)
      var jy = calm ? 0 : Math.cos(t * 5.1) * (2 + 6 * env)
      var cx = (ex + jx).toFixed(1)
      var cy = (ey + jy).toFixed(1)
      var dz = 128.6 * (1 - (calm ? seg(t, TL.gazeIn, TL.gazeLock) : seg(t, TL.tgtTrack[0], TL.gazeLock)))
      var dzs = dz.toFixed(1)
      while (dzs.length < 6) dzs = '0' + dzs
      textOf(el.tgtState, TGT_PHASE_TEXT[phase] || TGT_PHASE_TEXT.search)
      textOf(el.tgtRead, 'X ' + cx + '  Y ' + cy + '  ·  DIST ' + dzs + 'm  ·  LOCK ' + (lockPct < 10 ? '0' + lockPct : lockPct) + '%')
    }
    /* ── 色差闪（全程 ≤2 次：5.20 / 7.42 各一次 0.16–0.18s，平滑包络）── */
    if (el.tgtChroma) {
      var chro = 0
      if (!calm) chro = Math.max(pulseAt(t, TL.tgtTrack[0], 0.16), pulseAt(t, TL.gazeLock, 0.18)) * 0.55
      op(el.tgtChroma, chro * out)
    }
    /* ── 白色/红色冲击波环 ×2（7.10 / 7.42 起）── */
    var shocks = el.lockShocks || []
    for (var si = 0; si < shocks.length; si += 1) {
      var at = si === 0 ? TL.gazeIn + 0.04 : TL.gazeLock
      var sp = (t - at) / 0.55
      var sop = 0
      if (!calm && sp >= 0 && sp <= 1) sop = Math.pow(1 - sp, 1.6) * 0.85
      setLeftTop(shocks[si], ex, ey)
      var sscale = sp < 0 ? 0.3 : (sp > 1 ? 1 : 0.3 + sp * 3.4)
      tf(shocks[si], 'translate(-50%,-50%) scale(' + sscale.toFixed(3) + ')')
      op(shocks[si], sop)
    }
    /* ── 锁定瞬间视频层轻震（±2px；2.6/2.1Hz 正弦，<3Hz）──
     * v0.4 §3.1：震动只作用在 MOSS 视频 clip 上（不动 act 容器）→ 对焦框四角
     * 在 7.42/7.60 断言帧上仍严格对齐主眼（偏差 0px）。 */
    var shakeTf = 'none'
    if (!calm && t >= TL.tgtLock[0] && t < TL.tgtLock[1] + 0.14) {
      var amp = 2.0 * (1 - seg(t, TL.tgtLock[0], TL.tgtLock[1] + 0.14))
      var shx = Math.sin(2 * Math.PI * 2.6 * t) * amp
      var shy = Math.cos(2 * Math.PI * 2.1 * t) * amp * 0.6
      shakeTf = 'translate3d(' + shx.toFixed(2) + 'px,' + shy.toFixed(2) + 'px,0)'
    }
    if (el.clipMoss) tf(el.clipMoss, shakeTf)
    if (el.actMoss) tf(el.actMoss, 'none')
    /* ── v0.4 §3.1：终局对焦框（对齐硬断言对象；任意帧中心 = 主眼）── */
    renderFocusBox(t, calm, ex, ey)
    /* ── 锁定只读探针（供 verifier 断言准心与主眼偏差 ≤6px / 对焦框 ≤1.5px）── */
    if (lockProbe) {
      lockProbe.phase = phase
      lockProbe.reticle.x = rx
      lockProbe.reticle.y = ry
      lockProbe.eye.x = ex
      lockProbe.eye.y = ey
      lockProbe.locked = t >= TL.gazeLock
      lockProbe.lockedAt = TL.gazeLock
      /* v0.4 §3.1.4：verifier 硬断言字段（顶层，与 focus.aligned 同步） */
      lockProbe.focusAligned = t >= TL.tgtFocus[0]
      lockProbe.t = t
    }
  }


  /* ══ v0.4 §4：第二→三幕连续转场（8.06–10.44） ══════════════════════════
   * 8.06–8.30 准心十字线延伸（横=全宽 / 竖=全高并滑到 50%）+ 对焦框四角 fly-out
   * + 8.24 水平拉丝；8.30 分割成立（0.10s 峰值 0.30 冰白闪）+ 分割线 scaleY 0→1
   * + 右幕 data wipe；9.12–9.90 接缝数据包 ×3 循环 2 次；9.82 点火预告；
   * 10.02 接缝向左扫过。calm 下去掉 wipe/扫描/数据包/飞散，只保留 0.3s 淡入切分。 */
  var SPLIT_CORNER_INSET = 26
  function renderSplitTransition(t, calm, ex, ey) {
    var W = frameW || 1536
    var H = frameH || 960
    var visible = t >= TL.mossSplitPrep[0] && t < TL.splitOut[1]
    display(el.split, visible ? '' : 'none')
    if (!visible) {
      /* v0.4：10.44 后整个转场层不残留任何 tint / 探针脏值 */
      if (t >= TL.splitOut[1]) {
        op(el.split, 0)
        op(el.splitMoss, 0)
        op(el.splitEarth, 0)
        op(el.seam, 0)
        op(el.handover, 0)
        op(el.splitLabelL, 0)
        op(el.splitLabelR, 0)
        op(el.engineHint, 0)
        op(el.prepH, 0)
        op(el.prepV, 0)
        op(el.flashline, 0)
        op(el.splitWipe, 0)
        var scReset = el.splitCorners || []
        for (var sc = 0; sc < scReset.length; sc += 1) op(scReset[sc], 0)
        var pkReset = el.seamPackets || []
        for (var pk = 0; pk < pkReset.length; pk += 1) op(pkReset[pk], 0)
        var sfReset = el.seamFlashes || []
        for (var sf = 0; sf < sfReset.length; sf += 1) op(sfReset[sf], 0)
      }
      return
    }
    op(el.split, 1)
    var out = 1 - seg(t, TL.splitOut[0], TL.splitOut[1])
    var prep = easeInOut(seg(t, TL.mossSplitPrep[0], TL.mossSplitPrep[1]))
    var splitP = seg(t, TL.split, TL.split + 0.04)
    var sweep = 50 * easeInOut(seg(t, TL.sweep[0], TL.sweep[1]))
    var seamX = 50 - sweep
    var seamFrac = seamX / 100

    /* ── 预转场：横/竖十字线延伸（横线留在主眼 y；竖线滑到 50% 后即分割线） ── */
    if (el.prepH && el.prepV) {
      var prepOn = calm ? 0 : seg(t, TL.mossSplitPrep[0], TL.mossSplitPrep[0] + 0.05)
      var prepFade = 1 - seg(t, TL.split + 0.02, TL.split + 0.18)
      var startLen = 172 * 1.65
      var hw = lerp(startLen, W * 1.08, prep)
      var vh = lerp(startLen, H * 1.08, prep)
      var vx = lerp(ex, W * 0.5, easeInOut(seg(t, TL.mossSplitPrep[0], TL.mossSplitPrep[1])))
      var vy = lerp(ey, H * 0.5, easeInOut(seg(t, TL.mossSplitPrep[0], TL.mossSplitPrep[1])))
      var ck = Math.pow(prep, 1.6)
      var cr = Math.round(lerp(255, 226, ck))
      var cg = Math.round(lerp(59, 245, ck))
      var cb = Math.round(lerp(48, 255, ck))
      var pop = prepOn * prepFade
      setLeftTop(el.prepH, ex, ey)
      setLeftTop(el.prepV, vx, vy)
      var hwS = hw.toFixed(1) + 'px'
      if (el.prepH.__msW !== hwS) { el.prepH.__msW = hwS; el.prepH.style.width = hwS; el.prepH.style.top = ey.toFixed(1) + 'px'; el.prepH.style.left = ex.toFixed(1) + 'px' }
      var vhS = vh.toFixed(1) + 'px'
      if (el.prepV.__msH !== vhS) { el.prepV.__msH = vhS; el.prepV.style.height = vhS }
      var bgH = 'linear-gradient(90deg, rgba(' + cr + ',' + cg + ',' + cb + ',0) 0%, rgba(' + cr + ',' + cg + ',' + cb + ',.85) 6%, #ffffff 50%, rgba(' + cr + ',' + cg + ',' + cb + ',.85) 94%, rgba(' + cr + ',' + cg + ',' + cb + ',0) 100%)'
      if (el.prepH.__msBg !== bgH) {
        el.prepH.__msBg = bgH
        el.prepH.style.background = bgH
        el.prepV.style.background = bgH.replace('90deg', '180deg')
      }
      op(el.prepH, pop)
      op(el.prepV, pop)
    }
    /* ── 8.24 起水平拉丝：1px 扫描线从左到右闪一次 ── */
    if (el.flashline) {
      var flP = seg(t, 8.24, 8.44)
      var flOn = (!calm && t >= 8.24 && t <= 8.44) ? Math.sin(Math.PI * flP) * 0.9 : 0
      var flx = lerp(-W * 0.2, W * 1.05, easeInOut(flP))
      setLeftTop(el.flashline, flx, ey)
      op(el.flashline, flOn * out)
    }

    /* ── 8.30 分割成立：左右 half 面板（接缝可左扫至 0） ── */
    var panelOp = splitP * out
    op(el.splitMoss, panelOp)
    op(el.splitEarth, panelOp)
    if (el.splitMoss) {
      var wL = seamX.toFixed(3) + '%'
      if (el.splitMoss.__msW !== wL) { el.splitMoss.__msW = wL; el.splitMoss.style.width = wL }
    }
    if (el.splitEarth) {
      var wR = (100 - seamX).toFixed(3) + '%'
      if (el.splitEarth.__msW !== wR) { el.splitEarth.__msW = wR; el.splitEarth.style.width = wR }
    }
    /* ── 分割线：由中心向上下画出（scaleY 0→1；transform-origin 50% 50%） ── */
    leftPct(el.seam, seamX)
    var seamDraw = easeOut(seg(t, TL.splitSeamDraw[0], TL.splitSeamDraw[1]))
    var seamScale = calm ? 1 : seamDraw
    tf(el.seam, 'translateX(-50%) scaleY(' + seamScale.toFixed(4) + ')')
    var seamIn = seg(t, TL.split, TL.split + 0.06) * out
    var seamBoost = 0.85 + 0.15 * easeOut(seg(t, TL.sweep[0], TL.sweep[1]))
    /* 9.82 点火预告：接缝颜色红→冰蓝 + 亮度 +30%（只是预告，地球仍无喷射） */
    var engMix = calm ? 0 : seg(t, TL.engineHint[0], TL.engineHint[1])
    if (el.seam) {
      var seamBg = ''
      if (engMix > 0.001) {
        var sr = Math.round(lerp(234, 168, engMix))
        var sg = Math.round(lerp(248, 226, engMix))
        var sb = Math.round(lerp(255, 255, engMix))
        seamBg = 'linear-gradient(to bottom, transparent 0%, rgba(' + sr + ',' + sg + ',' + sb + ',.55) 8%, rgba(' + sr + ',' + sg + ',' + sb + ',.96) 30%, rgb(' + sr + ',' + sg + ',' + sb + ') 50%, rgba(' + sr + ',' + sg + ',' + sb + ',.96) 70%, rgba(' + sr + ',' + sg + ',' + sb + ',.55) 92%, transparent 100%)'
      }
      if (el.seam.__msBg !== seamBg) { el.seam.__msBg = seamBg; el.seam.style.background = seamBg || '' }
    }
    var seamOp = seamIn * seamBoost * (1 + 0.30 * engMix)
    op(el.seam, seamOp > 1 ? 1 : seamOp)
    /* ── 对焦框四角 fly-out → 8.30 成为画面角标（位置插值：主眼四角 → 视口内侧 26px） ── */
    var SC = el.splitCorners || []
    var flyP = calm ? 1 : easeOut(seg(t, TL.mossSplitPrep[0], TL.split))
    var scIn = seg(t, TL.mossSplitPrep[0], TL.mossSplitPrep[0] + 0.04) * out
    for (var i = 0; i < SC.length; i++) {
      var sx = (i % 2 === 0) ? -1 : 1
      var sy = (i < 2) ? -1 : 1
      var fx = ex + sx * focusHalf
      var fy = ey + sy * focusHalf
      var tx = (sx < 0 ? SPLIT_CORNER_INSET + 13 : W - SPLIT_CORNER_INSET - 13)
      var ty = (sy < 0 ? SPLIT_CORNER_INSET + 13 : H - SPLIT_CORNER_INSET - 13)
      setLeftTop(SC[i], calm ? tx : lerp(fx, tx, flyP), calm ? ty : lerp(fy, ty, flyP))
      tf(SC[i], 'translate(-50%,-50%)')
      op(SC[i], scIn * (0.82 + 0.18 * (1 - flyP)))
    }
    /* ── 右幕 data wipe：4 条水平扫描带（8.30–8.62 右→左扫过） ── */
    if (el.splitWipe) {
      var wipeP = seg(t, TL.split, TL.splitSeamDraw[1])
      var wipeOp = (!calm && wipeP > 0 && wipeP < 1) ? Math.sin(Math.PI * wipeP) * 0.9 : 0
      op(el.splitWipe, wipeOp * out)
    }
    /* ── 9.12–9.90 数据包 ×3 循环 2 次（接缝上/中/下，左→右；抵达时接缝闪） ── */
    var packets = el.seamPackets || []
    var flashes = el.seamFlashes || []
    var ys = [0.30 * H, 0.50 * H, 0.70 * H]
    for (var k = 0; k < packets.length; k++) {
      var pp = -1
      var arrive = -1
      if (!calm) {
        for (var cyc = 0; cyc < 2; cyc++) {
          var st = TL.handover[0] + cyc * 0.39 + k * 0.11
          var p = (t - st) / 0.28
          if (p >= 0 && p <= 1) { pp = p; arrive = st + 0.28 }
        }
      }
      if (pp >= 0) {
        setLeftTop(packets[k], lerp(W * 0.5 - 96, W * 0.5 + 96, pp), ys[k])
        op(packets[k], Math.pow(Math.sin(Math.PI * pp), 0.6) * 0.95 * out)
        if (flashes[k]) {
          setLeftTop(flashes[k], W * 0.5, ys[k])
          op(flashes[k], pulseAt(t, arrive - 0.02, 0.16) * out)
        }
      } else {
        op(packets[k], 0)
        if (flashes[k]) op(flashes[k], 0)
      }
    }
    /* ── 9.82–10.18 右幕「ENGINE IGNITION / 引擎点火」预告（只有文字与接缝光） ── */
    if (el.engineHint) {
      var engP = seg(t, TL.engineHint[0], TL.engineHint[0] + 0.14) * (1 - seg(t, TL.engineHint[1] - 0.04, TL.engineHint[1] + 0.10))
      op(el.engineHint, calm ? 0 : engP * out)
      tf(el.engineHint, 'translate3d(0,' + ((1 - engP) * 8).toFixed(2) + 'px,0)')
    }
    /* ── 左上/右下标签滑入（字距 0.30→0.40em 展开） ── */
    var labelL = seg(t, TL.splitLabelL[0], TL.splitLabelL[1]) * out
    var labelR = seg(t, TL.splitLabelR[0], TL.splitLabelR[1]) * out
    op(el.splitLabelL, labelL)
    op(el.splitLabelR, labelR)
    if (el.splitLabelL) {
      var lsL = (0.30 + 0.10 * easeOut(seg(t, TL.splitLabelL[0], TL.splitLabelL[1]))).toFixed(3) + 'em'
      if (el.splitLabelL.__msLs !== lsL) { el.splitLabelL.__msLs = lsL; el.splitLabelL.style.letterSpacing = lsL }
    }
    if (el.splitLabelR) {
      var lsR = (0.30 + 0.10 * easeOut(seg(t, TL.splitLabelR[0], TL.splitLabelR[1]))).toFixed(3) + 'em'
      if (el.splitLabelR.__msLs !== lsR) { el.splitLabelR.__msLs = lsR; el.splitLabelR.style.letterSpacing = lsR }
    }
    /* ── 9.12–9.46 移交卡（9.98–10.18 退场） ── */
    var hoP = seg(t, TL.handover[0], TL.handover[1]) * (1 - seg(t, TL.handoverOut[0], TL.handoverOut[1]))
    op(el.handover, hoP)
    tf(el.handover, 'translate(-50%,-50%) scale(' + lerp(0.94, 1, easeOut(seg(t, TL.handover[0], TL.handover[1] + 0.2))).toFixed(4) + ')')
    /* ── 左 half MOSS：冻结（startSplit 已 pause） + 降饱和 + 压暗（v0.4：只轻压，
     * 保证「一半 MOSS 一半地球」——左半平均亮度 ≥30/255、红眼可辨） ── */
    var mossCold = seg(t, TL.split, TL.split + 0.30)
    if (el.clipMoss) setFilter(el.clipMoss, mossCold > 0.002
      ? 'saturate(' + lerp(1, 0.82, mossCold).toFixed(3) + ') brightness(' + lerp(1, 1.18, mossCold).toFixed(3) + ')'
      : '')
    if (el.actMoss) {
      /* 左 half 只保留冻结画面：HUD 在 mossHudOut 后已退场 */
      op(el.videoMoss, 1)
    }
  }

  /* ══ v0.4 §5：地球冷态（幕 III）/ 点火（幕 IV） ═══════════════════════
   * 幕 III：圆形遮罩只留「静默行星 + 大气边缘」（尾迹被裁出可见区），冷调，
   *         playbackRate 0.65，右半屏内行星居中偏左（x≈0.70W / y≈0.50H）。
   * 幕 IV 10.35：点火 —— 遮罩在 10.46 移除（尾迹进入画面，与闪光峰值同帧），
   *         scale/translate 连续回落到 ambient（scale 1.12 / translate 0），
   *         filter 冷调→brightness(1.75) saturate(1.22)；11.55 前到位，之后冻结。 */
  var earthGeom = null
  function computeEarthGeom() {
    var m = media.earth
    var W = frameW || 1536
    var H = frameH || 960
    var vw = 1920, vh = 1080
    if (m && m.video && m.video.videoWidth) { vw = m.video.videoWidth; vh = m.video.videoHeight }
    var s = Math.max(W / vw, H / vh)
    var rw = vw * s
    var rh = vh * s
    var ox = (W - rw) / 2
    var oy = (H - rh) / 2
    earthGeom = {
      W: W, H: H, vw: vw, vh: vh, s: s, rw: rw, rh: rh, ox: ox, oy: oy,
      p0x: ox + EARTH.planetX * rw,
      p0y: oy + EARTH.planetY * rh,
      pr: EARTH.planetRH * rh
    }
    return earthGeom
  }
  /* 给定 scale k 与目标行星圆心 T，返回 transform/translate 与行星屏幕几何 */
  function earthFrameAt(k, cx, cy) {
    var g = earthGeom
    var Cx = g.W / 2
    var Cy = g.H / 2
    return {
      k: k,
      tx: cx - Cx - k * (g.p0x - Cx),
      ty: cy - Cy - k * (g.p0y - Cy),
      cx: cx, cy: cy, r: g.pr * k
    }
  }
  function earthFrameEnd() {
    var g = earthGeom
    var Cx = g.W / 2
    var Cy = g.H / 2
    var kEnd = EARTH.kEnd
    return earthFrameAt(kEnd, Cx + kEnd * (g.p0x - Cx), Cy + kEnd * (g.p0y - Cy))
  }
  var EARTH_COLD_FILTER = 'brightness(1.06) saturate(.72) contrast(1.06)'
  var EARTH_IGNITE_AT = 10.46     /* 尾迹进入画面（遮罩移除）瞬间 = 点火闪光峰值 */
  function publishEarthProbe(t, frame, phase, jetVisible) {
    try {
      if (!earthStateProbe) return
      var p = earthStateProbe
      p.phase = phase
      p.t = t
      p.scale = frame.k
      p.translate = { x: +frame.tx.toFixed(1), y: +frame.ty.toFixed(1) }
      p.planet = { cx: +frame.cx.toFixed(1), cy: +frame.cy.toFixed(1), r: +frame.r.toFixed(1) }
      p.playbackRate = media.earth && media.earth.video ? Number(media.earth.video.playbackRate) || 1 : 1
      p.currentTime = media.earth && media.earth.video ? Number(media.earth.video.currentTime) || 0 : 0
      p.jetVisible = !!jetVisible
      p.jetAt = EARTH_IGNITE_AT
      p.maskRadius = frame.r * 1.06
      /* v0.5 §2.2.5：冷态预 seek / 点火 seek 实测（seeking/seeked 事件计时） */
      var em = media.earth
      if (em) {
        p.preSeeked = !!em.preSeeked
        p.seekAt = +(Number(em.seekAt) || 0).toFixed(3)
        p.seekedAt = +(Number(em.seekedAt) || 0).toFixed(3)
        p.seekMs = Math.max(0, Math.round(Number(em.seekMs) || 0))
        p.igniteSeekMs = Math.max(0, Math.round(Number(em.igniteSeekMs) || 0))
      }
    } catch (err) { /* noop */ }
  }
  function setMaskImage(elm, v) {
    if (!elm) return
    if (elm.__msMask !== v) {
      elm.__msMask = v
      try {
        elm.style.webkitMaskImage = v
        elm.style.maskImage = v
      } catch (err) { /* noop */ }
    }
  }
  function renderEarthAct(t, calm) {
    if (!stage) return
    var actVisible = t >= TL.split && t < DURATION + 1
    display(el.actEarth, actVisible ? '' : 'none')
    if (!actVisible) { op(el.actEarth, 0); return }
    ipEarth = t
    op(el.actEarth, 1)
    if (!earthGeom || earthGeom.W !== (frameW || 1536) || earthGeom.H !== (frameH || 960)) computeEarthGeom()
    var g = earthGeom
    var vwNow = (media.earth && media.earth.video && media.earth.video.videoWidth) ? media.earth.video.videoWidth : 1920
    if (g.vw !== vwNow) { computeEarthGeom(); g = earthGeom }
    var W = g.W
    var H = g.H
    var f3 = earthFrameAt(EARTH.e3K, W * EARTH.e3Cx, H * EARTH.e3Cy)
    var fe = earthFrameEnd()
    var igniteP = easeInOut(seg(t, TL.earth, TL.ignite[1]))
    var frame = t < TL.earth
      ? f3
      : {
        k: lerp(f3.k, fe.k, igniteP),
        tx: lerp(f3.tx, fe.tx, igniteP),
        ty: lerp(f3.ty, fe.ty, igniteP),
        cx: lerp(f3.cx, fe.cx, igniteP),
        cy: lerp(f3.cy, fe.cy, igniteP),
        r: lerp(f3.r, fe.r, igniteP)
      }
    /* 视频 transform / filter：11.80 后不再改（交接基准帧） */
    if (t < TL.earthPushEnd) {
      if (!(media.earth && media.earth.saver)) {
        tf(el.videoEarth, 'translate3d(' + frame.tx.toFixed(2) + 'px,' + frame.ty.toFixed(2) + 'px,0) scale(' + frame.k.toFixed(5) + ')')
      }
      var fil
      if (t < TL.earth) fil = EARTH_COLD_FILTER
      else {
        var fp = igniteP
        fil = 'brightness(' + lerp(1.06, 1.75, fp).toFixed(3) + ') saturate(' + lerp(0.72, 1.22, fp).toFixed(3) + ') contrast(' + lerp(1.06, 1, fp).toFixed(3) + ')'
      }
      setFilter(el.videoEarth, fil)
    }
    op(el.videoEarth, 1)
    op(el.veilEarth, 1)
    /* ── 幕 III：圆形遮罩（行星 + 大气边缘；尾迹不可见）→ 10.46 移除 ──
     * 尾迹亮核紧贴行星右缘（video x≈0.605），遮罩半径取 0.99R 才能同时保住
     * 圆盘与大气边缘、又完全裁掉尾迹（R = 行星屏幕半径）。 */
    var masked = t < EARTH_IGNITE_AT && !(media.earth && media.earth.saver)
    if (masked) {
      var mr = frame.r * EARTH.maskK
      /* 软边：行星圆盘完整保留、大气边缘 1–2px 柔化，越过 1.0R 立即透明 → 尾迹不可见 */
      setMaskImage(el.clipEarth, 'radial-gradient(circle at ' + frame.cx.toFixed(1) + 'px ' + frame.cy.toFixed(1) + 'px, #000 0 ' + (mr * 0.972).toFixed(1) + 'px, rgba(0,0,0,.92) ' + (mr * 0.988).toFixed(1) + 'px, transparent ' + (mr * 1.002).toFixed(1) + 'px)')
    } else {
      setMaskImage(el.clipEarth, 'none')
    }
    if (el.plumeCover) op(el.plumeCover, 0)
    /* ── 幕 III 右半屏裁切 / data wipe（8.30–8.62 逐带扫入）→ 8.62 后固定右半 ── */
    var seamX = 50 - 50 * easeInOut(seg(t, TL.sweep[0], TL.sweep[1]))
    /* act 级裁切：幕 III 地球 act（含冷色星空底）只覆盖接缝右侧，左侧留给冻结的 MOSS */
    if (t < TL.earth) clipPath(el.actEarth, 'inset(0 0 0 ' + seamX.toFixed(3) + '%)')
    else clipPath(el.actEarth, 'none')
    if (t < TL.earth) {
      var wipeP = seg(t, TL.split, TL.splitSeamDraw[1])
      if (!calm && wipeP > 0 && wipeP < 1) {
        /* 4 条水平带（高 25%）各自从右向左扫入；用多边形表示并集 */
        var pts = []
        var yb = [0, 0.25 * H, 0.5 * H, 0.75 * H, H]
        var xs = []
        for (var bi = 0; bi < 4; bi++) {
          var bp = easeOut(seg(t, TL.split + bi * 0.012, TL.splitSeamDraw[1] - 0.02 + bi * 0.012))
          xs.push(W * 0.5 + (1 - bp) * W * 0.5)
        }
        pts.push([xs[0].toFixed(1) + 'px 0px'])
        pts.push([W.toFixed(1) + 'px 0px'])
        pts.push([W.toFixed(1) + 'px ' + H.toFixed(1) + 'px'])
        pts.push([xs[3].toFixed(1) + 'px ' + H.toFixed(1) + 'px'])
        for (var bj = 3; bj >= 1; bj--) {
          pts.push([xs[bj].toFixed(1) + 'px ' + yb[bj].toFixed(1) + 'px'])
          pts.push([xs[bj - 1].toFixed(1) + 'px ' + yb[bj].toFixed(1) + 'px'])
        }
        pts.push([xs[0].toFixed(1) + 'px 0px'])
        clipPath(el.clipEarth, 'polygon(' + pts.join(',') + ')')
        /* 左半 MOSS 始终止于接缝 50%（data wipe 只影响右幕） */
        clipPath(el.clipMoss, 'inset(0 50% 0 0)')
      } else {
        clipPath(el.clipEarth, 'inset(0 0 0 ' + seamX.toFixed(3) + '%)')
        clipPath(el.clipMoss, 'inset(0 ' + (100 - seamX).toFixed(3) + '% 0 0)')
      }
    } else {
      clipPath(el.clipEarth, 'none')
      clipPath(el.clipMoss, 'inset(0 100% 0 0)')
    }
    /* ── 幕 IV 点火：冰蓝闪光 v0.5 §2.2.3 —— 窗口延长到 10.35–10.95（覆盖 seek 完成）：
     *   t<10.50：0.85*easeOut(seg(10.35,10.50))；10.50≤t≤10.55 保持 0.85；
     *   t>10.55：0.85*(1-seg(10.55,10.95))；calm ×0.5。
     *   遮罩移除仍 EARTH_IGNITE_AT=10.46（尾迹进入画面）。 ── */
    if (el.igniteFlash) {
      var iop = 0
      if (t >= 10.35 && t <= 10.95) {
        if (t < 10.50) iop = 0.85 * easeOut(seg(t, 10.35, 10.50))
        else if (t <= 10.55) iop = 0.85
        else iop = 0.85 * (1 - seg(t, 10.55, 10.95))
      }
      if (calm) iop *= 0.5
      try {
        if (el.actEarth) {
          el.actEarth.style.setProperty('--ms-planet-cx', frame.cx.toFixed(1) + 'px')
          el.actEarth.style.setProperty('--ms-planet-cy', frame.cy.toFixed(1) + 'px')
          el.actEarth.style.setProperty('--ms-planet-r', frame.r.toFixed(1) + 'px')
        }
      } catch (e0) { /* noop */ }
      op(el.igniteFlash, iop)
    }
    var bursts = el.igniteBursts || []
    for (var b = 0; b < bursts.length; b++) {
      var bstart = 10.44 + b * 0.12
      var bp2 = (t - bstart) / 0.55
      var bop = 0
      var bsc = 0.4
      if (bp2 >= 0 && bp2 <= 1) { bop = Math.pow(1 - bp2, 1.4) * 0.75; bsc = 0.4 + bp2 * 2.2 }
      setLeftTop(bursts[b], frame.cx, frame.cy)
      tf(bursts[b], 'translate(-50%,-50%) scale(' + bsc.toFixed(3) + ')')
      op(bursts[b], calm ? 0 : bop)
    }
    /* ── 字幕（10.72 / 10.98；字号 +1px、字距 +0.04em、0.22s 上滑 + 模糊递减） ── */
    var capIn = seg(t, TL.earthCap[0], TL.earthCap[1])
    var capOut = 1 - seg(t, TL.earthCap[1] + 0.02, TL.earthCap[1] + 0.20)
    var capP = capIn * capOut
    op(el.earthCap, capP)
    tf(el.earthCap, 'translate(-50%,' + ((1 - easeOut(capIn)) * 12).toFixed(2) + 'px,0)')
    setFilter(el.earthCap, 'blur(' + ((1 - easeOut(capIn)) * 6).toFixed(2) + 'px)')
    var markIn = seg(t, TL.earthMark[0], TL.earthMark[1])
    var markOut = 1 - seg(t, TL.earthMark[1] + 0.02, TL.earthMark[1] + 0.22)
    op(el.earthMark, markIn * markOut * 0.88)
    tf(el.earthMark, 'translate3d(0,' + ((1 - easeOut(markIn)) * 10).toFixed(2) + 'px,0)')
    setFilter(el.earthMark, 'blur(' + ((1 - easeOut(markIn)) * 5).toFixed(2) + 'px)')
    /* ── 只读探针 ── */
    var jetVisible = t >= EARTH_IGNITE_AT
    publishEarthProbe(t, frame, t < TL.earth ? 'cold' : (t < TL.ignite[1] ? 'ignite' : 'warm'), jetVisible)
  }
  var ipEarth = 0

  /* ══ v0.5 §3.1 段 1：BOOT COMPLETE 定格印章（11.86 clip 揭开 → 12.10 完成 → 12.70 起淡出 → 13.05 净） ══ */
  function renderBootStamp(t, calm) {
    if (!el.bootStamp) return
    var inWin = t >= TL.bootComplete[0] - 0.02 && t < 13.10
    display(el.bootStamp, inWin ? '' : 'none')
    if (!inWin) return
    var reveal = easeOut(seg(t, 11.86, 12.10))
    clipPath(el.bootStamp, 'inset(0 ' + ((1 - reveal) * 100).toFixed(2) + '% 0 0)')
    /* v0.5：12.10–12.70 定格保持 → 12.70–13.05 淡出（bloom 窗口内） */
    var opa = seg(t, 11.84, 11.96) * (1 - seg(t, 12.70, 13.05))
    op(el.bootStamp, calm ? opa * 0.9 : opa)
    if (el.bootLine) tf(el.bootLine, 'translateX(-50%) scaleX(' + reveal.toFixed(4) + ')')
    if (el.bootMain) {
      var s = 1 + 0.05 * (1 - easeOut(seg(t, 11.86, 12.04)))
      /* 保持期（12.10–12.70）允许 1.5% scale 呼吸（1.2Hz ≤3Hz），结束后不再动 */
      if (t >= 12.10 && t <= 12.70) s += 0.015 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 1.2 * (t - 12.10)))
      tf(el.bootMain, 'scale(' + s.toFixed(4) + ')')
    }
  }

  /* ══ v0.5 §3.1 段 1：HUD 收束退场（11.80–12.35 四角/标尺向外 fly-out、
   * 顶栏/页脚位移 10px 淡出；不允许整体硬切） ══ */
  function renderHandoffChrome(t, calm) {
    if (t < TL.bootComplete[0] - 0.02) return
    var p = easeOut(seg(t, TL.bootComplete[0], 12.35))
    var fade = 1 - p
    if (el.frame) {
      op(el.frame, fade * 0.9)
      tf(el.frame, 'scale(' + (1 + 0.045 * p).toFixed(4) + ')')
    }
    if (el.scan && t >= 0.9) op(el.scan, fade * 0.42)
    if (el.topbar) {
      op(el.topbar, fade)
      tf(el.topbar, 'translate3d(0,' + (-10 * p).toFixed(2) + 'px,0)')
    }
    if (el.footer) {
      op(el.footer, fade * 0.85)
      tf(el.footer, 'translate3d(0,' + (10 * p).toFixed(2) + 'px,0)')
    }
    if (el.grain) op(el.grain, 0.045 * (0.35 + 0.65 * fade))
  }

  function render(t, hold) {
    if (!stage) return
    lastT = t
    if (t > DURATION) t = DURATION
    var calm = reduced

    /* ── 全局相位标记（CSS / 探针用） ── */
    var phase = phaseOf(t)
    if (phase !== lastPhase) {
      lastPhase = phase
      try { root.setAttribute('data-phase', phase) } catch (err) { /* noop */ }
      if (splashStateObj) splashStateObj.phaseValue = phase
    }

    /* ── 0 黑场 ── */
    if (el.prologue) {
      display(el.prologue, t < 0.72 ? '' : 'none')
      op(el.prologue, 1 - seg(t, 0.36, 0.54))
      if (el.proLine) {
        var lineP = easeOut(seg(t, 0.02, 0.44))
        tf(el.proLine, 'scaleX(' + lineP.toFixed(4) + ')')
      }
      op(el.proWord, seg(t, 0.10, 0.36) * (1 - seg(t, 0.42, 0.56)))
      op(el.proCap, seg(t, 0.22, 0.46) * (1 - seg(t, 0.44, 0.56)))
    }

    /* ── 全局 chrome（四角/标尺/顶栏/页脚）：交接前一直保留，
     * 11.80–12.35 由 renderHandoffChrome 收束退场（v0.5 §3.1 拉长 0.20s） ── */
    var chromeIn = seg(t, 0.18, 0.70)
    var chromeOut = 1 - seg(t, TL.bootComplete[0], 12.35)
    var chrome = chromeIn * chromeOut
    op(el.frame, chrome * 0.9)
    op(el.scan, seg(t, 0.3, 0.9) * chromeOut * 0.42)
    /* 顶栏/页脚：黑场亮 → 幕 I 退场（不挡 BCI 面板自带抬头）→ 幕 II 回归 → 交接收束 */
    var chromeWindowA = seg(t, 0.10, 0.42) * (1 - seg(t, 0.56, 0.92))
    var chromeWindowB = seg(t, 3.96, 4.34) * chromeOut
    op(el.topbar, Math.max(chromeWindowA, chromeWindowB))
    op(el.footer, Math.max(chromeWindowA * 0.9, chromeWindowB) * 0.85)
    /* 胶片颗粒：幕 II 按运动能量增强（§5 全程「胶片颗粒增强」） */
    if (el.grain) {
      var grainOp = 0.045
      if (!calm && t >= TL.mossIn && t < TL.split) grainOp = 0.052 + 0.055 * mossEnergy(t - TL.mossIn)
      op(el.grain, grainOp)
    }
    /* v0.3 §4：全局固定层进度条 + 百分比（4.36→11.0 持续可见，11.0 到 100%） */
    renderProgress(t)

    /* ══ 幕 I 神经接口 ══ */
    var actNeuroVisible = t < TL.cut + 0.04
    display(el.actNeuro, actNeuroVisible ? '' : 'none')
    if (actNeuroVisible) {
      var neuroIn = seg(t, TL.neuroIn, TL.neuroFadeEnd)
      var nVideoOp = (media.neuro && media.neuro.failed) ? 0 : 0.92 * neuroIn
      op(el.videoNeuro, media.neuro && media.neuro.saver ? 0.92 * neuroIn : nVideoOp)
      var push = lerp(1.04, 1.14, easeInOut(seg(t, TL.neuroIn, TL.neuroPushEnd)))
      tf(el.videoNeuro, 'scale(' + push.toFixed(5) + ')')
      op(el.veilNeuro, neuroIn)
      op(el.neuroTag, seg(t, TL.neuroTag[0], TL.neuroTag[1]) * (1 - seg(t, 3.62, 3.86)))
      /* 大字标：clip-path 从左到右揭开 + 扫光 */
      var reveal = easeOut(seg(t, TL.neuroTitle[0], TL.neuroTitle[1]))
      clipPath(el.neuroTitleWrap, 'inset(0 ' + ((1 - reveal) * 100).toFixed(2) + '% 0 0)')
      op(el.neuroTitleWrap, reveal > 0.002 ? 1 : 0)
      if (!calm) {
        var shineP = seg(t, TL.neuroShine[0], TL.neuroShine[1])
        tf(el.neuroShine, 'translateX(' + (-130 + shineP * 260).toFixed(2) + '%)')
        op(el.neuroShine, Math.sin(shineP * Math.PI) * 0.85)
      } else {
        op(el.neuroShine, 0)
      }
      var subP = seg(t, TL.neuroSub[0], TL.neuroSub[1])
      op(el.neuroSub, subP)
      tf(el.neuroSub, 'translate3d(0,' + ((1 - subP) * 8).toFixed(2) + 'px,0)')
      /* 3 行打字日志 */
      for (var i = 0; i < logLineEls.length; i++) {
        var start = TL.neuroLogStart + i * TL.neuroLogStep
        var lp = seg(t, start - 0.08, start + 0.10)
        op(logLineEls[i], lp * (1 - seg(t, 3.62, 3.86)))
        var typeP = seg(t, start, start + TL.neuroLogType)
        var full = NEURO_LOG[i] || ''
        var shown = full.slice(0, Math.round(full.length * typeP))
        if (typeCache[i] !== shown) { typeCache[i] = shown; typedEls[i].textContent = shown }
        op(logLineEls[i].querySelector('.ms-caret'), (t >= start && t < start + TL.neuroLogType + 0.25) ? 1 : 0)
      }
      /* LINK 08→100% 进度环 */
      var linkIn = seg(t, TL.neuroLink[0], TL.neuroLink[1])
      op(el.link, linkIn)
      var lp2 = easeInOut(seg(t, TL.neuroLinkFill[0], TL.neuroLinkFill[1]))
      var linkNum = Math.round(8 + 92 * lp2)
      textOf(el.linkNum, linkNum < 100 ? (linkNum < 10 ? '0' + linkNum : String(linkNum)) : '100')
      var C = 2 * Math.PI * 53
      if (el.linkArc) {
        var dash = C.toFixed(2) + ' ' + C.toFixed(2)
        if (el.linkArc.__msDash !== dash) { el.linkArc.__msDash = dash; el.linkArc.setAttribute('stroke-dasharray', dash) }
        var off = (C * (1 - lp2)).toFixed(2)
        if (el.linkArc.__msOff !== off) { el.linkArc.__msOff = off; el.linkArc.setAttribute('stroke-dashoffset', off) }
      }
      if (el.linkDot) {
        var ang = -Math.PI / 2 + lp2 * Math.PI * 2
        var tx = 60 + Math.cos(ang) * 53
        var ty = 60 + Math.sin(ang) * 53
        if (el.linkDot.__msCx !== tx.toFixed(2)) {
          el.linkDot.__msCx = tx.toFixed(2)
          el.linkDot.setAttribute('cx', tx.toFixed(2))
          el.linkDot.setAttribute('cy', ty.toFixed(2))
        }
      }
      /* 3.50 起叠加故障（素材自带两段主闪光 3.22–3.30 / 3.74–3.82） */
      var g = 0
      if (!calm && t >= TL.glitchStart) {
        g = Math.abs(Math.sin((t - TL.glitchStart) * 26)) * 0.30
        g += seg(t, 3.70, 3.86) * 0.25
      }
      op(el.glitch, g)
      op(el.neuroFault, (!calm && t >= TL.glitchStart) ? (Math.abs(Math.sin((t - TL.glitchStart) * 18)) > 0.45 ? 0.75 : 0.12) * (1 - seg(t, 3.86, 3.9)) : 0)
    }

    /* ══ 闪光层：3.90 硬切 / 8.30 分割（0.10s 峰值 0.30）/
     *   12.70–13.30 冰白 bloom（v0.5 §3.1：12.70→13.02 easeOut 升到 0.86，13.02→13.30 回落） ══ */
    var flashOp = 0
    var flashColor = '#ffffff'
    if (t >= TL.cut && t < TL.flashEnd) {
      flashColor = t < TL.cut + 0.03 ? '#ffffff' : '#ff3b30'
      flashOp = t < TL.cut + 0.03 ? 0.95 : 0.8 * (1 - seg(t, TL.cut + 0.03, TL.flashEnd))
    }
    if (t >= TL.split && t < TL.splitFlashEnd) {
      flashColor = '#eaf8ff'
      flashOp = Math.max(flashOp, 0.30 * (1 - seg(t, TL.split, TL.split + 0.10)))
    }
    if (t >= TL.handoffFlash[0] && t <= TL.handoffFlash[1]) {
      flashColor = '#eaf8ff'
      /* v0.5 §3.1：12.70→13.02 easeOut 升到 0.86，13.02→13.30 回落 */
      var hfOp = t < 13.02
        ? 0.86 * easeOut(seg(t, 12.70, 13.02))
        : 0.86 * (1 - seg(t, 13.02, 13.30))
      if (calm) hfOp *= 0.5   /* v0.5 §5：reducedMotion 下 bloom 幅度 ×0.5 */
      flashOp = Math.max(flashOp, hfOp)
    }
    if (el.flash) {
      if (el.flash.__msColor !== flashColor) { el.flash.__msColor = flashColor; el.flash.style.backgroundColor = flashColor }
      op(el.flash, flashOp)
    }
    /* 7.10 凝视脉冲 */
    if (el.pulse) {
      var pulseOp = 0
      if (!calm && t >= TL.gazeIn && t <= TL.gazeIn + 0.62) {
        var pk = (t - TL.gazeIn) / 0.62
        pulseOp = Math.max(0, 1 - pk) * (pk < 0.14 ? pk / 0.14 : 1) * 0.55
      }
      op(el.pulse, pulseOp)
      if (pulseOp > 0.01) {
        var pt = Math.max(0, (t - TL.gazeIn) * 260)
        tf(el.pulse, 'translate(-50%,-50%) scale(' + (pt).toFixed(1) + ')')
      }
    }

    /* ══ 幕 II MOSS ══ */
    var actMossVisible = t >= TL.cut && t < TL.earth
    display(el.actMoss, actMossVisible ? '' : 'none')
    if (actMossVisible) {
      var mossIn = seg(t, TL.mossIn, TL.mossFadeEnd)
      var mossVideoOp = (media.moss && media.moss.failed) ? 0 : mossIn
      op(el.videoMoss, (media.moss && media.moss.saver) ? mossIn : mossVideoOp)
      op(el.veilMoss, mossIn)
      var hudFade = 1 - seg(t, TL.mossHudOut[0], TL.mossHudOut[1])
      /* MOSS 运动能量包络（§5：驱动 rim 呼吸 / 准心抖动 / 扫描线密度 / 音频同步） */
      var mossEnv = mossEnergy(t - TL.mossIn)
      /* 红色边缘辉光：v0.3 由运动包络驱动幅度（calm 时固定低值，不做脉动） */
      op(el.mossRim, mossIn * hudFade * (calm ? 0.72 : (0.52 + 0.58 * mossEnv)))
      /* 红色 vignette（锁定后增强，随能量呼吸） */
      if (el.mossVignette) {
        var vigIn = seg(t, TL.tgtGrid[0], TL.tgtGrid[1])
        var vigOp = calm ? 0 : vigIn * hudFade * (0.18 + 0.34 * mossEnv) * (t >= TL.gazeLock ? 1.25 : 1)
        op(el.mossVignette, vigOp > 1 ? 1 : vigOp)
      }
      /* 标题 */
      var t550 = seg(t, TL.mossTitle, TL.mossTitle + 0.40) * hudFade
      var tEn = seg(t, TL.mossTitle + 0.18, TL.mossTitle + 0.58) * hudFade
      var tCn = seg(t, TL.mossTitle + 0.38, TL.mossTitle + 0.78) * hudFade
      op(el.title550, t550)
      tf(el.title550, 'translate3d(' + ((1 - t550) * -16).toFixed(2) + 'px,0,0)')
      op(el.mossEn, tEn)
      op(el.mossCn, tCn)
      /* 右侧启动日志（逐行）；容器含装饰竖线，严格等首行出现才显形（避免「空框+红点」） */
      op(el.mossLog, seg(t, TL.mossLogStart, TL.mossLogStart + 0.12) * hudFade)
      var rows = el.mossLogRows || []
      for (var r = 0; r < rows.length; r++) {
        var rs = TL.mossLogStart + r * TL.mossLogStep
        var rop = seg(t, rs, rs + 0.20) * hudFade
        op(rows[r], rop)
        tf(rows[r], 'translate3d(' + ((1 - rop) * 12).toFixed(2) + 'px,0,0)')
      }
      /* 左下真实遥测 */
      var telP = seg(t, TL.mossTel, TL.mossTel + 0.42) * hudFade
      op(el.mossTel, telP)
      tf(el.mossTel, 'translate3d(0,' + ((1 - telP) * 8).toFixed(2) + 'px,0)')
      for (var q2 = 0; q2 < telRowEls.length; q2++) {
        var qs = TL.mossTel + 0.08 + q2 * 0.07
        var qop = seg(t, qs, qs + 0.28) * hudFade
        op(telRowEls[q2], qop)
        tf(telRowEls[q2], 'translate3d(' + ((1 - qop) * 10).toFixed(2) + 'px,0,0)')
      }
      /* v0.3 §5：第二幕红色准心锁定特效序列（叠加层；MOSS 视频属性不动） */
      renderTarget(t, calm, mossEnv)
      /* 7.16 起红色凝视准星点亮 → 7.42 锁定瞬间由 .ms-tgt-focus 接管
       * v0.4 §3.1：7.42 起 `.ms-gaze` 旧框必须全部隐藏（避免两套框叠加错位）。 */
      var gazeWindow = t >= TL.gazeIn - 0.02 && t < TL.gazeLock
      display(el.gaze, gazeWindow ? '' : 'none')
      var gazeIn = gazeWindow ? seg(t, TL.gazeIn, TL.gazeIn + 0.14) * hudFade : 0
      op(el.gaze, gazeIn)
      if (gazeIn > 0.01) {
        if (eyeDirty) computeEyePoint()
        var gx = eyePoint.x
        var gy = eyePoint.y
        if (el.gaze.__msX !== gx.toFixed(1) || el.gaze.__msY !== gy.toFixed(1)) {
          el.gaze.__msX = gx.toFixed(1); el.gaze.__msY = gy.toFixed(1)
          el.gaze.style.left = gx.toFixed(1) + 'px'
          el.gaze.style.top = gy.toFixed(1) + 'px'
        }
        var contract = easeOut(seg(t, TL.gazeIn, TL.gazeLock))
        var ringScaleO = lerp(3.4, 1, contract)
        var ringScaleI = lerp(2.2, 1, contract)
        tf(el.gazeRingO, 'translate(-50%,-50%) scale(' + ringScaleO.toFixed(4) + ')')
        tf(el.gazeRingI, 'translate(-50%,-50%) scale(' + ringScaleI.toFixed(4) + ')')
        op(el.gazeRingO, gazeIn * (0.25 + 0.75 * contract))
        op(el.gazeRingI, gazeIn * (0.55 + 0.45 * contract))
        var cornerOp = seg(t, TL.gazeLock - 0.14, TL.gazeLock - 0.02) * hudFade
        for (var c = 0; c < el.gazeCorners.length; c++) op(el.gazeCorners[c], cornerOp)
        op(el.gazeCross, cornerOp * 0.9)
        op(el.gazeDot, cornerOp)
        op(el.gazeLabel, seg(t, TL.gazeLock - 0.10, TL.gazeLock + 0.04) * hudFade)
      }
      /* MOSS 已上线 + 引文 */
      var onP = seg(t, TL.online, TL.online + 0.28) * hudFade
      op(el.online, onP)
      tf(el.online, 'translate3d(' + ((1 - onP) * 16).toFixed(2) + 'px,0,0)')
      if (el.onlineRule) tf(el.onlineRule, 'scaleX(' + onP.toFixed(4) + ')')
      op(el.onlineMain, onP)
      op(el.onlineSub, seg(t, TL.quote, TL.quote + 0.46) * hudFade)
    }

    /* ══ 幕 III 转场（v0.4 §4 连续镜头：预转场 → 分割成立 → 数据包 → 点火预告 → 左扫） ══ */
    if (eyeDirty) computeEyePoint()
    renderSplitTransition(t, calm, eyePoint.x, eyePoint.y)
    if (t < TL.split) {
      op(el.actEarth, 0)
      if (el.clipMoss) setFilter(el.clipMoss, '')
    }

    /* ══ 幕 IV 地球（v0.4 §5：冷态遮罩 → 10.35 点火 → 11.80 后冻结交接帧） ══ */
    renderEarthAct(t, calm)
    if (t >= TL.earth) {
      display(el.actMoss, 'none')
      display(el.actNeuro, 'none')
    }

    /* ══ 交接（v0.5 §3.1：BOOT COMPLETE 印章 + HUD 收束 + 12.70–13.30 冰白 bloom） ══ */
    renderBootStamp(t, calm)
    renderHandoffChrome(t, calm)

    /* ── 兜底：极端跳变时同步右栏文案 ── */
    if (!hold && t >= DURATION && state === 'playing') finish('natural')
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 9. 主循环 / 时钟
   * ══════════════════════════════════════════════════════════════════════ */
  function tick() {
    rafId = 0
    if (state !== 'playing' && state !== 'handoff') return
    var t = Math.max(0, (clockNow() - startedAt) / 1000)
    if (t > DURATION) t = DURATION
    runDueMilestones(t)
    try { render(t) } catch (errR) {
      if (!window.__DSH_MOSS2_RENDER_ERROR__) { try { window.__DSH_MOSS2_RENDER_ERROR__ = String((errR && errR.stack) || errR) } catch (eR) { /* noop */ } }
    }
    if (state !== 'playing' && state !== 'handoff') return
    if (t >= DURATION) {
      if (!flags.done) { var dm = milestoneByKey('done'); if (dm) runMilestone(dm) }
      return
    }
    rafId = requestFrame(tick)
  }
  function elapsed() { return startedAt ? Math.max(0, (clockNow() - startedAt) / 1000) : 0 }
  function stopRaf() { if (rafId) { cancelFrame(rafId); rafId = 0 } }

  function measureViewport() {
    try {
      frameW = (window.innerWidth || 1536)
      frameH = (window.innerHeight || 960)
      if (stage) {
        var r = stage.getBoundingClientRect()
        if (r && r.width > 0) frameW = r.width
        if (r && r.height > 0) frameH = r.height
      }
    } catch (err) { frameW = 1536; frameH = 960 }
    /* v0.3 §4：进度光点用实时实测 trackWidth（不再用 frameW） */
    try {
      if (el.progress) {
        var w = el.progress.clientWidth
        if (w > 0) trackWidth = w
      }
    } catch (err2) { /* noop */ }
    eyeDirty = true
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 10. 键盘 / resize / 宿主兜底
   * ══════════════════════════════════════════════════════════════════════ */
  function onKeydown(event) {
    if (!event) return
    var isEsc = event.key === 'Escape' || event.key === 'Esc' || event.keyCode === 27
    if (!isEsc) return
    if (!cfg.allowSkip) return
    if (state !== 'playing') return
    try { if (event.preventDefault) event.preventDefault() } catch (err) { /* noop */ }
    skip()
  }
  function addKeyListener() {
    if (keyListener) return
    keyListener = onKeydown
    try { window.addEventListener('keydown', keyListener, true) } catch (err) { keyListener = null }
  }
  function removeKeyListener() {
    if (!keyListener) return
    try { window.removeEventListener('keydown', keyListener, true) } catch (err) { /* noop */ }
    keyListener = null
  }
  function onResize() {
    measureViewport()
    if (state === 'playing' || state === 'preview') render(lastT, state === 'preview')
  }
  function addResizeListener() {
    if (resizeListener) return
    resizeListener = onResize
    try { window.addEventListener('resize', resizeListener) } catch (err) { resizeListener = null }
  }
  function removeResizeListener() {
    if (!resizeListener) return
    try { window.removeEventListener('resize', resizeListener) } catch (err) { /* noop */ }
    resizeListener = null
  }
  function onVisibility() {
    if (document.visibilityState !== 'visible') return
    if (state !== 'playing') return
    /* 回到前台：补一次渲染 + 确保当前幕视频在播 */
    var t = elapsed()
    runDueMilestones(t)
    render(t)
    if (t >= TL.cut && t < TL.earth) playMedia('moss')
    if (t >= TL.split) playMedia('earth')
  }
  function addVisibilityListener() {
    if (visibilityListener) return
    visibilityListener = onVisibility
    try { document.addEventListener('visibilitychange', visibilityListener) } catch (err) { visibilityListener = null }
  }
  function removeVisibilityListener() {
    if (!visibilityListener) return
    try { document.removeEventListener('visibilitychange', visibilityListener) } catch (err) { /* noop */ }
    visibilityListener = null
  }
  /* Host 首屏自举脚本在 13.0s 仍会兜底拆根；若它提前触发（或异常重入），
   * 防御性把根挂回去，保证 11.80s 四幕走完（幂等，不重复挂载）。 */
  function onHostFallback() {
    if (disposed) return
    if (state === 'preview') {
      /* QA 定格模式下被 Host 13s 兜底拆根：挂回去并重绘当前定格相位（不影响产品路径） */
      try {
        if (root && !root.isConnected && document.body) {
          document.body.appendChild(root)
          window.__DSH_MOSS2_REATTACHED__ = true
          render(lastT, true)
        }
      } catch (err) { /* noop */ }
      return
    }
    if (state !== 'playing' && state !== 'handoff') return
    if (elapsed() >= DURATION) return
    try {
      if (root && !root.isConnected && document.body) {
        document.body.appendChild(root)
        document.documentElement.classList.add(HTML_LOCK)
        if (document.body.style) document.body.style.overflow = 'hidden'
        window.__DSH_MOSS2_REATTACHED__ = true
        render(elapsed())
      }
    } catch (err) { /* noop */ }
  }
  function addFallbackListener() {
    if (fallbackListener) return
    fallbackListener = onHostFallback
    try { window.addEventListener('dsh-moss2:fallback', fallbackListener) } catch (err) { fallbackListener = null }
  }
  function removeFallbackListener() {
    if (!fallbackListener) return
    try { window.removeEventListener('dsh-moss2:fallback', fallbackListener) } catch (err) { /* noop */ }
    fallbackListener = null
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 11. 跳过（跳到 10.00 相位，400ms 淡入）/ 收尾 / dispose / replay
   * ══════════════════════════════════════════════════════════════════════ */
  function skip() {
    if (state !== 'playing') return false
    if (!cfg.allowSkip) return false
    var t = elapsed()
    /* 已过 10.35s：无需跳相位，直接加速收尾（≤0.4s 完成交接） */
    if (t >= SKIP_AT) return gracefulFinish()
    /* 跳到 10.35 相位（v0.5 §1：幕 IV 起点 / 点火前）：重设时间基准后正常走 10.35–13.90 */
    startedAt = clockNow() - SKIP_AT * 1000
    lastT = SKIP_AT
    /* 强制进入地球相位所需的现场状态（先清旧计时器，再排黑场淡出的计时器） */
    flags.neuro = true
    flags.cut = true
    flags.split = true
    clearTimers()
    /* 掩掉相位跳变：黑场 400ms 淡入（§4：跳过 → 400ms 淡入后走 10.35–13.90） */
    if (el.skipfade) {
      op(el.skipfade, 1)
      later(function () {
        if (!el.skipfade) return
        el.skipfade.style.transition = 'opacity ' + SKIP_FADE_MS + 'ms linear'
        op(el.skipfade, 0)
      }, 30)
    }
    seekMedia('earth', 0)
    playMedia('earth')
    pauseMedia('neuro')
    pauseMedia('moss')
    /* §6：skip 也走 300ms 淡出（旧启动现场音频收尾，时间线继续到 13.90s） */
    try { stopAudio() } catch (err0) { /* noop */ }
    measureViewport()
    render(SKIP_AT)
    /* 10.35 恰为幕 IV 起点：立刻触发 startEarth（点火），再按新基准排后续里程碑 */
    runDueMilestones(SKIP_AT + 0.004)
    /* §1.1 跳过路径：进度直接落到 bootProgress(10.35)≈0.83（不反向、不闪回 0），
     * 之后 12.10 到 100% —— 由 renderProgress 的同一真值保证。 */
    scheduleMilestones(SKIP_AT)
    hardTimer = later(forceDone, Math.max(600, HARD_STOP_MS - SKIP_AT * 1000))
    scheduleApiRepair()
    window.__DSH_MOSS2_FINISH_REASON__ = 'skip'
    return true
  }

  function finish(reason) {
    if (state === 'done' || state === 'disabled') return
    reason = reason || finishReason || 'natural'
    /* 跳过后的自然收尾保留 skip 语义（验收/日志用） */
    if (reason === 'natural' && window.__DSH_MOSS2_FINISH_REASON__ === 'skip') reason = 'skip'
    finishReason = reason
    state = 'done'
    stopRaf()
    clearTimers()
    removeKeyListener()
    removeResizeListener()
    removeVisibilityListener()
    removeFallbackListener()
    try { stopMediaAll() } catch (err) { /* noop */ }
    try { stopAudio() } catch (err) { /* noop */ }
    unlockPage()
    try {
      if (root && root.parentNode) root.parentNode.removeChild(root)
    } catch (err) { /* noop */ }
    root = null
    stage = null
    el = {}
    disposed = true
    try {
      window.__DSH_MOSS2_DONE__ = true
      window.__DSH_MOSS2_FINISH_REASON__ = reason
      /* v0.5 §3.1：交接探针 done 在 finish 后置 true（对象可能被 client 接管，失败静默） */
      if (window.__DSH_MOSS2_HANDOFF__) window.__DSH_MOSS2_HANDOFF__.done = true
    } catch (err) { /* noop */ }
    try { window.dispatchEvent(new CustomEvent('dsh-moss2:done', { detail: { reason: reason } })) } catch (err) { /* noop */ }
  }

  /* 17.0s 硬兜底：任何异常都强制完成交接（v0.5 §5 三层 17000 一致） */
  function forceDone() {
    if (state === 'done' || state === 'disabled') return
    finish('timeout')
  }

  function dispose() {
    if (state === 'done' || state === 'disabled') return
    finish('dispose')
  }

  /* 快捷收尾（API finish()）：直接进入交接并 300ms 内收尾，不跳相位 */
  function gracefulFinish() {
    if (state === 'done' || state === 'disabled') return false
    if (state === 'preview') { finish('finish'); return true }
    armHandoffNow()
    try { stopAudio() } catch (err0) { /* noop */ }
    try {
      if (root) {
        root.style.transition = 'opacity 300ms linear'
        root.style.opacity = '0'
      }
    } catch (err) { /* noop */ }
    stopRaf()
    clearTimers()
    removeKeyListener()
    later(function () { finish('finish') }, 320)
    return true
  }

  /* 重播（设置页预览 / client 重播按钮；幂等、与首次启动同一套代码） */
  function replay() {
    if (state === 'playing' || state === 'handoff' || state === 'boot') return false
    /* 清掉旧现场（复用同一 root 节点，避免重复 id） */
    stopRaf()
    clearTimers()
    removeKeyListener()
    removeResizeListener()
    removeVisibilityListener()
    removeFallbackListener()
    try { stopMediaAll() } catch (err) { /* noop */ }
    try { stopAudio() } catch (err) { /* noop */ }
    unlockPage()
    try {
      document.documentElement.classList.remove(HTML_ENTER)
    } catch (err) { /* noop */ }
    root = null
    stage = null
    el = {}
    media = {}
    flags = {}
    logLineEls = []; typedEls = []; typeCache = []; telRowEls = []
    el.mossLogRows = []
    disposed = false
    sealed = false
    holdMode = false
    state = 'boot'
    startedAt = 0
    lastT = 0
    lastPhase = ''
    armTried = false
    finishReason = ''
    if (preview) { preview = false }
    boot()
    return true
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 12. 定格 / 预览（QA：逐相位截图；freeze(t|true|false)）
   * ══════════════════════════════════════════════════════════════════════ */
  function freezeAt(rawT) {
    if (state === 'done' || state === 'disabled') return 0
    var at = Math.max(0, Math.min(Number(rawT) || 0, DURATION))
    /* 先清掉运行中现场 */
    stopRaf()
    clearTimers()
    removeKeyListener()
    removeResizeListener()
    unlockPage()
    holdMode = true
    state = 'preview'
    lastT = at
    if (!startedAt) startedAt = clockNow()
    try {
      if (root) {
        root.classList.add('ms-hold')
        root.style.opacity = '1'
        root.style.transition = 'none'
      }
    } catch (err) { /* noop */ }
    measureViewport()
    /* 视频定格到对应相位帧（异步 seek；metadata 未就绪时排队） */
    frozenSeek(at)
    try { render(at, true) } catch (errR) {
      /* QA 探针：render 异常不阻断定格（正常播放路径同样兜底，见 tick） */
      try { window.__DSH_MOSS2_RENDER_ERROR__ = String((errR && errR.stack) || errR) } catch (eR) { /* noop */ }
    }
    /* 定格相位对应的静态里程碑状态（正常播放下由 milestone 设置） */
    if (el.topbarL) textOf(el.topbarL, at >= TL.cut ? '550W · MOSS // 启动序列' : 'DEEPSEEK HARNESS // BOOT')
    /* v0.4 §5：定格时地球冷态/点火 class 与 playbackRate 与真实播放一致 */
    if (el.actEarth) {
      try {
        if (at >= TL.earth) {
          el.actEarth.classList.remove('ms-earth-cold')
          el.actEarth.classList.add('ms-earth-ignite')
        } else if (at >= TL.split) {
          el.actEarth.classList.add('ms-earth-cold')
          el.actEarth.classList.remove('ms-earth-ignite')
        } else {
          el.actEarth.classList.remove('ms-earth-cold')
          el.actEarth.classList.remove('ms-earth-ignite')
        }
      } catch (err3) { /* noop */ }
    }
    /* 定格相位 ≥ 10.35 时，定格地球裁剪应为全屏；幕 III 为右半（由 render 写） */
    if (at >= TL.earth) {
      clipPath(el.clipMoss, 'inset(0 100% 0 0)')
      clipPath(el.clipEarth, 'none')
    }
    /* v0.5 §3.1：定格 ≥11.80 时补一次交接里程碑（只发布探针/事件，无媒体副作用），
     * 让 freeze 帧也能读到 handoff detail 5 字段与 bloom 探针（C5.1 11.80/13.00 行）。 */
    if (at >= TL.bootComplete[0]) {
      try { startBootComplete() } catch (errH0) { /* noop */ }
      if (at >= TL.handoffFlash[0]) { try { startHandoffBloom() } catch (errH1) { /* noop */ } }
    }
    /* v0.5 §3.1：冻结 13.05–13.90 时按 warp 溶解曲线模拟 root opacity/scale
     * （live 路径由 startHandoff 的 CSS transition 完成；定格帧用于逐帧截图/几何断言）。 */
    if (root) {
      if (at >= FADE_AT) {
        var dp = easeInOut(seg(at, FADE_AT, DURATION))
        root.style.opacity = (1 - dp).toFixed(4)
        root.style.transform = 'scale(' + (1 + 0.03 * dp).toFixed(4) + ')'
      } else {
        root.style.opacity = '1'
        root.style.transform = ''
      }
    }
    window.__DSH_MOSS2_PREVIEW__ = { t: at, duration: DURATION, reduced: reduced }
    return at
  }

  function frozenSeek(at) {
    /* v0.4 §2.1：neuro 0.50 起播 → at-0.50；moss 3.90 起播 → at-3.90；
     * earth 8.30 起播（幕 III 冷态段）→ at-8.30；幕 IV 起用点火段（§5）。 */
    var n = at - TL.neuroIn
    if (n >= 0) seekMedia('neuro', Math.min(3.38, n))
    var m = at - TL.mossIn
    if (m >= 0) seekMedia('moss', Math.min(at >= TL.split ? 4.40 : 4.96, m))
    if (at >= TL.split) {
      var e = at >= TL.earth ? (EARTH.jetSegment > 0 ? EARTH.jetAt + (at - TL.earth) : at - TL.split) : (at - TL.split + EARTH.coldAt)
      seekMedia('earth', Math.max(0, e) % 30, 'frozen')
    }
    setPlaybackRate('earth', at >= TL.earth ? 1 : 0.65)
    pauseMedia('neuro'); pauseMedia('moss'); pauseMedia('earth')
  }

  function unfreeze() {
    if (state !== 'preview') return false
    try { if (root) root.classList.remove('ms-hold') } catch (err) { /* noop */ }
    state = 'playing'
    holdMode = false
    startedAt = clockNow() - lastT * 1000
    addKeyListener()
    addResizeListener()
    addVisibilityListener()
    hardTimer = later(forceDone, Math.max(400, HARD_STOP_MS - lastT * 1000))
    /* 恢复当前相位媒体 */
    if (lastT >= TL.cut) playMedia('moss')
    if (lastT >= TL.split) playMedia('earth')
    scheduleMilestones(lastT)
    rafId = requestFrame(tick)
    return true
  }

  function freeze(arg) {
    if (arg === true) return freezeAt(elapsed())
    if (arg === false) return unfreeze()
    if (arg === undefined || arg === null) return freezeAt(elapsed())
    return freezeAt(Number(arg))
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 13. 启动
   * ══════════════════════════════════════════════════════════════════════ */
  function boot() {
    if (state === 'playing') return
    disposed = false
    sealed = false
    holdMode = false
    flags = {}
    state = 'boot'
    lastT = 0
    lastPhase = ''
    armTried = false
    startedAt = 0

    var existing = null
    try { existing = document.getElementById(ROOT_ID) } catch (err) { existing = null }
    if (existing) {
      root = existing
      try { root.innerHTML = '' } catch (err) { /* noop */ }
    } else {
      root = document.createElement('div')
      root.id = ROOT_ID
      ;(document.body || document.documentElement).appendChild(root)
    }
    try {
      root.setAttribute('aria-hidden', 'true')
      root.setAttribute('role', 'presentation')
      root.removeAttribute('class')
      root.className = 'ms-root'
      root.style.opacity = ''
      root.style.transition = ''
      root.style.pointerEvents = ''
      root.setAttribute('data-duration', String(DURATION))
      root.setAttribute('data-version', VERSION)
    } catch (err) { /* noop */ }
    if (reduced) { try { root.classList.add('ms-calm') } catch (err) { /* noop */ } }
    if (quality === 'saver') { try { root.classList.add('ms-saver') } catch (err) { /* noop */ } }
    try { window.__DSH_MOSS2_SKIP__ = false } catch (err) { /* noop */ }

    root.innerHTML = shellHtml()
    cacheEls()
    measureViewport()
    buildNeuroLog()
    buildMossLog()
    buildTelemetry()

    /* 媒体：3 支视频（saver 档只海报）；v0.5 §2.2.1：earth 冷态帧预 seek 到 EARTH.coldAt */
    media = {}
    media.neuro = setupMedia('neuro', el.videoNeuro, URLS.neuro, URLS.neuroPoster, el.actNeuro)
    media.moss = setupMedia('moss', el.videoMoss, URLS.moss, URLS.mossPoster, el.actMoss)
    media.earth = setupMedia('earth', el.videoEarth, URLS.earth, URLS.earthPoster, el.actEarth, { preSeek: EARTH.coldAt })

    /* 跳过按钮 */
    if (el.skip) {
      var onSkipClick = function (ev) {
        try { if (ev && ev.preventDefault) ev.preventDefault() } catch (err) { /* noop */ }
        if (cfg.allowSkip) skip()
      }
      try { el.skip.addEventListener('click', onSkipClick) } catch (err) { /* noop */ }
      try {
        el.skip.addEventListener('keydown', function (ev) {
          if (ev && (ev.key === 'Enter' || ev.key === ' ')) { try { ev.preventDefault() } catch (e2) { /* noop */ } onSkipClick(ev) }
        })
      } catch (err) { /* noop */ }
    }

    try { document.documentElement.classList.remove(HTML_ENTER) } catch (err) { /* noop */ }
    lockPage()
    addKeyListener()
    addResizeListener()
    addVisibilityListener()
    addFallbackListener()

    state = 'playing'
    startedAt = clockNow()
    /* v0.3 探针复位（replay 复用同一套代码，避免上一轮 100% 完成态泄漏） */
    publishProbes()
    if (progressProbe) {
      progressProbe.t = 0; progressProbe.progress = 0; progressProbe.pct = 0
      progressProbe.trackWidth = 0; progressProbe.fill = 0; progressProbe.spark = 0
      progressProbe.complete = false
    }
    if (lockProbe) { lockProbe.phase = 'search'; lockProbe.locked = false; lockProbe.t = 0 }
    render(0)
    scheduleMilestones(0)
    hardTimer = later(forceDone, HARD_STOP_MS)
    later(initAudio, 0)
    rafId = requestFrame(tick)
    /* 界面状态对象 / 探针 */
    publishSplashState()
    scheduleApiRepair()
  }

  function skipBootPath() {
    state = 'disabled'
    window.__DSH_MOSS2_SKIP__ = true
    try {
      var stale = document.getElementById(ROOT_ID)
      if (stale && stale.parentNode) stale.parentNode.removeChild(stale)
    } catch (err) { /* noop */ }
    unlockPage()
    window.__DSH_MOSS2_DONE__ = true
    window.__DSH_MOSS2_FINISH_REASON__ = 'disabled'
    publishSplashState()
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 14. 全局状态对象 / API / 调试探针
   * ══════════════════════════════════════════════════════════════════════ */
  /* v0.3 只读探针（对象复用；render / audio 生命周期里逐帧或逐事件更新）：
   *   __DSH_MOSS2_PROGRESS__ = { t, progress, pct, trackWidth, fill, spark, complete }
   *   __DSH_MOSS2_LOCK__     = { phase, reticle:{x,y}, eye:{x,y}, locked, lockedAt, t }
   *   __DSH_MOSS2_AUDIO_STATE__ = { ok, ctxState, started, nodes, masterGain, events, error }
   *   __DSH_MOSS2_BUILD_AUDIO__ = buildAudioGraph(ctx, opts)（支持 OfflineAudioContext）
   * 供 verifier / _work/demo/render-audio.mjs 使用，绝不参与任何画面决策。 */
  function publishProbes() {
    try {
      if (!progressProbe) {
        progressProbe = { t: 0, progress: 0, pct: 0, trackWidth: 0, fill: 0, spark: 0, complete: false }
      }
      window.__DSH_MOSS2_PROGRESS__ = progressProbe
      if (!lockProbe) {
        lockProbe = {
          phase: 'search',
          reticle: { x: 0, y: 0 },
          eye: { x: 0, y: 0 },
          /* v0.4 §3.1：终局对焦框只读几何（对象复用，逐帧写） */
          focus: { x: 0, y: 0, half: 0, w: 0, h: 0, aligned: false },
          locked: false,
          lockedAt: TL.gazeLock,
          t: 0
        }
      }
      window.__DSH_MOSS2_LOCK__ = lockProbe
      if (!earthStateProbe) {
        earthStateProbe = {
          phase: 'cold', scale: 1, playbackRate: 1, jetVisible: false, jetAt: 0,
          cold: true, ignitedAt: 0, t: 0,
          /* v0.5 §2.2.5：预 seek / 点火 seek 探针（对象复用，逐事件/逐帧写） */
          preSeeked: false, seekAt: 0, seekedAt: 0, seekMs: 0, igniteSeekMs: 0
        }
        window.__DSH_MOSS2_EARTH_STATE__ = earthStateProbe
      }
      if (!audioProbe) {
        audioProbe = { ok: false, ctxState: 'none', started: false, nodes: 0, masterGain: 0, events: 0, error: '' }
      }
      window.__DSH_MOSS2_AUDIO_STATE__ = audioProbe
      if (!window.__DSH_MOSS2_AUDIO_EVENTS__) window.__DSH_MOSS2_AUDIO_EVENTS__ = []
      /* v0.5：离线渲染入口；opts.armBuffer（AudioBuffer|null）可直接注入用户机械臂音轨 */
  window.__DSH_MOSS2_BUILD_AUDIO__ = buildAudioGraph
    } catch (err) { /* noop */ }
  }

  function publishSplashState() {
    try {
      splashStateObj = {
        version: VERSION,
        duration: DURATION,
        phases: PHASES.map(function (p) { return { id: p.id, label: p.label, from: p.from, to: p.to } }),
        phaseValue: 'boot',
        get state() { return state },
        get phase() { return lastPhase || 'boot' },
        get progress() { return state === 'done' ? 1 : clamp01(lastT / DURATION) },
        get playing() { return state === 'playing' || state === 'handoff' },
        get skipped() { return window.__DSH_MOSS2_FINISH_REASON__ === 'skip' },
        get reduced() { return reduced },
        get quality() { return quality }
      }
      window.__DSH_MOSS2_SPLASH__ = splashStateObj
      window.__DSH_MOSS2_SPLASH_STATE__ = splashStateObj
    } catch (err) { /* noop */ }
  }

  function apiState() {
    return {
      skip: skip,
      finish: gracefulFinish,
      replay: function () { try { return replay() } catch (err) { return false } },
      freeze: function (arg) { try { return freeze(arg) } catch (err) { return 0 } },
      dispose: function () { try { dispose() } catch (err) { /* noop */ } },
      get state() { return state },
      get progress() {
        if (state === 'done' || state === 'disabled') return 1
        return clamp01(lastT / DURATION)
      },
      get reduced() { return reduced },
      get duration() { return DURATION },
      get version() { return VERSION },
      get facts() { return facts },
      get config() { return cfg },
      get phase() { return lastPhase || 'boot' },
      get phases() { return PHASES },
      get media() {
        var out = {}
        for (var k in media) if (has(media, k) && media[k] && media[k].video) {
          out[k] = {
            paused: !!media[k].video.paused,
            currentTime: Number(media[k].video.currentTime) || 0,
            readyState: media[k].video.readyState,
            failed: !!media[k].failed
          }
        }
        return out
      },
      get skipAvailable() { return cfg.allowSkip === true && state === 'playing' }
    }
  }

  function mergeApi(target) {
    var api = apiState()
    for (var key in api) {
      if (!has(api, key)) continue
      try {
        var desc = Object.getOwnPropertyDescriptor(api, key)
        if (desc) Object.defineProperty(target, key, desc)
        else target[key] = api[key]
      } catch (err) {
        try { target[key] = api[key] } catch (e2) { /* noop */ }
      }
    }
    return target
  }

  function publishApi() {
    var previous = null
    try { previous = window.__DSH_MOSS2_API__ } catch (err) { previous = null }
    var target = (previous && typeof previous === 'object') ? previous : {}
    apiObject = mergeApi(target)
    try {
      Object.defineProperty(window, '__DSH_MOSS2_API__', {
        configurable: true,
        writable: true,
        enumerable: false,
        value: apiObject
      })
    } catch (err) {
      try { window.__DSH_MOSS2_API__ = apiObject } catch (e2) { /* noop */ }
    }
    /* client 抢跑（先建 API 对象）时也能拿到 splash 的键：后续再合并一次 */
    try {
      window.__DSH_MOSS2_REPLAY__ = function () { try { return replay() } catch (err) { return false } }
    } catch (err) { /* noop */ }
  }

  /* client 侧若先发布 __DSH_MOSS2_API__，或晚于 splash 覆盖成普通对象（getter 失效），
   * 这里做几次幂等修补：只补 splash 自有键，不碰 client 的键（armHandoff 等）。 */
  function repairApi() {
    try {
      var api = window.__DSH_MOSS2_API__
      if (!api || typeof api !== 'object') return
      var mine = apiState()
      var need = false
      for (var key in mine) {
        if (!has(mine, key)) continue
        var desc = Object.getOwnPropertyDescriptor(mine, key)
        var cur = Object.getOwnPropertyDescriptor(api, key)
        if (key === 'armHandoff') continue
        if (!cur) { need = true; break }
        if (desc && desc.get && (!cur.get || cur.get !== desc.get)) { need = true; break }
        if (desc && desc.value && typeof cur.value === 'function' && (key === 'skip' || key === 'finish' || key === 'freeze' || key === 'replay' || key === 'dispose')) {
          if (cur.value !== desc.value) { need = true; break }
        }
      }
      if (need) { apiObject = mergeApi(api) }
    } catch (err) { /* noop */ }
  }
  function scheduleApiRepair() {
    if (apiRepairTimer) return
    var delays = [0, 800, 2200, 4800, 9000]
    for (var i = 0; i < delays.length; i++) later(repairApi, delays[i])
    apiRepairTimer = 0
  }

  function buildDebug() {
    try {
      window.__DSH_MOSS2_DEBUG__ = {
        get state() { return state },
        get phase() { return lastPhase },
        get elapsed() { return Math.max(0, Math.min(DURATION, elapsed())) },
        get startedAt() { return startedAt },
        get timers() { return timers.length },
        get rafId() { return rafId },
        get hasKeyListener() { return !!keyListener },
        get hasResizeListener() { return !!resizeListener },
        get rootConnected() { return !!(root && root.isConnected) },
        get lockClass() { return document.documentElement.classList.contains(HTML_LOCK) },
        get enterClass() { return document.documentElement.classList.contains(HTML_ENTER) },
        get reduced() { return reduced },
        get duration() { return DURATION },
        get lastT() { return lastT },
        get frozen() { return state === 'preview' },
        get audioState() { return audioCtx ? String(audioCtx.state) : 'none' },
        get audioNodes() { return audioNodes.length },
        get media() {
          var out = {}
          for (var k in media) if (has(media, k) && media[k] && media[k].video) {
            var v = media[k].video
            out[k] = {
              paused: !!v.paused,
              currentTime: Number(v.currentTime) || 0,
              duration: isFinite(v.duration) ? v.duration : null,
              readyState: v.readyState,
              networkState: v.networkState,
              width: v.videoWidth,
              height: v.videoHeight,
              src: String(v.currentSrc || v.getAttribute('src') || ''),
              poster: String(v.getAttribute('poster') || ''),
              failed: !!media[k].failed,
              saver: !!media[k].saver
            }
          }
          return out
        },
        get armed() { return window.__DSH_MOSS2_ARMED__ === true },
        get reattached() { return window.__DSH_MOSS2_REATTACHED__ === true },
        get finishReason() { return window.__DSH_MOSS2_FINISH_REASON__ || '' },
        get urls() { return URLS }
      }
    } catch (err) { /* noop */ }
  }

  /* ══════════════════════════════════════════════════════════════════════
   * 15. 入口
   * ══════════════════════════════════════════════════════════════════════ */
  window.__DSH_MOSS2_LOADED__ = true
  try { buildDebug() } catch (err) { /* noop */ }
  publishApi()
  publishProbes()

  if (skipBoot) {
    skipBootPath()
    return
  }

  boot()
  if (preview) freezeAt(previewT)

  /* 运行时也允许外部设置 PREVIEW_T 后调用 freeze（lab 页用），不额外接管 */
})()

















