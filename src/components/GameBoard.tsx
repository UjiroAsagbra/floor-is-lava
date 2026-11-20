import { useEffect, useMemo, useState } from 'react';
import { lavaAdjacentCount } from '../engine/FeelEngine';
import { getTile, manhattanNeighbors } from '../engine/board';
import type { GameState, Tile as TileModel } from '../types/game';
import { Tile } from './Tile';

interface GameBoardProps {
  state: GameState;
  legalMoves: TileModel[];
  onTileClick: (x: number, y: number) => void;
  slowMoActive: boolean;
}

export function GameBoard({ state, legalMoves, onTileClick, slowMoActive }: GameBoardProps) {
  const shake =
    state.chaos?.shakeUntil !== undefined &&
    state.survivalSeconds <= (state.chaos.shakeUntil ?? 0);
  const blackout = state.chaos?.blackout && state.survivalSeconds < state.chaos.endsAt;
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const lavaNear = useMemo(() => {
    const set = new Set<string>();
    for (const { x, y } of manhattanNeighbors(state.player.x, state.player.y)) {
      const t = getTile(state.board, x, y);
      if (t?.kind === 'lava' || t?.kind === 'cracked') set.add(`${x},${y}`);
    }
    return set;
  }, [state.board, state.player]);

  const adjLava = lavaAdjacentCount(state.board, state.player);

  useEffect(() => {
    if (!shake) return;
    const batch = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
    }));
    setParticles(batch);
    const t = setTimeout(() => setParticles([]), 600);
    return () => clearTimeout(t);
  }, [shake, state.survivalSeconds]);

  useEffect(() => {
    if (state.punchToken === 0) return;
    /* punch driven by CSS animation reset via key */
  }, [state.punchToken]);

  const moveSet = new Set(legalMoves.map((t) => `${t.x},${t.y}`));
  const danger = state.danger;

  return (
    <div className="relative mx-auto w-full max-w-[min(92vw,520px)] p-2">
      <div
        className={`board-shell relative ${slowMoActive ? 'slow-mo-active' : ''}`}
        data-punch={state.punchToken}
      >
        <div
          className="danger-vignette pointer-events-none absolute -inset-3 rounded-xl"
          style={{ opacity: 0.15 + danger * 0.7 }}
          aria-hidden
        />
        <div
          className={`relative grid grid-cols-10 gap-1 rounded-lg bg-black/40 p-2 shadow-[0_0_40px_rgba(255,69,0,0.15)] ${shake ? 'screen-shake' : ''}`}
        >
          {state.board.map((row) =>
            row.map((tile) => (
              <Tile
                key={`${tile.x}-${tile.y}`}
                tile={tile}
                isPlayer={tile.x === state.player.x && tile.y === state.player.y}
                canMove={moveSet.has(`${tile.x},${tile.y}`)}
                lavaNear={lavaNear.has(`${tile.x},${tile.y}`)}
                onClick={() => onTileClick(tile.x, tile.y)}
              />
            ))
          )}
          {blackout && (
            <div className="blackout-overlay absolute inset-0 z-10 rounded-lg" aria-hidden />
          )}
          {particles.map((p) => (
            <span
              key={p.id}
              className="particle bg-amber-400"
              style={
                {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  '--tx': `${(Math.random() - 0.5) * 40}px`,
                  '--ty': `${(Math.random() - 0.5) * 40}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        {adjLava >= 2 && (
          <p className="danger-pulse mt-2 text-center text-xs font-bold uppercase tracking-[0.35em] text-orange-400">
            Lava closing in
          </p>
        )}
      </div>
    </div>
  );
}