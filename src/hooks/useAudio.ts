import { useCallback, useRef } from 'react';

export type SoundId =
  | 'move'
  | 'lava'
  | 'powerup'
  | 'treasure'
  | 'event'
  | 'gameover'
  | 'nearMiss'
  | 'escape'
  | 'streak';

export function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (id: SoundId) => {
      try {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        const presets: Record<
          SoundId,
          { freq: number; type: OscillatorType; dur: number; vol: number }
        > = {
          move: { freq: 440, type: 'sine', dur: 0.06, vol: 0.08 },
          lava: { freq: 120, type: 'sawtooth', dur: 0.12, vol: 0.06 },
          powerup: { freq: 660, type: 'square', dur: 0.15, vol: 0.07 },
          treasure: { freq: 880, type: 'sine', dur: 0.2, vol: 0.09 },
          event: { freq: 220, type: 'triangle', dur: 0.35, vol: 0.1 },
          gameover: { freq: 80, type: 'sawtooth', dur: 0.5, vol: 0.12 },
          nearMiss: { freq: 520, type: 'square', dur: 0.18, vol: 0.11 },
          escape: { freq: 740, type: 'sine', dur: 0.28, vol: 0.12 },
          streak: { freq: 980, type: 'triangle', dur: 0.22, vol: 0.1 },
        };

        const p = presets[id];
        osc.type = p.type;
        osc.frequency.setValueAtTime(p.freq, now);
        if (id === 'treasure') {
          osc.frequency.exponentialRampToValueAtTime(1200, now + p.dur * 0.5);
        }
        if (id === 'gameover') {
          osc.frequency.exponentialRampToValueAtTime(40, now + p.dur);
        }
        gain.gain.setValueAtTime(p.vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
        osc.start(now);
        osc.stop(now + p.dur);
      } catch {
        /* no audio */
      }
    },
    [ensureContext]
  );

  return { play, prime: ensureContext };
}