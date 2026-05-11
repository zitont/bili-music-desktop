<template>
  <div class="playback">
    <!-- 进度条 -->
    <div class="progress-bar" :class="{ hovering: isProgressHover }" @mouseenter="isProgressHover = true" @mouseleave="isProgressHover = false">
      <n-slider
        v-model:value="currentTime"
        :max="durations"
        :tooltip="false"
        :format-tooltip="() => ''"
        @update:value="dletime"
      />
    </div>

    <!-- 控制栏 -->
    <div class="controls">
      <!-- 左侧：封面和标题 -->
      <div class="left-section">
        <div class="cover-wrapper" :class="{ playing: isPlaying }">
          <n-image
            v-if="videoimg_url"
            :src="videoimg_url"
            width="52"
            height="52"
            object-fit="cover"
            preview-disabled
            class="cover-img"
          />
          <div v-else class="cover-placeholder">
            <svg-icon iconName="icon-shoucangjia" color="#4a4854"></svg-icon>
          </div>
        </div>
        <div class="track-info">
          <span class="track-title">{{ videotitle || '未播放' }}</span>
        </div>
      </div>

      <!-- 中间：播放控制 -->
      <div class="center-section">
        <div class="playback-controls">
          <button class="ctrl-btn" @click="playPrevious">
            <svg-icon iconName="icon-bofangqixiashou1" color="#8a8890"></svg-icon>
          </button>
          <button class="ctrl-btn ctrl-btn-main" @click="VideoPlaySet">
            <svg-icon :iconName="isPlaying ? 'icon-zanting1' : 'icon-bofang1'" color="#08080a"></svg-icon>
          </button>
          <button class="ctrl-btn" @click="playNext">
            <svg-icon iconName="icon-bofangqixiashou" color="#8a8890"></svg-icon>
          </button>
        </div>
        <span class="time-display">
          {{ formatTime(currentTime) }} / {{ timeduration }}
        </span>
      </div>

      <!-- 右侧：播放模式和音量 -->
      <div class="right-section">
        <n-tooltip trigger="hover" :show-arrow="false">
          <template #trigger>
            <button class="ctrl-btn" @click="platbackmode">
              <svg-icon :iconName="playModeIcon" color="#8a8890"></svg-icon>
            </button>
          </template>
          <span class="tooltip-text">{{ modetxt }}</span>
        </n-tooltip>

        <div class="volume-control">
          <button class="ctrl-btn">
            <svg-icon iconName="icon-shengyin-kai" color="#8a8890"></svg-icon>
          </button>
          <n-slider
            v-model:value="volumes"
            :max="100"
            :tooltip="false"
            :format-tooltip="() => ''"
            class="volume-slider"
            @update:value="volumeChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { useMenusStore, usePlayStore, usePlaybackMode, usePlayList } from '../../store';
import { storeToRefs } from 'pinia';
import { formatTime } from '../../utils/functions.js';

const store = useMenusStore();
const play = usePlayStore();
const playbackmode = usePlaybackMode();
const playlist = usePlayList();

const { lists, listnobor } = storeToRefs(playlist);
const { mode } = storeToRefs(playbackmode);
const { duration, playback_status, video_bvid, volume, videoimg_url, videotitle } = storeToRefs(play);

const timeduration = ref(formatTime(duration.value));
const currentTime = ref(0);
const volumes = ref(volume.value);
const durations = ref(100);
const isPlaying = ref(playback_status.value);
const modetxt = ref('列表循环');
const isProgressHover = ref(false);

const playModeIcon = computed(() => {
  switch (mode.value) {
    case 0: return 'icon-liebiaoxunhuan';
    case 1: return 'icon-danquxunhuan';
    case 2: return 'icon-suijibofang';
    default: return 'icon-liebiaoxunhuan';
  }
});

function platbackmode() {
  playbackmode.nextMode();
  modetxt.value = mode.value === 0 ? '列表循环' : mode.value === 2 ? '随机循环' : '单曲循环';
}

function playPrevious() {
  if (lists.value.length === 0) return;
  listnobor.value = listnobor.value > 0 ? listnobor.value - 1 : lists.value.length - 1;
  applyTrack(lists.value[listnobor.value]);
  currentTime.value = 0;
}

function playNext() {
  if (lists.value.length === 0) return;
  listnobor.value = listnobor.value < lists.value.length - 1 ? listnobor.value + 1 : 0;
  applyTrack(lists.value[listnobor.value]);
  currentTime.value = 0;
}

function applyTrack(track: any) {
  videoimg_url.value = track.video_img_url;
  videotitle.value = track.video_title;
  video_bvid.value = track.video_bvid;
  window.electronAPI.VideoSetBvid(track.video_bvid);
  duration.value = track.video_duration;
}

function volumeChange(value: number) {
  window.electronAPI.VideoSetVolume(value / 100).then(() => {
    volumes.value = value;
    volume.value = value;
  });
}

function VideoPlaySet() {
  if (video_bvid.value !== '') {
    durations.value = duration.value;
    window.electronAPI.VideoPlaySet(isPlaying.value ? 1 : 0);
    timeduration.value = formatTime(duration.value);
    playback_status.value = !isPlaying.value;
    isPlaying.value = !isPlaying.value;
  }
}

function VideoCurrentTime(setcurrenttime?: number) {
  if (setcurrenttime != null) {
    window.electronAPI.VideoCurrentTime(setcurrenttime).then((ref: number) => {
      currentTime.value = ref;
    });
  }

  window.electronAPI.VideoCurrentTime().then((ref: number) => {
    currentTime.value = ref;
    if (Math.abs(currentTime.value - duration.value) <= 2) {
      if (mode.value === 0) handleListLoop();
      else if (mode.value === 1) resetCurrentTime();
      else if (mode.value === 2) handleRandomLoop();
    }
  });
}

function handleListLoop() {
  listnobor.value = listnobor.value < lists.value.length - 1 ? listnobor.value + 1 : 0;
  currentTime.value = 0;
  applyTrack(lists.value[listnobor.value]);
  duration.value = lists.value[listnobor.value].video_duration - 1;
}

function resetCurrentTime() {
  window.electronAPI.VideoCurrentTime(0);
}

function handleRandomLoop() {
  listnobor.value = Math.floor(Math.random() * lists.value.length);
  currentTime.value = 0;
  applyTrack(lists.value[listnobor.value]);
}

const timer = ref<ReturnType<typeof setInterval> | null>(null);

function starTimer() {
  timeduration.value = formatTime(duration.value);
  if (timer.value) clearInterval(timer.value);
  timer.value = setInterval(() => {
    if (video_bvid.value !== '') VideoCurrentTime();
  }, 1000);
}

function stopTimer() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

function dletime(value: number) {
  stopTimer();
  VideoCurrentTime(value);
  setTimeout(() => starTimer(), 1000);
}

watch(
  () => duration.value,
  () => {
    isPlaying.value = playback_status.value;
    durations.value = duration.value;
    timeduration.value = formatTime(duration.value);
  }
);

onMounted(() => {
  starTimer();
  window.electronAPI.onTogglePlay(() => VideoPlaySet());
  window.electronAPI.onPlayPrevious(() => playPrevious());
  window.electronAPI.onPlayNext(() => playNext());
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.playback {
  height: 80px;
  display: flex;
  flex-direction: column;
  background: #0c0c10;
}

.progress-bar {
  height: 4px;
  padding: 0;
  transition: height var(--duration-normal) var(--ease-out);
}

.progress-bar.hovering {
  height: 6px;
}

.progress-bar :deep(.n-slider) {
  --n-rail-height: 4px !important;
  --n-handle-size: 12px;
  --n-fill-color: #c9a55c;
  --n-fill-color-hover: #dbb978;
  --n-handle-color: #fff;
}

.progress-bar.hovering :deep(.n-slider) {
  --n-rail-height: 6px !important;
}

.controls {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 16px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 280px;
  flex-shrink: 0;
}

.cover-wrapper {
  position: relative;
  flex-shrink: 0;
}

.cover-wrapper.playing .cover-img {
  box-shadow: 0 0 12px rgba(201, 165, 92, 0.2);
  animation: coverGlow 2.5s ease-in-out infinite;
}

@keyframes coverGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(201, 165, 92, 0.15); }
  50% { box-shadow: 0 0 20px rgba(201, 165, 92, 0.3); }
}

.cover-img {
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  transition: box-shadow var(--duration-normal) var(--ease-in-out), transform var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.cover-img:hover {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
}

.track-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.track-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8e6e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.center-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.ctrl-btn:hover :deep(.svg-icon) {
  color: #e8e6e0;
}

.ctrl-btn-main {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #c9a55c, #a8873e);
  font-size: 18px;
}

.ctrl-btn-main:hover {
  background: linear-gradient(135deg, #dbb978, #c9a55c);
  box-shadow: 0 0 16px rgba(201, 165, 92, 0.3);
}

.ctrl-btn-main:active {
  background: linear-gradient(135deg, #a8873e, #8b6d2f);
  transform: scale(0.93);
}

.ctrl-btn-main :deep(.svg-icon) {
  transition: transform var(--duration-fast) var(--ease-out);
}

.ctrl-btn-main:active :deep(.svg-icon) {
  transform: scale(0.9);
}

.time-display {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 240px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.volume-slider {
  width: 100px;
}

.tooltip-text {
  font-size: 12px;
}
</style>
