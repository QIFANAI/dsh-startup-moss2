/* Client-half + skin static contract smoke test.
 * v0.2 基线 + v0.3 增量 + v0.4 增量 + v0.5 增量（docs/design-spec-v0.5.md §3.2 ambient 交接同步 /
 * enterUI(3000,1250) 分级显影 / FALLBACK_VERSION=0.5.0 / 自举 17000 / skin.css 900–1150ms 显影）。 */
import fs from 'node:fs'
import path from 'node:path'
import {
  ROOT, read, exists, assert, assertEqual, mkTmpHome, loadHost,
  stripComments, extractFunctionBody, extractMediaBlocks
} from './_kit.mjs'

const results = []
function run(name, fn) {
  try { fn(); results.push({ name, pass: true }) } catch (err) {
    results.push({ name, pass: false, err: String(err && err.message ? err.message : err) })
  }
}

const clientSrc = read('lib/client.js')
const clientCode = stripComments(clientSrc)
const tmpHome = mkTmpHome('client')
const host = await loadHost(tmpHome)

run('client syntax', () => {
  // Compiles the whole module body without executing it.
  // eslint-disable-next-line no-new-func
  new Function(clientSrc)
})

run('module loader entry', () => {
  assert(clientSrc.includes('window.__ModuleLoader__.load({'), 'module loader call')
  assert(clientSrc.includes("id: 'dsh-startup-moss2'"), 'plugin id')
  assertEqual((clientSrc.match(/__ModuleLoader__/g) || []).length, 1, 'single loader call')
})

/* ── v0.5 §3.2 版本 / 升级重播 ───────────────────────────────────────────── */
run('v0.5 §3.2 版本：FALLBACK_VERSION=0.5.0 / SPLASH_REV=v0.5-r1 / package.json=0.5.0', () => {
  const pkg = JSON.parse(read('package.json'))
  assert(/var FALLBACK_VERSION = '0\.5\.0'/.test(clientSrc), 'FALLBACK_VERSION 未更新为 0.5.0')
  assert(/var SPLASH_REV = 'v0\.5-r1'/.test(clientSrc), 'SPLASH_REV 未更新为 v0.5-r1')
  assertEqual(pkg.version, '0.5.0', 'package.json version')
})

run('v0.5 §3.2 升级重播标记链路保留（rev 键 / maybeReplayOnUpgrade / replay API / shown+day 旧键）', () => {
  for (const token of ['dsh-startup-moss2:rev', 'revChanged', 'maybeReplayOnUpgrade', '__DSH_MOSS2_REPLAY__', 'dsh-startup-moss2:shown', 'dsh-startup-moss2:day']) {
    assert(clientSrc.includes(token), '缺少升级重播 token: ' + token)
  }
})

run('v0.5 §3.2/§5 client 自举兜底 17000 / watchSplashDone 上限 18000（旧 14000/16000 清零）', () => {
  assert(!/14000/.test(clientCode), 'client 自举兜底不得残留 14000（v0.5 应为 17000）')
  assert(!/16000/.test(clientCode), 'watchSplashDone 上限不得残留 16000（v0.5 应为 18000）')
  assert(/17000/.test(clientCode), '缺少客户端自举兜底 17000')
  assert(/18000/.test(clientCode), 'watchSplashDone 上限必须 18000')
})

/* ── v0.5 §3.2 交接事件：handoff → enterUI(3000, 1250)；done 兜底 enterUI(1400) ── */
const numConsts = {}
for (const m of clientSrc.matchAll(/(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(\d+)\b/g)) numConsts[m[1]] = Number(m[2])
function resolvesTo(arg, want) {
  const a = String(arg).trim()
  if (a === String(want)) return true
  if (numConsts[a] === want) return true
  const m = /^(\d+)$/.exec(a)
  return !!m && Number(m[1]) === want
}
function firstEnterUIAfter(needle, windowLen = 400) {
  const at = clientCode.indexOf(needle)
  if (at < 0) return { found: false, arg: null, via: null }
  const seg = clientCode.slice(at, at + windowLen)
  const direct = /enterUI\(([^)]*)\)/.exec(seg)
  if (direct) return { found: true, arg: direct[1].trim(), via: 'direct' }
  const handler = /(enterUIFromHandoff|enterUIFromDone)\(/.exec(seg)
  if (!handler) return { found: true, arg: null, via: null }
  const body = extractFunctionBody(clientSrc, handler[1]) || ''
  const inner = /enterUI\(([^)]*)\)/.exec(body)
  return { found: true, arg: inner ? inner[1].trim() : null, via: handler[1], body }
}
run('v0.5 §3.2 监听 dsh-moss2:handoff → enterUI(3000, 1250)（从 11.80 起算 base 1250 → 13.05 起跑）', () => {
  const r = firstEnterUIAfter("addEventListener('dsh-moss2:handoff'")
  assert(r.found, '缺少 dsh-moss2:handoff 事件监听')
  assert(/enterUIFromHandoff/.test(clientSrc) || r.arg !== null, 'handoff 监听回调必须调用 enterUI（直接或经 enterUIFromHandoff）')
  const hb = extractFunctionBody(clientSrc, 'enterUIFromHandoff') || ''
  assert(hb.length > 20, 'enterUIFromHandoff 函数体缺失')
  assert(/enterUI\(\s*3000\s*,\s*1250\s*\)/.test(hb), 'enterUIFromHandoff 必须 enterUI(3000, 1250)（SPEC §3.2）')
})
run('v0.5 §3.2 未收到 handoff 时 dsh-moss2:done/fallback 兜底 enterUI(1400)', () => {
  for (const ev of ['dsh-moss2:done', 'dsh-moss2:fallback']) {
    const r = firstEnterUIAfter("addEventListener('" + ev + "'")
    assert(r.found, '缺少 ' + ev + ' 兜底监听')
    assert(r.arg !== null, ev + ' 兜底监听必须调用 enterUI（直接或经 enterUIFromDone）')
    const ok = resolvesTo(r.arg, 1400) || /enterUI\(\s*holdMs\s*\|\|\s*1400|enterUI\(1400/.test(r.body || '')
    assert(ok, ev + ' 兜底 → enterUI holdMs 必须为 1400（实际 ' + r.arg + '）')
  }
})
run('v0.5 §3.2 enterUI(holdMs, baseMs)：class 保留 hold、显影起跑延迟 base 可配', () => {
  const body = extractFunctionBody(clientSrc, 'enterUI')
  assert(body !== null, 'enterUI(holdMs, baseMs) 函数体')
  assert(/holdMs/.test(body), 'enterUI 必须接受 holdMs 参数（分区显影时长）')
  assert(/baseMs/.test(body), 'enterUI 必须接受 baseMs 参数（handoff 起跑延迟 1250ms）')
  assert(/dsh-moss-enter/.test(body), 'enterUI 负责挂 dsh-moss-enter 类')
  assert(/setTimeout|enterTimer/.test(body), 'enterUI 必须定时移除 dsh-moss-enter')
  assert(/3000/.test(clientCode), 'handoff holdMs=3000 必须存在（class 保留到 14.80）')
  assert(/1250/.test(clientCode), 'handoff baseMs=1250 必须存在（11.80+1250 → 13.05 起跑）')
  assert(!/ENTER_HANDOFF_BASE_MS = 620/.test(clientSrc), '旧 ENTER_HANDOFF_BASE_MS=620 必须作废（v0.5 为 1250）')
})

run('FALLBACK config matches host DEFAULTS', () => {
  const at = clientSrc.indexOf('var FALLBACK = {')
  assert(at >= 0, 'FALLBACK found')
  let depth = 0
  let end = -1
  for (let i = at + 'var FALLBACK = '.length; i < clientSrc.length; i += 1) {
    const ch = clientSrc[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) { end = i + 1; break }
    }
  }
  assert(end > 0, 'FALLBACK closes')
  const text = clientSrc.slice(at + 'var FALLBACK = '.length, end)
  // eslint-disable-next-line no-new-func
  const fallback = new Function('return ' + text)()
  assertEqual(JSON.stringify(Object.keys(fallback).sort()), JSON.stringify(Object.keys(host.DEFAULTS).sort()), 'same key set')
  for (const key of Object.keys(host.DEFAULTS)) {
    assertEqual(fallback[key], host.DEFAULTS[key], 'FALLBACK.' + key)
  }
})

run('client contract identifiers (§7)', () => {
  const must = [
    'dsh-moss-ambient',
    'dsh-moss-root',
    'dsh-moss-skin',
    "SKIN_CLASS + '--glass'",
    "SKIN_CLASS + '--immersive'",
    "SKIN_CLASS + '--static'",
    "SKIN_CLASS + '--paused'",
    "SKIN_CLASS + '--noblur'",
    "SKIN_CLASS + '--handoff'",
    "SKIN_CLASS + '--calm'",
    'dsh-moss-enter',
    '--moss-veil',
    '--moss-blur',
    '--moss-clock',
    'ma-still',
    'ma-video',
    'ma-veil',
    'ma-vignette',
    'ma-grain',
    'ma-scan',
    'ma-rim',
    '/dsh-moss2/config',
    "'settings.section'",
    'visibilitychange'
  ]
  for (const token of must) assert(clientSrc.includes(token), 'missing: ' + token)
})

/* ── 运动策略根因修复（v0.2 最高优先级验收项，spec §1 / §7.1） ─────────── */
run('运动策略根因：shouldUseStatic 只看 saver / 视频不可用', () => {
  const body = extractFunctionBody(clientSrc, 'shouldUseStatic')
  assert(body !== null, 'shouldUseStatic 函数未找到（spec §7.1 明确要求该名字的判定）')
  const code = stripComments(body)
  assert(/saver/.test(code), 'shouldUseStatic 必须识别 quality=saver')
  assert(/videoUnavailable|unavailable|失败|error/i.test(code), 'shouldUseStatic 必须识别视频不可用')
  assert(!/prefers-reduced-motion|matchMedia|reducedMotion|reduced/i.test(code),
    'shouldUseStatic 不得引用 prefers-reduced-motion / reducedMotion（v0.1 真机失效根因）')
})

run('运动策略根因：client 代码不读取系统 prefers-reduced-motion 来降级视频', () => {
  assert(!clientCode.includes('prefers-reduced-motion'), 'client 代码（去注释后）不得读取 prefers-reduced-motion')
  assert(/syncPlayback/.test(clientSrc), 'syncPlayback 存在')
  const calmBlock = extractFunctionBody(clientSrc, 'syncPlayback')
  assert(calmBlock !== null, 'syncPlayback 函数体')
  assert(/-calm'|--calm/.test(calmBlock), 'reducedMotion → --calm 装饰降级')
  // --calm 不得停视频：syncPlayback 中 pause() 只能由 saver/static 路径触发，不得出现 reducedMotion 分支
  const calmExcerpt = /reducedMotion[\s\S]{0,300}?pause\(/.test(calmBlock)
  assert(!calmExcerpt, 'reducedMotion 分支不得 pause() 视频')
})

run('交接 API：armHandoff 存在且按真实 duration 取模（不得写死 28）', () => {
  assert(/armHandoff/.test(clientSrc), 'armHandoff')
  const body = extractFunctionBody(clientSrc, 'armHandoff')
  assert(body !== null, 'armHandoff 函数体')
  assert(/%\s*duration|%\s*\(?duration/.test(body), 'armHandoff 必须用 % duration（earth 循环时长以实际文件为准）')
  assert(!/%\s*28\b/.test(clientSrc), '不得写死 28（v0.1 早期的 28s 口径已作废）')
  assert(/typeof .*armHandoff === 'function'|armHandoff:/.test(clientSrc), 'armHandoff 发布到 API')
})
run('v0.5 §3.2 ambient 暂停策略：splashActive 时 pause() + ambientHeld=true，syncPlayback held 不得 play()', () => {
  assert(/ambientHeld/.test(clientSrc), '缺少 ambientHeld 状态变量（SPEC §3.2）')
  assert(/function splashActive\(/.test(clientSrc), 'splashActive() 判定函数必须存在')
  const sync = extractFunctionBody(clientSrc, 'syncPlayback') || ''
  assert(sync.length > 50, 'syncPlayback 函数体缺失')
  assert(/ambientHeld/.test(sync), 'syncPlayback 必须消费 ambientHeld（held 时不得 play）')
  const playGuard = /ambientHeld[\s\S]{0,160}return|if\s*\(\s*ambientHeld\s*\)[\s\S]{0,120}return|!ambientHeld[\s\S]{0,80}play/.test(sync)
  assert(playGuard, 'syncPlayback 在 ambientHeld=true 时必须跳过 playVideo')
  assert(/pause\(\)/.test(clientSrc), '启动层在播必须 pause() ambient 视频')
  assert(/__DSH_MOSS2_AMBIENT_HANDOFF__/.test(clientSrc), '缺少 __DSH_MOSS2_AMBIENT_HANDOFF__ 探针')
  for (const field of ['held', 'armedAt', 'revealIn', 'playAt', 'playedAt', 'ctAtArmed']) {
    assert(new RegExp(field).test(clientSrc), 'ambient 探针字段缺失：' + field)
  }
})
run('v0.5 §3.2 armHandoff(t, opts)：held 时只 seek 保持暂停；revealIn 排期 playVideo', () => {
  const body = extractFunctionBody(clientSrc, 'armHandoff') || ''
  assert(body.length > 50, 'armHandoff 函数体缺失')
  assert(/ambientHeld/.test(body), 'armHandoff 必须处理 ambientHeld（held 时只 seek）')
  assert(/revealIn/.test(body) || /revealIn/.test(clientCode), 'armHandoff 必须消费 opts.revealIn（SPEC §3.3）')
  const schedules = /setTimeout[\s\S]{0,160}revealIn|revealIn[\s\S]{0,120}setTimeout/.test(body) || /schedulePlay[\s\S]{0,200}revealIn/.test(body)
  assert(schedules, 'revealIn 必须排期播放（setTimeout/schedulePlay，revealIn*1000）')
  assert(/playVideo/.test(body) || /playVideo/.test(clientCode), '排期必须最终 playVideo()')
  assert(/1500/.test(body) || /1500/.test(clientCode), '--handoff class 1500ms 后移除（v0.4 行为保留）')
})
run('v0.5 §3.2 兜底四路径：done/fallback/watchSplashDone 判定/15.5s 定时器 → ambientHeld=false + playVideo()', () => {
  assert(/15\.5|15500/.test(clientCode), '缺少 15.5s 兜底定时器（SPEC §3.2.4）')
  for (const ev of ['dsh-moss2:done', 'dsh-moss2:fallback']) {
    assert(new RegExp(ev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(clientSrc), '缺少 ' + ev + ' 兜底监听')
  }
  const doneBody = extractFunctionBody(clientSrc, 'enterUIFromDone') || ''
  assert(/ambientHeld/.test(doneBody) || /ambientHeld/.test(clientCode), 'done 兜底路径必须复位 ambientHeld')
  assert(/playVideo/.test(clientCode), '兜底必须调用 playVideo()')
  assert(/watchSplashDone/.test(clientSrc), 'watchSplashDone 判定结束路径保留')
})
run('v0.5 §3.2 handoff 事件排期播放：按 detail.revealAt 与 performance.now() 差值排期', () => {
  const at = clientCode.indexOf("addEventListener('dsh-moss2:handoff'")
  const seg = at >= 0 ? clientCode.slice(at, at + 700) : ''
  assert(seg.length > 50, 'handoff 监听回调缺失')
  assert(/revealAt/.test(seg) || /revealAt/.test(clientCode), '必须消费 detail.revealAt（SPEC §3.2.3）')
  assert(/performance\.now/.test(seg) || /performance\.now/.test(clientCode), '必须按 performance.now() 差值排期')
})
run('v0.5 §5 无启动层行为不变：splashActive()=false 时常规播放（不进入 held）', () => {
  const body = extractFunctionBody(clientSrc, 'splashActive') || ''
  assert(body.length > 20, 'splashActive() 函数体缺失')
  assert(/dsh-moss-root|querySelector|getElementById|root/.test(body), 'splashActive 必须按启动层根节点判定')
  assert(/ambientHeld\s*=\s*false/.test(clientCode), '无启动层/兜底必须复位 ambientHeld=false')
})

run('品牌位冲突修复：try/catch + priority 降级 + warn 一次（不得未捕获异常）', () => {
  for (const token of ['sidebar.brand.mark', 'conversation.hero.brand.mark', 'injectSlotSafely', 'occupiedPriority', 'warnOnce', 'priority']) {
    assert(clientSrc.includes(token), 'missing: ' + token)
  }
  const reg = extractFunctionBody(clientSrc, 'registerSlotSafely')
  assert(reg !== null, 'registerSlotSafely 函数体')
  assert(/try\s*\{/.test(reg) && /catch\s*\(/.test(reg), 'registerSlotSafely 必须有 try/catch')
  assert(/warnOnce/.test(reg), '失败时 warnOnce（只警告一次）')
  assert(/-1|priority\s*-|priority = occupied/.test(reg), 'priority 逐级 shadow 重试')
})

run('client asset paths are host-whitelisted (v0.2/v0.5)', () => {
  const referenced = [
    'earth/earth-poster.webp',
    'earth/earth-poster.jpg',
    'earth/earth-1080.mp4',
    'earth/earth-720.mp4'
  ]
  for (const rel of referenced) {
    assert(clientSrc.includes(rel), 'client references ' + rel)
    const hostSrc = read('lib/index.js')
    assert(hostSrc.includes(rel), 'host whitelists ' + rel)
  }
  /* v0.5 §4：宿主白名单必须登记 arm-sfx 音频（client 不直接引用，但宿主路由合约包含） */
  const hostSrc = read('lib/index.js')
  assert(/audio\/moss-arm-sfx\.m4a/.test(hostSrc), 'host ASSET_TYPES 必须登记 audio/moss-arm-sfx.m4a')
  for (const retired of ['moss-eye-720.mp4', 'moss-eye-poster.webp']) {
    assert(!clientSrc.includes(retired), 'client 不得引用 v0.1 废弃资产：' + retired)
  }
})

run('client does not hardcode host facts', () => {
  for (const bad of ['dsh-open', 'deepseek-chat', 'PROFILE dsh', 'workspace=dsh']) {
    assert(!clientSrc.includes(bad), 'hardcoded fact: ' + bad)
  }
})

run('设置项文案：减弱装饰动效（不影响视频背景）', () => {
  assert(clientSrc.includes('减弱装饰动效（不影响视频背景）'), 'reducedMotion 文案未按 spec §7.7 更新')
})

/* ── skin.css ─────────────────────────────────────────────────────────── */

const skinPath = path.join(ROOT, 'lib', 'skin.css')
const skin = exists('lib/skin.css') ? read('lib/skin.css') : ''

run('skin.css exists and is non-trivial', () => {
  assert(skin.length > 30000, 'skin.css too small: ' + skin.length)
})

run('skin.css braces balanced', () => {
  let depth = 0
  let inComment = false
  for (let i = 0; i < skin.length; i += 1) {
    const two = skin.slice(i, i + 2)
    if (!inComment && two === '/*') { inComment = true; i += 1; continue }
    if (inComment && two === '*/') { inComment = false; i += 1; continue }
    if (inComment) continue
    const ch = skin[i]
    if (ch === '{') depth += 1
    else if (ch === '}') { depth -= 1; if (depth < 0) throw new Error('unexpected } at ' + i) }
  }
  assertEqual(depth, 0, 'brace depth')
})

run('skin.css scope root', () => {
  assert(skin.includes('html.dsh-moss-skin'), 'scope root')
  const selectors = []
  let depth = 0
  let buf = ''
  let inComment = false
  for (let i = 0; i < skin.length; i += 1) {
    const two = skin.slice(i, i + 2)
    if (!inComment && two === '/*') { inComment = true; i += 1; continue }
    if (inComment && two === '*/') { inComment = false; i += 1; continue }
    if (inComment) continue
    const ch = skin[i]
    if (ch === '{') {
      if (depth === 0) selectors.push(buf.trim())
      depth += 1
      buf = ''
    } else if (ch === '}') {
      depth -= 1
      buf = ''
    } else if (depth === 0) {
      buf += ch
    }
  }
  const allowed = (sel) => {
    const s = sel.replace(/\s+/g, ' ').trim()
    if (!s) return true
    if (s.startsWith('@')) return true
    if (/^html\.dsh-moss-skin/.test(s)) return true
    if (/^html\.dsh-moss-motion-hint/.test(s)) return true
    if (/^:root$/.test(s)) return true
    if (/^from$|^to$|^\d+%$/.test(s)) return true
    return false
  }
  const bad = selectors.filter((sel) => !allowed(sel))
  assertEqual(bad.length, 0, 'unscoped selectors: ' + bad.slice(0, 5).join(' | '))
})

run('skin.css ambient video contract (§7.2/§7.3)', () => {
  for (const token of [
    '#dsh-moss-ambient',
    '.ma-still', '.ma-video', '.ma-veil', '.ma-vignette', '.ma-grain', '.ma-scan', '.ma-rim',
    'object-fit:cover', 'object-fit: cover', 'backdrop-filter', '--moss-veil', '--moss-blur'
  ]) assert(skin.includes(token), 'missing: ' + token)
  assert(/\.ma-video[^{]*\{[^}]*object-fit\s*:\s*cover/.test(skin), 'ma-video must use object-fit cover')
  assert(/\.ma-video[^{]*\{[^}]*object-position\s*:\s*50%\s+50%/.test(skin), 'ma-video object-position 50% 50%')
  assert(/\.ma-video[^{]*\{[^}]*transform\s*:\s*scale\(1\.12\)/.test(skin), 'ma-video transform scale(1.12) 基准帧')
  assert(/moss-bg-drift/.test(skin), '极慢镜头漂移动画 moss-bg-drift')
  assert(/animation\s*:\s*moss-bg-drift\s+44s\s+ease-in-out\s+infinite\s+alternate/.test(skin), 'moss-bg-drift 44s ease-in-out infinite alternate')
  assert(/@keyframes\s+moss-bg-drift/.test(skin), 'moss-bg-drift keyframes')
})

run('skin.css 系统 reduce 不得停视频/漂移（v0.1 真机失效根因）', () => {
  const blocks = extractMediaBlocks(skin, 'prefers-reduced-motion')
  for (const block of blocks) {
    assert(!/\.ma-video[^{]*\{[^}]*(display\s*:\s*none|opacity\s*:\s*0\b|visibility\s*:\s*hidden)/.test(block),
      'prefers-reduced-motion 块不得隐藏 .ma-video（v0.1 真机「背景不动」根因）')
    assert(!/moss-bg-drift/.test(block), '系统 reduce 不得停 moss-bg-drift（spec §7.3）')
  }
  // --calm 允许停漂移，但不得停视频本身（display/opacity/visibility 不动）
  const calmRules = [...skin.matchAll(/html\.dsh-moss-skin--calm[^{]*\.ma-video[^{]*\{([^}]*)\}/g)].map((m) => m[1])
  for (const rule of calmRules) {
    assert(!/(display\s*:\s*none|opacity\s*:\s*0\b|visibility\s*:\s*hidden)/.test(rule), '--calm 不得隐藏视频')
  }
})

run('skin.css tier + fallback classes (§7)', () => {
  for (const token of [
    'dsh-moss-skin--glass',
    'dsh-moss-skin--immersive',
    'dsh-moss-skin--static',
    'dsh-moss-skin--paused',
    'dsh-moss-skin--noblur',
    'dsh-moss-skin--handoff',
    'dsh-moss-skin--calm',
    'dsh-moss-enter'
  ]) assert(skin.includes(token), 'missing: ' + token)
})

run('skin.css #root z-index 契约', () => {
  assert(/#root[^{]*\{[^}]*z-index\s*:\s*1\b/.test(skin), '#root z-index:1（背景层之下、UI 之上）')
})

run('skin.css palette + tokens', () => {
  for (const token of ['--m-void', '--m-white', '--m-earth', '--m-plasma', '--m-moss', '--m-steel', '--m-line', '--m-glass']) {
    assert(skin.includes(token), 'palette var missing: ' + token)
  }
  for (const token of ['--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2', '--dsw-alias-bg-layer-3', '--dsw-specific-sidebar-fill', '--dsw-alias-label-primary']) {
    assert(skin.includes(token), 'host token override missing: ' + token)
  }
})

run('skin.css no layout tampering', () => {
  assert(!/#root\s*\{[^}]*(position\s*:\s*fixed)/.test(skin), '#root must not become fixed')
  const importantLayout = skin.match(/(?:^|[;{\s])(width|height|padding|margin|font-size|line-height|font-family)\s*:[^;}]*!important/g)
  assert(!importantLayout, 'layout/typography forced: ' + (importantLayout || []).slice(0, 3).join(','))
})

run('skin.css overlay safety', () => {
  const fixedRules = skin.match(/position\s*:\s*fixed/g) || []
  assert(fixedRules.length <= 12, 'too many fixed layers: ' + fixedRules.length)
  assert(skin.includes('pointer-events:none') || skin.includes('pointer-events: none'), 'decorations must set pointer-events:none')
})

const failed = results.filter((r) => !r.pass)
// eslint-disable-next-line no-undef
for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' — ' + r.err))
try { fs.rmSync(tmpHome, { recursive: true, force: true }) } catch {}
console.log(`\n${results.length - failed.length}/${results.length} client/skin checks passed`)
if (failed.length) process.exit(1)
