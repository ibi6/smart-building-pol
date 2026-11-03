<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import CountUp from '@/components/CountUp.vue'
import AlarmTicker from '@/components/AlarmTicker.vue'
import { bandwidthTrend, overviewStats, alarms, slices, densityZones, building } from '@/mock/data'

use([CanvasRenderer, LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const hero = computed(() => [
  { label: '设计接入容量', value: overviewStats.accessCapacity, tip: '全楼终端位' },
  { label: '已用接入', value: overviewStats.usedAccess, tip: '在服估算' },
  { label: '并发用户', value: overviewStats.concurrentUsers, tip: '实时峰值窗' },
  { label: '带宽利用率', value: overviewStats.bandwidthUtilPercent, tip: '%', suffix: '%' },
  { label: 'ONU 在线率', value: Math.round((overviewStats.onuOnline / overviewStats.onuTotal) * 100), tip: '含告警态', suffix: '%' },
])

const cards = computed(() => [
  { label: 'OLT 在线', a: overviewStats.oltOnline, b: overviewStats.oltTotal, tip: '双归属主备' },
  { label: 'ONU / 光 AP', a: overviewStats.onuOnline, b: overviewStats.onuTotal, tip: '末端在线' },
  { label: '紧急告警', a: overviewStats.alarmCritical, tip: '未确认优先', danger: true },
  { label: '重要告警', a: overviewStats.alarmMajor, tip: '待处置' },
  { label: '平均 Rx', a: overviewStats.avgRxPower, tip: 'dBm', decimals: 1, suffix: ' dBm' },
  { label: '楼层覆盖', a: building.floors, tip: '标准层 + 裙楼' },
])

const chartAnim = { animation: true, animationDuration: 1400, animationEasing: 'cubicOut' as const }

const trendOption = computed(() => ({
  ...chartAnim,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 36, bottom: 28 },
  xAxis: {
    type: 'category', data: bandwidthTrend.map((d) => d.hour),
    axisLabel: { color: '#7f93b5' }, axisLine: { lineStyle: { color: 'rgba(56,189,248,0.25)' } },
  },
  yAxis: {
    type: 'value', name: '%', max: 100, axisLabel: { color: '#7f93b5' },
    splitLine: { lineStyle: { color: 'rgba(56,189,248,0.1)' } },
  },
  series: [{
    name: '带宽利用率', type: 'line', smooth: true,
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(34,211,238,0.35)' },
          { offset: 1, color: 'rgba(167,139,250,0.02)' },
        ],
      },
    },
    lineStyle: { width: 3, color: '#22d3ee', shadowBlur: 16, shadowColor: 'rgba(34,211,238,0.7)' },
    itemStyle: { color: '#e879f9' },
    data: bandwidthTrend.map((d) => d.util),
  }],
}))

const alarmPie = computed(() => ({
  ...chartAnim,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#7f93b5' } },
  series: [{
    type: 'pie', radius: ['44%', '70%'],
    label: { color: '#eef5ff' }, animationType: 'scale',
    data: [
      { name: '紧急', value: alarms.filter((a) => a.severity === 'critical').length, itemStyle: { color: '#fb7185', shadowBlur: 16, shadowColor: '#fb7185' } },
      { name: '重要', value: alarms.filter((a) => a.severity === 'major').length, itemStyle: { color: '#fbbf24', shadowBlur: 12, shadowColor: '#fbbf24' } },
      { name: '次要', value: alarms.filter((a) => a.severity === 'minor').length, itemStyle: { color: '#38bdf8' } },
      { name: '提示', value: alarms.filter((a) => a.severity === 'info').length, itemStyle: { color: '#34d399' } },
    ],
  }],
}))

const floorBar = computed(() => ({
  ...chartAnim,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 12, top: 28, bottom: 28 },
  xAxis: { type: 'category', data: densityZones.map((z) => `${z.floor}F`), axisLabel: { color: '#7f93b5', interval: 1 } },
  yAxis: { type: 'value', axisLabel: { color: '#7f93b5' }, splitLine: { lineStyle: { color: 'rgba(56,189,248,0.1)' } } },
  series: [{
    name: '并发用户', type: 'bar', barWidth: 10,
    data: densityZones.map((z) => ({
      value: z.concurrentUsers,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: z.hotspot
          ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#fb7185' }, { offset: 1, color: '#9f1239' }] }
          : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#6366f1' }] },
        shadowBlur: z.hotspot ? 14 : 0,
        shadowColor: '#fb7185',
      },
    })),
  }],
}))

const recentAlarms = alarms.slice(0, 5)
</script>

<template>
  <div class="overview">
    <section class="hero pol-panel">
      <div class="flow-line" style="top: 0" />
      <div class="hero-top">
        <div>
          <div class="neon-badge">COMMAND CENTER</div>
          <h2 class="h-display" style="margin-top: 10px">全光网指挥中心</h2>
          <p class="pol-sub hero-desc">
            {{ building.name }} · 统一呈现接入容量、光链路健康、高密并发与切片态势，支撑答辩一屏讲清 POL 价值。
          </p>
        </div>
        <div class="pulse-ring" title="实时心跳">
          <span />
        </div>
      </div>
      <div class="hero-metrics stagger">
        <div v-for="h in hero" :key="h.label" class="hero-metric">
          <div class="pol-sub">{{ h.label }}</div>
          <div class="hero-val">
            <CountUp :value="h.value" :suffix="h.suffix || ''" />
          </div>
          <div class="pol-sub">{{ h.tip }}</div>
        </div>
      </div>
      <AlarmTicker class="ticker-wrap" />
    </section>

    <section class="cards stagger">
      <div v-for="c in cards" :key="c.label" class="card pol-panel" :class="{ danger: c.danger }">
        <div class="pol-sub">{{ c.label }}</div>
        <div class="card-value">
          <template v-if="c.b != null">
            <CountUp :value="c.a" /> <span class="slash">/</span> <CountUp :value="c.b" />
          </template>
          <template v-else>
            <CountUp :value="c.a" :decimals="c.decimals || 0" :suffix="c.suffix || ''" />
          </template>
        </div>
        <div class="pol-sub">{{ c.tip }}</div>
      </div>
    </section>

    <section class="mid stagger">
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">近 24 小时带宽脉搏</h3>
          <span class="pol-sub">核心上联 · 华丽入场曲线</span>
        </div>
        <v-chart class="chart" :option="trendOption" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">告警星云分布</h3>
          <span class="pol-sub">按严重级别</span>
        </div>
        <v-chart class="chart" :option="alarmPie" autoresize />
      </div>
    </section>

    <section class="bottom stagger">
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">楼层并发热柱</h3>
          <span class="pol-sub">玫红 = 热点楼层</span>
        </div>
        <v-chart class="chart" :option="floorBar" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="block-head"><h3 class="pol-title">切片带宽占用</h3></div>
        <div class="slice-list">
          <div v-for="s in slices" :key="s.name" class="slice-row">
            <div class="slice-name">{{ s.name }} <span class="pol-sub">VLAN {{ s.vlanId }}</span></div>
            <el-progress
              :percentage="Math.round((s.usedMbps / s.bandwidthMbps) * 100)"
              :stroke-width="12"
              :color="s.name === '安防' ? '#fb7185' : '#22d3ee'"
            />
            <div class="pol-sub">{{ s.usedMbps }} / {{ s.bandwidthMbps }} Mbps</div>
          </div>
        </div>
      </div>
      <div class="pol-panel block" :class="{ 'alarm-blink': overviewStats.alarmCritical > 0 }">
        <div class="block-head">
          <h3 class="pol-title">最新告警快讯</h3>
          <router-link class="link" to="/alarms">运维台 →</router-link>
        </div>
        <el-table :data="recentAlarms" size="small" height="260">
          <el-table-column prop="time" label="时间" width="150" />
          <el-table-column prop="title" label="标题" min-width="150" show-overflow-tooltip />
          <el-table-column prop="severity" label="级别" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.severity === 'critical' ? 'danger' : row.severity === 'major' ? 'warning' : 'info'">
                {{ row.severity }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 14px; }
.hero { padding: 18px 20px 16px; }
.hero-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.hero-desc { max-width: 720px; margin: 8px 0 0; line-height: 1.7; }
.pulse-ring {
  width: 64px; height: 64px; border-radius: 50%;
  border: 1px solid rgba(34, 211, 238, 0.35);
  display: grid; place-items: center; position: relative; flex-shrink: 0;
}
.pulse-ring span {
  width: 14px; height: 14px; border-radius: 50%;
  background: #22d3ee; box-shadow: 0 0 18px #22d3ee;
}
.pulse-ring::before, .pulse-ring::after {
  content: ""; position: absolute; inset: 8px; border-radius: 50%;
  border: 1px solid rgba(34, 211, 238, 0.45);
  animation: rip 2.2s ease-out infinite;
}
.pulse-ring::after { animation-delay: 0.7s; }
@keyframes rip {
  from { transform: scale(0.6); opacity: 0.9; }
  to { transform: scale(1.35); opacity: 0; }
}
.hero-metrics {
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px; margin: 18px 0 14px;
}
.hero-metric {
  padding: 12px 14px; border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.2);
  background: linear-gradient(160deg, rgba(34, 211, 238, 0.1), rgba(167, 139, 250, 0.06));
}
.hero-val {
  margin: 6px 0; font-size: 26px; font-weight: 800;
  background: linear-gradient(90deg, #fff, #67e8f9);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ticker-wrap { margin-top: 4px; }
.cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.card { padding: 14px 16px; }
.card.danger { border-color: rgba(251, 113, 133, 0.45); }
.card-value {
  margin: 8px 0 4px; font-size: 22px; font-weight: 750;
  background: linear-gradient(90deg, #eef5ff, #22d3ee 50%, #c4b5fd);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.slash { opacity: 0.5; margin: 0 2px; }
.mid, .bottom { display: grid; gap: 12px; }
.mid { grid-template-columns: 1.4fr 1fr; }
.bottom { grid-template-columns: 1.2fr 1fr 1.1fr; }
.block { padding: 14px 16px; }
.block-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.chart { height: 280px; width: 100%; }
.slice-list { display: flex; flex-direction: column; gap: 14px; padding-top: 8px; }
.slice-name { margin-bottom: 4px; font-weight: 650; }
.link { color: #67e8f9; font-size: 12px; }
@media (max-width: 1200px) {
  .hero-metrics, .cards { grid-template-columns: repeat(2, 1fr); }
  .mid, .bottom { grid-template-columns: 1fr; }
}
</style>
