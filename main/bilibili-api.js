import { app, net } from 'electron';
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
    if (fs.existsSync(filePath)) {
      sessdata = fs.readFileSync(filePath, 'utf-8').trim();
    }
  } catch {
    // 加载失败，使用空值
  }
  return sessdata;
}

/**
 * 保存 SESSDATA 到本地文件
 * @param {string} value - SESSDATA 值
 */
function saveSessdata(value) {
  sessdata = (value || '').trim();
  try {
    fs.writeFileSync(getSessdataPath(), sessdata, 'utf-8');
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
function request(endpoint, params = {}, requiresAuth = false) {
  return new Promise((resolve, reject) => {
    if (requiresAuth && !sessdata) {
      reject(new Error('需要 SESSDATA 认证，请先在设置中配置'));
      return;
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

    const request = net.request({
      method: 'GET',
      url: url.toString(),
    });

    for (const [key, value] of Object.entries(headers)) {
      request.setHeader(key, value);
    }

    let body = '';
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString();
      });
      response.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.code !== 0) {
            reject(new Error(`B 站 API 错误 (${json.code}): ${json.message || '未知错误'}`));
            return;
          }
          resolve(json.data);
        } catch {
          reject(new Error('解析 API 响应失败'));
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`网络请求失败: ${error.message}`));
    });

    request.end();
  });
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
