import { cloneBoard, getTile, randomSafeTile } from './board';
import type { GameState, PowerUpType, Tile } from '../types/game';

const POWERUP_TYPES: PowerUpType[] = ['speed', 'freeze', 'shield', 'teleport'];

export function spawnPowerUp(board: Tile[][], rand: () => number): Tile[][] {
  const pos = randomSafeTile(board, rand);
  if (!pos) return board;
  const next = cloneBoard(board);
  const t = getTile(next, pos.x, pos.y);
  if (!t || t.kind === 'lava' || t.kind === 'treasure') return board;
  const type = POWERUP_TYPES[Math.floor(rand() * POWERUP_TYPES.length)];
  t.kind = 'powerup';
  t.powerUp = type;
  return next;
}

export function spawnTreasure(board: Tile[][], rand: () => number): Tile[][] {
  const pos = randomSafeTile(board, rand);
  if (!pos) return board;
  const next = cloneBoard(board);
  const t = getTile(next, pos.x, pos.y);
  if (!t || t.kind === 'lava' || t.kind === 'powerup') return board;
  t.kind = 'treasure';
  return next;
}

export function applyPowerUp(state: GameState, type: PowerUpType): GameState {
  const survivalSeconds = state.survivalSeconds;
  switch (type) {
    case 'speed':
      return {
        ...state,
        buffs: { ...state.buffs, speedUntil: survivalSeconds + 5 },
        moveRange: 2,
      };
    case 'freeze':
      return {
        ...state,
        buffs: { ...state.buffs, freezeUntil: survivalSeconds + 4 },
      };
    case 'shield':
      return { ...state, shieldCharges: state.shieldCharges + 1 };
    case 'teleport': {
      const pos = randomSafeTile(state.board, () => Math.random(), state.player);
      if (!pos) return state;
      return { ...state, player: { x: pos.x, y: pos.y } };
    }
    default:
      return state;
  }
}

export function refreshMoveRange(state: GameState): number {
  if (state.buffs.speedUntil > state.survivalSeconds) return 2;
  return 1;
}