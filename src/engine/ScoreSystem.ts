import type { RunRecord } from '../types/game';
import { STORAGE_BEST, STORAGE_RUNS } from '../types/game';

const COMBO_WINDOW_SEC = 8;

export function comboMultiplier(combo: number): number {
  return 1 + 0.5 * Math.max(0, combo - 1);
}

export function applySurvivalTick(
  score: number,
  multiplier: number
): number {
  return score + Math.round(1 * multiplier);
}

export function applyTreasure(
  score: number,
  _multiplier: number,
  combo: number,
  survivalSeconds: number,
  lastTreasureAt: number
): { score: number; combo: number; multiplier: number; lastTreasureAt: number } {
  const withinWindow =
    lastTreasureAt > 0 && survivalSeconds - lastTreasureAt <= COMBO_WINDOW_SEC;
  const newCombo = withinWindow ? combo + 1 : 1;
  const mult = comboMultiplier(newCombo);
  const points = Math.round(10 * mult);
  return {
    score: score + points,
    combo: newCombo,
    multiplier: mult,
    lastTreasureAt: survivalSeconds,
  };
}

export function decayComboIfNeeded(
  combo: number,
  multiplier: number,
  survivalSeconds: number,
  lastTreasureAt: number
): { combo: number; multiplier: number } {
  if (combo <= 1 || lastTreasureAt <= 0) return { combo: 1, multiplier: 1 };
  if (survivalSeconds - lastTreasureAt > COMBO_WINDOW_SEC) {
    return { combo: 1, multiplier: 1 };
  }
  return { combo, multiplier };
}

export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_BEST);
    return raw ? JSON.parse(raw) : 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(score: number): number {
  const best = Math.max(loadBestScore(), score);
  localStorage.setItem(STORAGE_BEST, JSON.stringify(best));
  return best;
}

export function loadRuns(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_RUNS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function isDuplicateRun(runs: RunRecord[], record: RunRecord): boolean {
  if (runs.length === 0) return false;
  const last = runs.reduce((a, b) =>
    new Date(a.date).getTime() >= new Date(b.date).getTime() ? a : b
  );
  if (
    last.score !== record.score ||
    last.time !== record.time ||
    last.mode !== record.mode
  ) {
    return false;
  }
  const lastMs = new Date(last.date).getTime();
  const nextMs = new Date(record.date).getTime();
  return Math.abs(nextMs - lastMs) < 3000;
}

export function appendRun(record: RunRecord): RunRecord[] {
  const runs = loadRuns();
  if (isDuplicateRun(runs, record)) return runs;
  runs.push(record);
  runs.sort((a, b) => b.score - a.score);
  const top = runs.slice(0, 10);
  localStorage.setItem(STORAGE_RUNS, JSON.stringify(top));
  return top;
}