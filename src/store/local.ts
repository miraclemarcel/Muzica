import { Platform } from 'react-native';
import { create } from 'zustand';

import {
  getAudioPermission,
  MediaLibraryUnavailableError,
  requestAudioPermission,
  scanDeviceAudio,
  type AudioPermission,
} from '@/lib/local-music';
import type { Track } from '@/types';

export type ScanStatus =
  | 'idle'
  | 'checking'
  | 'needs-permission'
  | 'denied'
  | 'loading'
  | 'ready'
  | 'unsupported'
  | 'error';

interface LocalState {
  device: Track[];
  status: ScanStatus;
  /** Checks permission silently and scans if already granted. */
  init: () => Promise<void>;
  /** Prompts for access, then scans everything on the device. */
  requestAccess: () => Promise<void>;
  /** Rescans (permission must already be granted). */
  load: () => Promise<void>;
}

/** Device files aren't persisted — the OS index is the source of truth, so we rescan. */
export const useLocalStore = create<LocalState>()((set, get) => {
  const fail = (e: unknown) =>
    set({ status: e instanceof MediaLibraryUnavailableError ? 'unsupported' : 'error' });

  const afterPermission = async (perm: AudioPermission) => {
    if (perm.granted) return get().load();
    set({ status: perm.canAskAgain ? 'needs-permission' : 'denied' });
  };

  return {
    device: [],
    status: Platform.OS === 'web' ? 'unsupported' : 'idle',

    init: async () => {
      if (Platform.OS === 'web' || get().status !== 'idle') return;
      set({ status: 'checking' });
      try {
        await afterPermission(await getAudioPermission());
      } catch (e) {
        fail(e);
      }
    },

    requestAccess: async () => {
      try {
        await afterPermission(await requestAudioPermission());
      } catch (e) {
        fail(e);
      }
    },

    load: async () => {
      if (get().status === 'loading') return;
      set({ status: 'loading' });
      try {
        set({ device: await scanDeviceAudio(), status: 'ready' });
      } catch (e) {
        fail(e);
      }
    },
  };
});
