import { heatMultiplier } from './FeelEngine';
import type { GameState, ScorePopup } from '../types/game';

const HEAT_DECAY_SEC = 4;

export function decayHeat(s: GameState): GameState {
  if (s.heatStreak <= 0) return s;
  if (s.survivalSeconds > s.heatUntil) {
    return { ...s, heatStreak: 0 };
  }
  return s;
}

export function bumpHeat(s: GameState, bonus: number): GameState {
  const heatStreak = s.heatStreak + 1;
  const mult = heatMultiplier(heatStreak);
  const score = s.score + Math.round(bonus * mult * s.multiplier);
  return {
    ...s,
    heatStreak,
    heatUntil: s.survivalSeconds + HEAT_DECAY_SEC,
    maxHeatStreak: Math.max(s.maxHeatStreak, heatStreak),
    score,
    slowMoUntil: Date.now() + 750,
    punchToken: s.punchToken + 1,
  };
}

export function addPopup(
  s: GameState,
  text: string,
  tone: ScorePopup['tone'],
  sub?: string
): GameState {
  const id = s.popupSeq + 1;
  const popups = [...s.popups, { id, text, tone, sub }].slice(-6);
  return { ...s, popupSeq: id, popups };
}

export function trimPopups(s: GameState): GameState {
  if (s.popups.length === 0) return s;
  return { ...s, popups: s.popups.slice(-4) };
}