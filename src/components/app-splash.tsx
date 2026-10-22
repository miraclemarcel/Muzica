import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Ambient } from '@/components/glow';
import { Logo } from '@/components/logo';
import { spectrum } from '@/theme/palette';

// Matches `imageWidth` of the expo-splash-screen plugin in app.json.
const MARK = 160;
const MIN_SHOW_MS = 1900;
const WORD = 'MUZICA'.split('');
const NOTE_COLORS = ['#F5F7FF', spectrum[0], spectrum[2]] as const;
const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

SplashScreen.setOptions({ fade: false, duration: 0 });

/**
 * Picks up exactly where the native splash leaves off (same mark, same spot),
 * then brings it to life: the planet's waveform pulses, a note orbits the ring,
 * music notes drift up, the wordmark types in — and the whole scene zooms away once
 * the app's saved state has loaded.
 */
export function AppSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const [minElapsed, setMinElapsed] = useState(false);
  const bloom = useSharedValue(0);
  const rise = useSharedValue(0);
  const progress = useSharedValue(0);
  const exit = useSharedValue(0);

  useEffect(() => {
    bloom.set(withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
    rise.set(withDelay(250, withSpring(1, { damping: 16, stiffness: 120 })));
    progress.set(withTiming(1, { duration: MIN_SHOW_MS - 150, easing: Easing.inOut(Easing.cubic) }));
    const id = setTimeout(() => setMinElapsed(true), MIN_SHOW_MS);
    return () => clearTimeout(id);
  }, [bloom, rise, progress]);

  useEffect(() => {
    if (!ready || !minElapsed) return;
    exit.set(
      withTiming(1, { duration: 520, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(onDone);
      }),
    );
  }, [ready, minElapsed, exit, onDone]);

  const root = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const notesStyle = useAnimatedStyle(() => ({ opacity: bloom.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -46 * rise.value }, { scale: 1 + exit.value * 0.9 }],
  }));
  const wordStyle = useAnimatedStyle(() => ({ transform: [{ translateY: 70 - 18 * (1 - rise.value) }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={() => SplashScreen.hideAsync().catch(() => {})}
      style={[StyleSheet.absoluteFill, { backgroundColor: '#05060A', alignItems: 'center', justifyContent: 'center', zIndex: 100 }, root]}>
      <Animated.View style={[StyleSheet.absoluteFill, notesStyle]}>
        <Ambient colors={NOTE_COLORS} />
      </Animated.View>

      <Animated.View style={logoStyle}>
        <Logo size={MARK} live />
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', alignItems: 'center' }, wordStyle]}>
        <View style={{ flexDirection: 'row' }}>
          {WORD.map((ch, i) => (
            <Animated.Text
              key={i}
              entering={FadeInDown.delay(380 + i * 70).springify().damping(14)}
              style={{ color: '#F5F7FF', fontSize: 30, fontWeight: '800', letterSpacing: 9, marginRight: i === WORD.length - 1 ? -9 : 0 }}>
              {ch}
            </Animated.Text>
          ))}
        </View>
        <Animated.View entering={FadeIn.delay(900).duration(500)}>
          <Text style={{ marginTop: 10, fontFamily: mono, fontSize: 10, letterSpacing: 3, color: 'rgba(245,247,255,0.45)' }}>
            TUNING INTO YOUR SIGNAL
          </Text>
        </Animated.View>
      </Animated.View>

      <View style={{ position: 'absolute', bottom: 96, width: 120, height: 2, borderRadius: 1, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <Animated.View style={[{ height: 2 }, barStyle]}>
          <LinearGradient colors={[spectrum[0], spectrum[1], spectrum[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}
