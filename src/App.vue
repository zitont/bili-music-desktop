<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app">
          <div class="app-header">
            <WinHeader/>
          </div>
          <div class="app-body">
            <div class="app-sider">
              <ListMenu/>
            </div>
            <div class="app-main-wrapper">
              <div class="app-main">
                <RouterView v-slot="{ Component }">
                  <transition name="fade" mode="out-in">
                    <component :is="Component" :key="$route.path" />
                  </transition>
                </RouterView>
              </div>
              <div class="app-footer">
                <Playback/>
              </div>
            </div>
          </div>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider } from 'naive-ui';
import { theme, themeOverrides } from './styles/naive-theme';
import WinHeader from '@/components/Windows/winheader.vue';
import Playback from '@/components/Playback/index.vue';
import ListMenu from '@/components/ListMenu/index.vue';
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'SF Pro Display', -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  background: #08080a;
  color: #e8e6e0;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #08080a;
}

.app-header {
  height: 32px;
  flex-shrink: 0;
}

.app-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.app-sider {
  width: 72px;
  flex-shrink: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.app-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-main {
  flex: 1;
  overflow: hidden;
}

.app-footer {
  height: 80px;
  flex-shrink: 0;
  border-top: 1px solid rgba(201, 165, 92, 0.06);
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.3);
}

/* 页面过渡动画 */
.fade-enter-active {
  transition: opacity 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.fade-leave-active {
  transition: opacity 0.12s var(--ease-in-out), transform 0.12s var(--ease-in-out);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 全局焦点环：金色描边 */
*:focus-visible {
  outline: 2px solid rgba(201, 165, 92, 0.5);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid rgba(201, 165, 92, 0.5);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(201, 165, 92, 0.1);
}

/* 全局按钮按压反馈 */
button:active:not(:disabled) {
  transform: scale(0.97);
}

/* 抽屉过渡动画优化 */
.n-drawer-mask {
  transition: opacity 0.25s var(--ease-out) !important;
}

.n-drawer {
  transition: transform 0.3s var(--ease-out) !important;
}

/* 模态框过渡动画 */
.n-modal-mask {
  transition: opacity 0.2s var(--ease-out) !important;
}

.n-modal {
  transition: transform 0.25s var(--ease-out), opacity 0.25s var(--ease-out) !important;
}

/* 通用交互元素悬停提升 */
.n-card,
.n-button:not(.n-button--disabled) {
  transition: all var(--duration-fast) var(--ease-in-out);
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
