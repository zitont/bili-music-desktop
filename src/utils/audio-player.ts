/**
 * 渲染进程音频播放器
 * 管理全局 <audio> 元素，集成 Web Audio API 用于音频可视化
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
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaElementAudioSourceNode | null = null;
let dataArray: Uint8Array | null = null;
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

/**
 * 获取或创建全局 Audio 元素
 */
function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.volume = lastState.volume;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    audio.addEventListener('timeupdate', notifyState);
    audio.addEventListener('loadedmetadata', notifyState);
    audio.addEventListener('play', notifyState);
    audio.addEventListener('pause', notifyState);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('volumechange', notifyState);
  }
  return audio;
}

/**
 * 初始化 Web Audio API 分析器
 */
function ensureAnalyser(): void {
  if (analyser || !audio) return;

  try {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    startVisualLoop();
  } catch {
    // Web Audio 初始化失败，静默处理
  }
}

/**
 * 音频可视化数据轮询循环
 */
function startVisualLoop(): void {
  const poll = () => {
    if (!analyser || !dataArray) return;
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
      if (dataArray[i] > peak) peak = dataArray[i];
    }

    const data: AudioVisualData = {
      avg: sum / dataArray.length / 255,
      peak: peak / 255,
    };

    for (const listener of visualListeners) {
      listener(data);
    }

    visualFrameId = requestAnimationFrame(poll);
  };
  visualFrameId = requestAnimationFrame(poll);
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
  ensureAnalyser();
  // 恢复 AudioContext（浏览器自动播放策略要求用户交互后才能 resume）
  if (audioContext?.state === 'suspended') {
    audioContext.resume();
  }
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
  if (visualFrameId) {
    cancelAnimationFrame(visualFrameId);
    visualFrameId = 0;
  }
  if (source) {
    source.disconnect();
    source = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  analyser = null;
  dataArray = null;
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
