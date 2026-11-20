import { THEMES, isThemeUnlocked, type ThemeId } from '../engine/themes';
import type { RunRecord } from '../types/game';

interface SplashProps {
  bestScore: number;
  runs: RunRecord[];
  achievements: string[];
  themeId: ThemeId;
  onStart: (mode: 'endless' | 'daily') => void;
  onSelectTheme: (id: ThemeId) => void;
}

export function Splash({
  bestScore,
  runs,
  achievements,
  themeId,
  onStart,
  onSelectTheme,
}: SplashProps) {
  return (
    <main className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
      <p className="mb-2 text-xs uppercase tracking-[0.4em] text-orange-400/80">Survive the grid</p>
      <h1 className="text-4xl font-black uppercase leading-tight sm:text-6xl">
        <span className="block text-cyan-300 neon-text">The Floor</span>
        <span className="block text-orange-400 neon-text">Is Lava</span>
      </h1>
      <p className="mt-4 max-w-sm text-sm text-white/60">
        Chain clutch escapes and near-misses to build <span className="text-orange-300">HEAT</span>.
        Clip-worthy runs start in under 20 seconds.
      </p>
      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => onStart('endless')}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 py-4 text-lg font-bold uppercase tracking-wide shadow-[0_0_24px_rgba(0,212,255,0.35)] hover:brightness-110"
        >
          Endless
        </button>
        <button
          type="button"
          onClick={() => onStart('daily')}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-4 text-lg font-bold uppercase tracking-wide hover:bg-cyan-500/20"
        >
          Daily Challenge
        </button>
      </div>
      <ThemePicker
        themeId={themeId}
        achievements={achievements}
        bestScore={bestScore}
        onSelect={onSelectTheme}
      />
      <p className="mt-6 text-sm text-amber-300/90">
        High score: <span className="font-semibold tabular-nums">{bestScore}</span>
      </p>
      {runs.length > 0 && <LeaderboardSnippet runs={runs} />}
    </main>
  );
}

function ThemePicker({
  themeId,
  achievements,
  bestScore,
  onSelect,
}: {
  themeId: ThemeId;
  achievements: string[];
  bestScore: number;
  onSelect: (id: ThemeId) => void;
}) {
  return (
    <div className="mt-8 w-full max-w-md">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/40">
        Board theme
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {THEMES.map((t) => {
          const unlocked = isThemeUnlocked(t.id, achievements, bestScore);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && onSelect(t.id)}
              className={`rounded-lg border px-3 py-2 text-xs uppercase tracking-wide ${
                themeId === t.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                  : 'border-white/15 bg-black/30 text-white/70'
              } ${!unlocked ? 'opacity-40' : 'hover:border-white/30'}`}
              title={unlocked ? t.name : t.unlockHint}
            >
              {t.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardSnippet({ runs }: { runs: RunRecord[] }) {
  const top = runs.slice(0, 3);
  return (
    <div className="mt-4 w-full max-w-xs rounded-lg border border-white/10 bg-black/30 p-3 text-left text-xs text-white/60">
      <div className="mb-1 font-semibold uppercase tracking-wider text-white/40">Leaderboard</div>
      {top.map((r, i) => (
        <div key={r.date} className="flex justify-between">
          <span>
            {i + 1}. {r.score} ({r.mode})
          </span>
          <span>{r.time}s</span>
        </div>
      ))}
    </div>
  );
}