<template>
    <div class="common-layout">
        <el-container class="playsd">
            <el-header>
                <div class="progress-bar">
                    <div class="progress-bar-head"><el-slider :max="durations" v-model="currentTime" class="playbox"
                            :show-tooltip="false" @input="dletime" @change="dletime" />
                    </div>
                    <div class="progress-bar-foort"></div>
                </div>
            </el-header>
            <el-main class="playback">
                <el-row>
                    <el-col :span="6">
                        <el-row>
                            <el-col :span="10">
                                <el-image :src="videoimg_url" class="playbox" fit="fill"
                                    style="width: 90px; height: 50px;display:block;"></el-image>
                            </el-col>
                            <el-col :span="14">
                                <el-text class="w-150px mb-2" truncated>
                                    {{ videotitle }}
                                </el-text>
                            </el-col>
                        </el-row>
                    </el-col>
                    <el-col :span="7">
                        <el-button-group>
                            <el-button text><svg-icon iconName="icon-bofangqixiashou1"
                                    color="#ffffff"></svg-icon></el-button>
                            <el-button @click="VideoPlaySet" text><svg-icon
                                    :iconName="isPlaying ? 'icon-zanting1' : 'icon-bofang1'"></svg-icon></el-button>
                            <el-button text><svg-icon iconName="icon-bofangqixiashou"
                                    color="#ffffff"></svg-icon></el-button>
                        </el-button-group>
                        <el-button text>{{ formatTime(currentTime) + '/' + timeduration }}</el-button>
                    </el-col>
                    <el-col :span="3">
                        <el-tooltip :content="modetxt" placement="bottom" effect="light">
                            <el-button text @click="platbackmode">
                                <svg-icon iconName="icon-liebiaoxunhuan" color="#fffff"></svg-icon>
                            </el-button>
                        </el-tooltip>
                    </el-col>
                    <el-col :span="7">
                        <el-row>
                            <el-col :span="3">
                                <el-button text>
                                    <svg-icon iconName="icon-shengyin-kai" color="#fffff"></svg-icon>
                                </el-button>
                            </el-col>
                            <el-col :span="11" class="yin">
                                <div class="progress-bar">
                                    <div class="progress-bar-head">
                                        <el-slider :max="100" v-model="volumes" class="volume-bar" @input="volumeChange"
                                            @change="volumeChange" :show-tooltip="false" />
                                    </div>
                                    <div class="progress-bar-foort"></div>
                                </div>
                            </el-col>
                        </el-row>
                    </el-col>
                </el-row>
            </el-main>
        </el-container>
    </div>
</template>
<script setup>
import { ref, watch, onMounted } from 'vue'
import { useMenusStore, usePlayStore, usePlaybackMode, usePlayList } from "../../stroe/counter";
import { storeToRefs } from 'pinia';
import { formatTime } from '../../utils/functions.js';
const store = useMenusStore();
const play = usePlayStore();
const playbackmode = usePlaybackMode();
const playlist = usePlayList();
const { lists, listnobor } = storeToRefs(playlist);
const { mode } = storeToRefs(playbackmode);
const { menus } = storeToRefs(store);
const { duration, playback_status, video_bvid, volume, videoimg_url, videotitle } = storeToRefs(play);
const timeduration = ref(duration.value);
const currentTime = ref(0);
const bvid = ref('');
const volumes = ref(volume.value);
const durations = ref(100);
const isPlaying = ref(playback_status.value);
const modetxt = ref('列表循环');

function platbackmode() {
    playbackmode.increment();
    modetxt.value = mode.value == 0 ? '列表循环' : mode.value == 2 ? '随机循环' : '单曲循环';
    console.log(mode.value)
}
watch(
    () => duration.value,
    (newMenus, oldMenus) => {
        isPlaying.value = playback_status.value;
        console.log(playback_status.value)
        durations.value = duration.value;
        console.log(duration.value, durations.value)
        timeduration.value = formatTime(duration.value);
    },
    () => video_bvid.value,
    (newMenus, oldMenus) => {
        bvid.value = newMenus.value;
        window.electronAPI.VideoPlaySet(isPlaying.value ? 1 : 0);
        playback_status.value = !isPlaying.value;
        isPlaying.value = !isPlaying.value;
    },

);
// 控制视频音量
function volumeChange(value) {
    window.electronAPI.VideoSetVolume(value / 100).then((ref) => {
        volumes.value = value;
        volume.value = volumes.value;
    })
}
// 控制视频播放
function VideoPlaySet() {
    if (video_bvid.value != '') {
        durations.value = duration.value;
        window.electronAPI.VideoPlaySet(isPlaying.value ? 1 : 0);
        console.log(durations.value)
        timeduration.value = formatTime(duration.value);
        playback_status.value = !isPlaying.value;
        isPlaying.value = !isPlaying.value;
    }
}

// 格式化时间
// 控制视频播放

function VideoCurrentTime(setcurrenttime) {

    if (setcurrenttime != null) {
        window.electronAPI.VideoCurrentTime(setcurrenttime).then((ref) => {
            currentTime.value = ref;

        })
    }
    window.electronAPI.VideoCurrentTime().then((ref) => {
        currentTime.value = ref;
        if (Math.abs(currentTime.value - duration.value) <= 2) {
            console.log('播放结束');

            // 根据播放模式执行不同的操作
            if (mode.value == 0) {
                // 列表循环
                handleListLoop();
            } else if (mode.value == 1) {
                // 重置当前时间
                resetCurrentTime();
            } else if (mode.value == 2) {
                // 随机循环
                handleRandomLoop();
            }
        }
    })
}
// 列表循环逻辑封装成函数
function handleListLoop() {
    if (listnobor.value < lists.value.length - 1) {
        listnobor.value++;
    } else {
        listnobor.value = 0;
    }
    console.log(lists.value);
    currentTime.value = 0;
    videoimg_url.value = lists.value[listnobor.value].video_img_url;
    videotitle.value = lists.value[listnobor.value].video_title;
    video_bvid.value = lists.value[listnobor.value].video_bvid;
    const currentList = lists.value[listnobor.value];
    window.electronAPI.VideoSetBvid(currentList.video_bvid);
    duration.value = currentList.video_duration - 1; // 如果需要准确的持续时间，这行代码可能需要调整
}

// 重置当前时间逻辑封装成函数
function resetCurrentTime() {
    window.electronAPI.VideoCurrentTime(0);
}

// 随机循环逻辑封装成函数
function handleRandomLoop() {
    console.log('随机循环');
    const randomNumber = Math.floor(Math.random() * lists.value.length);
    listnobor.value = randomNumber;
    const currentList = lists.value[listnobor.value];
    currentTime.value = 0;
    duration.value = currentList.video_duration;
    window.electronAPI.VideoSetBvid(currentList.video_bvid);
    console.log(randomNumber);
}
const timer = ref(null);
// 创建定时器
function starTimer() {
    timeduration.value = formatTime(duration.value);
    if (timer.value) {
        clearInterval(timer.value);
    }

    timer.value = setInterval(() => {
        if (video_bvid.value != '') {
            VideoCurrentTime();
        }
    }, 1000)
}
// 创建定时器
function stopTimer() {
    if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
    }
}
// 销毁定时器
function dletime(value) {
    stopTimer()
    VideoCurrentTime(value)
    setTimeout(() => {
        starTimer()
    }, 1000);
}
onMounted(() => {
    starTimer();
})
</script>
<style>
.playback.el-main {
    /* padding-top: 0px; */
    padding-top: 0px;
    margin-bottom: 1px;
    ;
}

.yin {
    padding-top: 0px;
    padding-left: 0px;
}

.playbox .el-slider__button,
.volume-bar .el-slider__button {
    height: 10px;
    width: 10px;
    background-color: var(--el-color-primary);
}

.playbox .el-slider__button-wrapper,
.volume-bar .el-slider__button-wrapper {
    width: 8px;
    height: 8px;
    top: -11px
}

.playbox .el-slider__runway,
.volume-bar .el-slider__runway {
    height: 10px;
    background-color: rgba(0, 0, 0, 0);
}

.volume-bar .el-slider {
    padding-left: 10px;
}

.playbox .el-slider__bar,
.volume-bar .el-slider__bar {
    height: 2px;
}

.progress-bar {
    position: relative;
}

.el-slider {
    height: 10px;
}

.progress-bar-head {
    position: absolute;
    padding-top: 11px;
    width: 100%;
    top: 0;
    left: 0;
    z-index: 2;
}

.progress-bar-foort {
    top: 11px;
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: rgba(152, 158, 158, 0.795);
    z-index: 1;
}
</style>
