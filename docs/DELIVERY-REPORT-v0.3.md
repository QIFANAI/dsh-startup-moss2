# 交付报告 — dsh-startup-moss2 v0.3.0（用户六项反馈 · 打光版）

> 交付日期：2026-11-07　｜　宿主实测：DeepSeek Harness 桌面版 `0.2.2-rc.1`（Electron / win32 / profile `desktop`）
> 设计权威源：[`design-spec-v3.md`](design-spec-v3.md)（v0.3 增量）＋ [`design-spec-v2.md`](design-spec-v2.md)（四幕基线）
> 宿主事实：[`host-map.md`](host-map.md)　｜　素材转码：[`assets-report.md`](assets-report.md)
> 验证方式：隔离真宿主（profile `verify`，57123）+ headless Chrome CDP 场景矩阵 + **用户真实 desktop 宿主**
> （64819，只读加载/点击）双轨验收；证据可复跑。

---

## 1. 一句话

在 v0.2「四素材四幕叙事」基础上，按用户 6 条反馈完成打光：
**品牌红眼与输入卡四角呼吸闪烁；启动进度条/百分比统一真值并真正到 100%；
第二幕新增「红色准心锁定 MOSS」五相位特效序列（本片最重的一幕）；重写程序化 BGM/机械音效并附可听 WAV；
修复 immersive 皮肤下所有下拉菜单错位/点不到的阻断 bug（用户可正常选「完全权限」「创造模式」）；
升级后刷新页面自动补播一次新启动动画，无需重启宿主。**

## 2. 用户 6 项反馈 → 兑现映射（逐条证据）

| # | 用户原话 | v0.3 兑现 | 证据 |
|---|---|---|---|
| 1 | 红圈中的红色"信号灯"呼吸闪烁 | 空态 hero 品牌徽标（MOSS 红眼 SVG，34px）与侧栏徽标（20px）红环 3.2s 呼吸 + drop-shadow 光晕 2→8px、红点 2.6s 呼吸、每 7.5s 信号灯双击；只由显式 `reducedMotion`（`--calm`）/`--static` 停止，系统 reduce 不停 | `_work/skin/v03/REPORT.md` §B、`out/anim/`、`out/blink/`；Lead 验收器 `accept-v3 --scenario ui`：`brand-eye-breathing-animation` / `brand-eye-visible-modulation`（两帧亮度差 1.6–2.3） |
| 2 | 方框中的 3 个边角呼吸闪烁 | 输入卡 `[data-composer-card]` 四角括号 3.6s 呼吸 + 每 5.4s 快速双击闪烁；focus 时加强亮度；`--calm/--static` 停、系统 reduce 不停 | `_work/skin/v03/out/` 四角对比图；accept-v3：`composer-corner-breathing-animation` / `composer-corners-visible-modulation`（两帧亮度差 3.9–4.4） |
| 3 | 进度条与数字百分比：没到 100% 就加载完成；光条要和数字同频 | `bootProgress(t)` 单一真值：pct 数字 / 填充 `scaleX` / 光点位移三者同值；光点用实测 trackWidth（修掉 v0.2 固定 frameW 错位）；进度层移入全局固定层，4.36→11.0s 持续可见，**11.0s 恰好 100% + `data-complete=1` + `BOOT COMPLETE / 加载完成`**；跳过路径单调不反向 | `_work/splash/v03/REPORT.md` §4、`_work/splash/v03/shots/f-report.json`；accept-v3：`progress-pct-fill-spark-synced`（worst=0）、`progress-100-at-11s`；t=6/8/9.4/10.2/11.2 → 51/70/82/89/100% |
| 4 | 点击左下角后页面上移错位，不点左下角时无法选择工作区/模式/权限/模型；需要创作模式、完全权限 | **根因**：`skin.css` 旧 §5.10 给 `[role="menu"]/[role="listbox"]` 加 `position:relative`，覆盖宿主 portal 的 `position:fixed` → 菜单掉进文档流（视口下方 ~433px）、`scrollHeight` 1020→1597/1792 → 页面内容上移错位、菜单点不到。修复后 immersive 下工作区/模式/模型/权限/账号菜单全部 `fixed` 于触发点附近、`scrollHeight` 恒 1020，可真实点选「完全权限」「创造模式」 | `_work/skin/v03/REPORT.md` §A（修复前/后 64819 数据）；accept-v3：`menu-immersive-权限/模式-fixed-and-no-layout-growth`、`menu-+-visible-and-no-layout-growth`、`permission-selected`；`_work/ui/live-final.mjs` 7/7 |
| 5 | 增加第二幕红色"准心"锁定 MOSS 的特效；第二幕最出彩；底层 MOSS 机器人运动不要乱改 | 第二幕新增完整序列：`TARGET SEARCH` 网格 → 四角捕获框+扫描线+3 假目标 → 弧线跟踪（刻度环/坐标/DIST/LOCK）→ 角括号收敛+`ACQUIRING` → **7.42s 锁定**（准心收口+双冲击波+±2px 震动+`LOCKED · 550W` 印章）→ 锁定后维持（呼吸/数据流/vignette）；能量包络内联 150 帧；`--calm` 只留核心锁定、系统 reduce 保留叙事（闪烁 ≤3Hz）。**MOSS 视频元素 src/currentTime/playbackRate/filter/transform 零改动**（computed filter 与 v0.2 完全一致） | `_work/splash/v03/REPORT.md` §5、`shots/f-t4.6/5.6/6.8/7.4/7.9.png`；accept-v3：`lock-reticle-near-eye`（7.42/7.9/8.6/9.4/10.2/11.2 偏差 ≤0.8px）、`act2-lock-phases-ordered`、`moss-video-untouched`；演示视频 `_work/demo/moss2-boot-demo-v3.mp4` |
| 6 | 增加合理的音效和 BGM，重点第二幕 MOSS 机器人，机械感/科技感，符合 MOSS 运动逻辑 | 程序化 WebAudio（无音频文件）：分层 BGM（48/96/55Hz sub drone + D 小调 pad，3.90 硬切 duck，第 IV 幕 F 大调解决）+ 事件化机械 SFX（伺服/液压/机械卡扣/准心收敛/锁定重音/数据 tick），第二幕与 MOSS 运动能量包络同步；床/事件双路 + 压缩 + 末级软限幅；skip/finish 300ms 淡出。可听证据 WAV：11.8s / 44.1kHz / 16bit / 立体声 | `_work/demo/moss2-boot-audio.wav`、`audio-render-report.json`、`audio-analysis.json`：peak -1.86 dBFS、True Peak -1.3 dBFS、Integrated -20.0 LUFS、LRA 3.8 LU；锁定重音比幕 II 床 RMS +6.1dB / 峰值 +8.1dB；硬切比幕 I 尾 +4.0dB；`_work/demo/render-audio.mjs` 可复现 |

## 3. 第 4 项根因诊断与修复（本轮最重要的 bug）

| 环节 | 事实 |
|---|---|
| 触发条件 | 仅 `skin=immersive`（glass 档不触发）；点开工作区/模式/+/权限/模型等下拉即出现 |
| 根因 | `lib/skin.css` §5.10 用 `html.dsh-moss-skin--immersive :where([role="menu"],[role="listbox"]){ position: relative }` 给浮层角括号做定位上下文；该选择器优先级高于宿主 `._portal_1p5el_46{ position: fixed }`，把 portal 定位容器变成文档流内元素 |
| 后果（修复前实测 64819） | 菜单 DOM 的 inline `top:433px/left:668.5px` 变为相对 body 末尾的偏移 → 菜单位于 y≈1453/1520（视口 1020），`documentElement.scrollHeight` 1020→1597（工作区）/1792（模式）；欢迎页内容上移；菜单不可点 |
| 修复 | 删除定位覆盖；角括号改为**只写 `background-image`** 画在菜单表面 + 宿主 `_material` 子层（不碰 position/inset/display/z-index） |
| 修复后（实测） | 64819：权限菜单 fixed(668.5,433)、模式 fixed(795.5,500)、模型 fixed(1266.5,497)、工作区 fixed(624.5,500)、账号 fixed(12,852)、tooltip fixed(577,547)；`scrollHeight` 恒 1020、`scrollY` 0、`elementFromPoint` 命中菜单项；57123 上真实点选「完全权限」（确认框→勾选风险→启用）与「创造模式」成功 |
| 回归守门 | `test/smoke-css-regress.mjs`（12 条，含 4 组缺陷注入反向验证）：menu/listbox/dialog 规则不得含 position/inset/top/left/right/bottom/display/float/z-index；§5.10 必须同时覆盖 `_material` 子层 |

## 4. 交付件与哈希基线（v0.3.0 冻结）

### 4.1 运行时文件

| 文件 | 字节 | SHA256 |
|---|---|---|
| `lib/index.js` | 23,277 | `CC621117FC4C40A20B23EC32B0261CCADBA18FFA6E7EF002E2F873BFC518561C`（本轮未改） |
| `lib/client.js` | 60,682 | `306DA521DB23C119D6A8E53087C2E7C0782E0D6A74527DDFDB7A0BF80BA6B061` |
| `lib/skin.css` | 86,179 | `51A4CE3BC2C66461B9B7D38573630800DDB6CE64ECDC9F76E769DD0FAFD3997F` |
| `lib/splash.js` | 135,096 | `24E0FD4582121CA51592D7803FC6EC1342B96217026CB461950C644E07E3CF2A` |
| `lib/splash.css` | 59,908 | `D49BF551B1E2276B5C23A3FB073BB6B1A8D5F7D0617B9314671EA4614E5D7655` |
| `preview/index.html` | 71,214 | `1F3FE16924E7F6A0B419A22DA284C6DBC2A50F0455AA3D21EDECDF6B7D7567B1` |
| `package.json` | 1,825 | `A5DCC4A7C588E4FD44976DE5D72F62E861486547BB06B66A497E2E7DB1DCB6FC` |

### 4.2 Web 资产（与 v0.2 完全一致，无新增/删除）

`lib/assets` 合计 15,384,802 B = 14.67 MiB（≤26MB 红线）；manifest 10 条 assets 与磁盘逐件 sha256 一致（`test/smoke-assets.mjs` 24/24）。

### 4.3 测试与工具

- `test/smoke-host.mjs` 35 条、`smoke-assets.mjs` 24 条、`smoke-splash.mjs` 28 条（v0.2 的 19 → v0.3 的 28）、
  `smoke-client.mjs` 21 条、`smoke-css-regress.mjs` **新增 12 条**（v0.3 阻断 bug/动效升级守门）。
- Lead 独立验收器：`_work/ui/accept-v3.mjs`（splash/ui/motion 三组断言 + 系统 reduce）；
  真实环境终验：`_work/ui/live-final.mjs`（64819 升级补播链路 + immersive 菜单 + 呼吸动效）。
- 音频离线渲染：`_work/demo/render-audio.mjs`（OfflineAudioContext + 同一份 `buildAudioGraph`）。

### 4.4 组合包

- `releases/dsh-startup-moss2-0.3.0.tgz`（`npm pack`）
- `dist/MOSS2-组合包.zip`（含安装说明 / 使用说明 / 本报告 / tgz / tools / SHA256 清单）

## 5. 验证结果（全部可复跑）

### 5.1 静态断言（最终冻结版本）

| 测试 | 结果 |
|---|---|
| `npm test`（5 个 smoke） | **120/120 PASS**（35 + 24 + 28 + 21 + 12） |

### 5.2 隔离真宿主场景矩阵（57123 / headless Chrome CDP）

> 运行器：`_work/verify2/run.mjs`；汇总：`_work/verify2/assertions.json`（含 lib 指纹）

| 场景 | 断言 | 结论 |
|---|---|---|
| normal | 30/30 | PASS |
| system-reduce（模拟本机系统 reduce） | 34/34 | PASS |
| skip（Esc） | 20/20 | PASS |
| missing-video（三视频 404） | 23/23 | PASS |
| saver（仅海报） | 22/22 | PASS |
| immersive | 20/20 | PASS |
| glass | 21/21 | PASS |
| preview（预览页 + v0.3 探针） | 20/20 | PASS |
| **合计** | **190/190** | **全 PASS** |

### 5.3 Lead 独立验收器（accept-v3）

- `--scenario splash`：**10/10**
- `--scenario ui`：**13/13**
- `--scenario all`：**22/22**
- `--scenario ui --reduce`（系统 prefers-reduced-motion=reduce）：**13/13**
- 全部 `exceptions=[]`；关键数值：`progress-pct-fill-spark-synced` **worst=0**、t=11.2s pct=100、
  `lock-reticle-near-eye` **偏差 0px**、菜单 fixed 且 docH 恒 1020、`moss-video-untouched`。
- 覆盖：进度三真值同值 / 11.0s=100% / 第二幕五相位顺序 / 锁定偏差 / MOSS 视频零改动 / 撤层 /
  immersive 菜单布局 / 可选完全权限 / 红眼与四角 computed animation + 两帧亮度差 / 系统 reduce 下呼吸仍在。

### 5.4 用户真实环境终验（desktop profile / 64819，只读加载）

`node _work/ui/live-final.mjs` → **7/7 PASS，连续 3 次复跑稳定**（skin-weaver 另连续 9 次 7/7）：
- 模拟用户 v0.2 旧状态（有 session/day 标记、无 rev）→ 刷新：**自动补播 v0.3 启动动画**（splashRoot=true/state=playing/upgradeReplay=true）；
- rev 写回 `v0.3-r1`；再次刷新不再补播；
- immersive 下「工作区内修改」「标准模式」菜单 fixed 且 docH 恒 1020；红眼/四角呼吸动画名正确。
- 注：client 半侧 bundle 有 `immutable` 长缓存，验实时必须禁用缓存或换新 profile（验收脚本已加 `Network.setCacheDisabled`）；
  splash.js(defer) 在真实宿主冷启动被 app 主模块阻塞 ~0.9–1.15s，补播可见延迟约 0.3–0.5s（硬下限，不影响完整动画）。

### 5.5 音频客观指标（`_work/demo/moss2-boot-audio.wav`）

| 指标 | 值 | 目标 | 结论 |
|---|---|---|---|
| 时长 / 规格 | 11.800s / 44.1kHz / 2ch / 16bit PCM | ≥11.5s | ✅ |
| 峰值 (render) | -1.86 dBFS | ≤ -1 dBFS | ✅ |
| True Peak (EBU R128) | -1.3 dBFS | ≤ -1 dBFS | ✅ |
| Integrated | -20.0 LUFS | -20…-18 | ✅ |
| LRA | 3.8 LU | ≥3 | ✅ |
| 幕 II 平铺（5.0–6.6s） | RMS -19.21 dBFS | -21…-19 | ✅ |
| 锁定重音（7.35–7.60s） | RMS -13.09 / peak -1.86（比床 +6.1dB / +8.1dB） | 比床高 5–8dB | ✅ |
| 3.90 硬切 | 比幕 I 尾 +4.01 dB | +4…6 | ✅ |
| 11.1s 后淡出 | 11.4s 后 ≤ -84 dB | 300ms 内淡出 | ✅ |

### 5.6 视觉验收（人工确认过的关键帧）

- 第二幕锁定：`_work/verify3/splash/05-t7_42.png`、`_work/demo/frame-lock.png`（LOCKED · 550W + 冲击波 + 引文）
- 进度 100%：`_work/verify3/splash/10-t11_2.png`（BOOT COMPLETE / 加载完成）
- immersive 菜单：`docs/verify/v3/ui/12-menu-immersive-权限.png`、`_work/ui/shots-live/fix-test-mode.png`
- 呼吸动效：`docs/verify/v3/skin/eye-breath-t0/t1600.png`、`corner-breath-t0/t1600.png`
- 演示视频（含音轨）：`_work/demo/moss2-boot-demo-v3.mp4`（12.31s / 1600×1000 / 30fps / AAC，音频延迟 0.322s 对齐）

### 5.7 证据归档

`docs/verify/v3/`：`REPORT.md`（353 行）+ `INDEX.json`（112 个文件/119MB，逐条 sha256，missing=0），
分 `splash/ ui/ skin/ reports/` 四目录；`reports/` 26 份结构化 JSON（accept-v3 ×4、verify2 ×9、live-final、audio ×2、splash/skin 自查各 5）。

## 6. 关键设计决策

1. **动效策略例外**：品牌红眼与输入卡四角呼吸是用户点名要的「信号灯」效果，只在显式 `reducedMotion=true`（`--calm`）/
   `--static` 停止，**系统 `prefers-reduced-motion` 不停**（本机 Windows 关系统动画恒报 reduce，v0.1 的失败根因不能重演）。
2. **第二幕只加叠加层**：MOSS 视频零改动（filter/transform/src/currentTime/playbackRate 都不动），所有新特效是 DOM/CSS
   overlay，锁定坐标复用 `computeEyePoint()`，闪烁频率全部 ≤3Hz。
3. **进度条唯一真值**：量化到 0.01 的 progress 同时驱动数字、填充、光点，避免「数字到了条没到」的观感；进度层从幕 II HUD
   移到全局固定层，才能覆盖 4.36→11.0s 全区间并真正到 100%。
4. **不重启宿主**：本轮未改 `lib/index.js`、无新资产 → 纯客户端更新刷新即生效；升级补播用 client 硬编码 `SPLASH_REV` +
   `__DSH_MOSS2_REPLAY__()` 实现，并修正了「把 boot 误判为 playing → 只写标记不补播」的时序竞态。
5. **音频可复现**：OfflineAudioContext 渲染同一份 `buildAudioGraph`，WAV 可听、可用 ffprobe/ebur128 复核。

## 7. 生效 / 安装

1. **当前用户环境（link: 安装、宿主未重启）**：直接**刷新 DSH 页面**即可 → 自动补播一次 v0.3 启动动画；
   之后想再看得去 设置 → MOSS 主题 → 重播，或临时把 `mode` 改成 `always`。
2. 组合包安装：拖 `dist/MOSS2-组合包.zip` 给 DSH，按包内 `00-给DSH的安装说明.md`（v0.3：刷新页面即可，无需重启宿主）。
3. 若之后换新版且改了 `lib/index.js`：完全退出 DSH（含托盘）再开，或 `_tools/live-reload.ps1`。

## 8. 未验证项（诚实清单，不标 ✅）

1. **真实 Electron 窗口内的最终观感**：用真实 desktop profile 的 headless 页面 + 升级补播链路实测（7/7），
   但用户窗口里的真人观感（尤其第二幕动态细节与音频听感）需用户本人确认。
2. **启动音效主观听感**：已做客观指标（响度/动态/削波）与频谱检查，未人工试听；
   真机实时 AudioContext 未录波形与离线渲染逐样本比对（节点/事件数一致）。
3. **4K / 高 DPI / 低端 GPU 性能**：第二幕新增较多叠加层，仅在 1536×960 / 1920×1020 headless 验证；
   CSS 已加 1180/700px 响应式规则，低端设备可用 `quality=saver` / `reducedMotion` 降级。
4. **长列表菜单滚动时的角括号表现**、预览版说明 modal（宿主一次性标记不可重置，同类 dialog 已验）。
5. Windows 原生标题栏（WCO 三键）与皮肤的逐帧融合（原生按键不在 DOM，无法截图断言）。
6. 系统 reduce 下第二幕「震动/冲击波」的观感强度未量化（设计为 ≤3Hz、幅度 ≤2px）。

## 9. 回滚

```powershell
# DSH 里让 agent 执行：plugin_manager remove_bundle dsh-startup-moss2
# 或：dsh plugin remove dsh-startup-moss2
```

卸载不改宿主文件；配置残留 `~/.dsh/dsh-startup-moss2.json` 可手动删。v0.2 源码与验收归档在 `_work/backup-v0.1/`、
`_work/baseline-v02/`；v0.2 组合包归档在 `_work/backup-v0.2/dist/`。
