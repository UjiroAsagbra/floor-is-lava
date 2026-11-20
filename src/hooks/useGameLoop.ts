import { useEffect, useRef } from 'react';

export function useGameLoop(
  tick: () => void,
  intervalMs: number,
  enabled: boolean,
  timeScale = 1
): void {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!enabled) return;
    const ms = Math.max(120, Math.round(intervalMs * timeScale));

    const id = window.setInterval(() => {
      if (document.hidden) return;
      tickRef.current();
    }, ms);

    return () => window.clearInterval(id);
  }, [intervalMs, enabled, timeScale]);
}