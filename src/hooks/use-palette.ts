import { useColorScheme } from 'nativewind';

import { useSettingsStore } from '@/store/settings';
import { palettes } from '@/theme/palette';

/**
 * Resolves from the saved theme first so the very first frame is already right;
 * NativeWind's scheme is only consulted when following the system.
 */
export function usePalette() {
  const theme = useSettingsStore((s) => s.theme);
  const { colorScheme } = useColorScheme();
  const dark = theme === 'system' ? colorScheme === 'dark' : theme === 'dark';
  return dark ? palettes.dark : palettes.light;
}
