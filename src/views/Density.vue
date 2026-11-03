<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { densityZones, onus } from '@/mock/data'

use([CanvasRenderer, BarChart, HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent])

const floorFilter = ref<'all' | number>('all')

const rows = computed(() =>
  densityZones
    .filter((z) => floorFilter.value === 'all' || z.floor === floorFilter.value)
    .map((z) => ({
      ...z,
      util: Math.round((z.concurrentUsers / z.capacity) * 100),
      onuCount: onus.filter((o) => o.floor === z.floor).length,
    })),
)

const barOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { data: ['并发用户', '设计容量'], textStyle: { color: '#8fa3c2' } },
  grid: { left: 48, right: 20, top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    data: densityZones.map((z) => `${z.floor}F`),
    axisLabel: { color: '#8fa3c2' },
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
      data: densityZones.map((z) => z.concurrentUsers),
      itemStyle: {
        color: (p: { dataIndex: number }) => (densityZones[p.dataIndex].hotspot ? '#ff5c7a' : '#3aa0ff'),
      },
    },
    {
      name: '设计容量',
      type: 'bar',
      data: densityZones.map((z) => z.capacity),
      itemStyle: { color: 'rgba(25,230,194,0.35)' },
    },
  ],
}))

const heatOption = computed(() => {
  const areas = ['东区', '西区', '南区', '北区']
  const data: number[][] = []
  for (let f = 0; f < 18; f++) {
    for (let a = 0; a < 4; a++) {
      const base = densityZones[f].concurrentUsers / 4
      const v = Math.round(base * (0.6 + ((f * 7 + a * 13) % 10) / 12))
      data.push([a, f, v])
    }
  }
  return {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (p: { value: number[] }) => `${p.value[1] + 1}F ${areas[p.value[0]]}: ${p.value[2]} 用户`,
    },
    grid: { left: 50, right: 40, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: areas, axisLabel: { color: '#8fa3c2' } },
    yAxis: {
      type: 'category',
      data: densityZones.map((z) => `${z.floor}F`),
      axisLabel: { color: '#8fa3c2' },
    },
    visualMap: {
      min: 0,
      max: 80,
      calculable: true,
      orient: 'vertical',
      right: 0,
      top: 'center',
      inRange: { color: ['#0b1b33', '#1d4e89', '#3aa0ff', '#19e6c2', '#ffb020', '#ff5c7a'] },
      textStyle: { color: '#8fa3c2' },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: { show: false },
      },
    ],
  }
})
</script>

<template>
  <div class="density page-motion">
    <section class="charts">
      <div class="pol-panel block">
        <div class="head">
          <h3 class="pol-title">楼层并发 vs 设计容量</h3>
          <span class="pol-sub">红色柱为热点楼层（利用率 &gt; 75%）</span>
        </div>
        <v-chart class="chart" :option="barOption" autoresize />
      </div>
      <div class="pol-panel block">
        <div class="head">
          <h3 class="pol-title">楼层 × 分区接入热力</h3>
          <span class="pol-sub">演示热力图 · 高密度接入分布</span>
        </div>
        <v-chart class="chart" :option="heatOption" autoresize />
      </div>
    </section>

    <section class="pol-panel table-wrap">
      <div class="head row">
        <h3 class="pol-title">按楼层 / 区域接入密度</h3>
        <el-select v-model="floorFilter" style="width: 140px" size="small">
          <el-option label="全部楼层" value="all" />
          <el-option v-for="z in densityZones" :key="z.floor" :label="`${z.floor}F`" :value="z.floor" />
        </el-select>
      </div>
      <el-table :data="rows" stripe height="420">
        <el-table-column prop="floor" label="楼层" width="80">
          <template #default="{ row }">{{ row.floor }}F</template>
        </el-table-column>
        <el-table-column prop="area" label="区域" min-width="160" />
        <el-table-column prop="onuCount" label="ONU/AP 数" width="110" />
        <el-table-column prop="terminals" label="接入终端估算" width="130" />
        <el-table-column prop="concurrentUsers" label="并发用户" width="100" />
        <el-table-column prop="capacity" label="设计容量" width="100" />
        <el-table-column label="利用率" width="160">
          <template #default="{ row }">
            <el-progress :percentage="row.util" :status="row.hotspot ? 'exception' : undefined" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column prop="hotspot" label="热点" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.hotspot" type="danger" size="small">热点</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.density { display: flex; flex-direction: column; gap: 12px; }
.charts { display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; }
.block, .table-wrap { padding: 14px 16px; }
.head { margin-bottom: 8px; }
.head.row { display: flex; justify-content: space-between; align-items: center; }
.chart { height: 340px; width: 100%; }
@media (max-width: 1100px) {
  .charts { grid-template-columns: 1fr; }
}

.page-motion > .pol-panel,
.page-motion > section,
.page-motion > .charts,
.page-motion > .body,
.page-motion > .top,
.page-motion > .mid {
  animation: card-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.page-motion > *:nth-child(2) { animation-delay: 0.08s; }
.page-motion > *:nth-child(3) { animation-delay: 0.16s; }
</style>
