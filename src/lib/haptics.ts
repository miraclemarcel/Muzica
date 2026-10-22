import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useSettingsStore } from '@/store/settings';

export function tap(kind: 'light' | 'medium' | 'select' = 'light') {
  if (Platform.OS === 'web' || !useSettingsStore.getState().haptics) return;
  const p =
    kind === 'select'
      ? Haptics.selectionAsync()
      : Haptics.impactAsync(
          kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
        );
  p.catch(() => {});
}
