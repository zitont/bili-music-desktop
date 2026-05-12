<template>
  <div class="settings-page">
    <div class="settings-header">
      <h1 class="settings-title">设置</h1>
    </div>

    <n-scrollbar class="settings-content">
      <div class="setting-card">
        <div class="card-section">
          <h2 class="card-section-title">外观</h2>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">深色模式</span>
              <span class="setting-desc">切换亮色/暗色主题</span>
            </div>
            <n-switch :value="themeStore.isDark" @update:value="themeStore.toggleTheme" />
          </div>
          <div class="setting-row-divider"></div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">磨砂玻璃</span>
              <span class="setting-desc">半透明背景毛玻璃效果</span>
            </div>
            <n-switch :value="themeStore.glassEnabled" @update:value="themeStore.toggleGlass" />
          </div>
        </div>

        <div class="card-divider"></div>

        <div class="card-section">
          <h2 class="card-section-title">播放动画</h2>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">背景动画</span>
              <span class="setting-desc">播放音乐时显示动态背景</span>
            </div>
            <n-switch :value="animStore.enabled" @update:value="animStore.toggleEnabled" />
          </div>
          <div class="setting-row-divider"></div>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">动画效果</span>
              <span class="setting-desc">{{ animOptions[animStore.mode] }}</span>
            </div>
            <n-select
              :value="animStore.mode"
              :options="animOptions.map((label, value) => ({ label, value }))"
              style="width: 140px"
              @update:value="animStore.setMode"
            />
          </div>
        </div>

        <div class="card-divider"></div>

        <div class="card-section">
          <h2 class="card-section-title">数据</h2>
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">数据存储位置</span>
              <span class="setting-desc">{{ dataDir || '默认位置（点击修改）' }}</span>
            </div>
            <n-button size="small" @click="selectDataDir">修改</n-button>
          </div>
        </div>

        <div class="card-divider"></div>

        <div class="card-section">
          <h2 class="card-section-title">关于</h2>
          <div class="setting-row link-row" @click="goAbout">
            <div class="setting-info">
              <span class="setting-label">关于 Bili Music</span>
              <span class="setting-desc">版本信息与项目链接</span>
            </div>
            <svg-icon icon-name="icon-arrow-right" class="link-arrow"></svg-icon>
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NScrollbar, NSwitch, NSelect, NButton, useMessage } from 'naive-ui';
import { useRouter } from 'vue-router';
import { useThemeStore, useAnimationStore } from '@/store';

const router = useRouter();
const themeStore = useThemeStore();
const animStore = useAnimationStore();
const message = useMessage();

const dataDir = ref('');

const animOptions = [
  '涟漪扩散',
  '波形律动',
  '粒子浮游',
  '频谱瀑布',
  '放射光圈',
  '极光流彩',
];

async function selectDataDir() {
  try {
    const result = await window.electronAPI.selectDataDirectory();
    if (result.success) {
      dataDir.value = result.path;
      message.success('数据目录已更新，重启后生效');
    }
  } catch (error) {
    console.error('选择数据目录失败:', error);
    message.error('选择数据目录失败');
  }
}

async function loadDataDir() {
  try {
    const result = await window.electronAPI.getDataDirectory();
    if (result.path) {
      dataDir.value = result.path;
    }
  } catch {
    // 忽略
  }
}

function goAbout() {
  router.push('/about');
}

onMounted(() => {
  loadDataDir();
});
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-0);
}

.settings-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--b-border);
}

.settings-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.settings-content {
  flex: 1;
  padding: 16px 24px;
}

.setting-card {
  background: var(--surface-1);
  border: 1px solid var(--b-border);
  border-radius: 12px;
  overflow: hidden;
  animation: cardFadeIn 0.3s var(--ease-out) both;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-section {
  padding: 16px 20px;
}

.card-divider {
  height: 1px;
  margin: 0 20px;
  background-color: var(--b-border);
}

.card-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  letter-spacing: 0.04em;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.setting-row-divider {
  height: 1px;
  margin: 0 0 4px 0;
  background-color: var(--b-border);
}

.link-row {
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-in-out);
  border-radius: 8px;
  padding: 0 4px;
}

.link-row:hover {
  background: var(--b-hover);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.link-arrow {
  font-size: 18px;
  color: var(--text-tertiary);
  transition: color var(--duration-fast) var(--ease-in-out);
}

.link-row:hover .link-arrow {
  color: var(--text-primary);
}
</style>
