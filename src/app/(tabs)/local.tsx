import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, Text, View } from 'react-native';

import { HoloFrame } from '@/components/cards';
import { Screen } from '@/components/screen';
import { TrackRow } from '@/components/track-row';
import { DOCK_SPACE, EmptyState, GlowButton, Hud, IconButton, ScreenTitle, SearchField } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { importAudioFiles } from '@/lib/local-music';
import { useLibraryStore } from '@/store/library';
import { useLocalStore } from '@/store/local';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';

export default function Local() {
  const p = usePalette();
  const device = useLocalStore((s) => s.device);
  const status = useLocalStore((s) => s.status);
  const scan = useLocalStore((s) => s.scan);
  const imported = useLibraryStore((s) => s.imported);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (useLocalStore.getState().status === 'idle') scan();
  }, [scan]);

  const all = useMemo(() => [...imported, ...device], [imported, device]);
  const tracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [all, query]);

  const importFiles = async () => {
    const added = await importAudioFiles();
    if (!added.length) return;
    useLibraryStore.getState().addImported(added);
    useUIStore.getState().showToast(`Imported ${added.length} file${added.length > 1 ? 's' : ''}`, 'download');
  };

  const header = (
    <View>
      <ScreenTitle
        kicker={`${all.length} tracks on this device`}
        title="Local"
        right={
          <>
            <IconButton filled icon="refresh" label="Rescan device" onPress={scan} />
            <IconButton filled icon="add" label="Import audio files" onPress={importFiles} />
          </>
        }
      />

      {status === 'denied' ? (
        <View className="mx-5 mb-4">
          <HoloFrame radius={24}>
            <View className="p-4">
              <Hud>Access needed</Hud>
              <Text className="mb-3 mt-1 text-[15px] font-semibold text-ink dark:text-white">
                Allow Muzica to read music on this device.
              </Text>
              <View className="flex-row gap-2">
                <GlowButton label="Allow" icon="lock-open" onPress={scan} />
                <GlowButton variant="ghost" label="Settings" onPress={() => Linking.openSettings()} />
              </View>
            </View>
          </HoloFrame>
        </View>
      ) : null}

      {Platform.OS !== 'android' && status !== 'loading' ? (
        <Text className="mx-5 mb-4 text-[13px] leading-5 text-ink/55 dark:text-white/50">
          {Platform.OS === 'ios'
            ? 'iOS keeps your Apple Music library private, so tap + to import audio files from Files.'
            : 'Tap + to import audio files from your computer.'}
        </Text>
      ) : null}

      {all.length ? (
        <>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search your files" />
          <View className="mx-5 mb-2 mt-4 flex-row gap-3">
            <GlowButton
              className="flex-1"
              label="Play all"
              icon="play"
              onPress={() => usePlayerStore.getState().playQueue(tracks, 0, { shuffle: false })}
            />
            <GlowButton
              className="flex-1"
              variant="ghost"
              label="Shuffle"
              icon="shuffle"
              onPress={() => usePlayerStore.getState().playQueue(tracks, 0, { shuffle: true })}
            />
          </View>
        </>
      ) : null}

      {status === 'loading' ? (
        <View className="items-center py-10">
          <ActivityIndicator color={p.accent} />
          <Text className="mt-3 text-[13px] text-ink/50 dark:text-white/45">Scanning your device…</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: DOCK_SPACE }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={14}
        windowSize={11}
        renderItem={({ item, index }) => (
          <TrackRow track={item} index={index} onPress={() => usePlayerStore.getState().playQueue(tracks, index)} />
        )}
        ListEmptyComponent={
          status === 'loading' ? null : query ? (
            <EmptyState icon="search" title="No matches" body={`Nothing on this device matches "${query}".`} />
          ) : (
            <EmptyState
              icon="folder-open-outline"
              title="No local music yet"
              body="Import audio files and they'll live here, offline, forever."
              action={<GlowButton label="Import files" icon="download" onPress={importFiles} />}
            />
          )
        }
      />
    </Screen>
  );
}
