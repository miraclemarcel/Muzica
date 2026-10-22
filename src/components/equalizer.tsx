import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const BARS = [
  { min: 0.25, max: 1, ms: 420, delay: 0 },
  { min: 0.35, max: 0.75, ms: 360, delay: 120 },
  { min: 0.2, max: 0.95, ms: 480, delay: 60 },
  { min: 0.3, max: 0.7, ms: 400, delay: 200 },
];

function Bar({ active, color, height, spec }: { active: boolean; color: string; height: number; spec: (typeof BARS)[number] }) {
  const v = useSharedValue(spec.min);

  useEffect(() => {
    if (active) {
      v.set(withDelay(
        spec.delay,
        withRepeat(
          withSequence(
            withTiming(spec.max, { duration: spec.ms, easing: Easing.inOut(Easing.quad) }),
            withTiming(spec.min, { duration: spec.ms, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
        ),
      ));
    } else {
      cancelAnimation(v);
      v.set(withTiming(0.3, { duration: 250 }));
    }
  }, [active, spec, v]);

  const style = useAnimatedStyle(() => ({ height: v.value * height }));

  return <Animated.View style={[{ width: 3, borderRadius: 2, backgroundColor: color }, style]} />;
}

/** Bouncing bars that mark the track currently playing. */
export function Equalizer({ active, color, height = 16 }: { active: boolean; color: string; height?: number }) {
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
      {BARS.map((spec, i) => (
        <Bar key={i} active={active} color={color} height={height} spec={spec} />
      ))}
    </View>
  );
}
