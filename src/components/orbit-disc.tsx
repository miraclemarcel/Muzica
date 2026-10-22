import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Artwork } from '@/components/artwork';
import { Spin } from '@/components/spin';
import type { Palette } from '@/theme/palette';
import type { Track } from '@/types';

const NOTE = 14;

const RINGS = [
  { scale: 1.2, duration: 26000, reverse: false, dashed: false },
  { scale: 1.42, duration: 38000, reverse: true, dashed: true },
  { scale: 1.64, duration: 52000, reverse: false, dashed: false },
];

/**
 * "Orbit" — the cover spins like a record while music notes ride the rings
 * around it. Everything breathes while music plays and settles when paused.
 */
export function OrbitDisc({ track, playing, size, p }: { track: Track; playing: boolean; size: number; p: Palette }) {
  const disc = size / 1.7;
  const breath = useSharedValue(1);

  useEffect(() => {
    if (playing) {
      breath.set(withRepeat(
        withSequence(
          withTiming(1.035, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ));
    } else {
      cancelAnimation(breath);
      breath.set(withTiming(0.97, { duration: 500 }));
    }
  }, [playing, breath]);

  const ringsStyle = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
  const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.94 + (breath.value - 0.97) * 0.9 }] }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }, ringsStyle]}>
        {RINGS.map((r, i) => {
          const d = disc * r.scale;
          return (
            <Spin
              key={i}
              active={playing}
              duration={r.duration}
              reverse={r.reverse}
              style={{
                position: 'absolute',
                width: d,
                height: d,
                borderRadius: d / 2,
                borderWidth: 1,
                borderStyle: r.dashed ? 'dashed' : 'solid',
                borderColor: p.faint,
              }}>
              <View style={{ position: 'absolute', top: -NOTE / 2 - 1, left: d / 2 - NOTE / 2 }}>
                <Ionicons name={i === 1 ? 'musical-notes' : 'musical-note'} size={NOTE} color={p.muted} />
              </View>
            </Spin>
          );
        })}
      </Animated.View>

      <Animated.View style={discStyle}>
        <Spin
          active={playing}
          duration={18000}
          style={{
            width: disc,
            height: disc,
            borderRadius: disc / 2,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.18)',
          }}>
          <Artwork seed={track.id} uri={track.artwork} size={disc} radius={disc / 2} />
          {/* record grooves + spindle */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: disc * 0.18,
              top: disc * 0.18,
              width: disc * 0.64,
              height: disc * 0.64,
              borderRadius: disc,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: disc / 2 - 13,
              top: disc / 2 - 13,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: p.bg,
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.25)',
            }}
          />
        </Spin>
      </Animated.View>
    </View>
  );
}
