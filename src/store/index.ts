import { defineStore } from 'pinia';

// 当前播放列表 ID
export const useMenusStore = defineStore('menus', {
  state: () => ({
    menus: 1 as number,
  }),
  actions: {
    setMenu(id: number) {
      this.menus = id;
    },
  },
});

// 播放状态
export const usePlayStore = defineStore('play', {
  state: () => ({
    playback_status: false,
    volume: 60,
    duration: 0,
    videotitle: '',
    videoimg_url: '',
    video_bvid: '',
  }),
});

// 播放模式：0=列表循环, 1=单曲循环, 2=随机播放
export const usePlaybackMode = defineStore('playbackMode', {
  state: () => ({
    mode: 0 as number,
  }),
  actions: {
    nextMode() {
      this.mode = (this.mode + 1) % 3;
    },
  },
});

// 播放列表数据
export const usePlayList = defineStore('playlist', {
  state: () => ({
    listser: false,
    lists: [] as any[],
    listnobor: 0,
  }),
});
