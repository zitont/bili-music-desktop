<template>
  <div class="list-box-wrapper">
  <!-- 添加视频抽屉 -->
  <n-drawer v-model:show="drawer" placement="right" width="400">
    <n-drawer-content title="添加视频">
      <n-form :model="form" label-placement="left" label-width="80">
        <n-form-item label="视频BVID">
          <n-space>
            <n-input v-model:value="form.bvid" placeholder="请输入视频BVID" />
            <n-button type="primary" @click="SearchVideo">查询</n-button>
          </n-space>
        </n-form-item>
        <n-form-item label="视频标题">
          <n-input v-model:value="form.title" placeholder="请输入视频标题" />
        </n-form-item>
        <n-form-item label="视频UP">
          <n-input v-model:value="form.upname" placeholder="请输入UP名称" />
        </n-form-item>
        <n-form-item label="UP主页">
          <n-a :href="form.uphomepage" target="_blank">{{ form.uphomepage }}</n-a>
        </n-form-item>
        <n-form-item label="视频地址">
          <n-a :href="form.videourl" target="_blank">{{ form.videourl }}</n-a>
        </n-form-item>
        <n-form-item label="视频封面">
          <n-image
            v-if="form.imageurl"
            width="180"
            height="100"
            :src="form.imageurl"
            object-fit="cover"
          />
        </n-form-item>
        <n-form-item label="收藏夹">
          <n-select
            v-model:value="form.videolist_id"
            :options="selectOptions"
            placeholder="请选择收藏夹"
          />
        </n-form-item>
        <n-form-item label="时间选择">
          <n-slider v-model:value="form.value" range :max="form.timemax" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space>
          <n-button @click="drawer = false">取消</n-button>
          <n-button type="primary" @click="submit">提交</n-button>
        </n-space>
      </template>
    </n-drawer-content>
  </n-drawer>

  <!-- 主内容区 -->
  <div class="list-box">
    <div class="main-content">
      <!-- 当前播放信息 -->
      <div v-if="status" class="now-playing">
        <n-image
          v-if="videoimgurl"
          :src="videoimgurl"
          width="120"
          height="68"
          object-fit="cover"
          preview-disabled
          class="np-cover"
        />
        <div class="np-info">
          <span class="np-title">{{ videotitles }}</span>
        </div>
      </div>

      <!-- 搜索和操作区 -->
      <div class="search-section">
        <n-input v-model:value="searchQuery" placeholder="输入视频 BV 号" clearable size="small">
          <template #prefix>
            <svg-icon iconName="icon-shoucangjia" color="#8a8890" style="font-size: 14px;"></svg-icon>
          </template>
        </n-input>
        <n-dropdown :options="dropdownOptions" @select="handleCommand" trigger="click">
          <n-button size="small" type="primary">添加</n-button>
        </n-dropdown>
      </div>

      <!-- 收藏夹列表 -->
      <div class="collection-list">
        <div
          v-for="item in menuItems"
          :key="item.videolists_id"
          class="collection-item"
          :class="{ active: menus === item.videolists_id }"
          @click="listid(item.videolists_id)"
        >
          <span>{{ item.videolist_name }}</span>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive, computed } from 'vue';
import { useMenusStore, usePlayStore, usePlayList } from '../../store';
import { storeToRefs } from 'pinia';
import { useMessage } from 'naive-ui';
import type { DropdownOption } from 'naive-ui';

const message = useMessage();

interface MenuItem {
  videolists_id: number;
  videolist_name: string;
}

const drawer = ref(false);
const searchQuery = ref('');

const play = usePlayStore();
const playList = usePlayList();
const store = useMenusStore();

const { listser } = storeToRefs(playList);
const { duration, videotitle, videoimg_url, video_bvid, playback_status } = storeToRefs(play);
const { menus } = storeToRefs(store);

const videoimgurl = ref('');
const videotitles = ref('');
const menuItems = ref<MenuItem[]>([]);
const status = ref(playback_status.value);

// 用 ref 保存查询结果，避免抽屉关闭后数据丢失
const queriedData = ref<any>(null);

const form = reactive({
  bvid: '',
  title: '',
  videolist_id: null as number | null,
  imageurl: '',
  upname: '',
  timemax: 100,
  value: [0, 80] as [number, number],
  uphomepage: '',
  videourl: '',
});

const selectOptions = computed(() => {
  return menuItems.value.map((item) => ({
    label: item.videolist_name,
    value: item.videolists_id,
  }));
});

const dropdownOptions: DropdownOption[] = [
  { label: '添加视频', key: 'a' },
  { label: '添加收藏夹', key: 'b' },
];

function SearchVideo() {
  if (!form.bvid) {
    message.warning('请输入视频BVID');
    return;
  }
  window.electronAPI.VideoGetinfo(form.bvid).then((data: any) => {
    if (!data) {
      message.error('未找到视频信息');
      return;
    }
    queriedData.value = {
      bvid: form.bvid,
      videotitle: data.videotitle,
      videopic: data.videopic,
      videoduration: data.videoduration,
      upname: data.upname,
      videourl: data.videourl,
      uphomepage: data.uphomepage,
      startTime: 0,
      endTime: data.videoduration,
    };
    form.title = data.videotitle;
    form.imageurl = data.videopic;
    form.timemax = data.videoduration;
    form.upname = data.upname;
    form.videourl = data.videourl;
    form.uphomepage = data.uphomepage;
    form.value = [0, data.videoduration];
    message.success('查询成功');
  }).catch(() => {
    message.error('查询视频失败');
  });
}

function submit() {
  if (!queriedData.value) {
    message.warning('请先查询视频信息');
    return;
  }
  if (!form.videolist_id) {
    message.warning('请选择收藏夹');
    return;
  }

  const d = queriedData.value;
  const videoInfoObject = {
    bvid: d.bvid || '',
    videotitle: d.videotitle || '',
    videolist_id: form.videolist_id || 1,
    videopic: d.videopic || '',
    upname: d.upname || '',
    uphomepage: d.uphomepage || '',
    videoduration: Number(d.videoduration) || 0,
    videourl: d.videourl || '',
    videoend: Number(form.value[1] || d.endTime) || 0,
    videostart: Number(form.value[0] || d.startTime) || 0,
  };

  window.electronAPI.InsertVideoinfo(videoInfoObject).then((result) => {
    if (result && result.success) {
      message.success('添加成功');
      listser.value = true;
      drawer.value = false;
      queriedData.value = null;
    } else {
      message.error('添加失败: ' + (result?.error || '数据库写入异常'));
    }
  }).catch((err) => {
    message.error('请求失败: ' + (err.message || 'IPC通信异常'));
  });
}

function listid(id: number) {
  store.setMenu(id);
}

function handleCommand(key: string) {
  if (key === 'a') {
    drawer.value = true;
  }
}

watch(
  () => video_bvid.value,
  () => {
    videoimgurl.value = videoimg_url.value;
    videotitles.value = videotitle.value;
    status.value = playback_status.value;
  }
);

onMounted(() => {
  window.electronAPI.VideoGetLists().then((lists: MenuItem[]) => {
    menuItems.value = lists;
  });
});

// drawer 打开时确保默认选中第一个收藏夹
watch(
  () => drawer.value,
  (isOpen) => {
    if (isOpen && menuItems.value.length > 0 && form.videolist_id === null) {
      form.videolist_id = menuItems.value[0].videolists_id;
    }
  }
);
</script>

<style scoped>
.list-box-wrapper {
  height: 100%;
}

.list-box {
  display: flex;
  height: 100%;
  background: #08080a;
}

.main-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.now-playing {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(201, 165, 92, 0.12);
  animation: nowPlayingGlow 3s ease-in-out infinite;
}

@keyframes nowPlayingGlow {
  0%, 100% { border-color: rgba(201, 165, 92, 0.08); }
  50% { border-color: rgba(201, 165, 92, 0.2); }
}

.np-cover {
  border-radius: 8px;
  flex-shrink: 0;
  overflow: hidden;
}

.np-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.np-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8e6e0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-section {
  display: flex;
  gap: 8px;
}

.collection-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-item {
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #8a8890;
  transition: all var(--duration-fast) var(--ease-in-out);
  border-left: 3px solid transparent;
  animation: collectionSlideIn 0.2s var(--ease-out) both;
}

@keyframes collectionSlideIn {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.collection-item:nth-child(1) { animation-delay: 0ms; }
.collection-item:nth-child(2) { animation-delay: 30ms; }
.collection-item:nth-child(3) { animation-delay: 60ms; }
.collection-item:nth-child(4) { animation-delay: 90ms; }
.collection-item:nth-child(5) { animation-delay: 120ms; }

.collection-item:hover {
  background: rgba(201, 165, 92, 0.06);
  color: #e8e6e0;
}

.collection-item.active {
  background: rgba(201, 165, 92, 0.08);
  color: #c9a55c;
  border-left-color: #c9a55c;
}
</style>
