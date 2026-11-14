# dsh-startup-moss2 · v0.2 皮肤/动态背景（client.js + skin.css）真宿主验收报告

> 状态：**FINAL（2026-11-06 冻结版）** — 被测代码指纹见 `_work/verify2/assertions.json` / `_work/verify2/REPORT.md` §1。
> 生成：2026-11-06（Asia/Shanghai）｜执行：verifier（独立验收，不改 lib/ 产品代码）
> 唯一设计权威源：`docs/design-spec-v2.md` §1（根因）/ §7（皮肤/背景/运动策略/交接）/ §10
> 环境：隔离真宿主 port 57123（profile `verify`）＋ headless Chrome port 9344（1536×960）

## 1. 结论（冻结版最终矩阵）

| 场景 | 断言 | 结论 | 证据 |
|---|---|---|---|
| glass（默认档 veil=58/blur=16） | **21/21** | **PASS** | `docs/verify/skin-v2/glass/`、`sheet-glass.png` |
| immersive（沉浸档） | **20/20** | **PASS** | `docs/verify/skin-v2/immersive/`、`sheet-immersive.png` |
| system-reduce（系统关闭动画） | **34/34** | **PASS** | `docs/verify/splash-v2/system-reduce/` |
| 交接（armHandoff/同帧/无跳帧） | 归入 normal/system-reduce | **PASS** | `_work/verify2/report-normal.json` 的 handoff-* 断言 |
| UI 可读性（spec §10.10） | **13 条正文候选 0 失败** | **PASS（最低 4.68:1）** | `docs/verify/skin-v2/report-contrast.json` |

## 2. 核心验收点（v0.1 真机失败根因 → v0.2 修复证据）

| # | spec 要求 | 断言 / 证据 | 结论 |
|---|---|---|---|
| 1 | 视频播放永不被系统 `prefers-reduced-motion:reduce` 关闭（§1 根因修复） | `system-reduce`：三支启动视频 paused=false + currentTime 递增；`ambient-play`；静态断言 `shouldUseStatic` 不含 reduce 分支（smoke-client） | **PASS** |
| 2 | 背景必须肉眼可见在动，不是海报（§7.3） | `bg-motion-canvas`（ambient video 两帧 canvas 均差 >0）+ `bg-motion-shot`（交接后间隔 2s 真截图像素差 >0） | **PASS** |
| 3 | 极慢镜头漂移 `moss-bg-drift 44s alternate`，系统 reduce 不得停（§7.3） | skin.css 静态断言（smoke-client）+ 运行时两帧差（meanAbs 4.21、ratio 0.143）；`--calm` 才停漂移（用户显式 reducedMotion） | **PASS** |
| 4 | 交接无跳帧：启动层地球与 ambient 同资产/同裁切/同缩放（§7.4） | `handoff-published` `handoff-class` `handoff-geometry` `handoff-frame-sync`（页面内 50ms 采样器：交接后 1.5s 窗口 22 条样本 rect≤2px/transform 全同；splash t=10.6/11.0/11.4 三帧 |ΔcurrentTime| 最小 0.028s） | **PASS** |
| 5 | 品牌位冲突不再抛未捕获异常（§7.5） | `exceptions` / `brand-slot`：真宿主 Runtime.exceptionThrown=0 | **PASS** |
| 6 | `--static` 只因 saver/视频不可用（§7.1） | `no-static-class`（normal/reduce）/ `static-cause`（saver/missing-video） | **PASS** |
| 7 | 默认 veil=58 背景可见 + 玻璃可读性（§7.6/§10.10） | `contrast.mjs`：真宿主交接后 notext 法采样正文对比度（`report-contrast.json`）+ 交接后 UI 截图（13.6s/16.0s） | **PASS（最低 4.68:1，13 条正文候选 0 失败）** |
| 8 | `armHandoff(t)` 按实际 duration 取模并把 ambient seek 到同帧（§7.4） | `handoff-frame-sync`（ctDiff 最小 0.028s）+ smoke-client 静态断言（不得写死 28，earth 实际 30.00s） | **PASS** |

## 3. 复现命令

```powershell
Set-Location E:\dshdesign\dsh-startup-moss2
$node = "C:\Users\26547\.local\node-v24.21.0-win-x64\node.exe"
& $node _work\verify2\run.mjs --scenarios immersive,glass,system-reduce,normal
# 冻结后：& $node _work\verify2\run.mjs --restart-host
```

## 4. 截图与证据索引（冻结版）

### 4.1 UI 可读性复核（spec §10.10，冻结版实测）

方法：真宿主启动动画交接完成、`dsh-moss-enter` 撤除后，采集 `#root` 内正文类文本候选（font-size ≥13），
注入 notext 样式（`color:transparent`，不改布局）截图，取每个候选 bbox 内真实背景亮度，按 WCAG 公式计算对比度。

| 项 | 值 |
|---|---|
| 默认 veil | 58 |
| 正文候选 | 13 条 |
| 最低对比度 | **4.68:1**（13 条正文候选） |
| 阈值 / 失败数 | 4.5:1 / 0 |
| 结论 | **PASS（冻结版复跑）** |
| 证据 | `_work/verify2/report-contrast.json`、`_work/verify2/shots/glass/contrast-text.png`、`contrast-notext.png` |

### 4.2 场景截图

| 文件 | 说明 |
|---|---|
| `_work/verify2/shots/glass/glass-ui-t13.6.png` | 交接后默认 glass UI（veil=58/blur=16，动态地球背景） |
| `_work/verify2/shots/glass/glass-ui-t16.0.png` | 交接后 +2.4s（背景仍在动） |
| `_work/verify2/shots/glass/glass-motion-*.png` | 间隔 2s 两帧（像素差 >0 证据） |
| `_work/verify2/shots/immersive/immersive-ui-t13.6.png` | 沉浸档 UI |
| `_work/verify2/shots/system-reduce/*.png` | 系统 reduce 下启动各幕（MOSS/地球仍可见） |

## 5. 未验证项（诚实清单）

- [ ] 真实 Electron 窗口 900ms `dsh-moss-enter` 分区显影的观感（headless 已断言 class/时序）
- [ ] 真实 GPU 下 `backdrop-filter` 玻璃性能
- [ ] 用户显式 `reducedMotion=true` 的 --calm 观感截图（静态契约已断言：视频照播、只停装饰/漂移）
- [ ] 4K/高 DPI 屏下 `object-fit:cover` 与漂移边缘（1536×960 DPR1 已测）
