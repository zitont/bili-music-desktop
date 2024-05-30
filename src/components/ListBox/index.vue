<template>
  <el-drawer v-model="drawer" title="添加视频" :with-header="false">
    <span>添加视频</span>
    <div class="demo-drawer__content">
      <el-form :model="form" label-width="auto">
      <el-form-item label="视频BVID">
        <el-input v-model="form.bvid" placeholder="请输入视频BVID"></el-input>
        <el-button type="primary" @click="SearchVideo">查询</el-button>
      </el-form-item>
        <el-form-item label="视频标题">
          <el-input v-model="form.title" placeholder="请输入视频标题"></el-input>
        </el-form-item>
        <el-form-item label="视频UP">
          <el-input v-model="form.upname" placeholder="请输入视频标题"></el-input>
        </el-form-item>
        <el-form-item label="UP主页">
          <el-link type="primary" :href="form.uphomepage" target="_blank">{{ form.uphomepage }}</el-link>
        </el-form-item>
        <el-form-item label="视频地址">
          <el-link type="primary" :href="form.videourl" target="_blank">{{ form.videourl }}</el-link>
        </el-form-item>
        <el-form-item label="视频封面">
          <el-image style="width: 180px; height: 100px" :src="form.imageurl" fill="fit" />
        </el-form-item>
        <el-form-item label="收藏夹">
          <el-select v-model="form.videolist_id" placeholder="请选择收藏夹" v-for="(item, index) in menuItems">
            <el-option :label="item.videolist_name" :value="item.videolists_id" />
            <!-- <el-option label="Area2" value="beijing" /> -->
          </el-select>
        </el-form-item>
        <el-form-item label="时间选择">
          <el-slider v-model="form.value" range :max="form.timemax"/>
        </el-form-item>
      </el-form>
      <div class="demo-drawer__footer">
        <el-button>取消</el-button>
        <el-button type="primary" @click="submit">
          提交
        </el-button>
      </div>
    </div>
  </el-drawer>
  <div class="common-layout">
    <el-container>
      <el-aside width="60px">
        <div class="button-sme">
          <el-button text>23</el-button>
          <el-button text>1</el-button>
          <el-button text>1</el-button>
          <el-button text>1</el-button>
        </div>
      </el-aside>
      <el-main class="mains">
        <el-card style="max-width: 480px" v-show="status">
          <template #header>
            <div class="card-header">
              <span>{{ videotitles }}</span>
            </div>
          </template>
          <img :src=videoimgurl style="width: 100%;height: 110px;" fit="scale-down" />
        </el-card>
        <div class="list">
          <div class="selectbox">
            <el-row>
              <el-col :span="20"> <el-input :v-model="100" style="width: 100%" placeholder="输入视频bvid"
                  clearable /></el-col>
              <el-col :span="2">
                <el-dropdown @command="handleCommand" trigger="click">
                  <el-button>+</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="a" @click="drawer = true">添加视频</el-dropdown-item>
                      <el-dropdown-item command="b">添加收藏夹d</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-col>
            </el-row>
          </div>
          <div class="collection" v-for="(item, index) in menuItems" :key="item.videolists_id"
            @click="listid(item.videolists_id)">
            <span>{{ item.videolist_name }}</span>
          </div>
        </div>

      </el-main>
    </el-container>
  </div>
</template>
<script setup>
import { ref, onMounted, watch, reactive } from "vue";
import { useMenusStore, usePlayStore, usePlayList } from "../../stroe/counter";
import { storeToRefs } from 'pinia';
const drawer = ref(false);
const play = usePlayStore();
const playList = usePlayList();
const { listser } = storeToRefs(playList);
const { duration, videotitle, videoimg_url, video_bvid, playback_status } = storeToRefs(play);
const store = useMenusStore();
const { menus } = storeToRefs(store);
const videoimgurl = ref('');
const videotitles = ref('视频列表');
const menuItems = ref([]);
const status = ref(playback_status.value);
// const value = ref([0, 60])
const form = reactive({
  bvid: '',
  title: '',
  videolist_id: '',
  imageurl: '',
  upname: '',
  timemax: 100,
  value: [0, 80],
  uphomepage: '',
  videourl:'',
});
function SearchVideo() {

  window.electronAPI.VideoGetinfo(form.bvid).then((data) => {
    form.title = data.videotitle;
    form.imageurl = data.videopic;
    form.timemax = data.videoduration;
    form.upname = data.upname;
    form.videourl = data.videourl;
    form.uphomepage = data.uphomepage;
    // 假设 value 是另一个响应式引用，用于存储视频时间范围
    form.value = [0, data.videoduration];
    console.log(data);
  });
}
function submit(){
 const videoInfoObject = {
  bvid: form.bvid,
  videotitle: form.title,
  videolist_id: form.videolist_id,
  videopic: form.imageurl,
  upname: form.upname,
  uphomepage: form.uphomepage,
  videoduration: form.timemax,
  videourl: form.videourl,
  videoend: form.value[1],
  videostart: form.value[0],
 }

console.log(videoInfoObject);
window.electronAPI.InsertVideoinfo(videoInfoObject).then((data) => {
  listser.value = true;
})

}
function listid(id) {
  store.menus = id;
}
const handleCommand = (command) => {
  if (command === 'a') { } else if (command === 'b') { }
}
watch(
  () => video_bvid.value,
  (newMenus, oldMenus) => {
    // 当 data 变化时，这里的回调会被触发
    videoimgurl.value = videoimg_url.value;
    videotitles.value = videotitle.value;
    status.value = playback_status.value
  },
);
onMounted(() => {
  window.electronAPI.VideoGetLists().then((lists) => {
    menuItems.value = lists; // 更新视频列表的响应式变量

  });
});

</script>
<style>
.mains .el-main {
  padding: 5px;
}

.collection {
  width: 100%;
  height: 20px;
  padding: 10px;
  /* background-color: bisque; */
  text-align: center;
  border-radius: 5px;
}

.collection:hover {
  /* background-color: bisque; */
  color: aqua;
}

.boxs {
  height: 50px;
  width: auto;
  background-color: bisque;

}

.button-sme {
  width: auto;
  height: 100%;
}
</style>