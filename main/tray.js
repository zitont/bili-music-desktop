import { Tray, Menu, nativeImage } from 'electron';

/**
 * 系统托盘管理器
 */
class TrayManager {
  constructor() {
    this.tray = null;
  }

  /**
   * 创建系统托盘
   * @param {string} iconPath - 图标路径
   * @param {Object} handlers - 处理函数集合
   * @param {Function} handlers.onShowWindow - 显示主窗口
   * @param {Function} handlers.onPlayPrevious - 播放上一首
   * @param {Function} handlers.onTogglePlay - 切换播放/暂停
   * @param {Function} handlers.onPlayNext - 播放下一首
   * @param {Function} handlers.onQuit - 退出应用
   */
  createTray(iconPath, handlers) {
    const { onShowWindow, onPlayPrevious, onTogglePlay, onPlayNext, onQuit } = handlers;

    const icon = nativeImage.createFromPath(iconPath);
    this.tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: '显示主窗口', click: onShowWindow },
      { type: 'separator' },
      { label: '上一首', click: onPlayPrevious },
      { label: '播放/暂停', click: onTogglePlay },
      { label: '下一首', click: onPlayNext },
      { type: 'separator' },
      { label: '退出', click: onQuit },
    ]);

    this.tray.setToolTip('Bili Music');
    this.tray.setContextMenu(contextMenu);

    this.tray.on('click', onShowWindow);
  }

  /**
   * 销毁系统托盘
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }

  /**
   * 检查托盘是否存在
   * @returns {boolean}
   */
  exists() {
    return this.tray !== null;
  }
}

export { TrayManager };
