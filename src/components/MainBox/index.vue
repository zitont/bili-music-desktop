<template>
  <div class="main-box">
    <!-- 编辑歌曲抽屉 -->
    <EditSong
      v-model:show="showEditSong"
      :song="editingSong"
      @save="handleSaveSong"
      @delete="handleDeleteSong"
    />

    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <span class="header-title">默认收藏夹</span>
        <span class="header-count">{{ items.length }} 首歌曲</span>
      </div>
    </div>

    <!-- 状态提示 -->
    <div v-if="loadError" class="load-error">
      <span>{{ loadError }}</span>
    </div>

    <!-- 表头 -->
    <div class="table-header">
      <div class="col-title">标题</div>
      <div class="col-up">UP主</div>
      <div class="col-duration">时长</div>
      <div class="col-action"></div>
    </div>

    <!-- 视频列表 -->
    <n-scrollbar class="list-scroll">
      <div v-if="items.length === 0 && !loadError" class="empty-state">
        <svg-icon iconName="icon-shoucangjia" color="#4a4854" class="empty-icon"></svg-icon>
        <span class="empty-text">暂无视频</span>
      </div>

      <div
        v-for="(item, index) in items"
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
        <div class="col-up">
          <span class="up-name">{{ item.up_name }}</span>
        </div>
        <div class="col-duration">
          <span>{{ formatTime(item.video_duration) }}</span>
        </div>
        <div class="col-action">
          <n-dropdown :options="getActionOptions(item)" @select="(key) => handleAction(key, item)" trigger="click">
            <n-button text size="small" class="action-btn">
              <svg-icon iconName="icon-gengduoxiao" color="#8a8890"></svg-icon>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { setVideoBvid, VideoGetListsID } from '../../utils/electronApi.js';
import { formatTime } from '../../utils/functions.js';
import { useMenusStore, usePlayStore, usePlayList } from '../../store';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import EditSong from '../EditSong/index.vue';

interface VideoItem {
  video_bvid: string;
  video_title: string;
  video_img_url: string;
  video_duration: number;
  video_startTime?: number;
  video_endtime?: number;
  up_name: string;
  playlist?: string;
}

const message = useMessage();
const store = useMenusStore();
const play = usePlayStore();
const playList = usePlayList();

const { menus } = storeToRefs(store);
const { duration, videotitle, videoimg_url, video_bvid, playback_status } = storeToRefs(play);
const { listser, lists, listnobor } = storeToRefs(playList);

const items = ref<VideoItem[]>([]);
const showEditSong = ref(false);
const editingSong = ref<VideoItem | null>(null);
const loadError = ref('');

function handoffvideo(item: VideoItem, index: number) {
  setVideoBvid(item.video_bvid);
  window.electronAPI.VideoPlaySet(playback_status.value ? 1 : 0);
  playback_status.value = true;
  duration.value = item.video_duration;
  videotitle.value = item.video_title;
  videoimg_url.value = item.video_img_url;
  video_bvid.value = item.video_bvid;
  listnobor.value = index;
}

function getActionOptions(item: VideoItem) {
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
    listser.value = true;
  } catch (error) {
    console.error('删除歌曲失败:', error);
    message.error('删除失败');
  }
}

async function handleSaveSong(data: any) {
  try {
    await window.electronAPI.updateVideo(data.bvid, data.title, data.startTime, data.endTime);
    message.success('保存成功');
    listser.value = true;
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
  VideoGetListsID(menus.value).then((listsIDs: VideoItem[]) => {
    items.value = listsIDs || [];
    lists.value = listsIDs || [];
    if (!listsIDs || listsIDs.length === 0) {
      loadError.value = '数据库查询返回空结果';
    }
  }).catch((error: Error) => {
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
  () => listser.value,
  () => {
    VideoGetListsID(menus.value).then((refd: VideoItem[]) => {
      items.value = refd;
      listser.value = false;
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
  padding: 20px 24px 12px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  animation: headerFadeIn 0.3s var(--ease-out) both;
}

@keyframes headerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 28px;
  font-weight: 700;
  color: #e8e6e0;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.header-count {
  font-size: 11px;
  font-weight: 500;
  color: #4a4854;
  letter-spacing: 0.02em;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 8px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.table-header div {
  font-size: 10px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.col-title {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.col-up {
  width: 120px;
  padding: 0 8px;
  flex-shrink: 0;
}

.col-duration {
  width: 80px;
  text-align: right;
  padding-right: 8px;
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
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
  padding: 10px 24px;
  min-height: 56px;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-in-out), border-left-color var(--duration-fast) var(--ease-in-out);
  border-left: 3px solid transparent;
  animation: itemSlideIn 0.25s var(--ease-out) both;
}

@keyframes itemSlideIn {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.list-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.list-item.active {
  background: rgba(201, 165, 92, 0.06);
  border-left-color: #c9a55c;
  animation: activeItemPulse 3s ease-in-out infinite;
}

@keyframes activeItemPulse {
  0%, 100% { background: rgba(201, 165, 92, 0.04); }
  50% { background: rgba(201, 165, 92, 0.08); }
}

.list-item.active .video-title {
  color: #c9a55c;
}

.list-item.active .cover-img {
  box-shadow: 0 0 12px rgba(201, 165, 92, 0.2);
}

.cover-img {
  border-radius: 6px;
  flex-shrink: 0;
  overflow: hidden;
  transition: box-shadow var(--duration-normal) var(--ease-in-out);
}

.title-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.video-title {
  font-size: 13px;
  font-weight: 500;
  color: #e8e6e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.video-up {
  font-size: 11px;
  color: #4a4854;
  line-height: 1.3;
}

.up-name {
  font-size: 12px;
  color: #8a8890;
}

.action-btn {
  opacity: 0;
  transition: all var(--duration-fast) var(--ease-in-out);
}

.list-item:hover .action-btn {
  opacity: 1;
}

.action-btn:hover {
  transform: scale(1.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
}

.empty-icon {
  font-size: 48px;
  animation: pulse 2s ease-in-out infinite;
}

.empty-text {
  font-size: 13px;
  color: #4a4854;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.load-error {
  padding: 12px 24px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  margin: 0 24px;
  border-radius: 0 6px 6px 0;
  font-size: 13px;
  color: #fca5a5;
}
</style>
