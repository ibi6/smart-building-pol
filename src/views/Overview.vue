<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { bandwidthTrend, overviewStats, alarms, slices, densityZones } from '@/mock/data'

use([CanvasRenderer, LineChart, PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const cards = computed(() => [
  { label: '楼宇接入容量', value: `${overviewStats.usedAccess} / ${overviewStats.accessCapacity}`, tip: '已用终端 / 设计容量' },
  { label: 'OLT 在线', value: `${overviewStats.oltOnline} / ${overviewStats.oltTotal}`, tip: '双归属主备均在线' },
  { label: 'ONU / 光 AP 在线', value: `${overviewStats.onuOnline} / ${overviewStats.onuTotal}`, tip: '含告警态终端' },
  { label: '带宽利用率', value: `${overviewStats.bandwidthUtilPercent}%`, tip: '核心上联综合利用率' },
  { label: '并发用户', value: String(overviewStats.concurrentUsers), tip: '全楼实时估算' },
  { label: '平均接收光功率', value: `${overviewStats.avgRxPower} dBm`, tip: '在线 ONU 均值' },
])

const trendOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: bandwidthTrend.map((d) => d.hour),
    axisLabel: { color: '#8fa3c2' },
    axisLine: { lineStyle: { color: 'rgba(64,158,255,0.25)' } },
  },
  yAxis: {
    type: 'value',
    name: '%',
    max: 100,
    axisLabel: { color: '#8fa3c2' },
    splitLine: { lineStyle: { color: 'rgba(64,158,255,0.12)' } },
  },
  series: [
    {
      name: '带宽利用率',
      type: 'line',
      smooth: true,
      areaStyle: { color: 'rgba(58,160,255,0.18)' },
      lineStyle: { color: '#3aa0ff', width: 2 },
      itemStyle: { color: '#19e6c2' },
      data: bandwidthTrend.map((d) => d.util),
    },
  ],
}))

const alarmPie = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#8fa3c2' } },
  series: [
    {
      type: 'pie',
      radius: ['42%', '68%'],
      label: { color: '#e8f1ff' },
      data: [
        { name: '紧急', value: alarms.filter((a) => a.severity === 'critical').length, itemStyle: { color: '#ff5c7a' } },
        { name: '重要', value: alarms.filter((a) => a.severity === 'major').length, itemStyle: { color: '#ffb020' } },
        { name: '次要', value: alarms.filter((a) => a.severity === 'minor').length, itemStyle: { color: '#3aa0ff' } },
        { name: '提示', value: alarms.filter((a) => a.severity === 'info').length, itemStyle: { color: '#19e6c2' } },
      ],
    },
  ],
}))

const floorBar = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 16, top: 24, bottom: 28 },
  xAxis: {
    type: 'category',
    data: densityZones.map((z) => `${z.floor}F`),
    axisLabel: { color: '#8fa3c2', interval: 1 },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#8fa3c2' },
    splitLine: { lineStyle: { color: 'rgba(64,158,255,0.12)' } },
  },
  series: [
    {
      name: '并发用户',
      type: 'bar',
      data: densityZones.map((z) => ({
        value: z.concurrentUsers,
        itemStyle: { color: z.hotspot ? '#ff5c7a' : '#3aa0ff' },
      })),
      barWidth: 10,
    },
  ],
}))

const recentAlarms = alarms.slice(0, 5)
</script>

<template>
  <div class="overview">
    <section class="cards">
      <div v-for="c in cards" :key="c.label" class="card pol-panel">
        <div class="pol-sub">{{ c.label }}</div>
        <div class="card-value">{{ c.value }}</div>
        <div class="pol-sub">{{ c.tip }}</div>
      </div>
    </section>

    <section class="mid">
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">近 24 小时带宽利用率</h3>
          <span class="pol-sub">核心上联 · 模拟采样</span>
        </div>
        <v-chart class="chart" :option="trendOption" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">告警严重级别分布</h3>
          <span class="pol-sub">未清除告警摘要</span>
        </div>
        <v-chart class="chart" :option="alarmPie" autoresize />
      </div>
    </section>

    <section class="bottom">
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">各楼层并发用户</h3>
          <span class="pol-sub">红色为热点楼层</span>
        </div>
        <v-chart class="chart" :option="floorBar" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">业务切片带宽占用</h3>
        </div>
        <div class="slice-list">
          <div v-for="s in slices" :key="s.name" class="slice-row">
            <div class="slice-name">{{ s.name }} <span class="pol-sub">VLAN {{ s.vlanId }}</span></div>
            <el-progress
              :percentage="Math.round((s.usedMbps / s.bandwidthMbps) * 100)"
              :stroke-width="10"
              :color="s.name === '安防' ? '#ff5c7a' : '#3aa0ff'"
            />
            <div class="pol-sub">{{ s.usedMbps }} / {{ s.bandwidthMbps }} Mbps</div>
          </div>
        </div>
      </div>
      <div class="pol-panel block">
        <div class="block-head">
          <h3 class="pol-title">最新告警</h3>
          <router-link class="link" to="/alarms">全部 →</router-link>
        </div>
        <el-table :data="recentAlarms" size="small" height="260">
          <el-table-column prop="time" label="时间" width="150" />
          <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
          <el-table-column prop="severity" label="级别" width="80">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="row.severity === 'critical' ? 'danger' : row.severity === 'major' ? 'warning' : 'info'"
              >{{ row.severity }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 14px; }
.cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
.card { padding: 14px 16px; }
.card-value {
  margin: 8px 0 4px;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(90deg, #e8f1ff, #19e6c2);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.mid, .bottom {
  display: grid;
  gap: 12px;
}
.mid { grid-template-columns: 1.4fr 1fr; }
.bottom { grid-template-columns: 1.2fr 1fr 1.1fr; }
.block { padding: 14px 16px; }
.block-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.chart { height: 280px; width: 100%; }
.slice-list { display: flex; flex-direction: column; gap: 14px; padding-top: 8px; }
.slice-name { margin-bottom: 4px; font-weight: 600; }
.link { color: #3aa0ff; font-size: 12px; }
@media (max-width: 1200px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
  .mid, .bottom { grid-template-columns: 1fr; }
}
</style>
