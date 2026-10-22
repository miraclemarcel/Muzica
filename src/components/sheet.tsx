import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * Bottom sheet on top of a transparent Modal so it also layers above the
 * full-screen player. Springs in, drag down or tap outside to dismiss.
 */
export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const y = useSharedValue(height);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      y.set(height);
      y.set(withSpring(0, { damping: 22, stiffness: 220, mass: 0.8 }));
    } else if (mounted) {
      y.set(
        withTiming(height, { duration: 220 }, (done) => {
          if (done) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [open, height, mounted, y]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      y.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        scheduleOnRN(onClose);
      } else {
        y.set(withSpring(0, { damping: 20, stiffness: 240 }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, height * 0.6], [1, 0], 'clamp'),
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[{ position: 'absolute', inset: 0, backgroundColor: 'rgba(3,4,8,0.55)' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0 }, sheetStyle]}>
          <View
            className="rounded-t-[32px] border-t border-ink/5 bg-white dark:border-white/10 dark:bg-[#0D0F18]"
            style={{ paddingBottom: insets.bottom + 16, maxHeight: height * 0.85 }}>
            <GestureDetector gesture={pan}>
              <View className="items-center pb-2 pt-3">
                <View className="h-1.5 w-10 rounded-full bg-ink/15 dark:bg-white/20" />
              </View>
            </GestureDetector>
            {children}
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
