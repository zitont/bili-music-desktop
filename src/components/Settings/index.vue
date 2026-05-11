<template>
  <div class="settings-page">
    <div class="settings-header">
      <h1 class="settings-title">设置</h1>
    </div>

    <n-scrollbar class="settings-content">
      <!-- 关于部分 -->
      <div class="settings-section">
        <h2 class="section-title">关于</h2>
        <div class="about-card">
          <div class="app-info">
            <div class="app-icon-wrapper">
              <svg-icon iconName="icon-shoucangjia" color="#c9a55c" class="app-icon"></svg-icon>
            </div>
            <div class="app-details">
              <h3 class="app-name">Bili Music</h3>
              <p class="app-description">哔哩哔哩音乐桌面客户端</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">版本</span>
              <span class="info-value version-value">{{ version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Electron</span>
              <span class="info-value">{{ electronVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Vue</span>
              <span class="info-value">{{ vueVersion }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">作者</span>
              <span class="info-value">{{ author }}</span>
            </div>
          </div>

          <div class="links-section">
            <n-button text @click="openGitHub" class="github-btn">
              <template #icon>
                <svg-icon iconName="icon-gengduoxiao" color="#c9a55c"></svg-icon>
              </template>
              GitHub 仓库
            </n-button>
          </div>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="settings-section">
        <h2 class="section-title">系统信息</h2>
        <div class="info-card">
          <div class="info-item">
            <span class="info-label">操作系统</span>
            <span class="info-value">{{ osInfo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">架构</span>
            <span class="info-value">{{ arch }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">内存</span>
            <span class="info-value">{{ memory }}</span>
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const version = ref('1.0.0');
const electronVersion = ref('');
const vueVersion = ref('3.5');
const author = ref('zitont');
const osInfo = ref('');
const arch = ref('');
const memory = ref('');

function getSystemInfo() {
  version.value = '1.0.0';
  author.value = 'zitont';

  if (window.electronAPI) {
    window.electronAPI.getSystemInfo().then((info) => {
      if (info) {
        electronVersion.value = info.electronVersion || '';
        osInfo.value = info.os || '';
        arch.value = info.arch || '';
        memory.value = info.memory || '';
      }
    }).catch(() => {
      electronVersion.value = '29.x';
    });
  }

  vueVersion.value = '3.5';
}

function openGitHub() {
  window.open('https://github.com/zitont/bili-music-desktop', '_blank');
}

onMounted(() => {
  getSystemInfo();
});
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #08080a;
}

.settings-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-title {
  font-size: 28px;
  font-weight: 700;
  color: #e8e6e0;
  margin: 0;
  letter-spacing: -0.02em;
}

.settings-content {
  flex: 1;
  padding: 20px 24px;
}

.settings-section {
  margin-bottom: 32px;
  animation: sectionFadeIn 0.3s var(--ease-out) both;
}

.settings-section:nth-child(2) {
  animation-delay: 80ms;
}

@keyframes sectionFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-title {
  font-size: 10px;
  font-weight: 500;
  color: #8a8890;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.about-card {
  background: #16161c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-left: 3px solid #c9a55c;
  border-radius: 0 12px 12px 0;
  padding: 20px;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.app-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, rgba(201, 165, 92, 0.15), rgba(201, 165, 92, 0.05));
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-icon {
  font-size: 32px;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-name {
  font-size: 20px;
  font-weight: 600;
  color: #e8e6e0;
  margin: 0;
}

.app-description {
  font-size: 13px;
  color: #8a8890;
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.info-card {
  background: #16161c;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-size: 13px;
  color: #8a8890;
}

.info-value {
  font-size: 13px;
  color: #e8e6e0;
  font-weight: 500;
}

.version-value {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: #c9a55c;
  font-weight: 600;
}

.links-section {
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.github-btn {
  font-size: 13px;
  color: #c9a55c;
}

.github-btn:hover {
  color: #dbb978;
}
</style>
