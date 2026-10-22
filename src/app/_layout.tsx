import '../global.css';
// Must run before anything renders so the first frame is already dark.
import '@/lib/theme';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppSplash } from '@/components/app-splash';
import { CreatePlaylistDialog } from '@/components/create-playlist';
import { PlayerEngine } from '@/components/player-engine';
import { QueueSheet } from '@/components/queue-sheet';
import { Toast } from '@/components/toast';
import { TrackSheet } from '@/components/track-sheet';
import { usePalette } from '@/hooks/use-palette';
import { useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';
import { useSettingsStore } from '@/store/settings';

SplashScreen.preventAutoHideAsync().catch(() => {});

const stores = [useSettingsStore, useLibraryStore, usePlayerStore];

/** True once every persisted store has been read back from storage. */
function useHydrated() {
  const [hydrated, setHydrated] = useState(() => stores.every((s) => s.persist.hasHydrated()));
  useEffect(() => {
    if (hydrated) return;
    const check = () => {
      if (stores.every((s) => s.persist.hasHydrated())) setHydrated(true);
    };
    const subs = stores.map((s) => s.persist.onFinishHydration(check));
    check();
    return () => subs.forEach((unsub) => unsub());
  }, [hydrated]);
  return hydrated;
}

export default function RootLayout() {
  const p = usePalette();
  const isDark = p.scheme === 'dark';
  const hydrated = useHydrated();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.bg).catch(() => {});
  }, [p.bg]);

  // Transparent status bar (edge-to-edge): white icons in dark mode, black in light.
  // The splash is always dark, so keep white icons until it's gone.
  const barStyle = !splashDone || isDark ? 'light' : 'dark';
  useEffect(() => {
    StatusBar.setStyle(barStyle, true);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') StatusBar.setStyle(barStyle, false);
    });
    return () => sub.remove();
  }, [barStyle]);

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: p.bg, card: p.bg, primary: p.accent, text: p.text, border: p.border },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: p.bg }}>
      <ThemeProvider value={navTheme}>
        <PlayerEngine />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="player"
            options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: true }}
          />
          <Stack.Screen name="playlist/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <TrackSheet />
        <QueueSheet />
        <CreatePlaylistDialog />
        <Toast />
        <StatusBar style={barStyle} animated />
        {!splashDone ? <AppSplash ready={hydrated} onDone={() => setSplashDone(true)} /> : null}
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
