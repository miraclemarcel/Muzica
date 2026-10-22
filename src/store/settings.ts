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
      theme: 'dark',
      haptics: true,
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
    }),
    {
      name: 'muzica.settings',
      storage: persistStorage,
      version: 1,
      // v0 defaulted to 'system'; dark is now the default look.
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsState>;
        if (version < 1 && state.theme === 'system') state.theme = 'dark';
        return state as SettingsState;
      },
    },
  ),
);
