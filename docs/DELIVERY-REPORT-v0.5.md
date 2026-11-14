# 交付报告 — dsh-startup-moss2 v0.5.0（动态地球 + 柔化交接 + 实录音效）

> 生成：2026-11-09（Asia/Shanghai）｜ 状态：**v0.5.0 交付**
> 权威规格：[`docs/design-spec-v0.5.md`](design-spec-v0.5.md)（v0.5 增量唯一权威，覆盖 v0.4 冲突处）
> 用户反馈原文：`_work/v05/user-feedback.md`（截图 `_work/v05/user1..4.png`）
> 验证总报告：[`docs/verify/v5/REPORT.md`](verify/v5/REPORT.md)（逐条断言 + 复跑命令）
> 本报告只给「结论 + 可核查路径 + 尚未验证的假设」，过程细节见各证据目录。

---

## 0. 一句话

用户 3 条反馈全部闭环：**① 幕 IV 地球从点火起一直是动态视频（不再有 91%→92% 的静帧硬跳）；
② 100%→UI 交接放慢为「定格 0.6s → bloom → 810ms warp 溶解 → UI 900–1150ms 分级显影」且 ambient 同帧同速；
③ MOSS 机械臂音效换成用户实录音轨（-18 帧逐帧对齐，独立 arm 总线，缺资产回退合成层）。**
总时长 12.80s → **13.90s**。`lib/index.js`/`lib/client.js` 有改 → **生效需完全退出 DSH 重开**。

## 1. 反馈逐条闭环

### 反馈 1：截图 1（91%）→截图 2（92%）切换不自然；点火后应一直动态
- **根因（真宿主复现）**：earth 素材 GOP=8.33s（4 个关键帧），10.35s 从 20.27s 回 seek 到 4.57s 的 `seeked`
  实测 12.24s 才触发（冻结 1.9s）；8.30s 的 seek 也要 1~2s。91%/92% 分别是 20.27s 冷帧与 seek 完成瞬间的亮帧。
- **修复**：
  1. `earth-720.mp4` / `earth-1080.mp4` 重编码为**短 GOP（g=15，关键帧间隔 0.5s）+ faststart**，帧内容不变
     （PSNR 720p 50.8dB / 1080p 52.1dB）；seek 实测 1.4s→10–20ms。
  2. 幕 III 冷态帧在**媒体 load 时预 seek** 到 `EARTH.coldAt=20.27`，8.30 只 `play()+0.65x`（不再现场 seek）。
  3. 点火闪光窗口 10.38–10.67 → **10.35–10.95**（0.85 峰值，覆盖 seek 完成与尾迹进入）。
  4. `__DSH_MOSS2_EARTH_STATE__` 增 `preSeeked/seekAt/seekedAt/seekMs/igniteSeekMs`。
- **证据**：`docs/verify/v5/`（earth 10.55–11.85 单调、无冻结、jet=true、10.9/11.2 帧像素差）；
  `_work/v05/splash-smith/live-final.json`（点火 seek 196ms、10.60–11.80 ct 4.654→5.793 单调、10.90 vs 11.20
  earth 区 PSNR 18.3dB）；`_work/v05/lead/accept-*/`（Lead 独立复算）。

### 反馈 2：充能 100% 切到操作界面太快太突然
- **修复**：① 100% 从 12.30 提前到 **12.10** 并**定格保持 0.60s**（到 12.70）；② 12.70–13.30 冰白 **bloom**
  （峰值 0.86，0.32s 缓升 / 0.28s 回落）；③ 13.05–13.86 启动层 **810ms warp 溶解**（opacity 1→0 + scale 1→1.03）；
  ④ UI 分级显影 620–760ms → **900–1150ms/段**（base 620→1250ms，13.05 起跑，`cubic-bezier(.22,1,.36,1)`、
  位移 18–22px、blur 8px→0）；⑤ **ambient 背景**：启动层期间暂停并预 seek 到揭示帧，13.05 与启动层地球
  同帧同速起播；`done/fallback/watchSplashDone/15.5s` 四路兜底强制恢复播放；⑥ 三层兜底同步 **17000ms**。
- **证据**：`docs/verify/v5/`（freeze 13.0 bloom≥0.6、13.4 opacity 0.72+scale>1、13.7 op 0.05、13.9 op 0；
  live 13.05–13.90 opacity 单调、ambient 13.15 前起播且帧差 ≤0.20s、enter 实测量 1250/1330/1410/1510+1000–1050ms）；
  `_work/v05/handoff-smith/live-shots/`（13.05 溶解中 / 13.4 / 13.8 UI 显影）；Lead 独立采样见 `_work/v05/lead/accept-*/`。

### 反馈 3：MOSS 机械臂音效与运动无关，用用户自制音效
- **对齐**：用户 `带音效moss机器人.mp4`（4K HEVC 30fps 6.207s）与 `moss-cinema-720.mp4` 同源同构图；
  192×108 灰度帧 MAE 唯一极小值 **-18 帧 = -0.600s**（mae 4.43 vs 次优 5.15）；用户音轨 [0.600, 5.000]
  ↔ MOSS 本地 [0, 4.40] ↔ 动画绝对 [3.90, 8.30]，逐样本零偏移。
- **资产**：`lib/assets/audio/moss-arm-sfx.m4a`（AAC-LC 48k 立体声 128k / 4.400s / 72,507B / 峰值 −1.88dBFS /
  20ms 首淡入 + 50ms 尾淡出 / 不做响度归一）。
- **混音**：arm 层走**独立总线**（`armGain=(volume/100)×1.00` → 专用软限幅 knee .55 / ceil .68 → destination，
  绕过 master comp/limiter），BGM 幕 II duck −6dB、3.86→3.94 cut −12dB；删除 v0.4 合成关节/伺服/rumble 层；
  3.90 硬切冲击保留 −3dB、7.42 锁定重音组保留 −6dB；BGM 尾段 fade 12.70→13.55；旧 12.28/12.30 shimmer 移到 12.70。
- **回退**：资产缺失/解码失败 → v0.4 合成关节层（`MOSS_ARM_FALLBACK`，console.warn 一次，探针 fallback=true）。
- **证据**：`_work/v05/audio/`（`alignment.json` / `SPEC.md` / `audio-evidence.json` / `moss2-boot-audio-v05.wav` 13.90s /
  `stem-arm-only.wav`）；arm-only 相关 0.9685（AAC 上限 0.9683）、瞬态零延迟、完整混音 −17.8 LUFS / TP −1.4dBFS、
  arm vs BGM-only 500–4k SNR 13.5dB、全带 arm vs no-arm bed +3.95dB；`docs/verify/v5/` A01–A08。

### 其它（为支撑上述反馈）
- `lib/index.js`：`ASSET_TYPES` 增 `audio/moss-arm-sfx.m4a`；BOOTSTRAP 兜底 14000→**17000**；设计权威源注释更新。
- `lib/client.js`：`FALLBACK_VERSION=0.5.0`、`SPLASH_REV=v0.5-r1`、`SPLASH_DURATION=13.9`、自举兜底 17000、
  watchSplashDone 18000、`enterUI(3000,1250)`、ambient 交接同步 + 6 字段只读探针。
- `lib/splash.css` / `lib/skin.css`：root warp 溶解支撑；显影时长/曲线/位移/blur 更新。
- `package.json` 0.5.0；`lib/assets/manifest.json` 0.5.0（earth 新哈希/短 GOP 说明 + 音频条目）；
  `preview/index.html` v0.5 重建；README / INSTALL / CHANGELOG / THIRD-PARTY-NOTICES 同步。
- 测试：5 套 smoke 更新为 v0.5 契约；`_work/verify5/` 场景矩阵 + `run-final.ps1` 一键验收器。

## 2. 冻结哈希（v0.5.0 基线）

| 文件 | 字节 | SHA256 前 16 |
|---|---|---|
| `lib/index.js` | 23,503 | 2DCFF941CAA80DA8 |
| `lib/client.js` | 75,887 | 7A5AB9AD7196689C |
| `lib/skin.css` | 95,030 | 42DF2243C24D8367 |
| `lib/splash.js` | 205,082 | FCBBD51DA8974360 |
| `lib/splash.css` | 75,489 | 2ECB6BF371B511AA |
| `preview/index.html` | 77,557 | BA8836DCB657E2AE |
| `package.json` | 1,863 | 3187526C53B4EF66 |
| `lib/assets/manifest.json` | 18,247 | CFC5A63DCB77B82B |
| `lib/assets/earth/earth-720.mp4` | 4,180,284 | 6835A6C7AEA9C854 |
| `lib/assets/earth/earth-1080.mp4` | 8,561,335 | D02EBB414F05AFED |
| `lib/assets/audio/moss-arm-sfx.m4a` | 72,507 | C3C0374B8B5881AE |

（完整哈希清单见 `docs/verify/v5/INDEX.json` 与 `_work/v05/lead/hashes.json`。）

## 3. 验收结论

**总判定：PASS，0 FAIL**（`docs/verify/v5/REPORT.md` 生成于 2026-11-09T05:28:37Z；verifier 独立于实现者）。

| 项 | 结果 | 证据 |
|---|---|---|
| A 静态测试（npm test 5 套） | **183/183 PASS**（host 37 / assets 29 / splash 67 / client 32 / css-regress 18） | `test/*.mjs`、`_work/verify5/logs/final-smoke-*.log` |
| B+C 场景矩阵（freeze/live/degrade/preview/audio） | **48/48 PASS** | `_work/verify5/json/*.json`、`_work/verify5/shots/` |
| 反馈 1 earth 动态 | 真宿主 10.60–11.80 采样 24 点推进 1.14s，**冻结 0ms / seeking 0ms / 倒退 0 次**；igniteSeek **60ms**（10.419 完成 < 10.60）；canvas 像素帧差 meanAbs 2.01、像素静帧 0ms | `_work/verify5/json/live.json`、`_work/verify5/shots/live/` |
| 反馈 2 交接柔化 | 100% 定格 12.10–12.70；bloom 13.0→0.86；13.05–13.90 root opacity 17 点 **0 次回升**（13.4=0.72 / 13.7=0.05 / 13.9=0）；ambient 13.15 前 2/2 playing，与启动层预测帧 **maxDiff 0.001s** | 同上 + `_work/v05/handoff-smith/live-shots/` |
| 反馈 3 机械臂音效 | armSfx 播放期 84 采样 **ok 100%**（gain=1@volume100、duration 4.4、arm-sfx 事件 at=3.9）；WAV 峰值 **−1.42dBFS** / TP −1.4 / 零削波；与用户音轨相关 **0.984**；1/3 倍频程 max **1.55dB**；不掩蔽双口径 14.4dB 与 +3.2dB；起播 3.893s | `_work/v05/audio/`、`_work/verify5/json/audio.json` |
| 降级矩阵 | saver 零媒体请求、系统 reduce 视频照播、sound=false 零 m4a、earth 404 双口径（全资产失败 poster 兜底 / 仅启动层失败 ambient 保证播放）、m4a 缺失 fallback=true、ESC 13.90 完成且 ambient 兜底起播；全部 0 异常 | `_work/verify5/json/degrade.json` |
| preview | 真宿主 `/dsh-moss2/preview?splash=1` 8/8，13.0/13.4/13.9 冻结跳转生效 | `_work/verify5/json/preview.json` |
| 用户截图对照 | 84/91/92/100% 灰度相关 0.889/0.687/0.707/0.738（均 >0.30）；91↔92 帧间画面仍在动 | `_work/verify5/shots/contact-user.png` |
| Lead 独立验收（串行低负载） | dev harness **15/15 PASS**、真宿主 **15/15 PASS** | `_work/v05/lead/accept-dev/report.json`、`accept-host/report.json` |

> 注：v0.5 场景矩阵必须在**无其他 headless Chrome 的安静窗口**跑（视频解码/seek 对 CPU 竞争敏感）；最终轮验收前清理了 20 个遗留实例（曾造成 539–825ms 假 seek 延迟），清理后同一宿主恢复 60ms seek / 0 冻结。时序类数字以安静窗口结果为准。

## 4. 生效方式 / 回滚

- **生效**：本版改了 `lib/index.js`（Host 半侧）与 `lib/client.js` → **完全退出 DSH（含托盘）再打开**；
  升级后首次加载因 `SPLASH_REV=v0.5-r1` 自动补播一次。用户真实配置 `daily + immersive + high + sound` 会在下次启动生效。
- **回滚**：`dsh plugin remove dsh-startup-moss2`，或恢复 `_work/backup-v0.1/`、`_work/baseline-v02/` 中的旧 `dist/`；
  v0.4 源码可从 v0.4 交付包/`_work/backup/...` 取回（本轮未动 v0.4 备份）。
- 素材版权：earth/neuro/moss 为 Wallpaper Engine 工坊素材、arm 音轨为用户自制素材，均**仅本机自用、不二次分发**；
  对外只发不含 `lib/assets/` 的代码部分。

## 5. 尚未验证的假设（诚实清单）

1. **用户本人窗口内的主观观感**（尤其 13.05–13.9 溶解 + bloom 亮度是否合口味、UI 显影 2.8s 尾部是否觉得慢）——
   CDP 真宿主已客观测量，但真人观感需用户确认。
2. **用户 desktop profile（immersive / high / daily）在真实 Electron 窗口的首次生效**——本轮用 verify profile
   （session/glass/standard）与 headless 等效配置验证；desktop profile 的配置读取链路沿用 v0.4（未改）。
3. **低端 GPU/CPU 下的 seek 与解码**——短 GOP 已把 seek 从 1.4s 降到 10–20ms（隔离实测）/196ms（真宿主并发下），
   但比本机更弱的机器上点火 seek 的覆盖余量（0.6s 闪光窗）未实测。
4. **用户音轨的听感平衡**（arm vs BGM 相对电平）——已用 stem 客观量化（arm 全带 +3.95dB vs bed、vs BGM-only 500–4k 13.5dB），
   未人工试听；若用户觉得 BGM 压得太低/太高，可直接调 `ARM_LEVEL`/`BGM_DUCK`（常量已集中）。
5. **音频回退路径的真机触发**（m4a 404/解码失败）——已在 harness 用 Fetch 拦截复现；真实 Electron 下的媒体错误码路径未实测。
6. Windows 原生标题栏（WCO 三键）叠加观感、第三方注册主题叠加、21:9 超宽屏构图余量（沿用 v0.4 结论，本轮未回归）。
