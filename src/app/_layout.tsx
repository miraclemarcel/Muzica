import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { colorScheme } from 'nativewind';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CreatePlaylistDialog } from '@/components/create-playlist';
import { PlayerEngine } from '@/components/player-engine';
import { QueueSheet } from '@/components/queue-sheet';
import { Toast } from '@/components/toast';
import { TrackSheet } from '@/components/track-sheet';
import { usePalette } from '@/hooks/use-palette';
import { useSettingsStore } from '@/store/settings';

export default function RootLayout() {
  const theme = useSettingsStore((s) => s.theme);
  const p = usePalette();
  const isDark = p.scheme === 'dark';

  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.bg).catch(() => {});
  }, [p.bg]);

  // Changing the color scheme can recreate the Android activity, which resets the
  // status bar to dark icons. Re-apply the style after that and whenever we return.
  const barStyle = isDark ? 'light' : 'dark';
  useEffect(() => {
    StatusBar.setStyle(barStyle, false);
    const timers = [150, 600].map((ms) => setTimeout(() => StatusBar.setStyle(barStyle, false), ms));
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') StatusBar.setStyle(barStyle, false);
    });
    return () => {
      timers.forEach(clearTimeout);
      sub.remove();
    };
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
        <StatusBar key={barStyle} style={barStyle} animated />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
