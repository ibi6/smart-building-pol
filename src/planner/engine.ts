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
      `依据：每层峰值约 ${density.toFixed(0)} 用户，带宽档位为「${input.bandwidthTier}」，业务含「${input.bizTypes.join('、') || '办公'}」。结论：采用 ${tech}。`,
    )
  } else if (density > 40 || pointDensity > 24 || input.budget === '均衡') {
    tech = 'Combo'
    reasonLines.push(
      `依据：每层约 ${density.toFixed(0)} 用户、${pointDensity} 点位，属中等密度。结论：采用 Combo，热点楼层可按需开通 XGS-PON。`,
    )
  } else {
    tech = 'GPON'
    reasonLines.push('依据：密度不高且目标为千兆桌面。结论：采用 GPON，单 PON 口可带更多 ONU，成本较低。')
  }

  if (input.budget === '成本优先' && tech === 'XGS-PON' && input.bandwidthTier === '千兆桌面' && !hasWirelessDense) {
    tech = 'Combo'
    reasonLines.push('依据：预算为成本优先，且未强制万兆/无线高密。结论：由 XGS-PON 调整为 Combo。')
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
    reasonLines.push(`依据：分光策略选不等比。结论：一级 1:${l1}、二级 1:${l2}，便于按楼层调整。`)
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
    reasonLines.push(`依据：等比分光 + 预算「${input.budget}」。结论：1:${l1} × 1:${l2}（等效 1:${l1 * l2}）。`)
  }
  const effective = l1 * l2

  const onuPerPoint = hasWirelessDense ? 0.55 : 0.85
  const apRatio = hasWirelessDense ? 0.45 : density > 60 ? 0.28 : 0.15
  let onuTotal = Math.ceil(totalPoints * onuPerPoint * (1 - apRatio * 0.5))
  let apTotal = Math.ceil(totalPoints * apRatio * 0.35 + floors * (hasWirelessDense ? 4 : density > 50 ? 2 : 1))

  if (hasSecurity) {
    onuTotal += floors * 2
    reasonLines.push('依据：业务含安防。结论：每层按约 2 台 ONU 预留摄像/门禁汇聚。')
  }
  if (hasIot) {
    onuTotal += Math.ceil(floors * 1.5)
    reasonLines.push('依据：业务含物联。结论：每层增加物联汇聚 ONU。')
  }

  if (input.budget === '成本优先') {
    apTotal = Math.max(floors, Math.ceil(apTotal * 0.75))
    reasonLines.push('依据：预算成本优先。结论：光 AP 按合并覆盖估算，数量下调约 25%。')
  } else if (input.budget === '性能优先') {
    apTotal = Math.ceil(apTotal * 1.2)
    reasonLines.push('依据：预算性能优先。结论：光 AP 数量上浮约 20%，用于降低同频干扰。')
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
    reasonLines.push('依据：性能优先且 PON 口占用偏高。结论：建议不少于 2 台 OLT。')
  }

  if (input.budget === '成本优先' && oltBase > 1 && ponPortsNeeded <= portsPerOlt) {
    oltBase = 1
    reasonLines.push('依据：成本优先，且 PON 口可单机容纳。结论：OLT 按 1 台配置。')
  }

  let oltCount = input.dualOlt ? Math.max(2, oltBase * 2) : oltBase
  if (input.dualOlt && oltBase === 1) {
    oltCount = 2
    reasonLines.push('依据：启用双 OLT 冗余。结论：部署 2 台 OLT，做双归属/主备。')
  } else if (input.dualOlt) {
    reasonLines.push(`依据：启用双 OLT 冗余。结论：业务侧 ${oltBase} 台按 1:1 冗余，合计 ${oltCount} 台。`)
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
    `楼宇规模：${floors} 层，每层约 ${pointsPerFloor} 点位，峰值并发 ${peakUsers}。`,
    `推荐架构：${tech} + 二级分光 1:${l1} × 1:${l2}（等效 1:${effective}）`,
    input.dualOlt ? '，启用 OLT 双归属' : '，OLT 单归属',
    `。设备估算：OLT ${oltCount} 台（PON 口需求 ${ponPortsNeeded}、配置 ${ponPortsProvisioned}），一级分光 ${l1Count} 台，二级分光 ${l2Count} 台，有线 ONU ${onuTotal} 台，光 AP ${apTotal} 台。`,
    `切片建议：${slices.map((s) => `${s.name}/VLAN${s.vlanId}`).join('、')}；预算偏好：${input.budget}。`,
  ].join('')

  const vsTraditional = [
    '带宽：主干以光纤承载，上联可按需升级至 XGS-PON；减少楼层交换机堆叠造成的上联瓶颈。',
    '布线：ODN 无源，弱电间有源设备更少；水平光缆一次建设后，扩容以增 ONU/开通 PON 口为主。',
    '运维：可按 OLT→分光器→ONU 分层定界，结合光功率与 ONU 状态统一监控。',
    '能耗：无源分光段基本不耗电，有源设备集中在机房，利于降低长期电费与维保点。',
    tech !== 'GPON'
      ? '高密场景：光 AP 配合 XGS/Combo，更适合无线高密与较高上行需求。'
      : '中小密度：GPON POL 有源节点更少，千兆桌面场景下结构更简洁。',
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
    desc: '18 层、高并发、万兆上行、双 OLT',
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
    desc: '5 层园区、千兆桌面、成本优先',
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
    desc: '客房点位多、含安防/访客、双 OLT',
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
