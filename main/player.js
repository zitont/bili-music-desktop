import { safeExecuteJavaScript, WINDOW_LOAD_TIMEOUT } from './utils';

/**
 * 获取视频当前播放时间
 * @param {BrowserWindow} biliWindow - B站窗口实例
 * @param {number} time - 视频播放时间，单位为秒
 * @returns {Promise<number>}
 */
async function getVideoCurrentTime(biliWindow, time) {
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
 * @param {BrowserWindow} biliWindow - B站窗口实例
 * @param {number} volume - 音量值（0-1）
 * @returns {Promise<number>}
 */
async function setPlayerVolume(biliWindow, volume) {
  if (!biliWindow || biliWindow.isDestroyed()) {
    return null;
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
 * 获取视频时长
 * @param {BrowserWindow} biliWindow - B站窗口实例
 * @returns {Promise<number>}
 */
async function getVideoDuration(biliWindow) {
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
 * 控制播放/暂停
 * @param {BrowserWindow} biliWindow - B站窗口实例
 * @param {string} action - 动作：'play' 或 'pause'
 * @returns {Promise<boolean>}
 */
async function controlPlayback(biliWindow, action) {
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
}

/**
 * 获取视频信息
 * @param {Function} createBiliWindow2 - 创建 B站窗口的函数
 * @param {string} VideoBvid - 视频 BV 号
 * @returns {Promise<Object>}
 */
function getVideoInfo(createBiliWindow2, VideoBvid) {
  const biliWindow2 = createBiliWindow2(VideoBvid);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (biliWindow2 && !biliWindow2.isDestroyed()) {
        biliWindow2.destroy();
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
            }
            resolve(videoInfo);
          })
          .catch((error) => {
            clearTimeout(timeout);
            if (biliWindow2 && !biliWindow2.isDestroyed()) {
              biliWindow2.destroy();
            }
            reject(error);
          });
      }, 1500);
    };

    const onFail = (_, errorCode, errorDescription) => {
      clearTimeout(timeout);
      if (biliWindow2 && !biliWindow2.isDestroyed()) {
        biliWindow2.destroy();
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

export {
  getVideoCurrentTime,
  setPlayerVolume,
  getVideoDuration,
  controlPlayback,
  getVideoInfo,
};
