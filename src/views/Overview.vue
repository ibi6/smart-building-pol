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
  { label: '设计接入容量', value: overviewStats.accessCapacity, tip: '终端位' },
  { label: '已用接入', value: overviewStats.usedAccess, tip: '估算在服' },
  { label: '并发用户', value: overviewStats.concurrentUsers, tip: '当前峰值窗' },
  { label: '带宽利用率', value: overviewStats.bandwidthUtilPercent, tip: '核心上联', suffix: '%' },
  { label: 'ONU 在线率', value: Math.round((overviewStats.onuOnline / overviewStats.onuTotal) * 100), tip: '含告警态', suffix: '%' },
])

const cards = computed(() => [
  { label: 'OLT 在线', a: overviewStats.oltOnline, b: overviewStats.oltTotal, tip: '双归属主备' },
  { label: 'ONU / 光 AP', a: overviewStats.onuOnline, b: overviewStats.onuTotal, tip: '末端在线' },
  { label: '紧急告警', a: overviewStats.alarmCritical, tip: '未确认', danger: true },
  { label: '重要告警', a: overviewStats.alarmMajor, tip: '待处理' },
  { label: '平均 Rx', a: overviewStats.avgRxPower, tip: '在线 ONU', decimals: 1, suffix: ' dBm' },
  { label: '楼层数', a: building.floors, tip: building.name },
])

const chartAnim = { animation: true, animationDuration: 800, animationEasing: 'cubicOut' as const }

const trendOption = computed(() => ({
  ...chartAnim,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 28 },
  xAxis: {
    type: 'category', data: bandwidthTrend.map((d) => d.hour),
    axisLabel: { color: '#8494b0' }, axisLine: { lineStyle: { color: 'rgba(86,120,168,0.35)' } },
  },
  yAxis: {
    type: 'value', name: '%', max: 100, axisLabel: { color: '#8494b0' },
    splitLine: { lineStyle: { color: 'rgba(86,120,168,0.15)' } },
  },
  series: [{
    name: '带宽利用率', type: 'line', smooth: true,
    areaStyle: { color: 'rgba(59,130,246,0.15)' },
    lineStyle: { width: 2, color: '#3b82f6' },
    itemStyle: { color: '#38bdf8' },
    data: bandwidthTrend.map((d) => d.util),
  }],
}))

const alarmPie = computed(() => ({
  ...chartAnim,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#8494b0' } },
  series: [{
    type: 'pie', radius: ['42%', '66%'],
    label: { color: '#e5eefc' },
    data: [
      { name: '紧急', value: alarms.filter((a) => a.severity === 'critical').length, itemStyle: { color: '#f87171' } },
      { name: '重要', value: alarms.filter((a) => a.severity === 'major').length, itemStyle: { color: '#fbbf24' } },
      { name: '次要', value: alarms.filter((a) => a.severity === 'minor').length, itemStyle: { color: '#3b82f6' } },
      { name: '提示', value: alarms.filter((a) => a.severity === 'info').length, itemStyle: { color: '#4ade80' } },
    ],
  }],
}))

const floorBar = computed(() => ({
  ...chartAnim,
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 12, top: 24, bottom: 28 },
  xAxis: { type: 'category', data: densityZones.map((z) => `${z.floor}F`), axisLabel: { color: '#8494b0', interval: 1 } },
  yAxis: { type: 'value', axisLabel: { color: '#8494b0' }, splitLine: { lineStyle: { color: 'rgba(86,120,168,0.15)' } } },
  series: [{
    name: '并发用户', type: 'bar', barWidth: 10,
    data: densityZones.map((z) => ({
      value: z.concurrentUsers,
      itemStyle: { color: z.hotspot ? '#f87171' : '#3b82f6', borderRadius: [3, 3, 0, 0] },
    })),
  }],
}))

const recentAlarms = alarms.slice(0, 5)
</script>

<template>
  <div class="overview">
    <section class="hero pol-panel">
      <div class="hero-top">
        <div>
          <h2 class="h-display">网络运行总览</h2>
          <p class="pol-sub hero-desc">
            {{ building.name }}（{{ building.floors }} 层）关键指标：接入容量、OLT/ONU 在线、带宽与告警。数据为演示 Mock。
          </p>
        </div>
        <span class="tag-pill">POL / GPON · XGS-PON</span>
      </div>
      <div class="hero-metrics stagger">
        <div v-for="h in hero" :key="h.label" class="hero-metric">
          <div class="pol-sub">{{ h.label }}</div>
          <div class="hero-val"><CountUp :value="h.value" :suffix="h.suffix || ''" /></div>
          <div class="pol-sub">{{ h.tip }}</div>
        </div>
      </div>
      <AlarmTicker />
    </section>

    <section class="cards stagger">
      <div v-for="c in cards" :key="c.label" class="card pol-panel" :class="{ danger: c.danger }">
        <div class="pol-sub">{{ c.label }}</div>
        <div class="card-value">
          <template v-if="c.b != null">
            <CountUp :value="c.a" /> / <CountUp :value="c.b" />
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
          <h3 class="pol-title">近 24 小时带宽利用率</h3>
          <span class="pol-sub">核心上联采样</span>
        </div>
        <v-chart class="chart" :option="trendOption" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">告警级别分布</h3>
          <span class="pol-sub">当前告警集合</span>
        </div>
        <v-chart class="chart" :option="alarmPie" autoresize />
      </div>
    </section>

    <section class="bottom stagger">
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">各楼层并发用户</h3>
          <span class="pol-sub">红色表示热点楼层（利用率 &gt; 75%）</span>
        </div>
        <v-chart class="chart" :option="floorBar" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="block-head"><h3 class="pol-title">业务切片带宽占用</h3></div>
        <div class="slice-list">
          <div v-for="s in slices" :key="s.name" class="slice-row">
            <div class="slice-name">{{ s.name }} <span class="pol-sub">VLAN {{ s.vlanId }}</span></div>
            <el-progress
              :percentage="Math.round((s.usedMbps / s.bandwidthMbps) * 100)"
              :stroke-width="10"
              :color="s.name === '安防' ? '#f87171' : '#3b82f6'"
            />
            <div class="pol-sub">{{ s.usedMbps }} / {{ s.bandwidthMbps }} Mbps</div>
          </div>
        </div>
      </div>
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">最新告警</h3>
          <router-link class="link" to="/alarms">查看全部</router-link>
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
.overview { display: flex; flex-direction: column; gap: 12px; }
.hero { padding: 16px; }
.hero-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.hero-desc { max-width: 720px; margin: 8px 0 0; line-height: 1.65; }
.hero-metrics {
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px; margin: 14px 0 12px;
}
.hero-metric {
  padding: 10px 12px; border-radius: 8px;
  border: 1px solid rgba(86, 120, 168, 0.3);
  background: rgba(15, 23, 42, 0.45);
}
.hero-val { margin: 6px 0; font-size: 22px; font-weight: 700; color: #e5eefc; }
.cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
.card { padding: 12px 14px; }
.card.danger { border-color: rgba(248, 113, 113, 0.45); }
.card-value { margin: 6px 0 4px; font-size: 20px; font-weight: 700; }
.mid, .bottom { display: grid; gap: 10px; }
.mid { grid-template-columns: 1.4fr 1fr; }
.bottom { grid-template-columns: 1.2fr 1fr 1.1fr; }
.block { padding: 14px; }
.block-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.chart { height: 280px; width: 100%; }
.slice-list { display: flex; flex-direction: column; gap: 12px; padding-top: 6px; }
.slice-name { margin-bottom: 4px; font-weight: 600; }
.link { color: #60a5fa; font-size: 12px; }
@media (max-width: 1200px) {
  .hero-metrics, .cards { grid-template-columns: repeat(2, 1fr); }
  .mid, .bottom { grid-template-columns: 1fr; }
}
</style>
