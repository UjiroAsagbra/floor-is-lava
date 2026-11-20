import type { GameMode } from '../types/game';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocksTheme?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'survivor_20',
    title: 'Still Standing',
    description: 'Survive 20 seconds.',
    unlocksTheme: 'magma',
  },
  {
    id: 'close_calls',
    title: 'Fingerprints on the Lava',
    description: '5 near-misses in one run.',
  },
  {
    id: 'houdini',
    title: 'Houdini',
    description: '3 last-second escapes in one run.',
    unlocksTheme: 'aurora',
  },
  {
    id: 'heat_wave',
    title: 'Heat Wave',
    description: 'Reach a 10-action streak.',
  },
  {
    id: 'century',
    title: 'Century Club',
    description: 'Score 100+ in a single run.',
    unlocksTheme: 'void',
  },
  {
    id: 'chaos_child',
    title: 'Chaos Child',
    description: 'Survive your first chaos event.',
  },
];

const STORAGE = 'fil-achievements';
const STATS = 'fil-stats';

export interface LifetimeStats {
  totalRuns: number;
  totalNearMisses: number;
  totalEscapes: number;
  bestTime: number;
}

export interface RunAchieveCtx {
  survivalSeconds: number;
  score: number;
  nearMissesRun: number;
  escapesRun: number;
  maxHeatStreak: number;
  sawChaos: boolean;
  mode: GameMode;
}

export function loadUnlocked(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUnlocked(ids: string[]) {
  localStorage.setItem(STORAGE, JSON.stringify(ids));
}

export function loadStats(): LifetimeStats {
  try {
    const raw = localStorage.getItem(STATS);
    return (
      raw ? JSON.parse(raw) : {
        totalRuns: 0,
        totalNearMisses: 0,
        totalEscapes: 0,
        bestTime: 0,
      }
    );
  } catch {
    return { totalRuns: 0, totalNearMisses: 0, totalEscapes: 0, bestTime: 0 };
  }
}

export function saveStats(stats: LifetimeStats) {
  localStorage.setItem(STATS, JSON.stringify(stats));
}

export function evaluateAchievements(
  ctx: RunAchieveCtx,
  already: string[]
): { unlocked: string[]; newIds: string[] } {
  const next = new Set(already);
  const newIds: string[] = [];
  const tryUnlock = (id: string, met: boolean) => {
    if (!met || next.has(id)) return;
    next.add(id);
    newIds.push(id);
  };

  tryUnlock('survivor_20', ctx.survivalSeconds >= 20);
  tryUnlock('close_calls', ctx.nearMissesRun >= 5);
  tryUnlock('houdini', ctx.escapesRun >= 3);
  tryUnlock('heat_wave', ctx.maxHeatStreak >= 10);
  tryUnlock('century', ctx.score >= 100);
  tryUnlock('chaos_child', ctx.sawChaos);

  if (newIds.length > 0) saveUnlocked([...next]);
  return { unlocked: [...next], newIds };
}

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}