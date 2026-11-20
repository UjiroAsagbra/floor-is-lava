import { GRID_SIZE, type Player, type Tile, type TileKind } from '../types/game';

export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function dailySeedFromDate(d = new Date()): number {
  const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
  }
  return h >>> 0;
}

export function createEmptyBoard(): Tile[][] {
  const board: Tile[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        kind: 'safe',
        crackTicks: 0,
        frozenTicks: 0,
        protectedTicks: 0,
      });
    }
    board.push(row);
  }
  return board;
}

export function cloneBoard(board: Tile[][]): Tile[][] {
  return board.map((row) => row.map((t) => ({ ...t })));
}

export function getTile(board: Tile[][], x: number, y: number): Tile | null {
  if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE) return null;
  return board[y][x];
}

export function chebyshevDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

export function isWalkable(tile: Tile): boolean {
  return tile.kind !== 'lava';
}

export function manhattanNeighbors(x: number, y: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < GRID_SIZE && ny < GRID_SIZE) {
        out.push({ x: nx, y: ny });
      }
    }
  }
  return out;
}

export function randomSafeTile(
  board: Tile[][],
  rand: () => number,
  exclude?: { x: number; y: number }
): { x: number; y: number } | null {
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = board[y][x];
      if (t.kind === 'lava') continue;
      if (exclude && t.x === exclude.x && t.y === exclude.y) continue;
      candidates.push({ x, y });
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(rand() * candidates.length)];
}

export function farthestTilesFrom(
  _board: Tile[][],
  player: Player,
  count: number,
  rand: () => number
): { x: number; y: number }[] {
  const scored: { x: number; y: number; d: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (x === player.x && y === player.y) continue;
      const d = chebyshevDistance(x, y, player.x, player.y);
      scored.push({ x, y, d });
    }
  }
  scored.sort((a, b) => b.d - a.d);
  const top = scored.slice(0, Math.min(12, scored.length));
  const picked: { x: number; y: number }[] = [];
  const used = new Set<string>();
  while (picked.length < count && top.length > 0) {
    const idx = Math.floor(rand() * Math.min(6, top.length));
    const { x, y } = top[idx];
    const key = `${x},${y}`;
    if (!used.has(key)) {
      used.add(key);
      picked.push({ x, y });
    }
    top.splice(idx, 1);
  }
  return picked;
}

export function setTileKind(board: Tile[][], x: number, y: number, kind: TileKind): void {
  const t = getTile(board, x, y);
  if (!t) return;
  t.kind = kind;
  if (kind !== 'cracked') t.crackTicks = 0;
  if (kind !== 'powerup') delete t.powerUp;
}

export function tickFrozenAndCracked(board: Tile[][]): Tile[][] {
  const next = cloneBoard(board);
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = next[y][x];
      if (t.protectedTicks > 0) t.protectedTicks -= 1;
      if (t.frozenTicks > 0) {
        t.frozenTicks -= 1;
        if (t.frozenTicks === 0 && t.kind === 'frozen') {
          t.kind = 'cracked';
          t.crackTicks = 2;
        }
      }
      if (t.kind === 'cracked' && t.crackTicks > 0) {
        t.crackTicks -= 1;
        if (t.crackTicks === 0) t.kind = 'lava';
      }
    }
  }
  return next;
}

export function isInSafeZone(
  x: number,
  y: number,
  zone?: { cx: number; cy: number; radius: number }
): boolean {
  if (!zone) return false;
  return chebyshevDistance(x, y, zone.cx, zone.cy) <= zone.radius;
}