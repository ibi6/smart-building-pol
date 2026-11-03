import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      redirect: '/overview',
      children: [
        { path: 'overview', name: 'overview', meta: { title: '指挥总览' }, component: () => import('@/views/Overview.vue') },
        { path: 'topology', name: 'topology', meta: { title: '全光拓扑' }, component: () => import('@/views/Topology.vue') },
        { path: 'devices', name: 'devices', meta: { title: '设备资产' }, component: () => import('@/views/Devices.vue') },
        { path: 'density', name: 'density', meta: { title: '高密态势' }, component: () => import('@/views/Density.vue') },
        { path: 'business', name: 'business', meta: { title: '业务切片' }, component: () => import('@/views/Business.vue') },
        { path: 'alarms', name: 'alarms', meta: { title: '告警运维' }, component: () => import('@/views/Alarms.vue') },
        { path: 'planner', name: 'planner', meta: { title: '方案测算' }, component: () => import('@/views/Planner.vue') },
      ],
    },
  ],
})

export default router
