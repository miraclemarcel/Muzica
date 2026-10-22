import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { spectrum } from '@/theme/palette';

// Same geometry as assets/images/icon.svg so the native splash hands over seamlessly.
const TILT = '-20deg';
const BARS = [0.3, 0.56, 0.82, 0.56, 0.3];

function Bar({ h, w, i, live }: { h: number; w: number; i: number; live: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (!live) return;
    const ms = 300 + ((i * 97) % 160);
    s.set(
      withDelay(
        i * 70,
        withRepeat(
          withSequence(
            withTiming(0.45, { duration: ms, easing: Easing.inOut(Easing.quad) }),
            withTiming(1.12, { duration: ms, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      ),
    );
  }, [live, i, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: s.value }] }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: w / 2, backgroundColor: 'rgba(5,6,10,0.82)' }, style]} />;
}

/** A music note travels the ring and slips behind the planet on the far side. */
function Satellite({ S, a, b, r, angle }: { S: number; a: number; b: number; r: number; angle: SharedValue<number> }) {
  const d = 0.16 * S;
  const style = useAnimatedStyle(() => {
    const t = angle.value;
    const x = a * Math.cos(t);
    const y = b * Math.sin(t);
    const hidden = y < 0 && Math.abs(x) < r * 0.95;
    return {
      opacity: hidden ? 0 : 1,
      // Counter the ring's tilt so the note stays upright.
      transform: [{ translateX: S / 2 + x - d / 2 }, { translateY: S / 2 + y - d / 2 }, { rotate: '20deg' }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, width: d, height: d }, style]}>
      <Ionicons name="musical-note" size={d} color="#fff" />
    </Animated.View>
  );
}

/** Muzica's mark: a gradient planet with a waveform cut into it, circled by a tilted ring. */
export function Logo({ size: S, live = false }: { size: number; live?: boolean }) {
  const r = 0.31 * S;
  const a = 0.49 * S;
  const b = a * 0.36;
  const D = 2 * a;
  const stroke = Math.max(2, 0.03 * S);
  const bw = 0.054 * S;
  const gap = 0.032 * S;
  const angle = useSharedValue((38 * Math.PI) / 180);

  useEffect(() => {
    if (!live) return;
    const from = angle.value;
    angle.set(withRepeat(withTiming(from + Math.PI * 2, { duration: 2600, easing: Easing.linear }), -1, false));
  }, [live, angle]);

  const ring = (colors: { l: string; t: string; r: string; b: string }, opacity = 1) => ({
    position: 'absolute' as const,
    width: D,
    height: D,
    borderRadius: a,
    borderWidth: stroke,
    borderLeftColor: colors.l,
    borderTopColor: colors.t,
    borderRightColor: colors.r,
    borderBottomColor: colors.b,
    opacity,
    transform: [{ scaleY: 0.36 }],
  });
  const colors = { l: spectrum[0], t: spectrum[1], r: spectrum[2], b: spectrum[1] };

  return (
    <View style={{ width: S, height: S, alignItems: 'center', justifyContent: 'center' }}>
      {/* back of the ring */}
      <View style={{ position: 'absolute', width: S, height: S, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: TILT }] }}>
        <View style={ring(colors, 0.55)} />
      </View>

      {/* planet */}
      <LinearGradient
        colors={[spectrum[0], spectrum[1], spectrum[2]]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 2 * r, height: 2 * r, borderRadius: r, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View
          style={{
            position: 'absolute',
            left: r * 0.15,
            top: r * 0.1,
            width: r * 1.1,
            height: r * 1.1,
            borderRadius: r,
            backgroundColor: 'rgba(255,255,255,0.18)',
          }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
          {BARS.map((f, i) => (
            <Bar key={i} i={i} live={live} w={bw} h={f * r * 1.25} />
          ))}
        </View>
      </LinearGradient>

      {/* front half of the ring (clipped to the near side) + orbiting note */}
      <View style={{ position: 'absolute', width: S, height: S, transform: [{ rotate: TILT }] }} pointerEvents="none">
        <View style={{ position: 'absolute', left: 0, top: S / 2, width: S, height: S / 2, overflow: 'hidden' }}>
          <View style={[ring(colors), { left: (S - D) / 2, top: -a }]} />
        </View>
        <Satellite S={S} a={a} b={b} r={r} angle={angle} />
      </View>
    </View>
  );
}
