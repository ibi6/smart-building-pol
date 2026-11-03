<script setup lang="ts">
import { computed } from 'vue'
import { alarms } from '@/mock/data'

const line = computed(() =>
  alarms
    .slice(0, 6)
    .map((a) => `[${a.severity.toUpperCase()}] ${a.deviceName} · ${a.title}`)
    .join('　　✦　　'),
)
</script>

<template>
  <div class="ticker" aria-label="告警滚动">
    <div class="ticker-label">LIVE ALERT</div>
    <div class="ticker-track">
      <div class="ticker-inner">{{ line }}　　✦　　{{ line }}</div>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  border-radius: 12px;
  border: 1px solid rgba(251, 113, 133, 0.28);
  background: linear-gradient(90deg, rgba(251, 113, 133, 0.12), rgba(10, 18, 40, 0.55));
  overflow: hidden;
}
.ticker-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #fecdd3;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(251, 113, 133, 0.25);
  box-shadow: 0 0 12px rgba(251, 113, 133, 0.35);
  white-space: nowrap;
}
.ticker-track { overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.ticker-inner {
  display: inline-block;
  white-space: nowrap;
  font-size: 12px;
  color: #fecaca;
  animation: marquee 28s linear infinite;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
</style>
