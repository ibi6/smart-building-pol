<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart, LinesChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { olts, odns, onus } from '@/mock/data'
import type { DeviceStatus } from '@/types'

use([CanvasRenderer, GraphChart, LinesChart, TooltipComponent, LegendComponent, GridComponent])

const selected = ref<Record<string, unknown> | null>(null)
const selectedId = ref<string | null>(null)
const booting = ref(true)
const breath = ref(0)
let breathTimer = 0

onMounted(() => {
  window.setTimeout(() => { booting.value = false }, 720)
  breathTimer = window.setInterval(() => {
    breath.value = (breath.value + 1) % 1000
  }, 80)
})
onUnmounted(() => window.clearInterval(breathTimer))

const statusColor: Record<DeviceStatus, string> = {
  online: '#34d399',
  offline: '#64748b',
  warning: '#fbbf24',
  maintenance: '#38bdf8',
}

const graphOption = computed(() => {
  // breath used to nudge shadow for “呼吸”
  const b = 12 + Math.sin(breath.value / 8) * 6
  const nodes: Array<Record<string, unknown>> = []
  const links: Array<Record<string, unknown>> = []
  const flowLines: Array<{ coords: number[][] }> = []

  const glow = (color: string, size: number, id: string) => {
    const hot = selectedId.value === id
    return {
      symbolSize: hot ? size * 1.4 : size + Math.sin(breath.value / 10) * 1.2,
      itemStyle: {
        color,
        shadowBlur: hot ? 36 : b,
        shadowColor: color,
        borderColor: hot ? '#fff' : 'rgba(255,255,255,0.3)',
        borderWidth: hot ? 2.5 : 1,
      },
    }
  }

  const pos: Record<string, [number, number]> = {}

  const addNode = (id: string, name: string, category: number, x: number, y: number, size: number, color: string, detail: unknown) => {
    pos[id] = [x, y]
    nodes.push({ id, name, category, x, y, fixed: true, ...glow(color, size, id), detail })
  }

  addNode('CORE', '楼宇核心交换机', 0, 0, 0, 48, '#22d3ee', { type: 'CORE', desc: '上联园区核心 / 互联网出口' })

  olts.forEach((o, i) => {
    const x = i === 0 ? -190 : 190
    addNode(o.id, o.name, 1, x, 105, 42, statusColor[o.status], o)
    links.push({ source: 'CORE', target: o.id, lineStyle: { color: 'rgba(34,211,238,0.55)', width: 2, curveness: 0.05 } })
    flowLines.push({ coords: [[0, 0], [x, 105]] })
  })

  links.push({
    source: 'OLT-01', target: 'OLT-02',
    lineStyle: { type: 'dashed', color: 'rgba(251,191,36,0.85)', width: 1.8, curveness: -0.22 },
    label: { show: true, formatter: '双归属保护', color: '#fbbf24', fontSize: 10 },
  })
  flowLines.push({ coords: [pos['OLT-01'], pos['OLT-02']] })

  odns.filter((d) => d.level === 1).forEach((d, i) => {
    const x = -430 + i * 172
    addNode(d.id, d.name, 2, x, 235, 28, statusColor[d.status], d)
    const p = pos[d.parentId]
    if (p) {
      links.push({ source: d.parentId, target: d.id, lineStyle: { color: 'rgba(167,139,250,0.5)', width: 1.5, curveness: 0.08 } })
      flowLines.push({ coords: [p, [x, 235]] })
    }
  })

  odns.filter((d) => d.level === 2).forEach((d, i) => {
    const x = -530 + i * 96
    addNode(d.id, d.name, 3, x, 365, 22, statusColor[d.status], d)
    const p = pos[d.parentId]
    if (p) {
      links.push({ source: d.parentId, target: d.id, lineStyle: { color: 'rgba(56,189,248,0.4)', width: 1.2, curveness: 0.06 } })
      if (i % 2 === 0) flowLines.push({ coords: [p, [x, 365]] })
    }
  })

  const sampleOnus = onus.filter((_, idx) => idx % 2 === 0).slice(0, 36)
  sampleOnus.forEach((o, i) => {
    const siblings = sampleOnus.filter((x) => x.parentOdnId === o.parentOdnId)
    const si = siblings.findIndex((x) => x.id === o.id)
    const parent = pos[o.parentOdnId] || [0, 365]
    const x = parent[0] - 30 + si * 28
    const y = 485 + (i % 3) * 18
    addNode(o.id, o.name, 4, x, y, o.type === 'AP' ? 16 : 14, statusColor[o.status], o)
    links.push({ source: o.parentOdnId, target: o.id, lineStyle: { color: 'rgba(148,163,184,0.35)', width: 1, curveness: 0.04 } })
  })

  return {
    backgroundColor: 'transparent',
    animationDuration: 1500,
    animationEasingUpdate: 'cubicOut' as const,
    xAxis: { show: false, type: 'value', min: -620, max: 620 },
    yAxis: { show: false, type: 'value', min: -40, max: 560, inverse: false },
    grid: { left: 10, right: 10, top: 36, bottom: 10 },
    tooltip: {
      formatter: (p: { data?: { name?: string; detail?: Record<string, unknown> } }) => {
        const d = p.data?.detail
        if (!d) return p.data?.name || ''
        if ('tech' in d && 'ponPorts' in d) return `${d.name}<br/>型号: ${d.model}<br/>制式: ${d.tech}<br/>PON口: ${d.usedPonPorts}/${d.ponPorts}`
        if ('splitRatio' in d) return `${d.name}<br/>分光比: ${d.splitRatio}<br/>位置: ${d.location}`
        if ('rxPowerDbm' in d) return `${d.name}<br/>${d.floor}F ${d.room}<br/>Rx: ${d.rxPowerDbm} dBm`
        return String(d.desc || p.data?.name)
      },
    },
    legend: [{ data: ['核心', 'OLT', '一级分光', '二级分光', 'ONU/光AP'], textStyle: { color: '#7f93b5' }, top: 0 }],
    series: [
      {
        type: 'graph',
        layout: 'none',
        coordinateSystem: 'cartesian2d',
        roam: true,
        draggable: true,
        categories: [{ name: '核心' }, { name: 'OLT' }, { name: '一级分光' }, { name: '二级分光' }, { name: 'ONU/光AP' }],
        label: {
          show: true, position: 'bottom', color: '#c9d7ef', fontSize: 10,
          formatter: (p: { data: { category: number; name: string } }) =>
            p.data.category >= 4 ? '' : p.data.name.replace(/弱电间-|走廊-/g, ''),
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 7],
        data: nodes,
        links,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3.2, shadowBlur: 12, shadowColor: 'rgba(34,211,238,0.8)' },
          itemStyle: { shadowBlur: 40 },
        },
      },
      {
        type: 'lines',
        coordinateSystem: 'cartesian2d',
        zlevel: 2,
        effect: {
          show: true,
          period: 3.2,
          trailLength: 0.45,
          symbol: 'circle',
          symbolSize: 4,
          color: '#e879f9',
        },
        lineStyle: { width: 0, opacity: 0, curveness: 0.08 },
        data: flowLines,
      },
    ],
  }
})

function onClick(params: Record<string, unknown>) {
  const data = params.data as { id?: string; detail?: Record<string, unknown>; name?: string } | undefined
  if (params.dataType === 'node' && data?.detail) {
    selectedId.value = data.id || null
    selected.value = { name: data.name, ...data.detail }
  }
}
</script>

<template>
  <div class="topo">
    <div class="pol-panel canvas-wrap">
      <div class="flow-line" style="top: 0" />
      <div class="head">
        <div>
          <h3 class="pol-title">全光拓扑光场</h3>
          <div class="pol-sub">节点呼吸发光 · 主干光点流动 · 选中爆闪聚焦（可漫游缩放）</div>
        </div>
        <span class="neon-badge">OPTICAL FABRIC</span>
      </div>
      <div class="chart-box">
        <transition name="page-fade">
          <div v-if="booting" class="skeleton" key="sk">
            <div class="sk-core" />
            <div class="pol-sub">光路编织中 · Optical Fabric Booting…</div>
            <div class="sk-bars">
              <div class="skeleton-block" style="height: 10px; width: 60%" />
              <div class="skeleton-block" style="height: 10px; width: 40%" />
            </div>
          </div>
          <v-chart v-else class="chart" :option="graphOption" autoresize @click="onClick" />
        </transition>
      </div>
    </div>
    <aside class="pol-panel detail" :class="{ flash: !!selected }">
      <h3 class="pol-title">节点情报</h3>
      <template v-if="selected">
        <div class="neon-badge" style="margin-bottom: 10px; width: fit-content">LOCKED · 光路锁定</div>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item v-for="(v, k) in selected" :key="String(k)" :label="String(k)">
            {{ Array.isArray(v) ? v.join('、') : v }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <div v-else class="empty-art">
        <div class="empty-orb" />
        <div class="pol-sub">点选任意发光节点，展开型号 / 分光比 / 光功率</div>
      </div>
      <div class="legend-box">
        <div class="pol-title" style="margin-bottom: 8px">图例</div>
        <div><span class="status-dot status-online" />在线呼吸</div>
        <div><span class="status-dot status-warning" />告警闪烁</div>
        <div><span class="status-dot status-offline" />离线</div>
        <div class="pol-sub" style="margin-top: 8px">品红光点 = 主干链路流量示意</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.topo { display: grid; grid-template-columns: 1fr 300px; gap: 12px; min-height: 640px; }
.canvas-wrap, .detail { padding: 14px 16px; }
.head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.chart-box { position: relative; min-height: 620px; }
.chart { height: 620px; width: 100%; }
.skeleton {
  height: 620px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  background: radial-gradient(circle at 50% 35%, rgba(34,211,238,0.12), transparent 50%);
}
.sk-core {
  width: 84px; height: 84px; border-radius: 50%;
  border: 2px solid rgba(34,211,238,0.55);
  box-shadow: 0 0 30px rgba(167,139,250,0.45), inset 0 0 24px rgba(34,211,238,0.25);
  animation: topo-boot 1s ease-in-out infinite;
}
@keyframes topo-boot {
  0%,100% { transform: scale(0.9); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
}
.sk-bars { width: min(320px, 70%); display: grid; gap: 8px; }
.detail { display: flex; flex-direction: column; gap: 12px; }
.detail.flash {
  animation: select-flash 0.7s ease;
  border-color: rgba(232, 121, 249, 0.65);
  box-shadow: 0 0 34px rgba(232, 121, 249, 0.35);
}
@keyframes select-flash {
  0% { box-shadow: 0 0 0 rgba(232,121,249,0); }
  40% { box-shadow: 0 0 40px rgba(232,121,249,0.65); }
  100% { box-shadow: 0 0 24px rgba(232,121,249,0.3); }
}
.legend-box {
  margin-top: auto; padding-top: 12px;
  border-top: 1px solid rgba(56,189,248,0.15);
  display: flex; flex-direction: column; gap: 6px; font-size: 13px;
}
@media (max-width: 1100px) {
  .topo { grid-template-columns: 1fr; }
  .chart-box, .chart, .skeleton { height: 480px; min-height: 480px; }
}
</style>
