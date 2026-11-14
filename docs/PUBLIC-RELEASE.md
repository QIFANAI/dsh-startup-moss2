# 公开仓库说明（v0.5.0 · 完整素材版）

> 生成：2026-11-14｜仓库：<https://github.com/QIFANAI/dsh-startup-moss2>｜基线：本机 `dsh-startup-moss2@0.5.0`（2026-11-09 交付）

## 1. 结论

- 本仓库是 v0.5.0 的**无损开源版**：插件运行时、全部内嵌素材、全部文档与验收归档、测试、预览页均随仓库发布，
  与作者本机 v0.5.0 内容一致（文本文件仅按 `.gitattributes` 归一为 LF）。
- **没有阉割任何第三方素材**：`lib/assets/earth/*`（1080p + 720p 短 GOP 地球视频与海报）、`lib/assets/moss/*`、
  `lib/assets/neuro/*`、`lib/assets/audio/moss-arm-sfx.m4a` 全部在仓库内，克隆即可直接运行完整效果。
- 素材版权归原权利人；本仓库按作者决定以**非商业个人同人用途**公开分享，不主张任何权利，权利人异议即移除
  （见 [THIRD-PARTY-NOTICES.md](../THIRD-PARTY-NOTICES.md)）。
- Release 附件是可直接安装的完整包：
  - `dsh-startup-moss2-0.5.0.tgz` — 17,567,506 B，SHA256 `8e4b198cbf5b64ccf51dec0ba0b5825ab843dc0916112575e35002b4a4b3e54d`
  - `MOSS550W·流浪地球启动动画+UI皮肤组合包.zip` — 17,599,691 B，SHA256 `d77aee5f649d368208ac1c778593390f4d67e73a8ea8fcdb1f2c985bb1d60753`

## 2. 与交付时“仅本机自用”口径的差异

v0.5.0 交付时，`README.md` / `INSTALL.md` / `LICENSE` / `THIRD-PARTY-NOTICES.md` / `package.json` /
`cordis.patch.yml` 写的是“不发布公共 registry、不二次分发”。公开仓库按作者 2026-11-14 的决定改为
“完整素材公开分享 + 版权归原权利人 + 非商业 + 异议即移除”。**仅改口径文字，运行时代码零改动。**

## 3. 未入仓库的内容（非插件内容，按设计排除）

| 路径 | 体量 | 原因 |
|---|---|---|
| `_work/` | 2.5 GB | 本机构建 / 验收工作区（临时帧、日志、Chrome profile、历史备份），不是插件内容 |
| `_probe/`、`_ref/`、`_tools/` | 3.2 MB / 25 MB / 128 KB | 本机探针、参考素材、验收脚本 |
| `2926246706/`、`2940368322/`、`2949159595/`、`2992034258/` | 约 294 MB | Wallpaper Engine 工坊**原始素材目录**（含 235 MB 原片）；插件运行使用的是转码后的 `lib/assets/**` |
| `dist/`、`MOSS550W·流浪地球启动动画+UI皮肤组合包.zip` | — | 本机打包产物；由 Release 附件提供 |
| `releases/dsh-startup-moss2-0.2.0.tgz`、`-0.3.0.tgz` | 31 MB | 历史版本构建产物；本次只发布 v0.5.0 |
| `ffmpeg-*.log`、`_重启接续.md` | 4 MB | 本机构建日志 / 内部接续手册 |

> 这些被排除的都不是插件运行所需内容；`lib/`、`docs/`、`test/`、`preview/`、`locale/` 无任何删减。

## 4. 验证

| 项 | 结果 |
|---|---|
| 本机 `npm test`（5 套静态契约） | PASS |
| 干净克隆 `npm test` | PASS |
| 逐字节对照 | `lib/**`、`docs/**`、`test/**`、`preview/**`、`locale/**` 与本地 v0.5.0 一致（文本仅 EOL 归一） |
| Release 附件哈希 | 与 v0.5.0 组合包侧车 `校验清单.sha256` 一致 |
