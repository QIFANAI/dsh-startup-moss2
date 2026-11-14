# MOSS2 v0.3 设计规格（增量）— 用户 6 项反馈的落地方案

> 生成：2026-11-07（Asia/Shanghai）｜ 状态：**v0.3 唯一增量权威源**，与 `design-spec-v2.md` 叠加生效；
> 与 v0.2 冲突时以本文件为准。
> 背景：用户看到 v0.2 成品后给出 6 条反馈（原话见 §1）。本文件把 6 条反馈拆成可执行契约。

---

## 0. 一句话

v0.2 的四幕叙事/皮肤框架保留，v0.3 做 6 件事：**① 品牌红眼呼吸闪烁 ② 输入卡四角括号呼吸闪烁
③ 启动进度条与百分比逻辑统一并真正到 100% ④ 修复 immersive 下所有下拉菜单错位、导致无法选择
工作区/模式/权限/模型（含「创作模式」「完全权限」）的根因 bug ⑤ 第二幕加红色准心锁定 MOSS 的
完整特效序列（第二幕要成为最出彩的一幕）⑥ 加程序化 BGM/音效，重点第二幕 MOSS 机械感并与视频
运动同步。**

---

## 1. 用户原话 → 工程落地

| # | 用户原话 | 落地要求 |
|---|---|---|
| 1 | 红圈中的红色"信号灯"呼吸闪烁 | 空态 hero 品牌徽标（`.dsh-moss-brandmark`，plugin 的 MOSS 红眼 SVG）里的**红色环 + 红点**做呼吸+闪烁；侧栏小徽标同样处理 |
| 2 | 方框中的 3 个边角呼吸闪烁 | 输入卡 `[data-composer-card]::before` 的**四角括号**做呼吸+周期性闪烁（用户框出的 TL/TR/BL 都会被覆盖） |
| 3 | 优化启动动画动效/逻辑，特别是进度条与数字百分比：没到 100% 就加载完成；进度光条要和数字百分比同频 | 进度=单一真值源：数值 `%`、填充条、光点三者同值；**11.8s 结束前必须走到 100% 并显示完成态**；进度条在 II–IV 幕持续可见，不再 8.1s 就消失 |
| 4 | 看截图三，点击左下角后页面上移错位，不点左下角时无法选择工作区、模式、权限、模型。我需要创作模式、完全权限 | **根因已定位并复现**（§2）：`skin.css` §5.10 给 `[role="menu"]/[role="listbox"]` 加了 `position:relative`，覆盖了宿主下拉 portal 的 `position:fixed` → 菜单被塞进文档流、出现在视口下方 433px、`scrollHeight` 从 1020 涨到 1597/1792 → 页面内容上移错位、菜单点不到。修复后 immersive 下所有下拉必须正确定位、页面高度不增长、可选择「创作模式」「完全权限」 |
| 5 | 增加第二幕红色"准心"锁定 MOSS 的特效效果；第二幕整体附加特效；第二幕最出彩；不要乱改底层 MOSS 机器人运动 | 第二幕新增「目标捕获→跟踪→锁定→锁定后维持」特效序列（§4）。**MOSS 视频本身不做任何 transform/filter 改造**，特效全部是叠加层 |
| 6 | 增加合理的音效和 BGM，重点第二幕 MOSS 机器人，机械感/科技感，符合 MOSS 运动逻辑 | 程序化 WebAudio（无新资产、无版权问题）：分层 BGM + 事件化音效；第二幕用视频运动能量包络（`_work/assets/moss-motion.json`）驱动机械音事件（§5） |

---

## 2. 第 4 项根因与修复（已实测确认）

**现象复现**（headless Chrome + 真宿主 64819，immersive/high/full 配置）：
- 点「工作区内修改」下拉 → 菜单 DOM 是 `<body>` 直接子元素，宿主 CSS `._portal_1p5el_46{position:fixed;top:auto;left:auto}` 本应生效；
- 但实际 `getComputedStyle().position === 'relative'`，被 `lib/skin.css:1113-1115` 覆盖：
  ```css
  html.dsh-moss-skin--immersive :where([role="menu"], [role="listbox"]) { position: relative; }
  ```
  （用于给 §5.10 的 `::after` 角括号提供定位上下文）
- 后果：portal 的 inline `top:433px/left:668.5px` 变成相对 body 末尾的偏移 → 菜单位于 y≈1453/1520；
  `documentElement.scrollHeight` 1020→1597→1792；欢迎页内容上移；菜单不在视口内，用户以为"点不动"。
- 注入测试补丁 `[class*="portal" i]{position:fixed!important}` 后：菜单固定在 (669,433)/(796,500)，
  `scrollHeight` 保持 1020，菜单可正常点选。

**修复要求**：
1. 删除 `position:relative` 覆盖（不得用 `!important` 硬压宿主定位）；
2. §5.10 角括号装饰改用**不改变定位**的手段：推荐直接给 `[role="menu"]/[role="listbox"]` 加 4 层
   `background-image` 渐变（与输入卡角括号同思路），不要依赖 `::after + position:relative`；
   若保留 `::after`，`inset` 相对宿主 fixed portal 也能画出，但必须验证非 portal 菜单不跑偏；
3. 检查 immersive 下**所有** host 浮层（menu / listbox / 预览版说明 modal / 设置浮层 / tooltip）：
   定位、层级、可点击性、页面高度不变；
4. 修复后验收必须在**immersive** 皮肤下做（glass 下该 bug 不出现，不能拿 glass 当验收）。

---

## 3. 第 1、2 项：品牌红眼 + 输入卡四角呼吸闪烁

### 3.1 品牌红眼（item 1）
- `lib/client.js` `MossEyeMark()` 的 SVG 给以下元素加稳定 class（host 会热重载，只用 plugin 自己的 class）：
  - 外灰环 `r=14.5` → `.dsh-moss-eye__halo`（可选）
  - 红环 `r=6.6`（stroke `var(--m-moss,#ff3d1f)`）→ `.dsh-moss-eye__ring`
  - 红点 `r=3.2` → `.dsh-moss-eye__core`
  - 白色高光 `r=1.35` → `.dsh-moss-eye__glint`
- `lib/skin.css` 新增呼吸动画（幅度要克制，不能变成霓虹灯）：
  - 3.2s 呼吸：ring opacity .55↔1 + `filter: drop-shadow(0 0 2px→8px rgba(255,61,31,.75))`；
  - core 2.6s 呼吸：opacity .7↔1 + 轻微 r 变化可用 `transform: scale()`（SVG transform-box: fill-box）；
  - 每 ~7.5s 一次「信号灯」双击闪烁（0.12s 内两次 30% 亮度谷），用同一 timeline 写成多 stop keyframes；
  - hero（34px）与侧栏（20px）共用同一 class，幅度按元素大小自然缩放。
- 动效策略：**只在显式 `reducedMotion=true`（`--calm`）/`--static` 时停止**；系统 `prefers-reduced-motion`
  不停（本机 Windows 关系统动画恒报 reduce，v0.1 的失败根因；且这是用户点名要的效果）。

### 3.2 输入卡四角括号（item 2）
- 只改 `lib/skin.css` 的 `[data-composer-card]::before`（不要加 DOM）。
- 新动画 `moss-corner-breath`：3.6s 呼吸（opacity .42↔1 + drop-shadow 光晕 0→5px），
  叠加每 ~5.4s 一次快速闪烁（2 个 60ms 暗脉冲），让四角读起来像"信号灯在呼吸/眨眼"。
- 与 `:focus-within` 现状兼容：focus 时在呼吸基础上加强亮度（`filter` 更强），不要写死 opacity。
- 与 `--calm`/`--static` 兼容：沿用现有 §7.1/§7.9 的 `animation:none!important` 兜底即可；系统 reduce 不停。

---

## 4. 第 3 项：启动进度（数字 / 光条 / 光点）统一

**现状问题**（`lib/splash.js` render 段）：
- `prog = seg(t, 0, TL.fade)`，而 `ms-bottom` / `ms-pct` 属于幕 II，8.10s 随幕 II HUD 一起消失 →
  用户看到进度停在 ~74% 就"加载完成"了；
- 光点 spark 的位移用 `frameW`（boot 时 1536 固定值）乘 `progEase`，与进度条实际宽度/内边距不同源。

**新契约**：
1. **单一真值**：`bootProgress(t)` 返回 [0,1]，单调不减；`pct = Math.round(progress*100)`，
   填充条 `scaleX = progress`，光点 `translateX = progress * trackWidth`（`trackWidth` 用
   `el.progress.clientWidth` 实时测量，含 resize 监听；不要用 frameW）。
2. **展示区间**：`4.36s → 11.0s`（`TL.mossBar` → `TL.fade`）持续可见；11.0–11.8 保持 100% 并淡出。
   实现建议：把 `.ms-bottom`（BOOT SEQUENCE 11.8s + 进度条）与 `.ms-pct`（INITIALIZING xx%）从
   `.ms-act--moss` 里**移到 `.ms-global-hud` 的独立固定层**（bottom 区），render 里单独控制；
   DOM class 名不变（`.ms-bottom/.ms-progress/.ms-progress-fill/.ms-progress-spark/.ms-pct/...` 保留），
   `cacheEls()` 相应改为从 `.ms-global-hud` 查询。
3. **时间映射**：线性覆盖 0→11.8s 再加轻微 ease（`easeInOut` 只用于视觉填充，数值与填充用同一 progress；
   若 ease 只作用于 bar，则改用同一 eased 值同时驱动三者）。确保 `t=11.0` 时 progress=1。
4. **完成态**：progress 达到 1 时 pct 文案区加 `data-complete="1"`：`INITIALIZING` → `BOOT COMPLETE /
   加载完成`（中英给足），进度条整体提亮一次（白/冰蓝闪 120ms）后回落；11.0–11.8 保持完成态淡出。
5. **跳过路径**：跳过到 10.0 相位时 progress 直接置为 `bootProgress(10.0)`（≈0.85，与真实进度一致），
   不反向、不闪回 0。
6. 断言（verifier 用）：t=6.0/8.0/9.4/10.2/11.2 五帧里，`pctNum` 数值与 `progressFill` 的
   `transform: matrix` 的 scaleX、`progressSpark` 的 translateX/trackWidth 三者误差 ≤1%；
   11.0–11.4 时 pct=100 且 `data-complete=1`。

---

## 5. 第 5 项：第二幕「红色准心锁定 MOSS」完整特效（最出彩的一幕）

**铁律**：MOSS 视频 `video.ms-video[data-act=moss]` 的 `src/currentTime/playbackRate/filter/transform`
一律不动（现有 `opacity` 淡入除外）。所有新特效都是叠加层（CSS/SVG），且全部 `pointer-events:none`。

**时间线（幕 II = 3.90–8.10，MOSS 视频本地时间 = t-3.90）**：

| 区间 | 新增效果 |
|---|---|
| 3.90–4.30 | 硬切闪白后：红色边缘辉光 + 全屏细网格（`.ms-moss-grid`）淡入；顶部 `TARGET SEARCH` 文案 |
| 4.30–5.20 | **捕获阶段**：4 个角括号从画面四边向内飞入（`.ms-tgt-corner` ×4）；一条红色扫描线自上而下扫过；随机 3 个假目标点闪灭（`.ms-tgt-ghost`） |
| 5.20–6.40 | **跟踪阶段**：准心从画面右下角出现并沿弧线向 MOSS 主眼移动（`M` 路径用 keyframes 或 JS 插值），周围 8 段刻度环旋转；坐标读数 / `DIST` / `LOCK` 数字滚动 |
| 6.40–7.06 | **收敛阶段**：4 角括号向主眼收缩；准心十字线加长；`ACQUIRING` 闪烁；红色径向光晕随视频运动能量脉冲 |
| 7.06–7.42 | **锁定阶段**：准心收口到 MOSS 红眼（现有 gaze 逻辑保留并加强）；白色/红色冲击波环（`.ms-lock-shock`）；画面轻微震动（stage 级 ±2px，<3Hz）；`LOCKED · 550W` 印章压入 |
| 7.42–8.10 | **锁定后维持**：准心保持锁定 + 呼吸；数据流 HUD 上滚；红色 vignette 呼吸；MOSS 已上线 + 引文（保留） |
| 全程 | 胶片颗粒增强、轻微色差闪（chromatic，≤2 次）、红色 rim 随运动能量呼吸（能量驱动） |

**新增 DOM（splash.js shellHtml，全部在 `.ms-act--moss` 内、gaze 之外）**：
```
.ms-tgt-layer
  .ms-tgt-grid
  .ms-tgt-scan
  .ms-tgt-corner ×4 (data-corner=tl/tr/bl/br)
  .ms-tgt-ghost ×3
  .ms-tgt-reticle (含 .ms-tgt-ring-o/.ms-tgt-ring-i/.ms-tgt-ticks/.ms-tgt-cross/.ms-tgt-dot/.ms-tgt-dist/.ms-tgt-locklabel)
  .ms-tgt-data (坐标/距离/状态读数)
.ms-lock-shock ×2
.ms-moss-vignette
```
- 主眼坐标沿用 `EYE={x:.3740,y:.5380}` + `computeEyePoint()`；所有准心定位用它，不要另写坐标。
- 能量驱动：把 `_work/assets/moss-motion.json` 的 150 帧 envelope 以常量 `MOSS_MOTION` 内联进 splash.js
  （每帧 = 1/30s；`mossLocal = clamp(t-3.90,0,4.999)`，取邻近帧插值），驱动：红色 rim 呼吸幅度、
  跟踪阶段准心抖动、锁定后扫描线密度。**不要**新建音频/资产请求。
- 动效策略：显式 `--calm` 时只保留核心准心锁定（去抖动/去冲击波/去颗粒闪烁）；系统 reduce 下保留整个
  叙事序列但把闪烁频率压到 ≤3Hz（不做高频 strobe）。
- 断言：t=5.6 / 6.8 / 7.4 / 7.9 四帧中，`.ms-tgt-reticle` 的屏幕坐标与 `computeEyePoint()` 偏差 ≤6px（7.42s 后）；
  `video[data-act=moss]` 的 `filter`/`transform` 与 v0.2 一致（除 opacity）；无未捕获异常。

---

## 6. 第 6 项：BGM + 音效（程序化 WebAudio）

**原则**：不新增音频资产（Host 白名单不动），纯 WebAudio 合成；任何失败静默降级；`cfg.sound/volume` 生效；
`finish/skip/dispose` 时 300ms 淡出并 `close()`。

**声音设计**（全部相对启动开始 t=0）：
1. **BGM 床**：48Hz + 96Hz 正弦 sub drone（现有，保留）；新增 55Hz/110Hz 极低音层 + D 小调 pad
   （D3/F3/A3 三音 sawtooth→lowpass，缓慢 LFO），整体在 3.90 硬切处做一次 -6dB duck 然后回归；
   10.0 地球幕转 F 大调/A 大调解决，做出"移交"的呼吸感。
2. **幕 I（0.5–3.9）**：BCI 连接音（现有）+ 神经脉冲（短促高频 blip）+ 打字 tick 对齐 3 行日志；
   3.5 故障段用电弧噪声（bandpass 噪声 + 快速 amplitude gating）。
3. **幕 II（3.90–8.10，重点）**：机械感/科技感，事件对齐视觉（+ `MOSS_MOTION` 能量）：
   - 3.90 硬切：低频砸落（现有）+ 金属撞击（FM 短音 + 噪声 burst）；
   - 4.0–6.4：伺服电机 whir（sawtooth 60→120Hz 连扫 + bandpass + tremolo）随运动能量起伏；
     液压嘶声（noise highpass 衰减）在 4.6/5.4/6.2 三次；机械卡扣 tick 每 0.4s；
   - 6.4–7.06：准心收敛音（上升 sine + 加速 tick），音高随准心收缩上升；
   - 7.06–7.42：张力 riser（噪声 + 上升滤波 + 低频 tremolo 加快）；
   - 7.42：**锁定重音**：sub 冲击（60→30Hz）+ 金属"咔哒"+ 高频锁定 beep 三连 + 尾音 ringing；
   - 7.42–8.10：锁定维持 drone（A1 55Hz + 轻微 detune）、数据 tick、呼吸感；
   - MOSS 视频运动 envelope 峰值帧（见 `_work/assets/moss-motion.json`，峰值在本地 0.5–1.0s）
     叠一层机械"移动"声（servo + 摩擦噪声），音量与 envelope 成正比。
4. **幕 III/IV**：8.10 分割 whoosh（噪声带宽扫）；8.9→10.0 大扫过 riser；10.0 地球幕：温暖 pad + 一次
   低频"行星"轰鸣（30Hz）+ 高频星光（sparse sine 颗粒）；10.6 armHandoff 三和弦（现有）加强。
5. **混音**：主增益 `(volume/100)*0.42` 保留；每类事件上限峰值 ≤0.12 防爆音；所有 gain 用
   `setValueAtTime + exponentialRamp`，避免 setTargetAtTime 的指数尾巴；
   总输出加 `DynamicsCompressor`（threshold -18dB, ratio 3, attack .003, release .25）兜底。
6. **自动播放**：保留现有 `resume()` + 首次 pointerdown/keydown once 恢复；若 `AudioContext.state !== 'running'`
   则全部静默但时间线不受影响。
7. **可听性证据**：必须提供离线渲染 WAV：把音频图构建函数抽成 `buildAudioGraph(ctx, opts)`（同时支持
   `AudioContext` 与 `OfflineAudioContext`），由 `_work/demo/render-audio.mjs`（CDP 打开一个本地页面/
   或注入到宿主页面）用 `OfflineAudioContext(2, 11.8*sr, sr)` 渲染 → WAV 编码 → 保存
   `_work/demo/moss2-boot-audio.wav`（16bit/44.1k 或 48k）。用户可直接听。
   - 若离线渲染不可行，至少给 `test/` 断言：`buildAudioGraph` 存在、节点数 > N、11.8s 内 scheduling 不抛错。

---

## 7. 版本/生效

- `package.json` → `0.3.0`（Lead 改；`lib/index.js` 的 `?v=` 用 package version，自动刷新缓存）。
- **升级即重播一次**：`client.js` 的 shown 标记改为带版本：`dsh-startup-moss2:shown` 值写
  `version + ':' + date`；`session` 模式判断值相等才跳过；`daily` 模式保留按自然日，
  但若 `localStorage['dsh-startup-moss2:version'] !== VERSION` 则当天也播一次并写入版本。
  （用户刷新页面后就能自动看到 v0.3 新启动动画，不需要手动重播。）
- Host 半侧（`lib/index.js`）如无资产白名单变化则**不需要重启 Host**；client 半侧刷新页面即生效。
- 若本轮改了 `lib/index.js`（例如新增 splash-audio 路由）必须跑 `_tools/live-reload.ps1`；建议尽量不改。

---

## 8. 写范围（本文件即协作契约）

| 角色 | 写范围 | 本轮任务 |
|---|---|---|
| Lead | `docs/**`、`package.json`、`README.md`、`CHANGELOG.md`、`INSTALL.md`、`lib/index.js`（如需）、集成 | 规格/版本/文档/整合/真宿主验收/交付 |
| splash-smith | `lib/splash.js`、`lib/splash.css`、`_work/splash/**` | 第 3、5、6 项 |
| skin-weaver | `lib/client.js`、`lib/skin.css`、`_work/skin/**` | 第 1、2、4 项 + §7 的升级重播标记 |
| verifier | `test/**`、`preview/**`、`_work/verify3/**`、`docs/verify/**` | 断言更新、真宿主矩阵、截图/证据 |

**测试命令**（Node 路径固定）：
```powershell
$node = "C:\Users\26547\.local\node-v24.21.0-win-x64\node.exe"
cd E:\dshdesign\dsh-startup-moss2
& $node test/smoke-host.mjs; & $node test/smoke-assets.mjs; & $node test/smoke-splash.mjs; & $node test/smoke-client.mjs
# 隔离真宿主（57123，profile=verify）：
powershell -File _tools\verify-host.ps1 -Action start
& $node _work\verify2\run.mjs --scenarios normal,immersive,glass,system-reduce
```
- 真宿主矩阵会读取 `lib/` 实时文件；改 `lib/index.js` 后需 `powershell -File _tools\verify-host.ps1 -Action restart`。
- 用户真实环境的 headless 复现脚本：`_work/ui/drive-live.mjs --host 127.0.0.1:64819`（desktop profile、真实配置）。
- 本机系统 `prefers-reduced-motion: reduce` 是真实回归场景，不能删。

## 9. 验收（全部要证据）

1. **第 4 项（阻断级）**：immersive 下依次点开「工作区」「模式」「+→权限」「+→模型」「设置」；
   每次：菜单 `position=fixed`、菜单位于触发点附近（视口内）、`documentElement.scrollHeight` 不增长、
   `scrollY` 不变、可点选「完全权限」「创作模式」；页面无未捕获异常。
2. **第 1/2 项**：CSS 里有呼吸动画；暂停动画（DevTools `animation-play-state` 或直接对比 t 与 t+1.6s 两帧）
   可见红眼光晕/四角亮度变化；`--calm` 下静止；系统 reduce 下仍在动。
3. **第 3 项**：见 §4 断言 6。
4. **第 5 项**：见 §4 断言；t=5.6/6.8/7.4/7.9 截图有准心/锁定/冲击波；MOSS 视频属性未变。
5. **第 6 项**：`node _work/demo/render-audio.mjs` 产出 `moss2-boot-audio.wav`（可播放、时长 ≥11.5s）；
   浏览器内 `AudioContext` 正常/被挂起/构造抛错三种路径都不异常。
6. 全量回归：`npm test` 全绿；verify2 矩阵（normal/system-reduce/skip/missing-video/saver/immersive/glass）
   全 PASS；`preview/index.html` 重播/分幕跳转仍工作。
7. 交付报告 `docs/DELIVERY-REPORT-v0.3.md` + 演示视频 + 截图归档 `docs/verify/v3/`。
