/**
 * 设置视频BVID
 *
 * @param bvid 视频BVID
 * @returns 无返回值
 */
export function setVideoBvid(bvid) {
        window.electronAPI.VideoSetBvid(bvid);
}
/**
 * 获取视频列表的ID
 *
 * @param ID 视频列表的ID
 * @returns 返回一个Promise，解析后得到视频列表的ID
 */
export async function VideoGetListsID(ID) {
        return window.electronAPI.VideoGetListsID(ID).then((refd) => {
                // console.log(refd);
                return refd; // 返回处理后的结果或原始结果
            });
    }