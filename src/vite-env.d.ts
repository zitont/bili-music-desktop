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

  // B 站 API 接口
  apiGetVideoInfo: (bvid: string) => Promise<{
    bvid: string;
    videotitle: string;
    videopic: string;
    videoduration: number;
    upname: string;
    uphomepage: string;
    cid: number;
    pages: Array<{ cid: number; page: number; part: string; duration: number }>;
  } | null>;
  apiGetAudioUrl: (bvid: string, cid: number) => Promise<{
    audioUrl: string;
    duration: number;
    codec: string;
    bandwidth: number;
  } | null>;

  // SESSDATA 管理
  authSetSessdata: (value: string) => Promise<boolean>;
  authGetSessdata: () => Promise<{ hasSessdata: boolean }>;

  // 视频播放控制（旧接口）
  VideoPlaySet: (action: number) => Promise<boolean>;
  VideoSetBvid: (bvid: string, startTime?: number, volume?: number | null) => Promise<boolean>;
  VideoCurrentTime: (time?: number) => Promise<number | null>;
  VideoDuration: () => Promise<number | null>;
  VideoSetVolume: (volume: number) => Promise<number | null>;
  VideoGetinfo: (bvid: string) => Promise<unknown>;

  // 数据库操作
  VideoGetLists: () => Promise<import('./types/video').PlaylistItem[]>;
  VideoGetListsID: (listsid: number) => Promise<import('./types/video').VideoItem[]>;
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

  // 数据目录
  selectDataDirectory: () => Promise<{ success: boolean; path?: string; error?: string }>;
  getDataDirectory: () => Promise<{ path: string | null }>;

  // 主题设置
  themeSet: (isDark: boolean) => Promise<void>;

  // 主进程事件监听（返回清理函数）
  onTogglePlay: (callback: () => void) => () => void;
  onPlayPrevious: (callback: () => void) => () => void;
  onPlayNext: (callback: () => void) => () => void;

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
