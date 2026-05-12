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
  padding: 6px 0;
}

.nav-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 10px;
}

.nav-section.bottom {
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid var(--b-border-light);
}

.playlist-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 10px;
}

.nav-divider {
  height: 1px;
  margin: 6px 16px;
  background: var(--b-border-light);
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
  gap: 2px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 18px;
  transition: all var(--duration-fast) var(--ease-in-out);
  position: relative;
}

.nav-item:hover {
  background: var(--b-hover);
}

.nav-item:hover .nav-icon {
  color: var(--text-primary);
}

.nav-item:active {
  transform: scale(0.93);
}

.nav-item.active {
  background: var(--b-hover);
}

.nav-item.active .nav-icon {
  color: var(--color-primary);
}

.nav-icon {
  color: var(--text-tertiary);
}

.nav-item.active .nav-icon {
  color: var(--color-primary);
}

.nav-item:hover .nav-icon {
  color: var(--text-primary);
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary);
  text-align: center;
  line-height: 1;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.nav-item:hover .nav-label {
  color: var(--text-primary);
}

.nav-item.active .nav-label {
  color: var(--color-primary);
}

.nav-indicator {
  width: 3px;
  height: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--color-primary);
}
</style>
