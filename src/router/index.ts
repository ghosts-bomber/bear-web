import type { App } from "vue";
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

export const Layout = () => import("@/layout/index.vue");

// 静态路由
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    meta: { hidden: true },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue"),
      },
    ],
  },
  {
    path: "/aipgc",
    redirect: "/aipgc/login",
    children: [
      {
        path: "login",
        name: "ptLogin",
        component: () => import("@/views/aipgc/index.vue"),
        meta: {
          title: "AIP/GC",
          icon: "el-icon-smoking",
        },
      },
      {
        path: "search",
        name: "AipSearch",
        component: () => import("@/views/aipgc/components/AipSearch.vue"),
        meta: {
          hidden: true,
        },
      },
      {
        path: "info/:code",
        name: "aipInfo",
        component: () => import("@/views/aipgc/components/AipInfo.vue"),
        props: true,
        meta: {
          hidden: true,
        },
      },
    ],
  },
  {
    path: "/recorder",
    redirect: "/recorder/open",
    children: [
      {
        path: "open",
        component: () => import("@/views/recorder/index.vue"),
        meta: {
          title: "Recorder",
          icon: "el-icon-edit",
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/log",
    redirect: "/log/open",
    children: [
      {
        path: "open",
        component: () => import("@/views/log/index.vue"),
        meta: {
          title: "Log",
          icon: "el-icon-document",
          keepAlive: true,
        },
      },
    ],
  },
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/home/index.vue"),
    meta: {
      title: "主页",
      hidden: true,
    },
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Layout,
    redirect: "/dashboard/index",
    children: [
      {
        path: "index",
        component: () => import("@/views/dashboard/index.vue"),
        meta: {
          title: "Dashboard",
          icon: "el-icon-platform-eleme",
        },
      },
      {
        path: "401",
        component: () => import("@/views/error/401.vue"),
        meta: { hidden: true },
      },
      {
        path: "404",
        component: () => import("@/views/error/404.vue"),
        meta: { hidden: true },
      },
    ],
  },
];

/**
 * 创建路由
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
  // 刷新时，滚动条位置还原
  scrollBehavior: () => ({ left: 0, top: 0 }),
});

// 全局注册 router
export function setupRouter(app: App<Element>) {
  app.use(router);
}

export default router;
