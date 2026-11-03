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
  { duration: 1200, decimals: 0, suffix: '', prefix: '' },
)

const display = ref(props.prefix + format(0) + props.suffix)
let raf = 0

function format(n: number) {
  if (props.decimals > 0) return n.toFixed(props.decimals)
  return Math.round(n).toLocaleString('zh-CN')
}

function animate(to: number) {
  cancelAnimationFrame(raf)
  const reduced = document.documentElement.classList.contains('reduce-motion')
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    display.value = props.prefix + format(to) + props.suffix
    return
  }
  const from = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = props.prefix + format(from + (to - from) * eased) + props.suffix
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => animate(props.value))
watch(() => props.value, (v) => animate(v))
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <span class="count-up">{{ display }}</span>
</template>

<style scoped>
.count-up {
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
}
</style>
