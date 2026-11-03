<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { slices, onus } from '@/mock/data'

use([CanvasRenderer, PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent])

const colors = ['#3aa0ff', '#19e6c2', '#ff5c7a', '#ffb020']

const pieOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { bottom: 0, textStyle: { color: '#8fa3c2' } },
  series: [
    {
      type: 'pie',
      radius: ['40%', '65%'],
      data: slices.map((s, i) => ({
        name: s.name,
        value: s.usedMbps,
        itemStyle: { color: colors[i] },
      })),
      label: { color: '#e8f1ff' },
    },
  ],
}))

const barOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 20, top: 30, bottom: 30 },
  xAxis: {
    type: 'category',
    data: slices.map((s) => s.name),
    axisLabel: { color: '#8fa3c2' },
  },
  yAxis: {
    type: 'value',
    name: 'ONU 数',
    axisLabel: { color: '#8fa3c2' },
    splitLine: { lineStyle: { color: 'rgba(64,158,255,0.12)' } },
  },
  series: [
    {
      type: 'bar',
      data: slices.map((s, i) => ({ value: s.onuCount, itemStyle: { color: colors[i] } })),
      barWidth: 36,
    },
  ],
}))

const sampleOnus = computed(() =>
  onus.filter((o) => o.slices.length).slice(0, 40),
)
</script>

<template>
  <div class="biz">
    <section class="top">
      <div v-for="(s, i) in slices" :key="s.name" class="pol-panel card">
        <div class="card-top">
          <h3 class="pol-title">{{ s.name }} 切片</h3>
          <el-tag :color="colors[i]" effect="dark" style="border: none; color: #041018">VLAN {{ s.vlanId }}</el-tag>
        </div>
        <div class="pol-sub">{{ s.description }}</div>
        <div class="metrics">
          <div><div class="pol-sub">优先级</div><strong>{{ s.priority }}</strong></div>
          <div><div class="pol-sub">承载 ONU</div><strong>{{ s.onuCount }}</strong></div>
          <div><div class="pol-sub">带宽占用</div><strong>{{ s.usedMbps }}/{{ s.bandwidthMbps }} Mbps</strong></div>
        </div>
        <el-progress
          :percentage="Math.round((s.usedMbps / s.bandwidthMbps) * 100)"
          :color="colors[i]"
          :stroke-width="10"
        />
      </div>
    </section>

    <section class="mid">
      <div class="pol-panel block">
        <h3 class="pol-title">切片带宽占用占比</h3>
        <v-chart class="chart" :option="pieOption" autoresize />
      </div>
      <div class="pol-panel block">
        <h3 class="pol-title">各切片承载 ONU / AP 数量</h3>
        <v-chart class="chart" :option="barOption" autoresize />
      </div>
    </section>

    <section class="pol-panel table-wrap">
      <h3 class="pol-title" style="margin-bottom: 10px">终端业务归属（抽样）</h3>
      <el-table :data="sampleOnus" stripe height="360">
        <el-table-column prop="id" label="设备" width="100" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column label="位置" width="120">
          <template #default="{ row }">{{ row.floor }}F {{ row.room }}</template>
        </el-table-column>
        <el-table-column prop="area" label="区域" width="110" />
        <el-table-column label="所属切片" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="s in row.slices" :key="s" size="small" class="tag">{{ s }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="tech" label="制式" width="100" />
        <el-table-column prop="onlineUsers" label="在线用户" width="100" />
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.biz { display: flex; flex-direction: column; gap: 12px; }
.top { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.card { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.card-top { display: flex; justify-content: space-between; align-items: center; }
.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 4px 0; }
.mid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.block, .table-wrap { padding: 14px 16px; }
.chart { height: 300px; }
.tag { margin-right: 4px; }
@media (max-width: 1200px) {
  .top, .mid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 800px) {
  .top, .mid { grid-template-columns: 1fr; }
}
</style>
