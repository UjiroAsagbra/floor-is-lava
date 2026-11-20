import { chebyshevDistance, cloneBoard, getTile, manhattanNeighbors } from './board';
import { GRID_SIZE, type Player, type Tile } from '../types/game';

export interface LeftTileMark {
  x: number;
  y: number;
  atTick: number;
  kindWhenLeft: Tile['kind'];
  rewarded: boolean;
}

export function lavaAdjacentCount(board: Tile[][], player: Player): number {
  let n = 0;
  for (const { x, y } of manhattanNeighbors(player.x, player.y)) {
    const t = getTile(board, x, y);
    if (t?.kind === 'lava') n += 1;
  }
  return n;
}

export function dangerLevel(board: Tile[][], player: Player): number {
  const adj = lavaAdjacentCount(board, player);
  let crackedNear = 0;
  for (const { x, y } of manhattanNeighbors(player.x, player.y)) {
    const t = getTile(board, x, y);
    if (t?.kind === 'cracked') crackedNear += 1;
  }
  const safeLeft = countReachableSafe(board, player);
  const squeeze = safeLeft < 12 ? 0.3 : safeLeft < 25 ? 0.15 : 0;
  return Math.min(1, adj * 0.22 + crackedNear * 0.12 + squeeze);
}

function countReachableSafe(board: Tile[][], player: Player): number {
  let count = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = board[y][x];
      if (t.kind !== 'lava' && chebyshevDistance(x, y, player.x, player.y) <= 3) count += 1;
    }
  }
  return count;
}

export interface SpreadFeelResult {
  nearMiss: boolean;
  board: Tile[][];
}

/** Tiles that became cracked/lava this tick adjacent to player (not on player). */
export function applySpreadFeel(
  before: Tile[][],
  after: Tile[][],
  player: Player
): { nearMiss: boolean; ignitedNear: number } {
  let ignitedNear = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const b = before[y][x];
      const a = after[y][x];
      if (b.kind === a.kind && b.crackTicks === a.crackTicks) continue;
      const becameHot =
        (a.kind === 'lava' && b.kind !== 'lava') ||
        (a.kind === 'cracked' && b.kind !== 'cracked');
      if (!becameHot) continue;
      const d = chebyshevDistance(x, y, player.x, player.y);
      if (d === 1) ignitedNear += 1;
    }
  }
  return { nearMiss: ignitedNear > 0, ignitedNear };
}

export function checkLastSecondEscape(
  board: Tile[][],
  mark: LeftTileMark | null
): boolean {
  if (!mark || mark.rewarded) return false;
  const t = getTile(board, mark.x, mark.y);
  if (!t) return false;
  if (t.kind !== 'lava') return false;
  const wasWalkable =
    mark.kindWhenLeft === 'safe' ||
    mark.kindWhenLeft === 'cracked' ||
    mark.kindWhenLeft === 'treasure' ||
    mark.kindWhenLeft === 'powerup' ||
    mark.kindWhenLeft === 'frozen';
  return wasWalkable;
}

export function heatMultiplier(heatStreak: number): number {
  return Math.min(4, 1 + 0.18 * Math.max(0, heatStreak - 1));
}

export function cloneMark(mark: LeftTileMark | null): LeftTileMark | null {
  return mark ? { ...mark } : null;
}

export function snapshotBoard(board: Tile[][]): Tile[][] {
  return cloneBoard(board);
}