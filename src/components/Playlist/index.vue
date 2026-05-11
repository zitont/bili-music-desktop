<template>
  <div class="playlist-page">
    <!-- 头部 -->
    <div class="playlist-header">
      <h1 class="playlist-title">歌单管理</h1>
      <n-button type="primary" size="small" @click="showCreateDialog = true">
        <template #icon>
          <svg-icon iconName="icon-tianjia" color="#08080a"></svg-icon>
        </template>
        新建歌单
      </n-button>
    </div>

    <!-- 歌单列表 -->
    <n-scrollbar class="playlist-content">
      <div class="playlist-grid">
        <div
          v-for="playlist in playlists"
          :key="playlist.videolists_id"
          class="playlist-card"
          :class="{ active: currentPlaylistId === playlist.videolists_id }"
          @click="selectPlaylist(playlist)"
        >
          <div class="card-header">
            <div class="card-icon">
              <svg-icon iconName="icon-shoucangjia" color="#c9a55c"></svg-icon>
            </div>
            <div class="card-actions">
              <n-button text size="small" @click.stop="editPlaylist(playlist)">
                <svg-icon iconName="icon-1shezhi-1" color="#8a8890"></svg-icon>
              </n-button>
              <n-button text size="small" @click.stop="deletePlaylist(playlist)">
                <svg-icon iconName="icon-6shanchu-1" color="#8a8890"></svg-icon>
              </n-button>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title">{{ playlist.videolist_name }}</h3>
            <p class="card-count"><span class="count-num">{{ playlist.video_count || 0 }}</span> 首歌曲</p>
          </div>

          <div class="card-footer">
            <span class="card-time">{{ formatDate(playlist.created_at) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="playlists.length === 0" class="empty-state">
          <svg-icon iconName="icon-shoucangjia" color="#4a4854" class="empty-icon"></svg-icon>
          <span class="empty-text">暂无歌单</span>
          <n-button type="primary" size="small" @click="showCreateDialog = true">
            创建第一个歌单
          </n-button>
        </div>
      </div>
    </n-scrollbar>

    <!-- 创建/编辑对话框 -->
    <n-modal v-model:show="showCreateDialog" preset="dialog" title="歌单信息">
      <n-form :model="playlistForm" label-placement="left" label-width="80">
        <n-form-item label="歌单名称">
          <n-input
            v-model:value="playlistForm.name"
            placeholder="请输入歌单名称"
            maxlength="50"
            show-count
          />
        </n-form-item>
        <n-form-item label="描述">
          <n-input
            v-model:value="playlistForm.description"
            type="textarea"
            placeholder="请输入歌单描述（可选）"
            maxlength="200"
            show-count
            :rows="3"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="showCreateDialog = false">取消</n-button>
          <n-button type="primary" @click="savePlaylist">
            {{ editingPlaylist ? '保存' : '创建' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { useMenusStore } from '../../store';
import { storeToRefs } from 'pinia';

interface Playlist {
  videolists_id: number;
  videolist_name: string;
  video_count?: number;
  created_at?: string;
}

const message = useMessage();
const dialog = useDialog();
const store = useMenusStore();
const { menus } = storeToRefs(store);

const playlists = ref<Playlist[]>([]);
const currentPlaylistId = ref<number | null>(null);
const showCreateDialog = ref(false);
const editingPlaylist = ref<Playlist | null>(null);

const playlistForm = reactive({
  name: '',
  description: '',
});

async function loadPlaylists() {
  try {
    const lists = await window.electronAPI.VideoGetLists();
    playlists.value = lists;
  } catch (error) {
    console.error('加载歌单失败:', error);
    message.error('加载歌单失败');
  }
}

function selectPlaylist(playlist: Playlist) {
  currentPlaylistId.value = playlist.videolists_id;
  store.setMenu(playlist.videolists_id);
}

function editPlaylist(playlist: Playlist) {
  editingPlaylist.value = playlist;
  playlistForm.name = playlist.videolist_name;
  playlistForm.description = '';
  showCreateDialog.value = true;
}

function deletePlaylist(playlist: Playlist) {
  dialog.warning({
    title: '删除歌单',
    content: `确定要删除歌单"${playlist.videolist_name}"吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await window.electronAPI.deletePlaylist(playlist.videolists_id);
        message.success('删除成功');
        await loadPlaylists();
      } catch (error) {
        console.error('删除歌单失败:', error);
        message.error('删除失败');
      }
    },
  });
}

async function savePlaylist() {
  if (!playlistForm.name.trim()) {
    message.warning('请输入歌单名称');
    return;
  }

  try {
    if (editingPlaylist.value) {
      await window.electronAPI.updatePlaylist(editingPlaylist.value.videolists_id, playlistForm.name);
      message.success('更新成功');
    } else {
      await window.electronAPI.createPlaylist(playlistForm.name);
      message.success('创建成功');
    }

    showCreateDialog.value = false;
    editingPlaylist.value = null;
    playlistForm.name = '';
    playlistForm.description = '';
    await loadPlaylists();
  } catch (error) {
    console.error('保存歌单失败:', error);
    message.error('保存失败');
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

onMounted(() => {
  loadPlaylists();
});
</script>

<style scoped>
.playlist-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #08080a;
}

.playlist-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.playlist-title {
  font-size: 28px;
  font-weight: 700;
  color: #e8e6e0;
  margin: 0;
  letter-spacing: -0.02em;
}

.playlist-content {
  flex: 1;
  padding: 20px 24px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.playlist-card {
  background: #14141a;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-out);
  animation: cardFadeIn 0.3s var(--ease-out) both;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.playlist-card:nth-child(1) { animation-delay: 0ms; }
.playlist-card:nth-child(2) { animation-delay: 40ms; }
.playlist-card:nth-child(3) { animation-delay: 80ms; }
.playlist-card:nth-child(4) { animation-delay: 120ms; }
.playlist-card:nth-child(5) { animation-delay: 160ms; }
.playlist-card:nth-child(6) { animation-delay: 200ms; }

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(201, 165, 92, 0.15);
}

.playlist-card.active {
  background: rgba(201, 165, 92, 0.04);
  border-color: rgba(201, 165, 92, 0.2);
  border-left: 3px solid #c9a55c;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, rgba(201, 165, 92, 0.1), rgba(201, 165, 92, 0.05));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: transform var(--duration-normal) var(--ease-out);
}

.playlist-card:hover .card-icon {
  transform: rotate(-5deg) scale(1.05);
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.playlist-card:hover .card-actions {
  opacity: 1;
}

.card-body {
  margin-bottom: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #e8e6e0;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-count {
  font-size: 11px;
  color: #4a4854;
  margin: 0;
}

.count-num {
  color: #c9a55c;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.card-footer {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.card-time {
  font-size: 10px;
  color: #4a4854;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 0;
}

.empty-icon {
  font-size: 48px;
}

.empty-text {
  font-size: 13px;
  color: #4a4854;
}
</style>
