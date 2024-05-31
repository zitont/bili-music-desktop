const { BrowserWindow} = require('electron');
// 创建Bilibili窗口
function createBiliWindow(bvid) {
  if (!bvid) {
    console.log('bvid is empty, not creating window.');
    return;
  }
  const biliWindow = new BrowserWindow({
    width: 1100,
    height: 600,
      // frame: false,
      show: false,
  });

  biliWindow.loadURL('https://www.bilibili.com/video/'+bvid);

  // 处理窗口关闭事件

    // biliWindow.webContents.openDevTools()
 
  biliWindow.webContents.executeJavaScript(`
  __INITIAL_STATE__.continuousPlay = false;
  const player = document.querySelector('video');
  setTimeout(function() {
   player.play();
}, 1000);
  (async function() {
    'use strict';
  
    // no need to continue this script if user already logged in
    if (document.cookie.includes('DedeUserID')) return;
  
    // in user space
    if (window.location.hostname === 'space.bilibili.com') {
      // add CSS to hide the login modal
      const styleElement = document.createElement('style');
      styleElement.innerHTML = ".bili-mini-mask, .login-panel-popover, .login-tip { display: none !important; }";
      document.head.appendChild(styleElement);
  
      // reload page if login modal appears
      setInterval(() => {
        const maskElement = document.querySelector('.bili-mini-mask');
        if (maskElement) window.location.reload();
      }, 1000);
  
      // deal with repeated request with wrong page number
      let lastRequestTimestamp = 0;
      const originFetch = window.fetch;
      window.fetch = function() {
        if (!arguments[0].includes('space/wbi/arc/search')) return originFetch.apply(this, arguments);
        if (Date.now() - lastRequestTimestamp < 200) return Promise.reject(new Error('repeated request with wrong page number'));
        lastRequestTimestamp = Date.now();
        return originFetch.apply(this, arguments);
      }
    }
  
    //  in home page or video page
    if (window.location.hostname === 'www.bilibili.com') {
      // prevent miniLogin.js from appending to document
      const originAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function (childElement) {
        return childElement.tagName === 'SCRIPT' && childElement.src.includes('miniLogin')
          ? null
          : originAppendChild.call(this, childElement);
      }
  
      // wait until the 'getMediaInfo' method appears
      await new Promise(resolve => {
        const timer = setInterval(() => {
          if (window.player && window.player.getMediaInfo) {
            clearInterval(timer);
            resolve();
          }
        }, 1000);
      });
    
      // modify the 'getMediaInfo' method
      const originGetMediaInfo = window.player.getMediaInfo;
      window.player.getMediaInfo = function () {
        const { absolutePlayTime, relativePlayTime, playUrl } = originGetMediaInfo();
        return { absolutePlayTime: 0, relativePlayTime, playUrl };
      }
    
      // 'isClickedRecently' will be 'true' shortly if user clicked somewhere on the page
      let isClickedRecently = false;
      document.body.addEventListener('click', () => {
        isClickedRecently = true;
        setTimeout(() => isClickedRecently = false, 500);
      });
    
      // prevent pausing video by scripts
      const originPause = window.player.pause;
      window.player.pause = function () {
        if (!isClickedRecently) return;
        return originPause.apply(this, arguments);
      }
    }
  
  })();
`);
  return biliWindow;
}
// 创建Bilibili窗口
function createBiliWindow2(bvid) {
  const biliWindow2 = new BrowserWindow({
    width: 1000,
    height: 600,
      // frame: false,
      show: false,
  });
  biliWindow2.loadURL('https://www.bilibili.com/video/'+bvid);
  // biliWindow2.webContents.openDevTools()
  // 处理窗口关闭事件
  // biliWindow2.on('closed', () => {
  //   biliWindow2 = null;
  // });
//   biliWindow2.webContents.executeJavaScript(`
//   __INITIAL_STATE__.continuousPlay = false;
//   const player = document.querySelector('video');
//   player.pause();
// `);
biliWindow2.webContents.executeJavaScript(`
__INITIAL_STATE__.continuousPlay = false;
`);
  return biliWindow2;
}


// 处理窗口焦点事件
function handleWindowFocus(window) {
  window.on('focus', () => {
    // 这里可以添加处理窗口获得焦点时的逻辑
  });
}
// function initialized() {
 
// }
// 注册全局快捷键
function registerGlobalShortcuts() {
  const openDevToolsKey = 'ctrl+shift+D';
  globalShortcut.register(openDevToolsKey, () => {
    // 获取当前聚焦的窗口
    let currentFocusedWindow = BrowserWindow.getFocusedWindow();
    if (currentFocusedWindow) {
      currentFocusedWindow.webContents.openDevTools();
    }
  });
}

module.exports = {
  createBiliWindow,
  createBiliWindow2,
  handleWindowFocus,
  registerGlobalShortcuts,
};
