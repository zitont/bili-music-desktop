<template>
  <div class="playback">
    <div
      class="progress-bar"
      :class="{ hovering: isProgressHover }"
      @mouseenter="isProgressHover = true"
      @mouseleave="isProgressHover = false"
    >
      <n-slider
        v-model:value="currentTime"
        :max="duration"
        :tooltip="true"
        :format-tooltip="(v: number) => formatTime(v)"
        @update:value="seekTo"
      />
    </div>

    <div class="controls">
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
            <svg-icon icon-name="icon-music"></svg-icon>
          </div>
        </div>
        <div class="track-info">
          <div ref="titleWrapRef" class="track-title-wrap">
            <span class="track-title" :class="{ active: isMarqueeActive }" :title="videotitle || '未播放'">
              <span class="track-title-text">{{ videotitle || '未播放' }}</span>
              <span v-if="isMarqueeActive" class="track-title-text">{{ videotitle }}</span>
            </span>
          </div>
        </div>
      </div>

      <div class="center-section">
        <div class="playback-controls">
          <button class="ctrl-btn" @click="playPrevious">
            <svg-icon icon-name="icon-bofangqixiashou1" class="ctrl-icon"></svg-icon>
          </button>
          <button class="ctrl-btn ctrl-btn-main" @click="VideoPlaySet">
            <svg-icon
              :icon-name="isPlaying ? 'icon-zanting1' : 'icon-bofang1'"
              class="main-icon"
            ></svg-icon>
          </button>
          <button class="ctrl-btn" @click="playNext">
            <svg-icon icon-name="icon-bofangqixiashou" class="ctrl-icon"></svg-icon>
          </button>
        </div>
        <span class="time-display"> {{ formatTime(currentTime) }} / {{ formatTime(duration) }} </span>
      </div>

      <div class="right-section">
        <n-tooltip trigger="hover" :show-arrow="false">
          <template #trigger>
            <button class="ctrl-btn" @click="platbackmode">
              <svg-icon :icon-name="playModeIcon" class="ctrl-icon"></svg-icon>
            </button>
          </template>
          <span class="tooltip-text">{{ modetxt }}</span>
        </n-tooltip>

        <div class="volume-control">
          <button class="ctrl-btn">
            <svg-icon icon-name="icon-shengyin-kai" class="ctrl-icon"></svg-icon>
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
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useMenusStore, usePlayStore, usePlaybackMode, usePlayList } from '../../store';
import { storeToRefs } from 'pinia';
import { formatTime } from '../../utils/functions.js';

useMenusStore();
const play = usePlayStore();
const playbackmode = usePlaybackMode();
const playlist = usePlayList();

const { lists, currentIndex } = storeToRefs(playlist);
const { mode } = storeToRefs(playbackmode);
const { duration, playback_status, video_bvid, volume, videoimg_url, videotitle } =
  storeToRefs(play);

const currentTime = ref(0);
const trackStartTime = ref(0);
const trackEndTime = ref(0);
const volumes = ref(volume.value);
const isPlaying = ref(playback_status.value);
const modetxt = ref('列表循环');
const isProgressHover = ref(false);
const isSeeking = ref(false);
const titleWrapRef = ref<HTMLElement | null>(null);
const isMarqueeActive = ref(false);

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
  currentIndex.value = currentIndex.value > 0 ? currentIndex.value - 1 : lists.value.length - 1;
  currentTime.value = 0;
  applyTrack(lists.value[currentIndex.value]);
}

function playNext() {
  if (lists.value.length === 0) return;
  currentIndex.value = currentIndex.value < lists.value.length - 1 ? currentIndex.value + 1 : 0;
  currentTime.value = 0;
  applyTrack(lists.value[currentIndex.value]);
}

function applyTrack(track: any) {
  videoimg_url.value = track.video_img_url;
  videotitle.value = track.video_title;
  video_bvid.value = track.video_bvid;
  const start = track.video_startTime || 0;
  const end = track.video_endtime || track.video_duration;
  trackStartTime.value = start;
  trackEndTime.value = end;
  duration.value = end - start;
  window.electronAPI.VideoSetBvid(track.video_bvid, start, volume.value / 100);
}

function volumeChange(value: number) {
  window.electronAPI.VideoSetVolume(value / 100).then(() => {
    volumes.value = value;
    volume.value = value;
  });
}

function VideoPlaySet() {
  if (video_bvid.value !== '') {
    window.electronAPI.VideoPlaySet(isPlaying.value ? 1 : 0);
    playback_status.value = !isPlaying.value;
    isPlaying.value = !isPlaying.value;
  }
}

function checkTrackEnd() {
  if (Math.abs(currentTime.value - duration.value) <= 2) {
    if (mode.value === 0) handleListLoop();
    else if (mode.value === 1) resetCurrentTime();
    else if (mode.value === 2) handleRandomLoop();
  }
}

let seekTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function pollProgress() {
  if (video_bvid.value === '' || isSeeking.value) return;
  window.electronAPI.VideoCurrentTime().then((ref: number | null) => {
    if (!isSeeking.value && ref != null) {
      currentTime.value = Math.max(0, ref - trackStartTime.value);
      checkTrackEnd();
    }
  });
}

function startPoll() {
  stopPoll();
  pollTimer = setInterval(pollProgress, 500);
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function seekTo(value: number) {
  isSeeking.value = true;
  currentTime.value = value;
  window.electronAPI.VideoCurrentTime(value + trackStartTime.value);
  if (seekTimer) clearTimeout(seekTimer);
  seekTimer = setTimeout(() => {
    isSeeking.value = false;
    pollProgress();
  }, 400);
}

function handleListLoop() {
  currentIndex.value = currentIndex.value < lists.value.length - 1 ? currentIndex.value + 1 : 0;
  currentTime.value = 0;
  applyTrack(lists.value[currentIndex.value]);
}

function resetCurrentTime() {
  window.electronAPI.VideoCurrentTime(trackStartTime.value);
  currentTime.value = 0;
}

function handleRandomLoop() {
  currentIndex.value = Math.floor(Math.random() * lists.value.length);
  currentTime.value = 0;
  applyTrack(lists.value[currentIndex.value]);
}

function checkMarqueeOverflow() {
  const wrap = titleWrapRef.value;
  if (!wrap || !videotitle.value) {
    isMarqueeActive.value = false;
    return;
  }
  const measure = document.createElement('span');
  measure.textContent = videotitle.value;
  Object.assign(measure.style, {
    position: 'fixed',
    visibility: 'hidden',
    whiteSpace: 'nowrap',
    top: '-9999px',
    pointerEvents: 'none',
    fontSize: '15px',
    fontWeight: '600',
    paddingRight: '48px',
  });
  document.body.appendChild(measure);
  isMarqueeActive.value = measure.offsetWidth > wrap.clientWidth;
  document.body.removeChild(measure);
}

const STORAGE_KEY = 'bili-music-playback';

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    video_bvid: video_bvid.value,
    videotitle: videotitle.value,
    videoimg_url: videoimg_url.value,
    duration: duration.value,
    volume: volume.value,
    playback_status: isPlaying.value,
    trackStartTime: trackStartTime.value,
    trackEndTime: trackEndTime.value,
  }));
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.video_bvid) {
      video_bvid.value = saved.video_bvid;
      videotitle.value = saved.videotitle || '';
      videoimg_url.value = saved.videoimg_url || '';
      volume.value = saved.volume ?? 60;
      volumes.value = saved.volume ?? 60;
      duration.value = saved.duration || 0;
      trackStartTime.value = saved.trackStartTime || 0;
      trackEndTime.value = saved.trackEndTime || 0;
      if (saved.playback_status) {
        isPlaying.value = true;
        playback_status.value = true;
      }
      const savedVolume = (saved.volume ?? 60) / 100;
      window.electronAPI.VideoSetBvid(saved.video_bvid, saved.trackStartTime || 0, savedVolume);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

watch([video_bvid, videotitle, videoimg_url, duration, volume], persistState, { deep: true });

watch(
  () => duration.value,
  () => {
    isPlaying.value = playback_status.value;
  }
);

watch(videotitle, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    isMarqueeActive.value = false;
    nextTick(checkMarqueeOverflow);
  }
});

watch(
  () => titleWrapRef.value?.clientWidth,
  () => {
    isMarqueeActive.value = false;
    nextTick(checkMarqueeOverflow);
  }
);

onMounted(() => {
  restoreState();
  startPoll();
  nextTick(checkMarqueeOverflow);
  window.electronAPI.onTogglePlay(() => VideoPlaySet());
  window.electronAPI.onPlayPrevious(() => playPrevious());
  window.electronAPI.onPlayNext(() => playNext());
});

onUnmounted(() => {
  stopPoll();
  if (seekTimer) clearTimeout(seekTimer);
});
</script>

<style scoped>
.playback {
  height: 80px;
  display: flex;
  flex-direction: column;
  background: var(--surface-2);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
  --n-handle-size: 0;
  --n-fill-color: var(--color-primary);
  --n-fill-color-hover: var(--color-primary-hover);
  --n-handle-color: var(--text-inverse);
  --n-rail-color: var(--b-border);
  --n-rail-color-hover: var(--b-border);
}

.progress-bar:hover :deep(.n-slider) {
  --n-handle-size: 8px;
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
  box-shadow: 0 0 12px var(--color-primary-glow);
  animation: coverGlow 2.5s ease-in-out infinite;
}

@keyframes coverGlow {
  0%,
  100% {
    box-shadow: 0 0 12px var(--color-primary-glow);
  }
  50% {
    box-shadow: 0 0 20px var(--shadow-glow);
  }
}

.cover-img {
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  transition:
    box-shadow var(--duration-normal) var(--ease-in-out),
    transform var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.cover-img:hover {
  transform: scale(1.05);
}

.cover-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  color: var(--text-tertiary);
}

.ctrl-icon {
  color: var(--text-secondary);
}

.main-icon {
  color: var(--text-inverse);
}

.track-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.track-title-wrap {
  overflow: hidden;
}

.track-title {
  display: inline-flex;
  white-space: nowrap;
  cursor: default;
}

.track-title.active {
  animation: marquee 14s linear infinite;
}

.track-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  padding-right: 48px;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
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
  background: var(--b-hover-neutral);
}

.ctrl-btn:hover :deep(.svg-icon) {
  color: var(--text-primary);
}

.ctrl-btn-main {
  width: 44px;
  height: 44px;
  background: var(--gradient-primary);
  font-size: 18px;
}

.ctrl-btn-main:hover {
  background: var(--gradient-primary-hover);
  box-shadow: 0 0 16px var(--shadow-glow);
}

.ctrl-btn-main:active {
  background: var(--gradient-primary-active);
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
  color: var(--text-tertiary);
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
