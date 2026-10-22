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

import { Artwork, gradientFor } from '@/components/artwork';
import { Glow } from '@/components/glow';
import { Spin } from '@/components/spin';
import type { Palette } from '@/theme/palette';
import { spectrum } from '@/theme/palette';
import type { Track } from '@/types';

const RINGS = [
  { scale: 1.2, duration: 26000, reverse: false, dashed: false },
  { scale: 1.42, duration: 38000, reverse: true, dashed: true },
  { scale: 1.64, duration: 52000, reverse: false, dashed: false },
];

/**
 * "Orbit" — the cover spins like a record while satellites trace the rings
 * around it. Everything breathes while music plays and settles when paused.
 */
export function OrbitDisc({ track, playing, size, p }: { track: Track; playing: boolean; size: number; p: Palette }) {
  const disc = size / 1.7;
  const [c1, c2] = gradientFor(track.id);
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
      <Glow color={c1} size={size * 1.1} drift={9} intensity={p.scheme === 'dark' ? 1.4 : 0.9} />
      <Glow color={c2} size={size * 0.8} drift={13} intensity={p.scheme === 'dark' ? 1.2 : 0.8} />

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
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  left: d / 2 - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: spectrum[i],
                  shadowColor: spectrum[i],
                  shadowOpacity: 1,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              />
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
