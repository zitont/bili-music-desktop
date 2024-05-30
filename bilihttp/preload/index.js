/**
 * 格式化时间
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时间 hh:mm:ss
 */
function formatTime(seconds) {
    if (seconds < 0) {
        return '00:00:00'
    }
    return new Date(seconds * 1000).toISOString().substr(11, 8)
}

/**
 * 这是一个获取视频BV号的方法
 * @returns {string} bvid - b本站BV号
 */
function gtesummer() {
    const bvid = __INITIAL_STATE__.videoData.bvid // 获取bvid
    const videotitle = __INITIAL_STATE__.videoData.title // 获取视频标题
    const videopic = __INITIAL_STATE__.videoData.pic // 获取视频封面
    const upname = __INITIAL_STATE__.upData.name // 获取作者名字
    const uphomepage = __INITIAL_STATE__.upData.mid // 作者主页
    const summer=[];
    
    return bvid
}
function getVideoInfo() {
    const bvid = __INITIAL_STATE__.videoData.bvid; // 获取bvid
    const videotitle = __INITIAL_STATE__.videoData.title; // 获取视频标题
    const videopic = __INITIAL_STATE__.videoData.pic; // 获取视频封面
    const videoduration = ocument.getElementsByTagName('video')[0].duration // 获取视频时长
    const upname = __INITIAL_STATE__.upData.name; // 获取作者名字
    const uphomepage = 'https://space.bilibili.com/'+__INITIAL_STATE__.upData.mid; // 作者主页
    

    // 创建一个对象，包含所有视频信息
    const videoInfo = {
        bvid,
        videotitle,
        videopic,
        upname,
        uphomepage
    };

    return videoInfo; // 返回包含视频信息的对象
}

/**
 * 动态热更新切换视频
 * @param {string} bvid - b本站BV号
 */
function reload(bvid) {
    player.reload({ bvid: bvid })
}
/**
 * 获取视频时长
 * @returns {number} duration - 视频时长
 */
function getVideoDuration() {
    const videoDom = document.getElementsByTagName('video')[0]

    const duration = videoDom.duration
    return duration
}
/**
 * 
 * @returns {number} currentTime - 当前播放时间
 */
function getVideoCurrentTime() {
    const videoDom = document.getElementsByTagName('video')[0]
    const currentTime = videoDom.currentTime
    return currentTime
} n
/**
 * 播放
*/
function videoplay() {
    player.play()
}
/**
 * 暂停
*/
function videopause() {
    player.pause()
}
