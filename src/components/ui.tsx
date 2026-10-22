import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Platform, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { usePalette } from '@/hooks/use-palette';
import { tap } from '@/lib/haptics';
import { spectrum } from '@/theme/palette';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/** Space reserved at the bottom of scroll views for the floating dock + mini player. */
export const DOCK_SPACE = 190;

/** Tiny monospace label — the "HUD" voice of the interface. */
export function Hud({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Text
      style={{ fontFamily: mono, letterSpacing: 1.6 }}
      className={`text-[10px] uppercase text-ink/50 dark:text-white/45 ${className}`}>
      {children}
    </Text>
  );
}

export function ScreenTitle({
  kicker,
  title,
  right,
}: {
  kicker: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <View className="flex-row items-end justify-between px-5 pb-4 pt-2">
      <View className="flex-1">
        <View className="mb-1 flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-deep-cyan dark:bg-neon-cyan" />
          <Hud>{kicker}</Hud>
        </View>
        <Text className="text-[34px] font-extrabold tracking-tight text-ink dark:text-white">{title}</Text>
      </View>
      {right ? <View className="flex-row items-center gap-2 pb-1">{right}</View> : null}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-3 mt-7 flex-row items-center justify-between px-5">
      <Text className="text-lg font-bold text-ink dark:text-white">{title}</Text>
      {action ? (
        <PressableScale onPress={onAction} hitSlop={8}>
          <Text className="text-[13px] font-semibold text-deep-violet dark:text-neon-cyan">{action}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  size = 20,
  color,
  label,
  filled = false,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  color?: string;
  label: string;
  filled?: boolean;
}) {
  const p = usePalette();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => {
        tap('select');
        onPress?.();
      }}
      className={`h-11 w-11 items-center justify-center rounded-full ${
        filled ? 'border border-ink/10 bg-white dark:border-white/10 dark:bg-white/5' : ''
      }`}>
      <Ionicons name={icon} size={size} color={color ?? p.text} />
    </PressableScale>
  );
}

/** Primary action: a gradient capsule. */
export function GlowButton({
  label,
  icon,
  onPress,
  variant = 'solid',
  className = '',
}: {
  label: string;
  icon?: IconName;
  onPress?: () => void;
  variant?: 'solid' | 'ghost';
  className?: string;
}) {
  const p = usePalette();
  if (variant === 'ghost') {
    return (
      <PressableScale
        containerClassName={className}
        onPress={() => {
          tap();
          onPress?.();
        }}
        className="h-12 flex-row items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-5 dark:border-white/10 dark:bg-white/5">
        {icon ? <Ionicons name={icon} size={18} color={p.text} /> : null}
        <Text className="text-[15px] font-bold text-ink dark:text-white">{label}</Text>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      containerClassName={className}
      onPress={() => {
        tap('medium');
        onPress?.();
      }}>
      <LinearGradient
        colors={[spectrum[0], spectrum[1], spectrum[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          height: 48,
          borderRadius: 999,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
        {icon ? <Ionicons name={icon} size={18} color="#05060A" /> : null}
        <Text style={{ color: '#05060A', fontSize: 15, fontWeight: '800' }}>{label}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <PressableScale
      onPress={() => {
        tap('select');
        onPress();
      }}
      className={`h-9 justify-center rounded-full border px-4 ${
        active
          ? 'border-ink bg-ink dark:border-neon-cyan dark:bg-neon-cyan/15'
          : 'border-ink/10 bg-white dark:border-white/10 dark:bg-white/5'
      }`}>
      <Text
        className={`text-[13px] font-semibold ${
          active ? 'text-white dark:text-neon-cyan' : 'text-ink/70 dark:text-white/70'
        }`}>
        {label}
      </Text>
    </PressableScale>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  loading,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  loading?: boolean;
}) {
  const p = usePalette();
  return (
    <View className="mx-5 h-12 flex-row items-center gap-2 rounded-2xl border border-ink/10 bg-white px-4 dark:border-white/10 dark:bg-white/5">
      <Ionicons name="search" size={18} color={p.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={p.muted}
        returnKeyType="search"
        autoCorrect={false}
        className="flex-1 text-[15px] text-ink dark:text-white"
        selectionColor={p.accent}
      />
      {loading ? (
        <ActivityIndicator size="small" color={p.accent} />
      ) : value ? (
        <PressableScale onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={p.muted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  const p = usePalette();
  return (
    <Animated.View entering={FadeIn.duration(400)} className="items-center px-10 py-14">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full border border-ink/10 dark:border-white/10">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-ink/5 dark:bg-white/5">
          <Ionicons name={icon} size={26} color={p.accent} />
        </View>
      </View>
      <Text className="mb-2 text-center text-lg font-bold text-ink dark:text-white">{title}</Text>
      <Text className="mb-6 text-center text-[14px] leading-5 text-ink/55 dark:text-white/50">{body}</Text>
      {action}
    </Animated.View>
  );
}
