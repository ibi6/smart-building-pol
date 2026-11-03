/** 全光组网规划规则引擎：输出可答辩的工程估算 */

export type BizType = '办公' | '访客' | '安防' | '物联' | '无线高密'
export type BandwidthTier = '千兆桌面' | '万兆上行'
export type BudgetPref = '成本优先' | '均衡' | '性能优先'
export type SplitPref = '等比' | '不等比'

export interface PlannerInput {
  floors: number
  pointsPerFloor: number
  peakUsers: number
  bizTypes: BizType[]
  bandwidthTier: BandwidthTier
  dualOlt: boolean
  budget: BudgetPref
  splitPref: SplitPref
  /** 每 PON 口设计带 ONU 上限（可选，默认按分光等效） */
  onuPerPonCap?: number
  /** 预留系数，默认 1.2 */
  spareFactor?: number
}

export interface BomItem {
  name: string
  modelHint: string
  qty: number
  unit: string
  note: string
}

export interface FloorPlan {
  floor: number
  onuWired: number
  opticalAp: number
  areaHint: string
}

export interface SliceAdvice {
  name: string
  vlanId: number
  priority: string
  note: string
}

export interface PlanVariant {
  key: 'recommended' | 'cost' | 'performance'
  title: string
  tech: 'GPON' | 'XGS-PON' | 'Combo'
  l1: number
  l2: number
  effective: number
  oltCount: number
  oltModel: string
  portsPerOlt: number
  ponPortsNeeded: number
  ponPortsProvisioned: number
  l1Count: number
  l2Count: number
  onuTotal: number
  apTotal: number
  formulaNotes: string[]
}

export interface PlannerResult {
  summary: string
  reasonLines: string[]
  formulas: string[]
  risks: string[]
  tech: 'GPON' | 'XGS-PON' | 'Combo'
  oltCount: number
  oltModel: string
  ponPortsNeeded: number
  ponPortsProvisioned: number
  l1Ratio: string
  l2Ratio: string
  effectiveRatio: string
  l1Count: number
  l2Count: number
  onuTotal: number
  apTotal: number
  floorPlans: FloorPlan[]
  slices: SliceAdvice[]
  bom: BomItem[]
  vsTraditional: string[]
  variants: PlanVariant[]
  metrics: { label: string; value: string; tip: string }[]
}

export interface ScenarioPreset {
  id: string
  name: string
  desc: string
  input: PlannerInput
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}
function ceilDiv(a: number, b: number) {
  return Math.ceil(a / Math.max(1, b))
}

function pickTech(input: PlannerInput, density: number, force?: PlannerInput['budget']): PlannerResult['tech'] {
  const budget = force || input.budget
  const hasWirelessDense = input.bizTypes.includes('无线高密')
  if (input.bandwidthTier === '万兆上行' || density > 80 || hasWirelessDense) {
    if (budget === '成本优先' && input.bandwidthTier !== '万兆上行' && !hasWirelessDense) return 'Combo'
    return budget === '成本优先' ? 'Combo' : 'XGS-PON'
  }
  if (density > 40 || input.pointsPerFloor > 24 || budget === '均衡' || budget === '性能优先') return 'Combo'
  return 'GPON'
}

function pickSplit(input: PlannerInput, tech: PlannerResult['tech'], density: number, budget: BudgetPref) {
  let l1 = 8
  let l2 = 8
  if (input.splitPref === '不等比') {
    if (budget === '性能优先' || tech === 'XGS-PON' || density > 90) {
      l1 = 4
      l2 = 8
    } else if (budget === '成本优先') {
      l1 = 8
      l2 = 16
    } else {
      l1 = 4
      l2 = 16
    }
  } else if (budget === '性能优先' || density > 100) {
    l1 = 4
    l2 = 8
  } else if (budget === '成本优先') {
    l1 = 8
    l2 = 16
  } else {
    l1 = 8
    l2 = 8
  }
  return { l1, l2, effective: l1 * l2 }
}

function portsPerOltOf(tech: PlannerResult['tech']) {
  return tech === 'XGS-PON' ? 8 : 16
}

function oltModelOf(tech: PlannerResult['tech']) {
  if (tech === 'GPON') return '机架/盒式 GPON OLT（示例 16×GPON）'
  if (tech === 'XGS-PON') return '机架 XGS-PON OLT（示例 8×XGS-PON）'
  return 'Combo OLT（示例 16×Combo PON）'
}

function estimateEndpoints(input: PlannerInput, floors: number, totalPoints: number, density: number) {
  const hasWirelessDense = input.bizTypes.includes('无线高密')
  const hasSecurity = input.bizTypes.includes('安防')
  const hasIot = input.bizTypes.includes('物联')
  const onuPerPoint = hasWirelessDense ? 0.55 : 0.85
  let apRatio = hasWirelessDense ? 0.45 : density > 60 ? 0.28 : 0.15
  if (input.budget === '成本优先') apRatio *= 0.75
  if (input.budget === '性能优先') apRatio *= 1.2

  let onuTotal = Math.ceil(totalPoints * onuPerPoint * (1 - apRatio * 0.35))
  let apTotal = Math.ceil(totalPoints * apRatio * 0.35 + floors * (hasWirelessDense ? 4 : density > 50 ? 2 : 1))
  if (hasSecurity) onuTotal += floors * 2
  if (hasIot) onuTotal += Math.ceil(floors * 1.5)
  if (input.budget === '成本优先') apTotal = Math.max(floors, Math.ceil(apTotal * 0.9))
  if (input.budget === '性能优先') apTotal = Math.ceil(apTotal * 1.1)
  return { onuTotal, apTotal, hasWirelessDense, hasSecurity, hasIot }
}

function buildVariant(
  key: PlanVariant['key'],
  title: string,
  input: PlannerInput,
  floors: number,
  density: number,
  endpoints: { onuTotal: number; apTotal: number },
  budget: BudgetPref,
): PlanVariant {
  const tech = pickTech({ ...input, budget }, density, budget)
  const { l1, l2, effective } = pickSplit({ ...input, budget }, tech, density, budget)
  const spare = input.spareFactor ?? 1.2
  const onuPerL2 = Math.min(l2, budget === '性能优先' ? Math.max(4, Math.floor(l2 * 0.7)) : l2)
  const totalOnuLike = Math.ceil((endpoints.onuTotal + endpoints.apTotal) * spare)
  const l2Count = Math.max(floors, ceilDiv(totalOnuLike, onuPerL2))
  const l1Count = Math.max(2, ceilDiv(l2Count, l1))
  const ponPortsNeeded = l1Count
  const portsPerOlt = portsPerOltOf(tech)
  let oltBase = Math.max(1, ceilDiv(ponPortsNeeded, portsPerOlt))
  if (budget === '性能优先' && oltBase === 1 && ponPortsNeeded > portsPerOlt * 0.6) oltBase = 2
  if (budget === '成本优先' && oltBase > 1 && ponPortsNeeded <= portsPerOlt) oltBase = 1
  let oltCount = input.dualOlt ? (oltBase === 1 ? 2 : oltBase * 2) : oltBase

  const formulaNotes = [
    `末端规模：ONU ${endpoints.onuTotal} + 光AP ${endpoints.apTotal}，预留系数 ${spare} → 设计末端约 ${totalOnuLike}`,
    `二级分光器数 ≈ max(楼层, ceil(设计末端 / min(分光比支路, 设计带载))) = max(${floors}, ceil(${totalOnuLike}/${onuPerL2})) = ${l2Count}`,
    `一级分光器数 ≈ max(2, ceil(二级数 / ${l1})) = ${l1Count}（即 PON 口需求）`,
    `OLT 台数 ≈ ceil(PON口需求 / 单机PON口) ${input.dualOlt ? '后再按双归属冗余' : ''} = ${oltCount}`,
  ]

  return {
    key,
    title,
    tech,
    l1,
    l2,
    effective,
    oltCount,
    oltModel: oltModelOf(tech),
    portsPerOlt,
    ponPortsNeeded,
    ponPortsProvisioned: oltCount * portsPerOlt,
    l1Count,
    l2Count,
    onuTotal: endpoints.onuTotal,
    apTotal: endpoints.apTotal,
    formulaNotes,
  }
}

export function generatePlan(input: PlannerInput): PlannerResult {
  const floors = clamp(Math.round(input.floors), 1, 80)
  const pointsPerFloor = clamp(Math.round(input.pointsPerFloor), 1, 200)
  const peakUsers = clamp(Math.round(input.peakUsers), 1, 50000)
  const totalPoints = floors * pointsPerFloor
  const density = peakUsers / Math.max(1, floors)

  const endpoints = estimateEndpoints(input, floors, totalPoints, density)
  const recommended = buildVariant('recommended', '推荐方案（按当前预算）', input, floors, density, endpoints, input.budget)
  const cost = buildVariant('cost', '成本方案', input, floors, density, endpoints, '成本优先')
  const performance = buildVariant('performance', '性能方案', input, floors, density, endpoints, '性能优先')

  const v = recommended
  const reasonLines: string[] = [
    `楼宇：${floors} 层 × 每层 ${pointsPerFloor} 点 = ${totalPoints} 点；峰值 ${peakUsers}，折合约 ${density.toFixed(1)} 用户/层。`,
    `制式：带宽「${input.bandwidthTier}」、业务「${input.bizTypes.join('、') || '办公'}」、预算「${input.budget}」→ ${v.tech}。`,
    `分光：策略「${input.splitPref}」→ 1:${v.l1} × 1:${v.l2}（等效 1:${v.effective}）。`,
    `冗余：${input.dualOlt ? '启用双 OLT，按 1:1 或最少 2 台配置' : '单归属，建议机框预留扩容槽位'}。`,
  ]
  if (endpoints.hasSecurity) reasonLines.push('安防业务：每层按 2 台 ONU 预留汇聚（摄像/门禁）。')
  if (endpoints.hasIot) reasonLines.push('物联业务：每层增加物联汇聚 ONU。')
  if (endpoints.hasWirelessDense) reasonLines.push('无线高密：提高光 AP 占比，降低有线 ONU 当量占比。')

  const formulas = [
    ...v.formulaNotes,
    `单机 PON 口按 ${v.portsPerOlt} 估算（GPON/Combo=16，XGS-PON=8，可按实际框卡调整）。`,
  ]

  const risks: string[] = []
  if (v.effective >= 128) risks.push('等效分光比较高（≥1:128），需严格核算光功率预算与主干衰耗，建议现场 OTDR/光功率复核。')
  if (density > 90 && v.tech === 'GPON') risks.push('高密度仍选 GPON 时，忙时上行可能受限，建议热点楼层改 Combo/XGS。')
  if (!input.dualOlt && floors >= 12) risks.push('高层建筑未启用双 OLT，单点故障影响面大，建议至少核心侧主备。')
  if (endpoints.hasWirelessDense && v.apTotal < floors * 3) risks.push('无线高密场景光 AP 偏少时，同频干扰与漫游体验可能不足。')
  if (v.ponPortsNeeded / Math.max(1, v.ponPortsProvisioned) > 0.8) risks.push('PON 口占用率偏高，扩容余量不足，建议预留空闲口或增加框卡。')
  if (risks.length === 0) risks.push('当前参数下未发现明显结构性风险；实施前仍需结合图纸做光功率与机房空间复核。')

  const floorPlans: FloorPlan[] = []
  let remainOnu = v.onuTotal
  let remainAp = v.apTotal
  for (let f = 1; f <= floors; f++) {
    const hot = endpoints.hasWirelessDense || (floors > 10 && (f <= 3 || f >= floors - 1)) || density > 70
    const onu = f === floors ? remainOnu : Math.max(1, Math.round(v.onuTotal / floors))
    const ap = f === floors ? remainAp : Math.max(0, Math.round(v.apTotal / floors) + (hot ? 1 : 0))
    remainOnu -= onu
    remainAp -= ap
    floorPlans.push({
      floor: f,
      onuWired: Math.max(0, onu),
      opticalAp: Math.max(0, ap),
      areaHint: hot
        ? endpoints.hasWirelessDense
          ? '开放办公/高密无线区，优先光 AP'
          : f <= 2
            ? '裙楼大堂与公共区'
            : '顶层或会议密集区'
        : '标准办公层，ONU 入房间/弱电箱',
    })
  }

  const slices: SliceAdvice[] = []
  const hasOffice = input.bizTypes.includes('办公') || input.bizTypes.length === 0
  if (hasOffice) slices.push({ name: '办公', vlanId: 100, priority: '高', note: '员工有线/无线生产网' })
  if (input.bizTypes.includes('访客')) slices.push({ name: '访客', vlanId: 200, priority: '中', note: '仅互联网，与办公隔离' })
  if (input.bizTypes.includes('安防')) slices.push({ name: '安防', vlanId: 300, priority: '最高', note: '监控/门禁，建议硬隔离与优先倒换' })
  if (input.bizTypes.includes('物联')) slices.push({ name: '物联', vlanId: 400, priority: '中', note: '楼控传感，限速防风暴' })
  if (input.bizTypes.includes('无线高密')) slices.push({ name: '无线高密', vlanId: 150, priority: '高', note: '光 AP 业务，可与办公分 SSID/队列' })

  const bom: BomItem[] = [
    { name: 'OLT', modelHint: v.oltModel, qty: v.oltCount, unit: '台', note: input.dualOlt ? '含双归属' : '单归属，预留扩容' },
    { name: '一级分光器', modelHint: `PLC 1:${v.l1}`, qty: v.l1Count, unit: '台', note: '机房/弱电间侧' },
    { name: '二级分光器', modelHint: `PLC 1:${v.l2}`, qty: v.l2Count, unit: '台', note: '楼层配线' },
    { name: '有线 ONU', modelHint: v.tech === 'GPON' ? '千兆 ONU' : 'XGS/Combo ONU', qty: v.onuTotal, unit: '台', note: '房间与汇聚' },
    { name: '光网 AP', modelHint: 'Wi-Fi 6/7 光 AP', qty: v.apTotal, unit: '台', note: endpoints.hasWirelessDense ? '高密区加强' : '公共区覆盖' },
    { name: '光缆与跳纤', modelHint: 'G.652D / 尾纤', qty: floors + v.l1Count + 2, unit: '批', note: '垂直干线+水平配线估算' },
    { name: '网管授权', modelHint: 'POL EMS/NMS', qty: 1, unit: '套', note: '按厂商报价另计' },
  ]

  const summary =
    `针对 ${floors} 层、每层 ${pointsPerFloor} 点、峰值 ${peakUsers} 的场景，推荐 ${v.tech} + 二级分光 1:${v.l1}×1:${v.l2}（等效 1:${v.effective}）` +
    `${input.dualOlt ? '，OLT 双归属' : ''}。` +
    `估算：OLT ${v.oltCount} 台（PON 口需求 ${v.ponPortsNeeded} / 配置 ${v.ponPortsProvisioned}），` +
    `一级分光 ${v.l1Count}、二级分光 ${v.l2Count}，ONU ${v.onuTotal}、光 AP ${v.apTotal}。`

  const metrics = [
    { label: '推荐制式', value: v.tech, tip: '由带宽/密度/业务决定' },
    { label: '等效分光', value: `1:${v.effective}`, tip: `1:${v.l1} × 1:${v.l2}` },
    { label: 'OLT / PON 口', value: `${v.oltCount} / ${v.ponPortsNeeded}`, tip: `配置口 ${v.ponPortsProvisioned}` },
    { label: 'ONU + 光 AP', value: `${v.onuTotal + v.apTotal}`, tip: `ONU ${v.onuTotal} · AP ${v.apTotal}` },
    { label: '分光器', value: `${v.l1Count + v.l2Count}`, tip: `一 ${v.l1Count} · 二 ${v.l2Count}` },
  ]

  return {
    summary,
    reasonLines,
    formulas,
    risks,
    tech: v.tech,
    oltCount: v.oltCount,
    oltModel: v.oltModel,
    ponPortsNeeded: v.ponPortsNeeded,
    ponPortsProvisioned: v.ponPortsProvisioned,
    l1Ratio: `1:${v.l1}`,
    l2Ratio: `1:${v.l2}`,
    effectiveRatio: `1:${v.effective}`,
    l1Count: v.l1Count,
    l2Count: v.l2Count,
    onuTotal: v.onuTotal,
    apTotal: v.apTotal,
    floorPlans,
    slices,
    bom,
    vsTraditional: [
      '主干光纤替代大量铜缆上联，楼层有源交换可显著减少。',
      '扩容以增 ONU/开通 PON 口为主，弱电间改造量通常小于重新布铜。',
      '故障可按 OLT→分光→ONU 分层定界，结合光功率排查。',
      '无源 ODN 基本不耗电，有源设备集中在机房，利于降低长期电费。',
    ],
    variants: [recommended, cost, performance],
    metrics,
  }
}

export const presets: ScenarioPreset[] = [
  {
    id: 'office18',
    name: '18 层写字楼',
    desc: '高并发、万兆上行、双 OLT、业务全覆盖',
    input: {
      floors: 18,
      pointsPerFloor: 24,
      peakUsers: 1800,
      bizTypes: ['办公', '访客', '安防', '物联', '无线高密'],
      bandwidthTier: '万兆上行',
      dualOlt: true,
      budget: '均衡',
      splitPref: '等比',
    },
  },
  {
    id: 'campus5',
    name: '5 层园区办公',
    desc: '中小密度、千兆桌面、成本优先',
    input: {
      floors: 5,
      pointsPerFloor: 16,
      peakUsers: 280,
      bizTypes: ['办公', '访客', '物联'],
      bandwidthTier: '千兆桌面',
      dualOlt: false,
      budget: '成本优先',
      splitPref: '等比',
    },
  },
  {
    id: 'hotel',
    name: '酒店客房楼',
    desc: '点位多、安防+访客、双 OLT',
    input: {
      floors: 22,
      pointsPerFloor: 40,
      peakUsers: 900,
      bizTypes: ['访客', '安防', '办公'],
      bandwidthTier: '千兆桌面',
      dualOlt: true,
      budget: '均衡',
      splitPref: '不等比',
    },
  },
]
