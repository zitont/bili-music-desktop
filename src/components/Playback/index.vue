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
import * as audioPlayer from '../../utils/audio-player.js';

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
let isSwitchingTrack = false;
let prefetchedAudioUrl: string | null = null;
let prefetchDoneForBvid: string | null = null;

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

/**
 * 预加载下一首的音频 URL（前台预加载，后台直接使用）
 */
async function prefetchNextTrack() {
  if (lists.value.length === 0) return;
  const nextIndex = mode.value === 2
    ? Math.floor(Math.random() * lists.value.length)
    : currentIndex.value < lists.value.length - 1
      ? currentIndex.value + 1
      : 0;
  const nextTrack = lists.value[nextIndex];
  if (!nextTrack || prefetchDoneForBvid === nextTrack.video_bvid) return;

  try {
    const info = await window.electronAPI.apiGetVideoInfo(nextTrack.video_bvid);
    if (!info) return;
    const audioData = await window.electronAPI.apiGetAudioUrl(nextTrack.video_bvid, info.cid);
    if (!audioData) return;
    prefetchedAudioUrl = audioData.audioUrl;
    prefetchDoneForBvid = nextTrack.video_bvid;
  } catch {
    // 预加载失败，不影响当前播放
  }
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

async function applyTrack(track: any) {
  if (isSwitchingTrack) return;
  isSwitchingTrack = true;
  audioPlayer.prepareAudioContext();
  videoimg_url.value = track.video_img_url;
  videotitle.value = track.video_title;
  video_bvid.value = track.video_bvid;
  const start = track.video_startTime || 0;
  const end = track.video_endtime || track.video_duration;
  trackStartTime.value = start;
  trackEndTime.value = end;
  duration.value = end - start;

  try {
    let audioUrl: string;

    // 优先使用预加载的 URL（后台切换时无需 IPC）
    if (prefetchedAudioUrl && prefetchDoneForBvid === track.video_bvid) {
      audioUrl = prefetchedAudioUrl;
    } else {
      // 通过 API 获取视频信息（含 cid）
      const info = await window.electronAPI.apiGetVideoInfo(track.video_bvid);
      if (!info) {
        console.error('获取视频信息失败:', track.video_bvid);
        return;
      }

      // 通过 API 获取音频流地址
      const audioData = await window.electronAPI.apiGetAudioUrl(track.video_bvid, info.cid);
      if (!audioData) {
        console.error('获取音频流失败:', track.video_bvid);
        return;
      }
      audioUrl = audioData.audioUrl;
    }

    // 清除预加载缓存
    prefetchedAudioUrl = null;
    prefetchDoneForBvid = null;

    // 使用本地音频播放器播放
    audioPlayer.play(audioUrl, start);
    audioPlayer.setVolume(volume.value / 100);
    playback_status.value = true;
    isPlaying.value = true;
  } catch (error) {
    console.error('播放失败:', error);
  } finally {
    isSwitchingTrack = false;
  }
}

function volumeChange(value: number) {
  audioPlayer.setVolume(value / 100);
  volumes.value = value;
  volume.value = value;
}

function VideoPlaySet() {
  if (video_bvid.value !== '') {
    audioPlayer.togglePlay();
  }
}

function seekTo(value: number) {
  isSeeking.value = true;
  currentTime.value = value;
  audioPlayer.seekTo(value + trackStartTime.value);
  setTimeout(() => {
    isSeeking.value = false;
  }, 400);
}

function handleListLoop() {
  currentIndex.value = currentIndex.value < lists.value.length - 1 ? currentIndex.value + 1 : 0;
  currentTime.value = 0;
  applyTrack(lists.value[currentIndex.value]);
}

function resetCurrentTime() {
  audioPlayer.seekTo(trackStartTime.value);
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
      audioPlayer.setVolume((saved.volume ?? 60) / 100);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// 监听音频播放器状态变化
let cleanupState: (() => void) | null = null;
let cleanupEnded: (() => void) | null = null;
let cleanupTogglePlay: (() => void) | null = null;
let cleanupPlayPrevious: (() => void) | null = null;
let cleanupPlayNext: (() => void) | null = null;
let cleanupVisibility: (() => void) | null = null;

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
  nextTick(checkMarqueeOverflow);

  // 订阅音频播放器状态
  cleanupState = audioPlayer.onStateChange((state) => {
    if (!isSeeking.value) {
      currentTime.value = Math.max(0, state.currentTime - trackStartTime.value);
    }
    isPlaying.value = state.playing;
    playback_status.value = state.playing;

    // 播放到一半时预加载下一首（确保后台场景也有足够时间）
    if (state.duration > 0 && state.currentTime > state.duration * 0.5) {
      prefetchNextTrack();
    }
  });

  // 订阅播放结束事件（ended 事件在窗口后台/minimized 时仍可靠触发）
  cleanupEnded = audioPlayer.onEnded(() => {
    if (mode.value === 0) handleListLoop();
    else if (mode.value === 1) resetCurrentTime();
    else if (mode.value === 2) handleRandomLoop();
  });

  // 托盘/媒体键控制
  cleanupTogglePlay = window.electronAPI.onTogglePlay(() => VideoPlaySet());
  cleanupPlayPrevious = window.electronAPI.onPlayPrevious(() => playPrevious());
  cleanupPlayNext = window.electronAPI.onPlayNext(() => playNext());

  // 窗口恢复可见时，检查是否有未完成的曲目切换
  const handleVisibility = () => {
    if (document.visibilityState !== 'visible') return;
    const state = audioPlayer.getState();
    if (state.duration > 0 && state.currentTime >= state.duration - 1 && !state.playing) {
      // 歌曲已结束但未切换（后台时 ended 事件可能丢失或 IPC 失败）
      if (mode.value === 0) handleListLoop();
      else if (mode.value === 1) resetCurrentTime();
      else if (mode.value === 2) handleRandomLoop();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  cleanupVisibility = () => document.removeEventListener('visibilitychange', handleVisibility);
});

onUnmounted(() => {
  cleanupState?.();
  cleanupEnded?.();
  cleanupTogglePlay?.();
  cleanupPlayPrevious?.();
  cleanupPlayNext?.();
  cleanupVisibility?.();
});
</script>

<style scoped>
.playback {
  height: 80px;
  display: flex;
  flex-direction: column;
  background: var(--surface-2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  position: relative;
}

.playback::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-hover), transparent);
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  height: 18px;
  display: flex;
  align-items: center;
  padding: 0;
}

.progress-bar :deep(.n-slider-rail) {
  height: 3px !important;
}

.progress-bar:hover :deep(.n-slider-rail) {
  height: 5px !important;
}

.progress-bar :deep(.n-slider-fill) {
  box-shadow: 0 0 12px var(--color-primary-glow);
}

.progress-bar :deep(.n-slider-handle) {
  width: 0 !important;
  height: 0 !important;
}

.progress-bar:hover :deep(.n-slider-handle) {
  width: 10px !important;
  height: 10px !important;
}

.controls {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px 24px 0;
  gap: 20px;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 280px;
  flex-shrink: 0;
}

.cover-wrapper {
  position: relative;
  flex-shrink: 0;
}

.cover-wrapper::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  background: var(--gradient-primary);
  opacity: 0;
  z-index: -1;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.cover-wrapper.playing::after {
  opacity: 0.3;
  animation: coverPulse 3s ease-in-out infinite;
}

@keyframes coverPulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.02); }
}

.cover-img {
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  transition:
    box-shadow var(--duration-normal) var(--ease-in-out),
    transform var(--duration-normal) var(--ease-out);
  cursor: pointer;
  position: relative;
  z-index: 1;
}

.cover-img:hover {
  transform: scale(1.08) rotate(1deg);
}

.cover-placeholder {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--surface-3), var(--surface-2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  color: var(--text-tertiary);
  position: relative;
  z-index: 1;
}

.ctrl-icon {
  color: var(--text-secondary);
  transition: all var(--duration-normal) var(--ease-out);
}

.main-icon {
  color: var(--text-inverse);
  transition: all var(--duration-normal) var(--ease-out);
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
  font: var(--font-subheading);
  color: var(--text-primary);
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
  gap: 4px;
}

.playback-controls {
  display: flex;
  align-items: center;
  gap: 12px;
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
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
}

.ctrl-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--b-hover-neutral);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.ctrl-btn:hover::before {
  opacity: 1;
}

.ctrl-btn:hover .ctrl-icon {
  color: var(--text-primary);
  transform: scale(1.1);
}

.ctrl-btn:active {
  transform: scale(0.9);
}

.ctrl-btn-main {
  width: 30px;
  height: 30px;
  background: var(--gradient-primary);
  font-size: 14px;
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

.ctrl-btn-main::before {
  background: var(--gradient-primary-hover);
}

.ctrl-btn-main:hover {
  box-shadow: 0 6px 24px var(--shadow-glow);
  transform: scale(1.05);
}

.ctrl-btn-main:active {
  background: var(--gradient-primary-active);
  transform: scale(0.95);
  box-shadow: 0 2px 8px var(--color-primary-glow);
}

.ctrl-btn-main .main-icon {
  position: relative;
  z-index: 1;
  transition: transform var(--duration-fast) var(--ease-out);
}

.ctrl-btn-main:active .main-icon {
  transform: scale(0.9);
}

.time-display {
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 240px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.volume-slider {
  width: 100px;
}

.tooltip-text {
  font-size: 12px;
  font-weight: 500;
}
</style>
