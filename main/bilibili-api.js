import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://api.bilibili.com';
const REFERER = 'https://www.bilibili.com';

let sessdata = '';

/**
 * 获取 SESSDATA 存储路径
 */
function getSessdataPath() {
  return path.join(app.getPath('userData'), 'sessdata.txt');
}

/**
 * 从本地文件加载 SESSDATA
 */
function loadSessdata() {
  try {
    const filePath = getSessdataPath();
    console.log('[bilibili-api] 加载 SESSDATA 从:', filePath);
    if (fs.existsSync(filePath)) {
      sessdata = fs.readFileSync(filePath, 'utf-8').trim();
      console.log('[bilibili-api] SESSDATA 已加载:', sessdata ? `${sessdata.length} 字符` : '空');
    } else {
      console.log('[bilibili-api] SESSDATA 文件不存在');
    }
  } catch (e) {
    console.error('[bilibili-api] 加载 SESSDATA 失败:', e.message);
  }
  return sessdata;
}

/**
 * 保存 SESSDATA 到本地文件
 * @param {string} value - SESSDATA 值
 */
function saveSessdata(value) {
  sessdata = (value || '').trim();
  console.log('[bilibili-api] 保存 SESSDATA:', sessdata ? `已设置 (${sessdata.length} 字符)` : '已清除');
  try {
    fs.writeFileSync(getSessdataPath(), sessdata, 'utf-8');
    console.log('[bilibili-api] SESSDATA 已写入文件');
  } catch (error) {
    console.error('保存 SESSDATA 失败:', error.message);
  }
}

/**
 * 获取当前 SESSDATA 状态
 * @returns {{ hasSessdata: boolean }}
 */
function getSessdataStatus() {
  return { hasSessdata: sessdata.length > 0 };
}

/**
 * 通用 B 站 API 请求
 * @param {string} endpoint - API 路径（如 /x/web-interface/view）
 * @param {Record<string, string|number>} params - 查询参数
 * @param {boolean} requiresAuth - 是否需要 SESSDATA
 * @returns {Promise<any>} API 返回的 data 字段
 */
async function request(endpoint, params = {}, requiresAuth = false) {
  if (requiresAuth && !sessdata) {
    console.error('[bilibili-api] SESSDATA 未配置，需要认证的请求被拒绝');
    throw new Error('需要 SESSDATA 认证，请先在设置中配置');
  }

  const url = new URL(endpoint, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, String(value));
  }

  const headers = {
    'Referer': REFERER,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };

  if (sessdata) {
    headers['Cookie'] = `SESSDATA=${sessdata}`;
  }

  console.log('[bilibili-api] 请求:', url.toString(), '需要认证:', requiresAuth, 'SESSDATA:', sessdata ? `已设置 (${sessdata.length}字符)` : '未设置');

  const response = await fetch(url.toString(), { headers });
  console.log('[bilibili-api] 响应状态:', response.status);

  const body = await response.text();
  const json = JSON.parse(body);
  console.log('[bilibili-api] 响应 code:', json.code, 'message:', json.message);

  if (json.code !== 0) {
    throw new Error(`B 站 API 错误 (${json.code}): ${json.message || '未知错误'}`);
  }

  return json.data;
}

/**
 * 获取视频元数据
 * @param {string} bvid - 视频 BV 号
 * @returns {Promise<{bvid: string, title: string, cover: string, duration: number, upName: string, upMid: number, cid: number, pages: Array}>}
 */
async function getVideoInfo(bvid) {
  const data = await request('/x/web-interface/view', { bvid });
  return {
    bvid: data.bvid,
    title: data.title,
    cover: data.pic,
    duration: data.duration,
    upName: data.owner?.name || '',
    upMid: data.owner?.mid || 0,
    cid: data.cid,
    pages: (data.pages || []).map((p) => ({
      cid: p.cid,
      page: p.page,
      part: p.part,
      duration: p.duration,
    })),
  };
}

/**
 * 获取 DASH 音频流地址
 * @param {string} bvid - 视频 BV 号
 * @param {number} cid - 内容 ID
 * @returns {Promise<{audioUrl: string, duration: number, codec: string, bandwidth: number}>}
 */
async function getPlayUrl(bvid, cid) {
  // fnval=16 请求 DASH 格式（音视频分离）
  const data = await request('/x/player/playurl', {
    bvid,
    cid,
    fnval: 16,
    fnver: 0,
    qn: 64,
  }, true);

  const audioStreams = data.dash?.audio;
  if (!audioStreams || audioStreams.length === 0) {
    throw new Error('未获取到音频流，请检查 SESSDATA 是否有效');
  }

  // 选择最高码率的音频流
  const bestAudio = audioStreams.reduce((best, cur) =>
    cur.bandwidth > best.bandwidth ? cur : best
  );

  return {
    audioUrl: bestAudio.baseUrl || bestAudio.base_url,
    duration: data.dash.duration || 0,
    codec: bestAudio.codecs || '',
    bandwidth: bestAudio.bandwidth || 0,
  };
}

export {
  loadSessdata,
  saveSessdata,
  getSessdataStatus,
  getVideoInfo,
  getPlayUrl,
};
