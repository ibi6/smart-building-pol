<script setup lang="ts">
import { reactive, ref } from 'vue'
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

const bizOptions: BizType[] = ['办公', '访客', '安防', '物联', '无线高密']

function applyPreset(id: string) {
  const p = presets.find((x) => x.id === id)
  if (!p) return
  Object.assign(form, {
    ...p.input,
    bizTypes: [...p.input.bizTypes],
  })
  result.value = null
}

function run() {
  loading.value = true
  window.setTimeout(() => {
    result.value = generatePlan({
      ...form,
      bizTypes: [...form.bizTypes],
    })
    loading.value = false
  }, 280)
}
</script>

<template>
  <div class="planner">
    <section class="pol-panel form-panel">
      <div class="head">
        <div>
          <h3 class="pol-title">方案测算 · 智能规划</h3>
          <div class="pol-sub">输入楼宇条件，规则引擎输出可解释的最优全光组网方案（无需外部 AI）</div>
        </div>
      </div>

      <div class="presets">
        <span class="pol-sub">一键场景：</span>
        <el-button
          v-for="p in presets"
          :key="p.id"
          size="small"
          round
          @click="applyPreset(p.id)"
        >{{ p.name }}</el-button>
      </div>
      <div class="preset-desc pol-sub">
        <template v-for="p in presets" :key="p.id + '-d'">
          <span class="chip">{{ p.name }}：{{ p.desc }}</span>
        </template>
      </div>

      <el-form label-position="top" class="grid-form">
        <el-form-item label="楼层数">
          <el-input-number v-model="form.floors" :min="1" :max="80" />
        </el-form-item>
        <el-form-item label="每层房间 / 点位数">
          <el-input-number v-model="form.pointsPerFloor" :min="1" :max="200" />
        </el-form-item>
        <el-form-item label="峰值并发用户">
          <el-input-number v-model="form.peakUsers" :min="1" :max="50000" :step="50" />
        </el-form-item>
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
          <el-switch v-model="form.dualOlt" active-text="开启双归属" inactive-text="单归属" />
        </el-form-item>
        <el-form-item label="预算偏好">
          <el-radio-group v-model="form.budget">
            <el-radio-button value="成本优先">成本优先</el-radio-button>
            <el-radio-button value="均衡">均衡</el-radio-button>
            <el-radio-button value="性能优先">性能优先</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分光策略偏好">
          <el-radio-group v-model="form.splitPref">
            <el-radio-button value="等比">等比</el-radio-button>
            <el-radio-button value="不等比">不等比</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item class="span-2 actions">
          <el-button type="primary" size="large" :loading="loading" @click="run">生成最优方案</el-button>
          <span class="pol-sub">规则基于密度、带宽档位、业务与预算，输出可答辩讲解的推导过程</span>
        </el-form-item>
      </el-form>
    </section>

    <template v-if="result">
      <section class="pol-panel result-block">
        <h3 class="pol-title">推荐架构摘要</h3>
        <p class="summary">{{ result.summary }}</p>
        <div class="tags">
          <el-tag effect="dark" type="success">制式 {{ result.tech }}</el-tag>
          <el-tag effect="dark">分光 {{ result.l1Ratio }} × {{ result.l2Ratio }}（{{ result.effectiveRatio }}）</el-tag>
          <el-tag effect="dark" type="warning">OLT × {{ result.oltCount }}</el-tag>
          <el-tag effect="dark">PON 口 需 {{ result.ponPortsNeeded }} / 配 {{ result.ponPortsProvisioned }}</el-tag>
        </div>
      </section>

      <section class="mid">
        <div class="pol-panel result-block">
          <h3 class="pol-title">规则推导说明</h3>
          <ul class="reasons">
            <li v-for="(line, i) in result.reasonLines" :key="i">{{ line }}</li>
          </ul>
          <div class="kv">
            <div><span class="pol-sub">OLT 型号档位</span><strong>{{ result.oltModel }}</strong></div>
            <div><span class="pol-sub">一级 / 二级分光器</span><strong>{{ result.l1Count }} / {{ result.l2Count }} 台</strong></div>
            <div><span class="pol-sub">有线 ONU / 光 AP</span><strong>{{ result.onuTotal }} / {{ result.apTotal }} 台</strong></div>
          </div>
        </div>
        <div class="pol-panel result-block">
          <h3 class="pol-title">VLAN / 切片划分建议</h3>
          <el-table :data="result.slices" size="small" stripe>
            <el-table-column prop="name" label="切片" width="100" />
            <el-table-column prop="vlanId" label="VLAN" width="80" />
            <el-table-column prop="priority" label="优先级" width="80" />
            <el-table-column prop="note" label="说明" min-width="180" />
          </el-table>
        </div>
      </section>

      <section class="pol-panel result-block">
        <h3 class="pol-title">关键设备清单</h3>
        <el-table :data="result.bom" stripe>
          <el-table-column prop="name" label="设备" width="140" />
          <el-table-column prop="modelHint" label="型号/档位建议" min-width="200" />
          <el-table-column prop="qty" label="数量" width="80" />
          <el-table-column prop="unit" label="单位" width="70" />
          <el-table-column prop="note" label="说明" min-width="180" />
        </el-table>
      </section>

      <section class="pol-panel result-block">
        <h3 class="pol-title">按楼层部署建议（ONU / 光 AP）</h3>
        <el-table :data="result.floorPlans" stripe height="360">
          <el-table-column prop="floor" label="楼层" width="80">
            <template #default="{ row }">{{ row.floor }}F</template>
          </el-table-column>
          <el-table-column prop="onuWired" label="有线 ONU" width="100" />
          <el-table-column prop="opticalAp" label="光网 AP" width="100" />
          <el-table-column prop="areaHint" label="区域建议" min-width="220" />
        </el-table>
      </section>

      <section class="pol-panel result-block">
        <h3 class="pol-title">相对传统三层交换的优势要点</h3>
        <ul class="reasons">
          <li v-for="(line, i) in result.vsTraditional" :key="'v' + i">{{ line }}</li>
        </ul>
      </section>
    </template>

    <section v-else class="pol-panel empty">
      <div class="pol-sub">填写左侧条件或选择预设场景，点击「生成最优方案」查看 OLT/ODN/ONU 与切片建议。</div>
    </section>
  </div>
</template>

<style scoped>
.planner { display: flex; flex-direction: column; gap: 12px; }
.form-panel, .result-block, .empty { padding: 14px 16px; }
.head { margin-bottom: 10px; }
.presets { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
.preset-desc { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.chip {
  border: 1px solid rgba(64, 158, 255, 0.25);
  border-radius: 999px;
  padding: 2px 10px;
  background: rgba(58, 160, 255, 0.06);
}
.grid-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px 16px;
}
.span-2 { grid-column: span 2; }
.actions { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.summary { line-height: 1.7; margin: 8px 0 12px; color: var(--pol-text); }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.mid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 12px; }
.reasons { margin: 8px 0 0; padding-left: 18px; line-height: 1.7; color: var(--pol-text); }
.kv { display: grid; gap: 10px; margin-top: 14px; }
.kv strong { display: block; margin-top: 2px; }
.empty { min-height: 80px; display: grid; place-items: center; }
@media (max-width: 1100px) {
  .grid-form, .mid { grid-template-columns: 1fr; }
  .span-2 { grid-column: span 1; }
}
</style>
