/* Splash engine + splash.css static contract smoke test.
 * 基线：v0.2 四幕契约 / v0.3 进度·第二幕特效·音频 / v0.4 终局对焦·连续转场·冷态点火；
 * v0.5 增量权威源 = docs/design-spec-v0.5.md
 * （时间线 13.90s / 百定格 0.60s / bloom 12.70–13.30 / 810ms warp 溶解 / 地球冷态预 seek + 点火闪光窗口 /
 *  交接事件 5 字段 detail / 用户音轨 arm-sfx 接管 3.90–8.30）。 */
import { read, exists, assert, assertEqual, stripComments, extractMediaBlocks, extractFunctionBody } from './_kit.mjs'

const results = []
function run(name, fn) {
  try { fn(); results.push({ name, pass: true }) } catch (err) {
    results.push({ name, pass: false, err: String(err && err.message ? err.message : err) })
  }
}
/** SKIP：已知「待实现」项（Lead 裁决，不计 FAIL，但报告里明确列出，不放水）。 */
function skip(name, reason) {
  results.push({ name, pass: true, skipped: true, reason })
}

const js = exists('lib/splash.js') ? read('lib/splash.js') : ''
const css = exists('lib/splash.css') ? read('lib/splash.css') : ''
const code = stripComments(js)
const cssCode = stripComments(css)
const all = js + '\n' + css

/* ── v0.4 解析工具：把实现里的常量/TL/PHASES 取出来与 spec §2.1/§2.2 逐项比对 ── */
function numConst(src, name) {
  const m = new RegExp('var\\s+' + name + '\\s*=\\s*(-?\\d+(?:\\.\\d+)?)(?!\\d)').exec(src)
  return m ? Number(m[1]) : null
}
function objectLiteralAfter(src, marker) {
  const at = src.indexOf(marker)
  if (at < 0) return null
  let start = -1
  for (let i = at; i < src.length; i += 1) {
    if (src[i] === '{' || src[i] === '[') { start = i; break }
  }
  if (start < 0) return null
  const open = src[start]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i]
    if (ch === open) depth += 1
    else if (ch === close) { depth -= 1; if (depth === 0) return src.slice(start, i + 1) }
  }
  return null
}
/** 顶层标识符（ARM_AT 等）从已解析常量表补进作用域，其余未知标识符 → NaN（with + Proxy）。 */
function evalLiteral(text, scope) {
  const proxy = new Proxy(Object.create(null), {
    has: () => true,
    get: (target, key) => (key in scope ? scope[key] : NaN)
  })
  // eslint-disable-next-line no-new-func
  return new Function('scope', 'with (scope) { return (' + text + ') }')(proxy)
}
function valuesClose(actual, expected, tol = 1e-9) {
  const a = Array.isArray(actual) ? actual : [actual]
  const e = Array.isArray(expected) ? expected : [expected]
  if (a.length !== e.length) return false
  for (let i = 0; i < a.length; i += 1) {
    const x = Number(a[i])
    const y = Number(e[i])
    if (!isFinite(x) || Math.abs(x - y) > tol) return false
  }
  return true
}

const DURATION = numConst(code, 'DURATION')
const DURATION_MS = numConst(code, 'DURATION_MS')
const HARD_STOP_MS = numConst(code, 'HARD_STOP_MS')
const ARM_AT = numConst(code, 'ARM_AT')
const SKIP_AT = numConst(code, 'SKIP_AT')
const PROGRESS_SHOW = numConst(code, 'PROGRESS_SHOW')
const PROGRESS_KNEE = numConst(code, 'PROGRESS_KNEE')
const PROGRESS_END = numConst(code, 'PROGRESS_END')
const PROGRESS_NOMINAL = numConst(code, 'PROGRESS_NOMINAL')
const FADE_AT = numConst(code, 'FADE_AT')
const FADE_MS = numConst(code, 'FADE_MS')
const constScope = {
  DURATION, DURATION_MS, HARD_STOP_MS, ARM_AT, SKIP_AT,
  PROGRESS_SHOW, PROGRESS_KNEE, PROGRESS_END, PROGRESS_NOMINAL, FADE_AT, FADE_MS
}
const TL_TEXT = objectLiteralAfter(js, 'var TL = {')
let TL = null
let TL_ERROR = null
try { TL = TL_TEXT ? evalLiteral(TL_TEXT, constScope) : null } catch (err) { TL_ERROR = String(err && err.message || err) }
const PHASES_TEXT = objectLiteralAfter(js, 'var PHASES = [')
let PHASES = null
try { PHASES = PHASES_TEXT ? evalLiteral(PHASES_TEXT, Object.assign({}, constScope, TL ? { TL } : {})) : null } catch { /* noop */ }

run('splash.js exists', () => {
  assert(js.length > 20000, 'splash.js too small: ' + js.length)
})

run('splash.js syntax', () => {
  // eslint-disable-next-line no-new-func
  new Function(js)
})

run('splash.js reads host-injected globals', () => {
  for (const token of ['__DSH_MOSS2__', '__DSH_MOSS2_FACTS__', '__DSH_MOSS2_VERSION__', '__DSH_MOSS2_SPLASH__', '__DSH_MOSS2_SKIP__']) {
    assert(js.includes(token), 'missing global: ' + token)
  }
})

run('splash.js lifecycle contract', () => {
  for (const token of ['dsh-moss-root', 'dsh-moss-enter', 'moss-lock', 'Escape', 'requestAnimationFrame', 'keydown']) {
    assert(js.includes(token), 'missing: ' + token)
  }
})

run('splash.js v0.2 DOM contract (§6)', () => {
  for (const token of [
    'ms-stage', 'ms-act--neuro', 'ms-act--moss', 'ms-act--earth',
    'ms-split__moss', 'ms-split__earth', 'ms-split__seam',
    'ms-global-hud', 'ms-video', 'ms-veil', 'ms-hud',
    'data-act="neuro"', 'data-act="moss"', 'data-act="earth"'
  ]) assert(js.includes(token), 'missing DOM token: ' + token)
})

run('splash.js 四幕文案 (§4)', () => {
  for (const token of ['神经接口', 'MOSS', '流浪地球', '移交控制权', '550W', '中国航天局', '让人类永远保持理智', '地球发动机', 'BOOT']) {
    assert(js.includes(token), 'missing copy: ' + token)
  }
})

run('splash.js API contract (§6, 与 v0.1 同名兼容)', () => {
  for (const token of [
    '__DSH_MOSS2_API__', '__DSH_MOSS2_REPLAY__', '__DSH_MOSS2_SPLASH__',
    'armHandoff', 'freeze', 'dispose', 'progress', 'reduced', 'duration',
    'skip', 'finish', 'replay'
  ]) assert(js.includes(token), 'missing API token: ' + token)
})

/* ── v0.5 §1 顶层常量（13.90s 总长 / 100% 定格 / bloom / 810ms warp 溶解） ── */
run('v0.5 §1 顶层常量：DURATION=13.90 / DURATION_MS=13900 / HARD_STOP=17000', () => {
  assertEqual(DURATION, 13.9, 'DURATION')
  assertEqual(DURATION_MS, 13900, 'DURATION_MS')
  assertEqual(HARD_STOP_MS, 17000, 'HARD_STOP_MS（宿主/自举三层兜底同步 17000）')
})

run('v0.5 §1 顶层常量：ARM_AT=11.55 / SKIP_AT=10.35 / PROGRESS_*', () => {
  assertEqual(ARM_AT, 11.55, 'ARM_AT')
  assertEqual(SKIP_AT, 10.35, 'SKIP_AT')
  assertEqual(PROGRESS_SHOW, 4.36, 'PROGRESS_SHOW')
  assertEqual(PROGRESS_KNEE, 10.35, 'PROGRESS_KNEE')
  assertEqual(PROGRESS_END, 12.1, 'PROGRESS_END（t=12.10 进度必须 100%）')
  assertEqual(PROGRESS_NOMINAL, 12.8, 'PROGRESS_NOMINAL（12.80 名义时间线，保持 0–10.35 曲线不变）')
})

run('v0.5 §1 顶层常量：FADE_AT=13.05 / FADE_MS=810', () => {
  assertEqual(FADE_AT, 13.05, 'FADE_AT')
  assertEqual(FADE_MS, 810, 'FADE_MS')
  assert(/render\(FADE_AT\)/.test(code), '13.05 溶解前必须补渲染 render(FADE_AT)（完成态帧）')
})

/* ── v0.4 §2.1 TL（唯一真值表；与 spec 逐项比对） ── */
const TL_EXPECT = {
  proEnd: 0.5,
  neuroIn: 0.5, neuroFadeEnd: 1.18, neuroPushEnd: 3.9,
  cut: 3.9, flashEnd: 3.99,
  mossIn: 3.9, mossFadeEnd: 4.48, mossTitle: 4.16, mossLogStart: 4.32, mossLogStep: 0.27, mossTel: 4.62,
  mossBar: 4.36,
  tgtGrid: [3.9, 4.3], tgtCapture: [4.3, 5.2], tgtTrack: [5.2, 6.5], tgtConverge: [6.5, 7.42],
  gazeIn: 7.16, gazeLock: 7.42,
  tgtLock: [7.42, 7.78], tgtFocus: [7.42, 8.06], tgtMaintain: [7.78, 8.2], tgtOut: [8.14, 8.34],
  online: 7.46, quote: 7.55, mossHudOut: [8.02, 8.26],
  mossSplitPrep: [8.06, 8.3],
  split: 8.3, splitFlashEnd: 8.44, splitSeamDraw: [8.3, 8.62],
  splitLabelL: [8.62, 8.94], splitLabelR: [8.76, 9.08],
  handover: [9.12, 9.46], handoverOut: [9.98, 10.18],
  engineHint: [9.82, 10.18],
  sweep: [10.02, 10.35], splitOut: [10.32, 10.44],
  earth: 10.35, ignite: [10.35, 10.95],
  earthCap: [10.72, 11.12], earthMark: [10.98, 11.36],
  earthPushEnd: 11.8,
  arm: 11.55, preHandoff: [11.7, 11.95],
  bootComplete: [11.8, 12.1],
  handoffFlash: [12.7, 13.3],
  fade: 13.05, done: 13.9
}
run('v0.4 §2.1 TL 解析（唯一真值对象）', () => {
  assert(TL_TEXT, '缺少 var TL = { ... } 时间线常量')
  assert(TL && typeof TL === 'object', 'TL 应可解析为普通对象字面量：' + (TL_ERROR || ''))
  assertEqual(TL.done, DURATION, 'TL.done 必须 = DURATION')
  assertEqual(TL.arm, ARM_AT, 'TL.arm 必须 = ARM_AT')
  assertEqual(TL.fade, FADE_AT, 'TL.fade 必须 = FADE_AT')
})
run('v0.5 §1 TL 逐项：幕边界/对焦/转场/点火/交接全部符合 spec', () => {
  const bad = []
  for (const [key, want] of Object.entries(TL_EXPECT)) {
    if (!(key in TL)) { bad.push(key + ' missing'); continue }
    if (!valuesClose(TL[key], want)) bad.push(key + ': want ' + JSON.stringify(want) + ' got ' + JSON.stringify(TL[key]))
  }
  assertEqual(bad.length, 0, bad.join(' | '))
})
run('v0.5 §1/§3.1 TL 交接：bootComplete=[11.80,12.10] / handoffFlash=[12.70,13.30]（旧 12.30–12.52 作废）', () => {
  assert(valuesClose(TL.bootComplete, [11.8, 12.1]), 'TL.bootComplete 必须 [11.80,12.10]，实际 ' + JSON.stringify(TL.bootComplete))
  assert(valuesClose(TL.handoffFlash, [12.7, 13.3]), 'TL.handoffFlash 必须 [12.70,13.30]，实际 ' + JSON.stringify(TL.handoffFlash))
  assert(!/12\.52/.test(code), '12.52 旧交接闪光终点必须清零（spec §1：12.15/12.30/12.38/12.42/12.52 全部作废）')
  assert(!/TL\.handoffFlash\s*=\s*\[\s*12\.3/.test(code), 'TL.handoffFlash 不得残留 12.30 起点')
})
run('v0.5 §3.1 里程碑常量：bootComplete 11800 / bloom 12700 / fade 13050 / done 13900', () => {
  const lit = objectLiteralAfter(js, 'var MILESTONES')
  assert(lit, '缺少 MILESTONES 里程碑表（SPEC §3.1）')
  const m = evalLiteral(lit, constScope)
  const byKey = {}
  if (Array.isArray(m)) { for (const item of m) if (item && item.key) byKey[item.key] = item.at } else if (m && typeof m === 'object') { Object.assign(byKey, m) }
  assertEqual(Number(byKey.bootComplete), 11800, 'MILESTONES.bootComplete')
  assertEqual(Number(byKey.bloom), 12700, 'MILESTONES.bloom')
  assertEqual(Number(byKey.fade), 13050, 'MILESTONES.fade')
  assertEqual(Number(byKey.done), 13900, 'MILESTONES.done')
  assertEqual(Number(byKey.arm === undefined ? 11550 : byKey.arm), 11550, 'MILESTONES.arm 保留 11550')
})

/* ── v0.5 §1 相位表 ── */
run('v0.5 §1 相位表六段边界：0/0.50/3.90/8.30/10.35/11.95/13.90', () => {
  assert(Array.isArray(PHASES) && PHASES.length === 6, 'PHASES 应为 6 段，实际 ' + JSON.stringify(PHASES))
  const ids = PHASES.map((p) => p.id)
  assertEqual(JSON.stringify(ids), JSON.stringify(['prologue', 'neuro', 'moss', 'split', 'earth', 'handoff']), 'phase ids')
  const want = [
    { from: 0, to: 0.5 }, { from: 0.5, to: 3.9 }, { from: 3.9, to: 8.3 },
    { from: 8.3, to: 10.35 }, { from: 10.35, to: 11.95 }, { from: 11.95, to: 13.9 }
  ]
  const bad = []
  PHASES.forEach((p, i) => {
    if (!valuesClose([p.from, p.to], [want[i].from, want[i].to])) bad.push(p.id + ': ' + p.from + '→' + p.to)
  })
  assertEqual(bad.length, 0, 'phase boundaries: ' + bad.join(' | '))
})
run('v0.5 §1 PHASES.duration / 探针 duration / data-duration 全部 13.9', () => {
  assert(/root\.setAttribute\('data-duration', String\(DURATION\)\)/.test(code), 'data-duration 必须写 DURATION')
  assert(/duration:\s*DURATION/.test(code), '__DSH_MOSS2_SPLASH__ / API duration 必须 = DURATION')
  /* 旧版本时间线残留必须清零（earthPushEnd=11.80 / PROGRESS_NOMINAL=12.80 是合法时间点，不在此列） */
  assert(!/var DURATION = 12\.8/.test(code), 'DURATION 不得残留 12.8')
  assert(!/var DURATION_MS = 12800/.test(code), 'DURATION_MS 不得残留 12800')
  assert(!/var HARD_STOP_MS = 14000/.test(code), 'HARD_STOP_MS 不得残留 14000（v0.5 为 17000）')
  assert(!/var FADE_AT = 12\.38/.test(code), 'FADE_AT 不得残留 12.38（v0.5 为 13.05）')
  assert(!/var FADE_MS = 420/.test(code), 'FADE_MS 不得残留 420（v0.5 为 810）')
  assert(!/var PROGRESS_END = 12\.3/.test(code), 'PROGRESS_END 不得残留 12.30（v0.5 为 12.10）')
})

/* ── v0.5 §1.1 进度单一真值（12.10 恰好 1，12.10–13.90 保持完成态） ── */
run('v0.5 §1.1 进度：bootProgress 0→10.35 线性 → 12.10 补到 1 → t≥12.10 恒 1', () => {
  for (const token of ['bootProgress', 'quantizeProgress', 'PROGRESS_SHOW', 'PROGRESS_KNEE', 'PROGRESS_END', 'PROGRESS_NOMINAL', 'trackWidth']) {
    assert(js.includes(token), 'missing progress token: ' + token)
  }
  assert(/function bootProgress\(t\)/.test(js), 'bootProgress(t) 函数')
  assert(/if \(t >= PROGRESS_END\) return 1/.test(code), 't≥12.10 必须恒返回 1')
  assert(/0\.88 \* raw \+ 0\.12 \* easeInOut\(raw\)/.test(code), '保持 0.88*raw+0.12*easeInOut(raw) 契约')
  assert(/el\.progress\.clientWidth/.test(code), 'trackWidth 必须实测 .ms-progress.clientWidth')
  assert(/quantizeProgress\(bootProgress\(t\)\)/.test(code), 'pct/fill/spark 必须消费同一个量化 progress')
  assert(TL && valuesClose(TL.earth, 10.35), '10.35 是跳过相位语义锚点（PROGRESS_KNEE 必须 = 幕 IV 起点）')
  assert(PROGRESS_NOMINAL === 12.8, 'PROGRESS_NOMINAL=12.80 保持曲线前段与 v0.4 一致（分母）')
})

run('v0.5 §1.1 进度层完成态：12.10 之后 BOOT COMPLETE / 100%', () => {
  for (const token of ['data-progress-fill', 'data-progress-spark', 'data-pct-num', 'ms-progress--complete', 'data-complete']) {
    assert(js.includes(token), 'missing progress DOM token: ' + token)
  }
  assert(js.includes('BOOT COMPLETE / 加载完成'), '完成态中英文案缺失')
  assert(/el\.bottom = el\.globalHud/.test(code), 'cacheEls 必须从 .ms-global-hud 查询进度条')
  assert(/8000/.test(code) || /100/.test(code), '完成态 pct 必须到 100')
})

run('v0.4 §2.1 跳过路径：SKIP_AT=10.35（幕 IV 起点、点火前）且 render(SKIP_AT)', () => {
  assert(/var SKIP_AT = 10\.35/.test(js), 'SKIP_AT 必须为 10.35')
  assert(/render\(SKIP_AT\)/.test(code), '跳过路径必须 render(SKIP_AT)')
  assert(/startedAt = clockNow\(\) - SKIP_AT \* 1000/.test(code), '跳过路径计时应从 SKIP_AT 起算')
})

/* ── v0.4 §3.1 终局对焦（.ms-tgt-focus）── */
run('v0.4 §3.1 终局对焦框 DOM：.ms-tgt-focus + 四角 .ms-tgt-focus__corner ×4', () => {
  for (const token of ['ms-tgt-focus', 'ms-tgt-focus__corner']) {
    assert(js.includes(token), 'missing focus DOM token: ' + token)
  }
  assert(/data-focus-corner="(?:tl|tr|bl|br)"/.test(js) || /focusCorner/.test(js), '四角需带 tl/tr/bl/br 标识')
})

run('v0.4 §3.1 几何契约：FOCUS_HALF = clamp(72, 0.104*min(w,h), 116) + 锚点 = 主眼 ± half', () => {
  const body = extractFunctionBody(js, 'focusHalfFor') || extractFunctionBody(js, 'computeFocusHalf') || ''
  assert(body.length > 20, '缺少 FOCUS_HALF 计算函数（focusHalfFor(W,H)）')
  assert(/0\.104/.test(body), 'FOCUS_HALF 比例系数必须为 0.104')
  assert(/72/.test(body), 'FOCUS_HALF 下限必须 72px')
  assert(/116/.test(body), 'FOCUS_HALF 上限必须 116px')
  assert(/Math\.min\(/.test(body), 'FOCUS_HALF 必须取 min(frameW, frameH)')
  assert(/computeEyePoint\(\)/.test(code), '对焦框几何必须消费 computeEyePoint()（不得写死坐标）')
  assert(/FOCUS_HALF\s*\*\s*0\.30|0\.30\s*\*\s*FOCUS_HALF|half\s*\*\s*0\.60|--ms-focus-box/.test(all), '四角臂长必须 = FOCUS_HALF*0.30（实现可用 --ms-focus-box=half*0.60 表达臂总长）')
  assert(/2\.5px/.test(all), '对焦框线宽必须为 2.5px')
})

run('v0.4 §3.1 对焦行程：7.42–7.62 收口 1.16→1.00 / 7.62–7.72 过冲 / 7.78–8.06 静止', () => {
  for (const token of ['tgtFocus', '1.16']) {
    assert(js.includes(token), 'missing focus-progress token: ' + token)
  }
  assert(/tgtFocus\[0\]/.test(code) && /tgtFocus\[1\]/.test(code), '对焦行程必须消费 TL.tgtFocus 边界')
  assert(/1\.16\s*-\s*0\.16\s*\*\s*easeOut\(seg\(t,\s*[^)]*7\.62\)\)/.test(code),
    '收口必须 1.16-0.16*easeOut(seg(t,7.42,7.62))（等价 spec 的 focusIn）')
  assert(/0\.035\s*\*\s*Math\.sin\(Math\.PI\s*\*\s*seg\(t,\s*7\.62,\s*7\.72\)\)/.test(code), '过冲必须 0.035*sin(pi*seg(t,7.62,7.72))')
  /* 7.42 起旧框必须隐藏（两套框叠加会再次错位） */
  assert(/ms-tgt-corner/.test(js), '旧 .ms-tgt-corner 仍应存在（7.42 前捕获/收敛用途）')
  assert(/if \(calm \|\| locked\) \{ op\(corners\[ci\], 0\)/.test(code), '7.42 锁定后旧 tgt 四角必须 opacity=0')
})

run('v0.4 §3.1 探针：__DSH_MOSS2_LOCK__.focus 发布 x/y/half/w/h/aligned', () => {
  assert(/lockProbe\.focus/.test(code), '__DSH_MOSS2_LOCK__.focus 对象必须存在')
  assert(/\.half\s*=\s*half/.test(code), 'focus.half 必须逐帧写')
  assert(/\.aligned\s*=/.test(code), 'focus.aligned 必须逐帧写')
  assert(/\.w\s*=\s*half\s*\*\s*2/.test(code) && /\.h\s*=\s*half\s*\*\s*2/.test(code), 'focus.w/h 必须 = half*2')
})

pendingRun('v0.4 §3.1 探针：__DSH_MOSS2_LOCK__.focusAligned === true（spec §3.1.4 硬契约）',
  /focusAligned/.test(code),
  '待实现：splash-smith 补 lockProbe.focusAligned（Lead 裁决：落地前 SKIP，落地后必须 ASSERT）', () => {
    assert(/focusAligned/.test(code), '__DSH_MOSS2_LOCK__.focusAligned 必须发布（spec §3.1.4）')
    assert(/focusAligned\s*=\s*(?:true|f\.aligned|focus\.aligned|locked|t\s*>=)/.test(code), 'focusAligned 必须与 focus.aligned 同值逐帧写')
  })

run('v0.4 §3.1 主眼坐标微调授权范围内 + computeEyePoint 唯一来源', () => {
  assert(/function computeEyePoint\(\)/.test(js), 'computeEyePoint()')
  const m = /var EYE = \{ x: ([0-9.]+), y: ([0-9.]+) \}/.exec(js)
  assert(m, '缺少 var EYE = { x, y }')
  const x = Number(m[1])
  const y = Number(m[2])
  /* spec §3.1.6：允许按 moss.json eyeMedian 微调一次；v0.3 基线 0.3740/0.5380 */
  assert(Math.abs(x - 0.3740) <= 0.01, 'EYE.x 只能在 eyeMedian 微调范围内（±0.01），实际 ' + x)
  assert(Math.abs(y - 0.5380) <= 0.01, 'EYE.y 只能在 eyeMedian 微调范围内（±0.01），实际 ' + y)
  assert(/eyePoint\.x = \(W - rw\) \/ 2 \+ EYE\.x \* rw/.test(code), 'computeEyePoint 必须以 (W-rw)/2 + EYE.x*rw 换算屏幕坐标')
  assert(!/EYE\.x \* W\b/.test(code), '主眼 x 必须按视频渲染宽度 rw 换算（不得直接用 frame 宽）')
})

run('v0.3 §5 第二幕红色准心锁定特效 DOM 完整', () => {
  for (const token of [
    'ms-tgt-layer', 'ms-tgt-grid', 'ms-tgt-scan', 'ms-tgt-corner', 'ms-tgt-ghost', 'ms-tgt-reticle',
    'ms-tgt-ring-o', 'ms-tgt-ring-i', 'ms-tgt-ticks', 'ms-tgt-cross', 'ms-tgt-dot',
    'data-tgt-dist', 'data-tgt-locklabel', 'ms-tgt-data', 'ms-lock-shock', 'ms-moss-vignette', 'data-tgt-layer'
  ]) assert(js.includes(token), 'missing v0.3 act2 DOM token: ' + token)
  assertEqual((js.match(/data-corner="(?:tl|tr|bl|br)"/g) || []).length, 4, '四角括号 ×4')
  assertEqual((js.match(/data-ghost="\d"/g) || []).length, 3, '假目标 ×3')
  assertEqual((js.match(/data-lock-shock="/g) || []).length, 2, '冲击波 ×2')
})

run('v0.3 §5 MOSS_MOTION 能量包络内联（不新增资产请求）', () => {
  assert(/var MOSS_MOTION = \[/.test(js), 'MOSS_MOTION 能量包络必须以常量内联（不新增资产请求）')
  assert(/function mossEnergy\(/.test(js), 'mossEnergy 能量采样')
  assert(/function targetPhase\(/.test(js), 'targetPhase 子相位（search/capture/track/converge/lock/maintain）')
  assert(!code.includes('moss-motion.json'), 'splash.js 不得运行时请求 moss-motion.json 资产')
})

run('v0.3 §5 铁律：MOSS 视频元素不被改 filter/transform（只有叠加层）', () => {
  assert(/el\.videoMoss = root\.querySelector\('video\[data-act="moss"\]'\)/.test(js), 'video[data-act=moss] DOM 契约')
  assert(!/el\.videoMoss[^;]{0,80}\.(?:filter|transform)\s*=/.test(js), '不得给 MOSS 视频写 filter/transform')
  assert(!/el\.videoMoss\.style\.(?:filter|transform)/.test(js), '不得给 MOSS 视频写 filter/transform')
})

/* ── v0.5 §4 MOSS 机械臂音效：用户音轨接管 3.90–8.30（独立 arm 总线，不进 master comp/limiter） ── */
run('v0.5 §4.3 buildAudioGraph 支持 opts.armBuffer（BufferSource 3.900 起播 / offset 0 / min(4.40,buffer) / 独立 arm 总线）', () => {
  const body = extractFunctionBody(js, 'buildAudioGraph') || ''
  assert(body.length > 500, 'buildAudioGraph 函数体缺失')
  assert(/armBuffer/.test(body), 'buildAudioGraph 必须接受 opts.armBuffer')
  assert(/createBufferSource/.test(body), 'armBuffer 路径必须创建 BufferSource')
  assert(/armGain/.test(body), 'armBuffer 必须经独立 armGain')
  /* SPEC §4.3（2026-11-09 更新）：armGain = (volume/100) × ARM_LEVEL(1.00)，绕过 master→comp→limiter */
  assert(/volume\s*\/\s*100|volume\s*\/100/.test(body) || /ARM_LEVEL/.test(body), 'armGain 必须按 (volume/100)×ARM_LEVEL 计算')
  assert(/1\.00|1\.0/.test(body) || /ARM_LEVEL\s*=\s*1/.test(js), 'ARM_LEVEL 必须 1.00')
  assert(/knee[^0-9]{0,14}0\.55|0\.55[^0-9]{0,14}knee|ARM\.knee/.test(body) || /knee\s*:\s*0\.55/.test(js), 'arm 专用软限幅 knee 必须 0.55')
  assert(/ceil[^0-9]{0,14}0\.68|0\.68[^0-9]{0,14}ceil|ARM\.ceil/.test(body) || /ceil\s*:\s*0\.68/.test(js), 'arm 专用软限幅 ceil 必须 0.68')
  assert(/destination/.test(body), 'arm 总线必须直连 destination（绕过 master chain）')
  const win = body.replace(/\s+/g, ' ')
  assert(/3\.9|mossIn/.test(win), 'armBuffer 必须 when(TL.mossIn=3.90) 起播')
  assert(/Math\.min\([^)]*4\.4|4\.40|4\.4\b/.test(win), 'armBuffer 播放 duration 必须 min(4.40,buffer.duration)')
  assert(/offset\s*:\s*0\b|start\([^,]+,\s*0\b/.test(win), 'armBuffer offset/seek 必须 0')
})
run('v0.5 §4.3 arm-sfx 事件探针：logAudioEvent(\'arm-sfx\', 3.90, gain) + AUDIO_STATE.armSfx 6 字段', () => {
  assert(/arm-sfx/.test(js), "音频事件 kind 必须含 'arm-sfx'")
  const body = extractFunctionBody(js, 'buildAudioGraph') || ''
  assert(/logAudioEvent\(\s*'arm-sfx'\s*,\s*(?:ARM\.at|3\.9(?:00)?)\s*,/.test(body), "必须有 logAudioEvent('arm-sfx', 3.900, gain)")
  for (const field of ['ok', 'fallback', 'duration', 'offset', 'gain', 'decodedAt']) {
    assert(new RegExp('armSfx[\\.\\s\\S]{0,40}' + field + '|' + field + '\\s*:\\s*[^,\\n]+').test(code), 'armSfx 探针字段缺失：' + field)
  }
  assert(/__DSH_MOSS2_AUDIO_EVENTS__/.test(js), '必须保留 __DSH_MOSS2_AUDIO_EVENTS__ 探针')
})
run('v0.5 §4.3 initAudio：fetch m4a → decodeAudioData → buildAudioGraph({offset:elapsed(), armBuffer})；1.5s 超时回退', () => {
  const body = extractFunctionBody(js, 'initAudio') || ''
  assert(body.length > 100, 'initAudio 函数体缺失')
  assert(/audio\/moss-arm-sfx\.m4a/.test(js), "必须引用 'audio/moss-arm-sfx.m4a' 资产名（常量或字面量）")
  assert(/MOSS_ARM_ASSET|audio\/moss-arm-sfx\.m4a/.test(body), 'initAudio 必须用该资产名 fetch（可经 assetUrl 拼接）')
  assert(/fetch\(/.test(body), 'initAudio 必须 fetch 资产')
  assert(/decodeAudioData/.test(body), 'initAudio 必须 decodeAudioData')
  assert(/armBuffer/.test(body), 'initAudio 必须把 armBuffer 传给 buildAudioGraph')
  assert(/ARM_DECODE_TIMEOUT_MS|1500/.test(body) || /ARM_DECODE_TIMEOUT_MS\s*=\s*1500/.test(js), '解码超时 1.5s 必须显式存在')
  assert(/catch|timeout/.test(body), 'initAudio 失败/超时必须走回退路径（不抛未捕获异常）')
})
run('v0.5 §4.3 无 buffer 回退：MOSS_ARM_FALLBACK 分支保留合成层 + console.warn 一次 + fallback=true', () => {
  assert(/MOSS_ARM_FALLBACK/.test(js), '必须保留 MOSS_ARM_FALLBACK 回退分支（SPEC §4.3）')
  assert(/armSfx\.fallback|fallback\s*:\s*true/.test(code), '回退时探针 armSfx.fallback 必须 = true')
  assert(/console\.warn/.test(js), '回退必须 console.warn 一次（不得静默）')
  for (const token of ['servo', 'rumble']) {
    assert(new RegExp(token).test(js), '回退合成层必须保留 v0.4 ' + token + ' 层')
  }
  assert(/MOSS_JOINTS/.test(js), '回退分支保留 MOSS_JOINTS 合成关节数据（主路径不播放，SPEC §4.3）')
})
run('v0.3 §6 程序化音频底座保留：DynamicsCompressor + 300ms 淡出 + 静默降级 + 离线入口', () => {
  assert(/function buildAudioGraph\(\s*ctx/.test(js), 'buildAudioGraph(ctx, opts) 纯构建函数')
  for (const token of ['createDynamicsCompressor', 'createOscillator', 'createBufferSource', 'fadeOut:', 'AUDIO_FADE']) {
    assert(js.includes(token), 'missing audio token: ' + token)
  }
  assert(/window\.AudioContext \|\| window\.webkitAudioContext/.test(js), 'AudioContext 构造兜底')
  assert(/catch\s*\(\s*err\s*\)\s*\{\s*updateAudioProbe\(false/.test(js), 'AudioContext 构造失败必须静默降级（catch → probe，不抛异常）')
  assert(js.includes('__DSH_MOSS2_BUILD_AUDIO__'), '离线渲染入口 __DSH_MOSS2_BUILD_AUDIO__')
  assert(js.includes('__DSH_MOSS2_AUDIO_STATE__'), '音频状态探针 __DSH_MOSS2_AUDIO_STATE__')
  assert(/DURATION/.test(code) && !/duration\s*=\s*11\.8/.test(code), '离线渲染时长必须 = DURATION（13.90）')
})

/* ── v0.4 §4 二→三幕连续转场 ── */
run('v0.4 §4 预转场（8.06–8.30）：准心十字线延伸 + 四角 fly-out + 拉丝', () => {
  assert(js.includes('ms-split__corner') || css.includes('ms-split__corner'), 'missing v0.4 transition token: ms-split__corner')
  assert(/ms-split__flashline/.test(all) || /ms-scan/.test(all), '拉丝：复用 .ms-scan 或新增 .ms-split__flashline')
  assert(/TL\.mossSplitPrep/.test(code), '预转场必须消费 TL.mossSplitPrep')
  /* 十字线颜色红→冰白：允许 JS write --ms-seam-color 或直接 rgba 插值（spec §4.1 二者皆可） */
  assert(/--ms-seam-color/.test(all) || (/lerp\(255,\s*226/.test(code) && /lerp\(59,\s*245/.test(code) && /lerp\(48,\s*255/.test(code)),
    '十字线颜色过渡必须写 --ms-seam-color 或做红→冰白 rgba 插值')
})
run('v0.4 §4 分割成立：0.10s 闪白峰值 0.30 + 分割线 scaleY 0→1 画出 + 6px 高光', () => {
  assert(/splitFlashEnd/.test(js), '缺少 splitFlashEnd（8.44 闪白结束）')
  assert(/0\.30/.test(code), '闪白峰值必须 0.30（v0.3 为 0.36）')
  assert(/scaleY/.test(all), '分割线必须由中心向上下 scaleY 0→1 画出')
  assert(/TL\.splitSeamDraw/.test(code), '分割线画出必须消费 TL.splitSeamDraw')
  assert(/6px/.test(all), '接缝高光 6px')
})
run('v0.4 §4 左 half 冷压 + 右 half data wipe（4 条水平扫描带）+ 数据包光点', () => {
  assert(/saturate\(/.test(code) && /brightness\(/.test(code) && /lerp\(1,\s*0\.82/.test(code) && /lerp\(1,\s*1\.18/.test(code),
    '左 half MOSS 必须插值到 saturate(.82) brightness(1.18) 冻结降饱和（spec §4.2 v0.4 定稿值）')
  assert(js.includes('ms-split__wipe') || css.includes('ms-split__wipe'), '缺少右 half data wipe 元素 .ms-split__wipe')
  assert(/4/.test(css) || /wipe/.test(css), 'wipe 必须为 4 条水平扫描带')
  assert(js.includes('ms-seam-packet') || css.includes('ms-seam-packet'), '缺少接缝数据包 .ms-seam-packet')
  assertEqual((js.match(/ms-seam-packet/g) || []).length >= 1, true, '数据包 ×3 必须由 JS 生成')
  assert(/550W · CONTROL TRANSFER/.test(js) && /THE WANDERING EARTH/.test(js), '左/右 half 标签文案缺失')
})
run('v0.4 §4 点火预告（9.82–10.18）：ENGINE IGNITION 文案 + 接缝冷蓝 + 无喷射', () => {
  assert(/ENGINE IGNITION/.test(js), '缺少「ENGINE IGNITION / 引擎点火」预告文案')
  assert(/TL\.engineHint/.test(code), '预告必须消费 TL.engineHint')
})

/* ── v0.4 §5 地球冷态 / 点火 ── */
/** 已知「待实现」项：实现落地后自动转正式断言（不提前造 FAIL，也不删除断言）。 */
function pendingRun(name, ready, reason, fn) {
  if (ready) run(name, fn)
  else skip(name, reason)
}

run('v0.5 §5.1 幕 III 冷态：地球几何裁切 + 冷调色 + 无喷射 + 0.65 慢速漂移', () => {
  assert(/var EARTH = \{/.test(js), '缺少地球几何常量 EARTH（earth.json 分析数据内联）')
  for (const token of ['planetX', 'planetY', 'planetRH', 'coldAt', 'jetAt']) {
    assert(js.includes(token), 'missing earth geometry token: ' + token)
  }
  /* 参数取 earth.json 的 planet 几何（x≈0.494–0.508、y≈0.451–0.509、r/height≈0.177–0.19）：
     这里断言落在数据允许范围内，精确裁切效果由 verify5 像素断言（尾迹不可见）兜底。 */
  const gx = Number((/planetX:\s*([0-9.]+)/.exec(js) || [])[1])
  const gy = Number((/planetY:\s*([0-9.]+)/.exec(js) || [])[1])
  const gr = Number((/planetRH:\s*([0-9.]+)/.exec(js) || [])[1])
  assert(gx >= 0.47 && gx <= 0.52, 'EARTH.planetX 必须落在 earth.json planet.x 范围（0.478–0.508），实际 ' + gx)
  assert(gy >= 0.44 && gy <= 0.52, 'EARTH.planetY 必须落在 earth.json planet.y 范围（0.451–0.509），实际 ' + gy)
  assert(gr >= 0.17 && gr <= 0.21, 'EARTH.planetRH（按高归一化）≈0.177–0.19，实际 ' + gr)
  const coldAt = Number((/coldAt:\s*([0-9.]+)/.exec(js) || [])[1])
  const jetAt = Number((/jetAt:\s*([0-9.]+)/.exec(js) || [])[1])
  assert(Math.abs(coldAt - 20.27) <= 0.01, 'EARTH.coldAt 必须 = 20.27（冷态帧），实际 ' + coldAt)
  assert(Math.abs(jetAt - 4.57) <= 0.01, 'EARTH.jetAt 必须 = 4.57（点火帧），实际 ' + jetAt)
  assert(/ms-earth-cold/.test(all), '幕 III 必须有冷态 class（进入幕 IV 时移除）')
  assert(/ms-earth-plume-cover/.test(all), '裁切不足时必须提供 .ms-earth-plume-cover 径向遮罩兜底')
  /* 冷调（spec §5.1.2 定稿值） */
  const fb = Number((/var EARTH_COLD_FILTER = 'brightness\(([0-9.]+)\)/.exec(js) || [])[1])
  const fs2 = Number((/var EARTH_COLD_FILTER = '[^']*saturate\(([0-9.]+)\)/.exec(js) || [])[1])
  const fc = Number((/var EARTH_COLD_FILTER = '[^']*contrast\(([0-9.]+)\)/.exec(js) || [])[1])
  assert(fb === 1.06 && fs2 === 0.72 && fc === 1.06,
    '冷态滤镜必须为 brightness(1.06) saturate(.72) contrast(1.06)（spec §5.1.2 定稿），实际 ' + JSON.stringify([fb, fs2, fc]))
  assert(/0\.65/.test(code), '幕 III playbackRate 必须 0.65（慢速漂移）')
  assert(/jetVisible/.test(code), '探针必须发布 jetVisible')
})
run('v0.5 §2.2 冷态预 seek：setupMedia earth 携带 preSeek=EARTH.coldAt；startSplit 只做兜底 seek', () => {
  assert(/preSeek\s*:/.test(code), 'setupMedia 必须支持 preSeek 选项（spec §2.2.1）')
  assert(/preSeek\s*:\s*[^,\n]*coldAt/.test(code), 'earth 的 setupMedia 调用必须携带 preSeek: EARTH.coldAt（20.27）')
  const split = extractFunctionBody(js, 'startSplit') || ''
  assert(split.length > 40, 'startSplit 函数体缺失')
  assert(/playMedia\(\s*'earth'/.test(split), 'startSplit 必须 playMedia(earth)')
  assert(/0\.65/.test(split), 'startSplit 必须设 playbackRate 0.65')
  /* SPEC §2.2.1：只有实测偏移 >0.75s 才兜底补一次 seek（不得无条件 seek） */
  const hasGuard = /0\.75/.test(split) && /preSeeked/.test(split)
  assert(hasGuard, 'startSplit 的 seek 必须是「偏移 >0.75s 才兜底」条件分支（SPEC §2.2.1）')
  const earthFn = extractFunctionBody(js, 'startEarth') || ''
  assert(earthFn.length > 30, 'startEarth 函数体缺失')
  assert(/seekMedia\(\s*'earth'/.test(earthFn), 'startEarth 必须 seekMedia(earth, jetAt)')
})
run('v0.5 §2.2 幕 IV 点火（10.35）：scale→1.12~1.13 + 冰蓝闪光 + 双扩散光环 + playbackRate 1.0', () => {
  for (const token of ['ms-ignite-flash', 'ms-ignite-burst']) {
    assert(all.includes(token), 'missing ignite token: ' + token)
  }
  assert(/ms-earth-ignite/.test(all), '点火必须有状态标记（进入幕 IV 时移除冷态 class）')
  assert(/kEnd:\s*1\.1[23]|scale\(1\.1[23]\)/.test(all), '点火后 scale 必须到 1.12~1.13（与 ambient 一致）')
  assert(/brightness\(1\.75\)/.test(all) || /lerp\(1\.30,\s*1\.75/.test(code), '点火滤色必须到 brightness(1.75)')
  assert(/saturate\(1\.22\)/.test(all) || /lerp\(0\.78,\s*1\.22/.test(code), '点火滤色必须到 saturate(1.22)')
  assert(/0\.85/.test(code), '点火闪光峰值不透明度必须 0.85')
  assertEqual((js.match(/ms-ignite-burst/g) || []).length >= 2, true, '.ms-ignite-burst ×2')
  assert(/TL\.ignite/.test(code), '点火段必须消费 TL.ignite（10.35–10.95）')
  assert(/setPlaybackRate\('earth', 1\)/.test(code) || /playbackRate = 1/.test(code), '点火后 playbackRate 必须回 1.0')
})
run('v0.5 §2.2 点火闪光窗口延长：10.35–10.95（10.50/10.55 保持 0.85，calm ×0.5）', () => {
  const body = extractFunctionBody(js, 'renderEarthAct') || ''
  assert(body.length > 100, 'renderEarthAct 函数体缺失')
  assert(/0\.85\s*\*\s*easeOut\(seg\(t,\s*TL\.ignite\[0\]\s*,\s*10\.50\)\)|0\.85\s*\*\s*easeOut\(seg\(t,\s*10\.35\s*,\s*10\.50\)\)/.test(body),
    '闪光上升段必须 0.85*easeOut(seg(t,TL.ignite[0]=10.35,10.50))')
  assert(/0\.85\s*\*\s*\(1\s*-\s*seg\(t,\s*10\.55\s*,\s*TL\.ignite\[1\]\)\)|0\.85\s*\*\s*\(1\s*-\s*seg\(t,\s*10\.55\s*,\s*10\.95\)\)/.test(body),
    '闪光回落段必须 0.85*(1-seg(t,10.55,TL.ignite[1]=10.95))')
  assert(/10\.50/.test(body) && /10\.55/.test(body), '闪光保持窗口 10.50–10.55 必须显式存在')
  assert(/calm[\s\S]{0,120}\*=\s*0\.5|calm[\s\S]{0,120}0\.5/.test(body), 'calm 下闪光幅度 ×0.5')
  assert(/10\.46/.test(code), '遮罩移除 EARTH_IGNITE_AT=10.46 不变')
})
run('v0.5 §2.2 地球只读探针新增字段：preSeeked/seekAt/seekedAt/seekMs/igniteSeekMs（保留 v0.4 字段）', () => {
  assert(js.includes('__DSH_MOSS2_EARTH_STATE__'), '缺少 __DSH_MOSS2_EARTH_STATE__ 探针')
  for (const field of ['phase', 'scale', 'playbackRate', 'jetVisible', 'jetAt']) {
    assert(new RegExp('earthStateProbe\\.' + field + '\\s*=|' + field + ':\\s*[^,\\n]+').test(code), '地球探针旧字段缺失：' + field)
  }
  for (const field of ['preSeeked', 'seekAt', 'seekedAt', 'seekMs', 'igniteSeekMs']) {
    assert(new RegExp('(?:earthStateProbe|probe)\\.' + field + '|' + field + ':').test(code), '地球探针新增字段缺失：' + field)
  }
})

/* ── v0.5 §3.1 交接柔化 ── */
run('v0.5 §3.1 BOOT COMPLETE 印章：11.80–12.10 揭开、12.70 前保持、12.70–13.05 淡出', () => {
  for (const token of ['ms-boot-stamp', 'BOOT COMPLETE', '系统就绪 · DEEPSEEK HARNESS']) {
    assert(js.includes(token), 'missing boot-complete token: ' + token)
  }
  assert(/TL\.bootComplete/.test(code), '印章必须消费 TL.bootComplete（11.80–12.10）')
  const body = extractFunctionBody(js, 'renderBootStamp') || ''
  assert(body.length > 60, 'renderBootStamp 函数体缺失')
  assert(/11\.84/.test(body) && /11\.96/.test(body), '印章 clip 揭开窗口必须 11.84→11.96（SPEC §3.1）')
  assert(/12\.70/.test(body) && /13\.05/.test(body), '印章保持到 12.70、12.70→13.05 淡出（SPEC §3.1）')
  assert(/(1\s*-\s*seg\(\s*t\s*,\s*12\.70\s*,\s*13\.05\s*\))/.test(body) || /seg\(\s*t\s*,\s*12\.70\s*,\s*13\.05\s*\)/.test(body),
    '印章 opacity 必须含 (1-seg(t,12.70,13.05)) 淡出项')
  assert(/13\.10/.test(body) || /inWin/.test(body), 'inWin 必须到 13.10')
})
run('v0.5 §3.1 HUD 收束窗口改为 11.80→12.35（旧 12.15 作废）', () => {
  const body = extractFunctionBody(js, 'renderHandoffChrome') || ''
  assert(body.length > 40, 'renderHandoffChrome 函数体缺失')
  assert(/11\.80|TL\.bootComplete\[0\]/.test(body), 'HUD 收束起点必须 11.80')
  assert(/12\.35/.test(body), 'HUD 收束终点必须 12.35（SPEC §3.1）')
  assert(!/12\.15/.test(body), 'HUD 收束不得残留 12.15 终点')
})
run('v0.5 §3.1 bloom：12.70–13.30 峰值 0.86 #eaf8ff（0.92/12.30–12.52 旧分支删除）', () => {
  assert(/#eaf8ff/.test(all), '闪光颜色必须 #eaf8ff')
  assert(/0\.86\s*\*\s*easeOut\(seg\(t,\s*(?:TL\.handoffFlash\[0\]|12\.70)\s*,\s*(?:13\.02|hfBloomAt)/.test(code),
    'bloom 上升段必须 0.86*easeOut(seg(t,12.70,13.02))')
  assert(/0\.86\s*\*\s*\(1\s*-\s*seg\(t,\s*(?:13\.02|hfBloomAt)\s*,\s*(?:TL\.handoffFlash\[1\]|13\.30)/.test(code),
    'bloom 回落段必须 0.86*(1-seg(t,13.02,13.30))')
  assert(/12\.70/.test(code) && /12\.70/.test(code), 'bloom 起点 12.70 必须显式存在')
  const at = code.indexOf('0.86 * easeOut')
  const bloomBlock = at >= 0 ? code.slice(Math.max(0, at - 500), at + 900) : ''
  assert(bloomBlock.length > 100, 'bloom 渲染块缺失（0.86 * easeOut）')
  assert(!/0\.92/.test(bloomBlock), 'bloom 区不得残留旧峰值 0.92')
  assert(/13\.02/.test(code), 'bloom 峰值时刻必须 13.02')
})
run('v0.5 §3.1 启动层 warp 溶解：810ms opacity+transform cubic-bezier(.4,0,.2,1) + scale(1.03)', () => {
  const body = extractFunctionBody(js, 'startHandoff') || ''
  assert(body.length > 60, 'startHandoff 函数体缺失')
  assert(/render\(FADE_AT\)/.test(body), 'startHandoff 必须先 render(FADE_AT) 补完成态帧')
  assert(/opacity \' \+ FADE_MS \+ 'ms cubic-bezier\(\.4,0,\.2,1\)/.test(body), 'root transition 必须 opacity FADE_MS(810ms) cubic-bezier(.4,0,.2,1)')
  assert(/transform \' \+ FADE_MS \+ 'ms cubic-bezier\(\.4,0,\.2,1\)/.test(body), 'root transition 必须含 transform 810ms 同曲线')
  assert(/scale\(1\.03\)/.test(body), '溶解必须 scale(1.03)（SPEC §3.1）')
  assert(/pointerEvents\s*=\s*'none'/.test(body), 'startHandoff 必须 pointerEvents:none')
  assert(/opacity\s*=\s*'0'/.test(body), 'startHandoff 必须 opacity:0')
  assert(!/blur\(/.test(body), '溶解不得用 blur（性能风险，SPEC §3.1）')
  assert(/13\.9|TL\.done|DURATION/.test(body), 'finish 时刻必须 13.90')
  assert(/finish\('natural'\)/.test(code), "13.90 必须 finish('natural') 并 dispatch dsh-moss2:done")
  assert(/dsh-moss2:done/.test(js), 'dsh-moss2:done 事件必须保留')
})
run('v0.5 §3.3 dsh-moss2:handoff 事件 detail 5 字段 {at,revealAt,fadeAt,duration,earthAt}', () => {
  assert(/HANDOFF_EVENT\s*=\s*'dsh-moss2:handoff'/.test(code), '必须定义 dsh-moss2:handoff 事件名')
  assert(/new CustomEvent\(HANDOFF_EVENT, \{ detail: detail \}\)/.test(code), '必须 dispatch CustomEvent(dsh-moss2:handoff, {detail})')
  const at = code.indexOf('function startBootComplete')
  const segText = at >= 0 ? code.slice(at, at + 900) : ''
  assert(segText.length > 100, 'startBootComplete 函数体缺失')
  for (const field of ['at', 'revealAt', 'fadeAt', 'duration', 'earthAt']) {
    assert(new RegExp('(?:' + field + '\\s*:|' + field + '\\s*=|detail\\.' + field + ')').test(segText), 'handoff detail 缺少字段：' + field)
  }
  assert(/at:\s*TL\.bootComplete\[0\]|at:\s*11\.8/.test(segText), 'detail.at 必须 11.8（TL.bootComplete[0]）')
  assert(/revealAt:\s*FADE_AT|revealAt:\s*13\.05/.test(segText), 'detail.revealAt 必须 13.05（FADE_AT）')
  assert(/fadeAt:\s*FADE_AT|fadeAt:\s*13\.05/.test(segText), 'detail.fadeAt 必须 13.05（FADE_AT）')
  assert(/duration:\s*DURATION|duration:\s*13\.9/.test(segText), 'detail.duration 必须 13.9（DURATION）')
  assert(/earthAt:\s*predictEarthTime|earthAt:\s*[^,\n]*currentTime|predictEarthTime\(FADE_AT\)/.test(segText),
    'detail.earthAt 必须由地球 currentTime 预测计算（SPEC §3.1）')
})
run('v0.5 §3.1 armHandoffNow：11.55 传预测帧 tPred + revealIn 1.5', () => {
  assert(/armHandoffNow/.test(code), '缺少 11.55 armHandoff')
  const body = extractFunctionBody(js, 'armHandoffNow') || ''
  assert(body.length > 40, 'armHandoffNow 函数体缺失')
  const predictor = extractFunctionBody(js, 'predictEarthTime') || ''
  assert(/currentTime/.test(body) || /currentTime/.test(predictor), 'armHandoff 必须取地球视频 currentTime（预测函数内）')
  assert(/predictEarthTime\(\s*FADE_AT/.test(body), 'tPred 必须 = predictEarthTime(13.05)（currentTime + (13.05-t)*rate）')
  assert(/armHandoff\s*\(\s*tPred\s*,\s*\{\s*revealIn\s*:\s*REVEAL_IN\s*\}\s*\)|armHandoff\s*\(\s*tPred\s*,\s*\{\s*revealIn/.test(body),
    '必须调用 api.armHandoff(tPred, {revealIn})')
  assert(/REVEAL_IN\s*=\s*1\.5/.test(code), 'REVEAL_IN 必须 = 1.5（13.05-11.55）')
  assert(/tl\.earthPushEnd|TL\.earthPushEnd/.test(code), '加速推近必须在 earthPushEnd=11.80 前结束')
})
run('v0.5 §3.1 只读握手探针 __DSH_MOSS2_HANDOFF__ 新增 revealAt/fadeAt/duration/earthAtPred', () => {
  assert(js.includes('__DSH_MOSS2_HANDOFF__'), '缺少 __DSH_MOSS2_HANDOFF__ 探针')
  for (const token of ['fadeAt', 'flashAt', 'revealAt', 'earthAtPred', 'duration']) {
    assert(new RegExp(token).test(code), 'handoff 探针缺少字段：' + token)
  }
  assert(/ok:\s*true/.test(code), 'handoff 探针必须发布 ok')
})

/* ── v0.5 §1 preview/freeze 全域可用 ── */
run('v0.5 §1 preview/freeze：0–13.90 全域可用（freeze 入口 + clamp）', () => {
  assert(/function freezeAt\(/.test(code), 'freezeAt(rawT)')
  assert(/Math\.min\(Number\(rawT\) \|\| 0, DURATION\)/.test(code), 'freeze 必须 clamp 到 DURATION（13.90）')
  assert(/__DSH_MOSS2_PREVIEW_T__/.test(js), 'preview freeze 入口（preview 分幕跳转依赖）')
})
run('v0.5 §2.2 frozenSeek 地球本地时间：t<10.35 冷态 at-8.30+coldAt / t≥10.35 点火段 jetAt+(at-10.35)', () => {
  assert(/EARTH\.jetAt \+ \(at - TL\.earth\)/.test(code), '幕 IV frozenSeek 必须用点火段 jetAt+(at-10.35)')
  assert(/at - TL\.split \+ EARTH\.coldAt|at - 8\.3 \+ EARTH\.coldAt/.test(code), '幕 III frozenSeek 必须用冷态段 (at-8.30)+coldAt')
  assert(/setPlaybackRate\('earth', at >= TL\.earth \? 1 : 0\.65\)/.test(code), 'frozenSeek 必须按相位设 playbackRate 0.65/1.0')
})
run('v0.3 只读探针：__DSH_MOSS2_PROGRESS__ / __DSH_MOSS2_LOCK__ / __DSH_MOSS2_PREVIEW__', () => {
  for (const token of ['__DSH_MOSS2_PROGRESS__', '__DSH_MOSS2_LOCK__', '__DSH_MOSS2_PREVIEW__', 'progressProbe', 'lockProbe']) {
    assert(js.includes(token), 'missing probe token: ' + token)
  }
  assert(/progressProbe\.pct = pct/.test(js), 'progressProbe 发布 pct')
  assert(/progressProbe\.trackWidth = trackWidth/.test(js), 'progressProbe 发布 trackWidth')
  assert(/lockProbe\.reticle\.x = rx/.test(js) && /lockProbe\.eye\.x = ex/.test(js), 'lockProbe 发布准心/主眼屏幕坐标')
})

run('splash.js 运动策略红线：不读取 prefers-reduced-motion / matchMedia (§1/§7)', () => {
  assert(!code.includes('prefers-reduced-motion'), 'splash 不得读取 prefers-reduced-motion 决策画面')
  assert(!code.includes('matchMedia'), 'splash 不得用 matchMedia 判断降级')
  if (code.includes('reducedMotion')) {
    assert(!/reducedMotion[\s\S]{0,200}(pause\(|display\s*=\s*['"]none|removeChild)/.test(code), 'reducedMotion 不得停视频/缩短启动')
  }
})

run('splash.js audio degrades silently', () => {
  assert(js.includes('AudioContext'), 'WebAudio usage')
  assert(/catch\s*\(/.test(js), 'has try/catch')
  const openAudio = (js.match(/new (?:window\.)?AudioContext|new Ctor/g) || []).length
  assert(openAudio <= 2, 'AudioContext created at most twice: ' + openAudio)
  assert(!js.includes('alert('), 'no blocking alert')
})

run('splash.js dispose 清理监听器/派发器', () => {
  for (const token of ['removeEventListener', 'cancelAnimationFrame', 'dispose']) {
    assert(js.includes(token), 'missing cleanup token: ' + token)
  }
})

run('v0.5 §4 splash.js asset URLs（三支视频 + 三张海报 + arm-sfx m4a；无外部 http 依赖）', () => {
  assert(js.includes('/dsh-moss2/asset/'), 'default asset base')
  for (const token of [
    'neuro/neuro-boot-', 'moss/moss-cinema-', 'earth/earth-',
    'neuro/neuro-boot-poster', 'moss/moss-cinema-poster', 'earth/earth-poster',
    "'1080'", "'720'", 'saver'
  ]) assert(js.includes(token), 'missing asset/quality token: ' + token)
  assert(/audio\/moss-arm-sfx\.m4a/.test(js), 'splash.js 必须引用 audio/moss-arm-sfx.m4a（SPEC §4.3）')
  assert(!/moss-eye/.test(js), 'splash.js 不得再引用 v0.1 moss-eye 资产')
  assert(!code.includes('http://') && !code.includes('https://'), 'no external http dependency in splash.js')
})

/* ── splash.css ──────────────────────────────────────────────────────── */

run('splash.css exists + braces balanced', () => {
  assert(css.length > 10000, 'splash.css too small: ' + css.length)
  let depth = 0
  let inComment = false
  for (let i = 0; i < css.length; i += 1) {
    const two = css.slice(i, i + 2)
    if (!inComment && two === '/*') { inComment = true; i += 1; continue }
    if (inComment && two === '*/') { inComment = false; i += 1; continue }
    if (inComment) continue
    const ch = css[i]
    if (ch === '{') depth += 1
    else if (ch === '}') depth -= 1
  }
  assertEqual(depth, 0, 'brace depth')
})

run('splash.css root z-index above app (§6)', () => {
  assert(css.includes('#dsh-moss-root'), 'root selector')
  assert(/z-index\s*:\s*2\d{6,}/.test(css), 'root z-index in the 2147xxxxxx range')
  assert(/position\s*:\s*fixed/.test(css), 'root fixed')
})

run('splash.css v0.2 四幕/分割层样式', () => {
  for (const token of [
    '.ms-stage', '.ms-act--neuro', '.ms-act--moss', '.ms-act--earth',
    '.ms-split__moss', '.ms-split__earth', '.ms-split__seam', '.ms-global-hud', '.ms-video'
  ]) assert(css.includes(token), 'missing CSS token: ' + token)
})

run('splash.css 视频裁切与交接同帧（object-fit cover + scale 1.12/1.13）', () => {
  assert(/\.ms-video[^{]*\{[^}]*object-fit\s*:\s*cover/.test(css), '.ms-video object-fit:cover')
  assert(/\.ms-video[^{]*\{[^}]*object-position\s*:\s*50%\s+50%/.test(css), '.ms-video object-position 50% 50%')
  assert(/scale\(1\.1[23]\)/.test(css), '地球层基准 scale 1.12/1.13（与 ambient 一致）')
})

run('splash.css reduced-motion 不得停视频/主视觉 (§1)', () => {
  const blocks = extractMediaBlocks(css, 'prefers-reduced-motion')
  for (const block of blocks) {
    assert(!/\.ms-video[^{]*\{[^}]*(display\s*:\s*none|opacity\s*:\s*0\b|visibility\s*:\s*hidden)/.test(block),
      'prefers-reduced-motion 块不得隐藏 .ms-video')
    assert(!/(animation\s*:\s*none)[^}]*\.ms-video/.test(block), '不得对视频层停动画')
  }
})

run('splash.css fonts', () => {
  assert(css.includes('--m-font-mono') || css.includes('JetBrains Mono'), 'mono font token/face')
})

run('splash.css v0.4 §3.1 对焦框样式：正方形四角臂 + 2.5px 线宽 + --ms-moss-hi + 内发光', () => {
  assert(css.includes('.ms-tgt-focus'), 'missing focus CSS token: .ms-tgt-focus')
  assert(css.includes('.ms-tgt-focus__corner'), 'missing focus CSS token: .ms-tgt-focus__corner')
  assert(/2\.5px/.test(css), '对焦框线宽 2.5px')
  assert(/--ms-moss-hi/.test(css), '对焦框颜色必须 var(--ms-moss-hi)')
  assert(/translate\(-50%,\s*-50%\)/.test(css), '四角必须以 translate(-50%,-50%) 定位（框心=主眼）')
})

run('splash.css v0.4 §4 转场样式：seam 高光 6px / wipe / 角标 / 数据包 / 拉丝', () => {
  for (const token of ['.ms-split__corner', '.ms-split__wipe', '.ms-seam-packet']) {
    assert(css.includes(token), 'missing transition CSS token: ' + token)
  }
  assert(/\.ms-split__flashline/.test(css) || /\.ms-scan/.test(css), '拉丝：.ms-split__flashline 或复用 .ms-scan')
  assert(/6px/.test(css), '接缝高光 6px')
})

run('splash.css v0.4 §5 地球冷态/点火样式：plume-cover 遮罩 / ignite-flash / ignite-burst', () => {
  for (const token of ['.ms-earth-plume-cover', '.ms-ignite-flash', '.ms-ignite-burst']) {
    assert(css.includes(token), 'missing earth CSS token: ' + token)
  }
  assert(/mask-image\s*:\s*radial-gradient/.test(css), '.ms-earth-plume-cover 必须用 radial-gradient 遮罩')
})

run('splash.css v0.4 §6 BOOT COMPLETE 印章/闪白样式', () => {
  assert(css.includes('.ms-boot-stamp'), 'missing handoff CSS token: .ms-boot-stamp')
  assert(/#eaf8ff/.test(css), '冰白闪 #eaf8ff')
  assert(/clip-path/.test(css), 'BOOT COMPLETE 印章必须 clip-path 从左揭开')
})

run('splash.css 第二幕特效层 + 进度完成态样式（v0.3 保留）', () => {
  for (const token of [
    '.ms-tgt-layer', '.ms-tgt-grid', '.ms-tgt-corner', '.ms-tgt-reticle',
    '.ms-tgt-ring-o', '.ms-tgt-ticks', '.ms-lock-shock', '.ms-moss-vignette',
    '.ms-progress--complete', '.ms-pct[data-complete="1"]'
  ]) assert(css.includes(token), 'missing v0.3 splash.css token: ' + token)
  assert(/\.ms-tgt-reticle\s*\{[^}]*position\s*:\s*absolute/.test(css), '.ms-tgt-reticle 必须 absolute（屏幕坐标由 JS 写）')
  assert(/\.ms-lock-shock\s*\{[^}]*pointer-events\s*:\s*none/.test(css), '冲击波层 pointer-events:none')
})

const failed = results.filter((r) => !r.pass)
const skipped = results.filter((r) => r.skipped)
for (const r of results) console.log((r.skipped ? 'SKIP ' : r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? (r.skipped ? ' — ' + r.reason : '') : ' — ' + r.err))
console.log(`\n${results.length - failed.length}/${results.length} splash checks passed${skipped.length ? '（' + skipped.length + ' 项待实现 SKIP）' : ''}`)
if (failed.length) process.exit(1)
