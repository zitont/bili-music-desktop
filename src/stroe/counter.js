import { defineStore } from 'pinia'
 // 播放列表
export const useMenusStore = defineStore('menus', {
    state: () => ({
        menus: 1,
    }),
    actions: {
        increment() {
            this.menus++
        },
    }

})
// 收藏状态
export const useFavorites = defineStore('Favorites', {
state: () => ({
    favorites:[]
}),
});
// 播放状态

export const usePlayStore = defineStore('Play', {
    state: () => ({
        playback_status: false,
        volume: 60,
        singleloop: false,
        duration: 0,
        videotitle: '',
        videoimg_url: '',
        video_bvid: '',
    }),
    actions: {
        increment() {
            this.menus++
        },
    }

})
// 播放模式
export const usePlaybackMode = defineStore('playbackMode', {
    state: () => ({
        mode: 0,

    }),
    actions: {
        increment() {
            if (this.mode <= 1) {
                this.mode++
            }else{
                this.mode = 0
            }
           
        },
    }
 })
 // 播放列表
export const usePlayList = defineStore('playlist', {
    state: () => ({
      listser: false,
      lists: [],
      listnobor: 0,
    }),
    actions: {
        increment() {
            this.lists.length;
        },
    }
 
})

