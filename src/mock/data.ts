import type {
  AlarmItem,
  BuildingInfo,
  DensityZone,
  OdnDevice,
  OltDevice,
  OnuDevice,
  OverviewStats,
  SliceView,
} from '@/types'

export const building: BuildingInfo = {
  name: '智慧创新中心 A 座',
  floors: 18,
  rooms: 216,
  address: '高新区科创大道 88 号',
}

export const olts: OltDevice[] = [
  {
    id: 'OLT-01',
    name: '核心机房-OLT-A',
    model: 'Huawei OptiXstar P613E',
    tech: 'Combo',
    status: 'online',
    location: 'B1 核心机房机柜 A03',
    uplinkGbps: 100,
    downlinkGbps: 80,
    ponPorts: 16,
    usedPonPorts: 12,
    dualHomedWith: 'OLT-02',
    cpuPercent: 38,
    tempC: 42,
  },
  {
    id: 'OLT-02',
    name: '核心机房-OLT-B',
    model: 'Huawei OptiXstar P613E',
    tech: 'Combo',
    status: 'online',
    location: 'B1 核心机房机柜 B03',
    uplinkGbps: 100,
    downlinkGbps: 72,
    ponPorts: 16,
    usedPonPorts: 10,
    dualHomedWith: 'OLT-01',
    cpuPercent: 31,
    tempC: 40,
  },
]

/** 一级分光 1:8，二级分光 1:8 → 末端等效 1:64 */
export const odns: OdnDevice[] = [
  // 一级（机房侧）挂 OLT-01
  { id: 'ODN-L1-01', name: '1F弱电间-一级分光', model: 'PLC 1:8', status: 'online', location: '1F 弱电间', floor: 1, splitRatio: '1:8', parentId: 'OLT-01', level: 1 },
  { id: 'ODN-L1-02', name: '6F弱电间-一级分光', model: 'PLC 1:8', status: 'online', location: '6F 弱电间', floor: 6, splitRatio: '1:8', parentId: 'OLT-01', level: 1 },
  { id: 'ODN-L1-03', name: '12F弱电间-一级分光', model: 'PLC 1:8', status: 'online', location: '12F 弱电间', floor: 12, splitRatio: '1:8', parentId: 'OLT-01', level: 1 },
  // 一级挂 OLT-02（双归属示意）
  { id: 'ODN-L1-04', name: '3F弱电间-一级分光', model: 'PLC 1:8', status: 'online', location: '3F 弱电间', floor: 3, splitRatio: '1:8', parentId: 'OLT-02', level: 1 },
  { id: 'ODN-L1-05', name: '9F弱电间-一级分光', model: 'PLC 1:8', status: 'warning', location: '9F 弱电间', floor: 9, splitRatio: '1:8', parentId: 'OLT-02', level: 1 },
  { id: 'ODN-L1-06', name: '15F弱电间-一级分光', model: 'PLC 1:8', status: 'online', location: '15F 弱电间', floor: 15, splitRatio: '1:8', parentId: 'OLT-02', level: 1 },
  // 二级分光
  { id: 'ODN-L2-01', name: '2F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '2F 走廊配线箱', floor: 2, splitRatio: '1:8', parentId: 'ODN-L1-01', level: 2 },
  { id: 'ODN-L2-02', name: '4F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '4F 走廊配线箱', floor: 4, splitRatio: '1:8', parentId: 'ODN-L1-01', level: 2 },
  { id: 'ODN-L2-03', name: '5F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '5F 走廊配线箱', floor: 5, splitRatio: '1:8', parentId: 'ODN-L1-02', level: 2 },
  { id: 'ODN-L2-04', name: '7F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '7F 走廊配线箱', floor: 7, splitRatio: '1:8', parentId: 'ODN-L1-02', level: 2 },
  { id: 'ODN-L2-05', name: '8F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '8F 走廊配线箱', floor: 8, splitRatio: '1:8', parentId: 'ODN-L1-04', level: 2 },
  { id: 'ODN-L2-06', name: '10F走廊-二级分光', model: 'PLC 1:8', status: 'warning', location: '10F 走廊配线箱', floor: 10, splitRatio: '1:8', parentId: 'ODN-L1-05', level: 2 },
  { id: 'ODN-L2-07', name: '11F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '11F 走廊配线箱', floor: 11, splitRatio: '1:8', parentId: 'ODN-L1-03', level: 2 },
  { id: 'ODN-L2-08', name: '13F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '13F 走廊配线箱', floor: 13, splitRatio: '1:8', parentId: 'ODN-L1-03', level: 2 },
  { id: 'ODN-L2-09', name: '14F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '14F 走廊配线箱', floor: 14, splitRatio: '1:8', parentId: 'ODN-L1-06', level: 2 },
  { id: 'ODN-L2-10', name: '16F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '16F 走廊配线箱', floor: 16, splitRatio: '1:8', parentId: 'ODN-L1-06', level: 2 },
  { id: 'ODN-L2-11', name: '17F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '17F 走廊配线箱', floor: 17, splitRatio: '1:8', parentId: 'ODN-L1-05', level: 2 },
  { id: 'ODN-L2-12', name: '18F走廊-二级分光', model: 'PLC 1:8', status: 'online', location: '18F 走廊配线箱', floor: 18, splitRatio: '1:8', parentId: 'ODN-L1-03', level: 2 },
]

const areas = ['开放办公', '会议室', '接待区', '安防控制室', '物联机柜间', '茶水间', '电梯厅', '地下车库']
const onuModels = ['EG8145V5', 'HN8145X6', 'OptiXstar W635X', 'AirEngine 5761-11']
const parentOdns = odns.filter((o) => o.level === 2).map((o) => o.id)

function hash(n: number) {
  return ((n * 9301 + 49297) % 233280) / 233280
}

function buildOnus(): OnuDevice[] {
  const list: OnuDevice[] = []
  let seq = 1
  for (let floor = 1; floor <= 18; floor++) {
    const count = floor <= 3 || floor >= 16 ? 4 : floor % 5 === 0 ? 3 : 2
    for (let i = 0; i < count; i++) {
      const h = hash(seq * floor + i)
      const isAp = h > 0.55
      const tech = h > 0.4 ? 'XGS-PON' : 'GPON'
      const parent = parentOdns[(floor + i) % parentOdns.length]
      const area = areas[Math.floor(h * areas.length)]
      const online = h > 0.08
      const warning = online && h < 0.14
      const status = !online ? 'offline' : warning ? 'warning' : 'online'
      const slices =
        area.includes('安防')
          ? (['安防'] as const)
          : area.includes('物联')
            ? (['物联'] as const)
            : area.includes('接待')
              ? (['访客', '办公'] as const)
              : (['办公'] as const)

      list.push({
        id: `ONU-${String(seq).padStart(3, '0')}`,
        name: `${floor}F-${area}-${isAp ? '光AP' : 'ONU'}-${i + 1}`,
        model: isAp ? onuModels[3] : onuModels[Math.floor(h * 3)],
        type: isAp ? 'AP' : 'ONU',
        tech,
        status,
        floor,
        room: `${floor}${String(10 + i * 3).padStart(2, '0')}`,
        area,
        parentOdnId: parent,
        uplinkMbps: tech === 'XGS-PON' ? 10000 : 1250,
        downlinkMbps: tech === 'XGS-PON' ? 10000 : 2500,
        rxPowerDbm: Number((-18 - h * 8).toFixed(1)),
        txPowerDbm: Number((2 + h * 2).toFixed(1)),
        onlineUsers: online ? Math.floor(8 + h * 40) : 0,
        slices: [...slices],
      })
      seq++
    }
  }
  return list
}

export const onus: OnuDevice[] = buildOnus()

export const densityZones: DensityZone[] = Array.from({ length: 18 }, (_, idx) => {
  const floor = idx + 1
  const floorOnus = onus.filter((o) => o.floor === floor)
  const terminals = floorOnus.reduce((s, o) => s + (o.status === 'offline' ? 0 : 1), 0) * 12 + Math.floor(hash(floor) * 30)
  const concurrent = floorOnus.reduce((s, o) => s + o.onlineUsers, 0)
  const capacity = floor <= 2 ? 200 : floor >= 15 ? 180 : 120
  return {
    floor,
    area: floor <= 2 ? '裙楼大堂/开放办公' : floor >= 16 ? '高管层' : `${floor}F 标准办公层`,
    terminals,
    concurrentUsers: concurrent,
    capacity,
    hotspot: concurrent / capacity > 0.75,
  }
})

export const slices: SliceView[] = [
  {
    name: '办公',
    vlanId: 100,
    onuCount: onus.filter((o) => o.slices.includes('办公')).length,
    bandwidthMbps: 20000,
    usedMbps: 12800,
    priority: '高',
    description: '员工有线/无线办公业务，QoS 优先保障生产流量',
  },
  {
    name: '访客',
    vlanId: 200,
    onuCount: onus.filter((o) => o.slices.includes('访客')).length,
    bandwidthMbps: 5000,
    usedMbps: 2100,
    priority: '中',
    description: '访客 Wi-Fi 与接待区隔离访问，仅放行互联网',
  },
  {
    name: '安防',
    vlanId: 300,
    onuCount: onus.filter((o) => o.slices.includes('安防')).length,
    bandwidthMbps: 8000,
    usedMbps: 5600,
    priority: '最高',
    description: '视频监控、门禁、报警主机专用切片，低时延硬隔离',
  },
  {
    name: '物联',
    vlanId: 400,
    onuCount: onus.filter((o) => o.slices.includes('物联')).length,
    bandwidthMbps: 3000,
    usedMbps: 980,
    priority: '中',
    description: '楼宇自控、传感、能耗采集等 IoT 终端接入',
  },
]

export const alarms: AlarmItem[] = [
  {
    id: 'ALM-001',
    time: '2026-11-03 09:12:31',
    severity: 'critical',
    deviceId: 'ONU-028',
    deviceName: onus.find((o) => o.id === 'ONU-028')?.name || 'ONU-028',
    title: 'ONU 光功率过低（LOS 临界）',
    domain: '光路',
    suggestion: '检查二级分光器至 ONU 尾纤与法兰盘；测量接收光功率，排除弯曲损耗或脏污',
    acked: false,
  },
  {
    id: 'ALM-002',
    time: '2026-11-03 08:47:05',
    severity: 'major',
    deviceId: 'ODN-L1-05',
    deviceName: '9F弱电间-一级分光',
    title: '一级分光器下游多 ONU 告警聚集',
    domain: '光路',
    suggestion: '故障定界至 9F 一级分光→二级链路；优先排查主干光缆与法兰',
    acked: false,
  },
  {
    id: 'ALM-003',
    time: '2026-11-03 08:21:18',
    severity: 'major',
    deviceId: 'OLT-02',
    deviceName: '核心机房-OLT-B',
    title: 'PON 口 0/1/5 误码率升高',
    domain: '端口',
    suggestion: '检查该 PON 口光模块与跳纤；必要时切换至双归属备用路径（OLT-A）',
    acked: true,
  },
  {
    id: 'ALM-004',
    time: '2026-11-02 22:03:44',
    severity: 'minor',
    deviceId: 'ONU-041',
    deviceName: onus.find((o) => o.id === 'ONU-041')?.name || 'ONU-041',
    title: 'ONU 离线（疑似断电）',
    domain: '设备',
    suggestion: '现场确认供电与 PoE；若持续离线则远程重启或更换终端',
    acked: true,
  },
  {
    id: 'ALM-005',
    time: '2026-11-02 19:36:02',
    severity: 'minor',
    deviceId: 'ODN-L2-06',
    deviceName: '10F走廊-二级分光',
    title: '分光器温度偏高',
    domain: '设备',
    suggestion: '检查配线箱散热与封堵；与光路告警关联分析',
    acked: false,
  },
  {
    id: 'ALM-006',
    time: '2026-11-02 16:10:55',
    severity: 'info',
    deviceId: 'OLT-01',
    deviceName: '核心机房-OLT-A',
    title: '软件版本巡检提醒',
    domain: '设备',
    suggestion: '计划窗口升级至建议版本，保持双机一致性',
    acked: true,
  },
  {
    id: 'ALM-007',
    time: '2026-11-03 10:02:11',
    severity: 'major',
    deviceId: 'ONU-015',
    deviceName: onus.find((o) => o.id === 'ONU-015')?.name || 'ONU-015',
    title: '端口协商失败 / 用户侧链路闪断',
    domain: '端口',
    suggestion: '检查 ONU 用户侧网线与交换机口；排除环路与双工不匹配',
    acked: false,
  },
  {
    id: 'ALM-008',
    time: '2026-11-03 07:55:40',
    severity: 'critical',
    deviceId: 'ONU-052',
    deviceName: onus.find((o) => o.id === 'ONU-052')?.name || 'ONU-052',
    title: '安防切片 ONU 中断',
    domain: '设备',
    suggestion: '优先恢复安防切片路径；确认双归属保护倒换是否触发',
    acked: false,
  },
]

export const overviewStats: OverviewStats = {
  buildingName: building.name,
  accessCapacity: 2048,
  usedAccess: onus.filter((o) => o.status !== 'offline').length * 14 + 320,
  oltOnline: olts.filter((o) => o.status === 'online').length,
  oltTotal: olts.length,
  onuOnline: onus.filter((o) => o.status === 'online' || o.status === 'warning').length,
  onuTotal: onus.length,
  bandwidthUtilPercent: 64,
  alarmCritical: alarms.filter((a) => a.severity === 'critical' && !a.acked).length,
  alarmMajor: alarms.filter((a) => a.severity === 'major' && !a.acked).length,
  alarmMinor: alarms.filter((a) => a.severity === 'minor' && !a.acked).length,
  concurrentUsers: densityZones.reduce((s, z) => s + z.concurrentUsers, 0),
  avgRxPower: Number(
    (
      onus.filter((o) => o.status !== 'offline').reduce((s, o) => s + o.rxPowerDbm, 0) /
      Math.max(1, onus.filter((o) => o.status !== 'offline').length)
    ).toFixed(1),
  ),
}

/** 近 24 小时带宽利用率（演示曲线） */
export const bandwidthTrend = Array.from({ length: 24 }, (_, h) => ({
  hour: `${String(h).padStart(2, '0')}:00`,
  util: Math.round(35 + 25 * Math.sin((h / 24) * Math.PI * 2 - 1) + hash(h) * 15),
}))
