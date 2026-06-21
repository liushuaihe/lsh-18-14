import { useEffect, useRef } from 'react';
import { useMonitorStore } from '../store/useMonitorStore';

export function useTemperatureSimulation() {
  const tick = useMonitorStore(s => s.tickTemperature);
  const tickUPS = useMonitorStore(s => s.tickUPS);
  const powerMode = useMonitorStore(s => s.powerMode);
  const upsActive = useMonitorStore(s => s.upsActive);
  const simSpeed = useMonitorStore(s => s.simSpeed);
  const rafRef = useRef<number>();
  const lastTickRef = useRef<number>(0);
  const lastUpsTickRef = useRef<number>(0);

  useEffect(() => {
    const INTERVAL = 500;
    const UPS_INTERVAL = 1000;

    const loop = () => {
      const now = performance.now();
      if (now - lastTickRef.current >= INTERVAL) {
        tick();
        lastTickRef.current = now;
      }
      if (upsActive && powerMode === 'ups' && now - lastUpsTickRef.current >= UPS_INTERVAL) {
        const realElapsed = (now - lastUpsTickRef.current) / 1000;
        tickUPS(Math.min(realElapsed * simSpeed, 30));
        lastUpsTickRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick, tickUPS, powerMode, upsActive, simSpeed]);
}
