import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  evaluateAchievements,
  loadStats,
  loadUnlocked,
  saveStats,
} from '../engine/AchievementSystem';
import {
  applySpreadFeel,
  checkLastSecondEscape,
  dangerLevel,
  snapshotBoard,
} from '../engine/FeelEngine';
import {
  applyChaosEvent,
  getLevelConfig,
  mergeChaosModifier,
  pickChaosEvent,
  scheduleNextChaos,
} from '../engine/EventSystem';
import { addPopup, bumpHeat, decayHeat } from '../engine/gameFeel';
import { createInitialState } from '../engine/initGame';
import { playerOnLava, spreadLava } from '../engine/LavaEngine';
import {
  applyPowerUp,
  refreshMoveRange,
  spawnPowerUp,
  spawnTreasure,
} from '../engine/PowerUpSystem';
import {
  appendRun,
  applySurvivalTick,
  applyTreasure,
  decayComboIfNeeded,
  loadBestScore,
  saveBestScore,
} from '../engine/ScoreSystem';
import { loadTheme, saveTheme, type ThemeId } from '../engine/themes';
import {
  chebyshevDistance,
  cloneBoard,
  getTile,
  isWalkable,
  mulberry32,
  randomSafeTile,
} from '../engine/board';
import type { GameMode, GameState, RunRecord, Tile } from '../types/game';
import { useAudio } from './useAudio';
import { useGameLoop } from './useGameLoop';
import { useMusic, type MusicState } from './useMusic';

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [bestScore, setBestScore] = useState(loadBestScore);
  const [runs, setRuns] = useState<RunRecord[]>(() => {
    try {
      const raw = localStorage.getItem('fil-runs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [achievements, setAchievements] = useState(loadUnlocked);
  const [toastIds, setToastIds] = useState<string[]>([]);
  const [themeId, setThemeId] = useState<ThemeId>(loadTheme);
  const { play, prime } = useAudio();
  const { setMusicState, primeMusic } = useMusic();
  const runRecordedRef = useRef<string | null>(null);

  const levelConfig = state ? getLevelConfig(state.survivalSeconds) : getLevelConfig(0);
  const tickInterval = levelConfig.tickIntervalMs;
  const slowMo =
    state?.status === 'playing' && state.slowMoUntil > Date.now() ? 2.5 : 1;

  const musicForState = useMemo((): MusicState => {
    if (!state) return 'menu';
    if (state.status === 'gameover') return 'gameover';
    if (state.status === 'paused') return 'calm';
    if (state.chaos && state.survivalSeconds < state.chaos.endsAt) return 'chaos';
    if (state.danger >= 0.55) return 'danger';
    if (state.danger >= 0.25 || state.heatStreak >= 4) return 'pulse';
    return 'calm';
  }, [state]);

  useEffect(() => {
    setMusicState(musicForState);
  }, [musicForState, setMusicState]);

  useEffect(() => {
    if (!state || (state.status !== 'playing' && state.status !== 'paused')) return;
    const { newIds } = evaluateAchievements(
      {
        survivalSeconds: state.survivalSeconds,
        score: state.score,
        nearMissesRun: state.nearMissesRun,
        escapesRun: state.escapesRun,
        maxHeatStreak: state.maxHeatStreak,
        sawChaos: state.sawChaos,
        mode: state.mode,
      },
      achievements
    );
    if (newIds.length > 0) {
      setAchievements(loadUnlocked());
      setToastIds((t) => [...t, ...newIds]);
    }
  }, [
    state?.survivalSeconds,
    state?.nearMissesRun,
    state?.escapesRun,
    state?.maxHeatStreak,
    state?.score,
    state?.sawChaos,
    state?.status,
    achievements,
    state,
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
  }, [themeId]);

  useEffect(() => {
    if (!state || state.status !== 'gameover') {
      if (!state || state.status === 'playing') runRecordedRef.current = null;
      return;
    }
    const runKey = `${state.rngSeed}-${state.tickCount}-${state.score}`;
    if (runRecordedRef.current === runKey) return;
    runRecordedRef.current = runKey;

    saveBestScore(state.score);
    setBestScore(loadBestScore());
    const record = {
      score: state.score,
      time: state.survivalSeconds,
      mode: state.mode,
      date: new Date().toISOString(),
    };
    setRuns(appendRun(record));
    play('gameover');

    const stats = loadStats();
    stats.totalRuns += 1;
    stats.totalNearMisses += state.nearMissesRun;
    stats.totalEscapes += state.escapesRun;
    stats.bestTime = Math.max(stats.bestTime, state.survivalSeconds);
    saveStats(stats);

    const { newIds } = evaluateAchievements(
      {
        survivalSeconds: state.survivalSeconds,
        score: state.score,
        nearMissesRun: state.nearMissesRun,
        escapesRun: state.escapesRun,
        maxHeatStreak: state.maxHeatStreak,
        sawChaos: state.sawChaos,
        mode: state.mode,
      },
      achievements
    );
    if (newIds.length > 0) {
      setAchievements(loadUnlocked());
      setToastIds((t) => [...t, ...newIds]);
    }
  }, [state, play, achievements]);

  const gameTick = useCallback(() => {
    setState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;

      const r = mulberry32(prev.rngSeed + prev.tickCount);
      let s: GameState = { ...prev, tickCount: prev.tickCount + 1 };
      const cfg = getLevelConfig(s.survivalSeconds + 1);
      s.survivalSeconds += 1;
      s.level = cfg.level;
      s = decayHeat(s);

      const comboDecay = decayComboIfNeeded(
        s.combo,
        s.multiplier,
        s.survivalSeconds,
        s.lastTreasureAt
      );
      s.combo = comboDecay.combo;
      s.multiplier = comboDecay.multiplier;
      s.score = applySurvivalTick(s.score, s.multiplier);

      s.moveRange = refreshMoveRange(s);
      s.chaos = mergeChaosModifier(s.chaos, s.survivalSeconds);

      if (s.activeEventBanner && s.survivalSeconds > s.eventBannerUntil) {
        s.activeEventBanner = null;
      }

      const freezeLava = s.buffs.freezeUntil > s.survivalSeconds;
      const spreadPaused = s.chaos?.spreadPaused ?? false;
      const beforeSpread = snapshotBoard(s.board);

      if (!freezeLava && !spreadPaused) {
        s.board = spreadLava(s.board, {
          spreadCount: cfg.spreadCount,
          crackDelay: cfg.crackDelay,
          chaos: s.chaos,
          rand: r,
        });
        play('lava');

        const feel = applySpreadFeel(beforeSpread, s.board, s.player);
        if (feel.nearMiss) {
          s.nearMissesRun += 1;
          s = bumpHeat(s, 5);
          s = addPopup(s, 'NEAR MISS', 'orange', `+${Math.round(5 * s.multiplier)} · HEAT ×${s.heatStreak}`);
          play('nearMiss');
          if (s.heatStreak % 3 === 0) play('streak');
        }
      }

      if (
        s.lastLeft &&
        s.tickCount - s.lastLeft.atTick <= 2 &&
        checkLastSecondEscape(s.board, s.lastLeft)
      ) {
        s.lastLeft = { ...s.lastLeft, rewarded: true };
        s.escapesRun += 1;
        s = bumpHeat(s, 15);
        s = addPopup(s, 'CLUTCH ESCAPE', 'cyan', 'The tile collapsed behind you!');
        play('escape');
      }

      if (cfg.chaosEnabled && s.survivalSeconds >= s.nextChaosAt) {
        s.sawChaos = true;
        const event = pickChaosEvent(r);
        const result = applyChaosEvent(s.board, s.player, s.survivalSeconds, event, r);
        s.board = result.board;
        s.chaos = result.modifier;
        s.activeEventBanner = result.label;
        s.eventBannerUntil = s.survivalSeconds + 3;
        s.nextChaosAt = scheduleNextChaos(s.survivalSeconds, r);
        s.punchToken += 1;
        play('event');
      } else {
        if (r() < 0.14) s.board = spawnTreasure(s.board, r);
        if (r() < 0.09) s.board = spawnPowerUp(s.board, r);
      }

      s.danger = dangerLevel(s.board, s.player);

      if (playerOnLava(s.board, s.player)) {
        if (s.shieldCharges > 0) {
          s.shieldCharges -= 1;
          const pos = randomSafeTile(s.board, r, s.player);
          if (pos) s.player = pos;
          s = addPopup(s, 'SHIELD SAVE', 'pink');
          play('escape');
        } else {
          return { ...s, status: 'gameover' as const };
        }
      }

      return s;
    });
  }, [play]);

  useGameLoop(gameTick, tickInterval, state?.status === 'playing', slowMo);

  const startGame = useCallback(
    (mode: GameMode) => {
      prime();
      primeMusic();
      setState(createInitialState(mode));
    },
    [prime, primeMusic]
  );

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      if (prev.status === 'playing') return { ...prev, status: 'paused' };
      if (prev.status === 'paused') return { ...prev, status: 'playing' };
      return prev;
    });
  }, []);

  const restart = useCallback(
    (mode?: GameMode) => {
      const m = mode ?? state?.mode ?? 'endless';
      prime();
      primeMusic();
      setState(createInitialState(m));
    },
    [prime, primeMusic, state?.mode]
  );

  const tryMoveTo = useCallback(
    (x: number, y: number) => {
      setState((prev) => {
        if (!prev || prev.status !== 'playing') return prev;
        const dist = chebyshevDistance(prev.player.x, prev.player.y, x, y);
        if (dist === 0 || dist > prev.moveRange) return prev;
        const tile = getTile(prev.board, x, y);
        if (!tile || !isWalkable(tile)) return prev;

        let s = { ...prev };
        const board = cloneBoard(s.board);
        const fromTile = getTile(board, s.player.x, s.player.y)!;
        const t = getTile(board, x, y)!;

        s.lastLeft = {
          x: s.player.x,
          y: s.player.y,
          atTick: s.tickCount,
          kindWhenLeft: fromTile.kind,
          rewarded: false,
        };
        s.moveStreak += 1;
        s.punchToken += 1;

        if (t.kind === 'treasure') {
          const tr = applyTreasure(
            s.score,
            s.multiplier,
            s.combo,
            s.survivalSeconds,
            s.lastTreasureAt
          );
          s = { ...s, ...tr };
          s = bumpHeat(s, 0);
          s = addPopup(s, 'TREASURE', 'gold', `Combo ×${s.multiplier.toFixed(1)}`);
          t.kind = 'safe';
          play('treasure');
        } else if (t.kind === 'powerup' && t.powerUp) {
          const type = t.powerUp;
          t.kind = 'safe';
          delete t.powerUp;
          s.board = board;
          s.player = { x, y };
          s = applyPowerUp(s, type);
          s = addPopup(s, 'POWER UP', 'pink', type);
          play('powerup');
          play('move');
          s.danger = dangerLevel(s.board, s.player);
          return s;
        } else {
          play('move');
        }

        t.kind = t.kind === 'cracked' || t.kind === 'frozen' ? t.kind : 'safe';
        s.board = board;
        s.player = { x, y };
        s.danger = dangerLevel(s.board, s.player);
        return s;
      });
    },
    [play]
  );

  const dismissPopup = useCallback((id: number) => {
    setState((prev) => {
      if (!prev) return prev;
      return { ...prev, popups: prev.popups.filter((p) => p.id !== id) };
    });
  }, []);

  const legalMoves = useMemo((): Tile[] => {
    if (!state || state.status !== 'playing') return [];
    const { player, board, moveRange } = state;
    const moves: Tile[] = [];
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const d = chebyshevDistance(player.x, player.y, x, y);
        if (d > 0 && d <= moveRange) {
          const t = board[y][x];
          if (isWalkable(t)) moves.push(t);
        }
      }
    }
    return moves;
  }, [state]);

  const moveByKey = useCallback(
    (dx: number, dy: number) => {
      if (!state || state.status !== 'playing') return;
      const tx = state.player.x + dx;
      const ty = state.player.y + dy;
      const dist = chebyshevDistance(state.player.x, state.player.y, tx, ty);
      if (dist > state.moveRange) return;
      const tile = getTile(state.board, tx, ty);
      if (tile && isWalkable(tile)) tryMoveTo(tx, ty);
    },
    [state, tryMoveTo]
  );

  const selectTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    saveTheme(id);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastIds((t) => t.filter((x) => x !== id));
  }, []);

  return {
    state,
    bestScore,
    runs,
    legalMoves,
    levelConfig,
    achievements,
    themeId,
    toastIds,
    startGame,
    togglePause,
    restart,
    tryMoveTo,
    moveByKey,
    setMenu: () => setState(null),
    dismissPopup,
    selectTheme,
    dismissToast,
    slowMoActive: slowMo > 1,
  };
}