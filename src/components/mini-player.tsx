import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerStatus } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeInDown,
  FadeOutDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Artwork } from '@/components/artwork';
import { PressableScale } from '@/components/pressable-scale';
import { Spin } from '@/components/spin';
import { usePalette } from '@/hooks/use-palette';
import { getPlayer } from '@/lib/audio';
import { tap } from '@/lib/haptics';
import { useCurrentTrack, usePlayerStore } from '@/store/player';
import { spectrum } from '@/theme/palette';

function Progress() {
  const status = useAudioPlayerStatus(getPlayer());
  const pct = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  return (
    <View className="absolute bottom-0 left-4 right-4 h-[2px] overflow-hidden rounded-full bg-ink/5 dark:bg-white/10">
      <LinearGradient
        colors={[spectrum[0], spectrum[1], spectrum[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 2, width: `${pct * 100}%` }}
      />
    </View>
  );
}

/** Floating "now playing" capsule. Tap to open, swipe sideways to skip. */
export function MiniPlayer() {
  const p = usePalette();
  const track = useCurrentTrack();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const x = useSharedValue(0);

  const skip = (dir: 1 | -1) => {
    tap('medium');
    if (dir === 1) usePlayerStore.getState().next();
    else usePlayerStore.getState().prev();
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      x.set(e.translationX * 0.6);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 80) scheduleOnRN(skip, e.translationX < 0 ? 1 : -1);
      x.set(withSpring(0, { damping: 16, stiffness: 200 }));
    });

  const slide = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    opacity: interpolate(Math.abs(x.value), [0, 120], [1, 0.5], 'clamp'),
  }));

  if (!track) return null;

  return (
    <Animated.View entering={FadeInDown.springify().damping(18)} exiting={FadeOutDown} style={{ marginBottom: 8 }}>
      <GestureDetector gesture={swipe}>
        <Animated.View style={slide}>
          <PressableScale
            scaleTo={0.98}
            onPress={() => router.push('/player')}
            accessibilityLabel="Open player"
            className="h-[64px] flex-row items-center gap-3 overflow-hidden rounded-[24px] border border-ink/10 pl-2.5 pr-2 dark:border-white/10"
            style={{
              backgroundColor: p.dockBg,
              shadowColor: p.accent2,
              shadowOpacity: p.scheme === 'dark' ? 0.35 : 0.15,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}>
            <Spin active={isPlaying} duration={9000} style={{ borderRadius: 22, overflow: 'hidden' }}>
              <Artwork seed={track.id} uri={track.artwork} size={44} radius={22} />
            </Spin>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-[14px] font-bold text-ink dark:text-white">
                {track.title}
              </Text>
              <Text numberOfLines={1} className="text-[12px] text-ink/55 dark:text-white/50">
                {track.artist}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                tap('medium');
                usePlayerStore.getState().toggle();
              }}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              hitSlop={6}
              className="h-11 w-11 items-center justify-center rounded-full bg-ink dark:bg-white">
              {isBuffering && isPlaying ? (
                <ActivityIndicator size="small" color={p.bg} />
              ) : (
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={p.bg} style={{ marginLeft: isPlaying ? 0 : 2 }} />
              )}
            </Pressable>
            <Pressable
              onPress={() => skip(1)}
              accessibilityLabel="Next track"
              hitSlop={6}
              className="h-11 w-9 items-center justify-center">
              <Ionicons name="play-forward" size={20} color={p.text} />
            </Pressable>
            <Progress />
          </PressableScale>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
