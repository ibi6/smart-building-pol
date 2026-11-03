<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Monitor, Share, Cpu, DataAnalysis, Grid, Bell, SetUp, MagicStick,
} from '@element-plus/icons-vue'
import { building, overviewStats } from '@/mock/data'

const route = useRoute()
const router = useRouter()
const motionOn = ref(true)
const nowText = ref('')

const menus = [
  { path: '/overview', title: '指挥总览', icon: Monitor },
  { path: '/topology', title: '全光拓扑', icon: Share },
  { path: '/devices', title: '设备资产', icon: Cpu },
  { path: '/density', title: '高密态势', icon: DataAnalysis },
  { path: '/business', title: '业务切片', icon: Grid },
  { path: '/alarms', title: '告警运维', icon: Bell },
  { path: '/planner', title: '方案测算', icon: SetUp },
]

const active = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) || '智能楼宇全光网架')
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
    const d = new Date()
    nowText.value = d.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
  }
  tick()
  window.setInterval(tick, 1000)
})
</script>

<template>
  <div class="layout">
    <aside class="sider pol-panel">
      <div class="brand">
        <div class="logo">
          <span>POL</span>
          <i class="ring" />
        </div>
        <div>
          <div class="brand-title">全光指挥中枢</div>
          <div class="pol-sub">Passive Optical LAN NMS</div>
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
          <span class="menu-icon"><el-icon :size="18"><component :is="m.icon" /></el-icon></span>
          <span>{{ m.title }}</span>
          <span v-if="active === m.path" class="active-bar" />
        </button>
      </nav>
      <div class="sider-foot">
        <div class="pol-sub">{{ building.name }}</div>
        <div class="pol-sub">{{ building.address }}</div>
        <el-button size="small" class="motion-btn" @click="toggleMotion">
          <el-icon><MagicStick /></el-icon>
          {{ motionOn ? '动效：开' : '动效：关' }}
        </el-button>
      </div>
    </aside>

    <div class="main">
      <header class="topbar pol-panel">
        <div class="flow-line" style="top: 0" />
        <div>
          <div class="eyebrow">SMART BUILDING · OPTICAL FABRIC</div>
          <h1 class="h-display">{{ pageTitle }}</h1>
          <div class="pol-sub">面向高密度接入的智能楼宇全光网架 · 答辩演示系统</div>
        </div>
        <div class="top-meta">
          <div class="live-pill"><span class="live-dot" />光链路实时监测</div>
          <el-tag type="success" effect="dark" round>系统健康</el-tag>
          <el-badge :value="alarmPending" :hidden="alarmPending === 0">
            <el-button size="small" :class="{ 'alarm-blink': alarmPending > 0 }" @click="go('/alarms')">
              待确认告警
            </el-button>
          </el-badge>
          <span class="clock">{{ nowText }} · UTC+8</span>
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
  grid-template-columns: 260px 1fr;
  gap: 16px;
  min-height: 100vh;
  padding: 16px;
}
.sider {
  display: flex;
  flex-direction: column;
  padding: 18px 14px;
  position: sticky;
  top: 16px;
  height: calc(100vh - 32px);
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 4px 8px 18px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.18);
  margin-bottom: 14px;
}
.logo {
  position: relative;
  width: 48px; height: 48px;
  border-radius: 14px;
  display: grid; place-items: center;
  font-weight: 900; letter-spacing: 0.04em;
  background: linear-gradient(135deg, #22d3ee, #818cf8 55%, #e879f9);
  color: #041018;
  box-shadow: 0 0 28px rgba(34, 211, 238, 0.45);
}
.logo .ring {
  position: absolute; inset: -4px;
  border-radius: 16px;
  border: 1px solid rgba(34, 211, 238, 0.45);
  animation: ring-spin 6s linear infinite;
}
@keyframes ring-spin {
  to { transform: rotate(360deg); }
}
.brand-title { font-weight: 800; font-size: 15px; letter-spacing: 0.04em; }
.menu { display: flex; flex-direction: column; gap: 7px; flex: 1; }
.menu-item {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--pol-muted);
  border-radius: 12px;
  padding: 12px 12px;
  cursor: pointer;
  text-align: left;
  transition: 0.22s ease;
}
.menu-icon { display: grid; place-items: center; transition: transform 0.22s ease; }
.menu-item:hover {
  color: var(--pol-text);
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.28);
  transform: translateX(4px);
}
.menu-item:hover .menu-icon { transform: scale(1.1) rotate(-4deg); }
.menu-item.active {
  color: #fff;
  border-color: rgba(34, 211, 238, 0.5);
  background: linear-gradient(90deg, rgba(34, 211, 238, 0.22), rgba(167, 139, 250, 0.14));
  box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.15), 0 0 20px rgba(34, 211, 238, 0.12);
}
.active-bar {
  position: absolute; right: 0; top: 18%; bottom: 18%; width: 3px;
  border-radius: 3px 0 0 3px;
  background: linear-gradient(180deg, #22d3ee, #e879f9);
  box-shadow: 0 0 12px rgba(34, 211, 238, 0.85);
}
.sider-foot {
  padding-top: 12px;
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  display: flex; flex-direction: column; gap: 6px;
}
.motion-btn { margin-top: 8px; width: 100%; }
.main { min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.topbar {
  display: flex; justify-content: space-between; align-items: center;
  gap: 16px; padding: 16px 20px;
}
.eyebrow {
  font-size: 11px; letter-spacing: 0.18em; color: #67e8f9; margin-bottom: 4px; font-weight: 700;
}
.top-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.live-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 12px; border-radius: 999px;
  border: 1px solid rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.08);
  font-size: 12px; color: #a7f3d0;
}
.live-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--pol-mint); box-shadow: 0 0 10px var(--pol-mint);
  animation: live-blink 1.2s ease-in-out infinite;
}
@keyframes live-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.clock {
  font-family: var(--font-mono); font-size: 12px; color: var(--pol-muted);
}
.content { min-height: 0; position: relative; }
.page-wrap { min-width: 0; }

@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; }
  .sider { position: relative; top: 0; height: auto; }
  .menu { flex-direction: row; flex-wrap: wrap; }
  .menu-item:hover { transform: none; }
}
</style>
