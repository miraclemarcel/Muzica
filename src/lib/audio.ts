import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

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
      shouldPlayInBackground: true,
      // Lock screen controls need exclusive audio focus.
      interruptionMode: 'doNotMix',
    });
  } catch {
    configured = false;
  }
}
