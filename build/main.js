"use strict";
const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
require("electron-updater");
const path = require("path");
require("sqlite3").verbose();
const createBiliWindow = require("./windows").createBiliWindow;
const createBiliWindow2 = require("./windows").createBiliWindow2;
const dbOperations = require("./db");
let mainWindow;
let biliWindow;
let biliWindow2;
function seversql() {
  dbOperations.initDatabase();
}
function createMainWindow() {
  const win = new BrowserWindow({
    // 设置窗口宽度为800像素
    width: 1100,
    maxWidth: 1100,
    // 设置窗口高度为600像素
    height: 730,
    maxHeight: 730,
    minHeight: 730,
    minWidth: 1100,
    icon: path.join(__dirname, "assets/BIliBili2.png"),
    frame: false,
    // 设置webPreferences属性
    webPreferences: {
      // 允许在渲染进程中使用Node.js特性
      nodeIntegration: true,
      // 设置预加载脚本的路径
      preload: path.join(__dirname, "preload/index.js")
    }
  });
  if (app.isPackaged) {
    win.loadFile("dist/index.html");
  } else {
    win.loadURL("http://localhost:3001");
  }
  globalShortcut.register("Ctrl+Shift+D", () => {
    win.webContents.openDevTools();
  });
  seversql();
  return win;
}
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
      resolve(volumeds);
    }).catch((error) => {
      reject(error);
    });
  });
}
ipcMain.handle("set-MusicPlayerVolume", async (event, volume) => {
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
      resolve(videoInfod);
      biliWindow2.close();
    }).catch((error) => {
      reject(error);
    });
  });
}
ipcMain.handle("get-video-info", async (event, VideoBvid) => {
  const videosum = getVideoInfo(VideoBvid);
  return videosum;
});
function getVideoDuration() {
  return new Promise((resolve, reject) => {
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
      return duration;
    }).catch((error) => {
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
    videoInfo.bvid
  ];
  return dbOperations.insert(sql1, params1).then((res1) => {
    console.log("Video info inserted into videolist_videos successfully.");
    return dbOperations.insert(sql2, params2);
  }).then((res2) => {
    console.log("Video info inserted into video successfully.");
    return true;
  }).catch((error) => {
    console.error("Error inserting video info:", error);
    return false;
  });
}
ipcMain.handle("insert-video-info", async (event, videoInfo) => {
  InsertVideoinfo(videoInfo);
});
ipcMain.handle("get-video-lists-id", async (event, listsid) => {
  listsid = listsid || 1;
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
    return null;
  }
});
ipcMain.handle("get-video-lists", async (event, list) => {
  let sql = "SELECT * FROM video_lists";
  try {
    let res = await dbOperations.executeQuery(sql, []);
    return res;
  } catch (error) {
    console.error("Error fetching video lists:", error);
    return null;
  }
});
ipcMain.handle("get-video-currentTime", async (event, time) => {
  try {
    const videoCurrentTime = await getVideoCurrentTime(time);
    return videoCurrentTime;
  } catch (error) {
    console.error("Error getting video current time:", error);
    return null;
  }
});
ipcMain.handle("get-video-duration", async (event) => {
  try {
    const duration = await getVideoDuration();
    return duration;
  } catch (error) {
    console.error("Error getting video duration:", error);
    return null;
  }
});
ipcMain.on("set-MusicPlayBvid", (event, MusicBvid) => {
  if (biliWindow) {
    biliWindow.close();
  }
  biliWindow = createBiliWindow(MusicBvid);
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
  console.log(MusicBvid);
});
ipcMain.on("set-MusicPlayerControl", (event, MusicPlaySet) => {
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
ipcMain.on("window-min", () => {
  mainWindow.minimize();
});
ipcMain.on("window-max", () => {
  if (mainWindow.isMaximized()) {
    mainWindow.restore();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on("window-close", () => {
  mainWindow.close();
});
app.whenReady().then(() => {
  mainWindow = createMainWindow();
  globalShortcut.register("Ctrl+Shift+B", () => {
    biliWindow.webContents.openDevTools();
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      biliWindow = createBiliWindow();
      biliWindow2 = createBiliWindow2();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    console.log("窗口关闭");
    app.quit();
  }
});
