import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/overview',
      children: [
        { path: 'overview', name: 'overview', meta: { title: '网络总览' }, component: () => import('@/views/Overview.vue') },
        { path: 'topology', name: 'topology', meta: { title: '网络拓扑' }, component: () => import('@/views/Topology.vue') },
        { path: 'devices', name: 'devices', meta: { title: '设备管理' }, component: () => import('@/views/Devices.vue') },
        { path: 'density', name: 'density', meta: { title: '接入性能' }, component: () => import('@/views/Density.vue') },
        { path: 'business', name: 'business', meta: { title: '业务划分' }, component: () => import('@/views/Business.vue') },
        { path: 'alarms', name: 'alarms', meta: { title: '告警管理' }, component: () => import('@/views/Alarms.vue') },
        { path: 'planner', name: 'planner', meta: { title: '组网规划' }, component: () => import('@/views/Planner.vue') },
      ],
    },
  ],
})

export default router
