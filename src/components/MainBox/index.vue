<template>
  <div class="main-box">
    <!-- 编辑歌曲抽屉 -->
    <EditSong
      v-model:show="showEditSong"
      :song="editingSong as any"
      :current-playlist-id="menus"
      @save="handleSaveSong"
      @delete="handleDeleteSong"
    />

    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <span class="header-title">{{ currentPlaylistName }}</span>
        <span class="header-count">{{ filteredItems.length }} 首歌曲</span>
      </div>
      <div class="header-right">
        <n-input
          v-model:value="searchQuery"
          placeholder="搜索视频..."
          clearable
          size="small"
          class="search-input"
        >
          <template #prefix>
            <svg-icon icon-name="icon-sousuo" class="search-icon" style="font-size: 14px"></svg-icon>
          </template>
        </n-input>
      </div>
    </div>

    <!-- 状态提示 -->
    <div v-if="loadError" class="load-error">
      <span>{{ loadError }}</span>
    </div>

    <!-- 表头 -->
    <div class="table-header">
      <div class="col-title">标题</div>
      <div class="col-duration">时长</div>
      <div class="col-action"></div>
    </div>

    <!-- 视频列表 -->
    <n-scrollbar class="list-scroll">
      <!-- 空状态：搜索无结果 -->
      <div v-if="filteredItems.length === 0 && !loadError && searchQuery" class="empty-state">
        <svg-icon icon-name="icon-empty" class="empty-icon"></svg-icon>
        <span class="empty-text">未找到匹配的视频</span>
        <span class="empty-hint">尝试其他搜索关键词</span>
      </div>

      <!-- 空状态：歌单无歌曲 -->
      <div v-else-if="items.length === 0 && !loadError && !searchQuery" class="empty-state">
        <div class="empty-illustration">
          <div class="empty-disc"></div>
          <div class="empty-note"></div>
          <div class="empty-note empty-note--short"></div>
        </div>
        <span class="empty-title">开始你的音乐之旅</span>
        <span class="empty-text">歌单还是空的，快来添加你喜欢的 B 站视频吧</span>
        <button class="empty-action" @click="goToAdd">
          <svg-icon icon-name="icon-tianjia" style="font-size: 16px"></svg-icon>
          添加视频
        </button>
      </div>

      <div
        v-for="(item, index) in filteredItems"
        :key="item.video_bvid"
        class="list-item"
        :class="{ active: video_bvid === item.video_bvid }"
        :style="{ animationDelay: Math.min(index, 15) * 20 + 'ms' }"
        @click="handoffvideo(item, index)"
      >
        <div class="col-title">
          <n-image
            width="80"
            height="45"
            :src="item.video_img_url"
            object-fit="cover"
            preview-disabled
            class="cover-img"
            lazy
          />
          <div class="title-info">
            <span class="video-title">{{ item.video_title }}</span>
            <span class="video-up">{{ item.up_name }}</span>
          </div>
        </div>
        <div class="col-duration">
          <span>{{ formatTime(item.video_duration) }}</span>
        </div>
        <div class="col-action">
          <n-dropdown
            :options="getActionOptions(item)"
            trigger="click"
            @select="(key: string) => handleAction(key, item)"
          >
            <n-button text size="small" class="action-btn" @click.stop>
              <svg-icon icon-name="icon-gengduoxiao"></svg-icon>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { VideoGetListsID } from '../../utils/electronApi.js';
import { formatTime } from '../../utils/functions.js';
import { useMenusStore, usePlayStore, usePlayList } from '../../store';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';
import EditSong from '../EditSong/index.vue';
import type { VideoItem } from '../../types/video';
import * as audioPlayer from '../../utils/audio-player.js';

const router = useRouter();
const message = useMessage();
const store = useMenusStore();
const play = usePlayStore();
const playList = usePlayList();

const { menus, currentPlaylistName } = storeToRefs(store);
const { duration, videotitle, videoimg_url, video_bvid, playback_status, volume } = storeToRefs(play);
const { needsRefresh, lists, currentIndex } = storeToRefs(playList);

const items = ref<VideoItem[]>([]);
const showEditSong = ref(false);
const editingSong = ref<VideoItem | null>(null);
const loadError = ref('');
const searchQuery = ref('');

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return items.value;
  }
  const query = searchQuery.value.trim().toLowerCase();
  return items.value.filter(item =>
    item.video_title.toLowerCase().includes(query) ||
    item.up_name.toLowerCase().includes(query)
  );
});

function goToAdd() {
  router.push('/increase');
}

async function handoffvideo(item: VideoItem, index: number) {
  audioPlayer.prepareAudioContext();
  const startTime = item.video_startTime || 0;
  const endTime = item.video_endtime || item.video_duration;

  // 更新 store
  videoimg_url.value = item.video_img_url;
  videotitle.value = item.video_title;
  video_bvid.value = item.video_bvid;
  duration.value = endTime - startTime;
  currentIndex.value = index;

  try {
    // 通过 API 获取音频流并播放
    const info = await window.electronAPI.apiGetVideoInfo(item.video_bvid);
    if (!info) {
      message.error('获取视频信息失败');
      return;
    }
    const audioData = await window.electronAPI.apiGetAudioUrl(item.video_bvid, info.cid);
    if (!audioData) {
      message.error('获取音频流失败，请检查 SESSDATA');
      return;
    }
    audioPlayer.play(audioData.audioUrl, startTime);
    audioPlayer.setVolume(volume.value / 100);
    playback_status.value = true;
  } catch (error) {
    console.error('播放失败:', error);
    message.error('播放失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
}

function getActionOptions(_item: VideoItem): DropdownOption[] {
  return [
    { label: '编辑', key: 'edit' },
    { label: '删除', key: 'delete' },
  ];
}

function handleAction(key: string, item: VideoItem) {
  switch (key) {
    case 'edit':
      editSong(item);
      break;
    case 'delete':
      deleteSong(item);
      break;
  }
}

function editSong(item: VideoItem) {
  editingSong.value = item;
  showEditSong.value = true;
}

async function deleteSong(item: VideoItem) {
  try {
    await window.electronAPI.deleteVideo(item.video_bvid);
    message.success('删除成功');
    needsRefresh.value = true;
  } catch (error) {
    console.error('删除歌曲失败:', error);
    message.error('删除失败');
  }
}

async function handleSaveSong(data: any) {
  try {
    await window.electronAPI.updateVideo(data.bvid, data.title, data.startTime, data.endTime);
    if (data.playlistId && data.playlistId !== menus.value) {
      await window.electronAPI.moveVideo(data.bvid, menus.value, data.playlistId);
    }
    message.success('保存成功');
    needsRefresh.value = true;
  } catch (error) {
    console.error('保存歌曲失败:', error);
    message.error('保存失败');
  }
}

function handleDeleteSong(bvid: string) {
  deleteSong({ video_bvid: bvid } as VideoItem);
}

if (!window.electronAPI) {
  loadError.value = 'Electron API 未加载，请通过 Electron 启动应用';
} else {
  VideoGetListsID(menus.value)
    .then((listsIDs: VideoItem[]) => {
      items.value = listsIDs || [];
      lists.value = listsIDs || [];
      if (!listsIDs || listsIDs.length === 0) {
        loadError.value = '数据库查询返回空结果';
      }
    })
    .catch((error: Error) => {
      console.error('获取视频列表失败:', error);
      loadError.value = '获取视频列表失败: ' + (error.message || '未知错误');
    });
}

watch(
  () => menus.value,
  (newMenus) => {
    VideoGetListsID(newMenus).then((refd: VideoItem[]) => {
      items.value = refd;
    });
  }
);

watch(
  () => needsRefresh.value,
  () => {
    VideoGetListsID(menus.value).then((refd: VideoItem[]) => {
      items.value = refd;
      needsRefresh.value = false;
    });
  }
);
</script>

<style scoped>
.main-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.header {
  padding: 24px 28px 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  animation: headerFadeIn 0.4s var(--ease-out) both;
}

@keyframes headerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.header-title {
  font: var(--font-heading);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  background: linear-gradient(90deg, var(--text-primary), var(--color-primary), var(--text-primary), var(--color-primary));
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientSlide 8s ease-in-out infinite;
}

@keyframes gradientSlide {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.header-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 220px;
  transition: width var(--duration-normal) var(--ease-out);
}

.search-input:focus-within {
  width: 280px;
}

.search-icon {
  color: var(--text-tertiary);
}

.table-header {
  display: flex;
  align-items: center;
  padding: 10px 28px;
  background: var(--surface-1);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--b-border-light);
  position: sticky;
  top: 0;
  z-index: 10;
}

.table-header div {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.col-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.col-duration {
  width: 80px;
  text-align: right;
  padding-right: 8px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.col-action {
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.list-scroll {
  flex: 1;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 28px;
  min-height: 60px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  border-left: 3px solid transparent;
  animation: itemSlideIn 0.3s var(--ease-out) both;
  position: relative;
}

.list-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--b-hover);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

@keyframes itemSlideIn {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.list-item:hover::before {
  opacity: 1;
}

.list-item:hover {
  border-left-color: var(--border-hover);
}

.list-item:hover .cover-img {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.list-item.active {
  background: var(--gradient-primary-subtle);
  border-left-color: var(--color-primary);
  box-shadow: inset 0 0 0 1px var(--border-hover);
}

.list-item.active::before {
  background: linear-gradient(90deg, var(--color-primary-glow), transparent);
  opacity: 0.5;
}

.list-item.active .video-title {
  color: var(--color-primary);
  font-weight: 600;
}

.list-item.active .cover-img {
  box-shadow: 0 0 16px var(--color-primary-glow);
  transform: scale(1.05);
}

.list-item.active .video-up {
  color: var(--text-secondary);
}

.cover-img {
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  z-index: 1;
}

.title-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.video-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
  transition: all var(--duration-normal) var(--ease-out);
}

.video-up {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.3;
  transition: color var(--duration-normal) var(--ease-out);
}

.action-btn {
  opacity: 0;
  transition: all var(--duration-normal) var(--ease-out);
  color: var(--text-secondary);
  position: relative;
  z-index: 1;
}

.list-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  transform: scale(1.15) rotate(90deg);
  color: var(--text-primary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
  animation: emptyFadeIn 0.5s var(--ease-out) both;
}

@keyframes emptyFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-icon {
  font-size: 56px;
  animation: emptyPulse 3s ease-in-out infinite;
  color: var(--text-tertiary);
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  opacity: 0.6;
}

@keyframes emptyPulse {
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* 更丰富的空状态 */
.empty-illustration {
  position: relative;
  width: 120px;
  height: 90px;
  margin-bottom: 8px;
}

.empty-disc {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px dashed var(--text-tertiary);
  opacity: 0.25;
  animation: emptyDiscRotate 8s linear infinite;
}

@keyframes emptyDiscRotate {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.empty-note {
  position: absolute;
  right: 8px;
  top: 8px;
  width: 40px;
  height: 6px;
  border-radius: 3px;
  background: var(--text-tertiary);
  opacity: 0.15;
  transform: rotate(-15deg);
}

.empty-note--short {
  width: 24px;
  top: 22px;
  right: 16px;
  opacity: 0.1;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.empty-action {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 20px;
  background: var(--gradient-primary);
  border: none;
  border-radius: 8px;
  color: #08080a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
}

.empty-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--color-primary-glow);
}

.empty-action:active {
  transform: scale(0.97);
}

.load-error {
  padding: 14px 28px;
  background: var(--b-danger);
  border-left: 3px solid var(--color-danger);
  margin: 0 28px;
  border-radius: 0 8px 8px 0;
  font-size: 13px;
  color: var(--color-danger);
  font-weight: 500;
  animation: errorSlideIn 0.3s var(--ease-out) both;
}

@keyframes errorSlideIn {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
