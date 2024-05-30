<template>
  <div>
    <el-row :gutter="0" class="listbox">
      <el-col :span="100" class="log">
        <div class="grid-content ep-bg-purple">
          log
        </div>
      </el-col>
      <el-col :span="100" class="main">
        <div class="set">
          <el-popover placement="right" :width="200" trigger="hover">
            <p>收藏夹</p>
            <div class="collection" v-for="(item, index) in menuItems" :key="item.videolists_id"
              @click="listid(item.videolists_id)">
              <span>{{ item.videolist_name }}</span>
            </div>
            <template #reference>
              <el-button icon="Memo" text size="large" @click="mainbox"></el-button>
            </template>
          </el-popover>
        </div>
        <div class="set">
          <el-button icon="Plus" text size="large" @click="increase"></el-button>

        </div>
        <div class="set">
          <el-button icon="Plus" text size="large" @click="increase"></el-button>

        </div>
      </el-col>
      <el-col :span="100" class="froot">
        <div class="set">
          <el-button icon="Operation" size="large" text></el-button>
        </div>
      </el-col>
    </el-row>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router';
const menuItems = ref([]);
const router = useRouter();
function increase() {
  router.push('/increase');
}
function mainbox() {
  router.push('/');
}
onMounted(() => {
  window.electronAPI.VideoGetLists().then((lists) => {
    menuItems.value = lists; // 更新视频列表的响应式变量

  });
});
</script>

<style>
.log.el-col {
  height: 50px;
}

.main.el-col {
  height: 600px;
}

.froot.el-col {
  height: 53px;
}

.listbox.el-row {
  display: block;
}

.el-col {
  border-radius: 4px;
  background-color: rgba(82, 92, 92, 0.571);
}

.set .el-icon svg {
  height: 25px;
  width: 2em;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
  /* background-color: aqua; */
}
</style>