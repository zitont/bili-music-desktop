<template>
  <div class="header">
    <div class="header-drag">
      <div class="app-title">
        <svg-icon icon-name="icon-shoucangjia" color="#c9a55c" class="app-icon"></svg-icon>
        <span>Bili Music</span>
      </div>
    </div>
    <div class="window-controls">
      <button class="win-btn" @click="WindowMin">
        <svg-icon icon-name="icon-2zuixiaohua-1" class="win-icon"></svg-icon>
      </button>
      <button class="win-btn" @click="WindowMax">
        <svg-icon icon-name="icon-3zuidahua-1" class="win-icon"></svg-icon>
      </button>
      <button class="win-btn win-btn-close" @click="WindowClose">
        <svg-icon icon-name="icon-4guanbi-1" class="win-icon"></svg-icon>
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
  background: var(--surface-1);
  border-bottom: 1px solid var(--b-border-light);
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
  color: var(--text-primary);
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

.win-icon {
  color: var(--text-primary);
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
  background: var(--b-hover-neutral);
}

.win-btn:hover .win-icon {
  color: var(--text-primary);
}

.win-btn:active {
  background: var(--surface-3);
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
