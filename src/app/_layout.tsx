import '../global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { colorScheme, useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CreatePlaylistDialog } from '@/components/create-playlist';
import { PlayerEngine } from '@/components/player-engine';
import { QueueSheet } from '@/components/queue-sheet';
import { Toast } from '@/components/toast';
import { TrackSheet } from '@/components/track-sheet';
import { useSettingsStore } from '@/store/settings';
import { palettes } from '@/theme/palette';

export default function RootLayout() {
  const theme = useSettingsStore((s) => s.theme);
  const { colorScheme: scheme } = useColorScheme();
  const isDark = scheme === 'dark';
  const p = isDark ? palettes.dark : palettes.light;

  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(p.bg).catch(() => {});
  }, [p.bg]);

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
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
