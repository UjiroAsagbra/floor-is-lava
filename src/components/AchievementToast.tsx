import { useEffect } from 'react';
import { achievementById } from '../engine/AchievementSystem';

interface AchievementToastProps {
  ids: string[];
  onDismiss: (id: string) => void;
}

export function AchievementToast({ ids, onDismiss }: AchievementToastProps) {
  if (ids.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-4 z-50 flex max-w-xs flex-col gap-2">
      {ids.map((id) => (
        <ToastCard key={id} id={id} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ id, onDismiss }: { id: string; onDismiss: (id: string) => void }) {
  const ach = achievementById(id);
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 4500);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  if (!ach) return null;
  return (
    <div className="achievement-toast rounded-lg border border-amber-400/40 bg-black/85 p-4 shadow-[0_0_24px_rgba(255,180,0,0.25)]">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Achievement</p>
      <p className="text-lg font-black text-white">{ach.title}</p>
      <p className="text-xs text-white/70">{ach.description}</p>
      {ach.unlocksTheme && (
        <p className="mt-1 text-[10px] uppercase text-cyan-300">Theme unlocked</p>
      )}
    </div>
  );
}