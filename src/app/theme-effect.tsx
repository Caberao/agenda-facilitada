import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/app-store';

export function ThemeEffect() {
  const { resolvedTheme } = useTheme();
  const compactMode = useAppStore((state) => state.settings.compactMode);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.body.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.dataset.compact = compactMode ? 'true' : 'false';
    document.body.dataset.compact = compactMode ? 'true' : 'false';
  }, [compactMode]);

  return null;
}
