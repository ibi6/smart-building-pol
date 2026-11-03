<script setup lang="ts">
import { computed, ref } from 'vue'
import { alarms as seed } from '@/mock/data'
import type { AlarmItem, AlarmSeverity, FaultDomain } from '@/types'

const list = ref<AlarmItem[]>(seed.map((a) => ({ ...a })))
const severity = ref<AlarmSeverity | 'all'>('all')
const domain = ref<FaultDomain | 'all'>('all')
const onlyUnacked = ref(false)
const active = ref<AlarmItem | null>(list.value[0] || null)

const filtered = computed(() =>
  list.value.filter((a) => {
    if (severity.value !== 'all' && a.severity !== severity.value) return false
    if (domain.value !== 'all' && a.domain !== domain.value) return false
    if (onlyUnacked.value && a.acked) return false
    return true
  }),
)

const domainTips: Record<FaultDomain, string> = {
  光路: '定界思路：OLT PON 口光功率/误码 → 一级分光 → 二级分光 → ONU Rx。多点同时告警优先查公共上联光缆与法兰。',
  设备: '定界思路：确认供电/温度/软件版本；区分单设备故障与同机房环境问题；安防切片设备优先恢复。',
  端口: '定界思路：PON 口或用户侧以太网口；检查光模块、跳纤、双工与环路；必要时倒换双归属备用路径。',
}

function ack(row: AlarmItem) {
  row.acked = true
}

function select(row: AlarmItem) {
  active.value = row
}

const severityType = (s: AlarmSeverity) => {
  if (s === 'critical') return 'danger'
  if (s === 'major') return 'warning'
  if (s === 'minor') return 'info'
  return 'success'
}
</script>

<template>
  <div class="alarms">
    <div class="pol-panel toolbar">
      <el-select v-model="severity" style="width: 140px" size="small">
        <el-option label="全部级别" value="all" />
        <el-option label="紧急 critical" value="critical" />
        <el-option label="重要 major" value="major" />
        <el-option label="次要 minor" value="minor" />
        <el-option label="提示 info" value="info" />
      </el-select>
      <el-select v-model="domain" style="width: 140px" size="small">
        <el-option label="全部域" value="all" />
        <el-option label="光路" value="光路" />
        <el-option label="设备" value="设备" />
        <el-option label="端口" value="端口" />
      </el-select>
      <el-checkbox v-model="onlyUnacked">仅未确认</el-checkbox>
      <span class="pol-sub">共 {{ filtered.length }} 条</span>
    </div>

    <div class="body">
      <div class="pol-panel table-wrap">
        <el-table
          :data="filtered"
          stripe
          height="600"
          highlight-current-row
          @row-click="select"
        >
          <el-table-column prop="time" label="时间" width="160" />
          <el-table-column prop="severity" label="级别" width="100">
            <template #default="{ row }">
              <el-tag :type="severityType(row.severity)" size="small">{{ row.severity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="domain" label="定界域" width="90" />
          <el-table-column prop="deviceName" label="设备" min-width="160" show-overflow-tooltip />
          <el-table-column prop="title" label="告警标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.acked ? 'info' : 'danger'" size="small">{{ row.acked ? '已确认' : '未确认' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" :disabled="row.acked" @click.stop="ack(row)">确认</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <aside class="pol-panel detail" v-if="active">
        <h3 class="pol-title">故障定界说明</h3>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="告警 ID">{{ active.id }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ active.deviceName }}（{{ active.deviceId }}）</el-descriptions-item>
          <el-descriptions-item label="标题">{{ active.title }}</el-descriptions-item>
          <el-descriptions-item label="定界域">{{ active.domain }}</el-descriptions-item>
        </el-descriptions>
        <div class="box">
          <div class="pol-sub">处理建议</div>
          <p>{{ active.suggestion }}</p>
        </div>
        <div class="box">
          <div class="pol-sub">{{ active.domain }}域通用定界</div>
          <p>{{ domainTips[active.domain] }}</p>
        </div>
        <el-alert
          title="答辩提示"
          type="info"
          :closable="false"
          description="全光网运维强调“光路优先定界”：先定位公共光路，再下探到 ONU/端口，避免盲目换机。"
        />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.alarms { display: flex; flex-direction: column; gap: 12px; }
.toolbar {
  padding: 12px 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.body { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
.table-wrap, .detail { padding: 12px; }
.detail { display: flex; flex-direction: column; gap: 12px; }
.box {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(58, 160, 255, 0.08);
  border: 1px solid rgba(64, 158, 255, 0.2);
}
.box p { margin: 6px 0 0; line-height: 1.6; font-size: 13px; }
@media (max-width: 1100px) {
  .body { grid-template-columns: 1fr; }
}
</style>
