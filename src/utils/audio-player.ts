/**
 * 渲染进程音频播放器
 * 管理全局 <audio> 元素，通过模拟数据驱动可视化动画
 * 不使用 Web Audio API，避免 MediaElementAudioSourceNode 接管音频输出导致无声
 */

export interface AudioPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface AudioVisualData {
  avg: number;
  peak: number;
}

type StateChangeListener = (state: AudioPlayerState) => void;
type VisualDataListener = (data: AudioVisualData) => void;
type EndedListener = () => void;

let audio: HTMLAudioElement | null = null;
let visualFrameId = 0;

const stateListeners = new Set<StateChangeListener>();
const visualListeners = new Set<VisualDataListener>();
const endedListeners = new Set<EndedListener>();

let lastState: AudioPlayerState = {
  playing: false,
  currentTime: 0,
  duration: 0,
  volume: 0.6,
};

// 模拟可视化参数
let simPhase = 0;
let simBeat = 0;
let simLastTime = 0;

/**
 * 获取或创建全局 Audio 元素
 */
function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.volume = lastState.volume;
    audio.preload = 'auto';

    audio.addEventListener('timeupdate', notifyState);
    audio.addEventListener('loadedmetadata', notifyState);
    audio.addEventListener('play', () => {
      notifyState();
      startVisualLoop();
    });
    audio.addEventListener('pause', () => {
      notifyState();
      stopVisualLoop();
    });
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('volumechange', notifyState);
    audio.addEventListener('error', () => {
      console.error('[audio-player] 音频加载错误:', audio?.error);
    });
  }
  return audio;
}

/**
 * 模拟可视化数据生成
 * 基于时间的节拍模拟，产生有节奏感的动画效果
 */
function generateSimData(): AudioVisualData {
  const now = performance.now();
  const dt = simLastTime ? (now - simLastTime) / 1000 : 0.016;
  simLastTime = now;

  // 模拟 BPM ~120 的节拍
  simBeat += dt * 2;
  if (simBeat > 1) simBeat -= 1;

  // 相位漂移，产生变化
  simPhase += dt * 0.7;

  // 节拍脉冲 + 正弦波动 + 噪声
  const beatPulse = Math.pow(Math.max(0, 1 - simBeat * 4), 2);
  const wave = 0.3 + 0.2 * Math.sin(simPhase * 2.1) + 0.1 * Math.sin(simPhase * 5.3);
  const noise = Math.random() * 0.15;

  const avg = Math.min(1, wave + beatPulse * 0.5 + noise);
  const peak = Math.min(1, avg + beatPulse * 0.3 + Math.random() * 0.1);

  return { avg, peak };
}

/**
 * 可视化数据轮询循环
 */
function startVisualLoop(): void {
  if (visualFrameId) return;

  const poll = () => {
    if (!audio || audio.paused) {
      visualFrameId = 0;
      return;
    }

    const data = generateSimData();
    for (const listener of visualListeners) {
      listener(data);
    }

    visualFrameId = requestAnimationFrame(poll);
  };
  visualFrameId = requestAnimationFrame(poll);
}

function stopVisualLoop(): void {
  if (visualFrameId) {
    cancelAnimationFrame(visualFrameId);
    visualFrameId = 0;
  }
}

/**
 * 通知状态变化
 */
function notifyState(): void {
  if (!audio) return;
  const state: AudioPlayerState = {
    playing: !audio.paused,
    currentTime: audio.currentTime,
    duration: audio.duration || 0,
    volume: audio.volume,
  };
  lastState = state;
  for (const listener of stateListeners) {
    listener(state);
  }
}

/**
 * 处理播放结束
 */
function handleEnded(): void {
  stopVisualLoop();
  for (const listener of endedListeners) {
    listener();
  }
}

/**
 * 播放音频流
 * @param url - 音频流 URL
 * @param startTime - 起始时间（秒）
 */
export function play(url: string, startTime = 0): void {
  const el = getAudio();
  el.src = url;
  el.currentTime = startTime;
  el.play().catch(() => {
    // 自动播放被阻止，需要用户交互
  });
}

/**
 * 准备音频上下文（占位，保持 API 兼容）
 */
export function prepareAudioContext(): void {
  // 当前版本使用模拟可视化，无需 AudioContext
}

/**
 * 暂停播放
 */
export function pause(): void {
  audio?.pause();
}

/**
 * 恢复播放
 */
export function resume(): void {
  audio?.play().catch(() => {});
}

/**
 * 切换播放/暂停
 */
export function togglePlay(): void {
  if (!audio) return;
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

/**
 * 跳转到指定时间
 * @param time - 时间（秒）
 */
export function seekTo(time: number): void {
  if (audio) {
    audio.currentTime = time;
  }
}

/**
 * 设置音量
 * @param volume - 音量值（0-1）
 */
export function setVolume(volume: number): void {
  if (audio) {
    audio.volume = Math.max(0, Math.min(1, volume));
  }
}

/**
 * 获取当前播放时间
 */
export function getCurrentTime(): number {
  return audio?.currentTime ?? 0;
}

/**
 * 获取音频总时长
 */
export function getDuration(): number {
  return audio?.duration ?? 0;
}

/**
 * 获取当前播放状态
 */
export function getState(): AudioPlayerState {
  return { ...lastState };
}

/**
 * 是否正在播放
 */
export function isPlaying(): boolean {
  return audio ? !audio.paused : false;
}

/**
 * 订阅状态变化
 */
export function onStateChange(listener: StateChangeListener): () => void {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
}

/**
 * 订阅音频可视化数据
 */
export function onVisualData(listener: VisualDataListener): () => void {
  visualListeners.add(listener);
  return () => visualListeners.delete(listener);
}

/**
 * 订阅播放结束事件
 */
export function onEnded(listener: EndedListener): () => void {
  endedListeners.add(listener);
  return () => endedListeners.delete(listener);
}

/**
 * 销毁播放器，释放资源
 */
export function destroy(): void {
  stopVisualLoop();
  if (audio) {
    audio.pause();
    audio.src = '';
    audio.remove();
    audio = null;
  }
  stateListeners.clear();
  visualListeners.clear();
  endedListeners.clear();
}
