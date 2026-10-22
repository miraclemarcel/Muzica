import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { uid } from '@/lib/format';
import { persistStorage } from '@/store/storage';
import type { Playlist, Track } from '@/types';

const RECENT_LIMIT = 30;

interface LibraryState {
  /** Every track referenced by likes, playlists or history, so they survive restarts. */
  catalog: Record<string, Track>;
  liked: string[];
  playlists: Playlist[];
  recent: string[];
  imported: Track[];

  toggleLike: (track: Track) => boolean;
  createPlaylist: (name: string, first?: Track) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (id: string, track: Track) => boolean;
  removeFromPlaylist: (id: string, trackId: string) => void;
  pushRecent: (track: Track) => void;
  clearRecent: () => void;
  addImported: (tracks: Track[]) => void;
  removeImported: (id: string) => void;
  setDuration: (id: string, duration: number) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      catalog: {},
      liked: [],
      playlists: [],
      recent: [],
      imported: [],

      toggleLike: (track) => {
        const isLiked = get().liked.includes(track.id);
        set((s) => ({
          catalog: { ...s.catalog, [track.id]: track },
          liked: isLiked ? s.liked.filter((id) => id !== track.id) : [track.id, ...s.liked],
        }));
        return !isLiked;
      },

      createPlaylist: (name, first) => {
        const playlist: Playlist = {
          id: uid(),
          name: name.trim() || 'Untitled playlist',
          trackIds: first ? [first.id] : [],
          createdAt: Date.now(),
        };
        set((s) => ({
          playlists: [playlist, ...s.playlists],
          catalog: first ? { ...s.catalog, [first.id]: first } : s.catalog,
        }));
        return playlist;
      },

      renamePlaylist: (id, name) =>
        set((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name } : p)) })),

      deletePlaylist: (id) => set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) })),

      addToPlaylist: (id, track) => {
        const playlist = get().playlists.find((p) => p.id === id);
        if (!playlist || playlist.trackIds.includes(track.id)) return false;
        set((s) => ({
          catalog: { ...s.catalog, [track.id]: track },
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, trackIds: [...p.trackIds, track.id] } : p,
          ),
        }));
        return true;
      },

      removeFromPlaylist: (id, trackId) =>
        set((s) => ({
          playlists: s.playlists.map((p) =>
            p.id === id ? { ...p, trackIds: p.trackIds.filter((t) => t !== trackId) } : p,
          ),
        })),

      pushRecent: (track) =>
        set((s) => ({
          catalog: { ...s.catalog, [track.id]: track },
          recent: [track.id, ...s.recent.filter((id) => id !== track.id)].slice(0, RECENT_LIMIT),
        })),

      clearRecent: () => set({ recent: [] }),

      addImported: (tracks) => set((s) => ({ imported: [...tracks, ...s.imported] })),

      removeImported: (id) => set((s) => ({ imported: s.imported.filter((t) => t.id !== id) })),

      setDuration: (id, duration) =>
        set((s) => ({
          imported: s.imported.map((t) => (t.id === id ? { ...t, duration } : t)),
          catalog: s.catalog[id] ? { ...s.catalog, [id]: { ...s.catalog[id], duration } } : s.catalog,
        })),
    }),
    { name: 'muzica.library', storage: persistStorage },
  ),
);

export function resolveTracks(ids: string[], catalog: Record<string, Track>) {
  return ids.map((id) => catalog[id]).filter((t): t is Track => !!t);
}
