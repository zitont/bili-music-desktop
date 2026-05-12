/**
 * 加载超时时间（毫秒）
 */
const WINDOW_LOAD_TIMEOUT = 30000;

/**
 * 安全地执行 JavaScript
 * @param {BrowserWindow} window - 目标窗口
 * @param {string} code - JavaScript 代码
 * @param {number} timeout - 超时时间
 * @returns {Promise<any>}
 */
function safeExecuteJavaScript(window, code, timeout = WINDOW_LOAD_TIMEOUT) {
  return new Promise((resolve, reject) => {
    if (!window || window.isDestroyed()) {
      reject(new Error('Window is not available'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error('Execute JavaScript timeout'));
    }, timeout);

    window.webContents.executeJavaScript(code)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * 验证 URL 是否安全
 * @param {string} url - URL 字符串
 * @returns {boolean} 是否安全
 */
function isSafeUrl(url) {
  if (typeof url !== 'string') return false;
  return url.startsWith('https://') || url.startsWith('http://');
}

/**
 * 格式化内存大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的字符串
 */
function formatMemorySize(bytes) {
  const gb = bytes / (1024 * 1024 * 1024);
  return `${Math.round(gb * 100) / 100} GB`;
}

export {
  WINDOW_LOAD_TIMEOUT,
  safeExecuteJavaScript,
  isSafeUrl,
  formatMemorySize,
};
