<template>
  <div class="list-menu">
    <div class="nav-section">
      <div
        class="nav-item"
        :class="{ active: currentRoute === '/' }"
        @click="mainbox"
      >
        <div class="nav-indicator" v-if="currentRoute === '/'"></div>
        <svg-icon iconName="icon-shoucangjia" :color="currentRoute === '/' ? '#c9a55c' : '#8a8890'"></svg-icon>
        <span class="nav-label">收藏</span>
      </div>
    </div>

    <div class="nav-divider"></div>

    <div class="playlist-section">
      <div
        class="nav-item"
        :class="{ active: currentRoute === '/increase' }"
        @click="increase"
      >
        <div class="nav-indicator" v-if="currentRoute === '/increase'"></div>
        <svg-icon iconName="icon-tianjia" :color="currentRoute === '/increase' ? '#c9a55c' : '#8a8890'"></svg-icon>
        <span class="nav-label">添加</span>
      </div>

      <div
        class="nav-item"
        :class="{ active: currentRoute === '/playlist' }"
        @click="playlist"
      >
        <div class="nav-indicator" v-if="currentRoute === '/playlist'"></div>
        <svg-icon iconName="icon-liebiao" :color="currentRoute === '/playlist' ? '#c9a55c' : '#8a8890'"></svg-icon>
        <span class="nav-label">歌单</span>
      </div>
    </div>

    <div class="nav-spacer"></div>

    <div class="nav-section bottom">
      <div
        class="nav-item"
        :class="{ active: currentRoute === '/settings' }"
        @click="settings"
      >
        <div class="nav-indicator" v-if="currentRoute === '/settings'"></div>
        <svg-icon iconName="icon-1shezhi-1" :color="currentRoute === '/settings' ? '#c9a55c' : '#8a8890'"></svg-icon>
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
  background: linear-gradient(180deg, #0e0e12 0%, #0a0a0e 100%);
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
  border-top: 1px solid rgba(255, 255, 255, 0.04);
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
  background: rgba(255, 255, 255, 0.04);
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
  background: rgba(201, 165, 92, 0.06);
}

.nav-item:hover :deep(.svg-icon) {
  color: #e8e6e0;
}

.nav-item:active {
  transform: scale(0.93);
}

.nav-item.active {
  background: rgba(201, 165, 92, 0.08);
}

.nav-item.active :deep(.svg-icon) {
  color: #c9a55c;
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #c9a55c;
  border-radius: 0 2px 2px 0;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  color: #4a4854;
  line-height: 1;
  transition: color var(--duration-fast) var(--ease-in-out);
}

.nav-item:hover .nav-label {
  color: #8a8890;
}

.nav-item.active .nav-label {
  color: #c9a55c;
}


</style>
