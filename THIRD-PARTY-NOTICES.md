# THIRD-PARTY-NOTICES — dsh-startup-moss2

本包分两类内容：**自有代码**（MIT）与**内嵌第三方素材**（版权归原权利人；v0.5.0 起随本仓库以完整素材版公开分享，见 §6）。

## 1. 内嵌第三方素材（Wallpaper Engine 创意工坊）

以下素材来自 Steam Wallpaper Engine 创意工坊，已由工作区原始素材转码为 Web 播放格式。
**授权状态不明（版权归原权利人）：本仓库按作者决定随源码公开分享（非商业、个人同人用途），
不主张任何权利；如权利人提出异议，将立即移除相关内容。**

| 产物（v0.2） | 原始素材 | 源目录（工作区） | 标题 / 类型 | 授权记录 |
|---|---|---|---|---|
| `lib/assets/earth/earth-1080.mp4`<br>`lib/assets/earth/earth-720.mp4`<br>`lib/assets/earth/earth-poster.webp/.jpg` | `流浪地球_15_1.mp4`（180s / 1080p60 / 235MB） | `2949159595/` | 《流浪地球》/ video | `project.json` 未记录 workshop id；按 Wallpaper Engine 工坊素材处理 |
| `lib/assets/moss/moss-cinema-1080.mp4`<br>`lib/assets/moss/moss-cinema-720.mp4`<br>`lib/assets/moss/moss-cinema-poster.webp` | `1月31日.mp4`（16.18s / 1080p30 / 7.7MB） | `2926246706/` | 《MOSS IS WATCHING YOU》/ video | 同上 |
| `lib/assets/neuro/neuro-boot-1080.mp4`<br>`lib/assets/neuro/neuro-boot-720.mp4`<br>`lib/assets/neuro/neuro-boot-poster.webp` | `最终.mp4`（30s / 1080p25 / 33.9MB） | `2992034258/` | 《流浪地球2-数字生命上传中……》/ video | workshop id `2992034258`（见 `project.json`） |

补充说明：

- 原始素材目录 `2949159595/`、`2926246706/`、`2940368322/`、`2992034258/` 只读保留在工作区，**不随插件包分发**。
- `2940368322/`（Wallpaper Engine *scene* 工程：`scene.pkg` + 自定义 shader，`《流浪地球》-The Wandering Earth（Moss/Earth)`）
  **未转码、未打包**：它不是视频流，离开 WE 引擎无法播放。v0.2 仅把它当作「一半 MOSS／一半流浪地球」的**构图与转场设计参照**
  （`docs/assets-ref/transition-ref.jpg` = 其 preview.jpg），实际转场由素材 `2926246706` + `2949159595` 两支高清视频实时合成，构图逻辑一致。
- 转码产物只做了裁剪/重编码/去音轨/轻度调色，未做内容改编。
- v0.1 的小圆窗产物 `moss-eye-720.mp4` / `moss-eye-poster.webp` 已在 v0.2 删除。

## 2. 字体

| 产物 | 字体 | 授权 |
|---|---|---|
| `lib/assets/fonts/jetbrains-mono-400.woff2`<br>`lib/assets/fonts/jetbrains-mono-500.woff2` | JetBrains Mono Regular / Medium | SIL Open Font License 1.1（全文见 `lib/assets/fonts/OFL.txt`） |

JetBrains Mono 版权归 JetBrains s.r.o. 所有，按 OFL 1.1 随包分发；字体文件未修改。

## 3. 用户自制音频素材（v0.5）

| 产物 | 来源 | 授权记录 |
|---|---|---|
| `lib/assets/audio/moss-arm-sfx.m4a`（4.400s，AAC-LC 48k 立体声） | 用户 2026-11-09 提供的 `带音效moss机器人.mp4` 音轨 [0.600, 5.000] | 用户本人（素材作者）明确要求「用我这个」用于本插件，并同意随本仓库公开分享；版权归用户本人 |

- 该音轨与 `lib/assets/moss/moss-cinema-*.mp4` 的机械臂运动逐帧对齐（帧匹配唯一极小值 -18 帧 / -0.600s）。
- 仅做剪点 + 20ms 首/50ms 尾淡入淡出 + 峰值保护（-0.682dB），未做内容改编/响度归一（保持用户原始动态）。

## 4. 程序化音效

启动动画其余音频由 `lib/splash.js` 在浏览器中用 WebAudio 实时合成（BGM 床 + 提示音 + 转场扫频 + 交接提示音），
**不包含第三方音频文件**（v0.5 起幕 II 机械臂音效除外，见 §3），无第三方音频版权。

## 5. 自有代码与设计

- `lib/*.js`、`lib/*.css`、`preview/*`、`docs/*`、`icon.svg` 为作者原创，MIT（见 `LICENSE`）。
- 视觉母题（MOSS 红眼 / 550W / 550A 等）属《流浪地球》系列作品的文化符号，本插件为非商业个人自用同人主题，与版权方无关联。

## 6. 公开分享说明（摘要）

1. 本项目为作者个人的**非商业同人**主题插件，与《流浪地球》系列版权方、Wallpaper Engine 素材作者均无关联。
2. v0.5.0 起，作者决定以**完整素材版**开源（含 `lib/assets/earth`、`lib/assets/moss`、`lib/assets/neuro` 视频与
   `lib/assets/audio` 实录音效），便于朋友之间直接使用；这些素材**不在 MIT 范围内**，版权归原权利人。
3. 任何权利人如认为本仓库内容侵犯其权利，请开 Issue 或联系仓库作者，核实后将立即移除相关文件。
4. 代码与文档按 MIT 发布（见 `LICENSE`）。
