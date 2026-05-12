const path = require('path');
const fs = require('fs');

// 默认窗口尺寸
const DEFAULT_WINDOW_STATE = {
  width: 1100,
  height: 730,
  x: undefined,
  y: undefined,
  isMaximized: false,
};

/**
 * 获取窗口状态文件路径
 * @param {string} userDataPath - 用户数据目录路径
 * @returns {string} 状态文件路径
 */
function getWindowStatePath(userDataPath) {
  return path.join(userDataPath, 'window-state.json');
}

/**
 * 加载保存的窗口状态
 * @param {string} userDataPath - 用户数据目录路径
 * @returns {Object} 窗口状态对象
 */
function loadWindowState(userDataPath) {
  const statePath = getWindowStatePath(userDataPath);

  try {
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      return { ...DEFAULT_WINDOW_STATE, ...data };
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  return { ...DEFAULT_WINDOW_STATE };
}

/**
 * 保存窗口状态
 * @param {BrowserWindow} window - 窗口实例
 * @param {string} userDataPath - 用户数据目录路径
 */
function saveWindowState(window, userDataPath) {
  if (!window || window.isDestroyed()) return;

  const statePath = getWindowStatePath(userDataPath);
  const isMaximized = window.isMaximized();
  const bounds = isMaximized ? window.getNormalBounds() : window.getBounds();

  const state = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized,
  };

  try {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

module.exports = {
  getWindowStatePath,
  loadWindowState,
  saveWindowState,
};
