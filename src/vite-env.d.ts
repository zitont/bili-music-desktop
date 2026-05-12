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
  VideoGetinfo: (bvid: string) => Promise<unknown>;

  // 数据库操作
  VideoGetLists: () => Promise<unknown[]>;
  VideoGetListsID: (listsid: number) => Promise<unknown[]>;
  InsertVideoinfo: (videoinfo: unknown) => Promise<{ success: boolean; error?: string }>;

  // 歌单操作
  createPlaylist: (name: string, description?: string) => Promise<boolean>;
  updatePlaylist: (id: number, name: string, description?: string) => Promise<boolean>;
  deletePlaylist: (id: number) => Promise<{ success: boolean; error?: string }>;

  // 视频操作
  updateVideo: (
    bvid: string,
    title: string,
    startTime: number,
    endTime: number
  ) => Promise<boolean>;
  deleteVideo: (bvid: string) => Promise<boolean>;
  moveVideo: (bvid: string, fromPlaylistId: number, toPlaylistId: number) => Promise<boolean>;

  // 系统信息
  getSystemInfo: () => Promise<SystemInfo | null>;

  // 外部链接
  openExternal: (url: string) => Promise<void>;

  // 主题设置
  themeSet: (isDark: boolean) => Promise<void>;

  // 主进程事件监听
  onTogglePlay: (callback: () => void) => void;
  onPlayPrevious: (callback: () => void) => void;
  onPlayNext: (callback: () => void) => void;

  // 音频分析数据（用于背景波澜动画）
  onAudioData: (callback: (data: { avg: number; peak: number }) => void) => () => void;
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
