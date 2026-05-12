<template>
  <div class="about-page">
    <div class="about-header">
      <h1 class="about-title">关于</h1>
    </div>

    <n-scrollbar class="about-content">
      <div class="about-hero">
        <div class="app-icon-wrapper">
          <svg-icon icon-name="icon-music" class="app-icon"></svg-icon>
        </div>
        <h2 class="app-name">Bili Music</h2>
        <p class="app-description">哔哩哔哩音乐桌面客户端</p>
      </div>

      <div class="info-card">
        <div class="card-section">
          <h3 class="card-section-title">应用信息</h3>
          <div class="setting-row">
            <span class="setting-label">版本</span>
            <span class="setting-value version-value">{{ version }}</span>
          </div>
          <div class="setting-row-divider"></div>
          <div class="setting-row">
            <span class="setting-label">作者</span>
            <span class="setting-value">{{ author }}</span>
          </div>
          <div class="setting-row-divider"></div>
          <div class="setting-row">
            <span class="setting-label">许可协议</span>
            <span class="setting-value">MIT</span>
          </div>
        </div>

        <div class="card-divider"></div>

        <div class="card-section">
          <h3 class="card-section-title">项目链接</h3>
          <div class="setting-row link-row" @click="openGitHub">
            <div class="setting-info">
              <span class="setting-label">GitHub 仓库</span>
              <span class="setting-desc">查看源代码与提交记录</span>
            </div>
            <svg-icon icon-name="icon-arrow-right" class="link-arrow"></svg-icon>
          </div>
          <div class="setting-row-divider"></div>
          <div class="setting-row link-row" @click="openChangelog">
            <div class="setting-info">
              <span class="setting-label">更新日志</span>
              <span class="setting-desc">查看版本发布与变更历史</span>
            </div>
            <svg-icon icon-name="icon-arrow-right" class="link-arrow"></svg-icon>
          </div>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { NScrollbar } from 'naive-ui';
import { version as pkgVersion } from '../../../package.json';

const version = pkgVersion;
const author = 'zitont';

function openGitHub() {
  openLink('https://github.com/zitont/bili-music-desktop');
}

function openChangelog() {
  openLink('https://github.com/zitont/bili-music-desktop/releases');
}

function openLink(url: string) {
  if (window.electronAPI?.openExternal) {
    window.electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}
</script>

<style scoped>
.about-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--surface-0);
}

.about-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--b-border);
}

.about-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.about-content {
  flex: 1;
  padding: 16px 24px;
}

.about-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  animation: heroFadeIn 0.4s var(--ease-out) both;
}

@keyframes heroFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-icon-wrapper {
  width: 96px;
  height: 96px;
  background: var(--gradient-primary-subtle);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: transform var(--duration-normal) var(--ease-in-out),
    box-shadow var(--duration-normal) var(--ease-in-out);
  animation: iconPulse 0.5s var(--ease-out) 0.15s both;
}

@keyframes iconPulse {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.app-icon-wrapper::after {
  content: '';
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, var(--color-primary-glow) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-in-out);
  z-index: -1;
  border-radius: 50%;
}

.app-icon-wrapper:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-glow);
}

.app-icon-wrapper:hover::after {
  opacity: 1;
}

.app-icon {
  font-size: 48px;
  color: var(--color-primary);
}

.app-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.app-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.info-card {
  background: var(--surface-1);
  border: 1px solid var(--b-border);
  border-radius: 12px;
  overflow: hidden;
  animation: cardFadeIn 0.3s var(--ease-out) 0.1s both;
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
  background-color: var(--b-border-light);
}

.setting-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.setting-value {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.version-value {
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: var(--color-primary);
  font-weight: 600;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
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

.link-arrow {
  font-size: 18px;
  color: var(--text-tertiary);
  transition: color var(--duration-fast) var(--ease-in-out);
}

.link-row:hover .link-arrow {
  color: var(--text-primary);
}
</style>
