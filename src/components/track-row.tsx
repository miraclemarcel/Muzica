import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Artwork } from '@/components/artwork';
import { Equalizer } from '@/components/equalizer';
import { PressableScale } from '@/components/pressable-scale';
import { mono } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { formatTime } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import type { Track } from '@/types';

type Props = {
  track: Track;
  index: number;
  onPress: () => void;
  playlistId?: string;
  showSource?: boolean;
};

export const TrackRow = memo(function TrackRow({ track, index, onPress, playlistId, showSource = true }: Props) {
  const p = usePalette();
  const isCurrent = usePlayerStore((s) => s.queue[s.index]?.id === track.id);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const openSheet = useUIStore((s) => s.openSheet);

  const more = () => {
    tap('select');
    openSheet(track, playlistId);
  };

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 35).duration(360)}>
      <PressableScale
        scaleTo={0.98}
        onPress={() => {
          tap();
          onPress();
        }}
        onLongPress={more}
        delayLongPress={300}
        className={`mx-3 flex-row items-center gap-3 rounded-2xl px-2 py-2 ${
          isCurrent ? 'bg-white dark:bg-white/5' : ''
        }`}>
        <View>
          <Artwork seed={track.id} uri={track.artwork} size={52} radius={14} />
          {isCurrent ? (
            <View className="absolute inset-0 items-center justify-center rounded-[14px] bg-black/45">
              <Equalizer active={isPlaying} color="#3DF5FF" height={16} />
            </View>
          ) : null}
        </View>

        <View className="flex-1">
          <Text
            numberOfLines={1}
            className={`text-[15px] font-semibold ${
              isCurrent ? 'text-deep-violet dark:text-neon-cyan' : 'text-ink dark:text-white'
            }`}>
            {track.title}
          </Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            {showSource ? (
              <Ionicons
                name={track.source === 'online' ? 'cloud-outline' : 'phone-portrait-outline'}
                size={11}
                color={p.muted}
              />
            ) : null}
            <Text numberOfLines={1} className="flex-1 text-[13px] text-ink/55 dark:text-white/50">
              {track.artist}
            </Text>
          </View>
        </View>

        <Text style={{ fontFamily: mono }} className="text-[11px] text-ink/40 dark:text-white/35">
          {track.duration ? formatTime(track.duration) : '--:--'}
        </Text>

        <Pressable
          onPress={more}
          hitSlop={10}
          accessibilityLabel={`More options for ${track.title}`}
          className="h-9 w-7 items-center justify-center">
          <Ionicons name="ellipsis-vertical" size={16} color={p.muted} />
        </Pressable>
      </PressableScale>
    </Animated.View>
  );
});
