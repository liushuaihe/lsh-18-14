import { Device, DeviceStatus, UPSBattery, ShutdownStep } from '../types';
import { isDeviceRunning } from './stateMachine';

export function calculateRemainingMinutes(battery: UPSBattery): number {
  if (battery.loadKW <= 0) return Infinity;
  return (battery.currentCapacityKWh / battery.loadKW) * 60;
}

export function getCurrentLoadKW(devices: Record<string, Device>): number {
  return Object.values(devices)
    .filter(d => isDeviceRunning(d.status))
    .reduce((sum, d) => sum + d.powerConsumption, 0);
}

export function buildShutdownTimeline(
  devices: Record<string, Device>,
  battery: UPSBattery
): ShutdownStep[] {
  const runningDevices = Object.values(devices)
    .filter(d => isDeviceRunning(d.status) && d.powerConsumption > 0)
    .sort((a, b) => b.shutdownPriority - a.shutdownPriority);

  const steps: ShutdownStep[] = [];
  let cumulativeLoad = battery.loadKW;
  let remainingCapacity = battery.currentCapacityKWh;
  let cumulativeSaved = 0;

  for (const dev of runningDevices) {
    const currentRemaining = remainingCapacity / Math.max(0.001, cumulativeLoad) * 60;
    const newLoad = cumulativeLoad - dev.powerConsumption;
    const newRemaining = newLoad > 0 ? remainingCapacity / newLoad * 60 : Infinity;
    const savedMinutes = newRemaining - currentRemaining;

    cumulativeSaved += Math.max(0, savedMinutes);

    steps.push({
      deviceId: dev.id,
      deviceName: dev.name,
      priority: dev.shutdownPriority,
      powerKW: dev.powerConsumption,
      savedMinutes: Math.max(0, savedMinutes),
      cumulativeLoadKW: Math.max(0, newLoad),
      cumulativeSavedMinutes: cumulativeSaved,
    });

    cumulativeLoad = Math.max(0, newLoad);
  }

  return steps;
}

export function getDevicesToShutdown(
  devices: Record<string, Device>,
  targetMinutes: number,
  battery: UPSBattery
): string[] {
  const timeline = buildShutdownTimeline(devices, battery);
  const currentRemaining = calculateRemainingMinutes(battery);

  if (currentRemaining >= targetMinutes) return [];

  const needed: string[] = [];
  for (const step of timeline) {
    needed.push(step.deviceId);
    if (currentRemaining + step.cumulativeSavedMinutes >= targetMinutes) {
      break;
    }
  }

  return needed;
}

export function executePriorityShutdown(
  devices: Record<string, Device>,
  fromPriority: number
): Record<string, Device> {
  const newDevices = { ...devices };
  const toShutdown = Object.values(devices)
    .filter(d => isDeviceRunning(d.status) && d.shutdownPriority >= fromPriority)
    .sort((a, b) => b.shutdownPriority - a.shutdownPriority);

  for (const dev of toShutdown) {
    newDevices[dev.id] = {
      ...dev,
      status: DeviceStatus.OFF,
      lastStatusChange: Date.now(),
    };
  }

  return newDevices;
}

export function tickBatteryDrain(
  battery: UPSBattery,
  elapsedSeconds: number
): UPSBattery {
  if (battery.loadKW <= 0) return battery;

  const consumedKWh = (battery.loadKW * elapsedSeconds) / 3600;
  const newCapacity = Math.max(0, battery.currentCapacityKWh - consumedKWh);

  return {
    ...battery,
    currentCapacityKWh: newCapacity,
    remainingMinutes: calculateRemainingMinutes({ ...battery, currentCapacityKWh: newCapacity }),
    healthPercent: (newCapacity / battery.capacityKWh) * 100,
  };
}
