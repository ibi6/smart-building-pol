<script setup lang="ts">
import { computed } from 'vue'
import { alarms } from '@/mock/data'

const line = computed(() =>
  alarms
    .slice(0, 6)
    .map((a) => `${a.time.slice(11)} ${a.severity} ${a.deviceName}：${a.title}`)
    .join('  |  '),
)
</script>

<template>
  <div class="ticker" aria-label="告警滚动条">
    <div class="ticker-label">告警</div>
    <div class="ticker-track">
      <div class="ticker-inner">{{ line }}  |  {{ line }}</div>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.08);
  overflow: hidden;
}
.ticker-label {
  font-size: 12px;
  font-weight: 700;
  color: #fecaca;
  white-space: nowrap;
}
.ticker-track { overflow: hidden; }
.ticker-inner {
  display: inline-block;
  white-space: nowrap;
  font-size: 12px;
  color: #fecaca;
  animation: marquee 32s linear infinite;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
</style>
