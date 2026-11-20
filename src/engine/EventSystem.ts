import { cloneBoard, getTile, randomSafeTile } from './board';
import { GRID_SIZE, type ChaosEventType, type ChaosModifier, type Player, type Tile } from '../types/game';

const EVENTS: ChaosEventType[] = [
  'earthquake',
  'meteor',
  'blackout',
  'iceAge',
  'volcanicSurge',
  'safeZone',
];

export const EVENT_LABELS: Record<ChaosEventType, string> = {
  earthquake: 'EARTHQUAKE!',
  meteor: 'METEOR SHOWER!',
  blackout: 'BLACKOUT!',
  iceAge: 'ICE AGE!',
  volcanicSurge: 'VOLCANIC SURGE!',
  safeZone: 'SAFE ZONE!',
};

export function scheduleNextChaos(
  survivalSeconds: number,
  rand: () => number
): number {
  if (survivalSeconds < 30) return 30;
  const gap = 30 + Math.floor(rand() * 16);
  return survivalSeconds + gap;
}

export function pickChaosEvent(rand: () => number): ChaosEventType {
  return EVENTS[Math.floor(rand() * EVENTS.length)];
}

export interface EventResult {
  board: Tile[][];
  modifier: ChaosModifier;
  label: string;
}

export function applyChaosEvent(
  board: Tile[][],
  player: Player,
  survivalSeconds: number,
  event: ChaosEventType,
  rand: () => number
): EventResult {
  let next = cloneBoard(board);
  const endsAt = survivalSeconds + (event === 'iceAge' ? 8 : event === 'safeZone' ? 8 : event === 'volcanicSurge' ? 5 : 3);

  switch (event) {
    case 'earthquake': {
      const cracks = 4 + Math.floor(rand() * 4);
      for (let i = 0; i < cracks; i++) {
        const pos = randomSafeTile(next, rand, player);
        if (!pos) continue;
        const t = getTile(next, pos.x, pos.y);
        if (!t || t.kind === 'lava') continue;
        t.kind = 'cracked';
        t.crackTicks = 2;
      }
      return {
        board: next,
        modifier: {
          type: event,
          endsAt: survivalSeconds + 1,
          shakeUntil: survivalSeconds + 1,
        },
        label: EVENT_LABELS.earthquake,
      };
    }
    case 'meteor': {
      const hits = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < hits; i++) {
        const x = Math.floor(rand() * GRID_SIZE);
        const y = Math.floor(rand() * GRID_SIZE);
        if (x === player.x && y === player.y) continue;
        const t = next[y][x];
        if (t.kind === 'frozen' || t.protectedTicks > 0) continue;
        if (t.kind !== 'lava') {
          t.kind = 'cracked';
          t.crackTicks = 1;
        }
      }
      return {
        board: next,
        modifier: { type: event, endsAt },
        label: EVENT_LABELS.meteor,
      };
    }
    case 'blackout':
      return {
        board: next,
        modifier: { type: event, endsAt, blackout: true },
        label: EVENT_LABELS.blackout,
      };
    case 'iceAge': {
      for (let i = 0; i < 5; i++) {
        const pos = randomSafeTile(next, rand);
        if (!pos) continue;
        const t = getTile(next, pos.x, pos.y);
        if (!t || t.kind === 'lava') continue;
        t.kind = 'frozen';
        t.frozenTicks = 8;
      }
      return {
        board: next,
        modifier: { type: event, endsAt, spreadPaused: true },
        label: EVENT_LABELS.iceAge,
      };
    }
    case 'volcanicSurge':
      return {
        board: next,
        modifier: {
          type: event,
          endsAt,
          spreadMultiplier: 3,
          crackDelayOverride: 1,
        },
        label: EVENT_LABELS.volcanicSurge,
      };
    case 'safeZone': {
      const cx = 2 + Math.floor(rand() * (GRID_SIZE - 4));
      const cy = 2 + Math.floor(rand() * (GRID_SIZE - 4));
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const t = getTile(next, cx + dx, cy + dy);
          if (t) t.protectedTicks = 8;
        }
      }
      return {
        board: next,
        modifier: {
          type: event,
          endsAt,
          safeZone: { cx, cy, radius: 1 },
        },
        label: EVENT_LABELS.safeZone,
      };
    }
    default:
      return {
        board: next,
        modifier: { type: 'earthquake', endsAt },
        label: 'CHAOS!',
      };
  }
}

export function mergeChaosModifier(
  current: ChaosModifier | null,
  survivalSeconds: number
): ChaosModifier | null {
  if (!current) return null;
  if (survivalSeconds >= current.endsAt) {
    if (current.type === 'safeZone') return null;
    if (current.spreadPaused || current.spreadMultiplier || current.crackDelayOverride) {
      return null;
    }
    if (current.blackout) return null;
    return null;
  }
  return current;
}

export function getLevelConfig(survivalSeconds: number): {
  level: number;
  tickIntervalMs: number;
  spreadCount: number;
  crackDelay: number;
  chaosEnabled: boolean;
} {
  if (survivalSeconds < 15) {
    return { level: 1, tickIntervalMs: 1000, spreadCount: 1, crackDelay: 2, chaosEnabled: false };
  }
  if (survivalSeconds < 35) {
    return { level: 2, tickIntervalMs: 800, spreadCount: 2, crackDelay: 2, chaosEnabled: false };
  }
  if (survivalSeconds < 60) {
    return { level: 3, tickIntervalMs: 650, spreadCount: 3, crackDelay: 1, chaosEnabled: false };
  }
  const extra = Math.floor((survivalSeconds - 60) / 20);
  const level = 4 + extra;
  const spreadCount = 3 + Math.floor(level / 2);
  return {
    level,
    tickIntervalMs: 500,
    spreadCount,
    crackDelay: 1,
    chaosEnabled: true,
  };
}