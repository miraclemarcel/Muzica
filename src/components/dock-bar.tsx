import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Tabs } from 'expo-router/js-tabs';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';
import type { IconName } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { tap } from '@/lib/haptics';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName; active: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', active: 'home' },
  local: { label: 'Local', icon: 'phone-portrait-outline', active: 'phone-portrait' },
  online: { label: 'Online', icon: 'cloud-outline', active: 'cloud' },
  library: { label: 'Library', icon: 'albums-outline', active: 'albums' },
};

/** Floating glass dock: mini player stacked over a capsule tab bar with a gliding lens. */
export function DockBar({ state, navigation }: TabBarProps) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const tabW = width / state.routes.length;
  const x = useSharedValue(0);

  useEffect(() => {
    x.set(withSpring(state.index * tabW, { damping: 18, stiffness: 180, mass: 0.7 }));
  }, [state.index, tabW, x]);

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 14, right: 14, bottom: Math.max(insets.bottom, 12) + 4 }}>
      <MiniPlayer />
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        className="h-[66px] flex-row overflow-hidden rounded-full border border-ink/10 dark:border-white/10"
        style={{
          backgroundColor: p.dockBg,
          shadowColor: '#000',
          shadowOpacity: p.scheme === 'dark' ? 0.5 : 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        }}>
        {width > 0 && (
          <Animated.View style={[{ position: 'absolute', top: 6, left: 6, bottom: 6, width: tabW - 12 }, lens]}>
            <LinearGradient
              colors={
                p.scheme === 'dark'
                  ? ['rgba(61,245,255,0.20)', 'rgba(139,108,255,0.20)', 'rgba(255,61,203,0.16)']
                  : ['rgba(0,144,176,0.12)', 'rgba(91,61,245,0.12)', 'rgba(214,0,127,0.10)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 999, borderWidth: 1, borderColor: p.faint }}
            />
          </Animated.View>
        )}

        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const meta = TABS[route.name] ?? { label: route.name, icon: 'ellipse-outline', active: 'ellipse' };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  tap('select');
                  navigation.navigate(route.name, route.params);
                }
              }}
              className="flex-1 items-center justify-center">
              <Ionicons name={focused ? meta.active : meta.icon} size={21} color={focused ? p.accent : p.muted} />
              {focused ? (
                <Animated.View entering={FadeIn.duration(220)}>
                  <Text className="mt-0.5 text-[10px] font-bold tracking-wide text-ink dark:text-white">
                    {meta.label.toUpperCase()}
                  </Text>
                </Animated.View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
