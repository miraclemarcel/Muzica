import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Artwork } from '@/components/artwork';
import { PressableScale } from '@/components/pressable-scale';
import { Sheet } from '@/components/sheet';
import { Hud, type IconName } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { tap } from '@/lib/haptics';
import { useLibraryStore } from '@/store/library';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';

function Action({
  icon,
  label,
  onPress,
  tint,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  const p = usePalette();
  return (
    <PressableScale
      scaleTo={0.98}
      onPress={() => {
        tap('select');
        onPress();
      }}
      className="mx-3 flex-row items-center gap-4 rounded-2xl px-3 py-3.5">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-ink/5 dark:bg-white/5">
        <Ionicons name={icon} size={19} color={tint ?? p.text} />
      </View>
      <Text className="text-[15px] font-semibold text-ink dark:text-white" style={tint ? { color: tint } : undefined}>
        {label}
      </Text>
    </PressableScale>
  );
}

/** Global "…" menu for a track: like, queue, add to playlist. */
export function TrackSheet() {
  const p = usePalette();
  const sheet = useUIStore((s) => s.sheet);
  const close = useUIStore((s) => s.closeSheet);
  const toast = useUIStore((s) => s.showToast);
  const openCreate = useUIStore((s) => s.openCreate);
  const liked = useLibraryStore((s) => (sheet ? s.liked.includes(sheet.track.id) : false));
  const playlists = useLibraryStore((s) => s.playlists);
  const [picking, setPicking] = useState(false);

  // Keep last track rendered while the sheet animates out.
  const [last, setLast] = useState(sheet);
  if (sheet && sheet !== last) {
    setLast(sheet);
    setPicking(false);
  }
  const track = (sheet ?? last)?.track;
  const playlistId = (sheet ?? last)?.playlistId;

  const run = (fn: () => void) => () => {
    fn();
    close();
  };

  return (
    <Sheet open={!!sheet} onClose={close}>
      {track ? (
        <>
          <View className="mx-5 mb-2 flex-row items-center gap-3 pb-3">
            <Artwork seed={track.id} uri={track.artwork} size={56} radius={14} />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-base font-bold text-ink dark:text-white">
                {track.title}
              </Text>
              <Text numberOfLines={1} className="text-[13px] text-ink/55 dark:text-white/50">
                {track.artist}
              </Text>
            </View>
          </View>
          <View className="mx-5 mb-2 h-px bg-ink/5 dark:bg-white/10" />

          {picking ? (
            <ScrollView style={{ maxHeight: 380 }}>
              <View className="mx-5 my-2">
                <Hud>Add to playlist</Hud>
              </View>
              <Action
                icon="add"
                label="New playlist"
                tint={p.accent}
                onPress={run(() => openCreate(track))}
              />
              {playlists.map((pl) => (
                <Action
                  key={pl.id}
                  icon="list"
                  label={`${pl.name}  ·  ${pl.trackIds.length}`}
                  onPress={run(() => {
                    const added = useLibraryStore.getState().addToPlaylist(pl.id, track);
                    toast(added ? `Added to ${pl.name}` : `Already in ${pl.name}`, added ? 'checkmark-circle' : 'information-circle');
                  })}
                />
              ))}
            </ScrollView>
          ) : (
            <>
              <Action
                icon={liked ? 'heart' : 'heart-outline'}
                tint={liked ? p.accent3 : undefined}
                label={liked ? 'Remove from Liked' : 'Like'}
                onPress={run(() => {
                  const now = useLibraryStore.getState().toggleLike(track);
                  toast(now ? 'Added to Liked songs' : 'Removed from Liked songs', now ? 'heart' : 'heart-dislike');
                })}
              />
              <Action
                icon="play-forward-outline"
                label="Play next"
                onPress={run(() => {
                  usePlayerStore.getState().playNext(track);
                  toast('Playing next', 'play-forward');
                })}
              />
              <Action
                icon="list-outline"
                label="Add to queue"
                onPress={run(() => {
                  usePlayerStore.getState().addToQueue(track);
                  toast('Added to queue', 'list');
                })}
              />
              <Action icon="add-circle-outline" label="Add to playlist" onPress={() => setPicking(true)} />
              {playlistId && playlistId !== 'liked' ? (
                <Action
                  icon="remove-circle-outline"
                  tint={p.accent3}
                  label="Remove from this playlist"
                  onPress={run(() => useLibraryStore.getState().removeFromPlaylist(playlistId, track.id))}
                />
              ) : null}
              {track.id.startsWith('im:') ? (
                <Action
                  icon="trash-outline"
                  tint={p.accent3}
                  label="Remove imported file"
                  onPress={run(() => useLibraryStore.getState().removeImported(track.id))}
                />
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Sheet>
  );
}
