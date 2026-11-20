import {
  cloneBoard,
  farthestTilesFrom,
  getTile,
  isInSafeZone,
  setTileKind,
  tickFrozenAndCracked,
} from './board';
import { GRID_SIZE, type ChaosModifier, type Player, type Tile } from '../types/game';

export function seedInitialLava(
  board: Tile[][],
  player: Player,
  rand: () => number
): Tile[][] {
  const next = cloneBoard(board);
  const seeds = farthestTilesFrom(next, player, 2, rand);
  for (const { x, y } of seeds) {
    setTileKind(next, x, y, 'lava');
  }
  return next;
}

function lavaFrontier(board: Tile[][]): { x: number; y: number }[] {
  const frontier: { x: number; y: number }[] = [];
  const dirs = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (board[y][x].kind !== 'lava') continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        const n = getTile(board, nx, ny);
        if (!n) continue;
        if (n.kind === 'safe' || n.kind === 'treasure' || n.kind === 'powerup') {
          if (!frontier.some((f) => f.x === nx && f.y === ny)) {
            frontier.push({ x: nx, y: ny });
          }
        }
      }
    }
  }
  return frontier;
}

export interface LavaSpreadOptions {
  spreadCount: number;
  crackDelay: number;
  chaos: ChaosModifier | null;
  rand: () => number;
  skipSpread?: boolean;
}

export function spreadLava(board: Tile[][], options: LavaSpreadOptions): Tile[][] {
  let next = tickFrozenAndCracked(board);

  if (options.skipSpread) return next;

  const mult = options.chaos?.spreadMultiplier ?? 1;
  let count = Math.max(1, Math.floor(options.spreadCount * mult));
  const crackDelay =
    options.chaos?.crackDelayOverride ?? options.crackDelay;
  const zone = options.chaos?.safeZone;

  const frontier = lavaFrontier(next);
  if (frontier.length === 0) return next;

  for (let i = 0; i < count; i++) {
    const shuffled = [...frontier].sort(() => options.rand() - 0.5);
    let spread = false;
    for (const { x, y } of shuffled) {
      const t = next[y][x];
      if (t.kind === 'lava' || t.kind === 'frozen') continue;
      if (t.protectedTicks > 0 || isInSafeZone(x, y, zone)) continue;
      if (t.kind === 'cracked') {
        t.crackTicks = Math.min(t.crackTicks, crackDelay);
        if (t.crackTicks <= 0) t.kind = 'lava';
      } else {
        t.kind = 'cracked';
        t.crackTicks = crackDelay;
      }
      spread = true;
      break;
    }
    if (!spread) break;
  }
  return next;
}

export function igniteTiles(
  board: Tile[][],
  positions: { x: number; y: number }[],
  unoccupiedOnly: boolean,
  player: Player
): Tile[][] {
  const next = cloneBoard(board);
  for (const { x, y } of positions) {
    if (unoccupiedOnly && x === player.x && y === player.y) continue;
    const t = next[y][x];
    if (t.kind === 'frozen' || t.protectedTicks > 0) continue;
    if (t.kind === 'lava') continue;
    t.kind = 'cracked';
    t.crackTicks = 1;
  }
  return next;
}

export function playerOnLava(board: Tile[][], player: Player): boolean {
  const t = getTile(board, player.x, player.y);
  return t?.kind === 'lava';
}