<template>
  <div class="menu-music">
    <div class="play-list">
      <n-menu :options="menuOptions" :value="activeKey" @update:value="handleMenuChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

interface MenuItem {
  videolists_id: number;
  videolist_name: string;
}

const router = useRouter();
const menuItems = ref<MenuItem[]>([]);
const activeKey = ref<number | null>(null);

// 转换为 Naive UI 菜单选项格式
const menuOptions = computed(() => {
  return menuItems.value.map((item) => ({
    label: item.videolist_name,
    key: item.videolists_id,
  }));
});

function handleMenuChange(key: number) {
  activeKey.value = key;
  router.push(`/music/${key}`);
}

onMounted(() => {
  window.electronAPI.VideoGetLists().then((lists: MenuItem[]) => {
    menuItems.value = lists;
    if (lists.length > 0) {
      activeKey.value = lists[0].videolists_id;
      handleMenuChange(lists[0].videolists_id);
    }
  });
});
</script>

<style scoped>
.menu-music {
  height: 100%;
}

.play-list {
  height: 100%;
}
</style>
