/* Host-half smoke test (v0.5 契约): manifest/config normalize/routes/asset whitelist/index injection/17000. */
import fs from 'node:fs'
import path from 'node:path'
import {
  ROOT, assert, assertEqual, mkTmpHome, loadHost, mockCtx, findRoute, callRoute, read
} from './_kit.mjs'

const results = []
function ok(name) { results.push({ name, pass: true }) }
function run(name, fn) {
  try {
    fn()
    ok(name)
  } catch (err) {
    results.push({ name, pass: false, err: String(err && err.message ? err.message : err) })
  }
}

const tmpHome = mkTmpHome('host')
const mod = await loadHost(tmpHome)

/* v0.5 资产白名单（docs/design-spec-v0.5.md §2.1/§4.2；moss-eye 已废弃） */
const ASSETS = [
  ['earth/earth-1080.mp4', 'video/mp4'],
  ['earth/earth-720.mp4', 'video/mp4'],
  ['audio/moss-arm-sfx.m4a', 'audio/mp4'],
  ['earth/earth-poster.webp', 'image/webp'],
  ['earth/earth-poster.jpg', 'image/jpeg'],
  ['neuro/neuro-boot-1080.mp4', 'video/mp4'],
  ['neuro/neuro-boot-720.mp4', 'video/mp4'],
  ['neuro/neuro-boot-poster.webp', 'image/webp'],
  ['moss/moss-cinema-1080.mp4', 'video/mp4'],
  ['moss/moss-cinema-720.mp4', 'video/mp4'],
  ['moss/moss-cinema-poster.webp', 'image/webp'],
  ['fonts/jetbrains-mono-400.woff2', 'font/woff2'],
  ['fonts/jetbrains-mono-500.woff2', 'font/woff2'],
  ['manifest.json', 'application/json']
]
const RETIRED_ASSETS = ['moss/moss-eye-720.mp4', 'moss/moss-eye-poster.webp']

run('module exports', () => {
  assertEqual(mod.name, 'dsh-startup-moss2', 'name')
  assert(Array.isArray(mod.inject) && mod.inject.includes('webServer'), 'inject webServer')
  assert(typeof mod.apply === 'function', 'apply')
})

run('defaults match design spec §8 (11 keys, 不新增字段)', () => {
  const D = mod.DEFAULTS
  assertEqual(D.enabled, true, 'enabled')
  assertEqual(D.mode, 'session', 'mode')
  assertEqual(D.skin, 'glass', 'skin')
  assertEqual(D.quality, 'standard', 'quality')
  assertEqual(D.veil, 58, 'veil')
  assertEqual(D.blur, 16, 'blur')
  assertEqual(D.hud, 'normal', 'hud')
  assertEqual(D.sound, true, 'sound')
  assertEqual(D.volume, 50, 'volume')
  assertEqual(D.allowSkip, true, 'allowSkip')
  assertEqual(D.reducedMotion, false, 'reducedMotion')
  assertEqual(Object.keys(D).length, 11, 'key count')
})

run('normalize clamps and rejects', () => {
  const n = mod.normalize
  assertEqual(n({ mode: 'nope' }).mode, 'session', 'bad enum falls back')
  assertEqual(n({ veil: 999 }).veil, 100, 'veil clamps high')
  assertEqual(n({ veil: -5 }).veil, 0, 'veil clamps low')
  assertEqual(n({ blur: 999 }).blur, 40, 'blur clamps high')
  assertEqual(n({ volume: 12.6 }).volume, 13, 'volume rounds')
  assertEqual(n({ sound: 'false' }).sound, false, '"false" -> false')
  assertEqual(n({ sound: 0 }).sound, false, '0 -> false')
  assertEqual(n({ skin: 'immersive' }).skin, 'immersive', 'valid enum keeps')
  assertEqual(n({ quality: 'saver' }).quality, 'saver', 'quality enum')
  assertEqual(n({ hud: 'full' }).hud, 'full', 'hud enum')
  assertEqual(n({ extra: 1 }).extra, undefined, 'unknown key dropped')
})

const ctx = mockCtx()
mod.apply(ctx)

run('routes registered (v0.2 路由集合不变)', () => {
  const paths = ctx._routes.map((r) => r.path).sort()
  const want = [
    '/dsh-moss2/asset',
    '/dsh-moss2/config',
    '/dsh-moss2/preview',
    '/dsh-moss2/skin.css',
    '/dsh-moss2/splash.css',
    '/dsh-moss2/splash.js'
  ]
  assertEqual(JSON.stringify(paths), JSON.stringify(want), 'route paths')
  assertEqual(findRoute(ctx._routes, '/dsh-moss2/asset').kind, 'prefix', 'asset route kind')
})

run('tapIndex registered', () => {
  assertEqual(ctx._taps.length, 1, 'one tap')
})

const sampleHtml = '<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>x</title></head><body><div id="root"></div></body></html>'
const injected = ctx._taps[0](sampleHtml)

run('index injection (首屏容器/样式/配置/自举)', () => {
  assert(injected.includes('href="/dsh-moss2/skin.css"'), 'skin.css link')
  assert(injected.includes('href="/dsh-moss2/splash.css"'), 'splash.css link')
  assert(injected.includes('id="dsh-moss-root"'), 'splash root')
  assert(injected.includes('src="/dsh-moss2/splash.js"'), 'splash script')
  assert(injected.includes('window.__DSH_MOSS2__'), 'inline config')
  assert(injected.includes('window.__DSH_MOSS2_FACTS__'), 'inline facts')
  assert(injected.includes('"skin":"glass"'), 'config payload has skin')
  assert(injected.includes('dsh-moss2-critical'), 'critical css')
  assert(injected.indexOf('dsh-moss-root') < injected.indexOf('<div id="root">'), 'splash root before app root')
  assert(injected.includes('moss-lock'), 'bootstrap lock class')
  assert(injected.includes('dsh-moss-ambient'), 'bootstrap ambient')
  assert(injected.includes('__DSH_MOSS2_SPLASH__'), 'splash-decision global')
  assert(injected.includes('__DSH_MOSS2_SKIP__'), 'skip global')
  assert(injected.includes('"0.5.0"'), 'plugin version 0.5.0 in injected payload')
  assert(injected.includes('17000'), 'v0.5 §5：BOOTSTRAP 自举兜底必须 17000')
  assert(!/},\s*14000\)/.test(injected), '自举兜底不得残留 14000')
})
run('v0.5 §5 三层兜底一致：index.js BOOTSTRAP 17000 / splash HARD_STOP 17000 / client 17000', () => {
  const hostSrc = read('lib/index.js')
  const splashSrc = read('lib/splash.js')
  const clientSrc = read('lib/client.js')
  assert(/17000/.test(hostSrc), 'index.js BOOTSTRAP 必须 17000')
  assert(/HARD_STOP_MS\s*=\s*17000/.test(splashSrc), 'splash.js HARD_STOP_MS 必须 17000')
  assert(/17000/.test(clientSrc), 'client 自举兜底必须 17000')
})

run('index injection is idempotent', () => {
  const again = ctx._taps[0](injected)
  assertEqual(again, injected, 'second tap returns input untouched')
})

{
  const route = findRoute(ctx._routes, '/dsh-moss2/config')
  const res = await callRoute(route, { method: 'GET' })
  run('GET /config payload', () => {
    assertEqual(res.statusCode, 200, 'status')
    const payload = res.json()
    assertEqual(payload.ok, true, 'ok')
    assertEqual(payload.config.skin, 'glass', 'config.skin')
    assertEqual(payload.defaults.veil, 58, 'defaults.veil')
    assertEqual(payload.version, '0.5.0', 'version 0.5.0')
    assert(payload.file.startsWith(tmpHome), 'config file lives in DSH_HOME')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/config')
  const res = await callRoute(route, {
    method: 'POST',
    body: JSON.stringify({ patch: { skin: 'immersive', veil: 77, quality: 'high' } })
  })
  run('POST /config patch persists', () => {
    assertEqual(res.statusCode, 200, 'status')
    const payload = res.json()
    assertEqual(payload.config.skin, 'immersive', 'skin merged')
    assertEqual(payload.config.veil, 77, 'veil merged')
    assertEqual(payload.config.quality, 'high', 'quality merged')
    assertEqual(payload.config.blur, 16, 'untouched key keeps default')
    const onDisk = JSON.parse(fs.readFileSync(path.join(tmpHome, 'dsh-startup-moss2.json'), 'utf8'))
    assertEqual(onDisk.skin, 'immersive', 'written atomically to disk')
    assertEqual(onDisk.veil, 77, 'disk veil')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/config')
  const res = await callRoute(route, { method: 'POST', body: JSON.stringify({ action: 'reset' }) })
  run('POST /config reset', () => {
    const payload = res.json()
    assertEqual(payload.config.skin, 'glass', 'reset skin')
    assertEqual(payload.config.veil, 58, 'reset veil')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/config')
  const res = await callRoute(route, { method: 'POST', body: '{bad json' })
  run('POST /config rejects bad json', () => {
    assertEqual(res.statusCode, 400, 'status 400')
    assertEqual(res.json().ok, false, 'ok false')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/config')
  const res = await callRoute(route, { method: 'DELETE' })
  run('config rejects unsupported method', () => {
    assertEqual(res.statusCode, 405, 'status 405')
  })
}

/* static routes: serve on-disk text (skin.css / splash.css / splash.js / preview) */
for (const [routePath, type, minLen] of [
  ['/dsh-moss2/skin.css', 'text/css', 20000],
  ['/dsh-moss2/splash.css', 'text/css', 10000],
  ['/dsh-moss2/splash.js', 'application/javascript', 20000],
  ['/dsh-moss2/preview', 'text/html', 5000]
]) {
  const route = findRoute(ctx._routes, routePath)
  const res = await callRoute(route, { method: 'GET' })
  run('GET ' + routePath, () => {
    assertEqual(res.statusCode, 200, 'status')
    assert(String(res.headers['Content-Type'] || '').includes(type), 'content type ' + type)
    assert(res.text().length > minLen, 'content length')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/asset')
  const res = await callRoute(route, { method: 'GET', url: '/dsh-moss2/asset/../package.json' })
  run('asset path traversal blocked', () => {
    assertEqual(res.statusCode, 404, 'nested path 404')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/asset')
  const res = await callRoute(route, { method: 'GET', url: '/dsh-moss2/asset/unknown.bin' })
  run('asset whitelist blocks unknown file', () => {
    assertEqual(res.statusCode, 404, 'unknown 404')
  })
}

/* v0.2 asset whitelist：13 件全部 200，旧 moss-eye 必须 404 */
for (const [rel, mime] of ASSETS) {
  const route = findRoute(ctx._routes, '/dsh-moss2/asset')
  const res = await callRoute(route, { method: 'GET', url: '/dsh-moss2/asset/' + rel })
  run('asset whitelisted: ' + rel, () => {
    assertEqual(res.statusCode, 200, 'status')
    assert(String(res.headers['Content-Type'] || '').includes(mime), 'content type ' + mime)
    const abs = path.join(ROOT, 'lib', 'assets', rel)
    assertEqual(Number(res.headers['Content-Length']), fs.statSync(abs).size, 'content length')
  })
}
for (const rel of RETIRED_ASSETS) {
  const route = findRoute(ctx._routes, '/dsh-moss2/asset')
  const res = await callRoute(route, { method: 'GET', url: '/dsh-moss2/asset/' + rel })
  run('retired asset rejected: ' + rel, () => {
    assertEqual(res.statusCode, 404, 'v0.1 废弃资产不得再进白名单')
  })
}

{
  const route = findRoute(ctx._routes, '/dsh-moss2/asset')
  const res = await callRoute(route, {
    method: 'GET',
    url: '/dsh-moss2/asset/earth/earth-1080.mp4',
    headers: { range: 'bytes=0-15' }
  })
  run('asset range request (mp4 播放 seek 依赖)', () => {
    assertEqual(res.statusCode, 206, 'status 206')
    assert(String(res.headers['Content-Range']).startsWith('bytes 0-15/'), 'content-range')
    assertEqual(res.chunks[0].length, 16, 'payload length')
  })
}

run('no webServer degrades gracefully', () => {
  const bare = { get: () => undefined, effect: () => {}, logger: { warn: () => {} } }
  mod.apply(bare)
  assertEqual(true, true, 'no throw')
})

/* ── report ─────────────────────────────────────────────────────────── */
const failed = results.filter((r) => !r.pass)
for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' — ' + r.err))
try { fs.rmSync(tmpHome, { recursive: true, force: true }) } catch {}
console.log(`\n${results.length - failed.length}/${results.length} host checks passed`)
if (failed.length) process.exit(1)
