import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Artwork, gradientFor } from '@/components/artwork';
import { PressableScale } from '@/components/pressable-scale';
import type { IconName } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { tap } from '@/lib/haptics';
import { spectrum } from '@/theme/palette';
import type { Track } from '@/types';

/** A hairline spectrum border around any content. */
export function HoloFrame({ children, radius = 28 }: { children: ReactNode; radius?: number }) {
  const p = usePalette();
  return (
    <LinearGradient
      colors={
        p.scheme === 'dark'
          ? ['rgba(61,245,255,0.55)', 'rgba(139,108,255,0.25)', 'rgba(255,61,203,0.55)']
          : ['rgba(0,144,176,0.35)', 'rgba(91,61,245,0.15)', 'rgba(214,0,127,0.35)']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: radius, padding: 1 }}>
      <View style={{ borderRadius: radius - 1, backgroundColor: p.scheme === 'dark' ? '#0B0D16' : '#FFFFFF', overflow: 'hidden' }}>
        {children}
      </View>
    </LinearGradient>
  );
}

export function TrackCard({ track, onPress, size = 144 }: { track: Track; onPress: () => void; size?: number }) {
  return (
    <PressableScale
      onPress={() => {
        tap();
        onPress();
      }}
      style={{ width: size }}>
      <Artwork seed={track.id} uri={track.artwork} size={size} radius={22} />
      <Text numberOfLines={1} className="mt-2.5 text-[14px] font-semibold text-ink dark:text-white">
        {track.title}
      </Text>
      <Text numberOfLines={1} className="mt-0.5 text-[12px] text-ink/50 dark:text-white/45">
        {track.artist}
      </Text>
    </PressableScale>
  );
}

export function Tile({
  icon,
  label,
  value,
  seed,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  seed: string;
  onPress: () => void;
}) {
  const [a, b] = gradientFor(seed);
  return (
    <PressableScale
      containerClassName="flex-1"
      onPress={() => {
        tap('select');
        onPress();
      }}
      className="h-[92px] justify-between rounded-3xl border border-ink/5 bg-white p-3.5 dark:border-white/10 dark:bg-white/5">
      <LinearGradient
        colors={[a, b]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={17} color="#fff" />
      </LinearGradient>
      <View className="flex-row items-end justify-between">
        <Text className="text-[14px] font-bold text-ink dark:text-white">{label}</Text>
        <Text className="text-[12px] font-semibold text-ink/45 dark:text-white/40">{value}</Text>
      </View>
    </PressableScale>
  );
}

/** 2×2 mosaic of the first four covers, or a generated gradient when empty. */
export function PlaylistCover({ seed, tracks, size }: { seed: string; tracks: Track[]; size: number }) {
  if (tracks.length >= 4) {
    const half = size / 2;
    return (
      <View style={{ width: size, height: size, borderRadius: 22, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap' }}>
        {tracks.slice(0, 4).map((t) => (
          <Artwork key={t.id} seed={t.id} uri={t.artwork} size={half} radius={0} />
        ))}
      </View>
    );
  }
  if (tracks.length) return <Artwork seed={tracks[0].id} uri={tracks[0].artwork} size={size} radius={22} />;
  return (
    <LinearGradient
      colors={[...gradientFor(seed)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="musical-notes-outline" size={size * 0.28} color="rgba(255,255,255,0.9)" />
    </LinearGradient>
  );
}

export function LikedCover({ size }: { size: number }) {
  return (
    <LinearGradient
      colors={[spectrum[1], spectrum[2], '#FF9F3D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="heart" size={size * 0.34} color="#fff" />
    </LinearGradient>
  );
}
