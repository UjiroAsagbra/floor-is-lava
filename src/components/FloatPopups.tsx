import { useEffect } from 'react';
import type { ScorePopup } from '../types/game';

interface FloatPopupsProps {
  popups: ScorePopup[];
  onDone: (id: number) => void;
}

const toneClass: Record<ScorePopup['tone'], string> = {
  gold: 'text-amber-300',
  cyan: 'text-cyan-300',
  orange: 'text-orange-400',
  pink: 'text-fuchsia-300',
};

export function FloatPopups({ popups, onDone }: FloatPopupsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-start justify-center pt-24">
      <div className="flex flex-col items-center gap-2">
        {popups.map((p) => (
          <PopupItem key={p.id} popup={p} onDone={onDone} />
        ))}
      </div>
    </div>
  );
}

function PopupItem({
  popup,
  onDone,
}: {
  popup: ScorePopup;
  onDone: (id: number) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDone(popup.id), 1200);
    return () => clearTimeout(t);
  }, [popup.id, onDone]);

  return (
    <div className={`score-popup flex flex-col items-center ${toneClass[popup.tone]}`}>
      <span className="text-xl font-black tracking-widest">{popup.text}</span>
      {popup.sub && <span className="text-xs font-semibold opacity-90">{popup.sub}</span>}
    </div>
  );
}