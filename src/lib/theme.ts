import { colorScheme } from 'nativewind';
import { Appearance, AppState, Platform } from 'react-native';
import { systemColorScheme } from 'react-native-css-interop/dist/runtime/native/appearance-observables';

import type { ThemeMode } from '@/types';

/**
 * Drives NativeWind's light/dark scheme purely in JS.
 *
 * NativeWind's own `colorScheme.set()` goes through `Appearance.setColorScheme()`,
 * which on Android flips AppCompat night mode and can recreate the activity —
 * causing a light flash on launch, a reset status bar and a remounted router.
 * Writing the scheme observable directly avoids the native round-trip.
 */
let mode: ThemeMode = 'dark';

function resolve(): 'light' | 'dark' {
  if (mode === 'system') return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  return mode;
}

export function applyTheme(next: ThemeMode) {
  mode = next;
  if (Platform.OS === 'web') colorScheme.set(next);
  else systemColorScheme.set(resolve());
}

if (Platform.OS !== 'web') {
  // NativeWind re-syncs to the OS on these events; registered after its
  // listeners, ours run last and restore the user's choice.
  Appearance.addChangeListener(() => systemColorScheme.set(resolve()));
  AppState.addEventListener('change', (state) => {
    if (state === 'active') systemColorScheme.set(resolve());
  });
}

// Dark from the very first frame.
applyTheme('dark');
