/** 视频条目接口 */
export interface VideoItem {
  video_bvid: string;
  video_title: string;
  video_img_url: string;
  video_duration: number;
  video_startTime?: number;
  video_endtime?: number;
  up_name: string;
  up_home?: string;
  created_at?: string;
}

/** 歌单条目接口 */
export interface PlaylistItem {
  videolists_id: number;
  videolist_name: string;
  video_count: number;
  description?: string;
  sort_order?: number;
  created_at?: string;
}

/** 歌单表单接口 */
export interface PlaylistForm {
  name: string;
  description: string;
}
