/** 设备类型 */
export type DeviceType = 'OLT' | 'ODN' | 'ONU' | 'AP'

/** 设备运行状态 */
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance'

/** PON 技术制式 */
export type PonTech = 'GPON' | 'XGS-PON' | 'Combo'

/** 业务分区 */
export type BusinessSlice = '办公' | '访客' | '安防' | '物联'

export interface BuildingInfo {
  name: string
  floors: number
  rooms: number
  address: string
}

export interface OltDevice {
  id: string
  name: string
  model: string
  tech: PonTech
  status: DeviceStatus
  location: string
  uplinkGbps: number
  downlinkGbps: number
  ponPorts: number
  usedPonPorts: number
  dualHomedWith?: string
  cpuPercent: number
  tempC: number
}

export interface OdnDevice {
  id: string
  name: string
  model: string
  status: DeviceStatus
  location: string
  floor: number
  splitRatio: string
  parentId: string
  level: 1 | 2
}

export interface OnuDevice {
  id: string
  name: string
  model: string
  type: 'ONU' | 'AP'
  tech: PonTech
  status: DeviceStatus
  floor: number
  room: string
  area: string
  parentOdnId: string
  uplinkMbps: number
  downlinkMbps: number
  rxPowerDbm: number
  txPowerDbm: number
  onlineUsers: number
  slices: BusinessSlice[]
}

export interface DensityZone {
  floor: number
  area: string
  terminals: number
  concurrentUsers: number
  capacity: number
  hotspot: boolean
}

export interface SliceView {
  name: BusinessSlice
  vlanId: number
  onuCount: number
  bandwidthMbps: number
  usedMbps: number
  priority: string
  description: string
}

export type AlarmSeverity = 'critical' | 'major' | 'minor' | 'info'
export type FaultDomain = '光路' | '设备' | '端口'

export interface AlarmItem {
  id: string
  time: string
  severity: AlarmSeverity
  deviceId: string
  deviceName: string
  title: string
  domain: FaultDomain
  suggestion: string
  acked: boolean
}

export interface OverviewStats {
  buildingName: string
  accessCapacity: number
  usedAccess: number
  oltOnline: number
  oltTotal: number
  onuOnline: number
  onuTotal: number
  bandwidthUtilPercent: number
  alarmCritical: number
  alarmMajor: number
  alarmMinor: number
  concurrentUsers: number
  avgRxPower: number
}
