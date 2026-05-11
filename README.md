# Bili Music Desktop

基于 Electron + Vue 3 的 Bilibili 音乐播放器桌面客户端。

## 功能

- 通过 BVID 添加并播放 Bilibili 视频音频
- 歌单管理（多对多关系）
- 自定义播放区间（剪辑模式）
- 亮色/暗色主题切换
- 动态背景动画（涟漪、波形、粒子、频谱、放射、极光）
- 全局快捷键控制播放
- 磨砂玻璃 UI 设计

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Vue 3.5 + TypeScript |
| 构建 | Vite 5 |
| 桌面 | Electron 28 |
| UI | Naive UI |
| 数据库 | better-sqlite3 |
| 图标 | iconfont SVG 图标 |

## 开发

```bash
# 安装依赖
npm install

# 终端 1：启动 Vite 开发服务器（端口 3001）
npm run dev

# 终端 2：启动 Electron（带 nodemon 热重载）
npm run electron:start
```

## 构建

```bash
# 仅构建渲染进程
npm run build:vite

# 打包为目录（调试用）
npm run electron:pack

# 构建 Windows x64 安装包
npm run electron:dist
```

## 代码质量

```bash
npm run lint    # ESLint 检查并自动修复
npm run format  # Prettier 格式化
npm test        # Vitest 运行测试
```

## 项目结构

```
src/
  components/      # Vue 组件
  store/           # Pinia 状态管理
  router/          # Vue Router 路由
  styles/          # CSS 变量与主题
  utils/           # 工具函数
  assets/          # 静态资源
preload/           # Electron 预加载脚本
main.js            # Electron 主进程
db.js              # 数据库管理
windows.js         # 窗口管理
```

## 许可

MIT
