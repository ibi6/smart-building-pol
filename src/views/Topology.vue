<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { olts, odns, onus } from '@/mock/data'
import type { DeviceStatus } from '@/types'

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent])

const selected = ref<Record<string, unknown> | null>(null)
const selectedId = ref<string | null>(null)
const booting = ref(true)

onMounted(() => {
  window.setTimeout(() => {
    booting.value = false
  }, 650)
})

const statusColor: Record<DeviceStatus, string> = {
  online: '#2ce6a4',
  offline: '#6b778c',
  warning: '#ffb020',
  maintenance: '#3aa0ff',
}

const graphOption = computed(() => {
  const nodes: Array<Record<string, unknown>> = []
  const links: Array<Record<string, unknown>> = []

  const glow = (color: string, size: number, id: string) => {
    const hot = selectedId.value === id
    return {
      symbolSize: hot ? size * 1.35 : size,
      itemStyle: {
        color,
        shadowBlur: hot ? 28 : 14,
        shadowColor: color,
        borderColor: hot ? '#fff' : 'rgba(255,255,255,0.25)',
        borderWidth: hot ? 2 : 1,
      },
    }
  }

  nodes.push({
    id: 'CORE',
    name: '楼宇核心交换机',
    category: 0,
    x: 0,
    y: 0,
    fixed: true,
    ...glow('#19e6c2', 46, 'CORE'),
    detail: { type: 'CORE', desc: '上联园区核心 / 互联网出口' },
  })

  olts.forEach((o, i) => {
    nodes.push({
      id: o.id,
      name: o.name,
      category: 1,
      x: i === 0 ? -180 : 180,
      y: 100,
      fixed: true,
      ...glow(statusColor[o.status], 40, o.id),
      detail: o,
    })
    links.push({
      source: 'CORE',
      target: o.id,
      lineStyle: {
        color: 'rgba(25,230,194,0.7)',
        width: 2.2,
        shadowBlur: 8,
        shadowColor: 'rgba(25,230,194,0.55)',
        curveness: 0.05,
      },
    })
  })

  links.push({
    source: 'OLT-01',
    target: 'OLT-02',
    lineStyle: {
      type: 'dashed',
      color: 'rgba(255,176,32,0.85)',
      width: 1.8,
      shadowBlur: 6,
      shadowColor: 'rgba(255,176,32,0.5)',
      curveness: -0.2,
    },
    label: { show: true, formatter: '双归属保护', color: '#ffb020', fontSize: 10 },
  })

  const l1 = odns.filter((d) => d.level === 1)
  l1.forEach((d, i) => {
    const x = -420 + i * 170
    nodes.push({
      id: d.id,
      name: d.name,
      category: 2,
      x,
      y: 230,
      fixed: true,
      ...glow(statusColor[d.status], 28, d.id),
      detail: d,
    })
    links.push({
      source: d.parentId,
      target: d.id,
      lineStyle: {
        color: 'rgba(58,160,255,0.55)',
        width: 1.6,
        shadowBlur: 5,
        shadowColor: 'rgba(58,160,255,0.4)',
        curveness: 0.08,
      },
    })
  })

  const l2 = odns.filter((d) => d.level === 2)
  l2.forEach((d, i) => {
    const x = -520 + i * 95
    nodes.push({
      id: d.id,
      name: d.name,
      category: 3,
      x,
      y: 360,
      fixed: true,
      ...glow(statusColor[d.status], 22, d.id),
      detail: d,
    })
    links.push({
      source: d.parentId,
      target: d.id,
      lineStyle: {
        color: 'rgba(58,160,255,0.4)',
        width: 1.3,
        curveness: 0.06,
      },
    })
  })

  const sampleOnus = onus.filter((_, idx) => idx % 2 === 0).slice(0, 36)
  sampleOnus.forEach((o, i) => {
    const parent = o.parentOdnId
    const siblings = sampleOnus.filter((x) => x.parentOdnId === parent)
    const si = siblings.findIndex((x) => x.id === o.id)
    const parentNode = nodes.find((n) => n.id === parent) as { x: number; y: number } | undefined
    const baseX = parentNode?.x ?? 0
    nodes.push({
      id: o.id,
      name: o.name,
      category: 4,
      x: baseX - 30 + si * 28,
      y: 480 + (i % 3) * 18,
      fixed: true,
      ...glow(statusColor[o.status], o.type === 'AP' ? 16 : 14, o.id),
      detail: o,
    })
    links.push({
      source: parent,
      target: o.id,
      lineStyle: { color: 'rgba(143,163,194,0.4)', width: 1, curveness: 0.04 },
    })
  })

  return {
    backgroundColor: 'transparent',
    animationDuration: 1400,
    animationEasingUpdate: 'cubicOut' as const,
    tooltip: {
      formatter: (p: { data?: { name?: string; detail?: Record<string, unknown> } }) => {
        const d = p.data?.detail
        if (!d) return p.data?.name || ''
        if ('tech' in d && 'ponPorts' in d) {
          return `${d.name}<br/>型号: ${d.model}<br/>制式: ${d.tech}<br/>PON口: ${d.usedPonPorts}/${d.ponPorts}<br/>状态: ${d.status}`
        }
        if ('splitRatio' in d) {
          return `${d.name}<br/>分光比: ${d.splitRatio}<br/>位置: ${d.location}<br/>层级: ${d.level}级`
        }
        if ('rxPowerDbm' in d) {
          return `${d.name}<br/>类型: ${d.type}<br/>${d.floor}F ${d.room}<br/>Rx: ${d.rxPowerDbm} dBm<br/>用户: ${d.onlineUsers}`
        }
        return String(d.desc || p.data?.name)
      },
    },
    legend: [
      {
        data: ['核心', 'OLT', '一级分光', '二级分光', 'ONU/光AP'],
        textStyle: { color: '#8fa3c2' },
        top: 0,
      },
    ],
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        draggable: true,
        categories: [
          { name: '核心' },
          { name: 'OLT' },
          { name: '一级分光' },
          { name: '二级分光' },
          { name: 'ONU/光AP' },
        ],
        label: {
          show: true,
          position: 'bottom',
          color: '#c9d7ef',
          fontSize: 10,
          formatter: (p: { data: { category: number; name: string } }) =>
            p.data.category >= 4 ? '' : p.data.name.replace(/弱电间-|走廊-/g, ''),
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 6],
        lineStyle: { curveness: 0.08, opacity: 0.85 },
        data: nodes,
        links,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 3, opacity: 1, shadowBlur: 10, shadowColor: 'rgba(58,160,255,0.7)' },
          itemStyle: { shadowBlur: 30 },
        },
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
          <h3 class="pol-title">OLT → ODN（多级分光）→ ONU / 光网 AP</h3>
          <div class="pol-sub">二级分光架构示意 · 可拖拽缩放 · 点击节点查看详情（演示采样 ONU）</div>
        </div>
        <el-tag effect="plain" class="tech-tag">GPON / XGS-PON Combo</el-tag>
      </div>
      <div class="chart-box">
        <transition name="page-fade">
          <div v-if="booting" class="skeleton" key="sk">
            <div class="sk-pulse" />
            <div class="pol-sub">拓扑光路展开中…</div>
          </div>
          <v-chart v-else class="chart" :option="graphOption" autoresize @click="onClick" />
        </transition>
      </div>
    </div>
    <aside class="pol-panel detail" :class="{ pulse: !!selected }">
      <h3 class="pol-title">节点详情</h3>
      <template v-if="selected">
        <div class="neon-badge" style="margin-bottom: 10px; width: fit-content">已选中 · 光路聚焦</div>
        <el-descriptions :column="1" size="small" border class="desc">
          <el-descriptions-item v-for="(v, k) in selected" :key="String(k)" :label="String(k)">
            {{ Array.isArray(v) ? v.join('、') : v }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <div v-else class="pol-sub empty">点击拓扑中的节点查看型号、分光比、光功率等信息</div>
      <div class="legend-box">
        <div class="pol-title" style="margin-bottom: 8px">图例</div>
        <div><span class="status-dot status-online" />在线（节点发光）</div>
        <div><span class="status-dot status-warning" />告警</div>
        <div><span class="status-dot status-offline" />离线</div>
        <div class="pol-sub" style="margin-top: 10px">虚线：OLT 双归属 · 选中节点脉冲高亮</div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.topo {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 12px;
  min-height: 640px;
}
.canvas-wrap, .detail { padding: 14px 16px; }
.head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
.tech-tag {
  border-color: rgba(58,160,255,0.45) !important;
  box-shadow: 0 0 12px rgba(58,160,255,0.25);
}
.chart-box { position: relative; min-height: 620px; }
.chart { height: 620px; width: 100%; }
.skeleton {
  height: 620px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background:
    radial-gradient(circle at 50% 30%, rgba(58,160,255,0.12), transparent 45%),
    linear-gradient(180deg, rgba(10,20,40,0.4), transparent);
}
.sk-pulse {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid rgba(58,160,255,0.55);
  box-shadow: 0 0 24px rgba(58,160,255,0.45), inset 0 0 20px rgba(25,230,194,0.25);
  animation: topo-boot 1s ease-in-out infinite;
}
@keyframes topo-boot {
  0%, 100% { transform: scale(0.92); opacity: 0.7; }
  50% { transform: scale(1.08); opacity: 1; }
}
.detail { display: flex; flex-direction: column; gap: 12px; transition: box-shadow 0.3s ease; }
.detail.pulse {
  box-shadow: 0 0 28px rgba(58, 160, 255, 0.35), inset 0 1px 0 rgba(255,255,255,0.06);
  border-color: rgba(80, 210, 255, 0.55);
}
.empty { margin-top: 16px; }
.legend-box {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(64,158,255,0.15);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.desc { --el-fill-color-blank: transparent; }
@media (max-width: 1100px) {
  .topo { grid-template-columns: 1fr; }
  .chart-box, .chart, .skeleton { height: 480px; min-height: 480px; }
}
</style>
