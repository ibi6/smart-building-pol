<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    decimals?: number
    suffix?: string
    prefix?: string
  }>(),
  { duration: 1100, decimals: 0, suffix: '', prefix: '' },
)

const display = ref(props.prefix + format(0) + props.suffix)
let raf = 0

function format(n: number) {
  return props.decimals > 0 ? n.toFixed(props.decimals) : String(Math.round(n))
}

function animate(to: number) {
  cancelAnimationFrame(raf)
  const from = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    const cur = from + (to - from) * eased
    display.value = props.prefix + format(cur) + props.suffix
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => animate(props.value))
watch(
  () => props.value,
  (v) => animate(v),
)
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="count-up">{{ display }}</span>
</template>

<style scoped>
.count-up {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
</style>
