import { useEffect, useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { hashString, seededRandom } from '@/lib/format';
import { spectrumAt } from '@/theme/palette';

/** A stable, musical-looking bar profile derived from the track id. */
export function useWaveBars(seed: string, count: number) {
  return useMemo(() => {
    const rand = seededRandom(hashString(seed));
    const phase = rand() * Math.PI * 2;
    const out: number[] = [];
    for (let i = 0, prev = 0.5; i < count; i++) {
      const envelope = 0.55 + 0.45 * Math.sin((i / count) * Math.PI);
      const wave = Math.abs(Math.sin(i * 0.42 + phase)) * 0.55 + rand() * 0.45;
      prev = prev * 0.35 + wave * 0.65;
      out.push(Math.max(0.12, Math.min(1, prev * envelope)));
    }
    return out;
  }, [seed, count]);
}

type Props = {
  seed: string;
  /** 0..1 */
  progress: number;
  height?: number;
  bars?: number;
  baseColor: string;
  /** When provided the waveform becomes a scrubber. Receives 0..1. */
  onSeek?: (fraction: number) => void;
};

/**
 * The progress bar *is* the song: a waveform fingerprint that fills with the
 * cyan→magenta spectrum as it plays. Drag or tap anywhere to seek.
 */
export function Waveform({ seed, progress, height = 56, bars = 52, baseColor, onSeek }: Props) {
  const heights = useWaveBars(seed, bars);
  const colors = useMemo(() => heights.map((_, i) => spectrumAt(i / (bars - 1))), [heights, bars]);
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const fill = useSharedValue(0);
  const lift = useSharedValue(1);

  const shown = drag ?? progress;

  useEffect(() => {
    fill.set(
      drag !== null ? shown * width : withTiming(shown * width, { duration: 260, easing: Easing.linear }),
    );
  }, [shown, width, drag, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: fill.value }));
  const liftStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: lift.value }] }));

  const clamp = (x: number) => (width ? Math.min(1, Math.max(0, x / width)) : 0);

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      lift.set(withSpring(1.25));
      setDrag(clamp(e.x));
    })
    .onUpdate((e) => setDrag(clamp(e.x)))
    .onEnd((e) => onSeek?.(clamp(e.x)))
    .onFinalize(() => {
      lift.set(withSpring(1));
      setDrag(null);
    });

  const row = (colored: boolean) => (
    <View style={{ width, height, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: Math.max(2, width / bars - 2.5),
            height: Math.max(3, h * height),
            borderRadius: 3,
            backgroundColor: colored ? colors[i] : baseColor,
          }}
        />
      ))}
    </View>
  );

  const body = (
    <Animated.View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[{ height, justifyContent: 'center' }, liftStyle]}>
      {width > 0 && (
        <>
          {row(false)}
          <Animated.View style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' }, fillStyle]}>
            {row(true)}
          </Animated.View>
        </>
      )}
    </Animated.View>
  );

  if (!onSeek) return body;
  return <GestureDetector gesture={gesture}>{body}</GestureDetector>;
}
