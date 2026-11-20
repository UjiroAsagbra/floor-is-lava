import type { GameState } from '../types/game';

interface HUDProps {
  state: GameState;
  bestScore: number;
  onPause: () => void;
  slowMoActive?: boolean;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function HUD({ state, bestScore, onPause, slowMoActive }: HUDProps) {
  return (
    <header className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base">
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <Stat label="SCORE" value={String(state.score)} accent="text-cyan-300" />
          <Stat label="TIME" value={formatTime(state.survivalSeconds)} accent="text-orange-300" />
          <Stat label="LV" value={String(state.level)} accent="text-fuchsia-300" />
          <Stat label="BEST" value={String(bestScore)} accent="text-amber-300" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {state.heatStreak > 0 && (
            <span className="heat-streak rounded px-2 py-0.5 text-xs font-bold text-orange-200">
              HEAT ×{state.heatStreak}
            </span>
          )}
          {state.moveStreak > 3 && (
            <span className="text-[10px] uppercase tracking-wider text-white/50">
              Moves {state.moveStreak}
            </span>
          )}
          {state.multiplier > 1 && (
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-300 neon-text">
              Loot ×{state.multiplier.toFixed(1)}
            </span>
          )}
          {state.shieldCharges > 0 && (
            <span className="text-cyan-200" title="Shield">
              🛡×{state.shieldCharges}
            </span>
          )}
          {state.buffs.speedUntil > state.survivalSeconds && (
            <span className="text-yellow-300" title="Speed">
              ⚡
            </span>
          )}
          {state.buffs.freezeUntil > state.survivalSeconds && (
            <span className="text-sky-200" title="Freeze">
              ❄
            </span>
          )}
          {slowMoActive && (
            <span className="slow-mo-badge text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
              Slow-Mo
            </span>
          )}
          <button
            type="button"
            onClick={onPause}
            className="rounded border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wider hover:bg-white/10"
          >
            {state.status === 'paused' ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="danger-meter h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.round(state.danger * 100)}%` }}
        />
      </div>
    </header>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div>
      <div className="text-[10px] tracking-widest text-white/50">{label}</div>
      <div className={`font-semibold tabular-nums ${accent} neon-text`}>{value}</div>
    </div>
  );
}