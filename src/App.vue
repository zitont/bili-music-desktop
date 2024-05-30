<template>
   <div class="common-layout"> 
      <el-header><WinHeader/></el-header>
      <el-container>
        <el-aside width="52px"><ListMenu/></el-aside>
        <el-container>
          <el-main class="win"> 
            <RouterView/>
            </el-main>
          <el-footer class="win"> <Playback/></el-footer>
        </el-container>
      </el-container>
  </div>
</template>
<script setup>
import WinHeader from '@/components/Windows/winheader.vue'
import MainBox from '@/components/MainBox/index.vue'
import ListBox from '@/components/ListBox/index.vue'
import Playback from '@/components/Playback/index.vue'
import ListMenu from '@/components/ListMenu/index.vue'
import { ref } from 'vue'
const input = ref('')
function setbvid() {
  if(input.value !== '' || input.value.length === 12) {
  console.log(input.value.length)
  window.electronAPI.VideoSetBvid(input.value)
  }
  }
  const list = ref(1);
  

</script>
<style>
.el-header {
 padding: 0px;
 /* height: 32px; */
}
.win.el-footer {
  height: 80px;
}

.el-main {
  /* height: 580px; */
  padding-right: 0px;
  padding-bottom: 0px;
}

</style>