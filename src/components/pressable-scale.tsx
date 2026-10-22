import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

/** Pressable with a springy press-in scale. Animation stays on the UI thread. */
export function PressableScale({
  children,
  className,
  containerClassName,
  style,
  scaleTo = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      className={containerClassName}
      onPressIn={(e) => {
        scale.set(withSpring(scaleTo, { damping: 15, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 12, stiffness: 300 }));
        onPressOut?.(e);
      }}
      {...rest}>
      <Animated.View style={animated}>
        <View className={className} style={style}>
          {children}
        </View>
      </Animated.View>
    </Pressable>
  );
}
