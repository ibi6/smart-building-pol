<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import {
  generatePlan,
  presets,
  type BizType,
  type PlannerInput,
  type PlannerResult,
} from '@/planner/engine'

const form = reactive<PlannerInput>({
  floors: 18,
  pointsPerFloor: 24,
  peakUsers: 1800,
  bizTypes: ['办公', '访客', '安防', '无线高密'],
  bandwidthTier: '万兆上行',
  dualOlt: true,
  budget: '均衡',
  splitPref: '等比',
})

const result = ref<PlannerResult | null>(null)
const loading = ref(false)
const showResults = ref(false)
const computePhase = ref('')
const progress = ref(0)

const bizOptions: BizType[] = ['办公', '访客', '安防', '物联', '无线高密']
const phases = [
  '注入楼宇几何约束…',
  '演算接入密度与热点…',
  '匹配 GPON / XGS-PON 制式…',
  '寻优分光比与 OLT 冗余…',
  '编排切片与设备 BOM…',
  '凝固最优全光方案…',
]

function applyPreset(id: string) {
  const p = presets.find((x) => x.id === id)
  if (!p) return
  Object.assign(form, { ...p.input, bizTypes: [...p.input.bizTypes] })
  result.value = null
  showResults.value = false
}

async function run() {
  loading.value = true
  showResults.value = false
  result.value = null
  progress.value = 0
  for (let i = 0; i < phases.length; i++) {
    computePhase.value = phases[i]
    const target = Math.round(((i + 1) / phases.length) * 100)
    while (progress.value < target) {
      progress.value = Math.min(target, progress.value + 4)
      await new Promise((r) => setTimeout(r, 28))
    }
    await new Promise((r) => setTimeout(r, 120))
  }
  result.value = generatePlan({ ...form, bizTypes: [...form.bizTypes] })
  loading.value = false
  await nextTick()
  showResults.value = true
}

const resultBlocks = computed(() => !!(showResults.value && result.value))
const ringStyle = computed(() => ({
  background: `conic-gradient(from 210deg, #22d3ee ${progress.value}%, rgba(255,255,255,0.08) 0)`,
}))
</script>

<template>
  <div class="planner">
    <section class="pol-panel form-panel">
      <div class="flow-line" style="top: 0" />
      <div class="head">
        <div>
          <h3 class="pol-title">方案测算 · 智能规划引擎</h3>
          <div class="pol-sub">输入约束 → 可解释规则寻优 → 输出答辩级全光组网方案</div>
        </div>
        <span class="neon-badge">RULE ENGINE</span>
      </div>

      <div class="presets">
        <span class="pol-sub">场景预设：</span>
        <el-button v-for="p in presets" :key="p.id" size="small" round class="preset-btn" @click="applyPreset(p.id)">
          {{ p.name }}
        </el-button>
      </div>
      <div class="preset-desc pol-sub">
        <span v-for="p in presets" :key="p.id + '-d'" class="chip">{{ p.name }}：{{ p.desc }}</span>
      </div>

      <el-form label-position="top" class="grid-form">
        <el-form-item label="楼层数"><el-input-number v-model="form.floors" :min="1" :max="80" /></el-form-item>
        <el-form-item label="每层房间 / 点位数"><el-input-number v-model="form.pointsPerFloor" :min="1" :max="200" /></el-form-item>
        <el-form-item label="峰值并发用户"><el-input-number v-model="form.peakUsers" :min="1" :max="50000" :step="50" /></el-form-item>
        <el-form-item label="目标带宽档位">
          <el-radio-group v-model="form.bandwidthTier">
            <el-radio-button value="千兆桌面">千兆桌面</el-radio-button>
            <el-radio-button value="万兆上行">万兆上行</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="业务类型（多选）" class="span-2">
          <el-checkbox-group v-model="form.bizTypes">
            <el-checkbox v-for="b in bizOptions" :key="b" :label="b" :value="b">{{ b }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="双 OLT 冗余">
          <el-switch v-model="form.dualOlt" active-text="双归属" inactive-text="单归属" />
        </el-form-item>
        <el-form-item label="预算偏好">
          <el-radio-group v-model="form.budget">
            <el-radio-button value="成本优先">成本优先</el-radio-button>
            <el-radio-button value="均衡">均衡</el-radio-button>
            <el-radio-button value="性能优先">性能优先</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分光策略">
          <el-radio-group v-model="form.splitPref">
            <el-radio-button value="等比">等比</el-radio-button>
            <el-radio-button value="不等比">不等比</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="span-2 actions">
          <el-button type="primary" size="large" class="gen-btn" :loading="loading" @click="run">生成最优方案</el-button>
          <span class="pol-sub">无外部 AI，全程规则可答辩讲解</span>
        </el-form-item>
      </el-form>
    </section>

    <transition name="page-fade">
      <section v-if="loading" class="pol-panel computing" key="computing">
        <div class="ring" :style="ringStyle">
          <div class="ring-core">
            <div class="pct">{{ progress }}%</div>
            <div class="pol-sub">OPTIMIZING</div>
          </div>
        </div>
        <div class="compute-text">
          <div class="neon-badge">演算中</div>
          <h3 class="h-display" style="font-size: 22px">{{ computePhase }}</h3>
          <div class="phase-rail">
            <span v-for="(p, i) in phases" :key="p" class="phase-dot" :class="{ on: progress >= ((i + 1) / phases.length) * 100 }" />
          </div>
          <div class="pol-sub">正在对密度 / 带宽 / 冗余 / 预算做多目标折中…</div>
        </div>
      </section>
    </transition>

    <template v-if="resultBlocks && result">
      <section class="pol-panel result-block cascade-item" style="--i: 0">
        <div class="result-head">
          <h3 class="pol-title">推荐架构摘要</h3>
          <span class="neon-badge">★ 最优方案锁定</span>
        </div>
        <p class="summary">{{ result.summary }}</p>
        <div class="tags">
          <el-tag effect="dark" type="success">制式 {{ result.tech }}</el-tag>
          <el-tag effect="dark">分光 {{ result.l1Ratio }} × {{ result.l2Ratio }}（{{ result.effectiveRatio }}）</el-tag>
          <el-tag effect="dark" type="warning">OLT × {{ result.oltCount }}</el-tag>
          <el-tag effect="dark">PON {{ result.ponPortsNeeded }}/{{ result.ponPortsProvisioned }}</el-tag>
        </div>
      </section>

      <section class="mid">
        <div class="pol-panel result-block cascade-item" style="--i: 1">
          <h3 class="pol-title">规则推导说明</h3>
          <ul class="reasons"><li v-for="(line, i) in result.reasonLines" :key="i">{{ line }}</li></ul>
          <div class="kv">
            <div><span class="pol-sub">OLT 档位</span><strong>{{ result.oltModel }}</strong></div>
            <div><span class="pol-sub">一/二级分光器</span><strong>{{ result.l1Count }} / {{ result.l2Count }}</strong></div>
            <div><span class="pol-sub">ONU / 光 AP</span><strong>{{ result.onuTotal }} / {{ result.apTotal }}</strong></div>
          </div>
        </div>
        <div class="pol-panel result-block cascade-item" style="--i: 2">
          <h3 class="pol-title">VLAN / 切片建议</h3>
          <el-table :data="result.slices" size="small" stripe>
            <el-table-column prop="name" label="切片" width="100" />
            <el-table-column prop="vlanId" label="VLAN" width="80" />
            <el-table-column prop="priority" label="优先级" width="80" />
            <el-table-column prop="note" label="说明" min-width="160" />
          </el-table>
        </div>
      </section>

      <section class="pol-panel result-block cascade-item" style="--i: 3">
        <h3 class="pol-title">关键设备清单</h3>
        <el-table :data="result.bom" stripe>
          <el-table-column prop="name" label="设备" width="140" />
          <el-table-column prop="modelHint" label="型号/档位" min-width="200" />
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column prop="unit" label="单位" width="70" />
          <el-table-column prop="note" label="说明" min-width="160" />
        </el-table>
      </section>

      <section class="pol-panel result-block cascade-item" style="--i: 4">
        <h3 class="pol-title">楼层部署建议</h3>
        <el-table :data="result.floorPlans" stripe height="360">
          <el-table-column prop="floor" label="楼层" width="80">
            <template #default="{ row }">{{ row.floor }}F</template>
          </el-table-column>
          <el-table-column prop="onuWired" label="有线 ONU" width="100" />
          <el-table-column prop="opticalAp" label="光网 AP" width="100" />
          <el-table-column prop="areaHint" label="区域建议" min-width="220" />
        </el-table>
      </section>

      <section class="pol-panel result-block cascade-item" style="--i: 5">
        <h3 class="pol-title">相对传统三层交换</h3>
        <ul class="reasons"><li v-for="(line, i) in result.vsTraditional" :key="'v'+i">{{ line }}</li></ul>
      </section>
    </template>

    <section v-else-if="!loading" class="pol-panel empty">
      <div class="empty-art">
        <div class="empty-orb" />
        <div class="pol-sub">选择预设或填写约束，生成你的最优全光组网方案</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.planner { display: flex; flex-direction: column; gap: 12px; }
.form-panel, .result-block, .empty, .computing { padding: 16px 18px; }
.head { margin-bottom: 10px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.presets { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
.preset-btn:hover { box-shadow: 0 0 16px rgba(34, 211, 238, 0.35); transform: translateY(-2px); }
.preset-desc { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.chip { border: 1px solid rgba(56,189,248,0.25); border-radius: 999px; padding: 2px 10px; background: rgba(34,211,238,0.06); }
.grid-form { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 4px 16px; }
.span-2 { grid-column: span 2; }
.actions { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.gen-btn { min-width: 180px; }
.computing {
  display: flex; align-items: center; gap: 22px; min-height: 148px;
  border-color: rgba(167, 139, 250, 0.55) !important;
  background: linear-gradient(120deg, rgba(34,211,238,0.08), rgba(167,139,250,0.1));
}
.ring {
  width: 110px; height: 110px; border-radius: 50%; padding: 8px;
  box-shadow: 0 0 30px rgba(34,211,238,0.35); flex-shrink: 0;
}
.ring-core {
  width: 100%; height: 100%; border-radius: 50%;
  background: rgba(3, 7, 18, 0.92);
  display: grid; place-items: center; align-content: center; gap: 2px;
}
.pct { font-family: var(--font-mono); font-size: 22px; font-weight: 800; color: #67e8f9; }
.compute-text { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.phase-rail { display: flex; gap: 8px; flex-wrap: wrap; }
.phase-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(56,189,248,0.35);
  transition: 0.25s ease;
}
.phase-dot.on {
  background: linear-gradient(90deg, #22d3ee, #e879f9);
  box-shadow: 0 0 10px rgba(34,211,238,0.7);
}
.result-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.summary { line-height: 1.75; margin: 8px 0 12px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.mid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; }
.reasons { margin: 8px 0 0; padding-left: 18px; line-height: 1.75; }
.kv { display: grid; gap: 10px; margin-top: 14px; }
.kv strong { display: block; margin-top: 2px; }
.cascade-item {
  animation: card-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 0.12s);
}
@media (max-width: 1100px) {
  .grid-form, .mid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
  .computing { flex-direction: column; text-align: center; }
}
</style>
