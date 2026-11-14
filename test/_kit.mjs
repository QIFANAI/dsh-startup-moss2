/* Shared helpers for the dsh-startup-moss2 smoke tests (no external deps). */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const NODE = process.execPath

export function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8')
}

export function readBytes(rel) {
  return fs.readFileSync(path.join(ROOT, rel))
}

export function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel))
}

export function assert(cond, message) {
  if (!cond) throw new Error(message)
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
}

export function mkTmpHome(tag) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-moss2-' + tag + '-'))
  return dir
}

/** Minimal node:http incoming message. */
export function mockReq({ method = 'GET', url = '/', headers = {}, body = '' } = {}) {
  const req = new EventEmitter()
  req.method = method
  req.url = url
  req.headers = headers
  process.nextTick(() => {
    if (body) req.emit('data', Buffer.from(body))
    req.emit('end')
  })
  return req
}

/** Minimal node:http server response. */
export function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    chunks: [],
    ended: false,
    writeHead(code, headers) {
      res.statusCode = code
      if (headers) Object.assign(res.headers, headers)
      return res
    },
    end(chunk) {
      if (chunk !== undefined && chunk !== null) res.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      res.ended = true
    }
  }
  res.text = () => Buffer.concat(res.chunks).toString('utf8')
  res.json = () => JSON.parse(res.text())
  return res
}

/** Load lib/index.js against an isolated DSH_HOME. */
export async function loadHost(dshHome) {
  process.env.DSH_HOME = dshHome
  const href = pathToFileURL(path.join(ROOT, 'lib', 'index.js')).href + '?t=' + Date.now()
  return import(href)
}

/** Build a mock Cordis context wired to the mock webServer/connection. */
export function mockCtx() {
  const routes = []
  const taps = []
  const disposers = []
  const warnings = []
  const services = {
    webServer: {
      register(route) {
        routes.push(route)
        const dispose = () => {}
        return dispose
      },
      tapIndex(fn) {
        taps.push(fn)
        const dispose = () => {
          const at = taps.indexOf(fn)
          if (at !== -1) taps.splice(at, 1)
        }
        return dispose
      }
    },
    connection: {
      requestRejection() { return false }
    }
  }
  const ctx = {
    get(name) { return services[name] },
    effect(cb) { disposers.push(cb) },
    logger: { warn: (msg) => warnings.push(String(msg)) },
    _routes: routes,
    _taps: taps,
    _disposers: disposers,
    _warnings: warnings
  }
  return ctx
}

export function findRoute(routes, routePath, kind) {
  return routes.find((r) => r.path === routePath && (!kind || r.kind === kind))
}

export async function callRoute(route, opts) {
  const req = mockReq(opts)
  const res = mockRes()
  await route.handler(req, res)
  return res
}

/* ── tiny WebP dimension parser (VP8 / VP8L / VP8X) ─────────────────── */

export function webpSize(buf) {
  if (buf.length < 30) return null
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null
  const chunk = buf.toString('ascii', 12, 16)
  if (chunk === 'VP8 ') {
    // lossy: frame header at 20..; width/height are 14-bit little endian at offsets 26/28
    const w = buf.readUInt16LE(26) & 0x3fff
    const h = buf.readUInt16LE(28) & 0x3fff
    return { width: w, height: h }
  }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') {
    const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16))
    const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16))
    return { width: w, height: h }
  }
  return null
}

/* ── minimal MP4 (ISO BMFF) box walker ──────────────────────────────────
 * 只解析验证需要的字段：moov/mvhd 时长、trak/tkhd 尺寸、hdlr 轨道类型、
 * stsd 编码 fourcc、stts 恒定帧率、moov 是否在 mdat 之前（faststart）。
 * 不依赖 ffprobe / 第三方库。
 * ─────────────────────────────────────────────────────────────────────── */

function readBoxes(buf, start, end) {
  const out = []
  let off = start
  while (off + 8 <= end) {
    let size = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    let header = 8
    if (size === 1) {
      if (off + 16 > end) break
      size = Number(buf.readBigUInt64BE(off + 8))
      header = 16
    } else if (size === 0) {
      size = end - off
    }
    if (size < header || off + size > end) break
    out.push({ type, start: off, bodyStart: off + header, bodyEnd: off + size, header, size })
    off += size
  }
  return out
}

function findBox(buf, parent, type) {
  if (!parent) {
    return readBoxes(buf, 0, buf.length).find((b) => b.type === type) || null
  }
  return readBoxes(buf, parent.bodyStart, parent.bodyEnd).find((b) => b.type === type) || null
}

function findBoxes(buf, parent, type) {
  if (!parent) return readBoxes(buf, 0, buf.length).filter((b) => b.type === type)
  return readBoxes(buf, parent.bodyStart, parent.bodyEnd).filter((b) => b.type === type)
}

function readMvhd(buf, moov) {
  const mvhd = findBox(buf, moov, 'mvhd')
  if (!mvhd) return null
  const p = mvhd.bodyStart
  const version = buf[p]
  let timescale
  let duration
  if (version === 1) {
    timescale = buf.readUInt32BE(p + 20)
    duration = Number(buf.readBigUInt64BE(p + 24))
  } else {
    timescale = buf.readUInt32BE(p + 12)
    duration = buf.readUInt32BE(p + 16)
  }
  return { timescale, duration, seconds: timescale ? duration / timescale : null }
}

function readTrak(buf, trak) {
  const tkhd = findBox(buf, trak, 'tkhd')
  const mdia = findBox(buf, trak, 'mdia')
  const hdlr = mdia ? findBox(buf, mdia, 'hdlr') : null
  const mdhd = mdia ? findBox(buf, mdia, 'mdhd') : null
  const stbl = mdia ? (() => { const minf = findBox(buf, mdia, 'minf'); return minf ? findBox(buf, minf, 'stbl') : null })() : null
  const stsd = stbl ? findBox(buf, stbl, 'stsd') : null
  const stts = stbl ? findBox(buf, stbl, 'stts') : null
  let width = null
  let height = null
  if (tkhd) {
    const p = tkhd.bodyStart
    const version = buf[p]
    const whOffset = version === 1 ? p + 88 : p + 76
    if (whOffset + 8 <= tkhd.bodyEnd) {
      width = Math.round(buf.readUInt32BE(whOffset) / 65536)
      height = Math.round(buf.readUInt32BE(whOffset + 4) / 65536)
    }
  }
  let handler = null
  if (hdlr) handler = buf.toString('ascii', hdlr.bodyStart + 8, hdlr.bodyStart + 12)
  let codec = null
  let channels = null
  let sampleRate = null
  let audioBoxEnd = null
  if (stsd && stsd.bodyEnd > stsd.bodyStart + 16) {
    codec = buf.toString('ascii', stsd.bodyStart + 12, stsd.bodyStart + 16)
    /* stsd body: version/flags(4) + entry_count(4) + (size(4)+fourcc(4)+...) */
    const entryBody = stsd.bodyStart + 16
    const fourcc = buf.toString('ascii', stsd.bodyStart + 12, stsd.bodyStart + 16)
    if (fourcc === 'mp4a' || fourcc === 'alac' || fourcc === 'Opus') {
      /* sample entry: reserved(6)+data_ref_idx(2)=8 / version(2)+revision(2)+vendor(4)=8 / channels(2)+samplesize(2)+predef(2)+reserved(2)=8 / samplerate(4, 16.16) */
      channels = buf.readUInt16BE(entryBody + 16)
      const srFixed = buf.readUInt32BE(entryBody + 24)
      sampleRate = srFixed / 65536
      audioBoxEnd = entryBody + 28
    }
  }
  /* media timescale 在 mdhd（movie timescale 在 mvhd，两者可能不同；fps 必须用 mdhd） */
  let mediaTimescale = null
  let mediaDuration = null
  if (mdhd) {
    const version = buf[mdhd.bodyStart]
    if (version === 1) {
      mediaTimescale = buf.readUInt32BE(mdhd.bodyStart + 20)
      mediaDuration = Number(buf.readBigUInt64BE(mdhd.bodyStart + 24))
    } else {
      mediaTimescale = buf.readUInt32BE(mdhd.bodyStart + 12)
      mediaDuration = buf.readUInt32BE(mdhd.bodyStart + 16)
    }
  }
  let fps = null
  let sampleDelta = null
  if (stts) {
    const p = stts.bodyStart
    const entryCount = buf.readUInt32BE(p + 4)
    if (entryCount >= 1) {
      sampleDelta = buf.readUInt32BE(p + 12)
      if (sampleDelta > 0 && mediaTimescale) fps = mediaTimescale / sampleDelta
    }
  }
  /* stsz：sample_count；stss：同步样本（关键帧）序号（1-based） */
  let sampleCount = null
  let syncSamples = null
  if (stbl) {
    const stsz = findBox(buf, stbl, 'stsz')
    if (stsz) sampleCount = buf.readUInt32BE(stsz.bodyStart + 8)
    const stss = findBox(buf, stbl, 'stss')
    if (stss) {
      const n = buf.readUInt32BE(stss.bodyStart + 4)
      syncSamples = []
      for (let i = 0; i < n; i += 1) syncSamples.push(buf.readUInt32BE(stss.bodyStart + 8 + i * 4))
    }
  }
  return { handler, width, height, codec, fps, mediaTimescale, mediaDuration, channels, sampleRate, sampleCount, syncSamples, sampleDelta }
}

/** 解析 mp4 容器信息（时长/轨道/尺寸/编码/fps/faststart/关键帧间隔/音频参数）。 */
export function mp4Info(buf) {
  const top = readBoxes(buf, 0, buf.length)
  const moov = top.find((b) => b.type === 'moov')
  const mdat = top.find((b) => b.type === 'mdat')
  if (!moov) return { ok: false, reason: 'no moov' }
  const mvhd = readMvhd(buf, moov)
  const traks = findBoxes(buf, moov, 'trak').map((trak) => readTrak(buf, trak))
  const video = traks.filter((t) => t.handler === 'vide')
  const audio = traks.filter((t) => t.handler === 'soun')
  /* 关键帧间隔：相邻 sync sample 序号差 × 每帧时长（stts 恒定） */
  const v0 = video[0] || null
  let keyframes = null
  if (v0 && Array.isArray(v0.syncSamples) && v0.syncSamples.length >= 2 && v0.mediaTimescale && v0.sampleDelta) {
    const intervals = []
    for (let i = 1; i < v0.syncSamples.length; i += 1) {
      intervals.push(((v0.syncSamples[i] - v0.syncSamples[i - 1]) * v0.sampleDelta) / v0.mediaTimescale)
    }
    keyframes = {
      count: v0.syncSamples.length,
      intervals,
      maxIntervalS: intervals.length ? Math.max(...intervals) : null,
      minIntervalS: intervals.length ? Math.min(...intervals) : null,
      first: v0.syncSamples[0],
      sampleCount: v0.sampleCount
    }
  }
  return {
    ok: true,
    duration: mvhd ? mvhd.seconds : null,
    video: video.map((t) => ({ width: t.width, height: t.height, codec: t.codec, fps: t.fps === null ? null : Math.round(t.fps * 100) / 100, frames: t.sampleCount, mediaDuration: t.mediaTimescale ? t.mediaDuration / t.mediaTimescale : null })),
    audioTracks: audio.length,
    audio: audio.map((t) => ({ codec: t.codec, channels: t.channels, sampleRate: t.sampleRate, mediaDuration: t.mediaTimescale ? t.mediaDuration / t.mediaTimescale : null })),
    keyframes,
    faststart: !!(mdat && moov.start < mdat.start),
    boxes: top.map((b) => b.type)
  }
}

/** 去掉 JS/CSS 注释（用于「不得读取 prefers-reduced-motion」这类静态红线断言）。 */
export function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/([^:])\/\/[^\n]*$/gm, '$1 ')
}

/** 提取形如 `function name(...) { ... }` 的函数体（含嵌套花括号），找不到返回 null。 */
export function extractFunctionBody(src, name) {
  const re = new RegExp(`(?:function\\s+${name}\\s*\\(|(?:var|let|const)\\s+${name}\\s*=\\s*function\\s*\\()`, 'm')
  const m = re.exec(src)
  if (!m) return null
  let i = src.indexOf('{', m.index)
  if (i === -1) return null
  let depth = 0
  for (let j = i; j < src.length; j += 1) {
    const ch = src[j]
    if (ch === '{') depth += 1
    else if (ch === '}') { depth -= 1; if (depth === 0) return src.slice(i + 1, j) }
  }
  return null
}

/** 提取所有 @media (prefers-reduced-motion...) 块内容（先剥注释，避免注释里的示例误匹配）。 */
export function extractMediaBlocks(src, query = 'prefers-reduced-motion') {
  const out = []
  const clean = stripComments(src)
  const re = new RegExp(`@media[^{]*${query}[^{]*\\{`, 'g')
  let m
  while ((m = re.exec(clean))) {
    let i = m.index + m[0].length - 1
    let depth = 0
    for (let j = i; j < clean.length; j += 1) {
      const ch = clean[j]
      if (ch === '{') depth += 1
      else if (ch === '}') {
        depth -= 1
        if (depth === 0) { out.push(clean.slice(m.index, j + 1)); i = j; break }
      }
    }
    re.lastIndex = Math.max(re.lastIndex, i + 1)
  }
  return out
}
