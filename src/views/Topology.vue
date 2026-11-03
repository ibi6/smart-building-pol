<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { olts, odns, onus } from '@/mock/data'
import type { DeviceStatus } from '@/types'

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent])

const chartRef = ref<InstanceType<typeof VChart> | null>(null)
const selected = ref<Record<string, unknown> | null>(null)
const selectedId = ref<string | null>(null)
const ready = ref(false)

const statusColor: Record<DeviceStatus, string> = {
  online: '#3DDC97',
  offline: '#7B8798',
  warning: '#F5A623',
  maintenance: '#4C9AFF',
}

function resizeChart() {
  const inst = (chartRef.value as { chart?: { resize: () => void } } | null)?.chart
  inst?.resize()
}

onMounted(async () => {
  ready.value = true
  await nextTick()
  resizeChart()
  window.setTimeout(resizeChart, 80)
  window.setTimeout(resizeChart, 320)
  window.addEventListener('resize', resizeChart)
})
onUnmounted(() => window.removeEventListener('resize', resizeChart))
watch(selectedId, async () => {
  await nextTick()
  resizeChart()
})

const graphOption = computed(() => {
  const nodes: Array<Record<string, unknown>> = []
  const links: Array<Record<string, unknown>> = []

  const styleOf = (color: string, size: number, id: string) => {
    const hot = selectedId.value === id
    return {
      symbolSize: hot ? size + 8 : size,
      itemStyle: {
        color,
        borderColor: hot ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
        borderWidth: hot ? 3 : 1.5,
        shadowBlur: hot ? 18 : 8,
        shadowColor: color,
      },
      label: {
        show: true,
        color: '#E8F1FF',
        fontSize: hot ? 12 : 11,
        fontWeight: hot ? 700 : 500,
        textBorderColor: 'rgba(8,16,32,0.85)',
        textBorderWidth: 3,
      },
    }
  }

  nodes.push({
    id: 'CORE',
    name: '楼宇核心',
    category: 0,
    x: 480,
    y: 40,
    fixed: true,
    ...styleOf('#4C9AFF', 52, 'CORE'),
    detail: { 类型: '核心交换机', 说明: '上联园区核心 / 出口' },
  })

  olts.forEach((o, i) => {
    const x = i === 0 ? 280 : 680
    nodes.push({
      id: o.id,
      name: o.name,
      category: 1,
      x,
      y: 140,
      fixed: true,
      ...styleOf(statusColor[o.status], 44, o.id),
      detail: o,
    })
    links.push({
      source: 'CORE',
      target: o.id,
      lineStyle: { color: '#5BA3FF', width: 2.5, opacity: 0.95 },
    })
  })

  links.push({
    source: 'OLT-01',
    target: 'OLT-02',
    lineStyle: { type: 'dashed', color: '#F5A623', width: 2, opacity: 0.95 },
    label: { show: true, formatter: '双归属', color: '#F5A623', fontSize: 11, backgroundColor: 'rgba(8,16,32,0.75)', padding: [2, 4] },
  })

  const l1 = odns.filter((d) => d.level === 1)
  l1.forEach((d, i) => {
    const x = 80 + i * 160
    nodes.push({
      id: d.id,
      name: d.name.replace('弱电间-', ''),
      category: 2,
      x,
      y: 280,
      fixed: true,
      ...styleOf(statusColor[d.status], 30, d.id),
      detail: d,
    })
    links.push({
      source: d.parentId,
      target: d.id,
      lineStyle: { color: '#7EB6FF', width: 2, opacity: 0.9 },
    })
  })

  const l2 = odns.filter((d) => d.level === 2)
  l2.forEach((d, i) => {
    const x = 40 + i * 85
    nodes.push({
      id: d.id,
      name: d.name.replace('走廊-', ''),
      category: 3,
      x,
      y: 420,
      fixed: true,
      ...styleOf(statusColor[d.status], 24, d.id),
      detail: d,
    })
    links.push({
      source: d.parentId,
      target: d.id,
      lineStyle: { color: '#9CC7FF', width: 1.6, opacity: 0.85 },
    })
  })

  // 每层二级下抽 2~3 台 ONU，保证结构可读
  const sampleOnus = onus.filter((_, idx) => idx % 3 === 0).slice(0, 24)
  sampleOnus.forEach((o, i) => {
    const parent = nodes.find((n) => n.id === o.parentOdnId) as { x: number; y: number } | undefined
    const baseX = parent?.x ?? 100
    const siblings = sampleOnus.filter((x) => x.parentOdnId === o.parentOdnId)
    const si = siblings.findIndex((x) => x.id === o.id)
    nodes.push({
      id: o.id,
      name: o.type === 'AP' ? `${o.floor}F-AP` : `${o.floor}F-ONU`,
      category: 4,
      x: baseX - 18 + si * 36,
      y: 540 + (i % 2) * 36,
      fixed: true,
      ...styleOf(statusColor[o.status], o.type === 'AP' ? 16 : 14, o.id),
      detail: o,
      label: {
        show: true,
        fontSize: 10,
        color: '#D7E6FF',
        textBorderColor: 'rgba(8,16,32,0.85)',
        textBorderWidth: 2,
      },
    })
    links.push({
      source: o.parentOdnId,
      target: o.id,
      lineStyle: { color: '#A8C4E8', width: 1.2, opacity: 0.75 },
    })
  })

  return {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 600,
    tooltip: {
      backgroundColor: 'rgba(12, 22, 42, 0.95)',
      borderColor: '#4C9AFF',
      textStyle: { color: '#E8F1FF' },
      formatter: (p: { data?: { name?: string; detail?: Record<string, unknown> } }) => {
        const d = p.data?.detail
        if (!d) return p.data?.name || ''
        if ('tech' in d && 'ponPorts' in d) {
          return `<b>${d.name}</b><br/>型号 ${d.model}<br/>制式 ${d.tech}<br/>PON ${d.usedPonPorts}/${d.ponPorts}<br/>状态 ${d.status}`
        }
        if ('splitRatio' in d) {
          return `<b>${d.name}</b><br/>分光比 ${d.splitRatio}<br/>位置 ${d.location}<br/>层级 ${d.level} 级`
        }
        if ('rxPowerDbm' in d) {
          return `<b>${d.name}</b><br/>${d.floor}F ${d.room}<br/>Rx ${d.rxPowerDbm} dBm<br/>用户 ${d.onlineUsers}`
        }
        return `<b>${p.data?.name}</b><br/>${d.说明 || d.desc || ''}`
      },
    },
    legend: {
      data: ['核心', 'OLT', '一级分光', '二级分光', 'ONU/光AP'],
      top: 8,
      left: 'center',
      textStyle: { color: '#C9D7EF', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        draggable: true,
        zoom: 0.95,
        scaleLimit: { min: 0.45, max: 2.2 },
        categories: [
          { name: '核心', itemStyle: { color: '#4C9AFF' } },
          { name: 'OLT', itemStyle: { color: '#3DDC97' } },
          { name: '一级分光', itemStyle: { color: '#7EB6FF' } },
          { name: '二级分光', itemStyle: { color: '#9CC7FF' } },
          { name: 'ONU/光AP', itemStyle: { color: '#A8C4E8' } },
        ],
        label: {
          show: true,
          position: 'bottom',
          distance: 6,
          color: '#E8F1FF',
          fontSize: 11,
          textBorderColor: 'rgba(8,16,32,0.9)',
          textBorderWidth: 3,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
        lineStyle: { opacity: 0.9, curveness: 0.06 },
        data: nodes,
        links,
        emphasis: {
          focus: 'adjacency',
          scale: true,
          lineStyle: { width: 3, color: '#FFFFFF' },
          itemStyle: { borderColor: '#fff', borderWidth: 3, shadowBlur: 20 },
        },
      },
    ],
  }
})

function onClick(params: Record<string, unknown>) {
  const data = params.data as { id?: string; detail?: Record<string, unknown>; name?: string } | undefined
  if (params.dataType === 'node' && data?.detail) {
    selectedId.value = data.id || null
    selected.value = { 名称: data.name, ...flattenDetail(data.detail) }
  }
}

function flattenDetail(detail: Record<string, unknown>) {
  // keep object readable; avoid dumping nested nonsense
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(detail)) {
    if (v == null) continue
    if (typeof v === 'object' && !Array.isArray(v)) continue
    out[k] = Array.isArray(v) ? v.join('、') : v
  }
  return out
}
</script>

<template>
  <div class="topo">
    <div class="pol-panel canvas-wrap">
      <div class="head">
        <div>
          <h3 class="pol-title">全光网络拓扑</h3>
          <div class="pol-sub">核心 → OLT → 一级/二级分光 → ONU/光 AP；支持拖拽、缩放与点击查看</div>
        </div>
        <div class="head-right">
          <span class="tag-pill">GPON / XGS-PON</span>
          <el-button size="small" @click="resizeChart">刷新视图</el-button>
        </div>
      </div>
      <div class="chart-box">
        <v-chart
          v-if="ready"
          ref="chartRef"
          class="chart"
          :option="graphOption"
          autoresize
          @click="onClick"
        />
        <div v-else class="chart placeholder pol-sub">拓扑加载中…</div>
      </div>
      <div class="footnote pol-sub">提示：若显示异常可点「刷新视图」；滚轮缩放，拖空白处平移。</div>
    </div>
    <aside class="pol-panel detail">
      <h3 class="pol-title">节点详情</h3>
      <template v-if="selected">
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item v-for="(v, k) in selected" :key="String(k)" :label="String(k)">
            {{ v }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <div v-else class="empty-state">
        <div class="icon">◎</div>
        <div class="pol-sub">点击左侧节点查看型号、分光比、光功率等</div>
      </div>
      <div class="legend-box">
        <div class="pol-title" style="margin-bottom: 8px">图例</div>
        <div><span class="status-dot status-online" />在线</div>
        <div><span class="status-dot status-warning" />告警</div>
        <div><span class="status-dot status-offline" />离线</div>
        <div class="pol-sub" style="margin-top: 8px">虚线：OLT 双归属关系</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.topo {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 12px;
  min-height: 680px;
}
.canvas-wrap, .detail { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.head-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.chart-box {
  position: relative;
  flex: 1;
  min-height: 580px;
  height: 580px;
  border-radius: 8px;
  border: 1px solid rgba(76, 154, 255, 0.25);
  background:
    radial-gradient(800px 280px at 50% 0%, rgba(76, 154, 255, 0.12), transparent 60%),
    rgba(8, 16, 32, 0.55);
}
.chart, .placeholder {
  width: 100%;
  height: 100%;
  min-height: 580px;
}
.placeholder { display: grid; place-items: center; }
.footnote { margin-top: 2px; }
.detail { min-height: 580px; }
.legend-box {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(86, 120, 168, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
@media (max-width: 1100px) {
  .topo { grid-template-columns: 1fr; }
  .chart-box, .chart, .placeholder { height: 480px; min-height: 480px; }
}
</style>
