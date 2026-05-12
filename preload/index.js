const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  WindowMin: () => ipcRenderer.invoke('window:minimize'),
  WindowMax: () => ipcRenderer.invoke('window:maximize'),
  WindowClose: () => ipcRenderer.invoke('window:close'),

  // 视频播放控制
  VideoPlaySet: (action) => ipcRenderer.invoke('player:control', action === 0 ? 'play' : 'pause'),
  VideoSetBvid: (bvid, startTime, volume) => ipcRenderer.invoke('player:play', { bvid, startTime, volume }),
  VideoCurrentTime: (time) => ipcRenderer.invoke('player:getCurrentTime', time),
  VideoDuration: () => ipcRenderer.invoke('player:getDuration'),
  VideoSetVolume: (volume) => ipcRenderer.invoke('player:setVolume', volume),
  VideoGetinfo: (bvid) => ipcRenderer.invoke('player:getVideoInfo', bvid),

  // 数据库操作
  VideoGetLists: () => ipcRenderer.invoke('db:getPlaylists'),
  VideoGetListsID: (listsid) => ipcRenderer.invoke('db:getPlaylistVideos', listsid),
  InsertVideoinfo: (videoinfo) => ipcRenderer.invoke('db:addVideo', videoinfo),

  // 歌单操作
  createPlaylist: (name, description = '') => ipcRenderer.invoke('db:createPlaylist', { name, description }),
  updatePlaylist: (id, name, description = '') => ipcRenderer.invoke('db:updatePlaylist', { id, name, description }),
  deletePlaylist: (id) => ipcRenderer.invoke('db:deletePlaylist', id),

  // 视频操作
  updateVideo: (bvid, title, startTime, endTime) => ipcRenderer.invoke('db:updateVideo', { bvid, title, startTime, endTime }),
  deleteVideo: (bvid) => ipcRenderer.invoke('db:deleteVideo', bvid),
  moveVideo: (bvid, fromPlaylistId, toPlaylistId) => ipcRenderer.invoke('db:moveVideo', { bvid, fromPlaylistId, toPlaylistId }),

  // 系统信息
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),

  // 外部链接
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // 数据目录
  selectDataDirectory: () => ipcRenderer.invoke('select-data-directory'),
  getDataDirectory: () => ipcRenderer.invoke('get-data-directory'),

  // 主进程事件监听（托盘/媒体键）
  onTogglePlay: (callback) => ipcRenderer.on('player:toggle', callback),
  onPlayPrevious: (callback) => ipcRenderer.on('player:previous', callback),
  onPlayNext: (callback) => ipcRenderer.on('player:next', callback),

  // 音频分析数据（用于背景波澜动画）
  onAudioData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('audio:data', handler);
    return () => ipcRenderer.removeListener('audio:data', handler);
  },
});
