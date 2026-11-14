# 安装说明 — dsh-startup-moss2（MOSS 550W · 流浪地球）

> 适用：DeepSeek Harness 桌面版（Electron，宿主实测 0.2.2-rc.1），profile `desktop`。
> 本插件含 Wallpaper Engine 第三方素材与用户自制音效：**完整素材随开源仓库发布**（版权归原权利人，非商业个人同人用途；见 `THIRD-PARTY-NOTICES.md`）。
> 当前版本：**0.5.0（动态地球 + 柔化交接 + 实录音效）**——幕 IV 地球从点火起持续动态、100%→UI 交接放慢
> （100% 定格 0.6s + 冰白 bloom + 810ms warp 溶解 + UI 900–1150ms 分级显影）、MOSS 机械臂音效换成用户实录音轨；
> 总时长 **13.9s**。

## 0. 前置检查

- DSH 已能正常打开主界面（任一工作区）。
- 本目录完整（含 `lib/assets/earth/*.mp4`、`lib/assets/audio/moss-arm-sfx.m4a` 等素材；
  若素材缺失，皮肤会退化为纯海报/纯 CSS、音效回退合成层，不会白屏）。

## 1. 安装（三选一）

### 方式 A：拖给 DSH 的 agent（推荐，离线 · 无损）

把 [Releases](https://github.com/QIFANAI/dsh-startup-moss2/releases) 里的 `MOSS550W-wandering-earth-combo-v0.5.0.zip`（组合包原名 `MOSS550W·流浪地球启动动画+UI皮肤组合包.zip`） 拖进 DSH 对话框，说「帮我安装这个插件」，按包内
`00-给DSH的安装说明.md` 执行：agent 会先用 `tools\install.ps1` 做完整性预检并把 tgz 复制到
`%USERPROFILE%\.dsh\_packages\`（稳定副本，勿删），再用 `plugin_manager install_bundle` 安装；
首次重开后用 `tools\verify.ps1` 逐文件校验（48/48 文件 + 11 个冻结哈希）。

### 方式 B：在当前 DSH 里让 agent 装本目录

对本会话的 agent 说：

> 用 plugin_manager install_bundle 安装 `E:\dshdesign\dsh-startup-moss2\releases\dsh-startup-moss2-0.5.0.tgz`

agent 会执行 `plugin_manager install_bundle`，读返回的 `application`：
- `application: applied` → 已生效（宿主侧代码仍需重启 DSH 才加载）；
- `restart-required` / 非 applied / 有 warnings → 按返回的 `nextStep` 处理（通常是完全退出 DSH 重开）。

### 方式 C：命令行（桌面版自带 dsh 命令）

```powershell
# 桌面版自带命令（可以管理 desktop profile）：
& "<DSH 安装目录>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add "<tgz 绝对路径>"
# 注意：npm 版 dsh CLI（0.2.2-rc.1）会拒绝管理 desktop profile，请勿用它装 desktop profile。
```

### 安装后必须做的一步

**完全退出 DSH（含托盘）后重开。**
- v0.5 改了 **Host 半侧 `lib/index.js`**（新增音频资产白名单 + 启动兜底 17000ms）与 `lib/client.js`
  → 只刷新页面/关主窗口**不够**，必须重启宿主进程才能加载新白名单与新兜底。
- 首次重开会自动补播一次新启动动画（构建标记 `SPLASH_REV=v0.5-r1` 变化），之后按「每会话/每天一次」的语义。

## 2. 首次验收（30 秒）

1. 打开 DSH → 应看到 **13.9 秒四幕启动动画**：脑机接口开幕（DEEPSEEK HARNESS）→ 全屏 MOSS 机器人
   （550W/日志/遥测 / **红色准心捕获→跟踪→收敛→7.42s 锁定→7.42–8.06s 终局对焦** / MOSS 已上线 /
   **机械臂运动音效 = 与画面逐帧对齐的实录音轨**）→ 准心十字线延伸成「一半 MOSS／一半流浪地球」竖分割
   → **地球全屏 10.35s 点火**（冰蓝闪光后等离子尾迹出现，**此后地球一直是动态视频**）→
   **100% 定格 → 冰白 bloom → 810ms 溶解 + UI 分级显影**四段式交接；底部 `BOOT SEQUENCE` 进度条与
   `INITIALIZING %` 同频，**12.10s 恰好 100%** 并显示 `BOOT COMPLETE / 加载完成`。
2. 动画结束后进入主界面，**背景是真正在动的地球视频**（推进器等离子尾迹 + 缓慢镜头漂移，不是纯色/静态图）；
   交接瞬间背景应与启动层地球同一帧继续播放（不冻结、不跳帧）。
3. 侧栏/输入卡为半透明玻璃；空态品牌徽标红眼会明显呼吸闪烁、输入卡四角括号（4 个角都在）会呼吸；
   顶栏右侧出现 `550W · MOSS ｜ HH:MM:SS ｜ 系统在线` 遥测章。
4. 设置 → **MOSS 主题** 页可调档位/画质/压暗/模糊，保存后立即生效。
5. 输入卡左下角的「工作区 / 模式 / +（权限/模型）」等下拉**都能正常点开并选择**；按 `Esc` 可跳过启动动画
   （跳到 10.35s 幕 IV 起点，仍走完整交接）。

## 3. 配置

设置 → MOSS 主题，或直接改 `%USERPROFILE%\.dsh\dsh-startup-moss2.json`（字段见 `README.md` §4）。
推荐默认：`skin=glass`、`quality=standard`、`veil=58`、`blur=16`、`hud=normal`、`sound=true`、`volume=50`。

## 4. 卸载 / 回滚

```powershell
# 在 DSH 里让 agent：plugin_manager remove_bundle  target = dsh-startup-moss2
# 或桌面版自带命令：
& "<DSH 安装目录>\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop remove dsh-startup-moss2
```

- 本插件不改宿主任何文件，卸载即恢复原样。
- 配置残留：`%USERPROFILE%\.dsh\dsh-startup-moss2.json`（可手动删）。
- **若装完出现白屏/UI 异常**：先在 DSH 里让 agent 执行 `plugin_manager remove_bundle dsh-startup-moss2`，
  再重开 DSH；仍异常则重启 DSH 一次。回滚不改动你的会话数据。

## 5. 常见问题

| 现象 | 处理 |
|---|---|
| 没有启动动画 | ① `mode=session` 本次会话已播过（重开 DSH 或改 `always`）；② 设置里 `enabled=false`；③ 升级到 v0.5 后首次重开自动补播（构建标记变化），若仍未播看 `%USERPROFILE%\.dsh` 下配置是否被改坏 |
| 升级后看不到新动画/仍是旧版观感 | v0.5 改了 Host 半侧（`lib/index.js`）→ 必须**完全退出 DSH（含托盘）再打开**；只刷新页面会继续用旧宿主代码 |
| 下拉菜单点不到/错位、页面内容上移 | v0.2 在 `immersive` 皮肤下的已知 bug，v0.3 已修复。若仍出现：刷新页面（确认加载的 skin.css 是 0.5.0） |
| 启动进度条没到 100% 就结束 | v0.2 的已知问题，v0.3 起已修（v0.5 为 12.10s 到 100%、定格 0.6s 后柔化交接） |
| 91%→92% 附近地球像静帧/跳一下 | v0.4 的已知根因（earth 长 GOP seek 冻结 1.9s），v0.5 已用短 GOP 重编码 + 预 seek 修复；若仍有，确认宿主已重启（加载的 earth 视频是短 GOP 版） |
| 没有声音 | ① 设置里 `sound=false` 或 `volume=0`；② 浏览器自动播放策略拦截时首次点击页面后恢复；③ 幕 II 机械臂音效来自 `lib/assets/audio/moss-arm-sfx.m4a`，缺失时自动回退合成层（此时听感与 v0.4 相同）；可先听 `_work/v05/audio/moss2-boot-audio-v05.wav` 确认 |
| 背景是静态图/不动的 | 只有 quality=saver（仅海报）或视频加载失败时才静态；系统「减少动态效果」**不会**再让背景不动（v0.2 已修复）。若仍静态：检查设置里 quality、或 lib/assets/earth/*.mp4 是否 404 |
| 背景视频不播 | 宿主静音自动播放被策略拦截时插件会自动退到海报（不会黑屏）；确认产物 `lib/assets/earth/earth-720.mp4` 存在 |
| 交接后背景冻结/不动 | v0.5 有 4 路兜底（done/fallback/启动层结束/15.5s）强制恢复 ambient 播放；若仍冻结，把 `__DSH_MOSS2_AMBIENT_HANDOFF__` 探针内容与 `_work/verify5/` 一起反馈 |
| 界面太暗/太亮 | 设置里调「背景压暗」（veil）与「玻璃模糊」（blur）；`veil` 越小地球越清楚 |
| 卡顿/风扇响 | `quality=standard`→`saver`，`blur=0`；或关闭皮肤档位 |
| 浅色主题下也变深色 | 本皮肤是深色驾驶舱设定（设计如此），可在设置里选「关闭」档只保留启动动画 |
| 与其它启动插件冲突 | 同一 profile 只启用一个：先移除 `dsh-startup-vyron` / `dsh-startup-elisa` / `dsh-startup-moss` 再装本插件 |
| 启动动画缺少 MOSS/地球视频 | 确认 Host 已重启；`lib/assets/{neuro,moss,earth}/` 下视频存在 |

## 6. 互斥与授权

- 同一 profile 只建议启用一个启动/皮肤插件；本插件与上一代 `dsh-startup-moss`、`dsh-startup-vyron`、`dsh-startup-elisa` 互斥。
- 内嵌素材（地球视频 / MOSS 机体视频）来自 Steam Wallpaper Engine 创意工坊，**仅限本机自用**；
  v0.5 新增的 MOSS 机械臂音效来自用户自制素材，同样**仅限本机自用**。对外分发只允许代码部分
  （缺失素材时按降级链运行）。详见 `THIRD-PARTY-NOTICES.md`。
