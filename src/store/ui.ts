import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';

import type { Track } from '@/types';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface UIState {
  sheet: { track: Track; playlistId?: string } | null;
  createDialog: { track?: Track } | null;
  toast: { id: number; message: string; icon: IconName } | null;
  queueOpen: boolean;

  openSheet: (track: Track, playlistId?: string) => void;
  closeSheet: () => void;
  openCreate: (track?: Track) => void;
  closeCreate: () => void;
  showToast: (message: string, icon?: IconName) => void;
  setQueueOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sheet: null,
  createDialog: null,
  toast: null,
  queueOpen: false,

  openSheet: (track, playlistId) => set({ sheet: { track, playlistId } }),
  closeSheet: () => set({ sheet: null }),
  openCreate: (track) => set({ createDialog: { track } }),
  closeCreate: () => set({ createDialog: null }),
  showToast: (message, icon = 'checkmark-circle') =>
    set({ toast: { id: Date.now(), message, icon } }),
  setQueueOpen: (queueOpen) => set({ queueOpen }),
}));
