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
  font-family: var(--font-body-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  background: var(--surface-0, #08080a);
  color: var(--text-primary, #e8e6e0);
}

/* 全局噪点纹理 */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.015;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  mix-blend-mode: overlay;
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

/* 动态光晕效果 */
.app-bg-gradient::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 40%, var(--color-primary-glow) 0%, transparent 50%);
  animation: ambientGlow 20s ease-in-out infinite;
  opacity: 0.3;
}

@keyframes ambientGlow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(5%, -3%) scale(1.1); }
  50% { transform: translate(-3%, 5%) scale(0.95); }
  75% { transform: translate(3%, 2%) scale(1.05); }
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
  position: relative;
}

/* 侧边栏底部光晕 */
.app-sider::after {
  content: '';
  position: absolute;
  top: 0;
  right: -1px;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, var(--border-hover), transparent);
  opacity: 0.5;
}

/* 磨砂玻璃侧边栏反光动画 */
.app-sider::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    transparent 30%,
    rgba(255, 255, 255, 0.03) 45%,
    rgba(255, 255, 255, 0.06) 50%,
    rgba(255, 255, 255, 0.03) 55%,
    transparent 70%,
    transparent 100%
  );
  background-size: 200% 200%;
  opacity: 0;
  transition: opacity 0.6s ease;
}

html.glass .app-sider::before {
  opacity: 1;
  animation: siderShine 6s ease-in-out infinite;
}

@keyframes siderShine {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
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
  box-shadow: 0 -4px 24px var(--shadow-top);
  position: relative;
}

/* 底部控制栏顶部光晕 */
.app-footer::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 10%, var(--border-hover) 50%, transparent 90%);
}

/* 页面过渡动画 */
.fade-enter-active {
  transition:
    opacity 0.3s var(--ease-out),
    transform 0.3s var(--ease-out);
}
.fade-leave-active {
  transition:
    opacity 0.15s var(--ease-in-out),
    transform 0.15s var(--ease-in-out);
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.99);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.99);
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
  transition: opacity 0.3s var(--ease-out) !important;
  backdrop-filter: blur(4px);
}

.n-drawer {
  transition: transform 0.35s var(--ease-out) !important;
}

.n-modal-mask {
  transition: opacity 0.25s var(--ease-out) !important;
  backdrop-filter: blur(4px);
}

.n-modal {
  transition:
    transform 0.3s var(--ease-out),
    opacity 0.3s var(--ease-out) !important;
}

.n-card,
.n-button:not(.n-button--disabled) {
  transition: all var(--duration-normal) var(--ease-out);
}

/* 滚动条优化 */
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
  transition: background var(--duration-fast) var(--ease-in-out);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
::-webkit-scrollbar-corner {
  background: transparent;
}

/* 选中文本样式 */
::selection {
  background: var(--color-primary-glow);
  color: var(--text-primary);
}

/* ========== 磨砂主题：Naive UI 组件半透明覆盖 ========== */

/* 输入框 */
html.dark.glass .n-input .n-input-wrapper {
  background: rgba(28, 28, 36, 0.5) !important;
  backdrop-filter: blur(8px);
}

html.dark.glass .n-input:hover .n-input-wrapper {
  background: rgba(28, 28, 36, 0.6) !important;
}

html.dark.glass .n-input.n-input--focus .n-input-wrapper {
  background: rgba(28, 28, 36, 0.6) !important;
}

/* 下拉选择框 */
html.dark.glass .n-base-selection-tags,
html.dark.glass .n-base-selection-label {
  background: rgba(28, 28, 36, 0.5) !important;
  backdrop-filter: blur(8px);
}

html.dark.glass .n-base-selection:hover .n-base-selection-tags,
html.dark.glass .n-base-selection:hover .n-base-selection-label {
  background: rgba(28, 28, 36, 0.6) !important;
}

html.dark.glass .n-base-selection.n-base-selection--active .n-base-selection-tags,
html.dark.glass .n-base-selection.n-base-selection--active .n-base-selection-label {
  background: rgba(28, 28, 36, 0.6) !important;
}

/* 下拉菜单弹出面板 */
html.dark.glass .n-select-menu {
  background: rgba(22, 22, 28, 0.85) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
