/* ============================================================================
 * dsh-startup-moss2 — Host 半侧
 * ----------------------------------------------------------------------------
 * 550W / MOSS（流浪地球）主题：启动动画 + UI 皮肤。
 *
 *   1) 在首屏 HTML 注入启动层容器、皮肤/启动样式、内联配置与自举脚本
 *   2) 提供 /dsh-moss2 下的样式、脚本、预览与配置 API
 *   3) 以 Range 支持把 lib/assets 下的视频/海报/字库喂给浏览器
 *   4) 采集真实 facts（profile/workspace/model/sessions/version）注入页面
 *
 * 设计权威源：docs/design-spec-v0.5.md（v0.5 增量：地球短 GOP 资产 / 13.90s 交接 /
 * MOSS 机械臂实录音效）。字段在 lib/index.js、lib/client.js、lib/splash.js 三处必须一致
 * （test/smoke-*.mjs 断言）。
 * ========================================================================== */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const CONFIG_FILE = path.join(DSH_HOME, 'dsh-startup-moss2.json')

const NS = 'dsh-startup-moss2'
const ROUTE_BASE = '/dsh-moss2'

const PLUGIN_VERSION = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'))
    return String(pkg.version || '').trim() || '0.0.0'
  } catch (err) {
    return '0.0.0'
  }
})()

/** 配置默认值 — 与 docs/design-spec.md §8 一致。 */
const DEFAULTS = {
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

const BOOL_KEYS = ['enabled', 'sound', 'allowSkip', 'reducedMotion']
const ENUMS = {
  mode: ['session', 'daily', 'always'],
  skin: ['off', 'glass', 'immersive'],
  quality: ['high', 'standard', 'saver'],
  hud: ['off', 'normal', 'full']
}
const RANGES = {
  veil: [0, 100],
  blur: [0, 40],
  volume: [0, 100]
}

function normalize(input) {
  const out = { ...DEFAULTS }
  const src = input && typeof input === 'object' ? input : {}
  for (const key of Object.keys(DEFAULTS)) {
    if (!Object.prototype.hasOwnProperty.call(src, key)) continue
    const value = src[key]
    if (value === undefined || value === null) continue
    if (BOOL_KEYS.includes(key)) {
      out[key] = value === true || value === 'true' || value === 1 || value === '1'
    } else if (ENUMS[key]) {
      out[key] = ENUMS[key].includes(value) ? value : DEFAULTS[key]
    } else if (RANGES[key]) {
      const [lo, hi] = RANGES[key]
      const n = Number(value)
      out[key] = Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : DEFAULTS[key]
    }
  }
  return out
}

function readConfig() {
  try {
    return normalize(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')))
  } catch (err) {
    return { ...DEFAULTS }
  }
}

function writeConfig(next) {
  const cfg = normalize(next)
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true })
  const tmp = CONFIG_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(cfg, null, 2), 'utf8')
  fs.renameSync(tmp, CONFIG_FILE)
  return cfg
}

/* ── 静态文件读取（带 mtime 缓存，便于开发期热改） ─────────────────────── */

function makeReader(rel) {
  let cache = null
  return function read() {
    const file = path.join(PACKAGE_ROOT, rel)
    try {
      const st = fs.statSync(file)
      if (!cache || cache.mtimeMs !== st.mtimeMs || cache.size !== st.size) {
        cache = { mtimeMs: st.mtimeMs, size: st.size, text: fs.readFileSync(file, 'utf8') }
      }
      return cache.text
    } catch (err) {
      cache = null
      return ''
    }
  }
}

const readSkinCss = makeReader('lib/skin.css')
const readSplashCss = makeReader('lib/splash.css')
const readSplashJs = makeReader('lib/splash.js')
const readPreviewHtml = makeReader('preview/index.html')

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/* ── 资产白名单（路径即接口，见 design-spec §3） ───────────────────────── */

const ASSET_TYPES = {
  'earth/earth-1080.mp4': 'video/mp4',
  'earth/earth-720.mp4': 'video/mp4',
  /* v0.5：MOSS 机械臂音效（用户自制音轨，对齐 moss-cinema 3.90–8.30） */
  'audio/moss-arm-sfx.m4a': 'audio/mp4',
  'earth/earth-poster.webp': 'image/webp',
  'earth/earth-poster.jpg': 'image/jpeg',
  'neuro/neuro-boot-1080.mp4': 'video/mp4',
  'neuro/neuro-boot-720.mp4': 'video/mp4',
  'neuro/neuro-boot-poster.webp': 'image/webp',
  'moss/moss-cinema-1080.mp4': 'video/mp4',
  'moss/moss-cinema-720.mp4': 'video/mp4',
  'moss/moss-cinema-poster.webp': 'image/webp',
  'fonts/jetbrains-mono-400.woff2': 'font/woff2',
  'fonts/jetbrains-mono-500.woff2': 'font/woff2',
  'manifest.json': 'application/json; charset=utf-8'
}

const ASSET_ROOT = path.join(PACKAGE_ROOT, 'lib', 'assets')

function resolveAsset(name) {
  if (!Object.prototype.hasOwnProperty.call(ASSET_TYPES, name)) return null
  const file = path.resolve(ASSET_ROOT, name)
  const rel = path.relative(ASSET_ROOT, file)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null
  return { file, type: ASSET_TYPES[name] }
}

function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(header || '').trim())
  if (!m) return null
  if (m[1] === '' && m[2] === '') return { invalid: true }
  if (!Number.isFinite(size) || size <= 0) return { invalid: true }
  let start
  let end
  if (m[1] === '') {
    const n = Number(m[2])
    if (!Number.isFinite(n) || n <= 0) return { invalid: true }
    start = Math.max(0, size - n)
    end = size - 1
  } else {
    start = Number(m[1])
    end = m[2] === '' ? size - 1 : Number(m[2])
    if (end > size - 1) end = size - 1
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) {
    return { invalid: true }
  }
  return { start, end }
}

function readAssetSlice(file, start, end) {
  const length = end - start + 1
  const buf = Buffer.alloc(length)
  const fd = fs.openSync(file, 'r')
  try {
    let offset = 0
    while (offset < length) {
      const n = fs.readSync(fd, buf, offset, length - offset, start + offset)
      if (n <= 0) break
      offset += n
    }
    return offset === length ? buf : buf.subarray(0, offset)
  } finally {
    try { fs.closeSync(fd) } catch (err) { /* close 失败不影响响应 */ }
  }
}

/* ── 真实 facts 采集（取不到的字段留 null，浏览器侧显示「—」） ─────────── */

const factsCache = { value: null, started: false }

function collectFacts(ctx) {
  if (factsCache.started) return factsCache.value
  factsCache.started = true
  const facts = { ready: false }
  factsCache.value = facts
  const get = (name) => {
    try { return typeof ctx.get === 'function' ? ctx.get(name) : undefined } catch (err) { return undefined }
  }

  ;(async () => {
    try {
      const pc = get('profileContext') || {}
      facts.profile = pc.name ? String(pc.name).toUpperCase() : null
      facts.workspace = pc.cwd ? String(pc.cwd).split(/[\\/]/).filter(Boolean).pop() : null
      facts.bundleCount = Array.isArray(pc.startedBundles) ? pc.startedBundles.length : null
    } catch (err) { /* noop */ }

    try {
      const pm = get('pluginManager')
      if (pm && typeof pm.listBundles === 'function') {
        const list = await pm.listBundles()
        if (Array.isArray(list) && list.length) {
          facts.bundleCount = list.length
          const base = list.find((b) => b && /dsh-base$/.test(String(b.name || '')))
          const core = base || list[0]
          if (core && core.version) facts.version = String(core.version).replace(/^v/, '')
        }
      }
    } catch (err) { /* noop */ }

    try {
      const md = get('agentDefaultModel')
      if (md && typeof md.currentSelection === 'function') {
        const selection = await md.currentSelection()
        facts.model = selection && selection.model ? String(selection.model) : null
      }
    } catch (err) { /* noop */ }

    try {
      const sessions = get('sessions')
      if (sessions && typeof sessions.list === 'function') {
        const list = await sessions.list()
        if (Array.isArray(list)) facts.sessions = list.length
      }
    } catch (err) { /* noop */ }

    facts.ready = true
  })().catch(() => { facts.ready = true })

  return facts
}

/* ── 首屏关键 CSS / 自举脚本 ───────────────────────────────────────────── */

const CRITICAL_CSS = [
  'html.moss-lock,html.moss-lock body{overflow:hidden!important}',
  '#dsh-moss-root{position:fixed;inset:0;z-index:2147483000;background:#04070c}',
  '#dsh-moss-ambient{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:#04070c}',
  '#root{position:relative;z-index:1}',
  'html.dsh-moss-skin,html.dsh-moss-skin body{background:transparent!important}'
].join('')

/**
 * 内联自举：在首帧之前落地「皮肤作用域 class / 背景层 DOM / 启动层决策」，
 * 避免 FOUC（先见宿主配色再变皮肤）。所有动作幂等，client.js 会复核。
 */
const BOOTSTRAP_JS = `(function(){try{
var c=window.__DSH_MOSS2__||{};
var cfg=c;
var ver=c.version||'0.0.0';
var base='/dsh-moss2';
var html=document.documentElement;
var body=document.body;
function seen(store,key,val){try{var s=window[store];return !!s&&s.getItem(key)===val}catch(e){return false}}
function mark(store,key,val){try{var s=window[store];if(s)s.setItem(key,val)}catch(e){}}

/* ── 皮肤：class + CSS 变量 + 背景层（视频/海报） ── */
if(cfg.skin&&cfg.skin!=='off'){
  html.classList.add('dsh-moss-skin');
  html.classList.add('dsh-moss-skin--'+(cfg.skin==='immersive'?'immersive':'glass'));
  html.setAttribute('data-moss-quality',cfg.quality||'standard');
  html.setAttribute('data-moss-hud',cfg.hud||'normal');
  var veil=typeof cfg.veil==='number'?cfg.veil:58;
  var blur=typeof cfg.blur==='number'?cfg.blur:16;
  html.style.setProperty('--moss-veil',String(veil));
  html.style.setProperty('--moss-blur',String(blur)+'px');
  if(cfg.reducedMotion)html.classList.add('dsh-moss-skin--calm');
  /* v0.2 运动策略：系统 reduced-motion 偏好不得停视频（本机 Windows 动画已关闭，
     v0.1 因此真机上地球/MOSS 视频全部不播）。只作为装饰动画的提示保留。 */
  try{
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)html.classList.add('dsh-moss-motion-hint');
  }catch(e){}
  html.classList.add('dsh-moss-enter');
  setTimeout(function(){try{html.classList.remove('dsh-moss-enter')}catch(e){}},1400);
  if(body&&!document.getElementById('dsh-moss-ambient')){
    var q=cfg.quality||'standard';
    var wrap=document.createElement('div');
    wrap.id='dsh-moss-ambient';
    wrap.setAttribute('aria-hidden','true');
    var still=document.createElement('img');
    still.className='ma-still';
    still.alt='';
    still.decoding='async';
    still.src=base+'/asset/earth/earth-poster.webp';
    still.onerror=function(){try{this.src=base+'/asset/earth/earth-poster.jpg'}catch(e){}};
    wrap.appendChild(still);
    var vid=document.createElement('video');
    vid.className='ma-video';
    vid.muted=true;vid.defaultMuted=true;vid.loop=true;vid.autoplay=true;
    vid.setAttribute('muted','');vid.setAttribute('playsinline','');
    vid.setAttribute('preload','auto');
    vid.setAttribute('poster',base+'/asset/earth/earth-poster.webp');
    vid.setAttribute('disablepictureinpicture','');
    vid.style.opacity='';
    if(q!=='saver'){
      vid.src=base+'/asset/earth/'+(q==='high'?'earth-1080.mp4':'earth-720.mp4')+'?v='+encodeURIComponent(ver);
    }
    wrap.appendChild(vid);
    ['ma-veil','ma-vignette','ma-grain','ma-scan','ma-rim'].forEach(function(cls){
      var d=document.createElement('div');d.className=cls;wrap.appendChild(d);
    });
    body.appendChild(wrap);
  }
}

/* ── 启动动画：模式决策 + 硬兜底 ── */
var on=true;
if(cfg.enabled===false)on=false;
var today=new Date().toISOString().slice(0,10);
if(on&&cfg.mode==='session'&&seen('sessionStorage','dsh-startup-moss2:shown','1'))on=false;
if(on&&cfg.mode==='daily'&&seen('localStorage','dsh-startup-moss2:day',today))on=false;
window.__DSH_MOSS2_SPLASH__=on;
if(!on)window.__DSH_MOSS2_SKIP__=true;
if(on){
  if(cfg.mode==='session')mark('sessionStorage','dsh-startup-moss2:shown','1');
  if(cfg.mode==='daily')mark('localStorage','dsh-startup-moss2:day',today);
  html.classList.add('moss-lock');
  setTimeout(function(){try{
    var r=document.getElementById('dsh-moss-root');
    if(r&&r.parentNode)r.parentNode.removeChild(r);
    html.classList.remove('moss-lock');
    if(document.body)document.body.style.overflow='';
    try{window.dispatchEvent(new Event('dsh-moss2:fallback'))}catch(e){}}catch(e){}},17000);
}else{
  html.classList.remove('moss-lock');
  var root=document.getElementById('dsh-moss-root');
  if(root&&root.parentNode)root.parentNode.removeChild(root);
}
}catch(e){}})()`

/* ── 插件主体 ──────────────────────────────────────────────────────────── */

const name = NS
const inject = ['webServer', 'connection']

function resolveWebServer(ctx) {
  try {
    const viaGet = typeof ctx.get === 'function' ? ctx.get('webServer') : undefined
    if (viaGet) return viaGet
  } catch (err) { /* 取不到就当没有 */ }
  return ctx.webServer
}

function hasRoutes(server) {
  return !!server && typeof server.register === 'function' && typeof server.tapIndex === 'function'
}

function apply(ctx) {
  try { collectFacts(ctx) } catch (err) { /* 事实采集失败不影响启动 */ }
  const disposers = []
  const warned = new Set()
  const webServer = resolveWebServer(ctx)

  function warnOnce(key, message) {
    if (warned.has(key)) return
    warned.add(key)
    try { ctx.logger?.warn?.('[' + NS + '] ' + message) } catch (err) { /* noop */ }
  }

  if (!hasRoutes(webServer)) {
    warnOnce('no-webserver',
      '当前 profile 没有可用的 webServer（register/tapIndex）；Host 半侧跳过路由与首屏注入，改由设置页客户端自举。')
    return
  }

  function rejected(req, res) {
    try {
      const conn = (typeof ctx.get === 'function' ? ctx.get('connection') : undefined) || ctx.connection
      if (!conn || typeof conn.requestRejection !== 'function') return false
      const code = conn.requestRejection(req)
      if (code === undefined || code === null || code === false) return false
      res.statusCode = typeof code === 'number' ? code : 403
      res.end()
      return true
    } catch (err) {
      return false
    }
  }

  function registerRoute(route) {
    const inner = route && route.handler
    const wrapped = Object.assign({}, route, {
      handler: async (req, res) => {
        if (rejected(req, res)) return
        return inner(req, res)
      }
    })
    return webServer.register(wrapped)
  }

  function sendJson(res, code, payload) {
    const body = Buffer.from(JSON.stringify(payload), 'utf8')
    res.writeHead(code, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': String(body.length)
    })
    res.end(body)
  }

  function sendText(res, type, text, code = 200) {
    const body = Buffer.from(text, 'utf8')
    res.writeHead(code, {
      'Content-Type': type,
      'Cache-Control': 'no-store',
      'Content-Length': String(body.length)
    })
    res.end(body)
  }

  function readBody(req, limit = 64 * 1024) {
    return new Promise((resolve) => {
      let size = 0
      const chunks = []
      req.on('data', (chunk) => {
        size += chunk.length
        if (size > limit) {
          try { req.destroy?.() } catch (err) { /* noop */ }
          resolve('')
          return
        }
        chunks.push(chunk)
      })
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      req.on('error', () => resolve(''))
    })
  }

  function styleRoute(routePath, reader, what) {
    disposers.push(registerRoute({
      kind: 'exact',
      path: routePath,
      handler: (req, res) => {
        const text = reader()
        if (!text) warnOnce(what, 'lib/' + what + ' 读取失败，本次返回空内容（页面兜底仍生效）。')
        sendText(res, 'text/css; charset=utf-8', text)
      }
    }))
  }

  styleRoute(ROUTE_BASE + '/skin.css', readSkinCss, 'skin.css')
  styleRoute(ROUTE_BASE + '/splash.css', readSplashCss, 'splash.css')

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/splash.js',
    handler: (req, res) => {
      const text = readSplashJs()
      if (!text) warnOnce('splash-js', 'lib/splash.js 读取失败，本次返回空脚本（10.5 秒兜底放行仍生效）。')
      sendText(res, 'application/javascript; charset=utf-8', text)
    }
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/preview',
    handler: (req, res) => {
      const html = readPreviewHtml()
      if (!html) {
        sendText(res, 'text/plain; charset=utf-8', 'preview not found', 404)
        return
      }
      sendText(res, 'text/html; charset=utf-8', html)
    }
  }))

  disposers.push(registerRoute({
    kind: 'prefix',
    path: ROUTE_BASE + '/asset',
    handler: (req, res) => {
      const method = String(req.method || 'GET').toUpperCase()
      if (method !== 'GET' && method !== 'HEAD') {
        res.writeHead(405, { 'Allow': 'GET, HEAD' })
        res.end()
        return
      }
      const prefix = ROUTE_BASE + '/asset/'
      const pathname = String(req.url || '').split('?')[0].split('#')[0]
      if (!pathname.startsWith(prefix)) {
        res.writeHead(404)
        res.end()
        return
      }
      let assetName
      try {
        assetName = decodeURIComponent(pathname.slice(prefix.length))
      } catch (err) {
        res.writeHead(404)
        res.end()
        return
      }
      const hit = resolveAsset(assetName)
      if (!hit) {
        res.writeHead(404)
        res.end()
        return
      }
      let size
      try {
        const st = fs.statSync(hit.file)
        if (!st.isFile()) throw new Error('not a file')
        size = st.size
      } catch (err) {
        res.writeHead(404)
        res.end()
        return
      }

      const rangeHeader = req.headers ? (req.headers.range || req.headers.Range) : ''
      const range = rangeHeader ? parseRange(rangeHeader, size) : null
      if (range && range.invalid) {
        res.writeHead(416, {
          'Content-Type': hit.type,
          'Accept-Ranges': 'bytes',
          'Content-Range': 'bytes */' + size,
          'Content-Length': '0'
        })
        res.end()
        return
      }

      const headOnly = method === 'HEAD'
      const headers = {
        'Content-Type': hit.type,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      }
      if (!range) {
        headers['Content-Length'] = String(size)
        if (headOnly) {
          res.writeHead(200, headers)
          res.end()
          return
        }
        let bytes
        try {
          bytes = fs.readFileSync(hit.file)
        } catch (err) {
          res.writeHead(404)
          res.end()
          return
        }
        res.writeHead(200, headers)
        res.end(bytes)
        return
      }

      let bytes
      try {
        bytes = headOnly ? null : readAssetSlice(hit.file, range.start, range.end)
      } catch (err) {
        res.writeHead(404)
        res.end()
        return
      }
      headers['Content-Range'] = 'bytes ' + range.start + '-' + range.end + '/' + size
      headers['Content-Length'] = String(range.end - range.start + 1)
      res.writeHead(206, headers)
      res.end(bytes === null ? undefined : bytes)
    }
  }))

  disposers.push(registerRoute({
    kind: 'exact',
    path: ROUTE_BASE + '/config',
    handler: async (req, res) => {
      const method = String(req.method || 'GET').toUpperCase()
      if (method === 'GET') {
        sendJson(res, 200, {
          ok: true,
          version: PLUGIN_VERSION,
          config: readConfig(),
          defaults: DEFAULTS,
          facts: factsCache.value || { ready: false },
          file: CONFIG_FILE
        })
        return
      }
      if (method !== 'POST') {
        sendJson(res, 405, { ok: false, error: 'method not allowed' })
        return
      }
      const text = await readBody(req)
      let payload = {}
      try {
        payload = text ? JSON.parse(text) : {}
      } catch (err) {
        sendJson(res, 400, { ok: false, error: 'invalid json' })
        return
      }
      try {
        if (payload && payload.action === 'reset') {
          sendJson(res, 200, {
            ok: true,
            version: PLUGIN_VERSION,
            config: writeConfig(DEFAULTS),
            defaults: DEFAULTS
          })
          return
        }
        const current = readConfig()
        const patch = payload && typeof payload.patch === 'object' && payload.patch ? payload.patch : payload
        sendJson(res, 200, {
          ok: true,
          version: PLUGIN_VERSION,
          config: writeConfig({ ...current, ...patch }),
          defaults: DEFAULTS
        })
      } catch (err) {
        sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })
      }
    }
  }))

  /* 首屏注入：样式 + 容器 + 内联配置/自举 + 启动脚本 */
  disposers.push(webServer.tapIndex((html) => {
    if (typeof html !== 'string' || html.includes(ROUTE_BASE + '/splash.js')) return html
    const facts = factsCache.value || { ready: false }
    const cfg = readConfig()
    const head =
      '<link rel="stylesheet" href="' + ROUTE_BASE + '/skin.css">' +
      '<link rel="stylesheet" href="' + ROUTE_BASE + '/splash.css">' +
      '<style id="dsh-moss2-critical">' + CRITICAL_CSS + '</style>'
    const body =
      '<div id="dsh-moss-root" aria-hidden="true"></div>' +
      '<script>' +
      'window.__DSH_MOSS2_BOOT__="index";' +
      'window.__DSH_MOSS2_VERSION__=' + safeJson(PLUGIN_VERSION) + ';' +
      'window.__DSH_MOSS2_FACTS__=' + safeJson(facts) + ';' +
      'window.__DSH_MOSS2__=' + safeJson(Object.assign({}, cfg, { version: PLUGIN_VERSION, facts })) + ';' +
      BOOTSTRAP_JS + ';' +
      '</script>' +
      '<script defer src="' + ROUTE_BASE + '/splash.js"></script>'

    let out = html
    if (/<\/head>/i.test(out)) out = out.replace(/<\/head>/i, head + '</head>')
    else out = head + out
    if (/<body[^>]*>/i.test(out)) out = out.replace(/<body[^>]*>/i, (tag) => tag + body)
    else if (/<\/body>/i.test(out)) out = out.replace(/<\/body>/i, body + '</body>')
    else out = out + body
    return out
  }))

  ctx.effect(() => () => {
    for (const dispose of disposers) {
      try { dispose() } catch (err) { /* noop */ }
    }
  })
}

export { apply, inject, name, DEFAULTS, normalize }

