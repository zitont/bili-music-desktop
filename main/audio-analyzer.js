import { safeExecuteJavaScript } from './utils.js';

/**
 * 音频分析器
 */
class AudioAnalyzer {
  constructor() {
    this.pollInterval = null;
    this.mainWindow = null;
    this.biliWindow = null;
  }

  /**
   * 设置窗口引用
   * @param {BrowserWindow} mainWindow - 主窗口
   * @param {BrowserWindow} biliWindow - B站窗口
   */
  setWindows(mainWindow, biliWindow) {
    this.mainWindow = mainWindow;
    this.biliWindow = biliWindow;
  }

  /**
   * 开始音频数据轮询
   */
  startPolling() {
    this.stopPolling();

    this.pollInterval = setInterval(async () => {
      if (!this.biliWindow || this.biliWindow.isDestroyed()) {
        this.stopPolling();
        return;
      }

      try {
        const data = await safeExecuteJavaScript(this.biliWindow, `
          (() => {
            if (!window.__audioAnalyser || !window.__audioBuffer) return null;
            window.__audioAnalyser.getByteFrequencyData(window.__audioBuffer);
            const arr = Array.from(window.__audioBuffer);
            let sum = 0, peak = 0;
            for (let i = 0; i < arr.length; i++) {
              sum += arr[i];
              if (arr[i] > peak) peak = arr[i];
            }
            const avg = sum / arr.length;
            return { avg: avg / 255, peak: peak / 255 };
          })()
        `);

        if (data && this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('audio:data', data);
        }
      } catch {
        // 静默失败 — 音频分析暂不可用
      }
    }, 120);
  }

  /**
   * 停止音频数据轮询
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * 初始化音频分析器
   * @param {BrowserWindow} biliWindow - B站窗口
   */
  async initAudioAnalyser(biliWindow) {
    if (!biliWindow || biliWindow.isDestroyed()) return;

    const code = `
      (() => {
        try {
          if (!window.__audioAnalyser) {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const source = audioCtx.createMediaElementSource(player);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            audioCtx.resume();
            window.__audioAnalyser = analyser;
            window.__audioBuffer = new Uint8Array(analyser.frequencyBinCount);
          }
        } catch(e) { }
      })()
    `;

    await safeExecuteJavaScript(biliWindow, code).catch(() => {});
  }
}

export { AudioAnalyzer };
