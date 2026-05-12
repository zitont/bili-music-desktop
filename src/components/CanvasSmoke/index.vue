<template>
  <div class="css-fog" aria-hidden="true">
    <div class="fog-layer fog-layer-1">
      <div class="fog-blob" style="--x: 10%; --y: 20%; --s: min(50vw, 500px); --c: var(--theme-bottom)">
      </div>
      <div class="fog-blob" style="--x: 55%; --y: 65%; --s: min(45vw, 450px); --c: var(--theme-dark)">
      </div>
      <div class="fog-blob" style="--x: 85%; --y: 25%; --s: min(40vw, 400px); --c: var(--theme-bottom)">
      </div>
    </div>
    <div class="fog-layer fog-layer-2">
      <div class="fog-blob" style="--x: 25%; --y: 15%; --s: min(55vw, 550px); --c: var(--theme-center)">
      </div>
      <div class="fog-blob" style="--x: 75%; --y: 70%; --s: min(40vw, 400px); --c: var(--theme-muted)">
      </div>
      <div class="fog-blob" style="--x: 40%; --y: 85%; --s: min(45vw, 450px); --c: var(--theme-center)">
      </div>
    </div>
    <div class="fog-layer fog-layer-3">
      <div class="fog-blob" style="--x: 65%; --y: 35%; --s: min(55vw, 550px); --c: var(--theme-accent)">
      </div>
      <div class="fog-blob" style="--x: 30%; --y: 50%; --s: min(40vw, 400px); --c: var(--theme-top)">
      </div>
      <div class="fog-blob" style="--x: 90%; --y: 60%; --s: min(45vw, 450px); --c: var(--theme-accent)">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
function updateThemeColors(_hexColors: string[]) {}
defineExpose({ updateThemeColors });
</script>

<style>
.css-fog {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.fog-layer {
  position: absolute;
  inset: 0;
}

.fog-blob {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--s);
  height: var(--s);
  margin-left: calc(var(--s) / -2);
  margin-top: calc(var(--s) / -2);
  border-radius: 50%;
  background: radial-gradient(circle, var(--c) 0%, transparent 60%);
  filter: blur(min(8vw, 80px));
  will-change: transform;
}

.fog-layer-1 .fog-blob {
  animation: fog-drift-1 25s ease-in-out infinite;
  opacity: 0.18;
}
.fog-layer-2 .fog-blob {
  animation: fog-drift-2 35s ease-in-out infinite;
  opacity: 0.12;
}
.fog-layer-3 .fog-blob {
  animation: fog-drift-3 30s ease-in-out infinite;
  opacity: 0.08;
}

.fog-layer-1 .fog-blob:nth-child(2) { animation-duration: 30s; animation-delay: -8s; }
.fog-layer-1 .fog-blob:nth-child(3) { animation-duration: 22s; animation-delay: -4s; }
.fog-layer-2 .fog-blob:nth-child(2) { animation-duration: 40s; animation-delay: -12s; }
.fog-layer-2 .fog-blob:nth-child(3) { animation-duration: 28s; animation-delay: -6s; }
.fog-layer-3 .fog-blob:nth-child(2) { animation-duration: 35s; animation-delay: -15s; }
.fog-layer-3 .fog-blob:nth-child(3) { animation-duration: 25s; animation-delay: -3s; }

@keyframes fog-drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(5%, -3%) scale(1.06); }
  50% { transform: translate(-3%, 2%) scale(0.96); }
  75% { transform: translate(2%, -4%) scale(1.02); }
}

@keyframes fog-drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(-4%, 2%) scale(0.95); }
  50% { transform: translate(6%, -2%) scale(1.05); }
  75% { transform: translate(-2%, 3%) scale(0.98); }
}

@keyframes fog-drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(3%, 4%) scale(1.04); }
  66% { transform: translate(-4%, -2%) scale(0.97); }
}
</style>
