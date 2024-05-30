<template>
     <div class="header">
          <div class="header-drag">  
        </div>
        <el-button-group>
          <el-button text @click="WindowMin"> <svg-icon iconName="icon-2zuixiaohua-1" color="#ffffff"></svg-icon></el-button>
            <!-- <el-button text  @click="WindowMax"> <svg-icon iconName="icon-3zuidahua-1" color="#ffffff"></svg-icon></el-button> -->
            <el-button text  @click="WindowClose"> <svg-icon iconName="icon-4guanbi-1" color="#ffffff"></svg-icon></el-button>
          </el-button-group>
        </div>
</template>
<script setup>
function WindowMin() {
  window.windowsApi.WindowMin()
}
function WindowMax() {
  window.windowsApi.WindowMax()
}
function WindowClose() {
  window.windowsApi.WindowClose()
}
</script>
<style>
.header {
  display: flex;
  width: 100%; /* 或其他您希望的宽度 */
}

.header-drag {
  flex-grow: 1; /* 允许该元素填充剩余空间 */
  -webkit-app-region: drag;
}
</style>