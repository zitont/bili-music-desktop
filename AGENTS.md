# AGENTS.md

## 开发命令

```bash
npm run dev              # Vite 开发服务器（端口 3001）
npm run electron:start   # 另开终端，nodemon 热重载启动 Electron
npm run build:vite       # vue-tsc 类型检查 + Vite 构建
npm run electron:pack    # 打包为目录（调试用）
npm run electron:dist    # 构建 Windows x64 安装包
npm run lint             # ESLint 检查并自动修复
npm run format           # Prettier 格式化 src/
npm test                 # Vitest 运行
```

**启动顺序**：先 `npm run dev`（Vite HMR），再另开终端 `npm run electron:start`。

## 进程边界

- **主进程** `main.js windows.js db.js preload/` — 纯 JavaScript，不可用 TS/ESM
- **渲染进程** `src/` — Vue 3 + TypeScript，可全量 TS
- 主进程通过 `electron` 远程模块通信，渲染进程通过 `contextBridge` 暴露的 `window.electronAPI` 通信

## electronAPI 命名（来自 preload）

渲染进程调用 `window.electronAPI.xxx()`，命名规则非 IPC 通道名：

| 调用方 | 实际方法 | 对应 IPC |
|--------|----------|----------|
| 窗口 | `WindowMin/Max/Close` | `window:minimize/maximize/close` |
| 播放 | `VideoSetBvid(bvid)` | `player:play` |
| 播放 | `VideoPlaySet(0\|1)` | `player:control` |
| 播放 | `VideoCurrentTime(time?)` | `player:getCurrentTime` |
| 播放 | `VideoDuration()` | `player:getDuration` |
| 播放 | `VideoSetVolume(0-1)` | `player:setVolume` |
| 播放 | `VideoGetinfo(bvid)` | `player:getVideoInfo` |
| 数据库 | `VideoGetLists()` | `db:getPlaylists` |
| 数据库 | `VideoGetListsID(id)` | `db:getPlaylistVideos` |
| 数据库 | `InsertVideoinfo(info)` | `db:addVideo` |
| 事件监听 | `onTogglePlay/onPlayPrevious/onPlayNext(cb)` | `player:toggle/previous/next` |

监听器需在 `onUnmounted` 中清理（主进程推送给渲染进程的唯一通道）。

## TypeScript 约束

`tsconfig.json` 启用 `strict` + `noUnusedLocals` + `noUnusedParameters` + `noFallthroughCasesInSwitch`。`vue-tsc` 版本 `^1.8.27` 与 Vue 3.5 不兼容（应为 v2.x），`npm run build:vite` 的类型检查阶段可能失败。

## 数据库

- 引擎：`better-sqlite3`（同步 API，主进程独占）
- 路径：开发环境 `data/bilibili.db`，生产环境 `extraResources`
- 3 表：`video_lists` / `video` / `videolist_videos`（多对多）
- 含默认歌单（`videolists_id=1` "默认收藏夹"）

## 样式约定

- 暗色主题：Naive UI `darkTheme` + `index.html` 根元素 `class="dark"`
- CSS 变量：`src/styles/dark/css-vars.css` 在 `html.dark` 选择器下
- Naive UI 组件覆盖：使用 `:deep(.n-slider)` / `:deep(.svg-icon)`
- SvgIcon：全局注册，图标名来自 iconfont JS，前缀 `icon-`

## 构建与打包

- `.env` 需要 `VITE_CJS_IGNORE_WARNING=true` 抑制 CJS 警告
- `vite-plugin-electron` 构建主进程到 `build/`，externals `electron` + `better-sqlite3`
- CI（`.github/workflows/ci.yml`）顺序：`lint` → `test` → `build:vite` → `electron:pack`

## 复制陷阱

- `npm run build:vite` 中 `vue-tsc` 类型检查可能因版本不匹配失败，可单独 `vite build` 跳过
- 隐藏窗口有两个：`biliWindow`（持续播放）和 `biliWindow2`（临时抓取元信息后销毁）
- `formatTime(seconds)` 返回 `HH:MM:SS` 格式
- `window.electronAPI` 无 TS 类型定义，调用时无 IDE 提示
