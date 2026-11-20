export const GRID_SIZE = 10;

export type TileKind =
  | 'safe'
  | 'lava'
  | 'cracked'
  | 'frozen'
  | 'treasure'
  | 'powerup';

export type PowerUpType = 'speed' | 'freeze' | 'shield' | 'teleport';

export type ChaosEventType =
  | 'earthquake'
  | 'meteor'
  | 'blackout'
  | 'iceAge'
  | 'volcanicSurge'
  | 'safeZone';

export type GameMode = 'endless' | 'daily';

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';

export interface Tile {
  x: number;
  y: number;
  kind: TileKind;
  crackTicks: number;
  frozenTicks: number;
  protectedTicks: number;
  powerUp?: PowerUpType;
}

export interface Player {
  x: number;
  y: number;
}

export interface ActiveBuffs {
  speedUntil: number;
  freezeUntil: number;
}

export interface ChaosModifier {
  type: ChaosEventType;
  endsAt: number;
  blackout?: boolean;
  spreadPaused?: boolean;
  spreadMultiplier?: number;
  crackDelayOverride?: number;
  safeZone?: { cx: number; cy: number; radius: number };
  shakeUntil?: number;
}

export interface LevelConfig {
  level: number;
  tickIntervalMs: number;
  spreadCount: number;
  crackDelay: number;
  chaosEnabled: boolean;
}

export interface LeftTileMark {
  x: number;
  y: number;
  atTick: number;
  kindWhenLeft: TileKind;
  rewarded: boolean;
}

export interface ScorePopup {
  id: number;
  text: string;
  sub?: string;
  tone: 'gold' | 'cyan' | 'orange' | 'pink';
}

export interface GameState {
  status: GameStatus;
  mode: GameMode;
  board: Tile[][];
  player: Player;
  score: number;
  survivalSeconds: number;
  level: number;
  combo: number;
  multiplier: number;
  lastTreasureAt: number;
  shieldCharges: number;
  buffs: ActiveBuffs;
  chaos: ChaosModifier | null;
  activeEventBanner: string | null;
  eventBannerUntil: number;
  nextChaosAt: number;
  tickCount: number;
  rngSeed: number;
  moveRange: number;
  heatStreak: number;
  heatUntil: number;
  moveStreak: number;
  nearMissesRun: number;
  escapesRun: number;
  maxHeatStreak: number;
  sawChaos: boolean;
  lastLeft: LeftTileMark | null;
  danger: number;
  punchToken: number;
  slowMoUntil: number;
  popups: ScorePopup[];
  popupSeq: number;
}

export interface RunRecord {
  score: number;
  time: number;
  mode: GameMode;
  date: string;
}

export const STORAGE_BEST = 'fil-best';
export const STORAGE_RUNS = 'fil-runs';