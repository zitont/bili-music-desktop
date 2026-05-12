const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const createBiliWindow = require('./windows').createBiliWindow;
const createBiliWindow2 = require('./windows').createBiliWindow2;
const dbOperations = require('./db');
const { loadWindowState, saveWindowState: saveWindowStateToFile } = require('./main/window-state');
const { safeExecuteJavaScript, isSafeUrl, formatMemorySize } = require('./main/utils');
const {
  getVideoCurrentTime,
  setPlayerVolume,
  getVideoDuration,
  controlPlayback,
  getVideoInfo,
} = require('./main/player');
const { AudioAnalyzer } = require('./main/audio-analyzer');
const { ShortcutManager } = require('./main/shortcuts');
const { TrayManager } = require('./main/tray');

// 窗口实例
let mainWindow = null;
let biliWindow = null;
let biliWindow2 = null;

// 管理器实例
const audioAnalyzer = new AudioAnalyzer();
const shortcutManager = new ShortcutManager();
const trayManager = new TrayManager();

// 加载超时时间（毫秒）
const WINDOW_LOAD_TIMEOUT = 30000;

/**
 * 保存窗口状态（包装函数）
 */
function saveWindowState() {
  saveWindowStateToFile(mainWindow, app.getPath('userData'));
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
  const windowState = loadWindowState(app.getPath('userData'));

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
 * 应用退出清理
 */
async function cleanup() {
  console.log('Starting cleanup...');

  // 停止音频轮询
  audioAnalyzer.stopPolling();

  // 注销全局快捷键
  shortcutManager.unregisterAll();

  // 销毁系统托盘
  trayManager.destroy();

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
    return await getVideoCurrentTime(biliWindow, time);
  } catch (error) {
    console.error('Error getting video current time:', error);
    return null;
  }
});

ipcMain.handle('player:setVolume', async (event, volume) => {
  try {
    return await setPlayerVolume(biliWindow, volume);
  } catch (error) {
    console.error('Error setting volume:', error);
    return null;
  }
});

ipcMain.handle('player:getVideoInfo', async (event, VideoBvid) => {
  try {
    return await getVideoInfo(createBiliWindow2, VideoBvid);
  } catch (error) {
    console.error('Error getting video info:', error);
    return null;
  }
});

ipcMain.handle('player:getDuration', async () => {
  try {
    return await getVideoDuration(biliWindow);
  } catch (error) {
    console.error('Error getting video duration:', error);
    return null;
  }
});

ipcMain.handle('player:play', (event, param) => {
  let MusicBvid;
  let startTime = 0;
  let volume = null;
  if (typeof param === 'object' && param !== null) {
    MusicBvid = param.bvid;
    startTime = param.startTime || 0;
    volume = param.volume != null ? param.volume : null;
  } else {
    MusicBvid = param;
  }

  if (biliWindow && !biliWindow.isDestroyed()) {
    biliWindow.destroy();
  }

  audioAnalyzer.stopPolling();

  biliWindow = createBiliWindow(MusicBvid);

  if (biliWindow) {
    biliWindow.webContents.on('did-finish-load', () => {
      const code = `
        (() => {
          const player = document.querySelector('video');
          if (player) {
            setTimeout(() => {
              player.play();
              const st = ${JSON.stringify(startTime)};
              if (st > 0) {
                const trySeek = () => {
                  if (player.readyState >= 1) {
                    player.currentTime = st;
                  } else {
                    setTimeout(trySeek, 200);
                  }
                };
                trySeek();
              }
              const vol = ${JSON.stringify(volume)};
              if (vol != null) {
                player.volume = Math.max(0, Math.min(1, Number(vol)));
              }
            }, 1000);
            setTimeout(() => {
              try {
                if (!window.__audioAnalyser) {
                  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                  const analyser = audioCtx.createAnalyser();
                  analyser.fftSize = 256;
                  const source = audioCtx.createMediaElementSource(player);
                  source.connect(analyser);
                  analyser.connect(audioCtx.destination);
                  audioCtx.resume();
                  window.__audioAnalyser = analyser;
                  window.__audioBuffer = new Uint8Array(analyser.frequencyBinCount);
                }
              } catch(e) { }
            }, 2000);
          }
        })()
      `;
      safeExecuteJavaScript(biliWindow, code).catch(console.error);

      // 设置音频分析器窗口引用并开始轮询
      audioAnalyzer.setWindows(mainWindow, biliWindow);
      setTimeout(() => audioAnalyzer.startPolling(), 3000);
    });
  }

  return true;
});

ipcMain.handle('player:control', async (event, action) => {
  try {
    return await controlPlayback(biliWindow, action);
  } catch (error) {
    console.error('Error controlling playback:', error);
    return false;
  }
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
      memory: `${formatMemorySize(usedMem)} / ${formatMemorySize(totalMem)}`,
      platform: process.platform,
      nodeVersion: process.versions.node,
      chromeVersion: process.versions.chrome,
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return null;
  }
});

// 外部链接
ipcMain.handle('shell:openExternal', (event, url) => {
  if (isSafeUrl(url)) {
    shell.openExternal(url);
  }
});

// 主题切换（亮/暗）
ipcMain.handle('theme:set', (event, isDark) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setBackgroundColor(isDark ? '#0a0a0a' : '#ffffff');
});

// 选择数据目录
ipcMain.handle('select-data-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: '选择数据存储目录',
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: false };
  }
  const selectedPath = result.filePaths[0];
  try {
    const configPath = app.isPackaged
      ? path.join(path.dirname(process.execPath), 'data-dir.cfg')
      : path.join(__dirname, 'data-dir.cfg');
    fs.writeFileSync(configPath, selectedPath, 'utf-8');
    return { success: true, path: selectedPath };
  } catch (error) {
    console.error('保存数据目录失败:', error);
    return { success: false, error: error.message };
  }
});

// 获取当前数据目录
ipcMain.handle('get-data-directory', () => {
  try {
    const configPath = app.isPackaged
      ? path.join(path.dirname(process.execPath), 'data-dir.cfg')
      : path.join(__dirname, 'data-dir.cfg');
    if (fs.existsSync(configPath)) {
      const dir = fs.readFileSync(configPath, 'utf-8').trim();
      if (dir && fs.existsSync(dir)) {
        return { path: dir };
      }
    }
  } catch {
    // ignore
  }
  return { path: null };
});

// 数据库操作
ipcMain.handle('db:getPlaylists', async () => {
  try {
    const sql = `
      SELECT vl.videolists_id, vl.videolist_name, vl.description, vl.sort_order,
             COUNT(vlv.video_bvid) AS video_count
      FROM video_lists vl
      LEFT JOIN videolist_videos vlv ON vl.videolists_id = vlv.videolist_id
      GROUP BY vl.videolists_id
      ORDER BY vl.sort_order, vl.videolists_id
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
ipcMain.handle('db:createPlaylist', async (event, { name, description = '' }) => {
  const sql = 'INSERT INTO video_lists (videolist_name, description) VALUES (?, ?)';
  try {
    await dbOperations.insert(sql, [name, description]);
    return true;
  } catch (error) {
    console.error('Error creating playlist:', error);
    return false;
  }
});

ipcMain.handle('db:updatePlaylist', async (event, { id, name, description }) => {
  const sql = 'UPDATE video_lists SET videolist_name = ?, description = ? WHERE videolists_id = ?';
  try {
    await dbOperations.insert(sql, [name, description || '', id]);
    return true;
  } catch (error) {
    console.error('Error updating playlist:', error);
    return false;
  }
});

ipcMain.handle('db:deletePlaylist', async (event, id) => {
  if (id === 1) {
    return { success: false, error: '默认歌单不能删除' };
  }
  try {
    dbOperations.runTransaction(() => {
      dbOperations.insert('DELETE FROM videolist_videos WHERE videolist_id = ?', [id]);
      dbOperations.insert('DELETE FROM video_lists WHERE videolists_id = ?', [id]);
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return { success: false, error: error.message };
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
  try {
    dbOperations.runTransaction(() => {
      dbOperations.insert('DELETE FROM videolist_videos WHERE video_bvid = ?', [bvid]);
      dbOperations.insert('DELETE FROM video WHERE video_bvid = ?', [bvid]);
    });
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
});

ipcMain.handle('db:moveVideo', async (event, { bvid, fromPlaylistId, toPlaylistId }) => {
  try {
    dbOperations.runTransaction(() => {
      dbOperations.insert('DELETE FROM videolist_videos WHERE videolist_id = ? AND video_bvid = ?', [fromPlaylistId, bvid]);
      dbOperations.insert('INSERT OR REPLACE INTO videolist_videos (videolist_id, video_bvid) VALUES (?, ?)', [toPlaylistId, bvid]);
    });
    return { success: true };
  } catch (error) {
    console.error('Error moving video:', error);
    return { success: false, error: error.message };
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
    trayManager.createTray(path.join(__dirname, 'assets/bilibili.png'), {
      onShowWindow: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
      onPlayPrevious: () => playPrevious(),
      onTogglePlay: () => togglePlay(),
      onPlayNext: () => playNext(),
      onQuit: () => app.quit(),
    });

    // 注册快捷键
    shortcutManager.registerMediaKeys({
      onTogglePlay: () => togglePlay(),
      onPlayPrevious: () => playPrevious(),
      onPlayNext: () => playNext(),
    });

    shortcutManager.registerDevToolsKeys(app.isPackaged, {
      onOpenDevTools: () => mainWindow?.webContents.openDevTools(),
    });

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
