import * as bilibiliApi from './bilibili-api.js';

// 缓存：bvid -> { info, timestamp }
const infoCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

// 缓存：`${bvid}:${cid}` -> { url, expiry }
const playUrlCache = new Map();

/**
 * 获取视频元数据（通过 API）
 * @param {string} bvid - 视频 BV 号
 * @returns {Promise<{bvid: string, videotitle: string, videopic: string, videoduration: number, upname: string, uphomepage: string, cid: number}>}
 */
async function getVideoInfo(bvid) {
  const cached = infoCache.get(bvid);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.info;
  }

  const data = await bilibiliApi.getVideoInfo(bvid);

  const info = {
    bvid: data.bvid,
    videourl: `https://www.bilibili.com/video/${data.bvid}`,
    videotitle: data.title || '',
    videopic: (data.cover || '').replace('http://', 'https://'),
    videoduration: data.duration || 0,
    upname: data.upName || '',
    uphomepage: data.upMid ? `https://space.bilibili.com/${data.upMid}` : '',
    cid: data.cid,
    pages: data.pages || [],
  };

  infoCache.set(bvid, { info, timestamp: Date.now() });
  return info;
}

/**
 * 获取音频流地址
 * @param {string} bvid - 视频 BV 号
 * @param {number} cid - 内容 ID
 * @returns {Promise<{audioUrl: string, duration: number, codec: string, bandwidth: number}>}
 */
async function getAudioStreamUrl(bvid, cid) {
  const cacheKey = `${bvid}:${cid}`;
  const cached = playUrlCache.get(cacheKey);
  // 音频流 URL 有效期约 120 分钟，提前 5 分钟过期
  if (cached && cached.expiry > Date.now() + 5 * 60 * 1000) {
    return cached.data;
  }

  const data = await bilibiliApi.getPlayUrl(bvid, cid);

  // 缓存，expiry 设为 115 分钟后
  playUrlCache.set(cacheKey, {
    data,
    expiry: Date.now() + 115 * 60 * 1000,
  });

  return data;
}

/**
 * 清除过期缓存
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of infoCache) {
    if (now - value.timestamp > CACHE_TTL) infoCache.delete(key);
  }
  for (const [key, value] of playUrlCache) {
    if (value.expiry < now) playUrlCache.delete(key);
  }
}

// 每 10 分钟清理一次过期缓存
setInterval(cleanupCache, 10 * 60 * 1000);

export {
  getVideoInfo,
  getAudioStreamUrl,
  cleanupCache,
};
