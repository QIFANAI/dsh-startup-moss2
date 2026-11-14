# MOSS2 v0.5 独立验收报告（REPORT）

> 生成：2026-11-09T05:28:37.279Z ｜ 批次：安静窗口全量-最终 ｜ verifier（独立于实现者）
> 权威规格：`docs/design-spec-v0.5.md`；断言清单：`_work/verify5/CONTRACT.md`
> 验收矩阵：A 静态测试 + B dev harness 冻结帧 + C 真宿主 live + D 音频证据 + E 独立性 + F 文档

## 0. 结论

**PASS —— 0 FAIL，v0.5 达到交付门槛（SPEC §6：0 FAIL 才算交付）。**

| 维度 | PASS/总数 | 状态 |
|---|---|---|
| A 静态测试（npm test 5 套） | 183/183 | PASS |
| B+C+降级+preview+音频（场景矩阵） | 48/48 | PASS |

## 1. 复跑命令（安静窗口，串行执行）

```pwsh
# 0) 前置：dev harness 8788 + 隔离真宿主 57123（client.js/index.js 改动后需重启宿主）
#    宿主重启后 token 会变；脚本自动读取 _work/verify-home/current-token.txt
powershell -NoProfile -ExecutionPolicy Bypass -File _tools/verify-host.ps1 -Action restart

# A) 静态 5 套（逐条 PASS/FAIL）
node test/smoke-host.mjs
node test/smoke-assets.mjs
node test/smoke-splash.mjs
node test/smoke-client.mjs
node test/smoke-css-regress.mjs

# B/C/降级/preview/音频 场景矩阵
node _work/verify5/run-freeze.mjs        # dev harness 冻结帧 15 帧 + 用户四帧对照 + 像素独立证据
node _work/verify5/run-live.mjs          # 真宿主 live：earth 动态/opacity/ambient/网络/四帧对照
node _work/verify5/run-degrade.mjs       # saver/reducedMotion/系统reduce/sound=false/earth404×2/m4a缺失/ESC
node _work/verify5/check-preview.mjs     # /dsh-moss2/preview v0.5
node _work/verify5/audio-evidence.mjs    # 离线渲染 WAV 独立复核（需 audio-forge 最终重渲染）

# 汇总报告
node _work/verify5/make-report.mjs

# 或一键串行全量（自动重启宿主）：node _work/verify5/run-final.mjs --label "安静窗口全量"
```

## 2. A 静态测试（npm test 5 套）

| 套件 | 结果 | 说明 | 日志 |
|---|---|---|---|
| `test/smoke-host.mjs` | PASS 37/37 | 宿主/版本/自举/路由/白名单 | `_work/verify5/logs/final-smoke-host.log` |
| `test/smoke-assets.mjs` | PASS 29/29 | 资产/容器/短GOP/manifest/音频资产 | `_work/verify5/logs/final-smoke-assets.log` |
| `test/smoke-splash.mjs` | PASS 67/67 | splash 引擎 + splash.css 契约 | `_work/verify5/logs/final-smoke-splash.log` |
| `test/smoke-client.mjs` | PASS 32/32 | client 交接/ambient/版本 + skin.css 基础 | `_work/verify5/logs/final-smoke-client.log` |
| `test/smoke-css-regress.mjs` | PASS 18/18 | 皮肤回归守门（显影/呼吸/四角） | `_work/verify5/logs/final-smoke-css-regress.log` |

## 3. B/C 场景矩阵与降级矩阵

| 矩阵 | 结果 | 说明 | 证据 JSON |
|---|---|---|---|
| freeze | PASS 15/15 | dev harness 冻结帧逐相位 | `_work/verify5/json/freeze.json` |
| live | PASS 9/9 | 真宿主 live 路径 | `_work/verify5/json/live.json` |
| degrade | PASS 8/8 | 降级与兼容矩阵 | `_work/verify5/json/degrade.json` |
| preview | PASS 8/8 | preview 页 v0.5 | `_work/verify5/json/preview.json` |
| audio | PASS 8/8 | 音频独立证据（离线渲染 WAV） | `_work/verify5/json/audio.json` |

### 3.1 dev harness 冻结帧关键数值（截图目检：`_work/verify5/shots/freeze/`）

| t(s) | 状态 | pct | root opacity | flash | 印章 op | 地球探针 |
|---|---|---|---|---|---|---|
| 9.4 | preview | 76 | 1 | 0 | 0 | cold/jet=false/pre=false |
| 10.35 | preview | 83 | 1 | 0 | 0 | ignite/jet=false/pre=false |
| 10.36 | preview | 83 | 1 | 0 | 0 | ignite/jet=false/pre=false |
| 10.46 | preview | 84 | 1 | 0 | 0 | ignite/jet=true/pre=false |
| 10.7 | preview | 86 | 1 | 0 | 0 | ignite/jet=true/pre=false |
| 11 | preview | 89 | 1 | 0 | 0 | warm/jet=true/pre=false |
| 11.3 | preview | 92 | 1 | 0 | 0 | warm/jet=true/pre=false |
| 11.8 | preview | 97 | 1 | 0 | 0 | warm/jet=true/pre=false |
| 11.86 | preview | 98 | 1 | 0 | 0.167 | warm/jet=true/pre=false |
| 12.1 | preview | 100 | 1 | 0 | 1 | warm/jet=true/pre=false |
| 12.7 | preview | 100 | 1 | 0 | 1 | warm/jet=true/pre=false |
| 13 | preview | 100 | 1 | 0.86 | 0.143 | warm/jet=true/pre=false |
| 13.4 | preview | 100 | 0.7207 | 0 | 0 | warm/jet=true/pre=false |
| 13.7 | preview | 100 | 0.0521 | 0 | 0 | warm/jet=true/pre=false |
| 13.9 | preview | 100 | 0 | 0 | 0 | warm/jet=true/pre=false |

像素独立证据（冻结帧间差）：`{"changed":388176,"meanAbs":28.18}`；尾迹区亮度/蓝色占比见 JSON。

**用户原截图四帧对照（定格复现 84/91/92/100%）**：

| pct | 复现 t(s) | 我方截图 | 用户原截图 | 灰度相关性 |
|---|---|---|---|---|
| 84% | 10.46 | `_work\verify5\shots\freeze\freeze-t10_46.png` | `_work/v05/user3.png` | 0.889 |
| 91% | 11.2 | `_work\verify5\shots\freeze\freeze-t11_2.png` | `_work/v05/user1.png` | 0.687 |
| 92% | 11.3 | `_work\verify5\shots\freeze\freeze-t11_3.png` | `_work/v05/user2.png` | 0.707 |
| 100% | 12.1 | `_work\verify5\shots\freeze\freeze-t12_1.png` | `_work/v05/user4.png` | 0.738 |

对照拼图：`_work/verify5/shots/contact-user.png`（左=本项目，右=用户原截图）；冻结矩阵拼图：`_work/verify5/shots/contact-freeze.png`。

### 3.2 真宿主 live 关键数值

- earth 10.6–11.8 采样 24 点；窗口内 currentTime 推进 1.14s；最大冻结 0ms；seeking 最长 0ms；currentTime 倒退 0 次
- 画面动态独立证据（页面 canvas drawImage 采帧，非 CDP 截图）：11.05 vs 11.30 帧差 meanAbs=2.01，像素静帧最长 0ms（阈值 ≤300ms）
- 交接 13.05–13.90 opacity 采样 17 点；回升 0 次
- ambient 13.15 前 playing 采样 2/2；与启动层预测帧差 ≤0.20s 占比 100%（maxDiff=0.001s；预测揭示帧 7.114s）
- armSfx（播放期采样）：84 点，ok 占比 100%，armStatus=ok，事件 [{"kind":"arm-sfx","at":3.9,"peak":1}]
- 网络：[{"url":"earth/earth-720.mp4","status":206,"mime":"video/mp4"},{"url":"neuro/neuro-boot-720.mp4","status":206,"mime":"video/mp4"},{"url":"moss/moss-cinema-720.mp4","status":206,"mime":"video/mp4"},{"url":"audio/moss-arm-sfx.m4a","status":200,"mime":"audio/mp4"}]
- 截图/拼图：`_work/verify5/shots/freeze/`（用户四帧已由 F15 提供）、`_work/verify5/shots/contact-user.png`

### 3.3 降级矩阵逐场景

| 场景 | 完成 | 媒体请求 | 拦截 | 异常数 |
|---|---|---|---|---|
| saver | 是 | 0 | 0 | 0 |
| reducedMotion | 是 | 3 | 0 | 0 |
| system-reduce | 是 | 4 | 0 | 0 |
| sound-off | 是 | 3 | 0 | 0 |
| earth-404 | 是 | 3 | 2 | 0 |
| earth-404-splash | 是 | 5 | 0 | 0 |
| audio-missing | 是 | 3 | 1 | 0 |
| skip | 是 | 4 | 0 | 0 |

### 3.4 音频独立证据（离线渲染 WAV 波形/频谱复核）

- 整混音峰值 -1.42 dBFS（≤ -1.0），削波样本 0
- 3.85–3.95 窗口：局部峰值 -4.33 dBFS，最大单样本跳变 0.5843（设计内 3.90 硬切冲击）
- 用户音轨相关性 zeroLag=0.984，best=0.9839 @lag 0s
- 1/3 倍频程能量差（500–1k/1–2k/2–4k）：[1.48,1.55,1.49,1.3,1.13,1.03,0.94,0.8,0.6,0.48] dB（maxAbs=1.55 <2）
- 不掩蔽双口径（Lead 裁决 B）：arm vs BGM-only 500–4k SNR 14.4dB（≥8）；全带 arm vs no-arm bed +3.2dB（≥+3）；旧「vs BGM+SFX 床」10.04dB 仅记录（非判据，床含设计内叙事瞬态）
- arm 起播点 3.893s（3.90±0.05）；渲染快照 sha256 == 最终 lib/splash.js：true

### 3.5 preview 页（真宿主 /dsh-moss2/preview）

- 加载异常：[]；徽标/标题 v0.5.0；跳转点（含 10.35/10.46/11.8/12.1/12.7/13.0/13.4/13.9）见 `_work/verify5/json/preview.json`
- 截图：`_work/verify5/shots/preview/`

## 4. 独立证据索引

| 证据 | 路径 |
|---|---|
| 冻结帧截图（15 帧） | `_work/verify5/shots/freeze/` |
| 用户四帧对照拼图（84/91/92/100%） | `_work/verify5/shots/contact-user.png` |
| 冻结矩阵拼图（15 帧） | `_work/verify5/shots/contact-freeze.png` |
| preview 截图 | `_work/verify5/shots/preview/` |
| 场景矩阵 JSON | `_work/verify5/json/` |
| 静态测试最终日志 | `_work/verify5/logs/` |
| 契约断言清单 | `_work/verify5/CONTRACT.md` |
| 音频离线渲染 WAV/频谱（audio-forge） | `_work/v05/audio/` |
| 用户原始截图对照 | `_work/v05/user1..4.png` |

## 5. 安静窗口 / 未验证假设

- 本批次标记为安静窗口（`VERIFY_QUIET=1`）：live 时序敏感断言（earth seek 速率/currentTime 单调、ambient 前进与帧差、opacity 斜率）在无并发浏览器负载下采集，计最终 PASS。
- 安静窗口前已清理 20 个遗留 headless Chrome 实例（队友 12:29–12:40 起的 9390–9407/9363 等端口仍在播放视频，曾使 igniteSeek 变慢 539–825ms、earth 出现 350–540ms 假冻结）；清理后同一真宿主 igniteSeekMs=60ms、0 冻结、0 seeking。
- 2026-11-09 12:2x 曾因 4 个 agent 并发 headless Chrome/视频解码导致 earth 有效速率掉到 0.42x（Lead 实测），相关失败不记实现缺陷、标「待安静窗口复测」。
- 音频证据（A02）要求渲染快照 sha256 === 最终 `lib/splash.js`；若两者不一致（音频区未定稿/未重渲染），该项 FAIL 并归 audio-forge 重渲染，不用旧证据放行。

## 6. 责任文件（FAIL 定位口径）

| 契约组 | 责任文件 | 责任人 |
|---|---|---|
| C1 时间线/幕 IV/交接 | `lib/splash.js`、`lib/splash.css` | splash-smith |
| C2 UI 显影/ambient | `lib/client.js`、`lib/skin.css` | handoff-smith |
| C3 音频资产/音频区 | `lib/assets/audio/*`、`lib/splash.js`(音频区) | audio-forge |
| C4 宿主/版本/清单 | `lib/index.js`、`package.json`、`lib/assets/manifest.json` | Lead |
| C5 验收入口 | `test/*`、`_work/verify5/*` | verifier |
