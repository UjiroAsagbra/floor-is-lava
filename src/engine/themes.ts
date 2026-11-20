export type ThemeId = 'cyber' | 'magma' | 'aurora' | 'void';

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  unlockHint: string;
}

export const THEMES: ThemeMeta[] = [
  { id: 'cyber', name: 'Neon Grid', unlockHint: 'Default' },
  { id: 'magma', name: 'Magma Core', unlockHint: 'Survive 20s' },
  { id: 'aurora', name: 'Aurora Ice', unlockHint: 'Unlock Houdini' },
  { id: 'void', name: 'Void Stream', unlockHint: 'Score 100+ in one run' },
];

const STORAGE_THEME = 'fil-theme';

export function loadTheme(): ThemeId {
  try {
    const t = localStorage.getItem(STORAGE_THEME) as ThemeId | null;
    if (t && THEMES.some((x) => x.id === t)) return t;
  } catch {
    /* */
  }
  return 'cyber';
}

export function saveTheme(id: ThemeId) {
  localStorage.setItem(STORAGE_THEME, id);
}

export function isThemeUnlocked(
  id: ThemeId,
  unlockedAchievements: string[],
  bestScore: number
): boolean {
  if (id === 'cyber') return true;
  if (id === 'magma') {
    return unlockedAchievements.includes('survivor_20') || bestScore >= 30;
  }
  if (id === 'aurora') return unlockedAchievements.includes('houdini');
  if (id === 'void') {
    return unlockedAchievements.includes('century') || bestScore >= 100;
  }
  return false;
}