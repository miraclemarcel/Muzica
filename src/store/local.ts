import { Platform } from 'react-native';
import { create } from 'zustand';

import { requestAudioPermission, scanDeviceAudio } from '@/lib/local-music';
import type { Track } from '@/types';

type ScanStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unsupported' | 'error';

interface LocalState {
  device: Track[];
  status: ScanStatus;
  scan: () => Promise<void>;
}

/** Device files aren't persisted — the OS index is the source of truth, so we rescan. */
export const useLocalStore = create<LocalState>()((set, get) => ({
  device: [],
  status: Platform.OS === 'web' ? 'unsupported' : 'idle',

  scan: async () => {
    if (Platform.OS === 'web' || get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const granted = await requestAudioPermission();
      if (!granted) return set({ status: 'denied' });
      const device = await scanDeviceAudio();
      set({ device, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
}));
