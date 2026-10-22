import { router, useLocalSearchParams } from 'expo-router';
import { Alert, FlatList, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { gradientFor } from '@/components/artwork';
import { LikedCover, PlaylistCover } from '@/components/cards';
import { Screen } from '@/components/screen';
import { TrackRow } from '@/components/track-row';
import { EmptyState, GlowButton, Hud, IconButton } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { formatTotal } from '@/lib/format';
import { resolveTracks, useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';
import { spectrum } from '@/theme/palette';

export default function PlaylistScreen() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isLiked = id === 'liked';
  const catalog = useLibraryStore((s) => s.catalog);
  const likedIds = useLibraryStore((s) => s.liked);
  const playlist = useLibraryStore((s) => s.playlists.find((pl) => pl.id === id));

  const tracks = resolveTracks(isLiked ? likedIds : (playlist?.trackIds ?? []), catalog);
  const name = isLiked ? 'Liked songs' : playlist?.name;
  const glow = isLiked ? [spectrum[2], spectrum[1], '#FF9F3D'] : [...gradientFor(id ?? ''), spectrum[1]];

  const remove = () =>
    Alert.alert('Delete playlist?', `"${name}" will be removed. Songs stay in your library.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          useLibraryStore.getState().deletePlaylist(id);
          router.back();
        },
      },
    ]);

  const header = (
    <View>
      <View className="flex-row items-center justify-between px-3 py-1">
        <IconButton icon="chevron-back" label="Back" size={24} onPress={() => router.back()} />
        {!isLiked && playlist ? <IconButton icon="trash-outline" label="Delete playlist" onPress={remove} /> : null}
      </View>
      <View className="items-center px-6 pb-6 pt-2">
        <View className="items-center justify-center">
          <Animated.View entering={ZoomIn.springify().damping(14)}>
            {isLiked ? <LikedCover size={190} /> : <PlaylistCover seed={id} tracks={tracks} size={190} />}
          </Animated.View>
        </View>
        <Animated.View entering={FadeIn.delay(150)} className="mt-5 items-center">
          <Hud>{isLiked ? 'Collection' : 'Playlist'}</Hud>
          <Text className="mt-1 text-center text-[28px] font-extrabold tracking-tight text-ink dark:text-white">{name}</Text>
          <Text className="mt-1 text-[13px] text-ink/55 dark:text-white/50">
            {tracks.length} tracks · {formatTotal(tracks)}
          </Text>
        </Animated.View>
        {tracks.length ? (
          <View className="mt-5 flex-row gap-3 self-stretch">
            <GlowButton
              className="flex-1"
              label="Play"
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
        ) : null}
      </View>
    </View>
  );

  if (!isLiked && !playlist) {
    return (
      <Screen>
        <EmptyState
          icon="help-circle-outline"
          title="Playlist not found"
          body="It may have been deleted."
          action={<GlowButton label="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  return (
    <Screen glow={glow}>
      <FlatList
        data={tracks}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TrackRow
            track={item}
            index={index}
            playlistId={id}
            onPress={() => usePlayerStore.getState().playQueue(tracks, index)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={isLiked ? 'heart-outline' : 'add-circle-outline'}
            title={isLiked ? 'No liked songs yet' : 'Empty playlist'}
            body={
              isLiked
                ? 'Tap the heart on any track and it lands here.'
                : 'Use the ⋮ menu on any track and choose "Add to playlist".'
            }
          />
        }
      />
    </Screen>
  );
}
