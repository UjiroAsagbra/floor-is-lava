import type { GameMode, RunRecord } from '../types/game';

interface GameOverModalProps {
  score: number;
  time: number;
  bestScore: number;
  runs: RunRecord[];
  mode: GameMode;
  onRestart: () => void;
  onMenu: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function GameOverModal({
  score,
  time,
  bestScore,
  runs,
  mode,
  onRestart,
  onMenu,
}: GameOverModalProps) {
  const top = runs.filter((r) => r.mode === mode).slice(0, 5);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-orange-500/30 bg-[#12121f] p-6 shadow-[0_0_60px_rgba(255,69,0,0.25)]">
        <h2 className="text-center text-3xl font-black uppercase tracking-wider text-orange-400 neon-text">
          Game Over
        </h2>
        <dl className="mt-6 space-y-3 text-center">
          <Row label="Final Score" value={String(score)} />
          <Row label="Survived" value={formatTime(time)} />
          <Row label="Best Score" value={String(Math.max(bestScore, score))} />
        </dl>
        {top.length > 0 && (
          <div className="mt-6 rounded-lg border border-white/10 bg-black/30 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
              Local Top Runs
            </h3>
            <ul className="space-y-1 text-sm">
              {top.map((r, i) => (
                <li key={`${r.date}-${i}`} className="flex justify-between text-white/80">
                  <span>
                    #{i + 1} {r.score} pts
                  </span>
                  <span className="text-white/40">{formatTime(r.time)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 py-3 font-bold uppercase tracking-wide text-white shadow-lg hover:brightness-110"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex-1 rounded-lg border border-white/20 py-3 font-semibold uppercase tracking-wide hover:bg-white/5"
          >
            Menu
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-white/40">Press Enter to restart</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-white/50">{label}</dt>
      <dd className="text-2xl font-semibold text-cyan-300">{value}</dd>
    </div>
  );
}