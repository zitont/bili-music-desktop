# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Bili Music Desktop 是基于 Electron + Vue 3 的哔哩哔哩音乐桌面客户端，应用 ID 为 `bili.music`。优先适配 Windows 桌面端。

## 常用命令

```bash
# 开发
npm run dev                    # 启动 Vite 开发服务器（端口 3001）
npm run electron:start         # 使用 nodemon 热重载启动 Electron

# 构建
npm run build:vite             # TypeScript 类型检查 + Vite 构建
npm run build:electron         # Electron Builder 打包
npm run electron:dist          # 构建 Windows x64 安装包
npm run electron:pack          # 打包为目录（调试用）

# 代码规范
npm run lint                   # ESLint 检查并自动修复
npm run format                 # Prettier 格式化代码

# 测试
npm test                       # 运行测试
npm run test:watch             # 监听模式运行测试
```

## 技术栈

- **前端**：Vue 3.5 + TypeScript + Naive UI 2.44 + Pinia 2.3
- **桌面框架**：Electron 29 + vite-plugin-electron
- **数据库**：SQLite3（本地存储，位于 `data/bilibili.db`）
- **打包工具**：electron-builder（配置在 package.json 的 `build` 字段）
- **测试框架**：Vitest + Vue Test Utils

## 架构要点

### 进程模型

- **主进程**：`main.js`（纯 JavaScript）负责窗口管理、数据库操作、系统交互（托盘、媒体键）
- **渲染进程**：`src/` 目录下使用 Vue 3 + TypeScript
- **预加载脚本**：`preload/index.js` 通过 contextBridge 暴露 IPC 接口
- **安全配置**：`contextIsolation: true`，`nodeIntegration: false`

### 目录结构

```
├── main.js              # Electron 主进程入口
├── windows.js           # 窗口管理（无边框、隐藏窗口加载B站页面）
├── db.js                # SQLite 数据库操作
├── preload/index.js     # IPC 桥接（contextBridge）
├── data/bilibili.db     # 本地数据库
├── assets/bilibili.png  # 应用图标
├── src/
│   ├── components/      # UI 组件
│   │   ├── Windows/     # 自定义标题栏（最小化/最大化/关闭）
│   │   ├── MainBox/     # 主内容区（视频列表）
│   │   ├── ListBox/     # 收藏夹管理
│   │   ├── Playback/    # 播放控制栏
│   │   ├── ListMenu/    # 收藏夹菜单
│   │   ├── Menu/        # 侧边菜单
│   │   └── SvgIcon/     # SVG 图标组件
│   ├── store/index.ts   # Pinia Store（menus/play/playbackMode/playlist）
│   ├── router/          # Vue Router
│   ├── styles/          # 样式（暗色主题 + CSS 变量）
│   └── utils/           # 工具函数
```

### IPC 通道（命名空间规范）

| 通道 | 方向 | 说明 |
|------|------|------|
| `window:minimize/maximize/close` | 渲染→主 | 窗口控制 |
| `player:play` | 渲染→主 | 播放指定视频 |
| `player:control` | 渲染→主 | 播放/暂停控制 |
| `player:getCurrentTime` | 渲染→主 | 获取/设置播放时间 |
| `player:setVolume` | 渲染→主 | 设置音量 |
| `player:getVideoInfo` | 渲染→主 | 获取视频元信息 |
| `player:getDuration` | 渲染→主 | 获取视频时长 |
| `player:toggle/previous/next` | 主→渲染 | 托盘/媒体键控制 |
| `db:getPlaylists` | 渲染→主 | 获取收藏夹列表 |
| `db:getPlaylistVideos` | 渲染→主 | 获取收藏夹内视频 |
| `db:addVideo` | 渲染→主 | 添加视频到收藏夹 |

### 桌面应用特性

- **无边框窗口**：自定义标题栏，支持拖拽、最小化、最大化、关闭
- **系统托盘**：显示/隐藏窗口、播放控制、退出
- **全局媒体键**：MediaPlayPause/MediaNextTrack/MediaPreviousTrack
- **窗口状态持久化**：自动保存/恢复窗口位置和尺寸
- **进程清理**：退出时销毁所有窗口、注销快捷键、关闭数据库连接

### 路径别名（vite.config.ts）

- `@` → `src`
- `components` → `src/components`
- `store` → `src/store`

## 开发注意事项

1. **JS/TS 混用**：主进程文件（main.js、db.js、windows.js）为纯 JavaScript，前端 Vue 组件使用 TypeScript
2. **UI 框架**：使用 Naive UI，组件以 `n-` 开头，需要包裹 `n-config-provider`
3. **主题配置**：暗色主题配置在 `src/styles/naive-theme.ts`，CSS 变量在 `src/styles/dark/css-vars.css`
4. **数据库路径**：开发环境使用 `data/bilibili.db`，打包时通过 `extraResources` 复制到应用资源目录
5. **B站页面交互**：通过隐藏 BrowserWindow 加载 B站页面，使用 `executeJavaScript` 提取视频信息
6. **CSP 策略**：`index.html` 中配置了内容安全策略，允许加载 `*.hdslb.com` 图片
