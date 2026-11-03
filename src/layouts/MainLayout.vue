<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Monitor, Share, Cpu, DataAnalysis, Grid, Bell, SetUp, Switch,
} from '@element-plus/icons-vue'
import { building, overviewStats } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const motionOn = ref(true)
const nowText = ref('')

const menus = [
  { path: '/overview', title: '网络总览', icon: Monitor },
  { path: '/topology', title: '网络拓扑', icon: Share },
  { path: '/devices', title: '设备管理', icon: Cpu },
  { path: '/density', title: '接入性能', icon: DataAnalysis },
  { path: '/business', title: '业务划分', icon: Grid },
  { path: '/alarms', title: '告警管理', icon: Bell },
  { path: '/planner', title: '组网规划', icon: SetUp },
]

const active = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) || '全光局域网管理系统')
const alarmPending = computed(() => overviewStats.alarmCritical + overviewStats.alarmMajor)

function go(path: string) {
  router.push(path)
}

function toggleMotion() {
  motionOn.value = !motionOn.value
  document.documentElement.classList.toggle('reduce-motion', !motionOn.value)
  localStorage.setItem('pol-motion', motionOn.value ? '1' : '0')
}

onMounted(() => {
  const saved = localStorage.getItem('pol-motion')
  if (saved === '0') {
    motionOn.value = false
    document.documentElement.classList.add('reduce-motion')
  }
  const tick = () => {
    nowText.value = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
  }
  tick()
  window.setInterval(tick, 1000)
})
</script>

<template>
  <div class="layout">
    <aside class="sider pol-panel">
      <div class="brand">
        <div class="logo">POL</div>
        <div>
          <div class="brand-title">全光局域网管理系统</div>
          <div class="pol-sub">POL NMS · 毕设演示</div>
        </div>
      </div>
      <nav class="menu">
        <button
          v-for="m in menus"
          :key="m.path"
          class="menu-item"
          :class="{ active: active === m.path }"
          @click="go(m.path)"
        >
          <el-icon :size="18"><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
        </button>
      </nav>
      <div class="sider-foot">
        <div class="pol-sub">{{ building.name }}</div>
        <div class="pol-sub">{{ building.address }}</div>
        <el-button size="small" class="motion-btn" @click="toggleMotion">
          <el-icon><Switch /></el-icon>
          {{ motionOn ? '动效：开' : '动效：关' }}
        </el-button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar pol-panel">
        <div>
          <h1 class="pol-title" style="font-size: 18px">{{ pageTitle }}</h1>
          <div class="pol-sub">面向高密度接入的智能楼宇全光网架 · {{ building.name }}</div>
        </div>
        <div class="top-meta">
          <el-tag type="success" effect="plain" round>运行正常</el-tag>
          <el-badge :value="alarmPending" :hidden="alarmPending === 0">
            <el-button size="small" @click="go('/alarms')">未确认告警</el-button>
          </el-badge>
          <span class="clock">{{ nowText }}（UTC+8）</span>
        </div>
      </header>
      <main class="content">
        <router-view v-slot="{ Component, route: r }">
          <transition name="page-fade" mode="out-in">
            <div :key="r.path" class="page-wrap">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 12px;
  min-height: 100vh;
  padding: 12px;
}
.sider {
  display: flex;
  flex-direction: column;
  padding: 14px 10px;
  position: sticky;
  top: 12px;
  height: calc(100vh - 24px);
}
.brand {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 4px 8px 14px;
  border-bottom: 1px solid rgba(86, 120, 168, 0.25);
  margin-bottom: 10px;
}
.logo {
  width: 40px; height: 40px; border-radius: 8px;
  display: grid; place-items: center;
  font-weight: 800; font-size: 13px;
  background: #2563eb; color: #fff;
}
.brand-title { font-weight: 700; font-size: 13px; line-height: 1.35; }
.menu { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.menu-item {
  display: flex; align-items: center; gap: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--pol-muted);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
  transition: 0.15s ease;
}
.menu-item:hover {
  color: var(--pol-text);
  background: rgba(59, 130, 246, 0.08);
}
.menu-item.active {
  color: var(--pol-text);
  border-color: rgba(59, 130, 246, 0.4);
  background: rgba(37, 99, 235, 0.18);
}
.sider-foot {
  padding-top: 10px;
  border-top: 1px solid rgba(86, 120, 168, 0.25);
  display: flex; flex-direction: column; gap: 4px;
}
.motion-btn { margin-top: 8px; width: 100%; }
.main { min-width: 0; display: flex; flex-direction: column; gap: 12px; }
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; padding: 12px 16px;
}
.top-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.clock { font-family: var(--font-mono); font-size: 12px; color: var(--pol-muted); }
.content { min-height: 0; position: relative; }
.page-wrap { min-width: 0; }

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .sider { position: relative; top: 0; height: auto; }
  .menu { flex-direction: row; flex-wrap: wrap; }
}
</style>
