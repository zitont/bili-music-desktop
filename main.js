const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const createBiliWindow = require('./windows').createBiliWindow;
const createBiliWindow2 = require('./windows').createBiliWindow2;
const dbOperations = require('./db');

// 窗口实例
let mainWindow = null;
let biliWindow = null;
let biliWindow2 = null;
let tray = null;

// 加载超时时间（毫秒）
const WINDOW_LOAD_TIMEOUT = 30000;

// 窗口状态文件路径
const WINDOW_STATE_PATH = path.join(app.getPath('userData'), 'window-state.json');

// 默认窗口尺寸
const DEFAULT_WINDOW_STATE = {
  width: 1100,
  height: 730,
  x: undefined,
  y: undefined,
  isMaximized: false,
};

/**
 * 加载保存的窗口状态
 */
function loadWindowState() {
  try {
    if (fs.existsSync(WINDOW_STATE_PATH)) {
      const data = JSON.parse(fs.readFileSync(WINDOW_STATE_PATH, 'utf-8'));
      return { ...DEFAULT_WINDOW_STATE, ...data };
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  return { ...DEFAULT_WINDOW_STATE };
}

/**
 * 保存窗口状态
 */
function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  const isMaximized = mainWindow.isMaximized();
  const bounds = isMaximized ? mainWindow.getNormalBounds() : mainWindow.getBounds();

  const state = {
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    isMaximized,
  };

  try {
    fs.writeFileSync(WINDOW_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

/**
 * 初始化数据库
 */
function initDatabase() {
  dbOperations.initDatabase();
}

/**
 * 创建主窗口
 * @returns {BrowserWindow} 返回创建的浏览器窗口实例
 */
function createMainWindow() {
  const windowState = loadWindowState();

  const win = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets/bilibili.png'),
    frame: false,
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload/index.js'),
    },
  });

  // 为哔哩哔哩 CDN 图片添加 Referer 头，解决 403 问题
  win.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.hdslb.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.bilibili.com/';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // 恢复最大化状态
  if (windowState.isMaximized) {
    win.maximize();
  }

  // 窗口准备好后显示（避免白屏闪烁）
  win.once('ready-to-show', () => {
    win.show();
  });

  // 加载页面
  if (app.isPackaged) {
    win.loadFile('dist/index.html');
  } else {
    win.loadURL('http://localhost:3001');
  }

  // 窗口移动或缩放时保存状态
  win.on('resize', saveWindowState);
  win.on('move', saveWindowState);
  win.on('maximize', saveWindowState);
  win.on('unmaximize', saveWindowState);

  // 窗口关闭时清理
  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

/**
 * 创建系统托盘
 */
function createTray() {
  const iconPath = path.join(__dirname, 'assets/bilibili.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主窗口', click: () => mainWindow?.show() },
    { type: 'separator' },
    { label: '上一首', click: () => playPrevious() },
    { label: '播放/暂停', click: () => togglePlay() },
    { label: '下一首', click: () => playNext() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() },
  ]);

  tray.setToolTip('Bili Music');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * 安全地执行 JavaScript
 * @param {BrowserWindow} window - 目标窗口
 * @param {string} code - JavaScript 代码
 * @param {number} timeout - 超时时间
 * @returns {Promise<any>}
 */
function safeExecuteJavaScript(window, code, timeout = WINDOW_LOAD_TIMEOUT) {
  return new Promise((resolve, reject) => {
    if (!window || window.isDestroyed()) {
      reject(new Error('Window is not available'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Execute JavaScript timeout'));
    }, timeout);

    window.webContents.executeJavaScript(code)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * 获取视频当前播放时间
 * @param {number} time - 视频播放时间，单位为秒
 * @returns {Promise<number>}
 */
async function getVideoCurrentTime(time) {
  if (!biliWindow || biliWindow.isDestroyed()) {
    throw new Error('Bili window is not available');
  }

  const timeParam = JSON.stringify(time);
  const code = `
    (() => {
      const videoDom = document.getElementsByTagName('video')[0];
      if (!videoDom) return 0;
      const time = ${timeParam};
      if (time === undefined || time === null || time === '') {
        return videoDom.currentTime;
      }
      videoDom.currentTime = Number(time);
      return videoDom.currentTime;
    })()
  `;

  return safeExecuteJavaScript(biliWindow, code);
}

/**
 * 设置播放器音量
 * @param {number} volume - 音量值（0-1）
 * @returns {Promise<number>}
 */
async function setPlayerVolume(volume) {
  if (!biliWindow || biliWindow.isDestroyed()) {
    throw new Error('Bili window is not available');
  }

  const volumeParam = JSON.stringify(volume);
  const code = `
    (() => {
      const videoDom = document.getElementsByTagName('video')[0];
      if (!videoDom) return 0;
      const volume = ${volumeParam};
      if (volume === undefined || volume === null || volume === '') {
        return videoDom.volume;
      }
      videoDom.volume = Math.max(0, Math.min(1, Number(volume)));
      return videoDom.volume;
    })()
  `;

  return safeExecuteJavaScript(biliWindow, code);
}

/**
 * 获取视频信息
 * @param {string} VideoBvid - 视频 BV 号
 * @returns {Promise<Object>}
 */
async function getVideoInfo(VideoBvid) {
  if (biliWindow2 && !biliWindow2.isDestroyed()) {
    biliWindow2.destroy();
    biliWindow2 = null;
  }

  biliWindow2 = createBiliWindow2(VideoBvid);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (biliWindow2 && !biliWindow2.isDestroyed()) {
        biliWindow2.destroy();
        biliWindow2 = null;
      }
      reject(new Error('Get video info timeout'));
    }, WINDOW_LOAD_TIMEOUT);

    const code = `
      (() => {
        try {
          if (typeof __INITIAL_STATE__ !== 'undefined' && __INITIAL_STATE__) {
            __INITIAL_STATE__.continuousPlay = false;
          }
          const videoData = __INITIAL_STATE__.videoData;
          if (!videoData || !videoData.bvid) return null;
          const bvid = videoData.bvid;
          const videourl = 'https://www.bilibili.com/video/' + bvid;
          const videotitle = videoData.title || '';
          const originalPic = videoData.pic || '';
          const videopic = originalPic.startsWith('http://')
            ? originalPic.replace('http://', 'https://')
            : originalPic;
          let videoduration = 0;
          const videoEl = document.getElementsByTagName('video')[0];
          if (videoEl && !isNaN(videoEl.duration) && isFinite(videoEl.duration)) {
            videoduration = videoEl.duration;
          } else if (videoData.duration) {
            videoduration = videoData.duration;
          }
          const upname = __INITIAL_STATE__.upData?.name || '';
          const uphomepage = __INITIAL_STATE__.upData?.mid
            ? 'https://space.bilibili.com/' + __INITIAL_STATE__.upData.mid
            : '';
          return { bvid, videourl, videotitle, videopic, videoduration, upname, uphomepage };
        } catch (e) {
          return null;
        }
      })()
    `;

    const onLoad = () => {
      if (!biliWindow2 || biliWindow2.isDestroyed()) {
        clearTimeout(timeout);
        reject(new Error('Window destroyed before page load'));
        return;
      }
      setTimeout(() => {
        if (!biliWindow2 || biliWindow2.isDestroyed()) {
          clearTimeout(timeout);
          reject(new Error('Window destroyed before JS execution'));
          return;
        }
        biliWindow2.webContents.executeJavaScript(code, true)
          .then((videoInfo) => {
            clearTimeout(timeout);
            if (biliWindow2 && !biliWindow2.isDestroyed()) {
              biliWindow2.destroy();
              biliWindow2 = null;
            }
            resolve(videoInfo);
          })
          .catch((error) => {
            clearTimeout(timeout);
            if (biliWindow2 && !biliWindow2.isDestroyed()) {
              biliWindow2.destroy();
              biliWindow2 = null;
            }
            reject(error);
          });
      }, 1500);
    };

    const onFail = (_, errorCode, errorDescription) => {
      clearTimeout(timeout);
      if (biliWindow2 && !biliWindow2.isDestroyed()) {
        biliWindow2.destroy();
        biliWindow2 = null;
      }
      reject(new Error('Page load failed: ' + errorDescription));
    };

    biliWindow2.webContents.once('did-finish-load', onLoad);
    biliWindow2.webContents.once('did-fail-load', onFail);

    biliWindow2.webContents.once('destroyed', () => {
      clearTimeout(timeout);
      reject(new Error('Window destroyed'));
    });
  });
}

/**
 * 获取视频时长
 * @returns {Promise<number>}
 */
async function getVideoDuration() {
  if (!biliWindow || biliWindow.isDestroyed()) {
    throw new Error('Bili window is not available');
  }

  const code = `
    (() => {
      const videoDom = document.getElementsByTagName('video')[0];
      if (!videoDom) return 0;
      return videoDom.duration;
    })()
  `;

  return safeExecuteJavaScript(biliWindow, code);
}

/**
 * 插入视频信息到数据库
 * @param {Object} videoInfo - 视频信息
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function InsertVideoinfo(videoInfo) {
  if (!videoInfo || typeof videoInfo !== 'object') {
    return { success: false, error: '参数无效：videoInfo 不是对象' };
  }
  if (!videoInfo.bvid) {
    return { success: false, error: '缺少必填字段：bvid' };
  }

  const sql1 = `INSERT OR REPLACE INTO video (
    video_bvid, video_title, video_img_url, video_startTime,
    video_endtime, video_duration, video_url, up_name, up_home
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const sql2 = `INSERT OR REPLACE INTO videolist_videos (videolist_id, video_bvid) VALUES (?, ?)`;

  const params1 = [
    videoInfo.bvid,
    videoInfo.videotitle || '',
    videoInfo.videopic || '',
    typeof videoInfo.videostart === 'number' ? videoInfo.videostart : 0,
    typeof videoInfo.videoend === 'number' ? videoInfo.videoend : 0,
    typeof videoInfo.videoduration === 'number' ? videoInfo.videoduration : 0,
    videoInfo.videourl || '',
    videoInfo.upname || '',
    videoInfo.uphomepage || ''
  ];
  const params2 = [Number(videoInfo.videolist_id) || 1, videoInfo.bvid];

  try {
    dbOperations.runTransaction(() => {
      dbOperations.insert(sql1, params1);
      dbOperations.insert(sql2, params2);
    });
    return { success: true };
  } catch (e) {
    if (e.message && e.message.includes('no such table')) {
      console.warn('数据库表缺失，尝试重新创建');
      try {
        dbOperations.ensureTables();
        dbOperations.runTransaction(() => {
          dbOperations.insert(sql1, params1);
          dbOperations.insert(sql2, params2);
        });
        return { success: true };
      } catch (retryError) {
        console.error('InsertVideoinfo retry error:', retryError);
        return { success: false, error: retryError.message };
      }
    }
    console.error('InsertVideoinfo error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * 播放上一首
 */
function playPrevious() {
  // 由渲染进程处理
  mainWindow?.webContents.send('player:previous');
}

/**
 * 播放下一首
 */
function playNext() {
  // 由渲染进程处理
  mainWindow?.webContents.send('player:next');
}

/**
 * 切换播放/暂停
 */
function togglePlay() {
  // 由渲染进程处理
  mainWindow?.webContents.send('player:toggle');
}

/**
 * 注册全局快捷键
 */
function registerShortcuts() {
  // 开发工具快捷键（仅开发环境）
  if (!app.isPackaged) {
    globalShortcut.register('Ctrl+Shift+D', () => {
      mainWindow?.webContents.openDevTools();
    });

    globalShortcut.register('Ctrl+Shift+B', () => {
      if (biliWindow && !biliWindow.isDestroyed()) {
        biliWindow.webContents.openDevTools();
      }
    });
  }

  // 媒体键
  globalShortcut.register('MediaPlayPause', () => togglePlay());
  globalShortcut.register('MediaNextTrack', () => playNext());
  globalShortcut.register('MediaPreviousTrack', () => playPrevious());
}

/**
 * 应用退出清理
 */
async function cleanup() {
  console.log('Starting cleanup...');

  // 注销全局快捷键
  globalShortcut.unregisterAll();

  // 销毁系统托盘
  if (tray) {
    tray.destroy();
    tray = null;
  }

  // 关闭隐藏窗口
  if (biliWindow && !biliWindow.isDestroyed()) {
    biliWindow.destroy();
    biliWindow = null;
  }

  if (biliWindow2 && !biliWindow2.isDestroyed()) {
    biliWindow2.destroy();
    biliWindow2 = null;
  }

  // 关闭数据库连接
  try {
    await dbOperations.closeDatabase();
  } catch (error) {
    console.error('Error closing database:', error);
  }

  console.log('Cleanup completed');
}

// ==================== IPC 处理器 ====================

// 窗口控制
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.handle('window:close', async () => {
  await cleanup();
  app.quit();
});

// 视频播放
ipcMain.handle('player:getCurrentTime', async (event, time) => {
  try {
    return await getVideoCurrentTime(time);
  } catch (error) {
    console.error('Error getting video current time:', error);
    return null;
  }
});

ipcMain.handle('player:setVolume', async (event, volume) => {
  try {
    return await setPlayerVolume(volume);
  } catch (error) {
    console.error('Error setting volume:', error);
    return null;
  }
});

ipcMain.handle('player:getVideoInfo', async (event, VideoBvid) => {
  try {
    return await getVideoInfo(VideoBvid);
  } catch (error) {
    console.error('Error getting video info:', error);
    return null;
  }
});

ipcMain.handle('player:getDuration', async () => {
  try {
    return await getVideoDuration();
  } catch (error) {
    console.error('Error getting video duration:', error);
    return null;
  }
});

ipcMain.handle('player:play', (event, MusicBvid) => {
  // 关闭之前的窗口
  if (biliWindow && !biliWindow.isDestroyed()) {
    biliWindow.destroy();
  }

  biliWindow = createBiliWindow(MusicBvid);

  if (biliWindow) {
    biliWindow.webContents.on('did-finish-load', () => {
      const code = `
        (() => {
          const player = document.querySelector('video');
          if (player) {
            setTimeout(() => player.play(), 1000);
          }
        })()
      `;
      safeExecuteJavaScript(biliWindow, code).catch(console.error);
    });
  }

  return true;
});

ipcMain.handle('player:control', (event, action) => {
  if (!biliWindow || biliWindow.isDestroyed()) {
    return false;
  }

  const code = `
    (() => {
      const player = document.querySelector('video');
      if (!player) return false;
      if (${JSON.stringify(action)} === 'play') {
        player.play();
      } else {
        player.pause();
      }
      return true;
    })()
  `;

  return safeExecuteJavaScript(biliWindow, code).catch(() => false);
});

// 系统信息
ipcMain.handle('system:getInfo', () => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      electronVersion: process.versions.electron,
      os: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      memory: `${Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100} GB / ${Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100} GB`,
      platform: process.platform,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return null;
  }
});

// 数据库操作
ipcMain.handle('db:getPlaylists', async () => {
  try {
    const sql = `
      SELECT vl.*, COUNT(vlv.video_bvid) AS video_count
      FROM video_lists vl
      LEFT JOIN videolist_videos vlv ON vl.videolists_id = vlv.videolist_id
      GROUP BY vl.videolists_id
      ORDER BY vl.videolists_id
    `;
    return await dbOperations.executeQuery(sql, []);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
});

ipcMain.handle('db:getPlaylistVideos', async (event, listsid) => {
  const sql = `
    SELECT video.video_bvid, video.video_img_url, video.video_title,
           video.video_startTime, video.video_duration, video.video_url,
           video.up_name, video.up_home
    FROM video_lists
    JOIN videolist_videos ON video_lists.videolists_id = videolist_videos.videolist_id
    JOIN video ON videolist_videos.video_bvid = video.video_bvid
    WHERE video_lists.videolists_id = ?
  `;

  try {
    const result = await dbOperations.executeQuery(sql, [listsid || 1]);
    return result;
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    return [];
  }
});

ipcMain.handle('db:addVideo', async (event, videoInfo) => {
  try {
    return await InsertVideoinfo(videoInfo);
  } catch (error) {
    console.error('Error in db:addVideo handler:', error);
    return { success: false, error: '内部错误：' + error.message };
  }
});

// 歌单操作
ipcMain.handle('db:createPlaylist', async (event, name) => {
  const sql = 'INSERT INTO video_lists (videolist_name) VALUES (?)';
  try {
    await dbOperations.insert(sql, [name]);
    return true;
  } catch (error) {
    console.error('Error creating playlist:', error);
    return false;
  }
});

ipcMain.handle('db:updatePlaylist', async (event, { id, name }) => {
  const sql = 'UPDATE video_lists SET videolist_name = ? WHERE videolists_id = ?';
  try {
    await dbOperations.insert(sql, [name, id]);
    return true;
  } catch (error) {
    console.error('Error updating playlist:', error);
    return false;
  }
});

ipcMain.handle('db:deletePlaylist', async (event, id) => {
  const sql = 'DELETE FROM video_lists WHERE videolists_id = ?';
  try {
    await dbOperations.insert(sql, [id]);
    return true;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return false;
  }
});

// 视频操作
ipcMain.handle('db:updateVideo', async (event, { bvid, title, startTime, endTime }) => {
  const sql = `UPDATE video SET video_title = ?, video_startTime = ?, video_endtime = ? WHERE video_bvid = ?`;
  try {
    await dbOperations.insert(sql, [title, startTime, endTime, bvid]);
    return true;
  } catch (error) {
    console.error('Error updating video:', error);
    return false;
  }
});

ipcMain.handle('db:deleteVideo', async (event, bvid) => {
  const sql = 'DELETE FROM video WHERE video_bvid = ?';
  try {
    await dbOperations.insert(sql, [bvid]);
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
});

// ==================== 应用生命周期 ====================

// 单实例锁：防止重复启动
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // 初始化数据库
    initDatabase();

    // 创建主窗口
    mainWindow = createMainWindow();

    // 创建系统托盘
    createTray();

    // 注册快捷键
    registerShortcuts();

    // macOS: 点击 dock 图标时重新创建窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow();
      }
    });
  });
}

// 所有窗口关闭时
app.on('window-all-closed', async () => {
  await cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前
app.on('before-quit', async () => {
  await cleanup();
});

// 进程异常处理
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
