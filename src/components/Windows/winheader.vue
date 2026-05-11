<template>
  <div class="header">
    <div class="header-drag">
      <div class="app-title">
        <svg-icon iconName="icon-shoucangjia" color="#c9a55c" class="app-icon"></svg-icon>
        <span>Bili Music</span>
      </div>
    </div>
    <div class="window-controls">
      <button class="win-btn" @click="WindowMin">
        <svg-icon iconName="icon-2zuixiaohua-1" color="#8a8890"></svg-icon>
      </button>
      <button class="win-btn" @click="WindowMax">
        <svg-icon iconName="icon-3zuidahua-1" color="#8a8890"></svg-icon>
      </button>
      <button class="win-btn win-btn-close" @click="WindowClose">
        <svg-icon iconName="icon-4guanbi-1" color="#8a8890"></svg-icon>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
function WindowMin() {
  window.electronAPI.WindowMin();
}

function WindowMax() {
  window.electronAPI.WindowMax();
}

function WindowClose() {
  window.electronAPI.WindowClose();
}
</script>

<style scoped>
.header {
  display: flex;
  width: 100%;
  height: 32px;
  background: #101014;
  border-bottom: 1px solid rgba(201, 165, 92, 0.06);
}

.header-drag {
  flex-grow: 1;
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
  padding-left: 14px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #e8e6e0;
  user-select: none;
  letter-spacing: 0.02em;
}

.app-icon {
  font-size: 15px;
}

.window-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.win-btn {
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background-color var(--duration-fast) var(--ease-in-out);
}

.win-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

.win-btn:hover :deep(.svg-icon) {
  color: #e8e6e0;
}

.win-btn:active {
  background: rgba(255, 255, 255, 0.1);
}

.win-btn-close:hover {
  background: #e81123;
}

.win-btn-close:hover :deep(.svg-icon) {
  color: #fff;
}

.win-btn-close:active {
  background: #c50f1e;
}
</style>
