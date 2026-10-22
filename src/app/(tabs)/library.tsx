import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { HoloFrame, LikedCover, PlaylistCover } from '@/components/cards';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { TrackRow } from '@/components/track-row';
import { DOCK_SPACE, Hud, IconButton, ScreenTitle, SectionHeader } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { formatTotal } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { resolveTracks, useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import type { Track } from '@/types';

export default function Library() {
  const p = usePalette();
  const catalog = useLibraryStore((s) => s.catalog);
  const likedIds = useLibraryStore((s) => s.liked);
  const playlists = useLibraryStore((s) => s.playlists);
  const recentIds = useLibraryStore((s) => s.recent);
  const openCreate = useUIStore((s) => s.openCreate);

  const liked = resolveTracks(likedIds, catalog);
  const recent = resolveTracks(recentIds, catalog).slice(0, 8);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: DOCK_SPACE }} showsVerticalScrollIndicator={false}>
        <ScreenTitle
          kicker="Your collection"
          title="Library"
          right={<IconButton filled icon="add" label="New playlist" onPress={() => openCreate()} />}
        />

        <Animated.View entering={FadeInDown.duration(450)} className="px-5">
          <PressableScale scaleTo={0.98} onPress={() => router.push('/playlist/liked')}>
            <HoloFrame>
              <View className="flex-row items-center gap-4 p-4">
                <LikedCover size={72} />
                <View className="flex-1">
                  <Hud>Collection</Hud>
                  <Text className="mt-1 text-xl font-extrabold text-ink dark:text-white">Liked songs</Text>
                  <Text className="text-[13px] text-ink/55 dark:text-white/50">
                    {liked.length} tracks · {formatTotal(liked)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={p.muted} />
              </View>
            </HoloFrame>
          </PressableScale>
        </Animated.View>

        <SectionHeader title="Playlists" action={playlists.length ? 'New' : undefined} onAction={() => openCreate()} />
        <View className="flex-row flex-wrap gap-y-5 px-5" style={{ columnGap: 16 }}>
          {playlists.map((pl, i) => {
            const tracks = resolveTracks(pl.trackIds, catalog);
            return (
              <Animated.View key={pl.id} entering={FadeInDown.delay(i * 50).duration(400)} style={{ width: '47%' }}>
                <PressableScale
                  onPress={() => {
                    tap('select');
                    router.push({ pathname: '/playlist/[id]', params: { id: pl.id } });
                  }}>
                  <View style={{ aspectRatio: 1 }}>
                    <MeasuredCover seed={pl.id} tracks={tracks} />
                  </View>
                  <Text numberOfLines={1} className="mt-2.5 text-[15px] font-bold text-ink dark:text-white">
                    {pl.name}
                  </Text>
                  <Text className="text-[12px] text-ink/50 dark:text-white/45">{tracks.length} tracks</Text>
                </PressableScale>
              </Animated.View>
            );
          })}
          <PressableScale
            containerClassName="w-[47%]"
            onPress={() => openCreate()}
            className="aspect-square items-center justify-center rounded-[22px] border border-dashed border-ink/20 dark:border-white/20">
            <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-ink/5 dark:bg-white/5">
              <Ionicons name="add" size={24} color={p.accent} />
            </View>
            <Text className="text-[13px] font-semibold text-ink/60 dark:text-white/55">New playlist</Text>
          </PressableScale>
        </View>

        {recent.length ? (
          <>
            <SectionHeader
              title="Recently played"
              action="Clear"
              onAction={() => useLibraryStore.getState().clearRecent()}
            />
            {recent.map((t, i) => (
              <TrackRow key={t.id} track={t} index={i} onPress={() => usePlayerStore.getState().playQueue(recent, i)} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

/** Measures the grid cell so the cover always fills it. */
function MeasuredCover({ seed, tracks }: { seed: string; tracks: Track[] }) {
  const [size, setSize] = useState(0);
  return (
    <View style={{ flex: 1 }} onLayout={(e) => setSize(e.nativeEvent.layout.width)}>
      {size > 0 ? <PlaylistCover seed={seed} tracks={tracks} size={size} /> : null}
    </View>
  );
}
