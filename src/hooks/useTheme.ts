import { useMemo } from 'react';
import { useAppStore } from '../store/app-store';

export function useTheme() {
  const theme = useAppStore((state) => state.settings.theme);

  const resolvedTheme = useMemo(() => {
    return theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  return {
    theme,
    resolvedTheme,
  };
}
