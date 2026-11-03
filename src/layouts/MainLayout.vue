<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Monitor,
  Share,
  Cpu,
  DataAnalysis,
  Grid,
  Bell,
  SetUp,
} from '@element-plus/icons-vue'
import { building, overviewStats } from '@/mock/data'

const route = useRoute()
const router = useRouter()

const menus = [
  { path: '/overview', title: '总览大屏', icon: Monitor },
  { path: '/topology', title: '全光拓扑', icon: Share },
  { path: '/devices', title: '设备管理', icon: Cpu },
  { path: '/density', title: '高密度接入', icon: DataAnalysis },
  { path: '/business', title: '业务分区', icon: Grid },
  { path: '/alarms', title: '告警与运维', icon: Bell },
  { path: '/planner', title: '方案测算', icon: SetUp },
]

const active = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) || '智能楼宇全光网架')
const alarmPending = computed(() => overviewStats.alarmCritical + overviewStats.alarmMajor)

function go(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="layout">
    <aside class="sider pol-panel">
      <div class="brand">
        <div class="logo">POL</div>
        <div>
          <div class="brand-title">全光网管系统</div>
          <div class="pol-sub">智能楼宇 · 高密度接入</div>
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
      <div class="sider-foot pol-sub">
        <div>{{ building.name }}</div>
        <div>演示数据 · 毕设答辩版</div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar pol-panel">
        <div class="flow-line" style="top: 0" />
        <div>
          <h1 class="pol-title">{{ pageTitle }}</h1>
          <div class="pol-sub">面向高密度接入的智能楼宇全光网架 · {{ building.address }}</div>
        </div>
        <div class="top-meta">
          <div class="live-pill">
            <span class="live-dot" />
            链路监测中
          </div>
          <el-tag type="success" effect="dark" round>系统正常</el-tag>
          <el-badge :value="alarmPending" :hidden="alarmPending === 0">
            <el-button
              size="small"
              :class="{ 'alarm-blink': alarmPending > 0 }"
              @click="go('/alarms')"
            >未确认告警</el-button>
          </el-badge>
          <span class="pol-sub">Asia/Shanghai · UTC+8</span>
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
  grid-template-columns: 248px 1fr;
  gap: 14px;
  min-height: 100vh;
  padding: 14px;
}
.sider {
  display: flex;
  flex-direction: column;
  padding: 16px 12px;
  position: sticky;
  top: 14px;
  height: calc(100vh - 28px);
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 4px 8px 18px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.18);
  margin-bottom: 12px;
}
.logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 800;
  letter-spacing: 0.06em;
  background: linear-gradient(135deg, #3aa0ff, #19e6c2);
  color: #041018;
  box-shadow: 0 0 22px rgba(58, 160, 255, 0.45);
  animation: logo-pulse 3s ease-in-out infinite;
}
@keyframes logo-pulse {
  0%, 100% { box-shadow: 0 0 16px rgba(58, 160, 255, 0.35); }
  50% { box-shadow: 0 0 28px rgba(25, 230, 194, 0.55); }
}
.brand-title { font-weight: 700; font-size: 15px; }
.menu { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--pol-muted);
  border-radius: 10px;
  padding: 11px 12px;
  cursor: pointer;
  text-align: left;
  transition: 0.22s ease;
  overflow: hidden;
}
.menu-icon {
  display: grid;
  place-items: center;
  transition: transform 0.22s ease;
}
.menu-item:hover {
  color: var(--pol-text);
  background: rgba(58, 160, 255, 0.1);
  border-color: rgba(58, 160, 255, 0.25);
  transform: translateX(3px);
}
.menu-item:hover .menu-icon { transform: scale(1.08); }
.menu-item.active {
  color: var(--pol-text);
  border-color: rgba(58, 160, 255, 0.55);
  background: linear-gradient(90deg, rgba(58, 160, 255, 0.28), rgba(25, 230, 194, 0.1));
  box-shadow: inset 0 0 0 1px rgba(58, 160, 255, 0.18), 0 0 18px rgba(58, 160, 255, 0.15);
}
.active-bar {
  position: absolute;
  right: 0;
  top: 18%;
  bottom: 18%;
  width: 3px;
  border-radius: 3px 0 0 3px;
  background: linear-gradient(180deg, #3aa0ff, #19e6c2);
  box-shadow: 0 0 10px rgba(58, 160, 255, 0.8);
}
.sider-foot { padding: 12px 8px 4px; border-top: 1px solid rgba(64, 158, 255, 0.15); }
.main { min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
}
.top-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.live-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(44, 230, 164, 0.35);
  background: rgba(44, 230, 164, 0.08);
  font-size: 12px;
  color: #b8ffe0;
}
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pol-ok);
  box-shadow: 0 0 10px var(--pol-ok);
  animation: live-blink 1.2s ease-in-out infinite;
}
@keyframes live-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
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
