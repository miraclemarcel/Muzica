import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getPlayer } from '@/lib/audio';
import { shuffleArray } from '@/lib/format';
import { persistStorage } from '@/store/storage';
import type { RepeatMode, Track } from '@/types';

interface PlayerState {
  queue: Track[];
  index: number;
  /** Queue order before shuffle was switched on, so it can be restored. */
  original: Track[] | null;
  shuffle: boolean;
  repeat: RepeatMode;
  /** Bumped on every load request; the engine reacts to it. */
  loadKey: number;
  autoplay: boolean;
  isPlaying: boolean;
  isBuffering: boolean;

  playQueue: (tracks: Track[], start?: number, opts?: { shuffle?: boolean }) => void;
  jumpTo: (index: number) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  playNext: (track: Track) => void;
  addToQueue: (track: Track) => void;
  removeAt: (index: number) => void;
  patchTrack: (id: string, patch: Partial<Track>) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: 0,
      original: null,
      shuffle: false,
      repeat: 'off',
      loadKey: 0,
      autoplay: false,
      isPlaying: false,
      isBuffering: false,

      playQueue: (tracks, start = 0, opts) => {
        if (!tracks.length) return;
        const shuffle = opts?.shuffle ?? get().shuffle;
        if (shuffle) {
          const first = opts?.shuffle ? tracks[Math.floor(Math.random() * tracks.length)] : tracks[start];
          const rest = shuffleArray(tracks.filter((t) => t !== first));
          set({ queue: [first, ...rest], original: tracks, index: 0, shuffle: true });
        } else {
          set({ queue: tracks, original: null, index: start });
        }
        set((s) => ({ loadKey: s.loadKey + 1, autoplay: true }));
      },

      jumpTo: (index) => {
        if (index < 0 || index >= get().queue.length) return;
        set((s) => ({ index, loadKey: s.loadKey + 1, autoplay: true }));
      },

      toggle: () => {
        const { queue, isPlaying } = get();
        if (!queue.length) return;
        const player = getPlayer();
        if (isPlaying) player.pause();
        else player.play();
      },

      next: (auto = false) => {
        const { queue, index, repeat } = get();
        if (!queue.length) return;
        if (auto && repeat === 'one') {
          get().seek(0);
          getPlayer().play();
          return;
        }
        if (index < queue.length - 1) return get().jumpTo(index + 1);
        if (repeat === 'all' || !auto) return get().jumpTo(0);
        // End of queue: park on the first track, paused.
        set((s) => ({ index: 0, loadKey: s.loadKey + 1, autoplay: false }));
      },

      prev: () => {
        const { index, queue } = get();
        const player = getPlayer();
        if (player.currentTime > 3 || index === 0) {
          get().seek(0);
          return;
        }
        if (queue.length) get().jumpTo(index - 1);
      },

      seek: (seconds) => {
        getPlayer()
          .seekTo(Math.max(0, seconds))
          .catch(() => {});
      },

      toggleShuffle: () => {
        const { shuffle, queue, index, original } = get();
        const current = queue[index];
        if (!shuffle) {
          if (!current) return set({ shuffle: true });
          const rest = shuffleArray(queue.filter((_, i) => i !== index));
          set({ shuffle: true, original: queue, queue: [current, ...rest], index: 0 });
        } else {
          const restored = original ?? queue;
          const at = current ? restored.findIndex((t) => t.id === current.id) : 0;
          set({ shuffle: false, original: null, queue: restored, index: Math.max(0, at) });
        }
      },

      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),

      playNext: (track) => {
        const { queue, index } = get();
        if (!queue.length) return get().playQueue([track]);
        const without = queue.filter((t, i) => t.id !== track.id || i === index);
        const at = without.findIndex((t) => t.id === queue[index].id);
        without.splice(at + 1, 0, track);
        set({ queue: without, index: at });
      },

      addToQueue: (track) => {
        const { queue } = get();
        if (!queue.length) return get().playQueue([track]);
        if (queue.some((t) => t.id === track.id)) return;
        set({ queue: [...queue, track] });
      },

      removeAt: (i) => {
        const { queue, index } = get();
        if (i === index) return;
        set({ queue: queue.filter((_, k) => k !== i), index: i < index ? index - 1 : index });
      },

      patchTrack: (id, patch) =>
        set((s) => ({ queue: s.queue.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    }),
    {
      name: 'muzica.player',
      storage: persistStorage,
      // Once the saved queue is back, cue the last track (paused) so play resumes instantly.
      onRehydrateStorage: () => (state) => {
        if (state?.queue.length) usePlayerStore.setState((s) => ({ loadKey: s.loadKey + 1, autoplay: false }));
      },
      partialize: (s) => ({
        queue: s.queue,
        index: s.index,
        original: s.original,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    },
  ),
);

export function useCurrentTrack() {
  return usePlayerStore((s) => s.queue[s.index] as Track | undefined);
}
