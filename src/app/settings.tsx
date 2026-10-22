import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Hud, IconButton, type IconName } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { tap } from '@/lib/haptics';
import { useLibraryStore } from '@/store/library';
import { useSettingsStore } from '@/store/settings';
import { useUIStore } from '@/store/ui';
import { palettes } from '@/theme/palette';
import type { ThemeMode } from '@/types';

const MODES: { mode: ThemeMode; label: string; icon: IconName }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

/** Miniature phone mock-up rendered in the target theme. */
function ThemePreview({ mode }: { mode: ThemeMode }) {
  const half = mode === 'system';
  const tone = (s: 'light' | 'dark') => palettes[s];
  const panel = (s: 'light' | 'dark') => (
    <View style={{ flex: 1, backgroundColor: tone(s).bg, padding: 6, gap: 4 }}>
      <View style={{ height: 14, borderRadius: 4, backgroundColor: tone(s).accent2, opacity: 0.85 }} />
      <View style={{ height: 4, width: '70%', borderRadius: 2, backgroundColor: tone(s).faint }} />
      <View style={{ height: 4, width: '50%', borderRadius: 2, backgroundColor: tone(s).faint }} />
      <View style={{ flex: 1 }} />
      <View style={{ height: 8, borderRadius: 4, backgroundColor: tone(s).faint }} />
    </View>
  );
  return (
    <View style={{ height: 96, borderRadius: 14, overflow: 'hidden', flexDirection: 'row' }}>
      {half ? (
        <>
          {panel('light')}
          {panel('dark')}
        </>
      ) : (
        panel(mode)
      )}
    </View>
  );
}

function Row({ icon, label, detail, right, onPress }: { icon: IconName; label: string; detail?: string; right?: ReactNode; onPress?: () => void }) {
  const p = usePalette();
  return (
    <PressableScale scaleTo={onPress ? 0.98 : 1} onPress={onPress} disabled={!onPress} className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-ink/5 dark:bg-white/5">
        <Ionicons name={icon} size={18} color={p.accent} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-ink dark:text-white">{label}</Text>
        {detail ? <Text className="text-[12px] text-ink/50 dark:text-white/45">{detail}</Text> : null}
      </View>
      {right}
    </PressableScale>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mx-5 mt-7">
      <View className="mb-2 ml-1">
        <Hud>{title}</Hud>
      </View>
      <View className="overflow-hidden rounded-3xl border border-ink/5 bg-white dark:border-white/10 dark:bg-white/5">{children}</View>
    </View>
  );
}

export default function Settings() {
  const p = usePalette();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const haptics = useSettingsStore((s) => s.haptics);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const recentCount = useLibraryStore((s) => s.recent.length);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center px-3 py-1">
          <IconButton icon="chevron-back" label="Back" size={24} onPress={() => router.back()} />
        </View>
        <View className="px-5 pb-2">
          <Hud>Control room</Hud>
          <Text className="mt-1 text-[34px] font-extrabold tracking-tight text-ink dark:text-white">Settings</Text>
        </View>

        <View className="mx-5 mt-5">
          <View className="mb-2 ml-1">
            <Hud>Appearance</Hud>
          </View>
          <View className="flex-row gap-3">
            {MODES.map((m) => {
              const active = theme === m.mode;
              return (
                <PressableScale
                  key={m.mode}
                  containerClassName="flex-1"
                  onPress={() => {
                    tap('select');
                    setTheme(m.mode);
                  }}
                  className={`rounded-3xl border-2 p-2 ${
                    active ? 'border-deep-violet dark:border-neon-cyan' : 'border-ink/5 dark:border-white/10'
                  } bg-white dark:bg-white/5`}>
                  <ThemePreview mode={m.mode} />
                  <View className="mt-2 flex-row items-center justify-center gap-1.5 pb-1">
                    <Ionicons name={m.icon} size={13} color={active ? p.accent : p.muted} />
                    <Text className={`text-[13px] font-bold ${active ? 'text-ink dark:text-white' : 'text-ink/50 dark:text-white/45'}`}>
                      {m.label}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </View>

        <Group title="Feel">
          <Row
            icon="pulse"
            label="Haptic feedback"
            detail="Subtle taps on controls"
            right={
              <Switch
                value={haptics}
                onValueChange={setHaptics}
                trackColor={{ true: p.accent2, false: p.faint }}
                thumbColor="#fff"
              />
            }
          />
        </Group>

        <Group title="Data">
          <Row
            icon="time-outline"
            label="Clear listening history"
            detail={`${recentCount} recent tracks`}
            onPress={() => {
              useLibraryStore.getState().clearRecent();
              useUIStore.getState().showToast('History cleared', 'trash');
            }}
          />
        </Group>

        <Group title="About">
          <Row icon="planet-outline" label="Muzica" detail={`Version ${Constants.expoConfig?.version ?? '1.0.0'}`} />
          <Row icon="cloud-outline" label="Online music by Audius" detail="Free, full-length tracks from independent artists" />
        </Group>
      </ScrollView>
    </Screen>
  );
}
