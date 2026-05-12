<template>
  <div class="list-menu">
    <div class="nav-section">
      <div class="nav-item" :class="{ active: currentRoute === '/' }" @click="mainbox">
        <div v-if="currentRoute === '/'" class="nav-indicator"></div>
        <svg-icon
          icon-name="icon-shoucangjia"
          class="nav-icon"
        ></svg-icon>
        <span class="nav-label">收藏</span>
      </div>
    </div>

    <div class="nav-divider"></div>

    <div class="playlist-section">
      <div class="nav-item" :class="{ active: currentRoute === '/increase' }" @click="increase">
        <div v-if="currentRoute === '/increase'" class="nav-indicator"></div>
        <svg-icon
          icon-name="icon-tianjia"
          class="nav-icon"
        ></svg-icon>
        <span class="nav-label">添加</span>
      </div>

      <div class="nav-item" :class="{ active: currentRoute === '/playlist' }" @click="playlist">
        <div v-if="currentRoute === '/playlist'" class="nav-indicator"></div>
        <svg-icon
          icon-name="icon-liebiao"
          class="nav-icon"
        ></svg-icon>
        <span class="nav-label">歌单</span>
      </div>
    </div>

    <div class="nav-spacer"></div>

    <div class="nav-section bottom">
      <div class="nav-item" :class="{ active: currentRoute === '/settings' }" @click="settings">
        <div v-if="currentRoute === '/settings'" class="nav-indicator"></div>
        <svg-icon
          icon-name="icon-1shezhi-1"
          class="nav-icon"
        ></svg-icon>
        <span class="nav-label">设置</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const currentRoute = computed(() => route.path);

function increase() {
  router.push('/increase');
}

function mainbox() {
  router.push('/');
}

function playlist() {
  router.push('/playlist');
}

function settings() {
  router.push('/settings');
}
</script>

<style scoped>
.list-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 0;
}

.nav-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
}

.nav-section.bottom {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--b-border-light);
}

.playlist-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
}

.nav-divider {
  height: 1px;
  margin: 8px 16px;
  background: linear-gradient(90deg, transparent, var(--b-border-light), transparent);
}

.nav-spacer {
  flex: 1;
}

.nav-item {
  width: 52px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 18px;
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--b-hover);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-in-out);
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item:hover .nav-icon {
  color: var(--text-primary);
  transform: scale(1.1);
}

.nav-item:active {
  transform: scale(0.92);
}

.nav-item:active::before {
  opacity: 0.8;
}

.nav-item.active {
  background: var(--gradient-primary-subtle);
  box-shadow: inset 0 0 0 1px var(--border-hover);
}

.nav-item.active .nav-icon {
  color: var(--color-primary);
  filter: drop-shadow(0 0 6px var(--color-primary-glow));
}

.nav-icon {
  color: var(--text-tertiary);
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  z-index: 1;
}

.nav-item:hover .nav-icon {
  color: var(--text-primary);
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-align: center;
  line-height: 1;
  transition: all var(--duration-normal) var(--ease-out);
  position: relative;
  z-index: 1;
  letter-spacing: 0.02em;
}

.nav-item:hover .nav-label {
  color: var(--text-primary);
}

.nav-item.active .nav-label {
  color: var(--color-primary);
  font-weight: 700;
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 16px;
  border-radius: 0 3px 3px 0;
  background: var(--gradient-primary);
  box-shadow: 0 0 8px var(--color-primary-glow);
  animation: indicatorSlideIn 0.3s var(--ease-out) both;
}

@keyframes indicatorSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50%) scaleY(0);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scaleY(1);
  }
}
</style>
