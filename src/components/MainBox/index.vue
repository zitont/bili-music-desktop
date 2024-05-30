<template>
    <div class="common-layout">
        <el-container>
            <el-header>
                <el-row class="row-bg" justify="space-between">
                    <el-col :span="6"><el-text size="large">默认收藏夹</el-text></el-col>
                    <el-col :span="6"> <el-text size="small" type="info">创建日期/2024-4-04</el-text></el-col>
                </el-row>
            </el-header>
            <el-main class="main">
                <el-row>
                    <el-col :span="9">
                        <el-text size="small" type="info">标题/UP</el-text>
                    </el-col>
                    <el-col :span="6">
                        <el-text size="small" type="info">收藏夹</el-text>
                    </el-col>
                    <el-col :span="6">
                        <el-text size="small" type="info">时长</el-text>
                    </el-col>
                    <el-col :span="2">
                        <el-text size="small" type="info">操作</el-text>
                    </el-col>
                </el-row>
                <el-scrollbar height="530px">
                    <div class="list" v-for="(item, index) in items" :key="item.id">
                        <el-row>
                            <el-col :span="9" @click="handoffvideo(item, index)">
                                <el-row class="row-bg">
                                    <el-col :span="6">
                                        <el-image  style="width: 90px; height: 50px; display: block;" :src="item.video_img_url"
                                            fit="cover" />
                                    </el-col>
                                    <el-col :span="15" @click="handoffvideo(item)">
                                        <el-text size="large" truncated>{{ item.video_title }}</el-text>
                                        <el-text size="small" type="info">up:{{ item.up_name }}</el-text>
                                    </el-col>
                                </el-row>
                            </el-col>
                            <el-col :span="6" @click="handoffvideo(item)">
                                <el-text size="small" type="info">{{ item.playlist }}</el-text>
                            </el-col>
                            <el-col :span="6" @click="handoffvideo(item)">
                                <el-text size="small" type="info">{{ formatTime(item.video_duration) }}</el-text>
                            </el-col>
                            <el-col :span="2">
                                <el-button text><svg-icon iconName="icon-gengduoxiao"
                                        color="#ffffff"></svg-icon></el-button>
                            </el-col>
                        </el-row>
                    </div>
                </el-scrollbar>
            </el-main>
        </el-container>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { setVideoBvid, VideoGetListsID } from '../../utils/electronApi.js';
import { formatTime } from '../../utils/functions.js';
import { useMenusStore, usePlayStore, usePlayList, } from "../../stroe/counter";
import { storeToRefs } from 'pinia';
const store = useMenusStore();
const play = usePlayStore();
const playList = usePlayList();
const { menus } = storeToRefs(store);
const { duration, videotitle, videoimg_url, video_bvid, playback_status } = storeToRefs(play);
const { listser, lists, listnobor } = storeToRefs(playList);
const items = ref([]);

function handoffvideo(item, index) {
    setVideoBvid(item.video_bvid);
    window.electronAPI.VideoPlaySet(playback_status.value ? 1 : 0);
    playback_status.value = true;
    duration.value = item.video_duration;
    videotitle.value = item.video_title;
    videoimg_url.value = item.video_img_url;
    video_bvid.value = item.video_bvid;
    listnobor.value = index;
    // console.log(index);
}
VideoGetListsID(menus.value).then(listsIDs => {
    // 在这里处理获取到的视频列表IDs
    items.value = listsIDs;
    lists.value = listsIDs;
    // 你可以在这里继续处理listsIDs，比如更新UI或进行其他操作
}).catch(error => {
    // 在这里处理错误情况
    console.error('获取视频列表IDs时发生错误:', error);
    // 你可以在这里进行错误处理，比如显示错误消息给用户
});
watch(
    () => menus.value,
    (newMenus, oldMenus) => {
        // 当 data 变化时，这里的回调会被触发
        // items.value= VideoGetListsIDs(newMenus)
        VideoGetListsID(newMenus).then((refd) => {
            items.value = refd;
            console.log(items)
        })
    }


);
watch(
    () => listser.value,
    (newPlaylists, oldPlaylists) => {
        VideoGetListsID(menus.value).then((refd) => {
            items.value = refd;
            console.log(items)
            listser.value = false;
        })

    }
)
</script>

<style>
.main .el-main {
    padding-bottom: 0px;
}

.main.el-main {
    padding-right: 0px;
}

.el-header {
    height: 26px;
}

.list {
    padding: 5px;
    margin: 5px;
}
</style>
