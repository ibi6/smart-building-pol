<script setup lang="ts">
import { computed, ref } from 'vue'
import { olts, odns, onus } from '@/mock/data'
import type { DeviceStatus } from '@/types'

const tab = ref('olt')
const keyword = ref('')
const statusFilter = ref<DeviceStatus | 'all'>('all')

function matchKw(text: string) {
  return !keyword.value || text.toLowerCase().includes(keyword.value.toLowerCase())
}

const oltRows = computed(() =>
  olts.filter(
    (o) =>
      (statusFilter.value === 'all' || o.status === statusFilter.value) &&
      matchKw(`${o.id} ${o.name} ${o.model} ${o.location}`),
  ),
)
const odnRows = computed(() =>
  odns.filter(
    (o) =>
      (statusFilter.value === 'all' || o.status === statusFilter.value) &&
      matchKw(`${o.id} ${o.name} ${o.location} ${o.splitRatio}`),
  ),
)
const onuRows = computed(() =>
  onus.filter(
    (o) =>
      (statusFilter.value === 'all' || o.status === statusFilter.value) &&
      matchKw(`${o.id} ${o.name} ${o.model} ${o.room} ${o.area}`),
  ),
)

const statusLabel: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护',
}
</script>

<template>
  <div class="devices page-motion">
    <div class="pol-panel toolbar">
      <el-radio-group v-model="tab" size="small">
        <el-radio-button value="olt">OLT（{{ olts.length }}）</el-radio-button>
        <el-radio-button value="odn">分光器 ODN（{{ odns.length }}）</el-radio-button>
        <el-radio-button value="onu">ONU / 光 AP（{{ onus.length }}）</el-radio-button>
      </el-radio-group>
      <div class="filters">
        <el-input v-model="keyword" clearable placeholder="搜索名称 / 型号 / 位置" style="width: 240px" />
        <el-select v-model="statusFilter" style="width: 120px">
          <el-option label="全部状态" value="all" />
          <el-option label="在线" value="online" />
          <el-option label="告警" value="warning" />
          <el-option label="离线" value="offline" />
        </el-select>
      </div>
    </div>

    <div class="pol-panel table-wrap">
      <el-table v-if="tab === 'olt'" :data="oltRows" stripe height="620">
        <el-table-column prop="id" label="设备 ID" width="100" />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="model" label="型号" min-width="160" />
        <el-table-column prop="tech" label="制式" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-dot', `status-${row.status}`]" />{{ statusLabel[row.status as DeviceStatus] }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="160" />
        <el-table-column label="上下行 (Gbps)" width="130">
          <template #default="{ row }">{{ row.uplinkGbps }} / {{ row.downlinkGbps }}</template>
        </el-table-column>
        <el-table-column label="PON 口" width="90">
          <template #default="{ row }">{{ row.usedPonPorts }}/{{ row.ponPorts }}</template>
        </el-table-column>
        <el-table-column prop="dualHomedWith" label="双归属对端" width="120" />
        <el-table-column label="CPU / 温度" width="110">
          <template #default="{ row }">{{ row.cpuPercent }}% / {{ row.tempC }}℃</template>
        </el-table-column>
      </el-table>

      <el-table v-else-if="tab === 'odn'" :data="odnRows" stripe height="620">
        <el-table-column prop="id" label="设备 ID" width="120" />
        <el-table-column prop="name" label="名称" min-width="160" />
        <el-table-column prop="model" label="型号" width="110" />
        <el-table-column prop="splitRatio" label="分光比" width="90" />
        <el-table-column prop="level" label="分光层级" width="100">
          <template #default="{ row }">{{ row.level }} 级</template>
        </el-table-column>
        <el-table-column prop="floor" label="楼层" width="70" />
        <el-table-column prop="location" label="位置" min-width="140" />
        <el-table-column prop="parentId" label="上联" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-dot', `status-${row.status}`]" />{{ statusLabel[row.status as DeviceStatus] }}
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else :data="onuRows" stripe height="620">
        <el-table-column prop="id" label="设备 ID" width="100" />
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="type" label="类型" width="70" />
        <el-table-column prop="model" label="型号" min-width="130" />
        <el-table-column prop="tech" label="制式" width="100" />
        <el-table-column label="楼层/房间" width="110">
          <template #default="{ row }">{{ row.floor }}F / {{ row.room }}</template>
        </el-table-column>
        <el-table-column prop="area" label="区域" width="110" />
        <el-table-column label="上下行 (Mbps)" width="140">
          <template #default="{ row }">{{ row.uplinkMbps }} / {{ row.downlinkMbps }}</template>
        </el-table-column>
        <el-table-column label="Rx/Tx (dBm)" width="120">
          <template #default="{ row }">{{ row.rxPowerDbm }} / {{ row.txPowerDbm }}</template>
        </el-table-column>
        <el-table-column prop="onlineUsers" label="在线用户" width="90" />
        <el-table-column prop="parentOdnId" label="上联分光" width="120" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-dot', `status-${row.status}`]" />{{ statusLabel[row.status as DeviceStatus] }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.devices { display: flex; flex-direction: column; gap: 12px; }
.toolbar {
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.filters { display: flex; gap: 8px; }
.table-wrap { padding: 8px; }

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
