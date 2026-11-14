# MOSS2 v0.5 设计规格（用户 3 项反馈增量 · 唯一权威源）

> 生成：2026-11-09（Asia/Shanghai）｜ 状态：**v0.5 设计冻结，待实现**
> 基线：v0.4.0（`docs/design-spec-v4.md` 为 v0.4 增量权威；本文件叠加并覆盖 v0.4 冲突处）
> 用户反馈原文（3 项）见 `_work/v05/user-feedback.md`；截图见 `_work/v05/user1..4.png`
> 验收目标：用户 3 项反馈全部闭环；`test/` 静态测试 + 真宿主场景矩阵 0 FAIL；提供可复现证据。

---

## 0. 用户反馈 → 根因 → 对策（一句话版）

| # | 用户反馈 | 实测根因（2026-11-09 真宿主复现） | v0.5 对策 |
|---|---|---|---|
| 1 | 幕 IV 快结束时截图 1（91%）→截图 2（92%）切换不自然；点火（截图 3，84%）后应该一直是动态的，但 92% 前都是静帧 | **视频 seek 极慢**：earth 素材 GOP=8.33s，10.35s 从 20.27s 回 seek 到 4.57s，真宿主实测 `seeked` 事件到 **12.24s** 才触发（冻结 1.9s）；幕 III 的 8.30s seek 也要 1~2s。所以幕 III/IV 大部分时间显示的是旧帧（"图片"） | ① earth 720/1080 重编码为 **短 GOP（g=15）+ faststart**（seek 实测 1.4s→10–20ms）；② 幕 III 冷态帧在媒体 load 时**预 seek**（不再 8.30 才 seek）；③ 点火闪光窗口延长到覆盖 seek 完成（10.36–10.95）；④ 单视频元素架构不变 |
| 2 | 充能 100%（截图 4）后切到操作界面过渡太快太突然 | 12.30 100% → 12.80 启动层移除，仅 0.5s；冰白闪光 0.14s 峰值 0.92 后 420ms 淡出；ambient 背景在 11.55 交接 seek 时冻结约 1.2s，启动层移开瞬间背景是静止帧 | ① 总时长 12.80→**13.90s**；② 100% 后 **0.60s 定格保持**；③ 0.35s 缓升的**冰白 bloom**（峰值 0.86）→ **810ms warp 溶解**（opacity+scale 1.03）；④ UI 分级显影拉长到 **~1.0–1.15s/段**（base 1250ms）；⑤ ambient 在启动层期间**暂停并预 seek 到揭示帧**，13.05 与启动层同帧同速起播（零冻结、零跳帧） |
| 3 | MOSS 机械臂关节音效与运动无关；用户自制音效在 `带音效moss机器人.mp4` | 用户 mp4 与 `moss-cinema-720.mp4` **同源同构图**，帧匹配最佳偏移 **-18 帧 = -0.600s**（mad=4.43，次优 5.15，唯一极小值）：用户片 [0.60s, 5.00s] ↔ 本项目 MOSS 本地 [0, 4.40s] ↔ 绝对 [3.90s, 8.30s]，天然逐帧对齐 | 取用户 mp4 音轨 [0.60, 5.00]（4.40s）→ AAC-LC 48k 立体声 → 新资产 `audio/moss-arm-sfx.m4a`；**删除程序化关节/伺服层**，由该音轨接管 3.90–8.30；解码失败回退旧合成层（不静默） |

---

## 1. 新时间线（v0.5 唯一真值）

总长 **DURATION = 13.90s**、`DURATION_MS = 13900`、`HARD_STOP_MS = 17000`（宿主/自举兜底同步 17000）。
幕边界不变：`0 / 0.50 / 3.90 / 8.30 / 10.35 / 11.95 / 13.90`。

| 区间 | 内容 | 说明 |
|---|---|---|
| 0–12.10 | 与 v0.4 完全一致（含幕 II 对焦、幕 III 转场、幕 IV 点火） | 只改幕 IV 地球 seek 策略与点火闪光窗口 |
| 10.35–11.95 | 幕 IV：10.35 点火（seek 4.57 短 GOP 快速完成）→ 11.55 armHandoff → 11.95 幕终 | |
| 11.80 | 派发 `dsh-moss2:handoff`（detail 见 §3.3） | 不早于 11.80 |
| 11.80–12.10 | BOOT COMPLETE 印章 clip 揭开 + 完成态 | `TL.bootComplete=[11.80,12.10]` |
| **12.10** | **进度 100%**（`PROGRESS_END=12.10`；`PROGRESS_NOMINAL` 仍 12.8 保持曲线前段不变） | |
| 12.10–12.70 | **100% 定格保持 0.60s**：印章稳、HUD 已收束 | 新增 hold 段，回应用户「太快」 |
| 12.70–13.30 | **冰白 bloom**：0→0.86 `easeOut` 升至 13.02，13.02→13.30 回落；`TL.handoffFlash=[12.70,13.30]` | 比 v0.4 的 0.14s 峰值柔 |
| **13.05–13.86** | 启动层 **warp 溶解 810ms**：`opacity 1→0` + `scale 1→1.03`，`cubic-bezier(.4,0,.2,1)`；`FADE_AT=13.05`、`FADE_MS=810` | 不用 blur（性能风险） |
| 13.90 | `finish('natural')` → dispatch `dsh-moss2:done`；根节点移除 | |
| ESC 跳过 | `SKIP_AT=10.35` 不变；跳过路径照常走 10.35→13.90 | |

`PHASES` 六段：`0/0.50/3.90/8.30/10.35/11.95/13.90`；`TL.done=13.90`、`TL.preHandoff=[11.70,11.95]` 不变。
保留 `TL.splitFlashEnd=8.44`、`TL.ignt*` 等 v0.4 常量；`12.15/12.30/12.38/12.42/12.52/12.80` 全部作废。

### 1.1 进度契约
- `PROGRESS_SHOW=4.36`、`PROGRESS_KNEE=10.35`、`PROGRESS_END=12.10`、`PROGRESS_NOMINAL=12.80`（保持 0–10.35 百分比曲线与 v0.4 一致：10.35 时 83%）。
- 12.10 后 `bootProgress=1` 且保持完成态；12.10–13.90 随根层溶解。
- pct 数字 / fill / spark 仍消费同一量化值。

---

## 2. 幕 IV 地球动态化（反馈 1）

### 2.1 资产（已由 Lead 重编码，`lib/assets/earth/` 同名覆盖）
- `earth-720.mp4`：H.264 High / yuv420p / bt709 / 30fps / 900 帧 / 30.00s / **g=15**（60 关键帧）/ CRF23 / 无音轨 / faststart；实测 4,180,284 B（旧 3,319,794）。
- `earth-1080.mp4`：同上 / CRF23 / g=15；实测 8,561,335 B（旧 7,657,545）。
- 与旧片逐帧 PSNR：720p avg 50.8dB / 1080p avg 52.1dB（几乎无损，画面内容/构图/首帧不变）；海报仍有效。
- `lib/assets/manifest.json` 必须更新这两条的 `bytes/sha256/notes`（含「v0.5 短 GOP 重编码」说明），并新增 §4 音频资产条目。`lib/index.js` 的 `ASSET_TYPES` 文件名不变。

### 2.2 splash.js 行为
1. **冷态预 seek**：`setupMedia('earth', …)` 增加 `preSeek: EARTH.coldAt`（20.27）。在 `loadeddata/canplay`（readyState≥1）后立即 `currentTime = 20.27`（沿用 `pendingSeek` 机制）。`startSplit()`（8.30）**不再 seek**：只 `playMedia('earth')` + `playbackRate 0.65`；若实测 `|currentTime-20.27|>0.75` 才补一次 seek（兜底）。
2. **点火 seek**：`startEarth()`（10.35）保持 `seekMedia('earth', EARTH.jetAt=4.57)` + `playbackRate=1`。短 GOP 下真宿主实测 ~0.2s；**期望 10.60 前完成**（探针断言）。
3. **点火闪光窗口延长**：`renderEarthAct` 的 `igniteFlash` 透明度改为
   `t∈[10.35,10.95]`：`t<10.50` 时 `0.85*easeOut(seg(10.35,10.50))`；`10.50≤t≤10.55` 保持 0.85；`t>10.55` 时 `0.85*(1-seg(10.55,10.95))`；`calm` 下 ×0.5。扩散光环 ×2 起点 10.44/10.56 不变（可微调 ±0.03）。遮罩移除仍 `EARTH_IGNITE_AT=10.46`。
4. **视频属性红线**：单 earth 视频元素，`src` 不变；`playbackRate` 只允许在地球层改（MOSS 红线不变）。
5. **探针**：`__DSH_MOSS2_EARTH_STATE__` 增加字段：`preSeeked`(bool)、`seekAt`、`seekedAt`、`seekMs`、`igniteSeekMs`（10.35 那次 seek 的实测耗时）。不删除既有字段（verifier 仍断言 `phase/currentTime/jetVisible`）。
6. **验收（真宿主实测，可复现）**
   - 10.60–11.80 之间每 0.10s 采样 `video.currentTime`：必须单调递增且相邻间隔 ≥0.05s（无 >0.30s 冻结）。
   - 10.90 与 11.20 两帧截图像素差（earth 区域）> 阈值（证明画面在动）。
   - 10.70 / 11.00 / 11.30 三帧地球为**亮态 + 有等离子尾迹**（与旧 4.57–6.0s 段一致），不得再出现 20.27s 冷帧。
   - 全程无 `seeking=true` 持续 >0.35s。

---

## 3. 100% → 操作界面交接柔化（反馈 2）

### 3.1 splash 侧（`lib/splash.js` / `lib/splash.css`）
- 常量：`DURATION=13.90`、`FADE_AT=13.05`、`FADE_MS=810`、`PROGRESS_END=12.10`、里程碑
  `{bootComplete:11800, bloom:12700, fade:13050, done:13900}`。
- `TL.bootComplete=[11.80,12.10]`：印章 clip 揭开 11.86→12.10；保持到 12.70；12.70→13.05 淡出。
- `renderBootStamp`：`inWin` 至 13.10；`opa = seg(11.84,11.96)*(1-seg(12.70,13.05))`；保持期允许 1.5% scale 呼吸（≤3Hz）。
- `renderHandoffChrome`：HUD 四角/标尺/顶栏/页脚收束窗口改为 11.80→12.35（原 12.15），之后保持隐形。
- 闪光层：删除 12.30–12.52 分支，新增 §1 的 bloom 窗口（`TL.handoffFlash=[12.70,13.30]`，峰值 0.86，`#eaf8ff`）。
- `startHandoff()`（13.05）：先 `render(FADE_AT)` 补完成态帧；root 过渡
  `opacity 810ms cubic-bezier(.4,0,.2,1), transform 810ms cubic-bezier(.4,0,.2,1)`，
  `transform: scale(1.03)`，`opacity: 0`，`pointerEvents:none`；13.90 `finish('natural')`。
- `startBootComplete()`（11.80）dispatch：
  `CustomEvent('dsh-moss2:handoff', { detail: { at: 11.8, revealAt: 13.05, fadeAt: 13.05, duration: 13.9, earthAt: <数值> } })`
  其中 `earthAt` = 启动层地球视频在 13.05 时的预测 currentTime（`currentTime + (13.05-11.8)*rate`，clamp 到 [0,30)）。
- `armHandoffNow()`（11.55）：调用 `api.armHandoff(tPred, { revealIn: 13.05-11.55 })`，
  `tPred = earth.currentTime + (13.05-11.55)*playbackRate`（预测揭示帧）。API 不存在时静默跳过（保持 v0.4 契约）。
- 探针：`__DSH_MOSS2_HANDOFF__` 增加 `revealAt/fadeAt/duration/earthAtPred` 字段。

### 3.2 client / skin 侧（`lib/client.js` / `lib/skin.css`）
- 版本标记：`FALLBACK_VERSION='0.5.0'`、`SPLASH_REV='v0.5-r1'`；自举兜底 `14000→17000`；`watchSplashDone` 上限 `16000→18000`。
- `enterUIFromHandoff`：`enterUI(3000, 1250)`（约 12.05? 不：从 11.80 起算，base 1250 → 13.05 起跑）；`holdMs=3000`（class 保留到 14.80，动画已结束，无跳变）。
- `skin.css` §6 分级显影加长/放缓：每段 900–1150ms，`cubic-bezier(.22,1,.36,1)`，位移 18–22px，blur 8px→0：
  - sidebar 0ms/1000ms、topbar +80/1000、scrollBody +160/1050、composer +260/1050、decor +340/1000、centerCol glass 1200ms。
  - 保留 `--static/--calm/reduce` 兜底（static 直接终态）。
- **ambient 背景同步 + 暂停策略**：
  1. 启动层在播（`splashActive()`）时：ambient 视频 `pause()` 并置 `ambientHeld=true`；`syncPlayback` 在 held 时不得 `play()`。目的：减少并行解码（真宿主实测 幕 IV 地球曾因解码争抢 waiting 0.46s）、避免交接帧冻结。
  2. `armHandoff(t, opts)`（11.55 调用）：held 时只做 seek（目标 = `t % duration`）并保持暂停；`opts.revealIn` 存在则 `setTimeout(playVideo, revealIn*1000)`；同时 apply `--handoff` class 并在 1500ms 后移除（保持 v0.4 行为）。
  3. `dsh-moss2:handoff` 事件到达时：进入 UI 显影；若尚未排期播放，按 detail.revealAt 与 `performance.now()` 差值排期 `playVideo()`。
  4. 兜底（必须）：`dsh-moss2:done` / `dsh-moss2:fallback` / `watchSplashDone` 判定结束 / **15.5s 定时器** 任一触发 → `ambientHeld=false; playVideo()`，防止背景永久静止。
  5. 没有启动层（`splashActive()=false`）时行为与 v0.4 完全一致（常规播放）。
  6. 探针：`__DSH_MOSS2_AMBIENT_HANDOFF__ = { held, armedAt, revealIn, playAt, playedAt, ctAtArmed }`（客户端只读）。
- **帧同步验收**：揭示后（13.1–13.8）ambient `currentTime` 与启动层预测值差 ≤0.20s；ambient 在 13.15 前必须处于 playing。

### 3.3 事件 detail schema（冻结）
```js
// splash 11.80 派发
{ at: 11.8, revealAt: 13.05, fadeAt: 13.05, duration: 13.9, earthAt: <number> }
// armHandoff(t, opts) 11.55 调用：opts = { revealIn: 1.5 }
```

---

## 4. MOSS 机械臂音效（反馈 3）

### 4.1 对齐事实（Lead 已复算，audio-forge 复核）
- 用户素材：`E:\dshdesign\dsh-startup-moss2\带音效moss机器人.mp4`，3840×2160 HEVC 30fps，6.207s，音轨 PCM s16 48k 立体声（-15.9 LUFS / 真峰 -1.1dBFS）。
- 帧匹配（192×108 灰度，30fps，186 vs 150 帧，mae 最小）：
  `moss[i] ≈ user[i+18]` → **user_时间 = moss_本地时间 + 0.600s**。
- 幕 II 绝对区间 [3.90, 8.30] ↔ moss 本地 [0, 4.40] ↔ **用户音轨 [0.600, 5.000]**（4.40s）。
- 尾巴 [5.000, 5.600] 可作淡出余量（只做 60ms 尾淡出，不延长播放）。

### 4.2 资产
- `lib/assets/audio/moss-arm-sfx.m4a`：AAC-LC / 48kHz / 立体声 / 128kbps / 4.40s（允许 4.42–4.50 含首尾淡入淡出），**内容 = 用户音轨 [0.580, 5.000] 微调后**（音频负责人复核后定最终剪点并记录在案）。
- 首 20ms / 尾 50ms 余弦淡入淡出，避免爆音；不做整体响度归一（保持用户原动态），只做峰值保护（≤ -1.0 dBFS）。
- `lib/index.js` `ASSET_TYPES` 增加：`'audio/moss-arm-sfx.m4a': 'audio/mp4'`。
- `lib/assets/manifest.json` 新增条目（bytes/sha256/duration/sampleRate/channels/source 对齐说明）。

### 4.3 播放与混音
- `splash.js` 的 `buildAudioGraph(ctx, opts)` 新增 `opts.armBuffer`（AudioBuffer|null，可选 `opts.armDecodedAt`）：
  - 有 buffer：创建 `BufferSource`，`when(TL.mossIn=3.90)` 起播（offset=0，duration=min(4.40, buffer.duration)，迟到初始化按 §7-7 规则 seek），
    **走独立 arm 总线**：`armBuffer → BufferSource → armGain[(volume/100)×ARM_LEVEL=1.00] → 专用软限幅(knee 0.55/ceil 0.68) → destination`
    （**绕过合成器 master→compressor→limiter 链**，避免整曲过响/真峰超标/用户动态被压扁；依据 `_work/v05/audio/sweep-arm.json`：
    旧方案 volume=100 时 I −9.7 LUFS / True Peak +0.8dBFS；新方案 −17.8 LUFS / TP −1.4dBFS，与 v0.4 量级一致）；
    同帧 `logAudioEvent('arm-sfx', 3.900, <gain>)`，返回对象新增 `armSfx`。
  - 无 buffer：**回退** v0.4 机械关节/伺服/rumble 事件层（代码保留，`MOSS_ARM_FALLBACK=true` 分支启用），并 `console.warn` 一次，
    `__DSH_MOSS2_AUDIO_STATE__.armSfx = { ok:false, fallback:true, ... }`。
- `initAudio()` 改为：创建 ctx → `fetch(ASSET_BASE+'audio/moss-arm-sfx.m4a?v='+VERSION)` → `decodeAudioData`（3.0s 超时；真宿主实测 m4a 响应 827ms、解码完成在页面 2.27s，1.5s 余量过薄；超时只在请求挂起时生效，不影响正常路径）
  → `buildAudioGraph({offset: elapsed(), volume, duration: DURATION, armBuffer, armDecodedAt})`。加载失败/超时 → 无 buffer 路径。
  BGM/其它幕音效时间不变；`sound=false`/`volume=0`/`saver` 时不请求 m4a。
- **与既有合成层的取舍（audio-forge 实测定，`_work/v05/audio/SPEC.md` §5）**：
  - 删除：`MOSS_JOINTS` 13 条合成关节、伺服层 servo、rumble hiss、moveTimes 低频移动声（由 arm 音轨接管）。
  - BGM：`BGM_DUCK=-6dB`（3.90–8.30 静态），3.86→3.94 `BGM_CUT=-12dB` 硬切砸落；BGM 尾段 fade 12.70→13.55；
    pad 13.05 起淡出；12.28/12.30 旧 shimmer 移到 12.70（对齐 bloom）。
  - 保留：3.90 硬切冲击（−3dB）、7.42 锁定重音组（−6dB，用户音轨 7.414 已有强瞬态）、6.50–7.16 收敛 riser / 7.62 聚焦与数据 tick。
- 探针：`__DSH_MOSS2_AUDIO_STATE__.armSfx = { ok, fallback, duration, offset:3.900, gain, decodedAt }`（6 字段）；
  `__DSH_MOSS2_AUDIO_EVENTS__` 保留既有 kind，新增 `{kind:'arm-sfx', at:3.9, peak:<gain>}`；verifier 更新断言。
- 离线渲染：`_work/demo/render-audio.mjs` + `audio-render.html` 更新（页面内 fetch m4a → decodeAudioData → 传给
  `__DSH_MOSS2_BUILD_AUDIO__`），产物 WAV 时长 13.90s，供频谱/响度证据；最终证据必须用**最终 lib/splash.js** 重新渲染。
- **验收**：① arm-only 层与用户原始音轨段波形相关 ≥0.9（实测 0.9685，AAC 上限 0.9683）；② 完整混音 500–4k 1/3 倍频程
  能量差 <2dB（实测 max 1.93dB）；③ **不掩蔽口径** = arm 层 vs **BGM-only** 的 500–4k 信噪比 ≥8dB（实测 13.5dB），
  并辅以**全带** arm vs no-arm bed 能量 ≥ +3dB（实测 +3.95dB，arm 为主前景层）——注意：不采用「arm vs BGM+保留 SFX 事件床」
  的 500–4k SNR 作为判据（该床含 3.90 硬切/7.42 锁定重音等**有意保留的叙事瞬态**，属设计内声音，不是需被 arm 盖住的背景）；
  ④ 完整混音 sample peak/True Peak ≤ −1.0dBFS（实测 −1.42/−1.4），3.85–3.95 无爆音；⑤ 缺失资产时回退旧合成层且无未捕获异常；
  ⑥ 关键瞬态位置差 ≤50ms（实测 0ms）。（2026-11-09 Lead 裁决：音频不掩蔽口径取 arm vs BGM-only + 全带能量；双口径
  实测值记录在 `_work/v05/audio/audio-evidence.json` 与 `docs/verify/v5/`。补充：早期「vs BGM+SFX 床 −6.41dB」系旧 stem
  误混入回退合成层；用正确底床 `stem-noarm-bed.wav` 复测该值为 **+8.68dB**，即严格口径同样达标，但判据仍按裁决 B 执行。）

---

## 5. 降级与兼容矩阵（不得回归）

| 场景 | 期望 |
|---|---|
| `quality=saver` | 不加载任何视频/音频资产；earth 用 poster；armSfx 不加载（或加载失败静默）；进度/交接时间线 13.90s 不变 |
| `reducedMotion=true` | 只减装饰；视频照播；bloom 幅度 ×0.5；splash 时长不变 |
| 系统 `prefers-reduced-motion: reduce` | **视频照播**（红线）；时间线不变 |
| `sound=false` / `volume=0` | 不建音频图；armSfx 不请求 |
| 用户 mp4 资产缺失/解码失败 | 回退 v0.4 合成关节层；无未捕获异常；探针 fallback=true |
| earth 视频 404/解码失败 | poster 兜底；交接照常完成（ambient 保证播放） |
| ESC 跳过 | 10.35 起播，13.90 完成；skip 期间 ambient held 逻辑仍生效，兜底 15.5s 必播 |
| 宿主兜底 | index.js BOOTSTRAP 17000ms、splash HARD_STOP 17000ms、client 17000ms，三层一致 |
| 升级/重播 | `SPLASH_REV=v0.5-r1`、`FALLBACK_VERSION=0.5.0`、package.json 0.5.0；`lib/index.js` 改动需宿主重载 |

---

## 6. 验收矩阵（0 FAIL 才算交付）

A. **静态测试**：`npm test`（5 套）全部更新到 v0.5 契约且 PASS；
B. **dev harness 逐相位截图**：`?splash=1&t=<秒>`（t=10.35/10.46/10.7/11.0/11.3/11.8/12.1/12.7/13.0/13.4/13.7）+ 每帧目检 + 断言：
   - 10.7/11.0/11.3 地球亮态+尾迹；
   - 12.1 100% + BOOT COMPLETE；
   - 12.7–13.05 bloom；13.3 溶解中；13.9 无根；
C. **真宿主 live 路径**（verify host 57123）：earth 动态探针 + 交接 opacity 单调 + ambient 播放同步 + 无异常 + 截图 84%/91%/92%/100% 对照用户原截图；
D. **音频证据**：离线渲染 WAV 13.90s + 用户音轨段相关性/频段分析 + 频段对比 ≥8dB；
E. **独立性**：verifier 不只看实现探针，另用像素差/音频 FFT/网络请求等独立手段复核；
F. **文档**：design-spec-v0.5（本文件）、DELIVERY-REPORT-v0.5、CHANGELOG、README/INSTALL、`_重启接续.md`、assets-report 增量、verify/v5/REPORT.md。

---

## 7. 写范围（并发纪律 · 严禁越界）

| 角色 | 写范围 |
|---|---|
| Lead | `lib/index.js`、`package.json`、`lib/assets/manifest.json`、`docs/design-spec-v0.5.md`、`docs/DELIVERY-REPORT-v0.5.md`、`README.md`、`CHANGELOG.md`、`_重启接续.md`、`lib/assets/earth/*`（已完成）、最终合并审查 |
| splash-smith | `lib/splash.js`、`lib/splash.css`（§2 与 §3.1 全部） |
| handoff-smith | `lib/client.js`、`lib/skin.css`（§3.2 全部） |
| audio-forge | `lib/assets/audio/*`、`_work/v05/audio/*`、`_work/demo/render-audio.mjs`、`_work/demo/audio-render.html`；**Phase 2**（splash-smith 完成 §2/§3.1 后）才可写 `lib/splash.js` 音频区；音频资产/清单条目由 Lead 登记 |
| verifier | `test/*`、`_work/verify5/*`、`docs/verify/v5/*`、`preview/index.html`（含其生成脚本） |

**共享文件冲突纪律**：`lib/splash.js` 同一时段只允许一个 owner 编辑；splash-smith 完成并自测通过后再把音频区编辑权交给 audio-forge（task 依赖表达）。`lib/assets/manifest.json` 只由 Lead 改。

