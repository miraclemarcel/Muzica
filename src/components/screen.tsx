import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Ambient } from '@/components/glow';
import { usePalette } from '@/hooks/use-palette';

/** Screen shell: themed background, drifting ambient light, safe top inset. */
export function Screen({ children, glow }: { children: ReactNode; glow?: readonly string[] }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-mist dark:bg-void" style={{ paddingTop: insets.top }}>
      <Ambient colors={glow ?? [p.accent, p.accent2, p.accent3]} />
      {children}
    </View>
  );
}
