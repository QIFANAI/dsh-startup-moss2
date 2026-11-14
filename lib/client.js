/* ============================================================================
 * dsh-startup-moss2 — 浏览器半侧
 * ----------------------------------------------------------------------------
 * 550W / MOSS（流浪地球）主题：启动动画 + UI 皮肤。
 *
 *   1) 皮肤：给 html 挂作用域 class、注入 CSS 变量、构建/维护动态视频背景层
 *   2) 背景：视频播放/暂停、画质切换、可见性、失败降落海报、交接 seek
 *   3) 启动层自举：Host 的 tapIndex 未生效时（无 webServer / Electron file://）
 *      由这里加载 splash.css + splash.js 并做同样的一次/每天/每次决策
 *   4) 设置页：MOSS 主题一页（播放 / 皮肤 / 背景 / 声音）
 *   5) 品牌位：侧栏与空态的品牌标记换成 MOSS 红眼（冲突时安全降级）
 *
 * v0.2 运动策略（design-spec-v2 §1 / §7，根因修复）：
 *   本机 Windows 关闭系统动画 → Chromium 报 prefers-reduced-motion:reduce。
 *   v0.1 据此把地球视频切到 --static（只显示海报）→ 用户「背景根本不动」。
 *   v0.2 起：**视频播放永不因系统 reduced-motion 偏好而停**；
 *     - shouldUseStatic 只看 quality==='saver' 或视频真的不可用（加载/解码失败）；
 *     - 系统 reduce 只作为装饰动画提示（html.dsh-moss-motion-hint，index.js 首屏加）；
 *     - 用户显式设置 reducedMotion=true → html.dsh-moss-skin--calm：只停装饰动画，
 *       视频照播（--calm 在 skin.css 中只作用于装饰层与镜头漂移）。
 *
 * 契约见 docs/design-spec-v2.md §6（splash API）/§7（皮肤背景）。配置走插件自带
 * HTTP API /dsh-moss2/config。
 * ========================================================================== */
window.__ModuleLoader__.load({
  id: 'dsh-startup-moss2',
  factory: function (require) {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var react = require('react')
    var h = react.createElement

    var BASE = '/dsh-moss2'
    var API = BASE + '/config'
    var ROOT_ID = 'dsh-moss-root'
    var AMBIENT_ID = 'dsh-moss-ambient'
    var FALLBACK_VERSION = '0.5.0'
    /* v0.3 §7「升级即重播一次」：**不依赖宿主进程内存里的版本**（用户正在跑的 host
     * 可能还是旧版，刷新页面不会重新读 package.json）。这里用 client.js 自带的
     * 硬编码构建标记做 shown 标记版本判定 —— 只刷新页面就能触发新启动动画。
     * 发布前如需再改，改这个常量即可（值会写进 localStorage）。 */
    var SPLASH_REV = 'v0.5-r1'
    var THEME_LABEL = 'MOSS 主题'
    var SKIN_CLASS = 'dsh-moss-skin'
    var REGISTRANT = 'dsh-startup-moss2'
    /* v0.5 §1：启动动画总时长 12.80s → 13.90s（100% 定格 0.60s + bloom + 810ms warp 溶解）。
     * 仅用于 selfBootSplash 自举时写 __DSH_MOSS2_SPLASH__.duration（与 splash.js 的 DURATION 一致）。 */
    var SPLASH_DURATION = 13.9
    /** 品牌位冲突时向上找的优先级：宿主 slot API 规定 single 槽同优先级会抛错、
     *  不同优先级可 shadow（数值最低者渲染）。已有注册默认 0 → 我们从 -1 起试。 */
    var BRAND_PRIORITY_START = -1

    var FALLBACK = {
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

    var ASSET_BASE = BASE + '/asset'

    /* ── 通用小工具 ───────────────────────────────────────────────────── */

    function num(value, fallback) {
      var n = Number(value)
      return isFinite(n) ? n : fallback
    }

    function clamp(value, lo, hi) {
      return Math.min(hi, Math.max(lo, value))
    }

    function readFlag(store, key) {
      try {
        var area = window[store]
        return area ? area.getItem(key) : null
      } catch (err) {
        return null
      }
    }

    function writeFlag(store, key, value) {
      try {
        var area = window[store]
        if (area) area.setItem(key, value)
      } catch (err) { /* noop */ }
    }

    function hasClass(el, name) {
      try { return !!el && el.classList && el.classList.contains(name) } catch (err) { return false }
    }

    /** 同一条告警只打印一次（slot 冲突 / 降级等，避免 reconcile 反复刷爆控制台）。 */
    var warned = Object.create(null)
    function warnOnce(key, message) {
      if (warned[key]) return
      warned[key] = true
      try {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[dsh-startup-moss2] ' + message)
        }
      } catch (err) { /* noop */ }
    }

    function ensureCss(rel) {
      if (typeof document === 'undefined') return
      var tagId = 'dsh-startup-moss2/' + rel
      if (document.querySelector('link[data-plugin-css="' + tagId + '"]')) return
      var link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = BASE + '/' + rel
      link.dataset.plugin = 'dsh-startup-moss2'
      link.dataset.pluginCss = tagId
      ;(document.head || document.documentElement).appendChild(link)
    }

    /**
     * Publish/merge the runtime API global. The splash half also publishes here
     * (freeze/dispose/state/...); neither side may clobber the other, and the
     * property must stay writable so a later half can merge again.
     */
    function publishApi(extra) {
      var previous = null
      try { previous = window.__DSH_MOSS2_API__ } catch (err) { previous = null }
      var base = previous && typeof previous === 'object' ? previous : {}
      var next = Object.assign({}, base, extra)
      try {
        Object.defineProperty(window, '__DSH_MOSS2_API__', {
          configurable: true,
          writable: true,
          enumerable: false,
          value: next
        })
      } catch (err) {
        try { window.__DSH_MOSS2_API__ = next } catch (err2) { /* noop */ }
      }
      return next
    }

    /* ── 背景层（DOM 契约：design-spec-v2 §7.2） ─────────────────────── */

    /**
     * 视频真的不可用（source 404 / 解码失败）时才降级到海报。
     * 由 <video> 的 error 事件或 play() 的 NotSupportedError 置位；成功 loadeddata 清零。
     * 注意：abort 类（AbortError，切 src/暂停打断）与自动播放策略类（NotAllowedError）
     * 不算不可用 —— 视频仍在，只是这次 play() 没成，保持可见并稍后重试。
     */
    var videoUnavailable = false

    function shouldUseStatic(cfg) {
      // v0.2 根因修复：只允许「节能档」或「视频不可用」落到静态海报。
      // 系统 prefers-reduced-motion 偏好与配置 reducedMotion 都**不**在此处生效，
      // 视频永远照播；reducedMotion 只由 syncPlayback 映射为 --calm 装饰降级。
      if (cfg.quality === 'saver') return true
      return videoUnavailable
    }

    function videoFileFor(quality) {
      if (quality === 'high') return 'earth/earth-1080.mp4'
      return 'earth/earth-720.mp4'
    }

    function ensureAmbient(cfg) {
      if (typeof document === 'undefined' || !document.body) return null
      var wrap = document.getElementById(AMBIENT_ID)
      if (!wrap) {
        wrap = document.createElement('div')
        wrap.id = AMBIENT_ID
        wrap.setAttribute('aria-hidden', 'true')
        var still = document.createElement('img')
        still.className = 'ma-still'
        still.alt = ''
        still.decoding = 'async'
        still.src = ASSET_BASE + '/earth/earth-poster.webp'
        still.onerror = function () {
          try { this.src = ASSET_BASE + '/earth/earth-poster.jpg' } catch (err) { /* noop */ }
        }
        wrap.appendChild(still)
        var vid = document.createElement('video')
        vid.className = 'ma-video'
        vid.muted = true
        vid.defaultMuted = true
        vid.loop = true
        vid.autoplay = true
        vid.setAttribute('muted', '')
        vid.setAttribute('playsinline', '')
        vid.setAttribute('preload', 'auto')
        vid.setAttribute('disablepictureinpicture', '')
        vid.setAttribute('poster', ASSET_BASE + '/earth/earth-poster.webp')
        // 只有真·加载/解码失败才允许 --static 降级（系统 reduce 不参与判断）。
        vid.addEventListener('error', function () {
          videoUnavailable = true
          var code = vid.error ? vid.error.code : 'unknown'
          warnOnce('ambient-error', '地球视频加载/解码失败（error code ' + code + '），背景降级为海报帧。')
          syncPlayback(lastConfig || FALLBACK)
        })
        vid.addEventListener('loadeddata', function () {
          if (!videoUnavailable) return
          videoUnavailable = false
          syncPlayback(lastConfig || FALLBACK)
        })
        wrap.appendChild(vid)
        var layers = ['ma-veil', 'ma-vignette', 'ma-grain', 'ma-scan', 'ma-rim']
        for (var i = 0; i < layers.length; i += 1) {
          var layer = document.createElement('div')
          layer.className = layers[i]
          wrap.appendChild(layer)
        }
        // body 首子节点：保证在 #root 之下（#root 由关键 CSS 抬到 z-index:1）
        if (document.body.firstChild) document.body.insertBefore(wrap, document.body.firstChild)
        else document.body.appendChild(wrap)
      }
      var video = wrap.querySelector('video.ma-video')
      if (!video) return wrap
      guardAmbientVideo(video)
      var quality = cfg.quality === 'high' ? 'high' : 'standard'
      var wanted = ASSET_BASE + '/' + videoFileFor(quality) + '?v=' + encodeURIComponent(window.__DSH_MOSS2_VERSION__ || FALLBACK_VERSION)
      if (cfg.quality === 'saver') {
        if (video.getAttribute('src')) {
          try { video.pause(); video.removeAttribute('src'); video.load() } catch (err) { /* noop */ }
        }
        video.style.display = 'none'
      } else {
        video.style.display = ''
        var current = video.getAttribute('src') || ''
        if (current.split('?')[0] !== wanted.split('?')[0]) {
          // 换流（画质切换/主题重载）：旧的失败状态作废，按新源重新判断。
          videoUnavailable = false
          try { video.src = wanted } catch (err) { /* noop */ }
        }
      }
      return wrap
    }

    function videoElement() {
      try {
        var wrap = document.getElementById(AMBIENT_ID)
        return wrap ? wrap.querySelector('video.ma-video') : null
      } catch (err) {
        return null
      }
    }

    /** v0.5 §3.2：ambient 视频的交接守护（幂等；宿主 BOOTSTRAP_JS 也可能先建了 video）。
     *  - held 期间任何 play() 立即回 pause（宿主 bootstrap 的 autoplay 可能在 client 持有时抢播）；
     *  - 'playing' 记 playedAt，供只读探针 __DSH_MOSS2_AMBIENT_HANDOFF__ 验收。 */
    function guardAmbientVideo(video) {
      if (!video) return
      try {
        if (video.__moss2Guarded) return
        video.__moss2Guarded = true
      } catch (err) { /* 自定义属性失败也继续挂监听 */ }
      try {
        video.addEventListener('play', function () {
          // 启动层在播期间禁止起播（交接排期统一走 releaseAmbientHold）。
          if (ambientHeld) {
            try { video.pause() } catch (err) { /* noop */ }
          }
        })
        video.addEventListener('playing', function () {
          if (ambientPlayedAt === null &&
            (ambientArmedAt !== null || ambientPlayAt !== null || ambientHoldReleased === true)) {
            ambientPlayedAt = nowMs()
            publishAmbientProbe()
          }
        })
      } catch (err) { /* noop */ }
    }

    function playVideo() {
      var video = videoElement()
      if (!video) return
      // v0.5 §3.2：启动层在播（held）期间禁止任何路径起播，统一由 releaseAmbientHold 放行。
      if (ambientHeld) return
      try {
        var p = video.play()
        if (p && typeof p.catch === 'function') {
          p.catch(function (err) {
            var name = err && err.name ? String(err.name) : ''
            // AbortError = 切源/暂停打断；NotAllowedError = 自动播放策略。
            // 两者都说明视频源仍可用，保持视频层可见（声音已 muted，下一次交互/重试可恢复）。
            if (name === 'NotSupportedError') {
              videoUnavailable = true
              warnOnce('ambient-play-fail', '地球视频无法播放（' + (err && err.message ? err.message : name) + '），背景降级为海报帧。')
              syncPlayback(lastConfig || FALLBACK)
            }
          })
        }
      } catch (err) { /* noop */ }
    }

    function pauseVideo() {
      var video = videoElement()
      if (!video) return
      try { video.pause() } catch (err) { /* noop */ }
    }

    function syncPlayback(cfg) {
      cfg = cfg || lastConfig || FALLBACK
      var html = document.documentElement
      var static_ = shouldUseStatic(cfg)
      try {
        if (static_) html.classList.add(SKIN_CLASS + '--static')
        else html.classList.remove(SKIN_CLASS + '--static')
        // 用户显式 reducedMotion → --calm：只停装饰动画（skin.css 消费），视频照播。
        if (cfg.reducedMotion) html.classList.add(SKIN_CLASS + '--calm')
        else html.classList.remove(SKIN_CLASS + '--calm')
      } catch (err) { /* noop */ }
      if (static_) {
        pauseVideo()
        return
      }
      if (document.visibilityState === 'hidden') {
        try { html.classList.add(SKIN_CLASS + '--paused') } catch (err) { /* noop */ }
        pauseVideo()
        return
      }
      try { html.classList.remove(SKIN_CLASS + '--paused') } catch (err) { /* noop */ }
      // v0.5 §3.2：启动层期间 ambient 保持暂停（held），syncPlayback 不得起播；
      // 揭示时刻由 armHandoff / handoff 事件 / 兜底定时器排期 releaseAmbientHold() 统一放行。
      if (ambientHeld) {
        pauseVideo()
        return
      }
      playVideo()
    }

    /* ── 交接 API：splash 11.55s 调 armHandoff(t, opts)、11.80s 派发 dsh-moss2:handoff ──
     * 契约（design-spec-v0.5 §3.2/§3.3，兼容 v0.4 §6）：
     *   - t = 启动层地球视频在揭示帧的 predicted currentTime（秒）→ ambient 按真实 duration 取模；
     *   - opts = { revealIn: 1.5 }（秒：armHandoff 调用时刻 → 揭示时刻）；
     *   - 启动层在播（splashActive()）时 ambient 视频全程暂停并置 ambientHeld=true
     *     （减少并行解码：真宿主实测幕 IV 地球曾因解码争抢 waiting 0.46s；同时避免交接帧冻结）：
     *     armHandoff 只 seek 保持暂停，由 revealIn / handoff 事件 / 兜底定时器排期起播；
     *   - 无启动层（splashActive()=false）时行为与 v0.4 完全一致（seek 后立即播放）；
     *   - 兜底（必须）：dsh-moss2:done / dsh-moss2:fallback / watchSplashDone 判定结束 /
     *     15.5s 定时器 任一触发 → ambientHeld=false; playVideo()，防止背景永久静止；
     *   - 交接瞬间给 html 挂 --handoff（skin.css 把镜头漂移锁回 scale(1.12) 基准），
     *     与 splash 地球层同帧同裁切；1500ms 后撤掉（v0.4 行为：11.55+1.5s=13.05 揭示）；
     *   - 只读探针 window.__DSH_MOSS2_AMBIENT_HANDOFF__ 供验收读取。 */

    var HANDOFF_CLASS_MS = 1500       /* --handoff 保持时长（v0.4 §6 行为保留） */
    var AMBIENT_WAKE_MS = 15500       /* 兜底：启动层 13.90s + 1.6s 余量内必须起播 */
    var HANDOFF_REVEAL_FALLBACK = 1.5 /* 事件 detail 缺 revealAt/t 时的保守揭示差值（秒） */

    var handoffTimer = null
    var ambientHeld = false
    var ambientHoldReleased = false
    var ambientWakeTimer = null
    var ambientPlayTimer = null
    var ambientWatchTimer = null
    var ambientWatchStartedAt = 0
    var ambientArmedAt = null
    var ambientRevealIn = null
    var ambientPlayAt = null
    var ambientPlayedAt = null
    var ambientCtAtArmed = null

    function nowMs() {
      try {
        if (window.performance && typeof window.performance.now === 'function') return window.performance.now()
      } catch (err) { /* noop */ }
      return Date.now()
    }

    /** 只读探针（design-spec-v0.5 §3.2-6 冻结 6 字段）：{ held, armedAt, revealIn, playAt, playedAt, ctAtArmed }。 */
    function publishAmbientProbe() {
      var state = {
        held: ambientHeld === true,
        armedAt: ambientArmedAt,
        revealIn: ambientRevealIn,
        playAt: ambientPlayAt,
        playedAt: ambientPlayedAt,
        ctAtArmed: ambientCtAtArmed
      }
      try {
        Object.defineProperty(window, '__DSH_MOSS2_AMBIENT_HANDOFF__', {
          configurable: true,
          writable: false,
          enumerable: false,
          value: state
        })
      } catch (err) {
        try { window.__DSH_MOSS2_AMBIENT_HANDOFF__ = state } catch (err2) { /* noop */ }
      }
      return state
    }

    function clearAmbientTimers() {
      if (ambientWakeTimer) {
        try { window.clearTimeout(ambientWakeTimer) } catch (err) { /* noop */ }
        ambientWakeTimer = null
      }
      if (ambientPlayTimer) {
        try { window.clearTimeout(ambientPlayTimer) } catch (err) { /* noop */ }
        ambientPlayTimer = null
      }
      if (ambientWatchTimer) {
        try { window.clearInterval(ambientWatchTimer) } catch (err) { /* noop */ }
        ambientWatchTimer = null
      }
    }

    /** 兜底与揭示的统一出口：held=false + 恢复播放（页面隐藏/静态档交给 syncPlayback 的既有语义）。 */
    function releaseAmbientHold(reason) {
      var wasHeld = ambientHeld
      ambientHeld = false
      ambientHoldReleased = true
      if (ambientWakeTimer) {
        try { window.clearTimeout(ambientWakeTimer) } catch (err) { /* noop */ }
        ambientWakeTimer = null
      }
      if (ambientWatchTimer) {
        try { window.clearInterval(ambientWatchTimer) } catch (err) { /* noop */ }
        ambientWatchTimer = null
      }
      if (ambientPlayTimer) {
        try { window.clearTimeout(ambientPlayTimer) } catch (err) { /* noop */ }
        ambientPlayTimer = null
      }
      publishAmbientProbe()
      if (!wasHeld) return false
      try {
        if (document.visibilityState === 'hidden') return true   // 回前台由 visibilitychange → syncPlayback 恢复
      } catch (err) { /* noop */ }
      if (shouldUseStatic(lastConfig || FALLBACK)) return true
      playVideo()
      return true
    }

    /** 启动层在播：暂停 ambient 并置 held（v0.5 §3.2-1）。幂等；已释放后不再进入 held。
     *  只有 splashActive()=true 才进入 held（无启动层时行为必须与 v0.4 一致）。 */
    function holdAmbient(reason) {
      if (ambientHeld) return true
      if (ambientHoldReleased) return false
      if (!splashActive()) return false
      if (!videoElement()) return false
      ambientHeld = true
      pauseVideo()
      if (!ambientWakeTimer) {
        ambientWakeTimer = window.setTimeout(function () {
          ambientWakeTimer = null
          releaseAmbientHold('wake-15500')
        }, AMBIENT_WAKE_MS)
      }
      publishAmbientProbe()
      return true
    }

    /** 启动层晚于 client 出现（splash.js defer / 自举路径）时补一次 held；
     *  3s 内没看到启动层就按「无启动层」处理（与 v0.4 常规播放一致）。 */
    function watchAmbientHold() {
      if (ambientHeld || ambientHoldReleased || ambientWatchTimer) return
      ambientWatchStartedAt = Date.now()
      ambientWatchTimer = window.setInterval(function () {
        if (ambientHeld || ambientHoldReleased) {
          try { window.clearInterval(ambientWatchTimer) } catch (err) { /* noop */ }
          ambientWatchTimer = null
          return
        }
        if (splashActive()) {
          try { window.clearInterval(ambientWatchTimer) } catch (err) { /* noop */ }
          ambientWatchTimer = null
          holdAmbient('splash-active-late')
          return
        }
        if (Date.now() - ambientWatchStartedAt > 3000) {
          try { window.clearInterval(ambientWatchTimer) } catch (err) { /* noop */ }
          ambientWatchTimer = null
        }
      }, 80)
    }

    /** 排期起播：target 为 nowMs() 口径的绝对时间；重复调用以最后一次为准。 */
    function scheduleAmbientPlayAt(target, reason) {
      ambientPlayAt = target
      publishAmbientProbe()
      if (ambientPlayTimer) {
        try { window.clearTimeout(ambientPlayTimer) } catch (err) { /* noop */ }
        ambientPlayTimer = null
      }
      var delay = Math.max(0, target - nowMs())
      ambientPlayTimer = window.setTimeout(function () {
        ambientPlayTimer = null
        releaseAmbientHold('play:' + reason)
      }, delay)
    }

    /** 启动层当前 elapsed（秒）：优先 splash.js 只读探针；拿不到返回 null。 */
    function splashElapsedSec() {
      try {
        var dbg = window.__DSH_MOSS2_DEBUG__
        if (dbg) {
          var e = Number(dbg.elapsed)
          if (isFinite(e)) return e
        }
      } catch (err) { /* noop */ }
      try {
        var s = window.__DSH_MOSS2_SPLASH__
        if (s && typeof s === 'object') {
          var p = Number(s.progress)
          var d = Number(s.duration)
          if (isFinite(p) && isFinite(d) && d > 0) return p * d
        }
      } catch (err2) { /* noop */ }
      return null
    }

    /** 11.80s dsh-moss2:handoff 兜底：armHandoff 未调用成功也能按 detail.revealAt 定时起播。
     *  detail 冻结 schema（design-spec-v0.5 §3.3）：{ at, revealAt, fadeAt, duration, earthAt }；
     *  兼容 v0.4 的 detail.t。 */
    function onHandoffEvent(event) {
      try {
        if (!ambientHeld || ambientHoldReleased) return
        var detail = (event && event.detail) || {}
        var revealAt = num(detail.revealAt, NaN)
        if (!isFinite(revealAt)) revealAt = num(detail.t, NaN)
        var at = num(detail.at, NaN)
        var elapsed = splashElapsedSec()
        if (!isFinite(elapsed)) elapsed = isFinite(at) ? at : 0
        if (!isFinite(revealAt)) revealAt = elapsed + HANDOFF_REVEAL_FALLBACK
        scheduleAmbientPlayAt(nowMs() + Math.max(0, (revealAt - elapsed) * 1000), 'handoff-event')
      } catch (err) { /* 兜底失败不影响 UI 显影 */ }
    }

    function publishHandoffState(state) {
      try {
        Object.defineProperty(window, '__DSH_MOSS2_HANDOFF__', {
          configurable: true,
          writable: true,
          enumerable: false,
          value: state
        })
      } catch (err) {
        try { window.__DSH_MOSS2_HANDOFF__ = state } catch (err2) { /* noop */ }
      }
    }

    function armHandoff(t, opts) {
      var options = opts || {}
      var video = videoElement()
      var armAt = nowMs()
      var state = {
        ok: false,
        requested: num(t, 0),
        applied: null,
        duration: null,
        pending: false,
        held: ambientHeld === true,
        at: Date.now(),
        armedAt: armAt,
        revealIn: null,
        playScheduledAt: null,
        videoState: null
      }
      ambientArmedAt = armAt
      var revealIn = num(options.revealIn, NaN)
      // v0.5 §3.2-2 / §3.3：opts.revealIn（秒）→ state.playScheduledAt = arm 时刻 + revealIn*1000（ms），
      // 由 setTimeout 精确排期起播（apply 内 scheduleAmbientPlayAt 内部实现；handoff 事件会再校准一次）。
      if (isFinite(revealIn) && revealIn >= 0) {
        ambientRevealIn = revealIn
        state.revealIn = revealIn
        state.playScheduledAt = armAt + revealIn * 1000
      }
      publishAmbientProbe()
      if (!video) {
        // saver 档没有视频层：交接仍视为安全完成（splash 可照常淡出），但 ok=false。
        try { document.documentElement.classList.remove(SKIN_CLASS + '--paused') } catch (err) { /* noop */ }
        publishHandoffState(state)
        return false
      }
      try {
        var duration = video.duration
        if (isFinite(duration) && duration > 0) {
          state.duration = duration
          state.requested = ((state.requested % duration) + duration) % duration
        }
        var target = state.requested
        var apply = function () {
          try {
            video.currentTime = target
            state.applied = video.currentTime
            ambientCtAtArmed = video.currentTime
            if (ambientHeld) {
              // v0.5 §3.2-2：启动层在播 → 只预 seek 到揭示帧并保持暂停（交接瞬间无冻结帧）；
              // 起播由 opts.revealIn / dsh-moss2:handoff 事件 / 15.5s 兜底排期统一执行。
              pauseVideo()
            } else if (video.paused) {
              var p = video.play()
              if (p && typeof p.catch === 'function') p.catch(function () { /* 交接路径静默 */ })
            }
            var html = document.documentElement
            if (html && html.classList) {
              html.classList.remove(SKIN_CLASS + '--static')
              html.classList.remove(SKIN_CLASS + '--paused')
              html.classList.add(SKIN_CLASS + '--handoff')
              if (handoffTimer) window.clearTimeout(handoffTimer)
              handoffTimer = window.setTimeout(function () {
                handoffTimer = null
                try { html.classList.remove(SKIN_CLASS + '--handoff') } catch (err) { /* noop */ }
              }, HANDOFF_CLASS_MS)
            }
            if (ambientHeld && state.playScheduledAt !== null) {
              scheduleAmbientPlayAt(state.playScheduledAt, 'arm-reveal')
            }
            state.ok = true
            state.videoState = {
              paused: video.paused,
              currentTime: video.currentTime,
              readyState: video.readyState
            }
          } catch (err) {
            state.error = String((err && err.message) || err)
          }
          publishHandoffState(state)
          publishAmbientProbe()
        }
        if (video.readyState >= 1) {
          apply()
        } else {
          state.pending = true
          try {
            video.addEventListener('loadedmetadata', function onMeta() {
              video.removeEventListener('loadedmetadata', onMeta)
              apply()
            })
          } catch (err) { /* noop */ }
          publishHandoffState(state)
        }
      } catch (err) {
        state.error = String((err && err.message) || err)
        publishHandoffState(state)
        return false
      }
      return state.ok === true
    }

    /* ── 皮肤应用（幂等，client 与 bootstrap 双路都安全） ─────────────── */

    var clockTimer = null
    var lastConfig = null

    function startClock() {
      if (clockTimer) return
      function tick() {
        try {
          var now = new Date()
          var hh = String(now.getHours()).padStart(2, '0')
          var mm = String(now.getMinutes()).padStart(2, '0')
          var ss = String(now.getSeconds()).padStart(2, '0')
          document.documentElement.style.setProperty('--moss-clock', hh + ':' + mm + ':' + ss)
        } catch (err) { /* noop */ }
      }
      tick()
      clockTimer = window.setInterval(tick, 1000)
    }

    function stopClock() {
      if (clockTimer) {
        try { window.clearInterval(clockTimer) } catch (err) { /* noop */ }
        clockTimer = null
      }
    }

    var enterTimer = null
    var splashWatchTimer = null
    /** v0.5 §6.4：UI 显影状态机。idle → handoff（11.80s 主路径）/ done（兜底）。
     *  只允许首个触发源生效：splash 13.90s 的 done 不得截断/重播 11.80s handoff 的
     *  3.0s 分级显影（否则 1.25s 起跑的放缓进场会被 1.4s 版本覆盖）。
     *  v0.5 §3.2：handoff base = 1250ms → 11.80+1.25 = 13.05 与启动层 warp 溶解（13.05–13.86）
     *  同帧起跑，under-splash 透出；8 段总窗口最后一段 340+1000 = 14.59 收尾，
     *  dsh-moss-enter 保持 3000ms（11.80→14.80）→ 动画全部结束后才撤 class，无跳变。 */
    var enterState = 'idle'

    /** 启动层是否还在播：三路兼容（v0.2 对象 {state} / v0.1 boolean / #dsh-moss-root 存在）。
     *  对象契约：'boot'|'playing'|'handoff'|'preview' 视为在播；'done'|'disabled' 视为结束。 */
    function splashActive() {
      var state = null
      try { state = window.__DSH_MOSS2_SPLASH__ } catch (err) { state = null }
      if (state === false) return false
      if (state && typeof state === 'object') {
        var phase = state.state
        return phase !== 'done' && phase !== 'disabled'
      }
      if (state === true) return true
      try { return !!document.getElementById(ROOT_ID) } catch (err) { return false }
    }

    /** 给 html.dsh-moss-enter 挂分级显影；baseMs 经 CSS 变量 --moss-enter-base 传给 skin.css。 */
    function enterUI(holdMs, baseMs) {
      if (typeof document === 'undefined') return
      var html = document.documentElement
      try {
        var base = isFinite(Number(baseMs)) ? Math.max(0, Number(baseMs)) : 0
        if (html.style && html.style.setProperty) html.style.setProperty('--moss-enter-base', base + 'ms')
        html.classList.add('dsh-moss-enter')
        if (enterTimer) window.clearTimeout(enterTimer)
        enterTimer = window.setTimeout(function () {
          try { html.classList.remove('dsh-moss-enter') } catch (err) { /* noop */ }
          enterTimer = null
        }, holdMs || 1400)
        try {
          window.__DSH_MOSS2_ENTER__ = {
            mode: enterState,
            baseMs: base,
            holdMs: holdMs || 1400,
            at: Date.now()
          }
        } catch (err) { /* noop */ }
      } catch (err) { /* noop */ }
    }

    /** v0.5 §3.2 主路径：splash 11.80s 派发 'dsh-moss2:handoff' → 3.0s 分级显影（base 1250）。
     *  11.80 挂 class；fill-mode:both 让各分区停在第一帧（不可见），13.05 与启动层溶解同帧起跑。 */
    function enterUIFromHandoff() {
      if (enterState !== 'idle') return false
      enterState = 'handoff'
      enterUI(3000, 1250)
      return true
    }

    /** v0.4 兜底（v0.5 不变）：'dsh-moss2:done' / host 'dsh-moss2:fallback' / 启动层自举结束 → 1.4s 立即显影。 */
    function enterUIFromDone(holdMs) {
      if (enterState !== 'idle') return false
      enterState = 'done'
      enterUI(holdMs || 1400, 0)
      return true
    }

    /** splash 交接完成后补 UI 显影（若 splash 自己已经加过 dsh-moss-enter 则不重复）。
     *  v0.2 契约：splash 在 finish() 后把 __DSH_MOSS2_SPLASH__.state 置 'done'。
     *  v0.5：走兜底通道（handoff 已触发时状态机拒绝，不覆盖 3.0s 主路径），
     *  并释放 ambient held（兜底：启动层结束必须让背景起播，防永久静止）。 */
    function watchSplashDone() {
      if (splashWatchTimer) return
      var started = Date.now()
      splashWatchTimer = window.setInterval(function () {
        var active = splashActive()
        var elapsed = Date.now() - started
        if (active && elapsed < 18000) return
        window.clearInterval(splashWatchTimer)
        splashWatchTimer = null
        releaseAmbientHold('watch-splash-done')
        if (!active && !hasClass(document.documentElement, 'dsh-moss-enter')) enterUIFromDone(1400)
      }, 150)
    }

    function applySkin(cfg, opts) {
      cfg = cfg || FALLBACK
      lastConfig = cfg
      if (typeof document === 'undefined') return
      var html = document.documentElement
      if (!html) return
      var options = opts || {}

      var api = {
        config: function () { return Object.assign({}, lastConfig) },
        apply: function (next, opts2) {
          applySkin(Object.assign({}, lastConfig, next), opts2)
        },
        replay: replaySplash,
        preview: function () { window.open(BASE + '/preview', '_blank') },
        refresh: loadConfig,
        // splash 10.60s 交接：把真实背景层 seek 到与启动层地球同一帧并确保播放。
        armHandoff: armHandoff,
        handoffState: function () {
          try { return window.__DSH_MOSS2_HANDOFF__ || null } catch (err) { return null }
        }
      }
      publishApi(api)

      if (cfg.skin === 'off') {
        removeSkin()
        return
      }

      ensureCss('skin.css')

      var tier = cfg.skin === 'immersive' ? 'immersive' : 'glass'
      try {
        html.classList.add(SKIN_CLASS)
        html.classList.toggle(SKIN_CLASS + '--glass', tier === 'glass')
        html.classList.toggle(SKIN_CLASS + '--immersive', tier === 'immersive')
        html.setAttribute('data-moss-quality', cfg.quality)
        html.setAttribute('data-moss-hud', cfg.hud)
        html.style.setProperty('--moss-veil', String(clamp(num(cfg.veil, 58), 0, 100)))
        html.style.setProperty('--moss-blur', clamp(num(cfg.blur, 16), 0, 40) + 'px')
        if (!('backdropFilter' in document.body.style) && !('webkitBackdropFilter' in document.body.style)) {
          html.classList.add(SKIN_CLASS + '--noblur')
        } else {
          html.classList.remove(SKIN_CLASS + '--noblur')
        }
      } catch (err) { /* noop */ }

      ensureAmbient(cfg)
      // v0.5 §3.2：启动层在播时 ambient 全程暂停并置 held（减少并行解码 / 避免交接瞬间冻结帧）。
      // 真实宿主 index.js BOOTSTRAP 已先置 __DSH_MOSS2_SPLASH__；splash.js defer / 自举路径
      // 可能晚于本函数，watchAmbientHold 在 3s 内补一次判定（无启动层 → 与 v0.4 常规播放一致）。
      if (!holdAmbient('splash-active')) watchAmbientHold()
      publishAmbientProbe()
      syncPlayback(cfg)
      startClock()

      if (options.enter) {
        // 启动层在播时等它交接完再显影（splash 自己加过 enter 就不重复）；否则立即显影。
        if (splashActive()) watchSplashDone()
        else enterUIFromDone(1400)
      }
    }

    function removeSkin() {
      if (typeof document === 'undefined') return
      var html = document.documentElement
      try {
        if (html.classList) {
          var classes = [SKIN_CLASS]
          var all = html.className ? String(html.className).split(/\s+/) : []
          for (var i = 0; i < all.length; i += 1) {
            if (all[i].indexOf(SKIN_CLASS) === 0 || all[i].indexOf('dsh-moss-enter') === 0) classes.push(all[i])
          }
          for (var j = 0; j < classes.length; j += 1) html.classList.remove(classes[j])
        }
        html.removeAttribute('data-moss-quality')
        html.removeAttribute('data-moss-hud')
        html.style.removeProperty('--moss-enter-base')
        enterState = 'idle'
      } catch (err) { /* noop */ }
      var wrap = document.getElementById(AMBIENT_ID)
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap)
      pauseVideo()
      // 皮肤关闭：交接状态一并复位（避免 held/定时器在无视频层时残留）。
      clearAmbientTimers()
      ambientHeld = false
      ambientHoldReleased = true
      publishAmbientProbe()
      stopClock()
    }

    /* ── 启动层自举（无 tapIndex 时） ─────────────────────────────────── */

    function loadCss(href) {
      return new Promise(function (resolve, reject) {
        if (document.querySelector('link[href="' + href + '"]')) { resolve(); return }
        var link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        link.addEventListener('load', function () { resolve() }, { once: true })
        link.addEventListener('error', function () { reject(new Error('css load failed: ' + href)) }, { once: true })
        ;(document.head || document.documentElement).appendChild(link)
      })
    }

    function loadScript(src) {
      return new Promise(function (resolve, reject) {
        var script = document.createElement('script')
        script.src = src
        script.async = false
        script.addEventListener('load', function () { resolve() }, { once: true })
        script.addEventListener('error', function () { reject(new Error('script load failed: ' + src)) }, { once: true })
        ;(document.head || document.documentElement).appendChild(script)
      })
    }

    function releaseBoot() {
      try {
        var root = document.getElementById(ROOT_ID)
        if (root && root.parentNode) root.parentNode.removeChild(root)
        document.documentElement.classList.remove('moss-lock')
        if (document.body && document.body.style) document.body.style.overflow = ''
        window.__DSH_MOSS2_FAILED__ = true
      } catch (err) { /* noop */ }
    }

    function injectBoot(config, facts) {
      var root = document.getElementById(ROOT_ID)
      if (!root) {
        root = document.createElement('div')
        root.id = ROOT_ID
        root.setAttribute('aria-hidden', 'true')
        if (document.body) document.body.appendChild(root)
      }
      document.documentElement.classList.add('moss-lock')
      if (document.body && document.body.style) document.body.style.overflow = 'hidden'

      window.__DSH_MOSS2__ = Object.assign({}, config, {
        version: window.__DSH_MOSS2_VERSION__ || FALLBACK_VERSION,
        facts: facts || {}
      })
      window.__DSH_MOSS2_FACTS__ = facts || {}
      // v0.2 契约：__DSH_MOSS2_SPLASH__ 是对象（splash 会接管并推进 state）。
      window.__DSH_MOSS2_SPLASH__ = {
        version: window.__DSH_MOSS2_VERSION__ || FALLBACK_VERSION,
        state: 'boot',
        duration: SPLASH_DURATION,
        phases: []
      }

      window.setTimeout(function () {
        try {
          var current = document.getElementById(ROOT_ID)
          if (current && current.parentNode) releaseBoot()
        } catch (err) { /* noop */ }
      }, 17000)   // v0.5：13.90s 启动 + 3.1s 余量（与 index.js BOOTSTRAP / splash HARD_STOP 三层一致）

      return loadCss(BASE + '/splash.css')
        .then(function () { return loadScript(BASE + '/splash.js?t=' + Date.now()) })
        .catch(function (err) {
          releaseBoot()
          try {
            if (typeof console !== 'undefined' && console.warn) {
              console.warn('[dsh-startup-moss2] 启动层自举失败，已放开页面：' + err.message)
            }
          } catch (e) { /* noop */ }
        })
    }

    /** 启动层是否已经结束/明确不播（v0.2 对象 state==='done'|'disabled'；v0.1 boolean false）。 */
    function splashFinishedOrSkipped() {
      var state = null
      try { state = window.__DSH_MOSS2_SPLASH__ } catch (err) { state = null }
      if (state === false) return true
      if (state && typeof state === 'object') return state.state === 'done' || state.state === 'disabled'
      return false
    }

    /* ── 启动层播放判定（v0.3 design-spec-v3 §7：升级即重播一次）─────────────
     * 标记值带 SPLASH_REV（client.js 硬编码构建标记，**不依赖宿主进程版本**：
     * 用户正在跑的 host 内存里可能还是 0.2.0，刷新页面不会重新读 package.json）：
     *   localStorage['dsh-startup-moss2:rev'] = 上次播放时的 SPLASH_REV
     *   session 模式：本 session 已播过且 rev 一致 → 跳过；rev 变化 → 播一次
     *                 （升级后只刷新页面就能看到新启动动画，无需重启宿主）
     *   daily   模式：rev 变化 → 当天也播一次并更新 rev；否则按自然日每天一次
     *   always  模式：照旧每次都播
     * localStorage 不可用（隐私模式/写保护）时退回 v0.2 语义：rev 判定恒 false，
     * 只用 session/day 标记判断 —— 否则「读不到 rev」会让每次刷新都重播。 */
    var REV_KEY = 'dsh-startup-moss2:rev'
    var SESSION_SHOWN_KEY = 'dsh-startup-moss2:shown'
    var DAY_KEY = 'dsh-startup-moss2:day'

    function storageWritable(store) {
      try {
        var area = window[store]
        if (!area) return false
        var probe = 'dsh-startup-moss2:probe'
        area.setItem(probe, '1')
        area.removeItem(probe)
        return true
      } catch (err) {
        return false
      }
    }

    /** SPLASH_REV 是否变化过（即「升级后首次加载」）；localStorage 不可用时恒 false。 */
    function revChanged() {
      var stored = readFlag('localStorage', REV_KEY)
      if (stored === SPLASH_REV) return false
      if (!storageWritable('localStorage')) return false
      return true
    }

    function todayKey() {
      return new Date().toISOString().slice(0, 10)
    }

    function shouldShowSplash(cfg) {
      if (cfg.enabled === false) return false
      if (splashFinishedOrSkipped()) return false
      var today = todayKey()
      var fresh = revChanged()
      if (cfg.mode === 'session') {
        if (readFlag('sessionStorage', SESSION_SHOWN_KEY) === '1' && !fresh) return false
        return true
      }
      if (cfg.mode === 'daily') {
        if (fresh) return true
        if (readFlag('localStorage', DAY_KEY) === today) return false
        return true
      }
      return true
    }

    function markShown(cfg) {
      if (cfg.mode === 'session') writeFlag('sessionStorage', SESSION_SHOWN_KEY, '1')
      if (cfg.mode === 'daily') writeFlag('localStorage', DAY_KEY, todayKey())
      // 所有模式都记录本次已播的构建标记：下次 SPLASH_REV 变化 → 升级重播。
      writeFlag('localStorage', REV_KEY, SPLASH_REV)
    }

    /**
     * v0.3 §7「升级即重播」——真宿主（webServer）路径的补播。
     *
     * 事实：本机真宿主首屏自举由 lib/index.js 的 BOOTSTRAP_JS 完成（webServer.tapIndex 注入），
     * 运行中的宿主进程内存里仍是旧代码，只认 sessionStorage:shown / localStorage:day 两个旧标记、
     * 不认识 SPLASH_REV → 升级后刷新时宿主按旧标记跳过启动层，只刷新页面看不到 v0.3 动画。
     * 所以 client 半侧在这里补一条路径：宿主跳过启动层 + SPLASH_REV 变化 → 调 splash.js 公开
     * API `window.__DSH_MOSS2_REPLAY__()` 补播一次，确认成功后才写回 SPLASH_REV。
     *
     * v0.3 时序修复（lead 复现的真实回归）：
     *   client 模块和 splash.js(defer) 的执行顺序不稳定 —— client 的 attempt 可能早于 splash.js
     *   落定决策。splash.js 内部 `state` 初值是 'boot' 且不是「在播」的可靠信号；
     *   旧实现用 splashActive() 判断（把 boot 也算在播）并在未确认播放时就写 rev，
     *   结果出现「rev 写了但没补播」→ 用户刷新一次就永久错过 v0.3 动画。
     *   新实现：
     *     1) 轮询（60ms，最多 10s）直到启动层决策落定：
     *        a. state ∈ playing/handoff/preview/done 且 SKIP!==true → 宿主本次已播/播完 → 只补写 rev；
     *        b. SKIP===true 或 state ∈ host-skip(布尔 false)/disabled → 宿主跳过 → 进入补播；
     *        c. 其它（unset/boot/未知）→ 继续等，**绝不把 boot 当在播**。
     *     2) 补播：调 replay() 后 60ms 轮询 ≤1.5s 确认 state 进入 playing 且 #dsh-moss-root 存在；
     *        未确认则重试 replay 最多 2 次；仍失败 → **不写 rev**（下次刷新再试）+ console.warn 一次。
     *     3) 幂等：仅在确认后设 `__DSH_MOSS2_UPGRADE_REPLAY__=true`；revChanged() 判定保持。
     * 无 webServer（Electron file:// 等）的路径不在此处理：由 shouldShowSplash 的版本判定负责。
     */

    /** 启动层状态快照：宿主布尔值（旧 BOOTSTRAP_JS）、splash.js 对象 state、或未设置。 */
    function splashStateOf() {
      try {
        var s = window.__DSH_MOSS2_SPLASH__
        if (s === false) return 'host-skip'   // 旧 BOOTSTRAP_JS：宿主决定不播
        if (s === true) return 'playing'      // 旧 BOOTSTRAP_JS：宿主决定播（splash.js 待接管）
        if (s && typeof s === 'object') return String(s.state || 'unknown')
        if (s === undefined) return 'unset'
        return 'unknown'
      } catch (err) {
        return 'unknown'
      }
    }

    function splashSkipFlag() {
      try { return window.__DSH_MOSS2_SKIP__ === true } catch (err) { return false }
    }

    function splashReplayApi() {
      try {
        return typeof window.__DSH_MOSS2_REPLAY__ === 'function' ? window.__DSH_MOSS2_REPLAY__ : null
      } catch (err) {
        return null
      }
    }

    /** 补播是否已真的开始：splash state 进入 playing/handoff/preview 且启动层根节点存在。 */
    function upgradeReplayRunning() {
      var state = splashStateOf()
      var root = false
      try { root = !!document.getElementById(ROOT_ID) } catch (err) { root = false }
      return root && (state === 'playing' || state === 'handoff' || state === 'preview')
    }

    function maybeReplayOnUpgrade(cfg) {
      if (typeof window === 'undefined') return
      if (window.__DSH_MOSS2_BOOT__ !== 'index') return
      if (cfg.enabled === false) return
      if (!revChanged()) return
      var done = false
      var replayTries = 0
      var deadline = Date.now() + 10000

      /** 确认成功：宿主已播只写标记；补播成功写标记 + UPGRADE_REPLAY 探针。 */
      function succeed(reason) {
        if (done) return
        done = true
        if (reason === 'replay') {
          try { window.__DSH_MOSS2_UPGRADE_REPLAY__ = true } catch (err) { /* noop */ }
        }
        writeFlag('localStorage', REV_KEY, SPLASH_REV)
        warnOnce('upgrade-replay',
          '检测到新构建 ' + SPLASH_REV +
          (reason === 'replay' ? '，已补播一次启动动画' : '，宿主本次已播启动层') +
          '（升级即重播，无需重启宿主）。')
      }

      /** 失败：不写 rev（下次刷新重试），避免用户永久错过新动画。 */
      function giveUp(reason) {
        if (done) return
        done = true
        warnOnce('upgrade-replay-failed',
          '升级补播未确认成功（' + reason + '）：本次不写 rev 标记，下次刷新会重试。')
      }

      /** 调 replay 后 1.5s 内确认 playing+root；未确认重试 replay 最多 2 次。 */
      function confirmReplay() {
        var startedAt = Date.now()
        ;(function check() {
          if (done) return
          if (upgradeReplayRunning()) { succeed('replay'); return }
          if (Date.now() - startedAt < 1500) { window.setTimeout(check, 60); return }
          if (replayTries < 2) { replayTries += 1; runAttempt(); return }
          giveUp('replay-not-confirmed')
        })()
      }

      function runAttempt() {
        if (done) return
        if (Date.now() > deadline) { giveUp('timeout'); return }
        var state = splashStateOf()
        var skip = splashSkipFlag()
        /* a) 宿主本次已播/播完（旧布尔 true 或 splash 对象的在播态；boot 不算）
         *    → 用户本次已经看到启动动画，只补写 rev。 */
        if (skip !== true && (state === 'playing' || state === 'handoff' || state === 'preview' || state === 'done')) {
          succeed('host')
          return
        }
        /* b) 宿主已明确跳过（布尔 false / disabled / SKIP 标记）→ 补播。 */
        if (skip === true || state === 'host-skip' || state === 'disabled') {
          var replay = splashReplayApi()
          if (!replay) { window.setTimeout(runAttempt, 60); return }   // 等 splash.js defer 执行
          var ok = false
          try { ok = replay() } catch (err) { ok = false }
          if (ok === false) {
            /* splash 内部暂不可重播（如 state 仍 boot）：稍后再试，不写 rev */
            window.setTimeout(runAttempt, 120)
            return
          }
          confirmReplay()
          return
        }
        /* c) 决策尚未落定（unset / boot / unknown）：继续等，不把 boot 当在播。 */
        window.setTimeout(runAttempt, 60)
      }

      window.setTimeout(runAttempt, 0)
    }

    function selfBootSplash(cfg, facts) {
      try {
        if (typeof window === 'undefined' || typeof document === 'undefined') return
        if (!document.body) return
        if (window.__DSH_MOSS2_BOOT__ === 'index') return
        if (window.__DSH_MOSS2_BOOT__ === 'client') return
        window.__DSH_MOSS2_BOOT__ = 'client'
        if (!shouldShowSplash(cfg)) return
        markShown(cfg)
        injectBoot(cfg, facts)
      } catch (err) { /* 自举失败不拖垮宿主 */ }
    }

    function replaySplash() {
      try {
        if (typeof window.__DSH_MOSS2_REPLAY__ === 'function') {
          window.__DSH_MOSS2_REPLAY__()
          return
        }
      } catch (err) { /* noop */ }
      try { window.location.reload() } catch (err) { /* noop */ }
    }

    /* ── 配置读取 ─────────────────────────────────────────────────────── */

    function loadConfig() {
      return fetch(API, { headers: { Accept: 'application/json' } })
        .then(function (response) { return response.json() })
        .then(function (payload) {
          if (!payload || payload.ok !== true) throw new Error((payload && payload.error) || 'load failed')
          return {
            config: Object.assign({}, FALLBACK, payload.config),
            defaults: Object.assign({}, FALLBACK, payload.defaults),
            facts: payload.facts || {},
            file: payload.file || '',
            version: payload.version || FALLBACK_VERSION
          }
        })
    }

    function saveConfig(patch) {
      return fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch: patch })
      }).then(function (response) { return response.json() })
    }

    function resetConfig() {
      return fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      }).then(function (response) { return response.json() })
    }

    /* ── 设置页 ───────────────────────────────────────────────────────── */

    var CSS = [
      '.__m2_root{max-width:680px;display:flex;flex-direction:column;gap:14px;font-size:13px;color:var(--dsw-alias-label-primary)}',
      '.__m2_top{display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.__m2_version{font-family:ui-monospace,Consolas,monospace;font-size:12px;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary)}',
      '.__m2_group{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent)}',
      '.__m2_groupTitle{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}',
      '.__m2_field{display:flex;flex-direction:column;gap:6px}',
      '.__m2_label{font-size:12px;font-weight:600}',
      '.__m2_hint{font-size:11px;line-height:1.6;color:var(--dsw-alias-label-tertiary)}',
      '.__m2_row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
      '.__m2_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 8px;font:inherit;font-size:13px;min-width:200px}',
      '.__m2_check{display:flex;align-items:flex-start;gap:9px;cursor:pointer}',
      '.__m2_check input{margin-top:2px;accent-color:var(--dsw-alias-state-business-primary,#3964fe)}',
      '.__m2_checkText{display:flex;flex-direction:column;gap:2px}',
      '.__m2_actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:2px}',
      '.__m2_btn{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 14px;font:inherit;font-size:13px;cursor:pointer}',
      '.__m2_btn:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary)}',
      '.__m2_btn:disabled{opacity:.5;cursor:default}',
      '.__m2_btnPrimary{border-color:var(--dsw-alias-state-business-primary,#3964fe);background:var(--dsw-alias-state-business-primary,#3964fe);color:#fff}',
      '.__m2_status{font-size:12px;color:var(--dsw-alias-label-tertiary)}',
      '.__m2_ok{font-size:12px;color:var(--dsw-alias-state-business-primary)}',
      '.__m2_err{font-size:12px;color:var(--dsw-alias-state-error-primary,#f85149)}',
      '.__m2_preview{border:1px dashed var(--dsw-alias-border-l2);border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px}',
      '.__m2_previewText{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.6}',
      '.__m2_tierGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
      '.__m2_tier{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:10px 12px;cursor:pointer;background:var(--dsw-alias-bg-layer-2);display:flex;flex-direction:column;gap:4px}',
      '.__m2_tier[data-on="1"]{border-color:var(--dsw-alias-state-business-primary,#3964fe);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary,#3964fe) inset}',
      '.__m2_tierName{font-size:12px;font-weight:600}',
      '.__m2_tierDesc{font-size:11px;line-height:1.55;color:var(--dsw-alias-label-tertiary)}'
    ].join('')

    var tagId = 'dsh-startup-moss2/panel.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css="' + tagId + '"]') === null) {
      var tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-startup-moss2'
      tag.dataset.pluginCss = tagId
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    function Field(props) {
      return h('div', { className: '__m2_field' },
        h('label', { className: '__m2_label' }, props.label),
        props.children,
        props.hint ? h('div', { className: '__m2_hint' }, props.hint) : null
      )
    }

    function Check(props) {
      return h('label', { className: '__m2_check' },
        h('input', {
          type: 'checkbox',
          checked: !!props.checked,
          onChange: function (event) { props.onChange(event.target.checked) }
        }),
        h('span', { className: '__m2_checkText' },
          h('span', null, props.label),
          props.hint ? h('span', { className: '__m2_hint' }, props.hint) : null
        )
      )
    }

    function Select(props) {
      return h('select', {
        className: '__m2_select',
        value: props.value,
        onChange: function (event) { props.onChange(event.target.value) }
      }, props.options.map(function (option) {
        return h('option', { key: option[0], value: option[0] }, option[1])
      }))
    }

    function Range(props) {
      return h('div', { className: '__m2_row' },
        h('input', {
          type: 'range',
          min: props.min,
          max: props.max,
          step: props.step || 1,
          value: props.value,
          disabled: !!props.disabled,
          style: { flex: '1 1 220px' },
          onChange: function (event) { props.onChange(Number(event.target.value)) }
        }),
        h('span', { className: '__m2_status' }, props.display)
      )
    }

    var SKIN_TIERS = [
      ['glass', '玻璃', '视频背景 + 半透明玻璃表面 + 轻量 HUD（日常推荐）'],
      ['immersive', '沉浸', '更通透的玻璃 + 完整 MOSS HUD（刻线尺/遥测/扫描线）'],
      ['off', '关闭', '只保留启动动画，界面回归宿主原样']
    ]

    function Panel() {
      var state = react.useState({
        draft: null,
        defaults: null,
        facts: null,
        file: '',
        version: FALLBACK_VERSION,
        busy: false,
        notice: null,
        error: null
      })
      var s = state[0]
      var setState = state[1]

      function patch(next) {
        setState(function (current) {
          return Object.assign({}, current, next)
        })
      }

      function set(key, value) {
        setState(function (current) {
          var draft = Object.assign({}, current.draft)
          draft[key] = value
          return Object.assign({}, current, { notice: null, draft: draft })
        })
      }

      function load() {
        patch({ error: null })
        loadConfig()
          .then(function (payload) {
            patch({
              draft: payload.config,
              defaults: payload.defaults,
              facts: payload.facts,
              file: payload.file,
              version: payload.version
            })
          })
          .catch(function (err) {
            patch({ error: '读取配置失败：' + String(err && err.message ? err.message : err) })
          })
      }

      react.useEffect(function () { load() }, [])

      function save() {
        if (!s.draft) return
        patch({ busy: true, notice: null, error: null })
        saveConfig(s.draft)
          .then(function (payload) {
            if (!payload || payload.ok !== true) throw new Error((payload && payload.error) || 'save failed')
            patch({ draft: payload.config, busy: false, notice: '已保存并立即生效。' })
            applySkin(payload.config, { enter: false })
          })
          .catch(function (err) {
            patch({ busy: false, error: '保存失败：' + String(err && err.message ? err.message : err) })
          })
      }

      function reset() {
        patch({ busy: true, notice: null, error: null })
        resetConfig()
          .then(function (payload) {
            if (!payload || payload.ok !== true) throw new Error((payload && payload.error) || 'reset failed')
            patch({ draft: payload.config, busy: false, notice: '已恢复默认。' })
            applySkin(payload.config, { enter: false })
          })
          .catch(function (err) {
            patch({ busy: false, error: '恢复默认失败：' + String(err && err.message ? err.message : err) })
          })
      }

      var versionLine = h('div', { className: '__m2_version' }, 'MOSS 550W · v' + (s.version || FALLBACK_VERSION))
      var previewBtn = h('button', { className: '__m2_btn', type: 'button', onClick: replaySplash }, '重播启动动画')

      if (!s.draft) {
        return h('div', { className: '__m2_root' },
          h('div', { className: '__m2_top' }, versionLine, previewBtn),
          h('div', { className: '__m2_status' }, s.error || '读取配置中…'),
          s.error ? h('div', { className: '__m2_actions' },
            h('button', { className: '__m2_btn', type: 'button', onClick: load }, '重试')
          ) : null
        )
      }

      var d = s.draft
      var facts = s.facts || {}
      var factsLine = [
        facts.profile ? 'PROFILE ' + facts.profile : null,
        facts.workspace ? 'WORKSPACE ' + facts.workspace : null,
        facts.model ? 'MODEL ' + facts.model : null,
        facts.sessions !== null && facts.sessions !== undefined ? 'SESSIONS ' + facts.sessions : null,
        facts.version ? 'DSH ' + facts.version : null
      ].filter(Boolean).join(' ｜ ')

      return h('div', { className: '__m2_root' },
        h('div', { className: '__m2_top' }, versionLine, previewBtn),

        h('div', { className: '__m2_group' },
          h('div', { className: '__m2_groupTitle' }, '皮肤'),
          h('div', { className: '__m2_tierGrid' }, SKIN_TIERS.map(function (tier) {
            return h('div', {
              key: tier[0],
              className: '__m2_tier',
              'data-on': d.skin === tier[0] ? '1' : '0',
              role: 'button',
              tabIndex: 0,
              onClick: function () { set('skin', tier[0]) }
            },
            h('div', { className: '__m2_tierName' }, tier[1]),
            h('div', { className: '__m2_tierDesc' }, tier[2]))
          })),
          h(Field, { label: 'HUD 装饰密度' },
            h(Select, {
              value: d.hud,
              options: [['normal', '标准（推荐）'], ['full', '完整'], ['off', '关闭']],
              onChange: function (value) { set('hud', value) }
            })
          )
        ),

        h('div', { className: '__m2_group' },
          h('div', { className: '__m2_groupTitle' }, '动态背景'),
          h(Field, {
            label: '背景画质',
            hint: '高 = 1080p 循环；标准 = 720p 循环（推荐，省 GPU）；节能 = 只用静态海报，不加载视频。'
          },
          h(Select, {
            value: d.quality,
            options: [['high', '高 · 1080p'], ['standard', '标准 · 720p'], ['saver', '节能 · 静态海报']],
            onChange: function (value) { set('quality', value) }
          })),
          h(Field, {
            label: '背景压暗（' + num(d.veil, 58) + '%）',
            hint: '越大背景越「退后」，文字越稳；越小地球越清楚。默认 58。'
          },
          h(Range, {
            value: num(d.veil, 58),
            min: 20,
            max: 92,
            step: 1,
            display: num(d.veil, 58) + '%',
            onChange: function (value) { set('veil', value) }
          })),
          h(Field, {
            label: '玻璃模糊（' + num(d.blur, 16) + 'px）',
            hint: '面板毛玻璃强度。0 = 纯半透明（更省电），16 = 默认。'
          },
          h(Range, {
            value: num(d.blur, 16),
            min: 0,
            max: 40,
            step: 1,
            display: num(d.blur, 16) + 'px',
            onChange: function (value) { set('blur', value) }
          })),
          h(Check, {
            label: '减弱装饰动效（不影响视频背景）',
            hint: '只停 HUD 扫描线/呼吸/镜头漂移等装饰动画；地球视频照常播放。系统「减少动态效果」也不会再停视频背景。',
            checked: !!d.reducedMotion,
            onChange: function (value) { set('reducedMotion', value) }
          })
        ),

        h('div', { className: '__m2_group' },
          h('div', { className: '__m2_groupTitle' }, '启动动画'),
          h(Check, {
            label: '启用启动动画',
            hint: '11.8 秒四幕启动序列（神经接口 → MOSS 苏醒 → 一半一半转场 → 流浪地球），播完自动进入主界面，不需要点击。',
            checked: !!d.enabled,
            onChange: function (value) { set('enabled', value) }
          }),
          h(Field, { label: '播放时机' },
            h(Select, {
              value: d.mode,
              options: [['session', '每个浏览器会话一次'], ['daily', '每天一次'], ['always', '每次打开都播放']],
              onChange: function (value) { set('mode', value) }
            })
          ),
          h(Check, {
            label: '允许 Esc 跳过',
            hint: '不显示 SKIP 按钮；打开时只保留隐藏的 Esc 退出。',
            checked: !!d.allowSkip,
            onChange: function (value) { set('allowSkip', value) }
          }),
          h(Check, {
            label: '播放启动音',
            hint: '程序化合成的 550W 开机声（低频底 + 提示音），不依赖外部音频文件。',
            checked: !!d.sound,
            onChange: function (value) { set('sound', value) }
          }),
          h(Field, { label: '音量（' + num(d.volume, 50) + '%）' },
            h(Range, {
              value: num(d.volume, 50),
              min: 0,
              max: 100,
              step: 1,
              disabled: !d.sound,
              display: num(d.volume, 50) + '%',
              onChange: function (value) { set('volume', value) }
            })
          )
        ),

        h('div', { className: '__m2_preview' },
          h('div', { className: '__m2_previewText' },
            '皮肤改动保存后立即生效；启动动画需要点「重播」才会重新播放。',
            factsLine ? h('div', { style: { marginTop: '5px', opacity: 0.78, fontFamily: 'ui-monospace,Consolas,monospace' } }, factsLine) : null,
            s.file ? h('div', { style: { marginTop: '4px', opacity: 0.62 } }, '配置文件：' + s.file) : null
          ),
          h('button', { className: '__m2_btn', type: 'button', onClick: replaySplash }, '重播')
        ),

        h('div', { className: '__m2_actions' },
          h('button', { className: '__m2_btn __m2_btnPrimary', type: 'button', disabled: s.busy, onClick: save },
            s.busy ? '处理中…' : '保存'),
          h('button', { className: '__m2_btn', type: 'button', disabled: s.busy, onClick: reset }, '恢复默认'),
          h('button', { className: '__m2_btn', type: 'button', disabled: s.busy, onClick: load }, '放弃修改'),
          s.notice ? h('span', { className: '__m2_ok' }, s.notice) : null,
          s.error ? h('span', { className: '__m2_err' }, s.error) : null
        )
      )
    }

    /* ── 品牌位：MOSS 红眼 ────────────────────────────────────────────── */

    var EYE_SVG = {
      viewBox: '0 0 32 32',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg'
    }

    /* v0.3 第 1 项（design-spec-v3 §3.1）：给红眼 SVG 各环加**稳定 class**，
     * 由 skin.css §5.12 做呼吸 + 信号灯双击动画（hero 34px / 侧栏 20px 共用）。
     * 只用插件自己的 class（host 热重载不丢），不依赖宿主类名。 */
    function MossEyeMark(props) {
      var size = (props && props.size) || 20
      var red = 'var(--m-moss, #ff3d1f)'
      return h('svg', Object.assign({}, EYE_SVG, {
        width: size,
        height: size,
        className: 'dsh-moss-brandmark',
        'aria-hidden': 'true',
        style: { display: 'block', filter: 'drop-shadow(0 0 6px rgba(255,61,31,.55))' }
      }),
      h('circle', { cx: 16, cy: 16, r: 14.5, className: 'dsh-moss-eye__halo', stroke: 'rgba(180,205,230,.34)', strokeWidth: 1 }),
      h('circle', { cx: 16, cy: 16, r: 11, stroke: 'rgba(180,205,230,.20)', strokeWidth: 0.75, strokeDasharray: '2 3' }),
      h('circle', { cx: 16, cy: 16, r: 6.6, className: 'dsh-moss-eye__ring', fill: 'rgba(255,61,31,.10)', stroke: red, strokeWidth: 1 }),
      h('circle', { cx: 16, cy: 16, r: 3.2, className: 'dsh-moss-eye__core', fill: red }),
      h('circle', { cx: 16, cy: 16, r: 1.35, className: 'dsh-moss-eye__glint', fill: '#fff', opacity: 0.9 })
      )
    }

    function BrandMark() {
      return h('span', { className: 'dsh-moss-brandmark-wrap', style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } },
        h(MossEyeMark, { size: 20 }),
        h('span', {
          className: 'dsh-moss-wordmark',
          style: {
            fontFamily: 'ui-monospace, "Cascadia Mono", Consolas, monospace',
            fontSize: '10px',
            letterSpacing: '.14em',
            opacity: 0.72,
            lineHeight: 1
          }
        }, '550W')
      )
    }

    /* ── 插件入口 ─────────────────────────────────────────────────────── */

    var inject = ['slots']

    function apply(ctx) {
      ensureCss('skin.css')

      loadConfig().then(function (payload) {
        applySkin(payload.config, { enter: true })
        selfBootSplash(payload.config, payload.facts)
        maybeReplayOnUpgrade(payload.config)
      }).catch(function () {
        // 配置接口不可用时仍按默认皮肤走，保证主界面不是裸的
        applySkin(FALLBACK, { enter: true })
        selfBootSplash(FALLBACK, {})
        maybeReplayOnUpgrade(FALLBACK)
      })

      document.addEventListener('visibilitychange', function () {
        var cfg = lastConfig || FALLBACK
        if (document.visibilityState === 'hidden') {
          pauseVideo()
          try { document.documentElement.classList.add(SKIN_CLASS + '--paused') } catch (err) { /* noop */ }
        } else {
          try { document.documentElement.classList.remove(SKIN_CLASS + '--paused') } catch (err) { /* noop */ }
          syncPlayback(cfg)
        }
      })

      // splash 交接信号（跨文件契约，design-spec-v0.5 §3.2/§3.3）：
      //   11.80s splash dispatch 'dsh-moss2:handoff' → enterUI(3000, base 1250)（主路径，
      //     13.05 与启动层 warp 溶解同帧起跑，见 skin.css §6）+ ambient 按 detail.revealAt 兜底排期起播、
      //   13.90s splash dispatch 'dsh-moss2:done' → 兜底 enterUI(1400)（handoff 已触发时忽略）
      //     + 释放 ambient held（必须：防背景永久静止）、
      //   index.js 的 17s 兜底 dispatch 'dsh-moss2:fallback' → 同样兜底放行 UI + 释放 ambient held。
      try {
        if (!window.__DSH_MOSS2_ENTER_BOUND__) {
          window.__DSH_MOSS2_ENTER_BOUND__ = true
          window.addEventListener('dsh-moss2:handoff', function (event) {
            enterUIFromHandoff()
            onHandoffEvent(event)
          })
          window.addEventListener('dsh-moss2:done', function () {
            releaseAmbientHold('done-event')
            enterUIFromDone(1400)
          })
          window.addEventListener('dsh-moss2:fallback', function () {
            releaseAmbientHold('fallback-event')
            enterUIFromDone(1400)
          })
        }
      } catch (err) { /* noop */ }

      // 注意：v0.2 不再监听/读取系统 prefers-reduced-motion（video 播放与它无关）。
      // 系统偏好只由 index.js 首屏加 html.dsh-moss-motion-hint 作纯提示；
      // 用户显式 reducedMotion 由 syncPlayback 映射为 --calm。

      var slots = (typeof ctx.get === 'function' ? ctx.get('slots') : undefined) || ctx.slots
      if (!slots) return

      /* ── 槽位注册（懒注入 + 全量异常兜底）────────────────────────────
       * 宿主 slot API（dsh-client-ui-renderer 0.2.2-rc.1 实测语义）：
       *   slots.inject(name, cb) 惰性执行 cb —— cb 内抛错会变成宿主**未捕获异常**
       *     （v0.1 的 sidebar.brand.mark 冲突正是这样炸的，外层 try/catch 抓不到）；
       *   slots.register({name, priority?, id?, order?, label?}, component)；
       *   single 槽同优先级重复注册会抛错，不同优先级可共存，**数值最低者渲染**。
       * 因此品牌位用「逐级向下 shadow」：从 -1 起试，冲突则按错误里报告的已有优先级
       * 再低一级重试；仍失败就放弃该品牌位并 console.warn 一次 —— 绝不抛出。 */

      function occupiedPriority(error) {
        try {
          var m = /at priority (-?\d+)/.exec(String((error && error.message) || error))
          if (!m) return null
          var n = Number(m[1])
          return isFinite(n) ? n : null
        } catch (err) {
          return null
        }
      }

      function registerSlotSafely(slotName, options, component, label) {
        var opts = options || {}
        var shadow = opts.shadow === true
        var baseOptions = {}
        for (var key in opts) {
          if (Object.prototype.hasOwnProperty.call(opts, key) && key !== 'shadow') baseOptions[key] = opts[key]
        }
        var priority = BRAND_PRIORITY_START
        var lastError = null
        var attempts = shadow ? 5 : 1
        for (var i = 0; i < attempts; i += 1) {
          var entry = Object.assign({}, baseOptions, { name: slotName, registrant: REGISTRANT })
          if (shadow) entry.priority = priority
          try {
            return slots.register(entry, component)
          } catch (err) {
            lastError = err
            var occupied = occupiedPriority(err)
            if (!shadow || occupied === null) break
            priority = occupied - 1
          }
        }
        warnOnce('slot:' + slotName,
          label + '已被宿主/其他插件占用，跳过 MOSS 标记（不覆盖宿主，功能不受影响）：' +
          String((lastError && lastError.message) || lastError))
        // 返回一个 noop disposer：slots.inject 的 cb 在 ctx.effect 内执行，
        // 返回函数比 null 更贴合框架的 disposer 约定，且同样不抛出。
        return function () {}
      }

      function injectSlotSafely(slotName, options, component, label) {
        try {
          return slots.inject(slotName, function () {
            try {
              return registerSlotSafely(slotName, options, component, label)
            } catch (err) {
              warnOnce('slot-inject:' + slotName,
                label + '注册失败，已跳过：' + String((err && err.message) || err))
              return function () {}
            }
          })
        } catch (err) {
          warnOnce('slot-inject:' + slotName,
            label + '槽位不可用，已跳过：' + String((err && err.message) || err))
          return null
        }
      }

      injectSlotSafely('settings.section',
        { id: 'startup-moss2', order: 26, label: THEME_LABEL },
        function () { return h(Panel, {}) },
        '设置页')

      // 真宿主上 sidebar.brand.mark 已被另一插件（registrant=tk，priority 0）注册；
      // 用 priority -1 起向下 shadow，让 MOSS 红眼仍能渲染且不抛异常。
      injectSlotSafely('sidebar.brand.mark',
        { shadow: true },
        function () { return h(BrandMark, {}) },
        '侧栏品牌位')

      // v0.4 §7.1：hero 红眼（用户点名的「探索未至之境」左侧红色信号灯）外包一层
      // .dsh-moss-brandmark-wrap，由 skin.css §5.12 的 ::before 径向光晕做「信号灯呼吸」。
      // MossEyeMark() 本体结构不变，只加一个纯装饰的定位壳（class 由插件自有 CSS 驱动）。
      injectSlotSafely('conversation.hero.brand.mark',
        { shadow: true },
        function () {
          return h('span', { className: 'dsh-moss-brandmark-wrap dsh-moss-brandmark-wrap--hero' },
            h(MossEyeMark, { size: 34 })
          )
        },
        '空态品牌位')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  }
})

/* skin-weaver v0.5 build marker: FALLBACK_VERSION=0.5.0 / SPLASH_REV=v0.5-r1 / splash 13.90s / client-boot-fallback 17000ms / handoff-event→enterUI(3000, base 1250ms) / enter-stagger 1.0–1.05s (cubic-bezier(.22,1,.36,1), blur 8→0, 18–22px) / ambient handoff-sync (splashActive→held+pause; armHandoff(t,{revealIn})→seek-only+定时起播; handoff 事件按 revealAt 兜底排期; done/fallback/watchSplashDone/15.5s 强制释放) / eye-breath-max / eye-wrap-halo(hero+sidebar) / composer-corner-breath-max + z-index 6 (4-corner fix) (client.js served from disk per page load) */

