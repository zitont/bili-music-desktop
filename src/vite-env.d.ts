/// <reference types="vite/client" />

interface SystemInfo {
  electronVersion: string;
  os: string;
  arch: string;
  memory: string;
  platform: string;
  nodeVersion: string;
  chromeVersion: string;
}

interface ElectronAPI {
  // 窗口控制
  WindowMin: () => Promise<void>;
  WindowMax: () => Promise<void>;
  WindowClose: () => Promise<void>;

  // 视频播放控制
  VideoPlaySet: (action: number) => Promise<boolean>;
  VideoSetBvid: (bvid: string) => Promise<boolean>;
  VideoCurrentTime: (time?: number) => Promise<number | null>;
  VideoDuration: () => Promise<number | null>;
  VideoSetVolume: (volume: number) => Promise<number | null>;
  VideoGetinfo: (bvid: string) => Promise<any>;

  // 数据库操作
  VideoGetLists: () => Promise<any[]>;
  VideoGetListsID: (listsid: number) => Promise<any[]>;
  InsertVideoinfo: (videoinfo: any) => Promise<boolean>;

  // 歌单操作
  createPlaylist: (name: string) => Promise<boolean>;
  updatePlaylist: (id: number, name: string) => Promise<boolean>;
  deletePlaylist: (id: number) => Promise<boolean>;

  // 视频操作
  updateVideo: (bvid: string, title: string, startTime: number, endTime: number) => Promise<boolean>;
  deleteVideo: (bvid: string) => Promise<boolean>;

  // 系统信息
  getSystemInfo: () => Promise<SystemInfo | null>;

  // 主进程事件监听
  onTogglePlay: (callback: () => void) => void;
  onPlayPrevious: (callback: () => void) => void;
  onPlayNext: (callback: () => void) => void;
}

interface WindowsApi {
  WindowMin: () => void;
  WindowMax: () => void;
  WindowClose: () => void;
}

declare interface Window {
  electronAPI: ElectronAPI;
  windowsApi: WindowsApi;
}
