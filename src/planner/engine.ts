/** 全光组网方案规则引擎（可解释、无外部 AI） */

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

export interface PlannerResult {
  summary: string
  reasonLines: string[]
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
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function ceilDiv(a: number, b: number) {
  return Math.ceil(a / b)
}

/** 根据输入推导推荐方案 */
export function generatePlan(input: PlannerInput): PlannerResult {
  const floors = clamp(Math.round(input.floors), 1, 80)
  const pointsPerFloor = clamp(Math.round(input.pointsPerFloor), 1, 200)
  const peakUsers = clamp(Math.round(input.peakUsers), 1, 50000)
  const totalPoints = floors * pointsPerFloor
  const density = peakUsers / Math.max(1, floors)
  const pointDensity = pointsPerFloor

  const hasWirelessDense = input.bizTypes.includes('无线高密')
  const hasSecurity = input.bizTypes.includes('安防')
  const hasIot = input.bizTypes.includes('物联')
  const hasGuest = input.bizTypes.includes('访客')
  const hasOffice = input.bizTypes.includes('办公') || input.bizTypes.length === 0

  let tech: PlannerResult['tech'] = 'GPON'
  const reasonLines: string[] = []

  if (input.bandwidthTier === '万兆上行' || density > 80 || hasWirelessDense || input.budget === '性能优先') {
    tech = input.budget === '成本优先' && input.bandwidthTier !== '万兆上行' ? 'Combo' : 'XGS-PON'
    reasonLines.push(
      `峰值密度约 ${density.toFixed(0)} 用户/层、带宽档位「${input.bandwidthTier}」、业务含「${input.bizTypes.join('、') || '办公'}」→ 推荐 ${tech}，保障高密并发与上行能力。`,
    )
  } else if (density > 40 || pointDensity > 24 || input.budget === '均衡') {
    tech = 'Combo'
    reasonLines.push(
      `中等密度（约 ${density.toFixed(0)} 用户/层、每层 ${pointDensity} 点）→ 推荐 Combo（GPON+XGS-PON），热点楼层可平滑升级。`,
    )
  } else {
    tech = 'GPON'
    reasonLines.push('密度与千兆桌面需求适中 → 选用 GPON，成本更优，单 PON 口可覆盖更多 ONU。')
  }

  if (input.budget === '成本优先' && tech === 'XGS-PON' && input.bandwidthTier === '千兆桌面' && !hasWirelessDense) {
    tech = 'Combo'
    reasonLines.push('成本优先且无强制万兆/无线高密 → 从纯 XGS-PON 下调为 Combo，热点按需开通 10G。')
  }

  let l1 = 8
  let l2 = 8
  if (input.splitPref === '不等比') {
    if (input.budget === '性能优先' || tech === 'XGS-PON') {
      l1 = 4
      l2 = 8
    } else if (input.budget === '成本优先') {
      l1 = 8
      l2 = 16
    } else {
      l1 = 4
      l2 = 16
    }
    reasonLines.push(`分光偏好「不等比」→ 一级 1:${l1}、二级 1:${l2}，便于按楼层差异化配比。`)
  } else {
    if (input.budget === '性能优先' || density > 100) {
      l1 = 4
      l2 = 8
    } else if (input.budget === '成本优先') {
      l1 = 8
      l2 = 16
    } else {
      l1 = 8
      l2 = 8
    }
    reasonLines.push(`分光偏好「等比」且预算「${input.budget}」→ 采用 1:${l1} × 1:${l2}（等效 1:${l1 * l2}）。`)
  }
  const effective = l1 * l2

  const onuPerPoint = hasWirelessDense ? 0.55 : 0.85
  const apRatio = hasWirelessDense ? 0.45 : density > 60 ? 0.28 : 0.15
  let onuTotal = Math.ceil(totalPoints * onuPerPoint * (1 - apRatio * 0.5))
  let apTotal = Math.ceil(totalPoints * apRatio * 0.35 + floors * (hasWirelessDense ? 4 : density > 50 ? 2 : 1))

  if (hasSecurity) {
    onuTotal += floors * 2
    reasonLines.push('含安防业务 → 每层预留约 2 台安防 ONU（摄像/门禁汇聚）。')
  }
  if (hasIot) {
    onuTotal += Math.ceil(floors * 1.5)
    reasonLines.push('含物联业务 → 每层预留物联汇聚 ONU。')
  }

  if (input.budget === '成本优先') {
    apTotal = Math.max(floors, Math.ceil(apTotal * 0.75))
    reasonLines.push('成本优先 → 光 AP 按合并覆盖估算，减少约 25%。')
  } else if (input.budget === '性能优先') {
    apTotal = Math.ceil(apTotal * 1.2)
    reasonLines.push('性能优先 → 光 AP 增加约 20% 以降低同频干扰、提升漫游体验。')
  }

  const endpoints = onuTotal + apTotal
  const onuPerL2 = Math.min(l2, input.budget === '性能优先' ? Math.max(4, Math.floor(l2 * 0.7)) : l2)
  const l2Count = Math.max(floors, ceilDiv(endpoints, onuPerL2))
  const l1Count = Math.max(2, ceilDiv(l2Count, l1))

  const ponPortsNeeded = l1Count
  const portsPerOlt = tech === 'GPON' ? 16 : tech === 'Combo' ? 16 : 8
  let oltBase = Math.max(1, ceilDiv(ponPortsNeeded, portsPerOlt))

  if (input.budget === '性能优先' && oltBase === 1 && ponPortsNeeded > portsPerOlt * 0.6) {
    oltBase = 2
    reasonLines.push('性能优先且 PON 口占用偏高 → 建议至少 2 台 OLT 分担负载。')
  }

  if (input.budget === '成本优先' && oltBase > 1 && ponPortsNeeded <= portsPerOlt) {
    oltBase = 1
    reasonLines.push('成本优先且 PON 口可单机容纳 → 合并为 1 台 OLT。')
  }

  let oltCount = input.dualOlt ? Math.max(2, oltBase * 2) : oltBase
  if (input.dualOlt && oltBase === 1) {
    oltCount = 2
    reasonLines.push('启用双 OLT 冗余 → 部署 2 台 OLT 做双归属/主备保护。')
  } else if (input.dualOlt) {
    reasonLines.push(`启用双 OLT 冗余 → 在业务所需 ${oltBase} 台基础上按 1:1 冗余，共 ${oltCount} 台。`)
  }

  const ponPortsProvisioned = oltCount * portsPerOlt

  const oltModel =
    tech === 'GPON'
      ? '盒式/机架 GPON OLT（16×GPON）'
      : tech === 'XGS-PON'
        ? '机架 XGS-PON OLT（8×XGS-PON）'
        : 'Combo OLT（GPON/XGS-PON 共框，16×Combo PON）'

  const floorPlans: FloorPlan[] = []
  let remainOnu = onuTotal
  let remainAp = apTotal
  for (let f = 1; f <= floors; f++) {
    const isHot =
      hasWirelessDense || (floors > 10 && (f <= 3 || f >= floors - 1)) || density > 70
    const onu = f === floors ? remainOnu : Math.max(1, Math.round(onuTotal / floors))
    const ap = f === floors ? remainAp : Math.max(0, Math.round(apTotal / floors) + (isHot ? 1 : 0))
    remainOnu -= onu
    remainAp -= ap
    floorPlans.push({
      floor: f,
      onuWired: Math.max(0, onu),
      opticalAp: Math.max(0, ap),
      areaHint: isHot
        ? hasWirelessDense
          ? '高密无线 / 开放办公，光 AP 优先'
          : f <= 2
            ? '裙楼大堂与开放区，加强覆盖'
            : '顶层/高管或会议密集区'
        : '标准办公层，ONU 入房间/弱电箱',
    })
  }

  const slices: SliceAdvice[] = []
  if (hasOffice || input.bizTypes.length === 0) {
    slices.push({ name: '办公', vlanId: 100, priority: '高', note: '员工有线/无线生产网，QoS 保障办公与会议' })
  }
  if (hasGuest) {
    slices.push({ name: '访客', vlanId: 200, priority: '中', note: '仅互联网，与办公隔离' })
  }
  if (hasSecurity) {
    slices.push({ name: '安防', vlanId: 300, priority: '最高', note: '监控/门禁硬隔离，优先保护倒换' })
  }
  if (hasIot) {
    slices.push({ name: '物联', vlanId: 400, priority: '中', note: '楼控与传感，限速防风暴' })
  }
  if (hasWirelessDense) {
    slices.push({ name: '无线高密', vlanId: 150, priority: '高', note: '光 AP 专用或与办公同切片分 SSID，建议单独限速队列' })
  }
  if (slices.length === 0) {
    slices.push({ name: '办公', vlanId: 100, priority: '高', note: '默认办公切片' })
  }

  const bom: BomItem[] = [
    {
      name: 'OLT',
      modelHint: oltModel,
      qty: oltCount,
      unit: '台',
      note: input.dualOlt ? '含双归属/冗余' : '单归属，建议预留扩展槽位',
    },
    {
      name: '一级分光器',
      modelHint: `PLC 1:${l1}`,
      qty: l1Count,
      unit: '台',
      note: '弱电间/机房侧',
    },
    {
      name: '二级分光器',
      modelHint: `PLC 1:${l2}`,
      qty: l2Count,
      unit: '台',
      note: '楼层走廊配线箱',
    },
    {
      name: '有线 ONU',
      modelHint: tech === 'GPON' ? '千兆 ONU' : 'XGS/Combo ONU',
      qty: onuTotal,
      unit: '台',
      note: '房间、会议室、安防/物联汇聚',
    },
    {
      name: '光网 AP',
      modelHint: 'Wi-Fi 6/7 光 AP',
      qty: apTotal,
      unit: '台',
      note: hasWirelessDense ? '高密区优先部署' : '公共区与开放办公',
    },
    {
      name: '主干/配线光缆与跳纤',
      modelHint: 'G.652D / 尾纤跳线',
      qty: floors + l1Count + 2,
      unit: '批',
      note: '按楼层垂直干线 + 水平配线估算（批次）',
    },
  ]

  const summary = [
    `针对 ${floors} 层、每层约 ${pointsPerFloor} 点位、峰值并发 ${peakUsers} 的楼宇，推荐采用「${tech} + 二级分光（1:${l1}×1:${l2}，等效 1:${effective}）」全光架构`,
    input.dualOlt ? '，并启用双 OLT 冗余保护' : '',
    `。共需约 ${oltCount} 台 OLT（PON 口需求约 ${ponPortsNeeded}，配置 ${ponPortsProvisioned}）、一级分光 ${l1Count} 台、二级分光 ${l2Count} 台、有线 ONU ${onuTotal} 台、光 AP ${apTotal} 台。`,
    `业务按 ${slices.map((s) => `${s.name}(VLAN${s.vlanId})`).join('、')} 划分切片，预算策略为「${input.budget}」。`,
  ].join('')

  const vsTraditional = [
    '带宽：主干光纤替代大量铜缆聚合，上联可平滑升至 XGS-PON 万兆，避免传统接入交换机堆叠瓶颈。',
    '布线与弱电间：无源 ODN 减少有源机房与供电点，水平光缆一次敷设、后期扩容主要换 ONU/开通 PON 口。',
    '运维：端到端光功率与 ONU 状态可统一网管；故障定界按 OLT→分光→ONU 层级，较三层交换逐跳排障更直观。',
    '能耗与 TCO：无源分光段近零耗电，有源设备集中在机房 OLT，长期电费与维保通常优于每层堆叠交换。',
    tech !== 'GPON'
      ? '高密场景：光 AP + XGS/Combo 更易支撑无线高密与万兆上行，而传统「每层交换+铜缆 AP」需频繁扩容上联。'
      : '中小密度：GPON POL 以更少有源节点达到千兆桌面，较传统三层交换端口密度方案更简洁。',
  ]

  return {
    summary,
    reasonLines,
    tech,
    oltCount,
    oltModel,
    ponPortsNeeded,
    ponPortsProvisioned,
    l1Ratio: `1:${l1}`,
    l2Ratio: `1:${l2}`,
    effectiveRatio: `1:${effective}`,
    l1Count,
    l2Count,
    onuTotal,
    apTotal,
    floorPlans,
    slices,
    bom,
    vsTraditional,
  }
}

export interface ScenarioPreset {
  id: string
  name: string
  desc: string
  input: PlannerInput
}

export const presets: ScenarioPreset[] = [
  {
    id: 'office18',
    name: '18 层写字楼高密',
    desc: '开放办公 + 无线高密 + 万兆上行 + 双 OLT',
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
    name: '酒店客房',
    desc: '多层客房点位多、安防+访客、均衡冗余',
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
