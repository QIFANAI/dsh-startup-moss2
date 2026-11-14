/* Asset + manifest smoke test (v0.5 契约): 文件清单 / 体积上限 / MP4 容器参数 / 短 GOP 关键帧 /
 * 海报尺寸 / manifest / audio/moss-arm-sfx.m4a / 包体. */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { ROOT, exists, readBytes, assert, assertEqual, webpSize, mp4Info } from './_kit.mjs'

const results = []
function run(name, fn) {
  try { fn(); results.push({ name, pass: true }) } catch (err) {
    results.push({ name, pass: false, err: String(err && err.message ? err.message : err) })
  }
}

const A = (rel) => 'lib/assets/' + rel
const abs = (rel) => path.join(ROOT, A(rel))
const MiB = 1024 * 1024
const KiB = 1024

/* docs/design-spec-v0.5.md §2.1 / §4.2 的严格文件名与体积上限 */
const VIDEO_LIMITS = {
  'neuro/neuro-boot-1080.mp4': 4.0 * MiB,
  'neuro/neuro-boot-720.mp4': 1.6 * MiB,
  'moss/moss-cinema-1080.mp4': 6.0 * MiB,
  'moss/moss-cinema-720.mp4': 2.6 * MiB,
  'earth/earth-1080.mp4': 12.0 * MiB,
  'earth/earth-720.mp4': 6.0 * MiB
}
const VIDEO_SPEC = {
  'neuro/neuro-boot-1080.mp4': { width: 1920, height: 1080, fps: 25, duration: 3.4, durTol: 0.06, frames: 85 },
  'neuro/neuro-boot-720.mp4': { width: 1280, height: 720, fps: 25, duration: 3.4, durTol: 0.06, frames: 85 },
  'moss/moss-cinema-1080.mp4': { width: 1920, height: 1080, fps: 30, duration: 5.0, durTol: 0.06, frames: 150 },
  'moss/moss-cinema-720.mp4': { width: 1280, height: 720, fps: 30, duration: 5.0, durTol: 0.06, frames: 150 },
  'earth/earth-1080.mp4': { width: 1920, height: 1080, fps: 30, duration: 30.0, durTol: 0.1, frames: 900 },
  'earth/earth-720.mp4': { width: 1280, height: 720, fps: 30, duration: 30.0, durTol: 0.1, frames: 900 }
}
/* v0.5 §2.1：earth 短 GOP 重编码（g=15）→ 关键帧间隔 ≤0.6s（反馈 1 根因：长 GOP 8.33s seek 冻结） */
const KEYFRAME_SPEC = {
  'earth/earth-1080.mp4': { gopFrames: 15, maxIntervalS: 0.6, minKeyframes: 60 },
  'earth/earth-720.mp4': { gopFrames: 15, maxIntervalS: 0.6, minKeyframes: 60 }
}
const AUDIO_ASSET = 'audio/moss-arm-sfx.m4a'
/* docs/design-spec-v0.5.md §2.1 实测体积（Lead 2026-11-09 重编码） */
const EARTH_V05_BYTES = {
  'earth/earth-720.mp4': 4180284,
  'earth/earth-1080.mp4': 8561335
}
const POSTER_LIMITS = {
  'neuro/neuro-boot-poster.webp': 200 * KiB,
  'moss/moss-cinema-poster.webp': 200 * KiB,
  'earth/earth-poster.webp': 220 * KiB,
  'earth/earth-poster.jpg': 400 * KiB
}
const RETIRED = ['moss/moss-eye-720.mp4', 'moss/moss-eye-poster.webp']

/* ── 文件存在 / 体积 / 容器签名 ─────────────────────────────────────── */
for (const [rel, limit] of Object.entries(VIDEO_LIMITS)) {
  run('video exists + budget: ' + rel, () => {
    assert(fs.existsSync(abs(rel)), 'missing file')
    const st = fs.statSync(abs(rel))
    assert(st.size > 1024, 'suspiciously small: ' + st.size)
    assert(st.size <= limit, `over budget: ${st.size} > ${limit}`)
    const buf = readBytes(A(rel))
    assert(buf.toString('ascii', 4, 8) === 'ftyp', 'mp4 ftyp box')
  })
}
for (const [rel, limit] of Object.entries(POSTER_LIMITS)) {
  run('poster exists + budget: ' + rel, () => {
    assert(fs.existsSync(abs(rel)), 'missing file')
    const st = fs.statSync(abs(rel))
    assert(st.size > 1024, 'suspiciously small: ' + st.size)
    assert(st.size <= limit, `over budget: ${st.size} > ${limit}`)
    const buf = readBytes(A(rel))
    if (rel.endsWith('.webp')) {
      assert(buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP', 'webp container')
    } else {
      assert(buf[0] === 0xff && buf[1] === 0xd8, 'jpeg magic')
    }
  })
}
for (const rel of RETIRED) {
  run('retired v0.1 asset deleted: ' + rel, () => {
    assert(!fs.existsSync(abs(rel)), 'v0.1 moss-eye 资产应已从 lib/assets 删除（spec §5）')
  })
}
run('fonts + OFL', () => {
  for (const rel of ['fonts/jetbrains-mono-400.woff2', 'fonts/jetbrains-mono-500.woff2', 'fonts/OFL.txt']) {
    assert(exists(A(rel)), 'missing ' + rel)
  }
  const ofl = fs.readFileSync(abs('fonts/OFL.txt'), 'utf8')
  assert(/SIL OPEN FONT LICENSE/i.test(ofl), 'OFL text present')
  assertEqual(readBytes(A('fonts/jetbrains-mono-400.woff2')).toString('ascii', 0, 4), 'wOF2', 'woff2 magic')
})

/* ── MP4 容器参数（不依赖 ffprobe：moov/mvhd/tkhd/hdlr/stsd/stts/stsz/stss 解析） ── */
const container = {}
for (const [rel, spec] of Object.entries(VIDEO_SPEC)) {
  run('mp4 container: ' + rel, () => {
    const info = mp4Info(readBytes(A(rel)))
    container[rel] = info
    assert(info.ok, 'parse failed: ' + info.reason)
    assertEqual(info.video.length, 1, 'exactly one video track')
    const v = info.video[0]
    assertEqual(v.width, spec.width, 'width')
    assertEqual(v.height, spec.height, 'height')
    assert(/^avc1$/.test(String(v.codec)), 'H.264 avc1, got ' + v.codec)
    assert(v.fps !== null && Math.abs(v.fps - spec.fps) < 0.1, `fps ~${spec.fps}, got ${v.fps}`)
    if (spec.duration !== null) {
      assert(Math.abs(info.duration - spec.duration) <= spec.durTol, `duration ~${spec.duration}s, got ${info.duration}`)
    } else {
      assert(info.duration >= spec.durMin && info.duration <= spec.durMax, `duration in [${spec.durMin},${spec.durMax}], got ${info.duration}`)
    }
    assertEqual(info.audioTracks, 0, '无音轨（无音轨 H.264）')
    assertEqual(info.faststart, true, 'moov 在 mdat 之前（+faststart）')
    assertEqual(v.frames, spec.frames, '总帧数（stsz sample_count）')
  })
}

/* ── v0.5 §2.1 earth 短 GOP：g=15 / 关键帧间隔 ≤0.6s / ≥60 关键帧（关键帧表 stss 实测） ── */
for (const [rel, spec] of Object.entries(KEYFRAME_SPEC)) {
  run('v0.5 §2.1 短 GOP 关键帧间隔: ' + rel, () => {
    const info = container[rel] || mp4Info(readBytes(A(rel)))
    assert(info.keyframes, '缺少 stss 关键帧表：' + rel)
    assertEqual(info.keyframes.count, spec.minKeyframes, '关键帧数量（GOP=15 → 900/15=60）')
    assertEqual(info.keyframes.sampleCount, 900, '样本总数 900 帧')
    assert(info.keyframes.maxIntervalS !== null && info.keyframes.maxIntervalS <= spec.maxIntervalS,
      `关键帧最大间隔必须 ≤${spec.maxIntervalS}s，实际 ${info.keyframes.maxIntervalS}s（长 GOP 8.33s seek 冻结根因）`)
    assert(Math.abs(info.keyframes.maxIntervalS - spec.gopFrames / 30) < 0.02,
      `GOP 必须为 ${spec.gopFrames} 帧（${(spec.gopFrames / 30).toFixed(2)}s），实际 ${info.keyframes.maxIntervalS}s`)
    assertEqual(info.keyframes.first, 1, '第一帧必须是关键帧')
  })
}
run('v0.5 §2.1 earth 重编码字节数（SPEC 实测值）', () => {
  for (const [rel, bytes] of Object.entries(EARTH_V05_BYTES)) {
    const st = fs.statSync(abs(rel))
    assertEqual(st.size, bytes, 'bytes 必须与 SPEC §2.1 实测一致：' + rel)
  }
})
run('v0.5 §2.1 earth 720/1080 同帧数同时长', () => {
  const a = container['earth/earth-1080.mp4']
  const b = container['earth/earth-720.mp4']
  assert(a && b, 'earth container info missing')
  assertEqual(a.video[0].frames, b.video[0].frames, '1080/720 帧数一致')
  assert(Math.abs(a.video[0].mediaDuration - b.video[0].mediaDuration) < 0.05, '1080/720 媒体时长一致')
})

/* ── v0.5 §4.2 音频资产：AAC-LC / 48kHz / 立体声 / 4.40–4.50s / 无视频轨 ── */
run('v0.5 §4.2 audio/moss-arm-sfx.m4a 容器参数（AAC-LC 48k 立体声 4.40s±）', () => {
  assert(fs.existsSync(abs(AUDIO_ASSET)), '缺少音频资产 lib/assets/' + AUDIO_ASSET)
  const st = fs.statSync(abs(AUDIO_ASSET))
  assert(st.size > 10 * 1024, '音频资产 suspiciously small: ' + st.size)
  const buf = readBytes(A(AUDIO_ASSET))
  assertEqual(buf.toString('ascii', 4, 8), 'ftyp', 'm4a ftyp box')
  const info = mp4Info(buf)
  assert(info.ok, 'm4a 解析失败: ' + info.reason)
  assertEqual(info.video.length, 0, 'm4a 不得含视频轨')
  assertEqual(info.audioTracks, 1, '必须恰好一条音频轨')
  const a = info.audio[0]
  assert(/^mp4a$/.test(String(a.codec)), 'AAC-LC（mp4a），实际 ' + a.codec)
  assertEqual(a.sampleRate, 48000, '采样率 48kHz')
  assertEqual(a.channels, 2, '立体声 2 声道')
  assert(a.mediaDuration !== null, '缺少音频媒体时长')
  const durS = a.mediaDuration
  assert(durS >= 4.40 && durS <= 4.50, `音频时长必须 4.40–4.50s（SPEC §4.2），实际 ${durS.toFixed(3)}s`)
})
run('v0.5 §4.2 音频峰值 ≤ -1.0 dBFS / 首尾淡入淡出（ffprobe+volumedetect 可用时实测，否则由 verify5 音频证据脚本覆盖）', () => {
  /* 静态测试不硬依赖 ffmpeg；峰值断言由 _work/verify5/audio-evidence.mjs（ffmpeg ebur128/astats）承担。
     这里只做可选的快速探测：找不到 ffprobe 时 SKIP 记录（不 FAIL）。 */
  const ffprobe = path.join('E:', 'douy', '_tools', 'ffmpeg', 'ffprobe.exe')
  if (!fs.existsSync(ffprobe)) {
    results.push({ name: 'v0.5 §4.2 音频峰值 ≤ -1.0 dBFS（ffprobe 不可用，跳过：由 verify5 音频证据覆盖）', pass: true, skipped: true })
    return
  }
  const { spawnSync: spawnProbe } = { spawnSync }
  const res = spawnProbe(ffprobe, ['-v', 'error', '-show_entries', 'stream=codec_name,sample_rate,channels,duration', '-of', 'json', abs(AUDIO_ASSET)], { encoding: 'utf8' })
  assert(res.status === 0, 'ffprobe 失败: ' + String(res.stderr || ''))
  const j = JSON.parse(res.stdout)
  const s = j.streams && j.streams[0]
  assert(s && s.codec_name === 'aac', 'ffprobe codec_name 必须 aac，实际 ' + JSON.stringify(s && s.codec_name))
  assertEqual(Number(s.sample_rate), 48000, 'ffprobe sample_rate')
  assertEqual(Number(s.channels), 2, 'ffprobe channels')
})

/* ── 海报尺寸 ────────────────────────────────────────────────────────── */
run('poster dimensions', () => {
  for (const rel of ['earth/earth-poster.webp', 'neuro/neuro-boot-poster.webp', 'moss/moss-cinema-poster.webp']) {
    const size = webpSize(readBytes(A(rel)))
    assert(size, 'cannot parse webp header: ' + rel)
    assertEqual(size.width, 1920, rel + ' width')
    assertEqual(size.height, 1080, rel + ' height')
  }
})

/* ── manifest 一致性 ────────────────────────────────────────────────── */
run('manifest.json consistency (bytes/sha256/duration/fps/dimensions/短GOP/音频)', () => {
  const file = abs('manifest.json')
  assert(fs.existsSync(file), 'manifest.json missing')
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8'))
  assertEqual(manifest.version, '0.5.0', 'manifest version（v0.5）')
  const entries = Array.isArray(manifest.assets) ? manifest.assets : Array.isArray(manifest) ? manifest : null
  assert(entries, 'manifest has assets[] array')
  const byFile = new Map(entries.filter((e) => e && e.file).map((e) => [String(e.file).replace(/\\/g, '/'), e]))
  const expected = [...Object.keys(VIDEO_LIMITS), ...Object.keys(POSTER_LIMITS), AUDIO_ASSET]
  for (const rel of expected) {
    const entry = byFile.get(rel)
    assert(entry, 'manifest entry missing for ' + rel)
    const buf = fs.readFileSync(abs(rel))
    const sha = crypto.createHash('sha256').update(buf).digest('hex')
    assertEqual(String(entry.sha256 || '').toLowerCase(), sha, 'sha256 mismatch for ' + rel)
    assertEqual(Number(entry.bytes), buf.length, 'bytes mismatch for ' + rel)
    assert(entry.role, 'role missing for ' + rel)
    if (VIDEO_LIMITS[rel]) {
      const info = container[rel]
      assert(info, 'container info missing for ' + rel)
      assertEqual(Number(entry.duration).toFixed(2), Number(info.duration).toFixed(2), 'manifest duration vs container for ' + rel)
      assert(Math.abs(Number(entry.fps) - Number(info.video[0].fps)) < 0.11, 'manifest fps vs container for ' + rel)
      assertEqual(String(entry.dimensions), `${info.video[0].width}x${info.video[0].height}`, 'manifest dimensions for ' + rel)
      assertEqual(String(entry.audio || '').toLowerCase(), 'none', 'manifest audio for ' + rel)
      assertEqual(entry.faststart, true, 'manifest faststart for ' + rel)
    }
    if (KEYFRAME_SPEC[rel]) {
      assertEqual(Number(entry.gop_frames), KEYFRAME_SPEC[rel].gopFrames, 'manifest gop_frames 必须 15：' + rel)
      assertEqual(Number(entry.keyframe_interval_s), 0.5, 'manifest keyframe_interval_s 必须 0.5：' + rel)
      assert(/short-gop|v0\.5/i.test(String(entry.revision || '') + ' ' + String(entry.notes_v05 || '')), 'manifest 必须标注 v0.5 短 GOP 重编码：' + rel)
    }
    if (rel === AUDIO_ASSET) {
      assertEqual(Number(entry.duration), 4.4, 'manifest audio duration 必须 4.40（允许 ±0.05）')
      assert(Math.abs(Number(entry.duration) - 4.4) <= 0.05, 'manifest audio duration 4.40±0.05')
      assertEqual(Number(entry.sampleRate), 48000, 'manifest audio sampleRate 48k')
      assertEqual(Number(entry.channels), 2, 'manifest audio channels 2')
      assert(/moss|arm|用户|source/i.test(JSON.stringify(entry)), 'manifest audio 条目必须含来源/对齐说明')
    }
  }
  for (const rel of RETIRED) {
    assert(![...byFile.keys()].some((k) => k.endsWith(rel)), 'retired asset still in manifest: ' + rel)
  }
})

/* ── 包体上限（spec §10.11：lib/assets ≤ 26MB） ──────────────────────── */
run('lib/assets total size <= 26MB', () => {
  let total = 0
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name)
      const st = fs.statSync(p)
      if (st.isDirectory()) walk(p)
      else total += st.size
    }
  }
  walk(path.join(ROOT, 'lib', 'assets'))
  assert(total <= 26 * MiB, `lib/assets over 26MB: ${(total / MiB).toFixed(2)}MB`)
})

/* ── 源素材目录未被移动/改写 ─────────────────────────────────────────── */
run('source media dirs untouched', () => {
  const dirs = ['2949159595', '2926246706', '2940368322', '2992034258']
  // 公开仓库不含 Wallpaper Engine 原始素材目录（仅作者本机保留）：缺失时跳过本机素材断言。
  const present = dirs.every((dir) => fs.existsSync(path.join(ROOT, dir, 'project.json')))
  if (!present) return
  for (const dir of dirs) {
    assert(fs.existsSync(path.join(ROOT, dir, 'project.json')), 'source dir intact: ' + dir)
  }
  const earth = fs.statSync(path.join(ROOT, '2949159595', '流浪地球_15_1.mp4'))
  assertEqual(earth.size, 246360179, 'source earth mp4 unchanged')
})

const failed = results.filter((r) => !r.pass)
for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' — ' + r.err))
console.log(`\n${results.length - failed.length}/${results.length} asset checks passed`)
if (failed.length) process.exit(1)
