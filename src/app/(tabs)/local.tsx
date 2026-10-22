import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Linking, Platform, RefreshControl, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Screen } from '@/components/screen';
import { Spin } from '@/components/spin';
import { TrackRow } from '@/components/track-row';
import { DOCK_SPACE, EmptyState, GlowButton, Hud, IconButton, ScreenTitle, SearchField, type IconName } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { IS_EXPO_GO } from '@/lib/env';
import { importAudioFiles } from '@/lib/local-music';
import { useLibraryStore } from '@/store/library';
import { useLocalStore } from '@/store/local';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';

// iOS keeps the Music library private to Apple Music, so there's nothing to scan there.
const CAN_SCAN = Platform.OS === 'android';

/** Full-height prompt with a slowly orbiting emblem. */
function Prompt({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action: ReactNode;
}) {
  const p = usePalette();
  return (
    <Animated.View entering={FadeIn.duration(500)} className="items-center px-8 pt-10">
      <View className="mb-8 h-44 w-44 items-center justify-center">
        <Spin active duration={14000} style={{ position: 'absolute', width: 176, height: 176, borderRadius: 88, borderWidth: 1, borderStyle: 'dashed', borderColor: p.faint }}>
          <View style={{ position: 'absolute', top: -9, left: 79 }}>
            <Ionicons name="musical-note" size={16} color={p.muted} />
          </View>
        </Spin>
        <Spin active reverse duration={9000} style={{ position: 'absolute', width: 124, height: 124, borderRadius: 62, borderWidth: 1, borderColor: p.faint }}>
          <View style={{ position: 'absolute', bottom: -8, left: 55 }}>
            <Ionicons name="musical-notes" size={14} color={p.muted} />
          </View>
        </Spin>
        <View className="h-20 w-20 items-center justify-center rounded-full border border-ink/10 bg-white dark:border-white/10 dark:bg-white/5">
          <Ionicons name={icon} size={32} color={p.accent} />
        </View>
      </View>
      <Text className="mb-2 text-center text-[24px] font-extrabold tracking-tight text-ink dark:text-white">{title}</Text>
      <Text className="mb-7 text-center text-[14px] leading-5 text-ink/55 dark:text-white/50">{body}</Text>
      {action}
    </Animated.View>
  );
}

export default function Local() {
  const p = usePalette();
  const device = useLocalStore((s) => s.device);
  const status = useLocalStore((s) => s.status);
  const imported = useLibraryStore((s) => s.imported);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (CAN_SCAN) useLocalStore.getState().init();
  }, []);

  const all = useMemo(() => [...device, ...imported], [device, imported]);
  const tracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [all, query]);

  const addFromFiles = async () => {
    const added = await importAudioFiles();
    if (!added.length) return;
    useLibraryStore.getState().addImported(added);
    useUIStore.getState().showToast(`Added ${added.length} song${added.length > 1 ? 's' : ''}`, 'musical-notes');
  };

  const rescan = () => useLocalStore.getState().load();
  const hasTracks = all.length > 0;
  const scanning = status === 'checking' || (status === 'loading' && !hasTracks);

  // Anything that isn't a song list gets one clear, full-screen state.
  let gate: ReactNode = null;
  if (!hasTracks) {
    if (!CAN_SCAN) {
      gate = (
        <Prompt
          icon="musical-notes"
          title="Bring your music in"
          body={
            Platform.OS === 'ios'
              ? 'iOS keeps your Apple Music library private. Pick as many songs as you like from Files and they stay here, offline.'
              : 'Pick as many audio files as you like from your computer.'
          }
          action={<GlowButton label="Choose songs" icon="folder-open" onPress={addFromFiles} />}
        />
      );
    } else if (scanning) {
      gate = (
        <Prompt
          icon="scan"
          title="Scanning your device"
          body="Finding every song on your phone…"
          action={<ActivityIndicator color={p.accent} />}
        />
      );
    } else if (status === 'needs-permission' || status === 'idle') {
      gate = (
        <Prompt
          icon="musical-notes"
          title="All your music, in one place"
          body="Allow access and Muzica will find every song on your device automatically. Nothing is uploaded."
          action={<GlowButton label="Allow access" icon="lock-open" onPress={() => useLocalStore.getState().requestAccess()} />}
        />
      );
    } else if (status === 'denied') {
      gate = (
        <Prompt
          icon="lock-closed"
          title="Access is turned off"
          body={'Muzica needs permission to see the music on your device. Open Settings → Permissions → Music and audio, then come back.'}
          action={
            <View className="items-center gap-3">
              <GlowButton label="Open settings" icon="settings" onPress={() => Linking.openSettings()} />
              <GlowButton variant="ghost" label="I've allowed it" onPress={() => useLocalStore.getState().requestAccess()} />
            </View>
          }
        />
      );
    } else if (status === 'unsupported') {
      gate = (
        <Prompt
          icon="construct"
          title="Needs the Muzica app"
          body={
            IS_EXPO_GO
              ? "Expo Go isn't allowed to read your music library. Install a development build of Muzica (npx expo run:android) and your songs appear here automatically."
              : "This build of Muzica doesn't include music-library access yet. Rebuild it with npx expo run:android to scan your songs."
          }
          action={null}
        />
      );
    } else if (status === 'error') {
      gate = (
        <Prompt
          icon="alert-circle"
          title="Couldn't read your music"
          body="Something went wrong while scanning. Give it another go."
          action={<GlowButton label="Try again" icon="refresh" onPress={rescan} />}
        />
      );
    } else {
      gate = (
        <EmptyState
          icon="musical-note"
          title="No songs found"
          body="We couldn't find any audio files on this device. Download some music, then pull down to rescan."
        />
      );
    }
  }

  const header = (
    <View>
      <ScreenTitle
        kicker={hasTracks ? `${all.length} songs on this device` : 'On this device'}
        title="Local"
        right={
          hasTracks ? (
            CAN_SCAN ? (
              <IconButton filled icon="refresh" label="Rescan device" onPress={rescan} />
            ) : (
              <IconButton filled icon="add" label="Choose more songs" onPress={addFromFiles} />
            )
          ) : null
        }
      />
      {hasTracks ? (
        <>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search songs and artists" />
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
          <View className="mx-5 mb-1 mt-4">
            <Hud>{query ? `${tracks.length} matches` : 'Recently added'}</Hud>
          </View>
        </>
      ) : (
        gate
      )}
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
        keyboardDismissMode="on-drag"
        initialNumToRender={14}
        windowSize={11}
        refreshControl={
          CAN_SCAN && (status === 'ready' || hasTracks) ? (
            <RefreshControl
              refreshing={status === 'loading' && hasTracks}
              onRefresh={rescan}
              tintColor={p.accent}
              colors={[p.accent2]}
              progressBackgroundColor={p.elevated}
            />
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <TrackRow
            track={item}
            index={index}
            showSource={false}
            onPress={() => usePlayerStore.getState().playQueue(tracks, index)}
          />
        )}
        ListEmptyComponent={
          hasTracks && query ? (
            <EmptyState icon="search" title="No matches" body={`Nothing on this device matches "${query}".`} />
          ) : null
        }
      />
    </Screen>
  );
}
