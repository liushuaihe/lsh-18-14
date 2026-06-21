import React, { useState } from 'react';
import { useMonitorStore } from '../../store/useMonitorStore';
import { DeviceStatus, SHUTDOWN_PRIORITY_LABELS, SHUTDOWN_PRIORITY_COLORS } from '../../types';
import {
  Battery, BatteryCharging, BatteryWarning, BatteryFull,
  Zap, Power, RotateCcw, Clock, Activity,
  ChevronDown, ChevronRight, AlertTriangle, Plug,
} from 'lucide-react';

export const UPSPanel: React.FC = () => {
  const { devices, upsBattery, powerMode, upsActive, shutdownTimeline, shutdownLog, simSpeed } = useMonitorStore();
  const simulateFailure = useMonitorStore(s => s.simulateMainPowerFailure);
  const restorePower = useMonitorStore(s => s.restoreMainPower);
  const setSimSpeed = useMonitorStore(s => s.setSimSpeed);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [logCollapsed, setLogCollapsed] = useState(false);

  const onCount = Object.values(devices).filter(d =>
    d.status === DeviceStatus.ON || d.status === DeviceStatus.WARNING
  ).length;
  const totalLoad = Object.values(devices)
    .filter(d => d.status === DeviceStatus.ON || d.status === DeviceStatus.WARNING)
    .reduce((s, d) => s + d.powerConsumption, 0);

  const healthPct = upsBattery.healthPercent;
  const isCritical = healthPct < 20;
  const isLow = healthPct < 50 && !isCritical;

  const formatMinutes = (m: number) => {
    if (!isFinite(m) || m <= 0) return '0:00';
    const hrs = Math.floor(m / 60);
    const mins = Math.floor(m % 60);
    const secs = Math.floor((m * 60) % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const batteryIcon = () => {
    if (powerMode === 'mains' && upsBattery.charging) return <BatteryCharging size={28} />;
    if (powerMode === 'off') return <BatteryWarning size={28} />;
    if (isCritical) return <BatteryWarning size={28} />;
    if (isLow) return <Battery size={28} />;
    return <BatteryFull size={28} />;
  };

  const batteryColor = () => {
    if (powerMode === 'off') return 'text-red-500';
    if (isCritical) return 'text-rose-400';
    if (isLow) return 'text-amber-400';
    if (powerMode === 'ups') return 'text-amber-400';
    return 'text-emerald-400';
  };

  const batteryBarColor = () => {
    if (powerMode === 'off') return 'from-red-600 to-red-800';
    if (isCritical) return 'from-rose-500 to-rose-700';
    if (isLow) return 'from-amber-500 to-amber-700';
    if (powerMode === 'ups') return 'from-amber-400 to-amber-600';
    return 'from-emerald-400 to-emerald-600';
  };

  const modeLabel = () => {
    switch (powerMode) {
      case 'mains': return '市电供电';
      case 'ups': return 'UPS 供电';
      case 'off': return '电力中断';
    }
  };

  const modeBadgeColor = () => {
    switch (powerMode) {
      case 'mains': return 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50';
      case 'ups': return 'bg-amber-900/40 text-amber-400 border-amber-500/50';
      case 'off': return 'bg-red-900/40 text-red-400 border-red-500/50';
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-orbitron text-sm tracking-[0.2em] text-cyber-cyan neon-text-cyan flex items-center gap-2">
          <Zap size={16} />
          UPS 续航预测
        </h2>
        <span className={`text-[10px] font-mono px-2 py-1 rounded border ${modeBadgeColor()} flex items-center gap-1`}>
          <Plug size={10} />
          {modeLabel()}
        </span>
      </div>

      <div className={`rounded-lg border bg-cyber-panel/60 backdrop-blur-sm p-4 relative overflow-hidden hud-corner
        ${powerMode === 'ups' ? 'border-amber-500/60 shadow-neon-amber' : powerMode === 'off' ? 'border-red-500/60 shadow-neon-red' : 'border-cyber-line'}
      `}>
        {powerMode === 'ups' && (
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-scanlines animate-scanline" />
        )}

        <div className="flex items-start gap-4">
          <div className={`flex flex-col items-center justify-center ${batteryColor()} ${isCritical && powerMode === 'ups' ? 'animate-blink-led' : ''}`}>
            {batteryIcon()}
            <span className="text-[9px] font-mono mt-1 opacity-70">
              {upsBattery.charging ? '充电中' : powerMode === 'off' ? '耗尽' : '放电'}
            </span>
          </div>

          <div className="flex-1">
            <div className="text-[10px] font-mono text-slate-500 mb-1">{upsBattery.name}</div>

            <div className="w-full h-5 rounded-full bg-slate-800/80 border border-slate-600/50 overflow-hidden relative mb-2">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${batteryBarColor()} transition-all duration-700 ease-out relative`}
                style={{ width: `${Math.max(0, Math.min(100, healthPct))}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-orbitron font-bold text-white mix-blend-difference">
                {healthPct.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <MetricItem
                label="容量"
                value={`${upsBattery.currentCapacityKWh.toFixed(1)}`}
                unit="kWh"
                sub={`/${upsBattery.capacityKWh}`}
                color={isCritical ? 'rose' : isLow ? 'amber' : 'cyan'}
              />
              <MetricItem
                label="负载"
                value={`${upsBattery.loadKW.toFixed(1)}`}
                unit="kW"
                sub={`${onCount}台运行`}
                color="amber"
              />
              <MetricItem
                label="续航"
                value={formatMinutes(upsBattery.remainingMinutes)}
                unit=""
                sub={upsBattery.remainingMinutes > 60 ? '' : `≈${Math.ceil(upsBattery.remainingMinutes)}分钟`}
                color={isCritical ? 'rose' : isLow ? 'amber' : 'emerald'}
                highlight={powerMode === 'ups'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-cyber-line bg-cyber-panel/60 p-3 relative overflow-hidden hud-corner">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-mono text-cyber-grey flex items-center gap-2">
            <Power size={12} className="text-cyber-cyan" />
            模拟控制台
          </div>
          {powerMode === 'ups' && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-500">速度</span>
              {[1, 5, 20, 60].map(s => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all
                    ${simSpeed === s
                      ? 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/60'
                      : 'bg-slate-800/40 text-slate-500 border-slate-600/40 hover:text-cyber-cyan'
                    }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {powerMode === 'mains' && (
            <button
              onClick={simulateFailure}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-rose-500/50
                bg-rose-900/30 text-rose-300 hover:bg-rose-900/50 hover:border-rose-400 transition-all
                font-mono text-xs font-bold"
            >
              <AlertTriangle size={14} />
              模拟主电故障
            </button>
          )}
          {powerMode !== 'mains' && (
            <button
              onClick={restorePower}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-emerald-500/50
                bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all
                font-mono text-xs font-bold"
            >
              <RotateCcw size={14} />
              恢复市电供电
            </button>
          )}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-600/40 bg-slate-800/40">
            <Activity size={12} className="text-amber-400" />
            <div className="text-[10px] font-mono">
              <div className="text-slate-500">系统总负载</div>
              <div className="text-amber-400 font-bold">{totalLoad} kW</div>
            </div>
          </div>
        </div>
      </div>

      {shutdownTimeline.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-cyber-panel/60 overflow-hidden">
          <button
            onClick={() => setTimelineCollapsed(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-cyber-line/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400">
              <Clock size={12} />
              优先级关停时间线 ({shutdownTimeline.length} 步)
            </div>
            {timelineCollapsed ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
          </button>

          {!timelineCollapsed && (
            <div className="px-3 pb-3">
              <div className="flex flex-col gap-1.5">
                {shutdownTimeline.map((step, idx) => {
                  const colors = SHUTDOWN_PRIORITY_COLORS[step.priority] || SHUTDOWN_PRIORITY_COLORS[3];
                  const label = SHUTDOWN_PRIORITY_LABELS[step.priority] || `优先级 ${step.priority}`;
                  const logEntry = shutdownLog.find(l => l.deviceId === step.deviceId);
                  const isShutdown = !!logEntry;

                  return (
                    <div
                      key={step.deviceId}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-md border transition-all
                        ${isShutdown
                          ? 'bg-slate-800/60 border-slate-600/30 opacity-60'
                          : `${colors.bg} ${colors.border}`
                        }
                      `}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}
                        ${isShutdown ? 'opacity-40' : 'shadow-[0_0_6px_currentColor]'}
                      `} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-mono ${isShutdown ? 'line-through text-slate-500' : colors.text}`}>
                            {step.deviceName}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-slate-400">
                            P{step.priority} · {label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[9px] font-mono text-slate-500">
                          <span>功耗 {step.powerKW}kW</span>
                          <span>可延 +{step.savedMinutes.toFixed(1)}min</span>
                          <span>剩余负载 {step.cumulativeLoadKW.toFixed(1)}kW</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isShutdown ? (
                          <span className="text-[9px] font-mono text-slate-600">
                            已关停
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400">
                            +{step.cumulativeSavedMinutes.toFixed(1)}min
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-500">完全关停后预估续航</span>
                  <span className="text-emerald-400 font-bold">
                    {formatMinutes(upsBattery.currentCapacityKWh / Math.max(0.001, upsBattery.loadKW) * 60 + (shutdownTimeline.length > 0 ? shutdownTimeline[shutdownTimeline.length - 1].cumulativeSavedMinutes : 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {shutdownLog.length > 0 && (
        <div className="rounded-lg border border-rose-500/30 bg-cyber-panel/60 overflow-hidden">
          <button
            onClick={() => setLogCollapsed(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-cyber-line/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-[11px] font-mono text-rose-400">
              <AlertTriangle size={12} />
              关停日志 ({shutdownLog.length})
            </div>
            {logCollapsed ? <ChevronRight size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
          </button>

          {!logCollapsed && (
            <div className="px-3 pb-3 max-h-40 overflow-y-auto">
              {shutdownLog.map((entry, idx) => {
                const colors = SHUTDOWN_PRIORITY_COLORS[entry.priority] || SHUTDOWN_PRIORITY_COLORS[3];
                const label = SHUTDOWN_PRIORITY_LABELS[entry.priority] || `P${entry.priority}`;
                return (
                  <div key={idx} className="flex items-center gap-2 py-1 border-b border-slate-700/30 last:border-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">{entry.deviceName}</span>
                    <span className="text-[9px] font-mono text-slate-500">P{entry.priority} · {label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-cyber-line bg-cyber-panel/40 p-3">
        <div className="text-[10px] font-mono text-slate-500 mb-2">设备关停优先级一览</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.values(devices)
            .filter(d => d.powerConsumption > 0)
            .sort((a, b) => a.shutdownPriority - b.shutdownPriority)
            .map(dev => {
              const colors = SHUTDOWN_PRIORITY_COLORS[dev.shutdownPriority] || SHUTDOWN_PRIORITY_COLORS[3];
              const isRunning = dev.status === DeviceStatus.ON || dev.status === DeviceStatus.WARNING || dev.status === DeviceStatus.STANDBY;
              return (
                <div
                  key={dev.id}
                  className={`flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded border transition-all
                    ${isRunning ? `${colors.bg} ${colors.border}` : 'bg-slate-800/30 border-slate-700/30 opacity-50'}
                  `}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? colors.dot : 'bg-slate-600'}`} />
                  <span className={isRunning ? colors.text : 'text-slate-500'}>{dev.id}</span>
                  <span className="text-slate-600">P{dev.shutdownPriority}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

interface MetricItemProps {
  label: string;
  value: string;
  unit: string;
  sub?: string;
  color: 'cyan' | 'amber' | 'rose' | 'emerald';
  highlight?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, unit, sub, color, highlight }) => {
  const colorMap = {
    cyan: 'text-cyber-cyan',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    emerald: 'text-emerald-400',
  };
  return (
    <div className="text-center">
      <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={`text-sm font-orbitron font-bold ${colorMap[color]} ${highlight ? 'neon-text-amber' : ''} leading-tight`}>
        {value}
        {unit && <span className="text-[9px] opacity-60 ml-0.5">{unit}</span>}
      </div>
      {sub && <div className="text-[8px] font-mono text-slate-600">{sub}</div>}
    </div>
  );
};
