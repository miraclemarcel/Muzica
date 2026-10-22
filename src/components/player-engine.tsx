import { useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';

import { configureAudio, getPlayer } from '@/lib/audio';
import { useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';

/**
 * Headless bridge between the Zustand queue and the native audio player.
 * Mounted once at the root; renders nothing.
 */
export function PlayerEngine() {
  const player = getPlayer();
  const status = useAudioPlayerStatus(player);
  const loadKey = usePlayerStore((s) => s.loadKey);

  useEffect(() => {
    configureAudio();
  }, []);

  // Load whatever the queue points at whenever a load is requested.
  useEffect(() => {
    const { queue, index, autoplay } = usePlayerStore.getState();
    const track = queue[index];
    if (!track) return;
    player.replace({ uri: track.uri });
    if (autoplay) {
      player.play();
      useLibraryStore.getState().pushRecent(track);
    }
    try {
      player.setActiveForLockScreen(
        true,
        { title: track.title, artist: track.artist, albumTitle: track.album, artworkUrl: track.artwork },
        { showSeekBackward: true, showSeekForward: true },
      );
    } catch {
      // Not available on every platform (e.g. web).
    }
    // On cold start the persisted queue restores but loadKey is 0 — load without playing.
  }, [loadKey, player]);

  useEffect(() => {
    usePlayerStore.setState({ isPlaying: status.playing, isBuffering: status.isBuffering });
  }, [status.playing, status.isBuffering]);

  useEffect(() => {
    if (status.didJustFinish) usePlayerStore.getState().next(true);
  }, [status.didJustFinish]);

  // Imported files have no duration until the player reads them; remember it once known.
  useEffect(() => {
    const { queue, index, patchTrack } = usePlayerStore.getState();
    const track = queue[index];
    if (track && !track.duration && status.duration > 0) {
      patchTrack(track.id, { duration: status.duration });
      useLibraryStore.getState().setDuration(track.id, status.duration);
    }
  }, [status.duration]);

  return null;
}
