import { useCallback, useEffect, useRef } from 'react';

export type MusicState = 'menu' | 'calm' | 'pulse' | 'danger' | 'chaos' | 'gameover';

const STATE_PRESETS: Record<
  MusicState,
  { base: number; filter: number; gain: number; lfo: number }
> = {
  menu: { base: 55, filter: 400, gain: 0.04, lfo: 0.1 },
  calm: { base: 72, filter: 800, gain: 0.05, lfo: 0.15 },
  pulse: { base: 92, filter: 1200, gain: 0.06, lfo: 0.35 },
  danger: { base: 110, filter: 1800, gain: 0.085, lfo: 0.55 },
  chaos: { base: 130, filter: 2400, gain: 0.1, lfo: 0.75 },
  gameover: { base: 45, filter: 300, gain: 0.03, lfo: 0.05 },
};

export function useMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const stateRef = useRef<MusicState>('menu');

  const ensure = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const startIfNeeded = useCallback(() => {
    const ctx = ensure();
    if (oscRef.current) return;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    lfoGain.gain.value = 6;
    filter.type = 'lowpass';

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const preset = STATE_PRESETS[stateRef.current];
    osc.frequency.value = preset.base;
    filter.frequency.value = preset.filter;
    gain.gain.value = preset.gain;
    lfo.frequency.value = preset.lfo;

    osc.start();
    lfo.start();

    oscRef.current = osc;
    lfoRef.current = lfo;
    gainRef.current = gain;
    filterRef.current = filter;
  }, [ensure]);

  const setMusicState = useCallback(
    (state: MusicState) => {
      stateRef.current = state;
      startIfNeeded();
      const ctx = ctxRef.current;
      if (!ctx || !oscRef.current || !gainRef.current || !filterRef.current || !lfoRef.current)
        return;

      const preset = STATE_PRESETS[state];
      const now = ctx.currentTime;
      oscRef.current.frequency.exponentialRampToValueAtTime(
        Math.max(30, preset.base),
        now + 0.4
      );
      filterRef.current.frequency.exponentialRampToValueAtTime(
        Math.max(80, preset.filter),
        now + 0.4
      );
      gainRef.current.gain.exponentialRampToValueAtTime(Math.max(0.001, preset.gain), now + 0.35);
      lfoRef.current.frequency.exponentialRampToValueAtTime(Math.max(0.05, preset.lfo), now + 0.35);
    },
    [startIfNeeded]
  );

  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      lfoRef.current?.stop();
    };
  }, []);

  return { setMusicState, primeMusic: startIfNeeded };
}