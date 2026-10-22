import { Ionicons } from '@expo/vector-icons';
import { FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Artwork } from '@/components/artwork';
import { Equalizer } from '@/components/equalizer';
import { PressableScale } from '@/components/pressable-scale';
import { Sheet } from '@/components/sheet';
import { Hud } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { tap } from '@/lib/haptics';
import { usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';

export function QueueSheet() {
  const p = usePalette();
  const { height } = useWindowDimensions();
  const open = useUIStore((s) => s.queueOpen);
  const setOpen = useUIStore((s) => s.setQueueOpen);
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <Sheet open={open} onClose={() => setOpen(false)}>
      <View className="mx-5 mb-3 flex-row items-end justify-between">
        <View>
          <Hud>Up next</Hud>
          <Text className="mt-1 text-xl font-extrabold text-ink dark:text-white">Queue</Text>
        </View>
        <Text className="text-[13px] text-ink/50 dark:text-white/45">
          {Math.max(0, queue.length - index - 1)} remaining
        </Text>
      </View>
      <FlatList
        data={queue}
        style={{ maxHeight: height * 0.62 }}
        keyExtractor={(t, i) => `${t.id}-${i}`}
        initialScrollIndex={Math.max(0, Math.min(index, queue.length - 1))}
        getItemLayout={(_, i) => ({ length: 64, offset: 64 * i, index: i })}
        renderItem={({ item, index: i }) => {
          const current = i === index;
          return (
            <PressableScale
              scaleTo={0.98}
              onPress={() => {
                tap();
                usePlayerStore.getState().jumpTo(i);
              }}
              className={`mx-3 h-16 flex-row items-center gap-3 rounded-2xl px-2 ${
                current ? 'bg-ink/5 dark:bg-white/5' : ''
              } ${i < index ? 'opacity-40' : ''}`}>
              <Artwork seed={item.id} uri={item.artwork} size={44} radius={12} />
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className={`text-[14px] font-semibold ${
                    current ? 'text-deep-violet dark:text-neon-cyan' : 'text-ink dark:text-white'
                  }`}>
                  {item.title}
                </Text>
                <Text numberOfLines={1} className="text-[12px] text-ink/50 dark:text-white/45">
                  {item.artist}
                </Text>
              </View>
              {current ? (
                <Equalizer active={isPlaying} color={p.accent} />
              ) : (
                <Pressable
                  hitSlop={10}
                  accessibilityLabel={`Remove ${item.title} from queue`}
                  onPress={() => usePlayerStore.getState().removeAt(i)}
                  className="h-9 w-9 items-center justify-center">
                  <Ionicons name="close" size={18} color={p.muted} />
                </Pressable>
              )}
            </PressableScale>
          );
        }}
      />
    </Sheet>
  );
}
