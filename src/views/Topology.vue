<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { olts, odns, onus } from '@/mock/data'
import type { DeviceStatus } from '@/types'

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent])

const selected = ref<Record<string, unknown> | null>(null)

const statusColor: Record<DeviceStatus, string> = {
  online: '#2ce6a4',
  offline: '#6b778c',
  warning: '#ffb020',
  maintenance: '#3aa0ff',
}

const graphOption = computed(() => {
  const nodes: Array<Record<string, unknown>> = []
  const links: Array<Record<string, unknown>> = []

  nodes.push({
    id: 'CORE',
    name: '楼宇核心交换机',
    category: 0,
    symbolSize: 46,
    x: 0,
    y: 0,
    fixed: true,
    itemStyle: { color: '#19e6c2' },
    detail: { type: 'CORE', desc: '上联园区核心 / 互联网出口' },
  })

  olts.forEach((o, i) => {
    nodes.push({
      id: o.id,
      name: o.name,
      category: 1,
      symbolSize: 40,
      x: i === 0 ? -180 : 180,
      y: 100,
      fixed: true,
      itemStyle: { color: statusColor[o.status] },
      detail: o,
    })
    links.push({ source: 'CORE', target: o.id, lineStyle: { color: 'rgba(25,230,194,0.55)', width: 2 } })
  })

  // dual-home visual link
  links.push({
    source: 'OLT-01',
    target: 'OLT-02',
    lineStyle: { type: 'dashed', color: 'rgba(255,176,32,0.7)', width: 1.5 },
    label: { show: true, formatter: '双归属保护', color: '#ffb020', fontSize: 10 },
  })

  const l1 = odns.filter((d) => d.level === 1)
  l1.forEach((d, i) => {
    const x = -420 + (i * 170)
    nodes.push({
      id: d.id,
      name: d.name,
      category: 2,
      symbolSize: 28,
      x,
      y: 230,
      fixed: true,
      itemStyle: { color: statusColor[d.status] },
      detail: d,
    })
    links.push({ source: d.parentId, target: d.id, lineStyle: { color: 'rgba(58,160,255,0.45)' } })
  })

  const l2 = odns.filter((d) => d.level === 2)
  l2.forEach((d, i) => {
    const x = -520 + i * 95
    nodes.push({
      id: d.id,
      name: d.name,
      category: 3,
      symbolSize: 22,
      x,
      y: 360,
      fixed: true,
      itemStyle: { color: statusColor[d.status] },
      detail: d,
    })
    links.push({ source: d.parentId, target: d.id, lineStyle: { color: 'rgba(58,160,255,0.35)' } })
  })

  // sample ONU nodes under each L2 (limit for readability)
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
      symbolSize: o.type === 'AP' ? 16 : 14,
      x: baseX - 30 + si * 28,
      y: 480 + (i % 3) * 18,
      fixed: true,
      itemStyle: { color: statusColor[o.status] },
      detail: o,
    })
    links.push({ source: parent, target: o.id, lineStyle: { color: 'rgba(143,163,194,0.35)', width: 1 } })
  })

  return {
    backgroundColor: 'transparent',
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
        lineStyle: { curveness: 0.08 },
        data: nodes,
        links,
        emphasis: { focus: 'adjacency' },
      },
    ],
  }
})

function onClick(params: Record<string, unknown>) {
  const data = params.data as { detail?: Record<string, unknown>; name?: string } | undefined
  if (params.dataType === 'node' && data?.detail) {
    selected.value = { name: data.name, ...data.detail }
  }
}
</script>

<template>
  <div class="topo">
    <div class="pol-panel canvas-wrap">
      <div class="head">
        <div>
          <h3 class="pol-title">OLT → ODN（多级分光）→ ONU / 光网 AP</h3>
          <div class="pol-sub">二级分光架构示意 · 可拖拽缩放 · 点击节点查看详情（演示采样 ONU）</div>
        </div>
        <el-tag effect="plain">GPON / XGS-PON Combo</el-tag>
      </div>
      <v-chart class="chart" :option="graphOption" autoresize @click="onClick" />
    </div>
    <aside class="pol-panel detail">
      <h3 class="pol-title">节点详情</h3>
      <template v-if="selected">
        <el-descriptions :column="1" size="small" border class="desc">
          <el-descriptions-item v-for="(v, k) in selected" :key="String(k)" :label="String(k)">
            {{ Array.isArray(v) ? v.join('、') : v }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
      <div v-else class="pol-sub empty">点击拓扑中的节点查看型号、分光比、光功率等信息</div>
      <div class="legend-box">
        <div class="pol-title" style="margin-bottom: 8px">图例</div>
        <div><span class="status-dot status-online" />在线</div>
        <div><span class="status-dot status-warning" />告警</div>
        <div><span class="status-dot status-offline" />离线</div>
        <div class="pol-sub" style="margin-top: 10px">虚线：OLT 双归属保护关系</div>
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
.chart { height: 620px; width: 100%; }
.detail { display: flex; flex-direction: column; gap: 12px; }
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
}
</style>
