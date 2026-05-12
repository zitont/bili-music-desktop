<template>
  <n-config-provider :theme="themeConfig.theme" :theme-overrides="themeConfig.overrides">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app">
          <div class="app-bg-gradient"></div>
          <CanvasSmoke ref="smokeRef" />
          <AudioBgRipple />
          <div class="app-header">
            <WinHeader />
          </div>
          <div class="app-body">
            <div class="app-sider">
              <ListMenu />
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
                <Playback />
              </div>
            </div>
          </div>
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { NConfigProvider } from 'naive-ui';
import { getTheme } from './styles/naive-theme';
import WinHeader from '@/components/Windows/winheader.vue';
import Playback from '@/components/Playback/index.vue';
import ListMenu from '@/components/ListMenu/index.vue';
import { usePlayStore, useThemeStore } from './store';
import { extractColorsFromImage } from './utils/color-thief';
import CanvasSmoke from './components/CanvasSmoke/index.vue';
import AudioBgRipple from './components/AudioBgRipple/index.vue';

const play = usePlayStore();
const themeStore = useThemeStore();

const themeConfig = computed(() => getTheme(themeStore.isDark));
const smokeRef = ref<InstanceType<typeof CanvasSmoke> | null>(null);

function applyColors(colors: ReturnType<typeof extractColorsFromImage>) {
  const doc = document.documentElement
  play.themeDominant = colors.dominant
  play.themeMuted = colors.muted
  play.themeDark = colors.dark
  doc.style.setProperty('--theme-dominant', colors.dominant)
  doc.style.setProperty('--theme-muted', colors.muted)
  doc.style.setProperty('--theme-dark', colors.dark)
  doc.style.setProperty('--theme-top', colors.top)
  doc.style.setProperty('--theme-center', colors.center)
  doc.style.setProperty('--theme-bottom', colors.bottom)
  doc.style.setProperty('--theme-accent', colors.accent)
  smokeRef.value?.updateThemeColors([colors.top, colors.accent, colors.center, colors.bottom])
}

function resetColors() {
  applyColors({
    dominant: '#1a1025', muted: '#1c1128', dark: '#0a0812',
    top: '#1a1025', center: '#1c1128', bottom: '#0a0812',
    accent: '#2a1a35', isDark: true,
  })
}

watch(
  () => play.videoimg_url,
  (url, oldUrl) => {
    if (url === oldUrl) return
    if (!url) { resetColors(); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => applyColors(extractColorsFromImage(img))
    img.onerror = () => resetColors()
    img.src = url
  }
)

onMounted(() => {
  themeStore.applyTheme()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    'Inter',
    'SF Pro Display',
    -apple-system,
    'Segoe UI',
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  background: var(--surface-0, #08080a);
  color: var(--text-primary, #e8e6e0);
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.app-bg-gradient {
  position: absolute;
  inset: 0;
  background-color: var(--theme-dark);
  background-image:
    radial-gradient(ellipse at 20% 50%, var(--theme-top) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, var(--theme-accent) 0%, transparent 40%),
    radial-gradient(ellipse at 50% 80%, var(--theme-bottom) 0%, transparent 50%),
    linear-gradient(180deg, var(--theme-top) 0%, var(--theme-center) 50%, var(--theme-bottom) 100%);
  z-index: 0;
  pointer-events: none;
}

.app-header,
.app-body {
  position: relative;
  z-index: 2;
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
  background: var(--sider-bg);
  backdrop-filter: blur(var(--sider-blur));
  -webkit-backdrop-filter: blur(var(--sider-blur));
  border-right: 1px solid var(--b-border, rgba(255, 255, 255, 0.06));
}

.app-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--content-bg);
  backdrop-filter: blur(var(--content-blur));
  -webkit-backdrop-filter: blur(var(--content-blur));
}

.app-main {
  flex: 1;
  overflow: hidden;
}

.app-footer {
  height: 80px;
  flex-shrink: 0;
  background: var(--footer-bg);
  backdrop-filter: blur(var(--footer-blur));
  -webkit-backdrop-filter: blur(var(--footer-blur));
  border-top: 1px solid var(--b-border-light, rgba(201, 165, 92, 0.06));
  box-shadow: 0 -4px 16px var(--shadow-top);
}

/* 页面过渡动画 */
.fade-enter-active {
  transition:
    opacity 0.2s var(--ease-out),
    transform 0.2s var(--ease-out);
}
.fade-leave-active {
  transition:
    opacity 0.12s var(--ease-in-out),
    transform 0.12s var(--ease-in-out);
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
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}

button:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--focus-ring-bg);
}

button:active:not(:disabled) {
  transform: scale(0.97);
}

.n-drawer-mask {
  transition: opacity 0.25s var(--ease-out) !important;
}

.n-drawer {
  transition: transform 0.3s var(--ease-out) !important;
}

.n-modal-mask {
  transition: opacity 0.2s var(--ease-out) !important;
}

.n-modal {
  transition:
    transform 0.25s var(--ease-out),
    opacity 0.25s var(--ease-out) !important;
}

.n-card,
.n-button:not(.n-button--disabled) {
  transition: all var(--duration-fast) var(--ease-in-out);
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
</style>
