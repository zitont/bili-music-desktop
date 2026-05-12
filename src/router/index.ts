import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/MainBox/index.vue'),
    },
    {
      path: '/increase',
      component: () => import('@/components/ListBox/index.vue'),
    },
    {
      path: '/playlist',
      component: () => import('@/components/Playlist/index.vue'),
    },
    {
      path: '/settings',
      component: () => import('@/components/Settings/index.vue'),
    },
    {
      path: '/about',
      component: () => import('@/components/About/index.vue'),
    },
    {
      path: '/:catchAll(.*)',
      component: () => import('@/components/MainBox/index.vue'),
    },
  ],
});

export default router;
