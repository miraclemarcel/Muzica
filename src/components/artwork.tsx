import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { hashString } from '@/lib/format';
import { coverGradients } from '@/theme/palette';

type Props = {
  seed: string;
  uri?: string;
  size: number;
  radius?: number;
};

export function gradientFor(seed: string) {
  return coverGradients[hashString(seed) % coverGradients.length];
}

/** Cover art, or a generated holographic gradient when a track has none. */
export function Artwork({ seed, uri, size, radius = 16 }: Props) {
  const box = { width: size, height: size, borderRadius: radius };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={box}
        contentFit="cover"
        transition={250}
        recyclingKey={seed}
        cachePolicy="memory-disk"
      />
    );
  }
  const [a, b] = gradientFor(seed);
  const angle = hashString(seed + 'a') % 2 === 0;
  return (
    <LinearGradient
      colors={[a, b]}
      start={{ x: 0, y: angle ? 0 : 1 }}
      end={{ x: 1, y: angle ? 1 : 0 }}
      style={[box, { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
      {/* concentric "vinyl" grooves */}
      <View
        style={{
          position: 'absolute',
          width: size * 0.78,
          height: size * 0.78,
          borderRadius: size,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.22)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.3)',
        }}
      />
      <Ionicons name="musical-notes" size={Math.max(12, size * 0.3)} color="rgba(255,255,255,0.92)" />
    </LinearGradient>
  );
}
