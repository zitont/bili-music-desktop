const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const createBiliWindow = require('./windows').createBiliWindow;
const createBiliWindow2 = require('./windows').createBiliWindow2;
const dbOperations = require('./db');
let mainWindow;
let biliWindow;
let biliWindow2;
function seversql() {
  dbOperations.initDatabase();
}

/**
 * 创建主窗口
 *
 * @returns {BrowserWindow} 返回创建的浏览器窗口实例
 */
function createMainWindow() {
  // 创建一个新的BrowserWindow对象
  const win = new BrowserWindow({
    // 设置窗口宽度为800像素
    width: 1100,
    maxWidth: 1100,
    // 设置窗口高度为600像素
    height: 730,
    maxHeight: 730,
    minHeight: 730,
    minWidth: 1100,
    icon: path.join(__dirname, 'assets/BIliBili2.png'),
    frame: false,

    // 设置webPreferences属性
    webPreferences: {
      // 允许在渲染进程中使用Node.js特性
      nodeIntegration: true,
      // 设置预加载脚本的路径
      preload: path.join(__dirname, 'preload/index.js'),
    },
  });

  // 加载本地服务器上的页面

  // win.loadURL('http://localhost:3001');

  win.loadFile('dist/index.html');

  globalShortcut.register('Ctrl+Shift+D', () => {
    win.webContents.openDevTools()
  })
  seversql();
  return win;
}

/**
 * 获取视频当前播放时间
 *
 * @param {number} time - 视频播放时间，单位为秒
 * @returns {Promise<number>} - 返回视频当前播放时间的Promise对象
 */
function getVideoCurrentTime(time) {
  return new Promise((resolve, reject) => {
    biliWindow.webContents.executeJavaScript(`
      (() => {
        const videoDom = document.getElementsByTagName('video')[0];
        let currentTime;
        if (typeof ${time} === 'undefined' || ${time} === null || ${time} === '') {
          // 如果time为空，获取视频当前时间
          currentTime = videoDom.currentTime;
        } else if (${time} >= videoDom.duration) {
          // 如果time大于或等于视频总时长，设置视频时间为总时长
          videoDom.currentTime = ${time};
          currentTime = videoDom.currentTime;
        } else {
          // 否则，设置视频时间为传入的time值
          videoDom.currentTime = ${time};
          currentTime = videoDom.currentTime;
        }
        return currentTime;
      })()
    `).then((currentTime) => {
      resolve(currentTime);
    }).catch((error) => {
      reject(error);
    });
  });
}
function PlayerVolume(volume) {
  return new Promise((resolve, reject) => {
    biliWindow.webContents.executeJavaScript(`
  // 执行一个立即执行的函数表达式
  (() => {
    // 获取页面中第一个video元素
    const videoDom = document.getElementsByTagName('video')[0];
    const volume = ${volume};
    // 获取video元素的音量
    if (typeof volume === 'undefined' || volume === null || volume === '') {
      // 如果volume为空，获取视频音量
      return videoDom.volume;
    }else{
      return videoDom.volume = ${volume};
    }
  })()
`, true).then((volumeds) => {
      // 将持续时间传递给resolve函数
      resolve(volumeds);
    }).catch((error) => {

      // 如果有错误，将错误传递给reject函数
      reject(error);
    });
  });

}
ipcMain.handle('set-MusicPlayerVolume', async (event, volume) => {

  // const volumed;
  const volumes = PlayerVolume(volume);

  return volumes;
});
function getVideoInfo(VideoBvid) {
  biliWindow2 = createBiliWindow2(VideoBvid);
  return new Promise((resolve, reject) => {
    biliWindow2.webContents.executeJavaScript(`
    (() => {   
      let videoInfo = null;

          const bvid = __INITIAL_STATE__.videoData.bvid;
          const videourl = 'https://www.bilibili.com/video/' + bvid; // 获取视频地址
          const videotitle = __INITIAL_STATE__.videoData.title; // 获取视频标题
          const originalPic = __INITIAL_STATE__.videoData.pic; // 获取视频封面
          const videopic = originalPic.startsWith('http://')
          ? originalPic.replace('http://', 'https://')
         : originalPic;
          const videoduration = document.getElementsByTagName('video')[0]?.duration; // 获取视频时长
          const upname = __INITIAL_STATE__.upData.name; // 获取作者名字
          const uphomepage = 'https://space.bilibili.com/' + __INITIAL_STATE__.upData.mid; // 作者主页
  
          // 创建一个对象，包含所有视频信息
          videoInfo = {
              bvid,
              videourl,
              videotitle,
              videopic,
              videoduration,
              upname,
              uphomepage
          };
  
          // 输出视频信息到控制台
          console.log(videoInfo);
          return videoInfo;

  })();
    `, true).then((videoInfod) => {
      // 假设 executeJavaScript 成功执行并返回了 videoInfo 对象
      resolve(videoInfod);
      // return videoInfo;
      biliWindow2.close();
    }).catch((error) => {
      // 如果有错误，将错误传递给reject函数
      reject(error);
    });
  });
}
ipcMain.handle('get-video-info', async (event, VideoBvid) => {
  // const volumed;
  const videosum = getVideoInfo(VideoBvid);
  return videosum;
});
/**
 * 获取视频时长
 *
 * @returns 返回一个Promise对象，resolve时返回视频时长，reject时返回错误信息
 */
function getVideoDuration() {
  // 返回一个Promise对象
  return new Promise((resolve, reject) => {
    // 在biliWindow的webContents中执行JavaScript代码
    biliWindow.webContents.executeJavaScript(`
      // 执行一个立即执行的函数表达式
      (() => {
        // 获取页面中第一个video元素
        const videoDom = document.getElementsByTagName('video')[0];
        // 获取video元素的持续时间
        const duration = videoDom.duration;
        // 返回持续时间
        return duration;
      })()
    `, true).then((duration) => {
      // 将持续时间传递给resolve函数

      return duration;
    }).catch((error) => {
      // 如果有错误，将错误传递给reject函数
      reject(error);
    });
  });
}
function InsertVideoinfo(videoInfo) {
  console.log(videoInfo);
  let sql1 = `INSERT OR IGNORE INTO video (
    video_bvid, 
    video_title, 
    video_img_url, 
    video_startTime, 
    video_endtime, 
    video_duration, 
    video_url, 
    up_name, 
    up_home
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  let sql2 = `INSERT OR IGNORE INTO videolist_videos 
  (
   videolist_id,
   video_bvid
  ) VALUES (?, ?)`;

  // 准备参数数组
  let params1 = [
    videoInfo.bvid,
    videoInfo.videotitle,
    videoInfo.videopic,
    videoInfo.videostart,
    videoInfo.videoend,
    videoInfo.videoduration,
    videoInfo.videourl,
    videoInfo.upname,
    videoInfo.uphomepage
  ];
  let params2 = [
    videoInfo.videolist_id,
    videoInfo.bvid,
  ]

  // 调用insert方法执行插入操作
  return dbOperations.insert(sql1, params1) // 先插入到videolist_videos表
    .then((res1) => {
      console.log('Video info inserted into videolist_videos successfully.');
      return dbOperations.insert(sql2, params2); // 再插入到video表
    })
    .then((res2) => {
      console.log('Video info inserted into video successfully.');
      return true; // 插入成功返回true
    })
    .catch((error) => {
      console.error("Error inserting video info:", error);
      return false; // 插入失败返回false
    });
}


ipcMain.handle('insert-video-info', async (event, videoInfo) => {
  // 获取视频信息
  // const videoInfo = await getVideoInfo(videoInfo);
  // 将视频信息插入数据库
  // console.log(videoInfo);
  InsertVideoinfo(videoInfo);
  // return videoInfso;

})

ipcMain.handle('get-video-lists-id', async (event, listsid) => {
  // 如果 listsid 没有被传入或者传入的值是 undefined，则设置默认值
  listsid = listsid || 1; // 如果 listsid 是 falsy 值（如 undefined, null, 0, "" 等），则使用默认值 1

  // 接下来的代码可以使用 listsid，它要么是传入的值，要么是默认值
  let sql = `SELECT 
  video.video_bvid,
  video.video_img_url,
  video.video_title,
  video.video_startTime,
  video.video_duration,
  video.video_url,
  video.up_name,
  video.up_home
FROM video_lists
JOIN videolist_videos ON video_lists.videolists_id = videolist_videos.videolist_id
JOIN video ON videolist_videos.video_bvid = video.video_bvid
WHERE video_lists.videolists_id = ${listsid};`;

  try {
    let res = await dbOperations.executeQuery(sql, []);
    return res;
  } catch (error) {
    console.error("Error fetching video lists:", error);
    return null; // 或者其他默认值
  }
});

ipcMain.handle('get-video-lists', async (event, list) => {

  let sql = 'SELECT * FROM video_lists';
  try {
    let res = await dbOperations.executeQuery(sql, []);
    return res;
  } catch (error) {
    console.error("Error fetching video lists:", error);
    return null; // or some other default value
  }
});
ipcMain.handle('get-video-currentTime', async (event, time) => {
  try {
    // 获取视频当前时间
    const videoCurrentTime = await getVideoCurrentTime(time);
    // 将视频当前时间发送回渲染进程
    return videoCurrentTime; // 通过 return 语句发送回复
  } catch (error) {
    console.error('Error getting video current time:', error);
    // 在错误情况下，可以返回一个 null 或者错误对象
    return null;
  }
});

ipcMain.handle('get-video-duration', async (event) => {
  try {
    const duration = await getVideoDuration();
    // event.reply('return-result', duration);
    return duration;
  } catch (error) {
    console.error('Error getting video duration:', error);
    return null;
  }
});

ipcMain.on('set-MusicPlayBvid', (event, MusicBvid) => {
  // 关闭之前的窗口（如果存在）
  if (biliWindow) {
    biliWindow.close();
  }

  // 创建一个新的窗口，并传入MusicBvid
  biliWindow = createBiliWindow(MusicBvid);

  // 在新窗口的webContents上执行JavaScript代码
  biliWindow.webContents.executeJavaScript(`
    (() => {
      // 等待页面加载完成，然后播放视频
      const player = document.querySelector('video');
      if (player) {
        setTimeout(function() {
          player.play();
        }, 1000);
      } else {
        console.error('Video player not found!');
      }
    })()
  `);

  // 打印MusicBvid，用于调试
  console.log(MusicBvid);
});

ipcMain.on('set-MusicPlayerControl', (event, MusicPlaySet) => {
  biliWindow.webContents.executeJavaScript(`
    (() => {
      const MusicPlaySet = '${MusicPlaySet}';
      const player = document.querySelector('video');
      if (MusicPlaySet == 0) {
        player.play();
      }else{
        player.pause();
      }
    })()
  `);
});
ipcMain.on('window-min', () => {
  mainWindow.minimize()
});
ipcMain.on('window-max', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => {
  mainWindow.close();
  // biliWindow.close();
});

/**
 * 创建Bilibili窗口
 *
 * @returns 返回创建的Bilibili窗口对象
 */

app.whenReady().then(() => {
  mainWindow = createMainWindow();
  // biliWindow = createBiliWindow();
  // biliWindow.close();
  globalShortcut.register('Ctrl+Shift+B', () => {
    biliWindow.webContents.openDevTools()
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
       biliWindow = createBiliWindow();
      biliWindow2 = createBiliWindow2();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    console.log('窗口关闭');
    app.quit();
  }
});