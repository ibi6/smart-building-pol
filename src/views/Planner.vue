<script setup lang="ts">
import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
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
  spareFactor: 1.2,
})

const result = ref<PlannerResult | null>(null)
const loading = ref(false)
const showResults = ref(false)
const computePhase = ref('')
const progress = ref(0)
const activeVariant = ref<'recommended' | 'cost' | 'performance'>('recommended')

const bizOptions: BizType[] = ['办公', '访客', '安防', '物联', '无线高密']
const phases = ['校验输入参数', '估算末端规模', '选择制式与分光', '计算 PON/OLT', '生成清单与风险']

function applyPreset(id: string) {
  const p = presets.find((x) => x.id === id)
  if (!p) return
  Object.assign(form, { ...p.input, bizTypes: [...p.input.bizTypes], spareFactor: form.spareFactor ?? 1.2 })
  result.value = null
  showResults.value = false
  ElMessage.success(`已载入场景：${p.name}`)
}

function validate(): string | null {
  if (!form.floors || form.floors < 1) return '楼层数至少为 1'
  if (!form.pointsPerFloor || form.pointsPerFloor < 1) return '每层点位数至少为 1'
  if (!form.peakUsers || form.peakUsers < 1) return '峰值并发用户至少为 1'
  if (!form.bizTypes.length) return '请至少选择一种业务类型'
  if ((form.spareFactor ?? 1.2) < 1 || (form.spareFactor ?? 1.2) > 2) return '预留系数建议在 1.0～2.0'
  const dens = form.peakUsers / form.floors
  if (dens > 500) return '每层峰值用户过高，请检查输入'
  return null
}

async function run() {
  const err = validate()
  if (err) {
    ElMessage.warning(err)
    return
  }
  loading.value = true
  showResults.value = false
  result.value = null
  progress.value = 0
  activeVariant.value = 'recommended'
  for (let i = 0; i < phases.length; i++) {
    computePhase.value = phases[i]
    const target = Math.round(((i + 1) / phases.length) * 100)
    while (progress.value < target) {
      progress.value = Math.min(target, progress.value + 6)
      await new Promise((r) => setTimeout(r, 20))
    }
  }
  result.value = generatePlan({ ...form, bizTypes: [...form.bizTypes] })
  loading.value = false
  await nextTick()
  showResults.value = true
}

const currentVariant = computed(() => {
  if (!result.value) return null
  return result.value.variants.find((v) => v.key === activeVariant.value) || result.value.variants[0]
})

const variantRows = computed(() => {
  if (!result.value) return []
  return result.value.variants.map((v) => ({
    title: v.title,
    tech: v.tech,
    split: `1:${v.l1}×1:${v.l2}`,
    effective: `1:${v.effective}`,
    olt: v.oltCount,
    pon: `${v.ponPortsNeeded}/${v.ponPortsProvisioned}`,
    odn: `${v.l1Count}+${v.l2Count}`,
    endpoints: `${v.onuTotal}+${v.apTotal}`,
    key: v.key,
  }))
})
</script>

<template>
  <div class="planner">
    <section class="pol-panel form-panel">
      <div class="head">
        <div>
          <h3 class="pol-title">组网规划</h3>
          <div class="pol-sub">输入楼宇与业务约束，按规则估算 POL 制式、分光、OLT/PON 口与末端规模（可输出成本/性能对照）</div>
        </div>
        <span class="tag-pill">设计估算</span>
      </div>

      <div class="presets">
        <span class="pol-sub">常用场景</span>
        <el-button v-for="p in presets" :key="p.id" size="small" @click="applyPreset(p.id)">{{ p.name }}</el-button>
      </div>
      <div class="preset-desc pol-sub">
        <span v-for="p in presets" :key="p.id + '-d'" class="chip">{{ p.name }}：{{ p.desc }}</span>
      </div>

      <el-form label-position="top" class="grid-form">
        <el-form-item label="楼层数" required>
          <el-input-number v-model="form.floors" :min="1" :max="80" />
        </el-form-item>
        <el-form-item label="每层房间/点位数" required>
          <el-input-number v-model="form.pointsPerFloor" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="峰值并发用户" required>
          <el-input-number v-model="form.peakUsers" :min="1" :max="50000" :step="50" />
        </el-form-item>
        <el-form-item label="目标带宽">
          <el-radio-group v-model="form.bandwidthTier">
            <el-radio-button value="千兆桌面">千兆桌面</el-radio-button>
            <el-radio-button value="万兆上行">万兆上行</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="业务类型" class="span-2" required>
          <el-checkbox-group v-model="form.bizTypes">
            <el-checkbox v-for="b in bizOptions" :key="b" :label="b" :value="b">{{ b }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="双 OLT 冗余">
          <el-switch v-model="form.dualOlt" active-text="启用" inactive-text="关闭" />
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
        <el-form-item label="容量预留系数">
          <el-input-number v-model="form.spareFactor" :min="1" :max="2" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item class="span-2 actions">
          <el-button type="primary" size="large" :loading="loading" @click="run">生成方案</el-button>
          <span class="pol-sub">输出含公式推导、楼层分布、BOM、风险与成本/性能对照</span>
        </el-form-item>
      </el-form>
    </section>

    <section v-if="loading" class="pol-panel computing">
      <el-progress type="circle" :percentage="progress" :width="86" color="#3b82f6" />
      <div>
        <div class="pol-title">方案计算中</div>
        <div class="phase">{{ computePhase }}</div>
      </div>
    </section>

    <template v-if="showResults && result">
      <section class="metrics stagger">
        <div v-for="m in result.metrics" :key="m.label" class="metric pol-panel">
          <div class="pol-sub">{{ m.label }}</div>
          <div class="metric-val">{{ m.value }}</div>
          <div class="pol-sub">{{ m.tip }}</div>
        </div>
      </section>

      <section class="pol-panel result-block">
        <div class="result-head">
          <h3 class="pol-title">1. 方案综述</h3>
          <span class="tag-pill">推荐</span>
        </div>
        <p class="summary">{{ result.summary }}</p>
        <ul class="reasons"><li v-for="(line, i) in result.reasonLines" :key="i">{{ line }}</li></ul>
      </section>

      <section class="pol-panel result-block">
        <h3 class="pol-title">2. 计算过程（公式）</h3>
        <ol class="formulas">
          <li v-for="(f, i) in result.formulas" :key="i">{{ f }}</li>
        </ol>
      </section>

      <section class="pol-panel result-block">
        <div class="result-head">
          <h3 class="pol-title">3. 方案对照（推荐 / 成本 / 性能）</h3>
        </div>
        <el-table :data="variantRows" stripe highlight-current-row @current-change="(row: any) => row && (activeVariant = row.key)">
          <el-table-column prop="title" label="方案" min-width="140" />
          <el-table-column prop="tech" label="制式" width="100" />
          <el-table-column prop="split" label="分光" width="110" />
          <el-table-column prop="effective" label="等效" width="90" />
          <el-table-column prop="olt" label="OLT" width="70" />
          <el-table-column prop="pon" label="PON 需求/配置" width="130" />
          <el-table-column prop="odn" label="一+二级分光" width="110" />
          <el-table-column prop="endpoints" label="ONU+AP" width="100" />
        </el-table>
        <div v-if="currentVariant" class="variant-note pol-sub">
          当前选中：{{ currentVariant.title }} · {{ currentVariant.oltModel }}
        </div>
      </section>

      <section class="two-col">
        <div class="pol-panel result-block">
          <h3 class="pol-title">4. VLAN / 切片</h3>
          <el-table :data="result.slices" size="small" stripe>
            <el-table-column prop="name" label="切片" width="90" />
            <el-table-column prop="vlanId" label="VLAN" width="70" />
            <el-table-column prop="priority" label="优先级" width="80" />
            <el-table-column prop="note" label="说明" min-width="140" />
          </el-table>
        </div>
        <div class="pol-panel result-block">
          <h3 class="pol-title">5. 风险与注意点</h3>
          <ul class="reasons risk"><li v-for="(r, i) in result.risks" :key="i">{{ r }}</li></ul>
          <h3 class="pol-title" style="margin-top: 14px">相对传统交换</h3>
          <ul class="reasons"><li v-for="(r, i) in result.vsTraditional" :key="'t'+i">{{ r }}</li></ul>
        </div>
      </section>

      <section class="pol-panel result-block">
        <h3 class="pol-title">6. 设备清单（BOM 估算）</h3>
        <el-table :data="result.bom" stripe>
          <el-table-column prop="name" label="设备" width="130" />
          <el-table-column prop="modelHint" label="型号/档位" min-width="200" />
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column prop="unit" label="单位" width="70" />
          <el-table-column prop="note" label="说明" min-width="160" />
        </el-table>
      </section>

      <section class="pol-panel result-block">
        <h3 class="pol-title">7. 楼层 ONU / 光 AP 分布</h3>
        <el-table :data="result.floorPlans" stripe height="380">
          <el-table-column prop="floor" label="楼层" width="80">
            <template #default="{ row }">{{ row.floor }}F</template>
          </el-table-column>
          <el-table-column prop="onuWired" label="有线 ONU" width="100" />
          <el-table-column prop="opticalAp" label="光 AP" width="90" />
          <el-table-column prop="areaHint" label="部署说明" min-width="220" />
        </el-table>
      </section>
    </template>

    <section v-else-if="!loading" class="pol-panel empty">
      <div class="empty-state">
        <div class="icon">规</div>
        <div class="pol-sub">选择常用场景或填写参数后，点击「生成方案」查看设计估算</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.planner { display: flex; flex-direction: column; gap: 12px; }
.form-panel, .result-block, .empty, .computing { padding: 14px 16px; }
.head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.presets { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
.preset-desc { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.chip { border: 1px solid rgba(86,120,168,0.35); border-radius: 999px; padding: 2px 10px; }
.grid-form { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 4px 16px; }
.span-2 { grid-column: span 2; }
.actions { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.computing { display: flex; align-items: center; gap: 16px; }
.phase { margin-top: 6px; }
.metrics { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; }
.metric { padding: 12px 14px; }
.metric-val { margin: 6px 0; font-size: 20px; font-weight: 700; color: #dbeafe; }
.result-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
.summary { line-height: 1.7; margin: 0 0 10px; }
.reasons, .formulas { margin: 0; padding-left: 18px; line-height: 1.75; }
.reasons.risk li { color: #fecaca; }
.variant-note { margin-top: 8px; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 1100px) {
  .grid-form, .metrics, .two-col { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>
