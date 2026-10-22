import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { IS_EXPO_GO } from '@/lib/env';

// One app-wide player. Created lazily so nothing native runs at import time.
let player: AudioPlayer | null = null;
let configured = false;

export function getPlayer() {
  if (!player) player = createAudioPlayer(null, { updateInterval: 250 });
  return player;
}

export async function configureAudio() {
  if (configured) return;
  configured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      // Expo Go has no media playback service; background audio needs a dev build.
      shouldPlayInBackground: !IS_EXPO_GO,
      // Lock screen controls need exclusive audio focus.
      interruptionMode: 'doNotMix',
    });
  } catch {
    configured = false;
  }
}
