const { globalShortcut } = require('electron');

/**
 * 快捷键管理器
 */
class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
  }

  /**
   * 注册媒体键
   * @param {Object} handlers - 处理函数集合
   * @param {Function} handlers.onTogglePlay - 切换播放/暂停
   * @param {Function} handlers.onPlayPrevious - 播放上一首
   * @param {Function} handlers.onPlayNext - 播放下一首
   */
  registerMediaKeys(handlers) {
    const { onTogglePlay, onPlayPrevious, onPlayNext } = handlers;

    this.register('MediaPlayPause', onTogglePlay);
    this.register('MediaNextTrack', onPlayNext);
    this.register('MediaPreviousTrack', onPlayPrevious);
  }

  /**
   * 注册开发工具快捷键（仅开发环境）
   * @param {boolean} isPackaged - 是否为打包环境
   * @param {Object} handlers - 处理函数集合
   * @param {Function} handlers.onOpenDevTools - 打开开发工具
   */
  registerDevToolsKeys(isPackaged, handlers) {
    if (isPackaged) return;

    const { onOpenDevTools } = handlers;

    this.register('Ctrl+Shift+D', onOpenDevTools);
  }

  /**
   * 注册单个快捷键
   * @param {string} accelerator - 快捷键组合
   * @param {Function} callback - 回调函数
   * @returns {boolean} 是否注册成功
   */
  register(accelerator, callback) {
    try {
      const success = globalShortcut.register(accelerator, callback);
      if (success) {
        this.shortcuts.set(accelerator, callback);
      }
      return success;
    } catch (error) {
      console.error(`Failed to register shortcut ${accelerator}:`, error);
      return false;
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll() {
    globalShortcut.unregisterAll();
    this.shortcuts.clear();
  }

  /**
   * 检查快捷键是否已注册
   * @param {string} accelerator - 快捷键组合
   * @returns {boolean}
   */
  isRegistered(accelerator) {
    return this.shortcuts.has(accelerator);
  }

  /**
   * 获取已注册的快捷键数量
   * @returns {number}
   */
  getRegisteredCount() {
    return this.shortcuts.size;
  }
}

module.exports = { ShortcutManager };
