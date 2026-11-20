import { createEmptyBoard, dailySeedFromDate, mulberry32 } from './board';
import { seedInitialLava } from './LavaEngine';
import { spawnTreasure } from './PowerUpSystem';
import type { GameMode, GameState } from '../types/game';

const CENTER = { x: 4, y: 4 };

export function createInitialState(mode: GameMode, seed?: number): GameState {
  const rngSeed = mode === 'daily' ? dailySeedFromDate() : (seed ?? (Math.random() * 2 ** 32) >>> 0);
  const rand = mulberry32(rngSeed);

  let board = createEmptyBoard();
  let player = { ...CENTER };

  board = seedInitialLava(board, player, rand);
  board = spawnTreasure(board, rand);

  return {
    status: 'playing',
    mode,
    board,
    player,
    score: 0,
    survivalSeconds: 0,
    level: 1,
    combo: 1,
    multiplier: 1,
    lastTreasureAt: 0,
    shieldCharges: 0,
    buffs: { speedUntil: 0, freezeUntil: 0 },
    chaos: null,
    activeEventBanner: null,
    eventBannerUntil: 0,
    nextChaosAt: 30,
    tickCount: 0,
    rngSeed,
    moveRange: 1,
    heatStreak: 0,
    heatUntil: 0,
    moveStreak: 0,
    nearMissesRun: 0,
    escapesRun: 0,
    maxHeatStreak: 0,
    sawChaos: false,
    lastLeft: null,
    danger: 0,
    punchToken: 0,
    slowMoUntil: 0,
    popups: [],
    popupSeq: 0,
  };
}