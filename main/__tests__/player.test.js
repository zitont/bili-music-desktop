import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('player', () => {
  let getVideoInfo, getAudioStreamUrl, cleanupCache;
  let getVideoInfoMock, getPlayUrlMock;

  beforeEach(async () => {
    vi.resetModules();

    getVideoInfoMock = vi.fn();
    getPlayUrlMock = vi.fn();

    vi.doMock('../bilibili-api.js', () => ({
      getVideoInfo: getVideoInfoMock,
      getPlayUrl: getPlayUrlMock,
    }));

    const mod = await import('../player.js');
    getVideoInfo = mod.getVideoInfo;
    getAudioStreamUrl = mod.getAudioStreamUrl;
    cleanupCache = mod.cleanupCache;
  });

  describe('getVideoInfo', () => {
    it('应该通过 API 获取视频元数据', async () => {
      getVideoInfoMock.mockResolvedValue({
        bvid: 'BV1xx411c7mD',
        title: '测试视频',
        cover: 'http://i0.hdslb.com/cover.jpg',
        duration: 300,
        upName: 'UP主',
        upMid: 12345,
        cid: 67890,
        pages: [{ cid: 67890, part: 'P1' }],
      });

      const result = await getVideoInfo('BV1xx411c7mD');

      expect(result.bvid).toBe('BV1xx411c7mD');
      expect(result.videotitle).toBe('测试视频');
      expect(result.videopic).toBe('https://i0.hdslb.com/cover.jpg');
      expect(result.videoduration).toBe(300);
      expect(result.upname).toBe('UP主');
      expect(result.cid).toBe(67890);
      expect(getVideoInfoMock).toHaveBeenCalledWith('BV1xx411c7mD');
    });

    it('应该将 http 封面地址转换为 https', async () => {
      getVideoInfoMock.mockResolvedValue({
        bvid: 'BV2xx411c7mD',
        title: '测试',
        cover: 'http://example.com/cover.jpg',
        duration: 100,
        upName: 'UP',
        upMid: 1,
        cid: 2,
      });

      const result = await getVideoInfo('BV2xx411c7mD');

      expect(result.videopic).toBe('https://example.com/cover.jpg');
    });

    it('应该处理空封面地址', async () => {
      getVideoInfoMock.mockResolvedValue({
        bvid: 'BV3xx411c7mD',
        title: '测试',
        cover: '',
        duration: 100,
        upName: 'UP',
        upMid: 1,
        cid: 2,
      });

      const result = await getVideoInfo('BV3xx411c7mD');

      expect(result.videopic).toBe('');
    });

    it('应该在 10 分钟内使用缓存', async () => {
      getVideoInfoMock.mockResolvedValue({
        bvid: 'BV4xx411c7mD',
        title: '测试',
        cover: '',
        duration: 100,
        upName: 'UP',
        upMid: 1,
        cid: 2,
      });

      await getVideoInfo('BV4xx411c7mD');
      await getVideoInfo('BV4xx411c7mD');

      expect(getVideoInfoMock).toHaveBeenCalledTimes(1);
    });

    it('应该在 API 调用失败时抛出错误', async () => {
      getVideoInfoMock.mockRejectedValue(new Error('网络错误'));

      await expect(getVideoInfo('BV5xx411c7mD')).rejects.toThrow('网络错误');
    });
  });

  describe('getAudioStreamUrl', () => {
    it('应该获取音频流地址', async () => {
      const mockAudioData = {
        audioUrl: 'https://bilivideo.com/audio.mp3',
        duration: 300,
        codec: 'mp4a.40.2',
        bandwidth: 128000,
      };
      getPlayUrlMock.mockResolvedValue(mockAudioData);

      const result = await getAudioStreamUrl('BV1xx411c7mD', 67890);

      expect(result).toEqual(mockAudioData);
      expect(getPlayUrlMock).toHaveBeenCalledWith('BV1xx411c7mD', 67890);
    });

    it('应该在缓存有效期内使用缓存', async () => {
      const mockAudioData = {
        audioUrl: 'https://bilivideo.com/audio.mp3',
        duration: 300,
        codec: 'mp4a.40.2',
        bandwidth: 128000,
      };
      getPlayUrlMock.mockResolvedValue(mockAudioData);

      await getAudioStreamUrl('BV1xx411c7mD', 67890);
      await getAudioStreamUrl('BV1xx411c7mD', 67890);

      expect(getPlayUrlMock).toHaveBeenCalledTimes(1);
    });

    it('应该在 API 调用失败时抛出错误', async () => {
      getPlayUrlMock.mockRejectedValue(new Error('获取音频流失败'));

      await expect(getAudioStreamUrl('BV1xx411c7mD', 67890)).rejects.toThrow('获取音频流失败');
    });
  });
});
