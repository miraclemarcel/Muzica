import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeOutUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette } from '@/hooks/use-palette';
import { useUIStore } from '@/store/ui';

export function Toast() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const toast = useUIStore((s) => s.toast);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => {
      if (useUIStore.getState().toast?.id === toast.id) useUIStore.setState({ toast: null });
    }, 2000);
    return () => clearTimeout(id);
  }, [toast]);

  if (!toast) return null;
  return (
    <Animated.View
      key={toast.id}
      entering={ZoomIn.springify().damping(16)}
      exiting={FadeOutUp.duration(200)}
      pointerEvents="none"
      style={{ position: 'absolute', top: insets.top + 8, alignSelf: 'center' }}>
      <View
        className="flex-row items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-[#141725]"
        style={{ shadowColor: p.accent2, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}>
        <Ionicons name={toast.icon} size={16} color={p.accent} />
        <Text className="text-[13px] font-semibold text-ink dark:text-white">{toast.message}</Text>
      </View>
    </Animated.View>
  );
}
