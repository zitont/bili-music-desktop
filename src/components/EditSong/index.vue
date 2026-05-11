<template>
  <n-drawer v-model:show="visible" placement="right" width="400">
    <n-drawer-content title="编辑歌曲">
      <div v-if="song" class="edit-form">
        <!-- 歌曲信息 -->
        <div class="song-info">
          <n-image
            v-if="song.video_img_url"
            :src="song.video_img_url"
            width="160"
            height="90"
            object-fit="cover"
            preview-disabled
            class="song-cover"
          />
          <div class="song-details">
            <h3 class="song-title">{{ song.video_title }}</h3>
            <p class="song-up">UP主: {{ song.up_name }}</p>
          </div>
        </div>

        <!-- 编辑表单 -->
        <n-form :model="form" label-placement="left" label-width="80">
          <n-form-item label="视频标题">
            <n-input v-model:value="form.title" placeholder="视频标题" />
          </n-form-item>

          <n-form-item label="开始时间">
            <n-input-number
              v-model:value="form.startTime"
              :min="0"
              :max="form.endTime"
              placeholder="开始时间（秒）"
            >
              <template #suffix>秒</template>
            </n-input-number>
          </n-form-item>

          <n-form-item label="结束时间">
            <n-input-number
              v-model:value="form.endTime"
              :min="form.startTime"
              :max="song.video_duration"
              placeholder="结束时间（秒）"
            >
              <template #suffix>秒</template>
            </n-input-number>
          </n-form-item>

          <n-form-item label="时长">
            <span class="duration-text">{{ formatDuration(form.endTime - form.startTime) }}</span>
          </n-form-item>

          <n-form-item label="歌单">
            <n-select
              v-model:value="form.playlistId"
              :options="playlistOptions"
              placeholder="选择歌单"
            />
          </n-form-item>
        </n-form>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <n-button @click="handleCancel">取消</n-button>
          <n-button type="error" ghost @click="handleDelete">删除</n-button>
          <n-button type="primary" @click="handleSave">保存</n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { useMessage } from 'naive-ui';

interface Song {
  video_bvid: string;
  video_title: string;
  video_img_url: string;
  video_startTime: number;
  video_endtime: number;
  video_duration: number;
  video_url: string;
  up_name: string;
  up_home: string;
}

interface Playlist {
  videolists_id: number;
  videolist_name: string;
}

const props = defineProps<{
  show: boolean;
  song: Song | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'save', data: any): void;
  (e: 'delete', bvid: string): void;
}>();

const message = useMessage();

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val),
});

const form = reactive({
  title: '',
  startTime: 0,
  endTime: 0,
  playlistId: null as number | null,
});

const playlistOptions = ref<{ label: string; value: number }[]>([]);

watch(
  () => props.song,
  (newSong) => {
    if (newSong) {
      form.title = newSong.video_title;
      form.startTime = newSong.video_startTime || 0;
      form.endTime = newSong.video_endtime || newSong.video_duration;
    }
  },
  { immediate: true }
);

function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function loadPlaylists() {
  try {
    const lists = await window.electronAPI.VideoGetLists();
    playlistOptions.value = lists.map((item: Playlist) => ({
      label: item.videolist_name,
      value: item.videolists_id,
    }));
  } catch (error) {
    console.error('加载歌单失败:', error);
  }
}

function handleSave() {
  if (!props.song) return;

  const data = {
    bvid: props.song.video_bvid,
    title: form.title,
    startTime: form.startTime,
    endTime: form.endTime,
    playlistId: form.playlistId,
  };

  emit('save', data);
  visible.value = false;
  message.success('保存成功');
}

function handleDelete() {
  if (!props.song) return;

  emit('delete', props.song.video_bvid);
  visible.value = false;
  message.success('删除成功');
}

function handleCancel() {
  visible.value = false;
}

loadPlaylists();
</script>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.song-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.song-cover {
  border-radius: 8px;
  width: 100%;
  overflow: hidden;
  transition: transform var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.song-cover:hover {
  transform: scale(1.02);
}

.song-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.song-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8e6e0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-up {
  font-size: 11px;
  color: #8a8890;
  margin: 0;
}

.duration-text {
  font-size: 15px;
  color: #c9a55c;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.drawer-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:deep(.n-input-number) {
  width: 100%;
}
</style>
