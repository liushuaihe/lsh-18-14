export enum DeviceStatus {
  OFF = 'off',
  STANDBY = 'standby',
  ON = 'on',
  WARNING = 'warning',
  FAULT = 'fault',
  FUSED = 'fused',
  BLOCKED = 'blocked',
}

export type AlertLevel = 'warning' | 'critical' | 'fuse';
export type SensorAlertLevel = 'normal' | 'warning' | 'critical' | 'fuse';

export type PowerMode = 'mains' | 'ups' | 'off';

export interface UPSBattery {
  id: string;
  name: string;
  capacityKWh: number;
  currentCapacityKWh: number;
  loadKW: number;
  remainingMinutes: number;
  healthPercent: number;
  charging: boolean;
}

export interface ShutdownStep {
  deviceId: string;
  deviceName: string;
  priority: number;
  powerKW: number;
  savedMinutes: number;
  cumulativeLoadKW: number;
  cumulativeSavedMinutes: number;
  timestamp?: number;
}

export const SHUTDOWN_PRIORITY_LABELS: Record<number, string> = {
  1: '核心-不可断电',
  2: '核心-可延迟断电',
  3: '重要-可降级',
  4: '一般-优先关停',
  5: '辅助-立即关停',
};

export const SHUTDOWN_PRIORITY_COLORS: Record<number, { bg: string; border: string; text: string; dot: string }> = {
  1: { bg: 'bg-emerald-900/30', border: 'border-emerald-500/60', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  2: { bg: 'bg-cyan-900/30', border: 'border-cyan-500/60', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  3: { bg: 'bg-amber-900/30', border: 'border-amber-500/60', text: 'text-amber-400', dot: 'bg-amber-400' },
  4: { bg: 'bg-orange-900/30', border: 'border-orange-500/60', text: 'text-orange-400', dot: 'bg-orange-400' },
  5: { bg: 'bg-rose-900/30', border: 'border-rose-500/60', text: 'text-rose-400', dot: 'bg-rose-400' },
};

export interface Device {
  id: string;
  name: string;
  group: string;
  isCore: boolean;
  status: DeviceStatus;
  dependencyIds: string[];
  tempSensorId: string;
  powerConsumption: number;
  shutdownPriority: number;
  lastStatusChange: number;
  faultCode?: string;
  blockReason?: string;
}

export interface TempSensor {
  id: string;
  deviceId: string;
  currentTemp: number;
  targetTemp: number;
  baseTemp: number;
  tempHistory: Array<{ t: number; v: number }>;
  baseWarningThreshold: number;
  baseCriticalThreshold: number;
  baseFuseThreshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  fuseThreshold: number;
  alertLevel: SensorAlertLevel;
}

export interface Alert {
  id: string;
  timestamp: number;
  deviceId: string;
  sensorId: string;
  level: AlertLevel;
  message: string;
  temperature?: number;
  threshold?: number;
  acknowledged: boolean;
}

export interface ToggleResult {
  success: boolean;
  message?: string;
  blockedDependencies?: string[];
}

export interface TraceStep {
  deviceId: string;
  deviceName: string;
  status: DeviceStatus;
  reason?: string;
  level: number;
}

export interface TracePath {
  rootFaultId: string;
  rootFaultName: string;
  faultCode: string;
  steps: TraceStep[];
}

export interface ThresholdAdjustment {
  warningDelta: number;
  criticalDelta: number;
  fuseDelta: number;
  reason: string;
}

export const STATUS_COLORS: Record<DeviceStatus, { bg: string; border: string; glow: string; text: string; dot: string }> = {
  [DeviceStatus.OFF]: { bg: 'bg-slate-800/40', border: 'border-slate-600/50', glow: 'shadow-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500' },
  [DeviceStatus.STANDBY]: { bg: 'bg-amber-900/20', border: 'border-amber-500/50', glow: 'shadow-amber-400/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  [DeviceStatus.ON]: { bg: 'bg-emerald-900/20', border: 'border-emerald-500/50', glow: 'shadow-emerald-400/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  [DeviceStatus.WARNING]: { bg: 'bg-orange-900/30', border: 'border-orange-500/60', glow: 'shadow-orange-400/40', text: 'text-orange-400', dot: 'bg-orange-400' },
  [DeviceStatus.FAULT]: { bg: 'bg-rose-900/40', border: 'border-rose-500/70', glow: 'shadow-rose-500/50', text: 'text-rose-400', dot: 'bg-rose-500' },
  [DeviceStatus.FUSED]: { bg: 'bg-red-950/60', border: 'border-red-600/80', glow: 'shadow-red-600/60', text: 'text-red-400', dot: 'bg-red-600' },
  [DeviceStatus.BLOCKED]: { bg: 'bg-zinc-800/40', border: 'border-dashed border-zinc-500/50', glow: 'shadow-zinc-500/20', text: 'text-zinc-400', dot: 'bg-zinc-500' },
};

export const STATUS_LABELS: Record<DeviceStatus, string> = {
  [DeviceStatus.OFF]: '关机',
  [DeviceStatus.STANDBY]: '待机中',
  [DeviceStatus.ON]: '运行',
  [DeviceStatus.WARNING]: '温度警示',
  [DeviceStatus.FAULT]: '故障',
  [DeviceStatus.FUSED]: '熔断保护',
  [DeviceStatus.BLOCKED]: '依赖阻断',
};
