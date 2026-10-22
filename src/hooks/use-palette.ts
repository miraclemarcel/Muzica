import { useColorScheme } from 'nativewind';

import { palettes } from '@/theme/palette';

export function usePalette() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? palettes.dark : palettes.light;
}
