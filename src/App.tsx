import { useEffect } from 'react';
import { AchievementToast } from './components/AchievementToast';
import { EventBanner } from './components/EventBanner';
import { FloatPopups } from './components/FloatPopups';
import { GameBoard } from './components/GameBoard';
import { GameOverModal } from './components/GameOverModal';
import { HUD } from './components/HUD';
import { Splash } from './components/Splash';
import { useGame } from './hooks/useGame';

function App() {
  const {
    state,
    bestScore,
    runs,
    legalMoves,
    achievements,
    themeId,
    toastIds,
    startGame,
    togglePause,
    restart,
    tryMoveTo,
    moveByKey,
    setMenu,
    dismissPopup,
    selectTheme,
    dismissToast,
    slowMoActive,
  } = useGame();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!state) return;
      if (state.status === 'gameover' && e.key === 'Enter') {
        restart();
        return;
      }
      if (e.key === 'Escape') {
        togglePause();
        return;
      }
      if (state.status !== 'playing') return;
      const map: Record<string, [number, number]> = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        w: [0, -1],
        s: [0, 1],
        a: [-1, 0],
        d: [1, 0],
      };
      const delta = map[e.key];
      if (delta) {
        e.preventDefault();
        moveByKey(delta[0], delta[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, moveByKey, togglePause, restart]);

  if (!state) {
    return (
      <div className="game-root">
        <Splash
          bestScore={bestScore}
          runs={runs}
          achievements={achievements}
          themeId={themeId}
          onStart={startGame}
          onSelectTheme={selectTheme}
        />
        <AchievementToast ids={toastIds} onDismiss={dismissToast} />
      </div>
    );
  }

  const showBanner =
    !!state.activeEventBanner && state.survivalSeconds <= state.eventBannerUntil;

  return (
    <div className="game-root flex min-h-full flex-col">
      <HUD
        state={state}
        bestScore={bestScore}
        onPause={togglePause}
        slowMoActive={slowMoActive}
      />
      <div className="flex flex-1 flex-col items-center justify-center pb-6">
        {state.status === 'paused' && (
          <p className="mb-4 text-lg font-semibold uppercase tracking-widest text-cyan-300">
            Paused
          </p>
        )}
        <GameBoard
          state={state}
          legalMoves={state.status === 'playing' ? legalMoves : []}
          onTileClick={tryMoveTo}
          slowMoActive={slowMoActive}
        />
      </div>
      <FloatPopups popups={state.popups} onDone={dismissPopup} />
      <EventBanner label={state.activeEventBanner} visible={showBanner} />
      <AchievementToast ids={toastIds} onDismiss={dismissToast} />
      {state.status === 'gameover' && (
        <GameOverModal
          score={state.score}
          time={state.survivalSeconds}
          bestScore={bestScore}
          runs={runs}
          mode={state.mode}
          onRestart={() => restart()}
          onMenu={setMenu}
        />
      )}
    </div>
  );
}

export default App;