import type { PowerUpType, Tile as TileModel } from '../types/game';

const POWER_ICON: Record<PowerUpType, string> = {
  speed: '⚡',
  freeze: '❄',
  shield: '🛡',
  teleport: '◎',
};

interface TileProps {
  tile: TileModel;
  isPlayer: boolean;
  canMove: boolean;
  lavaNear?: boolean;
  onClick: () => void;
}

export function Tile({ tile, isPlayer, canMove, lavaNear, onClick }: TileProps) {
  const kindClass = {
    safe: 'tile-safe',
    lava: 'tile-lava',
    cracked: 'tile-crack',
    frozen: 'tile-frozen',
    treasure: 'tile-treasure',
    powerup: 'tile-powerup',
  }[tile.kind];

  return (
    <button
      type="button"
      aria-label={`Tile ${tile.x} ${tile.y} ${tile.kind}`}
      className={`relative aspect-square w-full rounded-sm border border-white/10 transition-transform duration-150 ease-out ${kindClass} ${
        canMove ? 'tile-move-hint' : ''
      } ${lavaNear ? 'tile-danger-edge' : ''} ${isPlayer ? 'tile-player ring-2 ring-cyan-300/80' : ''}`}
      onClick={canMove ? onClick : undefined}
      disabled={!canMove}
    >
      {tile.kind === 'treasure' && (
        <span className="absolute inset-0 flex items-center justify-center text-lg drop-shadow-[0_0_6px_gold]">
          ★
        </span>
      )}
      {tile.kind === 'powerup' && tile.powerUp && (
        <span className="absolute inset-0 flex items-center justify-center text-base">
          {POWER_ICON[tile.powerUp]}
        </span>
      )}
      {isPlayer && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="player-orb" />
        </span>
      )}
    </button>
  );
}