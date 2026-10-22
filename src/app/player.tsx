import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { gradientFor } from '@/components/artwork';
import { Ambient } from '@/components/glow';
import { OrbitDisc } from '@/components/orbit-disc';
import { PressableScale } from '@/components/pressable-scale';
import { EmptyState, GlowButton, Hud, IconButton, mono, type IconName } from '@/components/ui';
import { Waveform } from '@/components/waveform';
import { usePalette } from '@/hooks/use-palette';
import { getPlayer } from '@/lib/audio';
import { formatTime } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { useLibraryStore } from '@/store/library';
import { useCurrentTrack, usePlayerStore } from '@/store/player';
import { useUIStore } from '@/store/ui';
import { spectrum } from '@/theme/palette';

function Control({ icon, onPress, label, active, badge }: { icon: IconName; onPress: () => void; label: string; active?: boolean; badge?: string }) {
  const p = usePalette();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={() => {
        tap('select');
        onPress();
      }}
      className="h-14 w-14 items-center justify-center">
      <Ionicons name={icon} size={24} color={active ? p.accent : p.text} />
      {active ? <View className="absolute bottom-2 h-1 w-1 rounded-full bg-deep-cyan dark:bg-neon-cyan" /> : null}
      {badge ? (
        <Text style={{ fontFamily: mono }} className="absolute right-2.5 top-2.5 text-[9px] font-bold text-deep-cyan dark:text-neon-cyan">
          {badge}
        </Text>
      ) : null}
    </PressableScale>
  );
}

export default function Player() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const track = useCurrentTrack();
  const status = useAudioPlayerStatus(getPlayer());
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isBuffering = usePlayerStore((s) => s.isBuffering);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const upNext = usePlayerStore((s) => s.queue[s.index + 1]);
  const liked = useLibraryStore((s) => (track ? s.liked.includes(track.id) : false));
  const heart = useSharedValue(1);
  const drag = useSharedValue(0);

  const close = () => router.back();

  // Pull the top half down to dismiss.
  const dismiss = Gesture.Pan()
    .activeOffsetY(12)
    .failOffsetX([-20, 20])
    .onUpdate((e) => {
      drag.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 140 || e.velocityY > 1000) scheduleOnRN(close);
      else drag.set(withSpring(0, { damping: 18 }));
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drag.value }, { scale: interpolate(drag.value, [0, 400], [1, 0.92], 'clamp') }],
    borderRadius: interpolate(drag.value, [0, 60], [0, 36], 'clamp'),
  }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heart.value }] }));

  if (!track) {
    return (
      <View className="flex-1 justify-center bg-mist dark:bg-void">
        <EmptyState
          icon="radio-outline"
          title="Nothing playing"
          body="Pick a track from Local or Online to start the show."
          action={<GlowButton label="Close" icon="chevron-down" onPress={close} />}
        />
      </View>
    );
  }

  const duration = status.duration || track.duration;
  const progress = duration > 0 ? Math.min(1, status.currentTime / duration) : 0;
  const orbit = Math.min(width - 24, height * 0.44);
  const [c1, c2] = gradientFor(track.id);

  const like = () => {
    tap('medium');
    heart.set(withSequence(withSpring(1.35, { damping: 6, stiffness: 400 }), withSpring(1)));
    const now = useLibraryStore.getState().toggleLike(track);
    useUIStore.getState().showToast(now ? 'Added to Liked songs' : 'Removed from Liked songs', now ? 'heart' : 'heart-dislike');
  };

  return (
    <Animated.View style={[{ flex: 1, overflow: 'hidden', backgroundColor: p.bg }, sheetStyle]}>
      {track.artwork ? (
        <Image
          source={{ uri: track.artwork }}
          blurRadius={60}
          style={{ position: 'absolute', inset: 0, opacity: p.scheme === 'dark' ? 0.45 : 0.3 }}
          contentFit="cover"
          transition={400}
        />
      ) : null}
      <Ambient colors={[c1, c2, spectrum[1]]} />
      <LinearGradient
        colors={['transparent', p.bg]}
        locations={[0.35, 0.95]}
        style={{ position: 'absolute', inset: 0 }}
        pointerEvents="none"
      />

      <View style={{ flex: 1, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 12 }}>
        <GestureDetector gesture={dismiss}>
          <View>
            <View className="flex-row items-center justify-between px-3">
              <IconButton icon="chevron-down" label="Close player" size={26} onPress={close} />
              <View className="items-center">
                <Hud>Now playing</Hud>
                <Text className="mt-0.5 text-[12px] font-semibold text-ink/70 dark:text-white/70">
                  {track.source === 'online' ? 'Streaming · Audius' : 'From this device'}
                </Text>
              </View>
              <IconButton icon="ellipsis-horizontal" label="More options" onPress={() => useUIStore.getState().openSheet(track)} />
            </View>

            <Animated.View entering={FadeIn.duration(500)} className="items-center" style={{ marginTop: 8 }}>
              <OrbitDisc track={track} playing={isPlaying} size={orbit} p={p} />
            </Animated.View>
          </View>
        </GestureDetector>

        <View className="flex-1 justify-end px-6">
          <View className="mb-4 flex-row items-center gap-3">
            <Animated.View key={track.id} entering={FadeInUp.duration(350)} className="flex-1">
              <Text numberOfLines={1} className="text-[26px] font-extrabold tracking-tight text-ink dark:text-white">
                {track.title}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[16px] text-ink/60 dark:text-white/55">
                {track.artist}
              </Text>
            </Animated.View>
            <Pressable onPress={like} hitSlop={10} accessibilityLabel={liked ? 'Unlike' : 'Like'}>
              <Animated.View style={heartStyle}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={28} color={liked ? p.accent3 : p.text} />
              </Animated.View>
            </Pressable>
          </View>

          <Waveform
            seed={track.id}
            progress={progress}
            height={54}
            bars={46}
            baseColor={p.faint}
            onSeek={(f) => {
              tap('select');
              usePlayerStore.getState().seek(f * duration);
            }}
          />
          <View className="mt-1.5 flex-row justify-between">
            <Text style={{ fontFamily: mono }} className="text-[11px] text-ink/50 dark:text-white/45">
              {formatTime(status.currentTime)}
            </Text>
            <Text style={{ fontFamily: mono }} className="text-[11px] text-ink/50 dark:text-white/45">
              -{formatTime(Math.max(0, duration - status.currentTime))}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-between">
            <Control icon="shuffle" label="Shuffle" active={shuffle} onPress={() => usePlayerStore.getState().toggleShuffle()} />
            <Control icon="play-skip-back" label="Previous" onPress={() => usePlayerStore.getState().prev()} />
            <PressableScale
              scaleTo={0.92}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              onPress={() => {
                tap('medium');
                usePlayerStore.getState().toggle();
              }}>
              <LinearGradient
                colors={[spectrum[0], spectrum[1], spectrum[2]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  padding: 3,
                  shadowColor: spectrum[1],
                  shadowOpacity: 0.6,
                  shadowRadius: 22,
                  elevation: 14,
                }}>
                <View className="flex-1 items-center justify-center rounded-full bg-ink dark:bg-void">
                  {isBuffering && isPlaying ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#fff" style={{ marginLeft: isPlaying ? 0 : 4 }} />
                  )}
                </View>
              </LinearGradient>
            </PressableScale>
            <Control icon="play-skip-forward" label="Next" onPress={() => usePlayerStore.getState().next()} />
            <Control
              icon="repeat"
              label={`Repeat ${repeat}`}
              active={repeat !== 'off'}
              badge={repeat === 'one' ? '1' : undefined}
              onPress={() => usePlayerStore.getState().cycleRepeat()}
            />
          </View>

          <PressableScale
            scaleTo={0.98}
            onPress={() => useUIStore.getState().setQueueOpen(true)}
            className="mt-5 h-12 flex-row items-center gap-3 rounded-full border border-ink/10 bg-white/60 px-4 dark:border-white/10 dark:bg-white/5">
            <Ionicons name="list" size={18} color={p.accent} />
            <Text numberOfLines={1} className="flex-1 text-[13px] text-ink/70 dark:text-white/65">
              {upNext ? (
                <>
                  <Text className="font-bold text-ink dark:text-white">Up next </Text>
                  {upNext.title} · {upNext.artist}
                </>
              ) : (
                'End of queue'
              )}
            </Text>
            <Ionicons name="chevron-up" size={16} color={p.muted} />
          </PressableScale>
        </View>
      </View>
    </Animated.View>
  );
}
