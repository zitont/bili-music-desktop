const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    VideoPlaySet: (MusicPlaySet) => ipcRenderer.send('set-MusicPlayerControl',MusicPlaySet),
    // 控制视频播放暂停
    VideoCurrentTime: (time) => ipcRenderer.invoke('get-video-currentTime',time),
    // 获取视频当前时间或者设置视频时间
    VideoDuration: () => ipcRenderer.invoke('get-video-duration'),
    // 获取视频总时间
    VideoListSelect:() => ipcRenderer.invoke('selectsql'),
    // 获取视频列表
    VideoSetBvid: (bvid) => ipcRenderer.send('set-MusicPlayBvid', bvid),
    // 设置视频bvid
    VideoGetLists: () => ipcRenderer.invoke('get-video-lists'),
    // 获取收藏列表
    VideoGetListsID: (listsid) => ipcRenderer.invoke('get-video-lists-id', listsid),
    // 获取视频列表
    VideoSetVolume: (volume) => ipcRenderer.invoke('set-MusicPlayerVolume', volume),
    // 设置视频音量
    VideoGetinfo: (bvid) => ipcRenderer.invoke('get-video-info', bvid),
    // 获取视频信息
    InsertVideoinfo: (videoinfo) => ipcRenderer.invoke('insert-video-info', videoinfo),
})
contextBridge.exposeInMainWorld('windowsApi', {
    WindowMin: () => ipcRenderer.send('window-min'),
    // 窗口最小化
    WindowMax: () => ipcRenderer.send('window-max'),
    // 窗口最大化
    WindowClose: () => ipcRenderer.send('window-close'),
    // 窗口关闭
});