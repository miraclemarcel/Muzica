import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Rotates its children while `active`; pausing freezes the angle instead of snapping back. */
export function Spin({
  active,
  duration,
  reverse = false,
  children,
  style,
}: {
  active: boolean;
  duration: number;
  reverse?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const angle = useSharedValue(0);

  useEffect(() => {
    if (active) {
      const from = angle.value % 360;
      angle.set(from);
      angle.set(withRepeat(
        withTiming(from + (reverse ? -360 : 360), { duration, easing: Easing.linear }),
        -1,
        false,
      ));
    } else {
      cancelAnimation(angle);
    }
  }, [active, duration, reverse, angle]);

  const animated = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
