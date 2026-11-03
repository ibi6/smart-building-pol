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
  '读取楼层与点位参数',
  '估算每层并发密度',
  '选择 PON 制式',
  '计算分光比与 OLT 数量',
  '生成设备清单与切片建议',
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
      progress.value = Math.min(target, progress.value + 5)
      await new Promise((r) => setTimeout(r, 24))
    }
    await new Promise((r) => setTimeout(r, 80))
  }
  result.value = generatePlan({ ...form, bizTypes: [...form.bizTypes] })
  loading.value = false
  await nextTick()
  showResults.value = true
}

const resultBlocks = computed(() => !!(showResults.value && result.value))
</script>

<template>
  <div class="planner">
    <section class="pol-panel form-panel">
      <div class="head">
        <div>
          <h3 class="pol-title">组网规划</h3>
          <div class="pol-sub">根据楼宇条件估算 OLT / ODN / ONU 规模，输出可解释的推荐方案（规则引擎，无外部接口）</div>
        </div>
        <span class="tag-pill">规划工具</span>
      </div>

      <div class="presets">
        <span class="pol-sub">常用场景：</span>
        <el-button v-for="p in presets" :key="p.id" size="small" @click="applyPreset(p.id)">{{ p.name }}</el-button>
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
          <el-switch v-model="form.dualOlt" active-text="启用" inactive-text="不启用" />
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
          <el-button type="primary" size="large" :loading="loading" @click="run">生成方案</el-button>
          <span class="pol-sub">结果依据密度、带宽档位、业务与预算规则给出，便于答辩说明</span>
        </el-form-item>
      </el-form>
    </section>

    <section v-if="loading" class="pol-panel computing">
      <el-progress type="circle" :percentage="progress" :width="88" color="#3b82f6" />
      <div>
        <div class="pol-title">正在计算</div>
        <div class="phase">{{ computePhase }}</div>
        <div class="pol-sub">进度 {{ progress }}%</div>
      </div>
    </section>

    <template v-if="resultBlocks && result">
      <section class="pol-panel result-block cascade-item" style="--i: 0">
        <div class="result-head">
          <h3 class="pol-title">方案结果</h3>
          <span class="tag-pill">推荐配置</span>
        </div>
        <p class="summary">{{ result.summary }}</p>
        <div class="tags">
          <el-tag type="success" effect="plain">制式 {{ result.tech }}</el-tag>
          <el-tag effect="plain">分光 {{ result.l1Ratio }} × {{ result.l2Ratio }}（{{ result.effectiveRatio }}）</el-tag>
          <el-tag type="warning" effect="plain">OLT × {{ result.oltCount }}</el-tag>
          <el-tag effect="plain">PON 口 {{ result.ponPortsNeeded }} / {{ result.ponPortsProvisioned }}</el-tag>
        </div>
      </section>

      <section class="mid">
        <div class="pol-panel result-block cascade-item" style="--i: 1">
          <h3 class="pol-title">计算依据</h3>
          <ul class="reasons"><li v-for="(line, i) in result.reasonLines" :key="i">{{ line }}</li></ul>
          <div class="kv">
            <div><span class="pol-sub">OLT 型号档位</span><strong>{{ result.oltModel }}</strong></div>
            <div><span class="pol-sub">一/二级分光器</span><strong>{{ result.l1Count }} / {{ result.l2Count }} 台</strong></div>
            <div><span class="pol-sub">有线 ONU / 光 AP</span><strong>{{ result.onuTotal }} / {{ result.apTotal }} 台</strong></div>
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
        <h3 class="pol-title">设备清单（估算）</h3>
        <el-table :data="result.bom" stripe>
          <el-table-column prop="name" label="设备" width="140" />
          <el-table-column prop="modelHint" label="型号/档位" min-width="200" />
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column prop="unit" label="单位" width="70" />
          <el-table-column prop="note" label="说明" min-width="160" />
        </el-table>
      </section>

      <section class="pol-panel result-block cascade-item" style="--i: 4">
        <h3 class="pol-title">按楼层部署建议</h3>
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
        <h3 class="pol-title">与传统三层交换对比（要点）</h3>
        <ul class="reasons"><li v-for="(line, i) in result.vsTraditional" :key="'v'+i">{{ line }}</li></ul>
      </section>
    </template>

    <section v-else-if="!loading" class="pol-panel empty">
      <div class="empty-state">
        <div class="icon">+</div>
        <div class="pol-sub">填写参数或选择常用场景后，点击「生成方案」</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.planner { display: flex; flex-direction: column; gap: 12px; }
.form-panel, .result-block, .empty, .computing { padding: 14px 16px; }
.head { margin-bottom: 10px; display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
.presets { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
.preset-desc { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.chip { border: 1px solid rgba(86,120,168,0.35); border-radius: 999px; padding: 2px 10px; }
.grid-form { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 4px 16px; }
.span-2 { grid-column: span 2; }
.actions { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.computing { display: flex; align-items: center; gap: 18px; }
.phase { margin: 6px 0; font-size: 14px; }
.result-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.summary { line-height: 1.7; margin: 8px 0 12px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.mid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; }
.reasons { margin: 8px 0 0; padding-left: 18px; line-height: 1.7; }
.kv { display: grid; gap: 10px; margin-top: 14px; }
.kv strong { display: block; margin-top: 2px; }
.cascade-item {
  animation: card-rise 0.4s ease both;
  animation-delay: calc(var(--i, 0) * 0.08s);
}
@media (max-width: 1100px) {
  .grid-form, .mid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>
