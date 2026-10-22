import { useEffect, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Screen } from '@/components/screen';
import { TrackRow } from '@/components/track-row';
import { Chip, DOCK_SPACE, EmptyState, GlowButton, Hud, ScreenTitle, SearchField } from '@/components/ui';
import { fetchTrending, GENRES, searchTracks } from '@/lib/audius';
import { usePlayerStore } from '@/store/player';
import type { Track } from '@/types';

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

function Skeleton() {
  const o = useSharedValue(0.4);
  useEffect(() => {
    o.set(withRepeat(withTiming(1, { duration: 700 }), -1, true));
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={style}>
      {Array.from({ length: 7 }, (_, i) => (
        <View key={i} className="mx-5 mb-3 flex-row items-center gap-3">
          <View className="h-[52px] w-[52px] rounded-[14px] bg-ink/5 dark:bg-white/5" />
          <View className="flex-1 gap-2">
            <View className="h-3.5 w-3/4 rounded-full bg-ink/5 dark:bg-white/5" />
            <View className="h-3 w-1/3 rounded-full bg-ink/5 dark:bg-white/5" />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

export default function Online() {
  const [genre, setGenre] = useState<string>('All');
  const [query, setQuery] = useState('');
  const q = useDebounced(query.trim(), 400);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; tracks: Track[]; error: boolean } | null>(null);
  const key = `${q}|${genre}|${attempt}`;

  useEffect(() => {
    let cancelled = false;
    (q ? searchTracks(q) : fetchTrending(genre))
      .then((tracks) => !cancelled && setResult({ key, tracks, error: false }))
      .catch(() => !cancelled && setResult({ key, tracks: [], error: true }));
    return () => {
      cancelled = true;
    };
  }, [q, genre, key]);

  const loading = result?.key !== key;
  const tracks = loading ? [] : result.tracks;
  const error = !loading && result.error;

  const header = (
    <View>
      <ScreenTitle kicker="Open network · full tracks" title="Online" />
      <SearchField value={query} onChangeText={setQuery} placeholder="Artists, songs, vibes…" loading={loading && !!q} />
      {!q ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 14 }}>
          {GENRES.map((g) => (
            <Chip key={g} label={g} active={genre === g} onPress={() => setGenre(g)} />
          ))}
        </ScrollView>
      ) : null}
      <View className="mx-5 mb-3 mt-6 flex-row items-center justify-between">
        <Hud>{q ? `Results for "${q}"` : `Trending · ${genre === 'All' ? 'Everything' : genre}`}</Hud>
        {tracks.length && !loading ? (
          <GlowButton label="Play" icon="play" onPress={() => usePlayerStore.getState().playQueue(tracks, 0)} />
        ) : null}
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={loading ? [] : tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: DOCK_SPACE }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TrackRow
            track={item}
            index={index}
            showSource={false}
            onPress={() => usePlayerStore.getState().playQueue(tracks, index)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Skeleton />
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Signal lost"
              body="We couldn't reach the music network. Check your connection and try again."
              action={<GlowButton label="Retry" icon="refresh" onPress={() => setAttempt((a) => a + 1)} />}
            />
          ) : (
            <EmptyState icon="planet-outline" title="Nothing out here" body="Try another search or genre." />
          )
        }
      />
    </Screen>
  );
}
