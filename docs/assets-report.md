# 资产工程报告 · v0.2 ·「神经接口开幕 → MOSS 苏醒 → 一半一半转场 → 流浪地球动态背景」

> 生成：2026-11-06 19:0x（Asia/Shanghai）｜ 作者：asset-lab ｜ 任务：`task-1`
> 设计权威：`docs/design-spec-v2.md` §2（素材映射）/ §5（资产规范）/ §4（时间线）
> 清单权威：`lib/assets/manifest.json`（10 件，bytes/sha256/duration 全部实测）
> 自检数据源：`_work/assets/v02/selfcheck.json` + `_work/assets/v02/ffprobe/*.json`（每文件全量 ffprobe JSON）
> 本文取代 v0.1 同名报告；v0.1 原文已备份到 `_work/assets/v02/assets-report-v0.1.md`

---

## 0. 结论（先看这 6 行）

1. **10 件 v0.2 资产全部落盘并达标**：新增 `neuro/*`（3 件）与 `moss/moss-cinema-*`（3 件）；`earth/*` 4 件与 `fonts/*` 3 件沿用 v0.1 已验证产物（**未重编**，字节与 sha256 与 v0.1 manifest 完全一致）。
2. **体积全部远低于 spec 上限**：neuro-1080 1.78 MB（上限 42.5%）、neuro-720 0.94 MB（55.9%）、neuro-poster 183 KB（89.5%）、moss-1080 0.93 MB（14.8%）、moss-720 0.42 MB（15.4%）、moss-poster 24 KB（11.8%）。`lib/assets` 合计 **15,671,463 B = 14.95 MiB**（包体红线 26 MB），其中废弃的 moss-eye 两件占 224,377 B，Lead 收尾删除后为 15,447,086 B = 14.73 MiB。
3. **earth 按 30.00s 交付**（v0.1 已实测的源 30.00s 自然周期 + 1s xfade 回卷）。spec 早期草案里的「28.00s / 源 143.50→171.50」是过时数字，Lead 已确认修正为 30.00s；代码侧 `armHandoff(t)` 必须用 `t % duration`，**不得写死 28**。
4. **素材 3 不可播放**：`2940368322` 是 Wallpaper Engine scene 工程（`scene.pkg` 14.9 MB + 自定义 shader），离开 WE 引擎无法播放，**未打进插件包**；其 `preview.jpg`（1024×1024，左 MOSS/右地球竖分割）已复制为 **`docs/assets-ref/transition-ref.jpg`** 作为设计参照，运行时由素材 1（MOSS）+ 素材 4（地球）两支视频 CSS 分割复刻构图（见 §3）。
5. **自检 ALL_OK=True**：ffprobe 规格、体积上限、sha256、无音轨、faststart、codec High、海报可解码、earth 首末帧、poster↔视频第 0 帧、真宿主 URL 200/206 全部通过（见 §5–§9）。
6. **帧级对齐已验证**：neuro 首帧 = 源帧 520（t=20.80s，SSIM 0.99492，对比邻帧 519/521 为 0.96779/0.97866）；moss 首帧 = 源帧 18（t=0.60s，SSIM 0.99550）。取段精确，无「错一帧」。

---

## 1. 交付清单（与 `lib/assets/manifest.json` 一致，全部实测）

| # | 文件（相对 `lib/assets/`） | 字节 / 占上限 | 规格 | 时长 / 帧数 | sha256（全量） |
|---|---|---|---|---|---|
| 1 | `earth/earth-1080.mp4` | 7,657,545 / 91.3% | 1920×1080 / 30fps / H.264 High / yuv420p / bt709 / 无音轨 / faststart | 30.000s / 900f | `d62e1758b0965a06f66c598950602300ac3db27442eb9419857efd575c77fd8d` |
| 2 | `earth/earth-720.mp4` | 3,319,794 / 90.5% | 1280×720 / 30fps / 同上 | 30.000s / 900f | `f3772c03e841eb1313238491214004987f1fe03fa6811731636a93065437e84e` |
| 3 | `earth/earth-poster.webp` | 26,848 / 11.9% | 1920×1080 / webp q82 | 视频 n=0 帧 | `5b73cafb198f1f1cf54043e1ae7bd16189ae20ce437e86d9ff5b4745ac10844f` |
| 4 | `earth/earth-poster.jpg` | 99,748 / 24.4% | 1920×1080 / jpeg q90 4:4:4 | 同上（webp 兜底） | `612be4fce840279585eb0c3c033e68ce03f5d61c3c59fbeb7513d92fd19a733c` |
| 5 | `neuro/neuro-boot-1080.mp4` | 1,784,602 / 42.5% | 1920×1080 / 25fps / H.264 High / yuv420p / bt709 / 无音轨 / faststart | 3.400s / 85f | `93caee7452068d53c0968cb0e52b1540266b7debe2a9b77da8b400623b724988` |
| 6 | `neuro/neuro-boot-720.mp4` | 937,830 / 55.9% | 1280×720 / 25fps / 同上 | 3.400s / 85f | `6972e6401bb12883d517869db851c92c719e73e87d8560e8a7af56b3d669b0de` |
| 7 | `neuro/neuro-boot-poster.webp` | 183,354 / 89.5% | 1920×1080 / webp q80 | 视频 n=0 帧 | `c92236a886cac896b990d3456383a22186cd4b8a5f42ddc450c9830d5a0de47a` |
| 8 | `moss/moss-cinema-1080.mp4` | 932,134 / 14.8% | 1920×1080 / 30fps / H.264 High / yuv420p / bt709 / 无音轨 / faststart | 5.000s / 150f | `96fc15b361a50d76342c2406ff3937769f1941c3ed07bb897871201f6e29f710` |
| 9 | `moss/moss-cinema-720.mp4` | 418,771 / 15.4% | 1280×720 / 30fps / 同上 | 5.000s / 150f | `f6d34426bdcd9ae6e99fd10edabb7ff0ef0edb2125d38b0c5296d5dcadec76b7` |
| 10 | `moss/moss-cinema-poster.webp` | 24,176 / 11.8% | 1920×1080 / webp q80 | 视频 n=0 帧 | `eed03e869a30571fe4ed5f2c7f1dca673c8f9ec0208e62d07eca6140fa66fa5d` |

- 上限口径：视频按 MiB（1024²），海报按 KiB（1024）；与 v0.1 `test/smoke-assets.mjs` 一致。
- 全部视频**未叠加任何文字/水印**，`-an` 无音轨；`moov` 在 `mdat` 之前（faststart 已逐件用 MP4 box 偏移验证：`_work/assets/v02/selfcheck.json → faststart`）。
- 全部视频色彩标记写入 `bt709` 三件套（primaries/transfer/space），range=tv（浏览器按标准 BT.709 解码）。
- 新增文件**未裁切/未平移**（moss 按 splash-smith 的红眼坐标约定全程保持 1920×1080 原生构图）。
- `fonts/jetbrains-mono-{400,500}.woff2` + `OFL.txt` 沿用 v0.1 未动（sha256：`7c53386f…` / `4765dee1…` / `a76abf00…`，见 selfcheck.json）。

---

## 2. 素材 → 产物映射与取段理由

### 2.1 素材 1 `2992034258/最终.mp4` → `neuro/neuro-boot-{1080,720}.mp4`（启动动画第一幕）

**源事实（ffprobe 实测）**：1920×1080 / 25fps / 30.000s / 750 帧 / H.264 Main / yuv420p / **无色彩标记** / **带音轨**（转码时 `-an` 剥除）/ 35,491,519 B / sha256 `6ec2614221f5…`。

**取段**：`-ss 20.80 -t 3.40`，即源 [20.80s, 24.20s)，85 帧 = 3.400s。取段理由（内容抽帧目检）：
- 20.80s 起 BCI 脑机接口面板「数据生成 83%」→ 3.4s 内走到 100%，是面板自我完成的一段完整动作，适合做「神经接口开幕」；
- 段尾保留**素材自带的故障闪光**作为切入 MOSS 的剪辑点。逐帧色彩异常检测（480×270，|R−G| 均值，基线 13.08）实测**两段**闪光：**clip 2.72–2.80s（splash 3.22–3.30，若第一幕视频从 0.50s 起播）** 与 **clip 3.24–3.32s（主闪光，splash 3.74–3.82）**；主闪光落在 design-spec §4「3.50–3.90 素材自带故障闪光」要求段内。
- 帧级对齐：输出 n=0 对源帧 520 SSIM **0.99492**（源 519 = 0.96779、源 521 = 0.97866）；输出 n=84 对源帧 604 SSIM 0.97611（源 603 是闪光帧，SSIM 仅 0.49177 → 排除错位）。

**转码**：`fps=25`（源已 25，恒等）→ `scale=1920:1080:flags=lanczos`（恒等缩放，仅统一 SAR）→ `setsar=1` → `format=yuv420p`；`-c:v libx264 -profile:v high -crf 24 -preset slow`，强制 bt709 标记（源无标记，按 H.264 HD 默认 bt709 解释），`-movflags +faststart`，`-frames:v 85` 锁定精确帧数。**无调色、无裁切**。

### 2.2 素材 2 `2926246706/1月31日.mp4` → `moss/moss-cinema-{1080,720}.mp4`（启动动画第二幕）

**源事实**：1920×1080 / 30fps / 16.183991s / 485 帧 / H.264 Main / yuv420p / **bt709 已标记** / 带音轨（`-an` 剥除）/ 8,090,362 B / sha256 `2063f8c90e27…`。

**取段**：`-ss 0.60 -t 5.00`，即源 [0.60s, 5.60s)，150 帧 = 5.000s。取段理由：
- 素材自身运镜就是「苏醒」：n=0 帧是抬起的机械臂/机体细节（画面中上部），镜头随后缓慢拉开，**红眼在段内点亮**——符合 design-spec §2「镜头从机械细节拉开、红色主眼出现」。
- 红眼实测（numpy+cv2 distanceTransform 定位红色实心圆盘中心）：几何中心 **(37.61%, 53.86%) @1920×1080**，n=98–149 恒定；虹膜核心半径约 16.8 px（外辉光更大）；**红眼首次点亮在 clip 3.267s（n=98）= splash 7.167s**（若第二幕从 3.90s 起播）。n=0 帧为暗态（无红色掩膜），正好承担「poster 暗态 → 视频亮起」的苏醒叙事。
- 帧级对齐：输出 n=0 对源帧 18 SSIM **0.99550**（源 17 = 0.94011、源 19 = 0.93662）；输出 n=149 对源帧 167 SSIM 0.99610（该段机体静止，邻帧 SSIM 亦高，索引由 18+149 严格确定）。

**转码**：`fps=30`（恒等）→ `scale=1920:1080:flags=lanczos` → 轻调色 **`eq=contrast=1.06:saturation=0.94`**（spec §5 指定）→ `setsar=1` → `format=yuv420p`；`crf 24 / preset slow / High / bt709 三件套 / +faststart / -an / -frames:v 150`。**无裁切、无平移**（splash-smith 的红眼准星按 (37.9%, 54%) 设计，与实测中心差 0.3pp/0.14pp）。

### 2.3 素材 4 `2949159595/流浪地球_15_1.mp4` → `earth/*`（启动动画第四幕 + UI 常驻背景）

**源事实**：1920×1080 / 60fps / 180.000s / 10,800 帧 / H.264 Main / 带音轨 / 无色彩标记 / 246,360,179 B / sha256 `ee49421a74b3…`（与 v0.1 报告一致，未改动）。

**沿用 v0.1 已验证产物，未重编**：v0.1 已判定该素材等离子动画为**精确 30.00s 自然周期**，取源 [30s,60s) 为主体 + 源 [29s,30s) 作 1s xfade 回卷，输出 30.000s / 900 帧；本轮 ffprobe 复核通过（§5），首末帧接缝实测见 §6。spec v2 草案里的 28.00s 是早期搜索上限下的中间结论，v0.1 报告 §9 已修正为 30.00s，Lead 本轮再次确认。

### 2.4 素材 3 `2940368322`（Wallpaper Engine scene）→ 不产出视频，仅设计参照

`2940368322` 是 **Wallpaper Engine 的 scene 工程**（`scene.pkg` + `shaders/blobsSM40/*.dxs` 自定义 shader），不是视频流，离开 WE 引擎无法播放；`scene.pkg` 14,946,275 B。按 design-spec §2 规定：
- **禁止**把 `scene.pkg` 打进插件包（v0.2 `lib/assets/` 中无此文件，包内亦无）；
- 其 `preview.jpg`（1024×1024，**左半 MOSS 机体/红眼、右半蓝色地球+等离子尾迹、中间竖直分割**）已复制为 **`docs/assets-ref/transition-ref.jpg`**（268,411 B，sha256 `92c980cef5aaca86318c1b65b8b787008791a98136bac5dcb1d269ca260b4055`）作为素材 3 设计参照；
- 运行时第三幕由 **素材 1（MOSS 视频末帧/继续播放）+ 素材 4（地球视频第 0 帧）** 用 CSS 竖直对半分割实时合成，接缝扫过展开为地球全屏——最终几何/色彩以 `lib/splash.css` 实现为准，资产侧不产出第三幕专用视频，也不需要。

### 2.5 素材 1/2/4 源文件完整性（只读未改）

| 源文件 | 字节 | 期望字节 | sha256 |
|---|---|---|---|
| `2992034258/最终.mp4` | 35,491,519 | 35,491,519 ✓ | `6ec2614221f5c196e7f9019f882f05b7ec720fd1c4286f6e4c51ecd98c08e57f` |
| `2926246706/1月31日.mp4` | 8,090,362 | 8,090,362 ✓ | `2063f8c90e275158fcf4c747b351455c215352fb60e87c478dfe9696ef42b41e` |
| `2949159595/流浪地球_15_1.mp4` | 246,360,179 | 246,360,179 ✓ | `ee49421a74b38938d72f264b9689dfd39a28748319c9b05034b4595c07ea84db` |
| `2940368322/preview.jpg` | 268,411 | 268,411 ✓ | `92c980cef5aaca86318c1b65b8b787008791a98136bac5dcb1d269ca260b4055` |
| `2940368322/scene.pkg` | 14,946,275 | 14,946,275 ✓ | （未变；不可播放，不入包） |

四个源目录只读未改（mtime 仍为 2026-11-06 13:2x，早于本轮转码）。

---

## 3. 素材 3 说明与 `docs/assets-ref/transition-ref.jpg`

- **不可播放**：`scene.pkg` 是 WE 引擎私有容器 + 自定义 shader，浏览器 `<video>` 无法解码；把它打进插件包既增加 14.9 MB 又无运行时价值，spec §2 明确禁止。
- **已归档参照**：`docs/assets-ref/transition-ref.jpg` = `2940368322/preview.jpg` 原样复制（sha256 与源一致，已逐字节校验）。构图读法：画面 1024×1024 竖直对半，**左半为 MOSS 机体（灰白机械 + 红色主眼辉光）**，**右半为蓝色地球 + 蓝色等离子尾迹**，中间一条竖直接缝，这是第三幕「一半 MOSS / 一半流浪地球」的构图依据（素材 3 的实际画面亮度/滤镜与素材 1/2 不同，用户已明确「逻辑是对的」，故只取构图逻辑）。
- **复刻做法（交接给 splash-smith）**：`ms-split__moss` 左半用 moss-cinema 视频（延续播放或末帧定格），`ms-split__earth` 右半用 earth 视频（从第 0 帧起播），中间 `ms-split__seam` 冰白高光 + 6px 数据刻线；8.90–10.00 接缝向左扫过把地球 clip 从 50% 展开到 100%。资产侧提供的就是既有 `moss-cinema-*` 与 `earth-*`，不需要额外文件。

---

## 4. 体积-画质取舍

### 4.1 流程：草稿 → 最终（均同文件名覆盖）

| 阶段 | 参数 | 用途 | 结果 |
|---|---|---|---|
| 草稿（18:5x 落盘，已通知 lead/splash-smith） | `-preset veryfast -crf 30` | 先让 splash 可联调 | 4 支视频 0.14–0.96 MB，ffprobe 规格正确、可播 |
| 最终（18:55 覆盖） | `-preset slow -crf 24` | 交付 | 4 支视频 0.42–1.78 MB，全部低于上限 |

最终版文件 mtime 18:55:43–18:55:47，sha256 见 §1；manifest 记录的是最终版实测值。

### 4.2 实测体积与上限

| 文件 | 实测 | 上限 | 占比 | 码率 |
|---|---|---|---|---|
| neuro-boot-1080 | 1,784,602 B（1.70 MiB） | 4.0 MiB | 42.5% | 4.20 Mbps |
| neuro-boot-720 | 937,830 B（0.89 MiB） | 1.6 MiB | 55.9% | 2.21 Mbps |
| neuro-boot-poster.webp | 183,354 B（179.1 KiB） | 200 KiB | 89.5% | — |
| moss-cinema-1080 | 932,134 B（0.89 MiB） | 6.0 MiB | 14.8% | 1.49 Mbps |
| moss-cinema-720 | 418,771 B（0.40 MiB） | 2.6 MiB | 15.4% | 0.67 Mbps |
| moss-cinema-poster.webp | 24,176 B（23.6 KiB） | 200 KiB | 11.8% | — |
| earth-1080 | 7,657,545 B（7.30 MiB） | 8.0 MiB | 91.3% | 2.04 Mbps |
| earth-720 | 3,319,794 B（3.17 MiB） | 3.5 MiB | 90.5% | 0.89 Mbps |
| earth-poster.webp | 26,848 B（26.2 KiB） | 220 KiB | 11.9% | — |
| earth-poster.jpg | 99,748 B（97.4 KiB） | 400 KiB | 24.4% | — |

### 4.3 取舍说明

- **neuro 码率（4.20 Mbps）明显高于 moss（1.49 Mbps）**：BCI 面板是大面积细线、密集小字与高对比青绿图文，且末尾两段故障闪光含红/青通道错位，x264 需要更多码率；实测仍在预算 42.5%，无需再降 crf（再降会伤小字边缘）。poster 183 KB 占 89.5% 是四张海报里最高，因为同帧也是密集细字，webp q80 属预期。
- **moss 码率低**：灰棚背景大面积平滑 + 红光渐变，crf24 下 0.89 MiB；红眼无带状（目检抽帧）。
- **720 档不是"低质草稿"**：同样 `crf 24 / preset slow`，由 1080 解码后 `scale=lanczos` 直接下变换（不是二次编码），码率约 1080 档的 45–53%。
- **earth 不重编**：v0.1 产物已通过循环接缝、体积、色彩、对比度全项验证（本轮复核见 §5–§6）；重编只会引入新的编码不确定性并改变 sha256，与「沿用」要求相悖。
- 海报质量：earth 沿用 v0.1（webp q82 / jpg q90 4:4:4）；neuro/moss 按 spec q80 + `method=6`（Pillow）。四张海报均实测可解码、尺寸 1920×1080。

---

## 5. ffprobe 规格自检（全量 JSON 已落盘）

每件媒体文件的全量 ffprobe JSON（`-show_format -show_streams -of json`）存放在 **`_work/assets/v02/ffprobe/<group>__<name>.json`**（共 10 个，含海报），供 verifier 独立复跑比对。摘要：

| 文件 | 编码/Profile | 分辨率 | fps | 时长 | 帧数 | pix_fmt | 色彩 | 音轨 | faststart |
|---|---|---|---|---|---|---|---|---|---|
| earth-1080 | h264 / High | 1920×1080 | 30 | 30.000s | 900 | yuv420p | bt709 三件套 | 无 | 是 |
| earth-720 | h264 / High | 1280×720 | 30 | 30.000s | 900 | yuv420p | bt709 | 无 | 是 |
| neuro-boot-1080 | h264 / High | 1920×1080 | 25 | 3.400s | 85 | yuv420p | bt709 | 无 | 是 |
| neuro-boot-720 | h264 / High | 1280×720 | 25 | 3.400s | 85 | yuv420p | bt709 | 无 | 是 |
| moss-cinema-1080 | h264 / High | 1920×1080 | 30 | 5.000s | 150 | yuv420p | bt709 | 无 | 是 |
| moss-cinema-720 | h264 / High | 1280×720 | 30 | 5.000s | 150 | yuv420p | bt709 | 无 | 是 |

- faststart 判据：顶层 MP4 box 偏移 `moov_offset < mdat_offset`（selfcheck.py 实现，逐件 True）。
- 海报：`earth-poster.webp/jpg`、`neuro-boot-poster.webp`、`moss-cinema-poster.webp` 均 PIL 解码成功、1920×1080（webp RIFF/WEBP 签名、jpg SOI 亦在 smoke 测试覆盖）。
- **全部 6 支视频 `audio_streams=0`**（源素材本身带音轨，转码统一 `-an` 剥除）。

---

## 6. earth 循环接缝复核（Lead 要求 ①）

从**交付成片**解码首帧/末帧（`ffmpeg -vf select=eq(n,0|1|898|899)`），在亮度通道全分辨率计算逐像素平均绝对差与 8×8 盒窗 SSIM（与 v0.1 同口径）：

| 成片 | 首帧 vs 末帧（n=0 vs n=899）← 循环接缝 | 首帧 vs n=898（对照：错 2 帧） | 首帧 vs n=1（对照：正常 1 帧步进） |
|---|---|---|---|
| earth-1080 | **RGB diff 0.8748/255，SSIM 0.96342** | 1.2043/255，0.94189 | 0.7624/255，0.96038 |
| earth-720 | **RGB diff 0.8994/255，SSIM 0.96301** | 1.1894/255，0.94160 | 0.7098/255，0.96249 |

**结论**：两个分辨率下接缝差异均 **< 2/255**（判据通过），且与正常相邻帧步进（0.76/0.71）几乎相同；错 2 帧时差异上升到 1.20/1.19 → 回卷正好跨一个 1/30s 帧步，无重复帧/多丢帧。SSIM 未达 0.98 的原因与 v0.1 报告 §3.4 相同：地球星空带胶片颗粒/压缩噪声，**源视频自身相邻帧** SSIM 也只有 0.9745，0.98 在任何两帧间都不可能达到；故采用「diff < 2/255」判据（数值 0.875/0.899，通过）。

---

## 7. 海报 ↔ 视频第 0 帧一致性（Lead 要求 ②③）

口径：解码海报与对应成片 n=0 帧，RGB 逐像素平均绝对差 / 最大差 / 亮度差 / SSIM（全分辨率）。

| 海报 | 对应视频 n=0 帧 | RGB 平均差 | RGB 最大差 | 亮度平均差 | SSIM |
|---|---|---|---|---|---|
| `earth/earth-poster.webp` | earth-1080 | **0.5339/255** | 39 | 0.4266 | 0.98641 |
| `earth/earth-poster.jpg` | earth-1080 | **0.3268/255** | 20 | 0.4174 | 0.98382 |
| `neuro/neuro-boot-poster.webp` | neuro-boot-1080 | **1.6330/255** | 35 | 1.2426 | 0.99426 |
| `moss/moss-cinema-poster.webp` | moss-cinema-1080 | **0.6636/255** | 26 | 0.5063 | 0.99559 |

**结论**：
- earth 海报与视频第 0 帧差异 0.33–0.53/255（仅 webp/jpg 有损量化），SSIM 0.984–0.986 → **交接时海报→视频不会跳变**（0.53/255 约等于 0.2% 灰度，肉眼不可辨）。
- moss 海报 0.66/255、SSIM 0.99559 → 第二幕淡入底图不会跳；该帧红眼为**暗态**，与「镜头拉开→红眼点亮」的苏醒节奏一致。
- neuro 海报 1.63/255 是四张里最大（面板细字被 webp q80 量化），SSIM 0.99426 仍高，启动幕淡入时不可辨。
- 海报均由**成片第 0 帧**导出（不是源视频任意帧），生成命令见 manifest `generation` 字段与 §10。

---

## 8. 第三幕/第四幕交接用的时间线事实（给 splash-smith 与 verifier 的实测数字）

> 假设：neuro 视频从 splash 0.50s 起播（currentTime=0 ↔ splash 0.50），moss 从 3.90s 起播，earth 从 10.00s 起播。

| 事实 | 数值 |
|---|---|
| neuro 故障闪光段 | clip 2.72–2.80s（splash 3.22–3.30，**次闪光**）与 clip 3.24–3.32s（splash 3.74–3.82，**主闪光**） |
| moss 红眼几何中心 | **(37.61%, 53.86%) @1920×1080**（n=98–149 恒定；splash-smith 约定 37.9%/54%，差 0.3pp/0.14pp） |
| moss 红眼首次点亮 | clip 3.267s（n=98）= **splash 7.167s**；7.10s（n=96）虹膜仍暗态（无红色掩膜） |
| moss 末帧（splash 8.90 定格） | n=149，红眼亮；红眼中心同 (37.61%, 53.86%) |
| earth 循环周期 | 30.000s（900 帧 @30）→ `armHandoff(t)` 用 `t % 30.0` |
| 源取段帧对齐 | neuro 首帧=源帧 520（SSIM 0.99492）、moss 首帧=源帧 18（SSIM 0.99550） |

数据文件：`_work/assets/v02/frame_checks.json`（neuro 逐帧闪光评分）、`_work/assets/v02/red_eye.json` + `moss_iris_timing.json`（红眼定位/点亮帧）、`_work/assets/v02/frame_align.json`（帧对齐）。

---

## 9. 真宿主 URL 验证（可选证据，已做）

隔离真宿主：`http://127.0.0.1:57123`（`_tools/verify-host.ps1`，token 在 `_work/verify-home/current-token.txt`）。带 token 建立会话后逐件 HEAD（另抽查 Range）：

| URL（`/dsh-moss2/asset/…`） | 状态 | Content-Length | Content-Type |
|---|---|---|---|
| `neuro/neuro-boot-1080.mp4` | 200 | 1,784,602 = 磁盘字节 | video/mp4 |
| `neuro/neuro-boot-720.mp4` | 200 | 937,830 | video/mp4 |
| `neuro/neuro-boot-poster.webp` | 200 | 183,354 | image/webp |
| `moss/moss-cinema-1080.mp4` | 200 | 932,134 | video/mp4 |
| `moss/moss-cinema-720.mp4` | 200 | 418,771 | video/mp4 |
| `moss/moss-cinema-poster.webp` | 200 | 24,176 | image/webp |
| `earth/earth-1080.mp4` | 200 | 7,657,545 | video/mp4 |
| `earth/earth-720.mp4` | 200 | 3,319,794 | video/mp4 |
| `earth/earth-poster.webp` | 200 | 26,848 | image/webp |
| `earth/earth-poster.jpg` | 200 | 99,748 | image/jpeg |
| `moss/moss-eye-720.mp4`（已移出白名单） | **404** ✓ 预期 | — | — |

- Range 请求：`Range: bytes=0-1023` → **206** + `Content-Range: bytes 0-1023/1784602`（视频 seek 正常）。
- 该验证只证明「路由能正确伺服新文件名」，**不代替** verifier 的截图/播放验收。

---

## 10. 复现命令（与 manifest `generation` 一致；本机 ffmpeg 不在 PATH，需写全路径 `E:\douy\_tools\ffmpeg\ffmpeg.exe`）

**neuro-boot-1080.mp4**（720 档只把 `scale=1920:1080` 改为 `scale=1280:720`、输出名对应）：

```
E:\douy\_tools\ffmpeg\ffmpeg.exe -ss 20.80 -i "2992034258/最终.mp4" -t 3.40 ^
  -vf "fps=25,scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p" -frames:v 85 -an ^
  -c:v libx264 -preset slow -crf 24 -profile:v high -pix_fmt yuv420p ^
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart ^
  -y lib/assets/neuro/neuro-boot-1080.mp4
```

**moss-cinema-1080.mp4**（720 档同理改 `scale`）：

```
E:\douy\_tools\ffmpeg\ffmpeg.exe -ss 0.60 -i "2926246706/1月31日.mp4" -t 5.00 ^
  -vf "fps=30,scale=1920:1080:flags=lanczos,eq=contrast=1.06:saturation=0.94,setsar=1,format=yuv420p" -frames:v 150 -an ^
  -c:v libx264 -preset slow -crf 24 -profile:v high -pix_fmt yuv420p ^
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart ^
  -y lib/assets/moss/moss-cinema-1080.mp4
```

**neuro 海报**（moss 海报同理，换输入/输出）：

```
E:\douy\_tools\ffmpeg\ffmpeg.exe -i lib/assets/neuro/neuro-boot-1080.mp4 -vf "select=eq(n\,0)" -frames:v 1 -y _work/assets/v02/frames/neuro_1080_frame0.png
python -c "from PIL import Image; Image.open('_work/assets/v02/frames/neuro_1080_frame0.png').convert('RGB').save('lib/assets/neuro/neuro-boot-poster.webp','WEBP',quality=80,method=6)"
```

**earth 四件**：沿用 v0.1 命令，见 `_work/assets/v02/assets-report-v0.1.md` §7（与本 manifest 的 `generation` 字段逐字一致），本轮未执行。

**自检复跑**：

```
python _work/assets/v02/selfcheck.py        # ffprobe+sha256+faststart+体积+loop+poster 一致性 → selfcheck.json
python _work/assets/v02/build_manifest.py   # 用 selfcheck.json 实测值重建 manifest.json 并逐件比对磁盘
python _work/assets/v02/frame_checks.py     # neuro 闪光帧 / moss 红眼
python _work/assets/v02/frame_align.py      # -ss 取段帧级对齐
```

> 注：`selfcheck.py` 内 ffmpeg/ffprobe 路径写全 `E:\douy\_tools\ffmpeg\`；本机 Python 3.12 + Pillow 12.3.0 + numpy；cv2 仅 `red_eye.py` 使用。

---

## 11. 自检汇总（`_work/assets/v02/selfcheck.json`，ALL_OK = True）

```
PASS asset earth/earth-1080.mp4       (bytes ≤ 8 MiB, h264 High, 1920x1080@30, 30.000s/900f, no audio, faststart, bt709)
PASS asset earth/earth-720.mp4        (bytes ≤ 3.5 MiB, 1280x720@30, 30.000s/900f)
PASS asset earth/earth-poster.webp    (≤ 220 KiB, 1920x1080, decodable; vs frame0 SSIM 0.98641)
PASS asset earth/earth-poster.jpg     (≤ 400 KiB, 1920x1080, decodable; vs frame0 SSIM 0.98382)
PASS asset neuro/neuro-boot-1080.mp4  (bytes ≤ 4 MiB, h264 High, 1920x1080@25, 3.400s/85f, no audio, faststart, bt709)
PASS asset neuro/neuro-boot-720.mp4   (bytes ≤ 1.6 MiB, 1280x720@25, 3.400s/85f)
PASS asset neuro/neuro-boot-poster.webp (≤ 200 KiB, 1920x1080, decodable; vs frame0 SSIM 0.99426)
PASS asset moss/moss-cinema-1080.mp4  (bytes ≤ 6 MiB, h264 High, 1920x1080@30, 5.000s/150f, no audio, faststart, bt709)
PASS asset moss/moss-cinema-720.mp4   (bytes ≤ 2.6 MiB, 1280x720@30, 5.000s/150f)
PASS asset moss/moss-cinema-poster.webp (≤ 200 KiB, 1920x1080, decodable; vs frame0 SSIM 0.99559)
PASS earth loop seam 1080/720         (first-vs-last diff 0.875/0.899 < 2/255)
PASS frame-accurate seek              (neuro src 520 / moss src 18)
PASS source media untouched           (4 源目录字节/sha256 未变)
PASS manifest.json consistency        (10 件 bytes/sha256 与磁盘逐一相符)
PASS real-host URLs                   (10 件 200 + Range 206；moss-eye 404 符合预期)
→ ALL_OK = True
```

---

## 12. 未验证项 / 风险（不许当 ✅ 用）

1. **浏览器实机播放观感未由本角色验收**：我只做了 ffprobe/静态帧/HTTP 层验证；三支视频在真宿主 Chromium 中同时解码的 CPU/GPU 占用、`<video>` 循环/定格表现、splash 截图由 verifier 负责。
2. **moss 红眼准星位置依赖 splash 实现**：实测中心 (37.61%, 53.86%)；若 splash 的 `object-fit/scale` 与该坐标约定不同，准星会偏，需 verifier 截图核对（资产本身无裁切/平移）。
3. **红眼点亮时刻**：splash-smith 时间线写 7.10s 锁定，实测红眼 7.167s 才点亮（70ms 差）。这不是资产缺陷（素材原生节奏），但画面「准星锁定 → 红眼亮起」的次序需在截图里确认可接受。
4. **neuro 主闪光在 splash 3.74–3.82s**：与 spec §4「3.50 起」的措辞相比偏后 0.24s 起（素材原生）；硬切点 3.90 前有 0.08s 余量。且 3.22–3.30 另有一次小闪光（spec 未提及）。
5. **色彩标记**：`2992034258/最终.mp4` 与 `2949159595/…` 源无色彩标记，转码按 bt709 标记（H.264 HD 默认约定）；未做色调映射。若实机观感偏色，需回查源容器实际色彩（当前证据只到「无标记」）。
6. **webp 海报无 jpg 兜底**：neuro/moss 海报只有 webp（spec §5 只要求 webp；earth 有 jpg 兜底）。旧 WebView 不支持 webp 时这两张只剩 CSS 兜底，风险由 splash 的 `onerror` 降级承担。
7. **moss-eye-* 仍在磁盘**：v0.1 废弃资产（208,995 B + 15,382 B）已移出白名单，但文件未删（Lead 收尾处理）。`package.json files` 含整个 `lib`，**删除前打包会把这 224 KB 一起带上**（不影响功能，只影响包体）。
8. **未做**：没有为素材 3 生成任何视频（按 spec §2 禁止）；没有重编 earth（按 task 要求沿用）；没有改动 `lib/` 下任何代码文件。

---

## 13. 写入范围 / 产物路径

**本角色本轮写入（全部在授权范围）**：
- `lib/assets/neuro/neuro-boot-{1080,720}.mp4`、`neuro/neuro-boot-poster.webp`（新建）
- `lib/assets/moss/moss-cinema-{1080,720}.mp4`、`moss/moss-cinema-poster.webp`（新建）
- `lib/assets/manifest.json`（重写为 v0.2）
- `docs/assets-report.md`（本文件，v0.2）
- `docs/assets-ref/transition-ref.jpg`（复制自 `2940368322/preview.jpg`）
- `_work/assets/v02/**`（自检数据、ffprobe JSON、帧图、脚本、v0.1 报告备份）

**未触碰**：`lib/index.js`、`lib/splash.*`、`lib/client.js`、`lib/skin.css`、`test/`、`preview/`、`lib/assets/moss/moss-eye-*`（保留待 Lead 删）、四个源素材目录、`earth/*`、`fonts/*`（只读校验）。

**结论**：v0.2 资产侧交付完成，`lib/assets` 14.95 MiB（删 moss-eye 后 14.73 MiB）≤ 26 MB 包体红线；manifest 与磁盘逐件一致，可供 `smoke-assets` 与 verifier 直接核对。

---

## 14. v0.5 增量（2026-11-09 · 本文件追加，不改写 v0.2 历史结论）

v0.5 只动了 **earth 两件（重编码）** 与 **新增 audio 一件**，其余资产未动。

### 14.1 earth 720/1080 短 GOP 重编码（反馈 1 根因修复）
| 项 | v0.4 旧片 | v0.5 新片 |
|---|---|---|
| 文件 | `earth/earth-720.mp4` / `earth-1080.mp4` | 同名覆盖 |
| 关键帧 | 仅 4 个（GOP 8.33s，0/8.33/16.67/25.0） | **g=15（关键帧间隔 0.5s，共 60 个）** |
| GOP 内 seek 代价 | 最长回溯 ~250 帧；真宿主实测 10.35s 的 20.27→4.57 回 seek 到 12.24s 才 seeked（冻结 1.9s） | 隔离实测 seek 10–20ms；真宿主并发下 196ms（0.2s 量级） |
| 字节 | 3,319,794 / 7,657,545 | **4,180,284 / 8,561,335** |
| SHA256 | — | `6835a6c7…bdbeb21` / `d02ebb41…c4cf80b1e1`（完整值见 manifest） |
| 帧内容 | 900 帧 @30fps / 30.00s / 1280×720 / 1920×1080 | **不变**（同源同窗口同 xfade；逐帧 PSNR 平均 50.8dB / 52.1dB，min 48.6/50.7dB） |
| 编码 | H.264 High / yuv420p / bt709 / CRF24 preset slow（GOP 8.33s） | H.264 High / yuv420p / bt709 / **CRF23 preset medium / g=15 / keyint_min=15 / sc_threshold=0** / faststart |
| 生成命令 | 见 v0.2 §10 | `ffmpeg -i <旧成片> -c:v libx264 -preset medium -crf 23 -g 15 -keyint_min 15 -sc_threshold 0 -pix_fmt yuv420p -an -movflags +faststart -y <新成片>`（旧片备份 `_work/v05/encode/orig-*.mp4`） |
| 海报 | 从旧片第 0 帧导出 | 仍有效（新片第 0 帧与旧片逐帧 PSNR≈52dB，视觉一致；未重新导出） |

> 体积增加 0.86MB/0.90MB（+26%/+12%），`lib/assets` 总体积仍在 26MB 红线内（smoke-assets 断言）。

### 14.2 新增 `audio/moss-arm-sfx.m4a`（反馈 3）
| 项 | 值 |
|---|---|
| 来源 | 用户自制 `带音效moss机器人.mp4`（4K HEVC / 30fps / 6.207s）音轨 [0.600, 5.000] |
| 对齐 | 与 `moss/moss-cinema-720.mp4` 帧匹配唯一极小值 **-18 帧 / -0.600s**（192×108 灰度 MAE 4.43 vs 次优 5.15；详见 `_work/v05/audio/alignment.json`） |
| 映射 | 用户 [0.600,5.000] ↔ moss 本地 [0,4.400] ↔ 启动动画绝对 [3.90,8.30]（逐样本零偏移） |
| 编码 | AAC-LC 48kHz 立体声 128kbps / 4.400s / 72,507B / faststart |
| 处理 | 20ms 首淡入 + 50ms 尾淡出（cosine）；仅峰值保护 -0.682dB（样本峰 -1.884dBFS / True Peak -1.88dBFS）；不做响度归一 |
| SHA256 | `c3c0374b8b5881ae676309241455c494313c4eae63773de55f14a3e2030e561c` |
| 用途 | 幕 II [3.90,8.30] 机械臂音效主前景层；走独立 arm 总线；缺失/解码失败回退 v0.4 合成关节层 |
| 版权 | 用户自制素材，仅本机自用、不二次分发（见 `THIRD-PARTY-NOTICES.md` §3） |

### 14.3 v0.5 未验证项（资产侧）
1. 重编码的短 GOP 片在用户真实 Electron 硬件解码路径上的 CPU/GPU 占用未实测（仅 Chromium headless + verify host 实测）。
2. 用户音轨的 AAC 转码客观指标已验（解码时长 4.400s、峰值/相关性），但主观听感需用户确认。
3. earth 海报未按新片重新导出（第 0 帧 PSNR≈52dB，视觉一致；如用户要求可重导）。
