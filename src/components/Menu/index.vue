<template>
    <div class="menu-music">

        <!-- <el-divider border-style="double" /> -->
        <div class="play-list">
            <!-- <el-menu default-active="2" class="el-menu-vertical-demo" @open="handleOpen" @close="handleClose" ></el-menu> -->
            <el-menu default-active="2" class="el-menu-vertical-demo">
                <!-- <el-menu-item index="0">
                    <el-icon>
                        <setting />
                    </el-icon>
                    <span>默认歌单</span>
                </el-menu-item> -->
                <el-menu-item v-for="item in menuItems" :key="item.videolists_id" :index="String(item.videolists_id)" >
                    <el-icon :size="20">
                        <!-- <component :is="item.icon"></component> -->
                    </el-icon>
                    <span>{{ item.videolist_name }}</span>
                </el-menu-item>
            </el-menu>
        </div>
      
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Menu as Setting } from '@element-plus/icons-vue';
import router from '@/router';
const menuItems = ref([
    { index: 1, icon: 'setting', label: '歌单1' },
    { index: 2, icon: 'message', label: '歌单2' },
    { index: 3, icon: 'setting', label: '歌单3' }
]);
function cx(){
    router.push('/music/1');
}

onMounted(() => {
    cx();
  window.electronAPI.VideoGetLists().then((lists) => {
    menuItems.value = lists; // 更新视频列表的响应式变量
    // console.log(lists, '123');
  });
});
</script>
<style>

</style>