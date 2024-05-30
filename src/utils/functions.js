export function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00:00';
    if (seconds === 0) return '00:00:00'; // 处理 seconds 为 0 的情况
    const date = new Date(seconds * 1000);
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
  }