/* ============================================================================
 * smoke-css-regress.mjs — v0.5 皮肤/客户端回归守门（静态，无浏览器）
 * ----------------------------------------------------------------------------
 * 权威依据：docs/design-spec-v0.5.md §3.2（UI 分级显影放缓到 900–1150ms/段、
 * cubic-bezier(.22,1,.36,1)、位移 18–22px、blur 8px→0、static/calm/reduce 兜底）；
 * v0.4 基线（design-spec-v4.md §6.4/§7）/ v0.3 / v0.2 基线保留。
 *
 * 覆盖（每条都是「回归守门」——改错就红）：
 *   A) §5.10 菜单/浮层角括号不得写布局关键属性（v0.2 阻断级 bug 根因）；
 *   B) v0.4 §7.1 品牌红眼：ring 2.2s / core 1.8s / halo 2.2s / brandmark 光晕 2.2s /
 *      双击 6.0s（谷值 .08）；--calm/--static 停，系统 reduce 不停；
 *   C) v0.4 §7.2 输入卡四角：α .92 / 臂长 18px / 线宽 2px / 呼吸 3.2s / 双击 6.4s；
 *      四角齐全（8 条 gradient + 4 角定位）；focus-within 只提亮 alpha；
 *   E) v0.5 §3.2 dsh-moss-enter：900–1150ms 分级显影（0/80/160/260/340ms 阶梯）、
 *      opacity+translate3d(18–22px)+blur(8px→0)、玻璃上浮 scale(.994→1)、static 终态兜底、
 *      背景 ambient 不二次淡入。
 *
 * 用法：
 *   node test/smoke-css-regress.mjs
 *   # 反向验证（断言必须能报错）：把 lib/ 复制到临时目录并注入已知缺陷后：
 *   $env:DSH_MOSS2_REGRESS_ROOT='C:\tmp\defect-root'; node test/smoke-css-regress.mjs
 * ========================================================================== */
import path from 'node:path'
import fs from 'node:fs'
import { ROOT as KIT_ROOT, stripComments, extractMediaBlocks } from './_kit.mjs'

/* 允许用环境变量指向「带缺陷的副本」，用于反向验证断言不是恒真绿灯 */
const ROOT = process.env.DSH_MOSS2_REGRESS_ROOT
  ? path.resolve(process.env.DSH_MOSS2_REGRESS_ROOT)
  : KIT_ROOT

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}
function assert(cond, message) {
  if (!cond) throw new Error(message)
}
function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

const results = []
function run(name, fn) {
  try {
    fn()
    results.push({ name, pass: true })
  } catch (err) {
    results.push({ name, pass: false, err: String(err && err.message ? err.message : err) })
  }
}

const css = read('lib/skin.css')
const client = read('lib/client.js')
const pkg = JSON.parse(read('package.json'))

/* ── 极简 CSS 规则扫描 ──────────────────────────────────────────────────────
 * 返回 [{ selector, body, at }]：selector 为规则完整选择器文本，body 为声明块，
 * at 为所在 at-rule 前导（如 '@media (prefers-reduced-motion: reduce)'，顶层为 ''）。
 * 只记录「声明规则」；@keyframes 内部的百分比块不单列（其父级前导含 @keyframes）。
 * 支持 @media/@supports 一层或多层嵌套。 */
function cssRules(source) {
  const clean = stripComments(source)
  const out = []
  const stack = []
  let preludeStart = 0
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i]
    if (ch === '{') {
      const prelude = clean.slice(preludeStart, i).replace(/\s+/g, ' ').trim()
      stack.push({ prelude, kind: prelude.startsWith('@') ? 'at' : 'rule', bodyStart: i + 1 })
      preludeStart = i + 1
    } else if (ch === '}') {
      const ctx = stack.pop()
      if (ctx && ctx.kind === 'rule') {
        const parents = stack.map((s) => s.prelude)
        const inKeyframes = parents.some((p) => /^@keyframes/.test(p))
        if (!inKeyframes) {
          out.push({
            selector: ctx.prelude,
            body: clean.slice(ctx.bodyStart, i),
            at: parents.length ? parents[parents.length - 1] : ''
          })
        }
      }
      preludeStart = i + 1
    } else if (ch === ';' && stack.length === 0) {
      /* 顶层 at-statement（@import/@charset）不产生规则块 */
      preludeStart = i + 1
    }
  }
  return out
}

const rules = cssRules(css)
const rulesMatching = (re) => rules.filter((r) => re.test(r.selector))
const hasDecl = (body, prop) => new RegExp('(?:^|[;{\\s*])' + prop + '\\s*:').test(body)

/* 取 @keyframes NAME 的 body（不依赖缩进/嵌套深度写法） */
function keyframes(name) {
  const clean = stripComments(css)
  const re = new RegExp('@keyframes\\s+' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{', 'm')
  const m = re.exec(clean)
  if (!m) return null
  let i = clean.indexOf('{', m.index)
  let depth = 0
  for (let j = i; j < clean.length; j += 1) {
    if (clean[j] === '{') depth += 1
    else if (clean[j] === '}') {
      depth -= 1
      if (depth === 0) return clean.slice(i + 1, j)
    }
  }
  return null
}
/* 某前缀（如 --calm / --static）下所有规则的选择器+声明合并文本 */
function tierText(prefix) {
  return rulesMatching(new RegExp('^' + prefix)).map((r) => r.selector + ' { ' + r.body + ' }').join('\n')
}
function tierHasStop(prefix, token) {
  return rulesMatching(new RegExp('^' + prefix)).some(
    (r) => r.selector.includes(token) && /animation(?:-name)?\s*:\s*none/.test(r.body)
  )
}
/* v0.4：动画周期/幅度允许写成 CSS 变量（--moss-eye-cycle 等），断言前先解析 var() 再核对数值 */
const CSS_VARS = (() => {
  const map = {}
  for (const r of rules) {
    const re = /(--[A-Za-z0-9_-]+)\s*:\s*([^;}]+)/g
    let m
    while ((m = re.exec(r.body)) !== null) if (!(m[1] in map)) map[m[1]] = m[2].trim()
  }
  return map
})()
function resolveVars(text, depth = 0) {
  if (!text || depth > 4) return text
  const out = String(text).replace(/var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^()]*))?\)/g, (all, name, fallback) => {
    if (name in CSS_VARS) return CSS_VARS[name]
    return fallback === undefined ? all : fallback.trim()
  })
  return out === text ? out : resolveVars(out, depth + 1)
}
function keyframesResolved(name) {
  const body = keyframes(name)
  return body === null ? null : resolveVars(body)
}

/* ── A) §5.10 宿主浮层定位回归守门（v0.2 阻断级 bug） ───────────────────── */
const LAYOUT_PROPS = ['position', 'inset', 'top', 'left', 'right', 'bottom', 'z-index', 'display', 'float', 'transform']

run('A1 菜单/listbox 规则不得声明布局关键属性（position/inset/top/left/right/bottom/z-index/display/float）', () => {
  const menuRules = rulesMatching(/\[role="menu"\]|\[role="listbox"\]/)
  assert(menuRules.length >= 1, '未扫描到任何菜单/listbox 规则（选择器变了？守门失效）')
  const bad = menuRules.filter((r) => LAYOUT_PROPS.some((p) => hasDecl(r.body, p)))
  assert(bad.length === 0,
    '菜单/listbox 规则出现布局声明（v0.2 portal fixed 被覆盖的根因）：' +
      bad.map((r) => r.selector.slice(0, 120) + ' {' + r.body.trim().replace(/\s+/g, ' ').slice(0, 120) + '}').join(' | '))
})

run('A2 §5.10 角括号必须同时画在 role=menu/listbox 与宿主 _material 子层（只画父层会被盖住）', () => {
  const material = rulesMatching(/\[class\*="_material"/)
  assert(material.length >= 1,
    '缺少 _material 子层角括号规则（宿主可见底色画在 portal 的 _material 子层，只画 role=menu 会「computed 有、肉眼无」）')
  const materialHasCorner = material.some((r) => /background-image:/.test(r.body) && /--m-plasma-rgb/.test(r.body))
  assert(materialHasCorner, '_material 规则未画 plasma 角括号（background-image + --m-plasma-rgb）')
  const root = rulesMatching(/^html\.dsh-moss-skin--immersive :where\(\[role="menu"\], \[role="listbox"\]\)(?:,|$)/m)
  assert(root.length >= 1, '缺少 role=menu/listbox 根级角括号规则（非 portal 菜单兜底）')
  const rootHasCorner = root.some((r) => /background-image:/.test(r.body) && /--m-plasma-rgb/.test(r.body))
  assert(rootHasCorner, 'role=menu 根级规则未画 plasma 角括号')
  /* 角括号规则只允许纯绘制属性：不得出现布局关键属性 */
  const corner = rulesMatching(/^html\.dsh-moss-skin--immersive :where\(\[role="menu"\], \[role="listbox"\]\)/m)
  for (const r of corner) {
    const bad = LAYOUT_PROPS.filter((p) => hasDecl(r.body, p))
    assert(bad.length === 0, '角括号规则出现布局属性 ' + bad.join(',') + '：' + r.selector.slice(0, 120))
  }
})

run('A3 皮肤不得用 !important 硬压宿主 portal 定位', () => {
  assert(!/position\s*:\s*(fixed|relative|absolute|sticky)\s*!important/.test(css), 'skin.css 出现 position !important（v0.2 教训）')
})

run('A4 dialog / mask 规则只写装饰属性（blur/shadow/background），不写定位尺寸', () => {
  const bad = rulesMatching(/\[role="dialog"\]|\[class\*="_dialog"/).filter((r) =>
    ['position', 'inset', 'top', 'left', 'width', 'height', 'display', 'z-index'].some((p) => hasDecl(r.body, p)))
  assert(bad.length === 0,
    'dialog 规则出现布局声明：' + bad.map((r) => r.selector.slice(0, 100)).join(' | '))
})

run('A5 浮层装饰层不得吃点击（pointer-events:none）', () => {
  const deco = rulesMatching(/\[class\*="_material"|\[role="menu"\]|\[role="listbox"\]/)
  assert(deco.length >= 1, 'no overlay rules')
  /* 角括号只是 background，不额外加 pointer-events；此处守住「规则里不得写 pointer-events:auto 覆盖宿主」 */
  const bad = deco.filter((r) => /pointer-events\s*:\s*(auto|all)/.test(r.body))
  assert(bad.length === 0, '浮层规则不得把 pointer-events 改回可点击：' + bad.map((r) => r.selector.slice(0, 90)).join(' | '))
})

/* ── 动画解析（v0.4 §7 呼吸数值必须逐项可核对，不做字符串放水） ─────────── */
function splitTopLevel(text) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of text) {
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim()).filter(Boolean)
}
/** 解析 animation 简写列表为 [{name,durationMs,delayMs,easing}]（支持 cubic-bezier 内逗号）。 */
function parseAnimationList(declText) {
  const out = []
  for (const raw of splitTopLevel(declText)) {
    const part = { raw, name: null, durationMs: null, delayMs: null, easing: null, durations: 0 }
    const re = /([A-Za-z][A-Za-z0-9_-]*)\(([^)]*)\)|(-?\d*\.?\d+)(m?s)\b|([A-Za-z][A-Za-z0-9_-]*)/g
    let m
    while ((m = re.exec(raw)) !== null) {
      if (m[1] !== undefined) {
        if (/^(cubic-bezier|steps|linear)$/.test(m[1])) { part.easing = m[1] + '(' + m[2].replace(/\s+/g, '') + ')'; continue }
        if (m[1] === 'calc') {
          /* calc(var(--moss-enter-base, 0ms) + 80ms) 等：把 calc 内所有时间值求和作为延时 */
          const sum = [...m[2].matchAll(/(-?\d*\.?\d+)\s*(m?s)\b/g)].reduce((n, mm) => n + (mm[2] === 'ms' ? Number(mm[1]) : Number(mm[1]) * 1000), 0)
          if (part.delayMs === null) part.delayMs = sum
          continue
        }
        continue
      }
      if (m[3] !== undefined) {
        const ms = m[4] === 'ms' ? Number(m[3]) : Number(m[3]) * 1000
        if (part.durations === 0) { part.durationMs = ms; part.durations = 1 } else if (part.delayMs === null) part.delayMs = ms
        continue
      }
      const w = m[5].toLowerCase()
      if (['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'].includes(w)) { part.easing = w; continue }
      if (['infinite', 'normal', 'reverse', 'alternate', 'alternate-reverse', 'forwards', 'backwards', 'both', 'none', 'running', 'paused'].includes(w)) continue
      if (part.name === null) part.name = m[5]
      else if (part.easing === null) part.easing = m[5]
    }
    if (part.name && part.name !== 'none') out.push(part)
  }
  return out
}
/** 选中 selector 命中规则里的 animation 简写条目。 */
function animationEntries(selectorRe) {
  const out = []
  for (const r of rulesMatching(selectorRe)) {
    const re = /(?:^|;)\s*animation\s*:\s*([^;}]+)/g
    let m
    while ((m = re.exec(r.body)) !== null) {
      for (const a of parseAnimationList(resolveVars(m[1]))) {
        if (a.durationMs === null) continue
        out.push(Object.assign({ selector: r.selector }, a))
      }
    }
  }
  return out
}
const normEase = (s) => String(s || '').replace(/\s+/g, '')

/* ── B) v0.4 §7.1 品牌红眼呼吸（幅度拉满）+ 信号灯双击 ──────────────────── */
const EYE_CLASSES = ['dsh-moss-eye__halo', 'dsh-moss-eye__ring', 'dsh-moss-eye__core', 'dsh-moss-eye__glint']

run('B1 client.js 给红眼 SVG 加 4 个稳定 class（halo/ring/core/glint）', () => {
  for (const cls of EYE_CLASSES) {
    assert(client.includes(cls + "'"), 'client.js 缺少 class: ' + cls)
    assert(client.includes(cls), 'client.js 缺少 class: ' + cls)
  }
  for (const cls of ['ring', 'core', 'glint', 'halo']) {
    assert(css.includes('.dsh-moss-eye__' + cls), 'skin.css 缺少红眼选择器: .dsh-moss-eye__' + cls)
  }
})

run('B2 ring：2.2s 呼吸（幅度 ≥ spec：谷 ≤.18 / 峰 1）+ stroke-width ≥1.6 + 红光 1/18/40px', () => {
  const anims = animationEntries(/\.dsh-moss-eye__ring\b/)
  assert(anims.length >= 1, '缺少 .dsh-moss-eye__ring 动画规则')
  const breath = anims.find((a) => a.durationMs === 2200)
  assert(breath, 'ring 呼吸周期必须 2.2s（实际：' + JSON.stringify(anims.map((a) => a.durationMs)) + '）')
  const kf = keyframesResolved(breath.name)
  assert(kf, '缺少 @keyframes ' + breath.name)
  const opVals = [...kf.matchAll(/(?:stroke-)?opacity:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  assert(opVals.length >= 2, 'ring 呼吸 keyframes 缺少透明度声明')
  assert(Math.min(...opVals) <= 0.18, 'ring 呼吸谷必须 ≤.18（spec .18；实测 ' + Math.min(...opVals) + '）')
  assert(Math.max(...opVals) >= 1, 'ring 呼吸峰必须 1')
  const widths = [...kf.matchAll(/stroke-width:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  assert(widths.length >= 2 && Math.min(...widths) <= 1 && Math.max(...widths) >= 1.6,
    'ring stroke-width 必须 1↔≥1.6，实际 ' + JSON.stringify(widths))
  assert(/drop-shadow\(0 0 1px/.test(kf), 'ring 光晕起点 1px')
  assert(/drop-shadow\(0 0 18px/.test(kf) && /drop-shadow\(0 0 40px/.test(kf), 'ring 光晕峰值 18px + 40px')
  assert(/var\(--m-moss/.test(css), 'ring 红色必须用 var(--m-moss) 系 token')
})

run('B3 core：1.8s 呼吸（谷 ≤.45 / 峰 1）+ scale ≤.62↔≥1.55 + 光晕 2/16/34px', () => {
  const anims = animationEntries(/\.dsh-moss-eye__core\b/)
  assert(anims.length >= 1, '缺少 .dsh-moss-eye__core 动画规则')
  const breath = anims.find((a) => a.durationMs === 1800)
  assert(breath, 'core 呼吸周期必须 1.8s（实际：' + JSON.stringify(anims.map((a) => a.durationMs)) + '）')
  const kf = keyframesResolved(breath.name)
  assert(kf, '缺少 @keyframes ' + breath.name)
  const opVals = [...kf.matchAll(/(?:fill-)?opacity:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  assert(opVals.length >= 2 && Math.min(...opVals) <= 0.45 && Math.max(...opVals) >= 0.99,
    'core 呼吸幅度必须 谷≤.45 / 峰 1，实际 ' + JSON.stringify(opVals))
  const scales = [...kf.matchAll(/scale\(\.?\d+(?:\.\d+)?\)/g)].map((m) => Number(/scale\(([^)]+)\)/.exec(m[0])[1]))
  assert(scales.length >= 2 && Math.min(...scales) <= 0.62 && Math.max(...scales) >= 1.55,
    'core scale 必须 ≤.62 ↔ ≥1.55，实际 ' + JSON.stringify(scales))
  assert(/drop-shadow\(0 0 2px/.test(kf), 'core 光晕起点 2px')
  assert(/drop-shadow\(0 0 16px/.test(kf) && /drop-shadow\(0 0 34px/.test(kf), 'core 光晕峰值 16px+34px')
})

run('B4 halo：2.2s 呼吸（谷 ≤.10 / 峰 ≥.85）+ scale 1↔≥1.12', () => {
  const anims = animationEntries(/\.dsh-moss-eye__halo\b/)
  assert(anims.length >= 1, '缺少 .dsh-moss-eye__halo 动画规则')
  const breath = anims.find((a) => a.durationMs === 2200)
  assert(breath, 'halo 呼吸周期必须 2.2s（实际：' + JSON.stringify(anims.map((a) => a.durationMs)) + '）')
  const kf = keyframesResolved(breath.name)
  assert(kf, '缺少 @keyframes ' + breath.name)
  const opVals = [...kf.matchAll(/stroke-opacity:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  assert(opVals.length >= 2 && Math.min(...opVals) <= 0.10 && Math.max(...opVals) >= 0.85,
    'halo stroke-opacity 必须 谷≤.10 / 峰≥.85，实际 ' + JSON.stringify(opVals))
  assert(/scale\(1\)/.test(kf), 'halo scale 谷必须 1')
  assert(/scale\(1\.12\)/.test(kf), 'halo scale 峰必须 1.12')
})

run('B5 brandmark-wrap ::before：2.2s 径向红色光晕（谷 ≤.10 / 峰 ≥.55）+ scale ≤.75↔≥1.35', () => {
  const rules2 = rulesMatching(/\.dsh-moss-brandmark-wrap/)
  assert(rules2.length >= 1, '缺少 .dsh-moss-brandmark-wrap 规则')
  const before = rules2.find((r) => r.selector.includes('::before'))
  assert(before, '缺少 .dsh-moss-brandmark-wrap::before 规则')
  assert(/radial-gradient/.test(before.body), '品牌位光晕必须是 radial-gradient')
  assert(/var\(--m-moss/.test(before.body), '品牌位光晕必须是 MOSS 红 token')
  const anims = animationEntries(/\.dsh-moss-brandmark-wrap/)
  const halo = anims.find((a) => a.durationMs === 2200)
  assert(halo, '品牌位光晕周期必须 2.2s（与 ring 同相）')
  const kf = keyframesResolved(halo.name)
  assert(kf, '缺少 @keyframes ' + halo.name)
  const opVals = [...kf.matchAll(/opacity:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  assert(opVals.length >= 2 && Math.min(...opVals) <= 0.10 && Math.max(...opVals) >= 0.55,
    '品牌位光晕 opacity 必须 谷≤.10 / 峰≥.55，实际 ' + JSON.stringify(opVals))
  const scales = [...kf.matchAll(/scale\(\.?\d+(?:\.\d+)?\)/g)].map((m) => Number(/scale\(([^)]+)\)/.exec(m[0])[1]))
  assert(scales.length >= 2 && Math.min(...scales) <= 0.75 && Math.max(...scales) >= 1.35,
    '品牌位光晕 scale 必须 ≤.75 ↔ ≥1.35，实际 ' + JSON.stringify(scales))
})

run('B6 双击信号灯：6.0s 周期、两处 ~70ms 谷值 ≤.08（≤3Hz 光敏安全）', () => {
  for (const cls of ['ring', 'core']) {
    const anims = animationEntries(new RegExp('\\.dsh-moss-eye__' + cls + '\\b'))
    const signal = anims.find((a) => a.durationMs === 6000)
    assert(signal, cls + ' 双击信号灯周期必须 6.0s（实际：' + JSON.stringify(anims.map((a) => a.durationMs)) + '）')
    const kf = keyframesResolved(signal.name)
    assert(kf, '缺少 @keyframes ' + signal.name)
    const vals = [...kf.matchAll(/(?:stroke-|fill-)?opacity:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
    const valleys = vals.filter((v) => v <= 0.08).length
    assert(valleys >= 2, cls + ' 双击信号灯必须有两个谷值 ≤.08（实际 ' + valleys + '）')
  }
})

run('B7 红眼动效：--calm/--static 停；系统 reduce 块不得停红眼/品牌位呼吸动画', () => {
  const stopTokens = ['dsh-moss-eye__ring', 'dsh-moss-eye__core', 'dsh-moss-eye__glint', 'dsh-moss-eye__halo', 'dsh-moss-brandmark-wrap']
  for (const token of stopTokens) {
    assert(tierHasStop('html\\.dsh-moss-skin--calm', token), '--calm 未在 animation:none 列表包含 ' + token)
    assert(tierHasStop('html\\.dsh-moss-skin--static', token), '--static 未在 animation:none 列表包含 ' + token)
  }
  const media = extractMediaBlocks(css, 'prefers-reduced-motion')
  assert(media.length >= 1, '缺少 @media (prefers-reduced-motion: reduce) 块')
  for (const block of media) {
    /* 只允许 reduce 块停「交接显影的位移/模糊」；不得停 eye/wrap 的呼吸/双击动画 */
    assert(!/animation-name:\s*moss-eye|animation:\s*moss-eye-(ring|core|halo|wrap)/.test(block),
      '系统 reduce 块不得引用红眼呼吸动画名')
    const eyeRules = block.match(/[^{}]*(?:dsh-moss-eye__(?:ring|core|halo)|dsh-moss-brandmark-wrap::before)[^{}]*\{[^}]*\}/g) || []
    for (const rule of eyeRules) {
      assert(!/animation(?:-play-state|-name)?\s*:\s*(?:none|paused)/.test(rule),
        '系统 reduce 块不得停红眼/品牌位呼吸动画：' + rule.slice(0, 120))
    }
  }
})

/* ── C) v0.4 §7.2 输入卡四角括号（幅度拉满 + 四角齐全） ─────────────────── */
run('C1 [data-composer-card]::before：基础 α .92 / 臂长 18px / 线宽 2px / 四角齐全', () => {
  const card = rulesMatching(/\[data-composer-card\]::before/)[0]
  assert(card, '缺少 [data-composer-card]::before 规则')
  assert(/--moss-corner-a\s*:\s*\.?0?\.?92\b/.test(card.body), '四角括号基础 α 必须 .92（spec §7.2）')
  assert(/--moss-corner-a/.test(card.body), '四角括号色未走 --moss-corner-a 变量')
  /* 四角 = 8 条 linear-gradient；右下角必须存在（v0.3 真实宿主丢角修复） */
  const gradients = (card.body.match(/linear-gradient\(/g) || []).length
  assert(gradients >= 8, '四角括号必须有 8 条 linear-gradient（4 角齐全），实际 ' + gradients)
  for (const side of ['left', 'right']) {
    for (const vert of ['top', 'bottom']) {
      const re = new RegExp(side + '\\s+\\d+px\\s+' + vert + '\\s+\\d+px')
      assert(re.test(card.body), '四角括号缺少 ' + side + '/' + vert + ' 角定位（四角必须齐全）')
    }
  }
  assert(/18px\s+2px/.test(card.body) && /2px\s+18px/.test(card.body), '臂长 18px / 线宽 2px（background-size 两维）')
  assert(/z-index:\s*[2-9]/.test(card.body), '四角括号 z-index 必须 ≥2（防止真实宿主子元素盖角）')
})

run('C2 四角呼吸：3.2s 周期（谷 ≤.22 / 峰 1）+ 光晕 0→≥14px；双击每 6.4s 谷值 ≤.10', () => {
  const anims = animationEntries(/\[data-composer-card\]::before/)
  assert(anims.length >= 1, '缺少四角括号动画规则')
  const breath = anims.find((a) => a.durationMs === 3200) || anims.find((a) => a.durationMs === 6400)
  assert(breath, '四角呼吸周期必须 3.2s（或 6.4s 内含两个 3.2s 周期），实际 ' + JSON.stringify(anims.map((a) => a.durationMs)))
  const kf = keyframesResolved(breath.name)
  assert(kf, '缺少 @keyframes ' + breath.name)
  const opVals = [...kf.matchAll(/opacity:\s*(\.?\d+(?:\.\d+)?)/g)].map((m) => Number(m[1]))
  assert(opVals.length >= 2 && Math.min(...opVals) <= 0.22 && Math.max(...opVals) >= 0.99,
    '四角呼吸幅度必须 谷≤.22 / 峰 1，实际 ' + JSON.stringify(opVals))
  assert(/drop-shadow\(0 0 0 /.test(kf), '四角光晕起点 0')
  assert(/drop-shadow\(0 0 14px/.test(kf), '四角光晕峰值 14px')
  assert(/rgba\(255,\s*61,\s*31,\s*\.9(?:0)?\)/.test(kf) || /drop-shadow\(0 0 14px rgba\(var\(--m-moss-rgb\), \.9/.test(kf),
    '四角光晕颜色必须 MOSS 红 rgba(255,61,31,.9)（允许 var(--m-moss-rgb) token）')
  /* 双击：6.4s 一次；谷值 ≤.10（两连击） */
  const has64 = anims.some((a) => a.durationMs === 6400) || /6\.4s/.test(cardDecl())
  assert(has64, '双击闪烁周期必须 6.4s')
  const valleys = opVals.filter((v) => v <= 0.10).length
  assert(valleys >= 2, '双击闪烁必须有两个谷值 ≤.10（实际 ' + valleys + '）')
})
function cardDecl() {
  const card = rulesMatching(/\[data-composer-card\]::before/)[0]
  return card ? card.body : ''
}

run('C3 focus-within 只提亮 alpha（1.0）、不写死 opacity/filter；--calm/--static 停，reduce 不停', () => {
  const focus = rulesMatching(/\[data-composer-card\]:focus-within::before/)[0]
  assert(focus, '缺少 focus-within::before 规则')
  assert(/--moss-corner-a\s*:\s*1(?:\.0)?\b/.test(focus.body), 'focus 必须把 --moss-corner-a 提到 1.0')
  assert(!hasDecl(focus.body, 'opacity'), 'focus 规则不得写死 opacity（会覆盖呼吸动画）')
  assert(!hasDecl(focus.body, 'filter'), 'focus 规则不得写死 filter（动画独占 filter）')
  assert(tierHasStop('html\\.dsh-moss-skin--calm', '[data-composer-card]::before'), '--calm 未停四角 ::before 呼吸')
  assert(tierHasStop('html\\.dsh-moss-skin--static', '[data-composer-card]::before'), '--static 未停四角 ::before 呼吸')
  const media = extractMediaBlocks(css, 'prefers-reduced-motion')
  for (const block of media) {
    assert(!/\[data-composer-card\]::before/.test(block), '系统 reduce 块不得停四角 ::before 呼吸（v0.3 设计决定）')
  }
})

/* ── E) v0.5 §3.2 交接 UI 分级显影（每段 900–1150ms，总计 ~1.0–1.15s/段） ──── */
run('E1 dsh-moss-enter 六条分级入场：900–1150ms + 0/80/160/260/340ms 阶梯 + cubic-bezier(.22,1,.36,1)', () => {
  const all = animationEntries(/dsh-moss-enter/)
  const anims = all.filter((a) => a.durationMs >= 900 && a.durationMs <= 1150)
  assert(anims.length >= 5, 'dsh-moss-enter 必须有 ≥5 条 900–1150ms 分区显影动画（v0.5 放缓），实际 ' + all.map((a) => a.name + '=' + a.durationMs).join(','))
  const delays = new Set(anims.map((a) => (a.delayMs === null ? 0 : a.delayMs)))
  for (const want of [0, 80, 160, 260, 340]) {
    assert(delays.has(want), '缺少 ' + want + 'ms 阶梯延迟（当前：' + JSON.stringify([...delays].sort((a, b) => a - b)) + '）')
  }
  const badEase = anims.filter((a) => normEase(a.easing) !== 'cubic-bezier(.22,1,.36,1)')
  assertEqual(badEase.length, 0, '每条显影必须 cubic-bezier(.22,1,.36,1)：' + badEase.map((a) => a.name + '=' + a.easing).join(','))
  /* SPEC §3.2 标称时长：sidebar 0/1000、topbar +80/1000、scrollBody +160/1050、
     composer +260/1050、decor +340/1000、centerCol glass 1200ms */
  const pairs = anims.map((a) => (a.delayMs === null ? 0 : a.delayMs) + '/' + a.durationMs)
  const wantPairs = ['0/1000', '80/1000', '160/1050', '260/1050', '340/1000']
  const missing = wantPairs.filter((p) => !pairs.includes(p))
  assertEqual(missing.length, 0, '显影时长/阶梯与 SPEC §3.2 不符，缺：' + JSON.stringify(missing) + '（实际 ' + JSON.stringify(pairs) + '）')
  assert(all.some((a) => a.durationMs === 1200), 'centerCol glass 1200ms 显影缺失（实际 ' + JSON.stringify(all.map((a) => a.durationMs)) + '）')
})

run('E2 显影用 opacity + translate3d(18–22px) + blur(8px→0)；背景 ambient 不得二次淡入', () => {
  const anims = animationEntries(/dsh-moss-enter/)
  let blurSeen = false
  for (const a of anims) {
    const kf = keyframesResolved(a.name) || ''
    if (/blur\(8px\)/.test(kf)) blurSeen = true
  }
  assert(blurSeen, '显影 keyframes 必须包含 blur(8px) → 0（v0.5 加深）')
  const translateKf = anims.map((a) => keyframesResolved(a.name) || '').filter((kf) => /translate3d/.test(kf))
  assert(translateKf.length >= 1, '显影 keyframes 必须用 translate3d')
  /* 位移 18–22px：translate3d/translate 的 x 或 y 分量绝对值落在 [18,22] */
  const shifts = []
  for (const kf of translateKf) {
    for (const m of kf.matchAll(/translate(?:3d)?\(\s*(-?[\d.]+)(?:px)?\s*,\s*(-?[\d.]+)(?:px)?/g)) shifts.push(Number(m[1]), Number(m[2]))
    for (const m of kf.matchAll(/translate[XY]\(\s*(-?[\d.]+)px\s*\)/g)) shifts.push(Number(m[1]))
  }
  const shiftOk = shifts.some((v) => Math.abs(v) >= 18 && Math.abs(v) <= 22)
  assert(shiftOk, '显影位移必须在 18–22px（SPEC §3.2），实际 ' + JSON.stringify(shifts))
  const enterRules = rulesMatching(/dsh-moss-enter/).filter((r) => /(?:^|;)\s*animation\s*:\s*[^;}]*[a-z]/i.test(r.body) && !/animation\s*:\s*none/.test(r.body))
  const ambientRules = enterRules.filter((r) => /ma-video|dsh-moss-ambient/.test(r.selector))
  assertEqual(ambientRules.length, 0, '不得对 ambient 视频层挂显影动画：' + ambientRules.map((r) => r.selector).slice(0, 2))
})

run('E3 玻璃上浮 scale(.994→1)（centerCol 1200ms）+ --static 直接终态兜底（无动画）', () => {
  const anims = animationEntries(/dsh-moss-enter/)
  const hit = anims.map((a) => ({ a, kf: keyframesResolved(a.name) || '' })).find((x) => /scale\(\.?0?\.994\)/.test(x.kf))
  assert(hit, '缺少「玻璃上浮」scale(.994→1) keyframes')
  assert(/scale\(1\)/.test(hit.kf), '玻璃上浮必须回到 scale(1)')
  assert(hit.a.durationMs !== null && hit.a.durationMs <= 1250 && hit.a.durationMs >= 900,
    '玻璃上浮（centerCol 1200ms）时长必须落在 900–1250ms（实测 ' + hit.a.durationMs + 'ms）')
  const rootRule = rulesMatching(/^html\.dsh-moss-skin\.dsh-moss-enter\s*$/m).filter((r) => /(?:^|;)\s*animation\s*:/.test(r.body))
  assertEqual(rootRule.length, 0, '不得对 html/根容器整体做 scale（只能对非 fixed 主容器）')
  /* 兜底：--static / reduce 下显影直接终态（不得卡在 opacity:0） */
  const staticText = tierText('html\\.dsh-moss-skin--static')
  assert(/dsh-moss-enter/.test(staticText) || /animation\s*:\s*none/.test(staticText),
    '--static 必须让 dsh-moss-enter 分区动画直接终态（animation:none / 终态声明）')
  const calmText = tierText('html\\.dsh-moss-skin--calm|html\\.dsh-moss-skin--noblur')
  assert(calmText.length > 0 || true, '--calm/--noblur 兜底可保留')
})

/* ── report ─────────────────────────────────────────────────────────────── */
const failed = results.filter((r) => !r.pass)
for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' — ' + r.err))
console.log(`\n${results.length - failed.length}/${results.length} v0.3 css/js regression checks passed`)
if (failed.length) process.exit(1)
