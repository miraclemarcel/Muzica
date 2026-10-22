import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayerStatus } from 'expo-audio';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Artwork } from '@/components/artwork';
import { HoloFrame, Tile, TrackCard } from '@/components/cards';
import { Glow } from '@/components/glow';
import { PressableScale } from '@/components/pressable-scale';
import { Screen } from '@/components/screen';
import { Waveform } from '@/components/waveform';
import { DOCK_SPACE, GlowButton, Hud, IconButton, SectionHeader } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { getPlayer } from '@/lib/audio';
import { fetchTrending } from '@/lib/audius';
import { greeting } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { resolveTracks, useLibraryStore } from '@/store/library';
import { useLocalStore } from '@/store/local';
import { useCurrentTrack, usePlayerStore } from '@/store/player';
import { useSettingsStore } from '@/store/settings';
import type { Track } from '@/types';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function NowPlayingHero({ track }: { track: Track }) {
  const p = usePalette();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const status = useAudioPlayerStatus(getPlayer());
  const duration = status.duration || track.duration;
  const progress = duration > 0 ? status.currentTime / duration : 0;

  return (
    <PressableScale scaleTo={0.98} onPress={() => router.push('/player')}>
      <HoloFrame>
        <View className="p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-neon-magenta" />
              <Hud>{isPlaying ? 'Transmitting now' : 'Paused in orbit'}</Hud>
            </View>
            <Hud>{track.source === 'online' ? 'Online' : 'On device'}</Hud>
          </View>
          <View className="flex-row items-center gap-4">
            <Artwork seed={track.id} uri={track.artwork} size={84} radius={20} />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-lg font-extrabold text-ink dark:text-white">
                {track.title}
              </Text>
              <Text numberOfLines={1} className="mb-2 text-[13px] text-ink/55 dark:text-white/50">
                {track.artist}
              </Text>
              <Waveform seed={track.id} progress={progress} height={26} bars={34} baseColor={p.faint} />
            </View>
            <Pressable
              onPress={() => {
                tap('medium');
                usePlayerStore.getState().toggle();
              }}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              className="h-12 w-12 items-center justify-center rounded-full bg-ink dark:bg-white">
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={p.bg} style={{ marginLeft: isPlaying ? 0 : 2 }} />
            </Pressable>
          </View>
        </View>
      </HoloFrame>
    </PressableScale>
  );
}

function IdleHero({ trending }: { trending: Track[] | null }) {
  const p = usePalette();
  return (
    <HoloFrame>
      <View className="overflow-hidden p-5">
        <Glow color={p.accent2} size={260} style={{ right: -90, top: -110 }} intensity={1.6} />
        <Hud>Signal idle</Hud>
        <Text className="mb-1 mt-2 text-[26px] font-extrabold leading-8 text-ink dark:text-white">
          Tune into{'\n'}something new.
        </Text>
        <Text className="mb-5 text-[14px] text-ink/55 dark:text-white/50">
          Full-length tracks from independent artists, streaming free.
        </Text>
        <View className="flex-row">
          <GlowButton
            label="Play trending"
            icon="flash"
            onPress={() => trending?.length && usePlayerStore.getState().playQueue(trending, 0)}
          />
        </View>
      </View>
    </HoloFrame>
  );
}

export default function Home() {
  const p = usePalette();
  const now = useClock();
  const current = useCurrentTrack();
  const scheme = p.scheme;
  const setTheme = useSettingsStore((s) => s.setTheme);
  const catalog = useLibraryStore((s) => s.catalog);
  const recentIds = useLibraryStore((s) => s.recent);
  const likedCount = useLibraryStore((s) => s.liked.length);
  const playlistCount = useLibraryStore((s) => s.playlists.length);
  const importedCount = useLibraryStore((s) => s.imported.length);
  const deviceCount = useLocalStore((s) => s.device.length);
  const [trending, setTrending] = useState<Track[] | null>(null);

  useEffect(() => {
    fetchTrending(undefined, 16)
      .then(setTrending)
      .catch(() => setTrending([]));
  }, []);

  const recent = resolveTracks(recentIds, catalog).slice(0, 12);
  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: DOCK_SPACE }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start justify-between px-5 pb-5 pt-2">
          <View>
            <Hud>Muzica // {clock}</Hud>
            <Text className="mt-1 text-[34px] font-extrabold tracking-tight text-ink dark:text-white">
              {greeting(now)}
            </Text>
          </View>
          <View className="flex-row gap-1 pt-1">
            <IconButton
              filled
              icon={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
              label="Toggle light and dark mode"
              onPress={() => setTheme(scheme === 'dark' ? 'light' : 'dark')}
            />
            <IconButton filled icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(500)} className="px-5">
          {current ? <NowPlayingHero track={current} /> : <IdleHero trending={trending} />}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="mt-4 gap-3 px-5">
          <View className="flex-row gap-3">
            <Tile icon="heart" label="Liked" value={`${likedCount}`} seed="liked-tile" onPress={() => router.push('/playlist/liked')} />
            <Tile
              icon="phone-portrait"
              label="On device"
              value={`${deviceCount + importedCount}`}
              seed="device-tile1"
              onPress={() => router.navigate('/local')}
            />
          </View>
          <View className="flex-row gap-3">
            <Tile icon="cloud" label="Explore" value="Live" seed="cloud-tile" onPress={() => router.navigate('/online')} />
            <Tile icon="albums" label="Playlists" value={`${playlistCount}`} seed="lists-tile2" onPress={() => router.navigate('/library')} />
          </View>
        </Animated.View>

        {recent.length ? (
          <Animated.View entering={FadeInDown.delay(180).duration(500)}>
            <SectionHeader title="Jump back in" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {recent.map((t, i) => (
                <TrackCard key={t.id} track={t} onPress={() => usePlayerStore.getState().playQueue(recent, i)} />
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(260).duration(500)}>
          <SectionHeader title="Trending this week" action="See all" onAction={() => router.navigate('/online')} />
          {trending === null ? (
            <ActivityIndicator color={p.accent} style={{ marginVertical: 40 }} />
          ) : trending.length === 0 ? (
            <Text className="px-5 text-[14px] text-ink/50 dark:text-white/45">
              {"Couldn't reach the network. Your local music still works."}
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {trending.map((t, i) => (
                <TrackCard key={t.id} track={t} onPress={() => usePlayerStore.getState().playQueue(trending, i)} />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}
