<template>
  <canvas ref="canvasRef" class="audio-bg-canvas"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAnimationStore } from '@/store';
import { onVisualData } from '@/utils/audio-player.js';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let animFrameId = 0;
let audioCleanup: (() => void) | null = null;
let frameCount = 0;

const animStore = useAnimationStore();

let themeR = 80, themeG = 60, themeB = 100;
let audioAvg = 0;
let audioPeak = 0;

// 节拍检测状态
let isBeat = false;
let beatEnergy = 0;
const audioHistory: number[] = [];
const BEAT_HISTORY_SIZE = 43;
const BEAT_COOLDOWN = 250;
const BEAT_THRESHOLD = 1.4;
let lastBeatTime = 0;

interface Ripple {
  x: number; y: number; radius: number; maxRadius: number;
  amplitude: number; speed: number; alpha: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number;
}

const ripples: Ripple[] = [];
const particles: Particle[] = [];
const spectrumHistory: number[][] = [];
const MAX_RIPPLES = 30;
const MAX_PARTICLES = 120;
const HISTORY_LEN = 60;
const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

for (let i = 0; i < 3; i++) {
  ripples.push({ x: 0, y: 0, radius: 0, maxRadius: 0, amplitude: 0.25, speed: 0, alpha: 0 });
}

let lastThemeReadTime = 0;
const THEME_READ_INTERVAL = 500;
let cachedThemeR = 80, cachedThemeG = 60, cachedThemeB = 100;

function readThemeColor(): void {
  const now = performance.now();
  if (now - lastThemeReadTime < THEME_READ_INTERVAL) {
    themeR = cachedThemeR;
    themeG = cachedThemeG;
    themeB = cachedThemeB;
    return;
  }
  lastThemeReadTime = now;
  const style = getComputedStyle(document.documentElement);
  const hex = style.getPropertyValue('--theme-dominant').trim();
  if (hex && hex.length >= 7) {
    themeR = parseInt(hex.slice(1, 3), 16) || 80;
    themeG = parseInt(hex.slice(3, 5), 16) || 60;
    themeB = parseInt(hex.slice(5, 7), 16) || 100;
    cachedThemeR = themeR;
    cachedThemeG = themeG;
    cachedThemeB = themeB;
  }
}

function resize(): void {
  if (!canvasRef.value) return;
  const dpr = window.devicePixelRatio || 1;
  canvasRef.value.width = window.innerWidth * dpr;
  canvasRef.value.height = window.innerHeight * dpr;
}

// ── 模式 0: 涟漪扩散 ──
function spawnRipple(amplitude: number): void {
  if (ripples.length >= MAX_RIPPLES || !canvasRef.value) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvasRef.value.width / dpr;
  const h = canvasRef.value.height / dpr;
  ripples.push({
    x: w * 0.1 + Math.random() * w * 0.8,
    y: h * 0.1 + Math.random() * h * 0.8,
    radius: 2,
    maxRadius: 80 + amplitude * 500,
    amplitude: Math.min(amplitude, 1),
    speed: 0.6 + amplitude * 1.5,
    alpha: 1,
  });
}

function drawRipple(c: CanvasRenderingContext2D, _w: number, _h: number): void {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rip = ripples[i];
    rip.radius += rip.speed;
    rip.alpha = Math.max(0, 1 - rip.radius / rip.maxRadius) * (0.7 + rip.amplitude * 0.3);
    if (rip.radius > rip.maxRadius || rip.alpha < 0.008) {
      ripples.splice(i, 1); continue;
    }
    const progress = rip.radius / rip.maxRadius;
    const lineW = Math.max(1, 5 * rip.amplitude * (1 - progress));
    const rings = [0.2, 0.4, 0.6, 0.78, 0.92, 1.0];
    for (let j = 0; j < rings.length; j++) {
      const rr = rip.radius * rings[j];
      const ra = rip.alpha * (j % 2 === 0 ? 0.8 : 0.35) * (1 - rings[j] * 0.3);
      if (ra < 0.01) continue;
      c.beginPath();
      c.arc(rip.x, rip.y, Math.max(rr, 2), 0, Math.PI * 2);
      c.strokeStyle = `rgba(${Math.min(themeR + 150, 255)},${Math.min(themeG + 130, 255)},${Math.min(themeB + 120, 255)},${ra})`;
      c.lineWidth = lineW * (1 - rings[j] * 0.25);
      c.stroke();
    }
    const glowR = rip.radius * 0.5;
    if (glowR > 4) {
      const grad = c.createRadialGradient(rip.x, rip.y, 0, rip.x, rip.y, glowR);
      const ga = rip.alpha * rip.amplitude * 0.5;
      grad.addColorStop(0, `rgba(${Math.min(themeR + 200, 255)},${Math.min(themeG + 180, 255)},${Math.min(themeB + 160, 255)},${ga})`);
      grad.addColorStop(0.4, `rgba(${Math.min(themeR + 120, 255)},${Math.min(themeG + 100, 255)},${Math.min(themeB + 80, 255)},${ga * 0.4})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = grad;
      c.beginPath(); c.arc(rip.x, rip.y, glowR, 0, Math.PI * 2); c.fill();
    }
  }
  if (isBeat) {
    const count = Math.min(Math.floor(beatEnergy * 2) + 1, 3);
    for (let i = 0; i < count; i++) {
      const t = setTimeout(() => spawnRipple(beatEnergy), i * 40);
      pendingTimeouts.push(t);
    }
    isBeat = false;
  }
}

// ── 模式 1: 波形律动 ──
function drawWaveform(c: CanvasRenderingContext2D, w: number, h: number): void {
  const barCount = 64;
  const barW = w / barCount;
  const ampScale = h * 0.3 * audioAvg;
  const peakScale = h * 0.4 * audioPeak;
  for (let i = 0; i < barCount; i++) {
    const phase = (i / barCount) * Math.PI * 4 + frameCount * 0.03;
    const barH = ampScale * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(phase))) + peakScale * Math.random() * 0.3;
    const x = i * barW;
    const y = h / 2;
    const r = Math.min(themeR + 100 + i * 0.5, 255);
    const g = Math.min(themeG + 80 + Math.sin(i * 0.3) * 40, 255);
    const b = Math.min(themeB + 60 + Math.cos(i * 0.2) * 30, 255);
    const alpha = 0.2 + 0.6 * audioAvg;
    c.fillStyle = `rgba(${r},${g},${b},${alpha})`;
    c.beginPath();
    c.roundRect(x, y - barH, Math.max(barW - 2, 1), barH * 2, [barW * 0.3, barW * 0.3]);
    c.fill();
  }
}

// ── 模式 2: 粒子浮游 ──
function spawnParticle(amp: number, w: number, h: number): void {
  if (particles.length >= MAX_PARTICLES) return;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.2 + amp * 1.5;
  particles.push({
    x: w / 2 + (Math.random() - 0.5) * w * 0.6,
    y: h / 2 + (Math.random() - 0.5) * h * 0.6,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 1.5 + amp * 4,
    alpha: 0.3 + amp * 0.7,
    life: 0,
    maxLife: 60 + amp * 120,
  });
}

function drawParticles(c: CanvasRenderingContext2D, w: number, h: number): void {
  if (audioPeak > 0.1) {
    const count = Math.min(Math.floor(audioPeak * 5), 8);
    for (let i = 0; i < count; i++) spawnParticle(audioPeak, w, h);
  }
  if (audioAvg > 0.03 && Math.random() < audioAvg * 3) spawnParticle(audioAvg, w, h);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx + (Math.random() - 0.5) * 0.3;
    p.y += p.vy + (Math.random() - 0.5) * 0.3;
    p.life++;
    p.alpha *= 0.99;
    if (p.life > p.maxLife || p.alpha < 0.01) {
      particles.splice(i, 1); continue;
    }
    c.beginPath();
    c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    const r = Math.min(themeR + 150, 255);
    const g = Math.min(themeG + 120, 255);
    const b = Math.min(themeB + 100, 255);
    c.fillStyle = `rgba(${r},${g},${b},${p.alpha * 0.6})`;
    c.fill();

    const glow = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
    glow.addColorStop(0, `rgba(${r},${g},${b},${p.alpha * 0.2})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2); c.fill();
  }
}

// ── 模式 3: 频谱瀑布 ──
function drawSpectrum(c: CanvasRenderingContext2D, w: number, h: number): void {
  const barCount = 80;
  if (frameCount % 2 === 0) {
    const row: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const phase = (i / barCount) * Math.PI * 6 + frameCount * 0.02;
      const val = audioAvg * (0.3 + 0.7 * Math.random()) + audioPeak * 0.2 * (0.5 + 0.5 * Math.sin(phase));
      row.push(Math.min(val, 1));
    }
    spectrumHistory.unshift(row);
    if (spectrumHistory.length > HISTORY_LEN) spectrumHistory.length = HISTORY_LEN;
  }

  const barW = w / barCount;
  const rowH = h / HISTORY_LEN;
  for (let row = 0; row < spectrumHistory.length; row++) {
    for (let col = 0; col < barCount; col++) {
      const val = spectrumHistory[row][col] || 0;
      const alpha = val * (1 - row / spectrumHistory.length) * 0.6;
      if (alpha < 0.01) continue;
      const r = Math.min(themeR + 150 + col * 0.3, 255);
      const g = Math.min(themeG + 100 + (1 - row / spectrumHistory.length) * 80, 255);
      const b = Math.min(themeB + 60 + (col / barCount) * 60, 255);
      c.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      c.fillRect(col * barW, row * rowH, Math.max(barW - 0.5, 0.5), rowH + 0.5);
    }
  }
}

// ── 模式 4: 放射光圈 ──
function drawCircular(c: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(w, h) * 0.35;
  const ringCount = 24;
  c.save();
  c.translate(cx, cy);
  for (let i = 0; i < ringCount; i++) {
    const angle = (i / ringCount) * Math.PI * 2 + frameCount * 0.005;
    const radius = maxR * (0.2 + 0.8 * (i / ringCount));
    const amp = audioAvg * (0.5 + 0.5 * Math.sin(angle * 2 + frameCount * 0.02)) + audioPeak * 0.2;
    const r = radius + amp * maxR * 0.3;
    const alpha = 0.08 + 0.12 * (1 - i / ringCount) * (0.3 + 0.7 * audioAvg);
    const colR = Math.min(themeR + 100 + i * 3, 255);
    const colG = Math.min(themeG + 80 + Math.sin(i * 0.5) * 40, 255);
    const colB = Math.min(themeB + 60 + Math.cos(i * 0.3) * 30, 255);
    c.beginPath();
    c.arc(0, 0, r, angle, angle + 0.4);
    c.strokeStyle = `rgba(${colR},${colG},${colB},${alpha})`;
    c.lineWidth = 1.5 + amp * 4;
    c.stroke();
  }
  c.restore();
}

// ── 模式 5: 极光流彩 ──
function drawAurora(c: CanvasRenderingContext2D, w: number, h: number): void {
  const layers = 5;
  const t = frameCount * 0.006;
  const ampScale = 0.3 + 0.7 * audioAvg;
  for (let layer = 0; layer < layers; layer++) {
    const yOff = (h / (layers + 1)) * (layer + 1);
    const alpha = 0.06 + 0.04 * (1 - layer / layers) * (0.5 + 0.5 * audioAvg);
    if (alpha < 0.01) continue;
    c.beginPath();
    c.moveTo(0, yOff);
    const step = 8;
    for (let x = 0; x <= w; x += step) {
      const nx = x / w * Math.PI * 8;
      const ny = Math.sin(nx + t + layer * 1.5) * 20 * ampScale
               + Math.sin(nx * 0.5 + t * 0.7 + layer) * 15
               + Math.sin(nx * 2 + t * 1.3 - layer) * 8 * audioPeak;
      c.lineTo(x, yOff + ny);
    }
    const gradient = c.createLinearGradient(0, 0, w, 0);
    const r = Math.min(themeR + 120 + layer * 15, 255);
    const g = Math.min(themeG + 100 + Math.sin(layer * 1.2 + t) * 50, 255);
    const b = Math.min(themeB + 80 + Math.cos(layer * 0.8 + t * 0.5) * 40, 255);
    gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
    gradient.addColorStop(0.3, `rgba(${r},${g},${b},${alpha})`);
    gradient.addColorStop(0.7, `rgba(${Math.min(r + 40, 255)},${Math.min(g - 20, 255)},${Math.min(b + 60, 255)},${alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    c.strokeStyle = gradient;
    c.lineWidth = 30 + 20 * (1 - layer / layers);
    c.lineCap = 'round';
    c.stroke();
  }
}

function drawAmbientWaves(c: CanvasRenderingContext2D, w: number, h: number): void {
  const step = 60;
  const rows = Math.floor(h / step);
  for (let row = 0; row <= rows; row++) {
    const y = row * step;
    const phase = (row / rows) * Math.PI * 2 + frameCount * 0.008;
    c.beginPath();
    c.moveTo(0, y + Math.sin(phase) * 6);
    for (let x = 0; x <= w; x += 4) {
      const nx = x / w * Math.PI * 4 + frameCount * 0.005;
      c.lineTo(x, y + Math.sin(nx + phase) * 4);
    }
    c.strokeStyle = `rgba(${themeR},${themeG},${themeB},${0.04 + 0.03 * Math.sin(frameCount * 0.01 + row * 0.5)})`;
    c.lineWidth = 1.5;
    c.stroke();
  }
}

function draw(): void {
  if (!ctx || !canvasRef.value) return;
  frameCount++;
  const dpr = window.devicePixelRatio || 1;
  const w = canvasRef.value.width / dpr;
  const h = canvasRef.value.height / dpr;

  readThemeColor();

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  if (!animStore.enabled) {
    ctx.restore();
    animFrameId = requestAnimationFrame(draw);
    return;
  }

  drawAmbientWaves(ctx, w, h);

  switch (animStore.mode) {
    case 0: drawRipple(ctx, w, h); break;
    case 1: drawWaveform(ctx, w, h); break;
    case 2: drawParticles(ctx, w, h); break;
    case 3: drawSpectrum(ctx, w, h); break;
    case 4: drawCircular(ctx, w, h); break;
    case 5: drawAurora(ctx, w, h); break;
  }

  ctx.restore();
  animFrameId = requestAnimationFrame(draw);
}

function onAudioData(data: { avg: number; peak: number }): void {
  audioAvg = data.avg;
  audioPeak = data.peak;

  audioHistory.push(data.avg);
  if (audioHistory.length > BEAT_HISTORY_SIZE) {
    audioHistory.shift();
  }

  const now = performance.now();
  if (audioHistory.length >= BEAT_HISTORY_SIZE && now - lastBeatTime > BEAT_COOLDOWN) {
    const avg = audioHistory.reduce((a, b) => a + b, 0) / BEAT_HISTORY_SIZE;
    if (data.peak > 0.08 && data.peak > avg * BEAT_THRESHOLD) {
      isBeat = true;
      beatEnergy = data.peak;
      lastBeatTime = now;
    }
  }
}

onMounted(() => {
  if (!canvasRef.value) return;
  ctx = canvasRef.value.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  animFrameId = requestAnimationFrame(draw);
  // 使用本地音频播放器的可视化数据（替代 IPC 轮询）
  audioCleanup = onVisualData(onAudioData);
});

onUnmounted(() => {
  cancelAnimationFrame(animFrameId);
  window.removeEventListener('resize', resize);
  if (audioCleanup) audioCleanup();
  ripples.length = 0;
  particles.length = 0;
  spectrumHistory.length = 0;
  audioHistory.length = 0;
  for (const t of pendingTimeouts) clearTimeout(t);
  pendingTimeouts.length = 0;
  ctx = null;
});
</script>

<style scoped>
.audio-bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}
</style>
