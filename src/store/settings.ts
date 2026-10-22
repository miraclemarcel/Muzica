import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistStorage } from '@/store/storage';
import type { ThemeMode } from '@/types';

interface SettingsState {
  theme: ThemeMode;
  haptics: boolean;
  setTheme: (theme: ThemeMode) => void;
  setHaptics: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      haptics: true,
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
    }),
    { name: 'muzica.settings', storage: persistStorage },
  ),
);
