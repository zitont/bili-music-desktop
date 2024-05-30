import { createRouter, createWebHistory } from "vue-router";
const router = createRouter({

  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",  
      component: () => import("@/components/MainBox/index.vue"),
    },
    {
      path: "/:catchAll(.*)",
      // redirect: "/",
      // component: () => import("../views/error/index.vue"),
      component: () => import("@/components/MainBox/index.vue"),
    },
    {
      path: "/increase",
      component:() =>import("@/components/ListBox/index.vue")
    }

  ],

});


export default router;
