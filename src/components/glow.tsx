import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  color: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  /** Seconds for one slow drift cycle; 0 disables drifting. */
  drift?: number;
};

const RINGS = 7;

/**
 * Soft radial glow approximated with stacked translucent circles —
 * no native blur needed, renders identically on every platform.
 */
export function Glow({ color, size, style, intensity = 1, drift = 0 }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!drift) return;
    t.set(withRepeat(
      withTiming(1, { duration: drift * 1000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    ));
  }, [drift, t]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateX: (t.value - 0.5) * size * 0.25 },
      { translateY: (0.5 - t.value) * size * 0.15 },
      { scale: 0.9 + t.value * 0.2 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size }, style, animated]}>
      {Array.from({ length: RINGS }, (_, i) => {
        const s = size * (1 - i / RINGS);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (size - s) / 2,
              top: (size - s) / 2,
              width: s,
              height: s,
              borderRadius: s / 2,
              backgroundColor: color,
              opacity: 0.05 * intensity,
            }}
          />
        );
      })}
    </Animated.View>
  );
}

/** Ambient backdrop of drifting colour fields used behind every screen. */
export function Ambient({ colors }: { colors: readonly string[] }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Glow color={colors[0]} size={420} drift={14} style={{ top: -180, left: -160 }} />
      <Glow color={colors[1]} size={360} drift={18} style={{ top: 120, right: -200 }} />
      <Glow color={colors[2] ?? colors[0]} size={300} drift={22} style={{ bottom: -60, left: -80 }} intensity={0.7} />
    </View>
  );
}
