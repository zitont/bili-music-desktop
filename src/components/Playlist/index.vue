<template>
  <div class="playlist-page">
    <!-- 头部 -->
    <div class="playlist-header">
      <h1 class="playlist-title">歌单管理</h1>
      <n-button type="primary" size="small" @click="showCreateDialog = true">
        <template #icon>
          <svg-icon icon-name="icon-tianjia" class="add-icon"></svg-icon>
        </template>
        新建歌单
      </n-button>
    </div>

    <!-- 歌单列表 -->
    <n-scrollbar class="playlist-content">
      <div class="playlist-grid">
        <div
          v-for="(playlist, index) in playlists"
          :key="playlist.videolists_id"
          class="playlist-card"
          :class="{ active: currentPlaylistId === playlist.videolists_id }"
          :style="{ animationDelay: Math.min(index, 19) * 30 + 'ms' }"
          @click="selectPlaylist(playlist)"
        >
          <div class="card-header">
            <div class="card-icon">
              <svg-icon icon-name="icon-shoucangjia" class="card-icon-svg"></svg-icon>
            </div>
            <div class="card-actions">
              <n-button text size="small" @click.stop="editPlaylist(playlist)">
                <svg-icon icon-name="icon-1shezhi-1"></svg-icon>
              </n-button>
              <n-button text size="small" @click.stop="deletePlaylist(playlist)">
                <svg-icon icon-name="icon-6shanchu-1"></svg-icon>
              </n-button>
            </div>
          </div>

          <div class="card-body">
            <h3 class="card-title">{{ playlist.videolist_name }}</h3>
            <p v-if="playlist.description" class="card-desc">{{ playlist.description }}</p>
            <p class="card-count">
              <span class="count-num">{{ playlist.video_count || 0 }}</span> 首歌曲
            </p>
          </div>

          <div class="card-footer">
            <div class="count-bar">
              <div class="count-bar-fill" :style="{ width: getCountPercent(playlist) + '%' }"></div>
            </div>
            <span class="card-time">{{ formatDate(playlist.created_at) }}</span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="playlists.length === 0" class="empty-state">
          <svg-icon icon-name="icon-empty" class="empty-icon"></svg-icon>
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
import { ref, reactive, onMounted, computed } from 'vue';
import { useMessage, useDialog } from 'naive-ui';
import { useMenusStore } from '../../store';
import type { PlaylistItem, PlaylistForm } from '../../types/video';

const message = useMessage();
const dialog = useDialog();
const store = useMenusStore();

const playlists = ref<PlaylistItem[]>([]);
const currentPlaylistId = ref<number | null>(null);
const showCreateDialog = ref(false);
const editingPlaylist = ref<PlaylistItem | null>(null);

const playlistForm = reactive<PlaylistForm>({
  name: '',
  description: '',
});

const maxVideoCount = computed(() => {
  if (playlists.value.length === 0) return 1;
  return Math.max(...playlists.value.map(p => p.video_count || 0), 1);
});

function getCountPercent(playlist: PlaylistItem): number {
  return Math.min(((playlist.video_count || 0) / maxVideoCount.value) * 100, 100);
}

async function loadPlaylists() {
  try {
    const lists = await window.electronAPI.VideoGetLists();
    playlists.value = lists;
  } catch (error) {
    console.error('加载歌单失败:', error);
    message.error('加载歌单失败');
  }
}

function selectPlaylist(playlist: PlaylistItem) {
  currentPlaylistId.value = playlist.videolists_id;
  store.setMenu(playlist.videolists_id);
  store.setPlaylistName(playlist.videolist_name);
}

function editPlaylist(playlist: PlaylistItem) {
  editingPlaylist.value = playlist;
  playlistForm.name = playlist.videolist_name;
  playlistForm.description = playlist.description || '';
  showCreateDialog.value = true;
}

function deletePlaylist(playlist: PlaylistItem) {
  if (playlist.videolists_id === 1) {
    dialog.info({
      title: '提示',
      content: '默认歌单不能删除',
      positiveText: '知道了',
    });
    return;
  }
  dialog.warning({
    title: '删除歌单',
    content: `确定要删除歌单"${playlist.videolist_name}"吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const result = await window.electronAPI.deletePlaylist(playlist.videolists_id);
        if (result && result.success) {
          message.success('删除成功');
          await loadPlaylists();
        } else {
          message.error(result?.error || '删除失败');
        }
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
      await window.electronAPI.updatePlaylist(
        editingPlaylist.value.videolists_id,
        playlistForm.name,
        playlistForm.description
      );
      message.success('更新成功');
    } else {
      await window.electronAPI.createPlaylist(playlistForm.name, playlistForm.description);
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
  background: var(--surface-0);
}

.playlist-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--b-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.playlist-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.playlist-content {
  flex: 1;
  padding: 20px 24px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.playlist-card {
  background: var(--surface-1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--b-border);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
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

.playlist-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-hover);
}

.playlist-card.active {
  background: var(--b-hover);
  border-color: var(--border-active);
  border-left: 3px solid var(--color-primary);
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
  background: var(--gradient-primary-subtle);
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
  color: var(--text-secondary);
}

.card-icon-svg {
  color: var(--color-primary);
}

.add-icon {
  color: var(--text-inverse);
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
  color: var(--text-primary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-count {
  font-size: 11px;
  color: var(--text-tertiary);
  margin: 0;
}

.count-num {
  color: var(--color-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.card-footer {
  padding-top: 8px;
  border-top: 1px solid var(--b-border-light);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.count-bar {
  height: 3px;
  background: var(--surface-3);
  border-radius: 2px;
  overflow: hidden;
}

.count-bar-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
  transition: width var(--duration-normal) var(--ease-out);
}

.card-time {
  font-size: 10px;
  color: var(--text-tertiary);
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
  color: var(--text-tertiary);
}

.empty-text {
  font-size: 13px;
  color: var(--text-tertiary);
}
</style>
