import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { seededRandom } from '@/lib/format';

const GLYPHS = ['musical-note', 'musical-notes'] as const;
const COUNT = 9;

type NoteSpec = {
  x: number;
  size: number;
  duration: number;
  phase: number;
  sway: number;
  spin: number;
  glyph: (typeof GLYPHS)[number];
  color: string;
  opacity: number;
};

function FloatingNote({ spec, height }: { spec: NoteSpec; height: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.set(withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1, false));
  }, [spec.duration, t]);

  const style = useAnimatedStyle(() => {
    const p = (t.value + spec.phase) % 1;
    // Fade in at the bottom, out near the top, so the loop never pops.
    const fade = Math.min(1, p / 0.15, (1 - p) / 0.2);
    return {
      opacity: spec.opacity * Math.max(0, fade),
      transform: [
        { translateY: height * (1.05 - p * 1.2) },
        { translateX: Math.sin(p * Math.PI * 4) * spec.sway },
        { rotate: `${Math.sin(p * Math.PI * 2) * spec.spin}deg` },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: spec.x, top: 0 }, style]}>
      <Ionicons name={spec.glyph} size={spec.size} color={spec.color} />
    </Animated.View>
  );
}

/** Backdrop of music notes drifting slowly up the screen, used behind every page. */
export function Ambient({ colors }: { colors: readonly string[] }) {
  const { width, height } = useWindowDimensions();
  const notes = useMemo(() => {
    const rand = seededRandom(7);
    return Array.from({ length: COUNT }, (_, i): NoteSpec => ({
      x: ((i + rand() * 0.8) / COUNT) * (width - 24),
      size: 14 + Math.round(rand() * 16),
      duration: 16000 + rand() * 14000,
      phase: rand(),
      sway: 8 + rand() * 18,
      spin: 10 + rand() * 20,
      glyph: GLYPHS[i % GLYPHS.length],
      color: colors[i % colors.length],
      opacity: 0.12 + rand() * 0.1,
    }));
  }, [width, colors]);

  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {notes.map((spec, i) => (
        <FloatingNote key={i} spec={spec} height={height} />
      ))}
    </View>
  );
}
