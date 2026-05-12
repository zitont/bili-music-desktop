import { defineStore } from 'pinia';
import type { VideoItem } from '../types/video';

// 当前播放列表 ID
export const useMenusStore = defineStore('menus', {
  state: () => ({
    menus: 1 as number,
    currentPlaylistName: '默认收藏夹',
  }),
  actions: {
    setMenu(id: number) {
      this.menus = id;
    },
    setPlaylistName(name: string) {
      this.currentPlaylistName = name;
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
    themeDominant: '',
    themeMuted: '',
    themeDark: '',
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
    needsRefresh: false,
    lists: [] as VideoItem[],
    currentIndex: 0,
  }),
});

// 主题模式
export const useThemeStore = defineStore('theme', {
  state: () => ({
    isDark: true as boolean,
    glassEnabled: true as boolean,
  }),
  actions: {
    toggleTheme() {
      this.isDark = !this.isDark;
      this.applyTheme();
    },
    setTheme(dark: boolean) {
      this.isDark = dark;
      this.applyTheme();
    },
    toggleGlass() {
      this.glassEnabled = !this.glassEnabled;
      this.applyTheme();
    },
    setGlass(enabled: boolean) {
      this.glassEnabled = enabled;
      this.applyTheme();
    },
    applyTheme() {
      const html = document.documentElement;
      if (this.isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      if (this.glassEnabled) {
        html.classList.add('glass');
      } else {
        html.classList.remove('glass');
      }
      if (window.electronAPI?.themeSet) {
        window.electronAPI.themeSet(this.isDark);
      }
    },
  },
});

// 动画模式：
// 0=涟漪(ripple), 1=波形(waveform), 2=粒子(particles),
// 3=频谱(spectrum), 4=放射(circular), 5=极光(aurora)
export const useAnimationStore = defineStore('animation', {
  state: () => ({
    mode: 0 as number,
    enabled: true as boolean,
  }),
  actions: {
    setMode(mode: number) {
      this.mode = mode;
    },
    toggleEnabled() {
      this.enabled = !this.enabled;
    },
  },
});
