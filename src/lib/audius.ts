import type { Track } from '@/types';

// Audius is an open music network with a free public API: full-length streams, no key needed.
const API = 'https://api.audius.co/v1';
const APP = 'muzica';

interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  genre?: string;
  is_streamable?: boolean;
  artwork?: { '150x150'?: string; '480x480'?: string; '1000x1000'?: string } | null;
  user: { name: string; handle: string };
}

export const GENRES = [
  'All',
  'Electronic',
  'Hip-Hop/Rap',
  'Lo-Fi',
  'Afrobeats',
  'R&B/Soul',
  'Pop',
  'House',
  'Techno',
  'Ambient',
  'Alternative',
  'Jazz',
] as const;

function toTrack(t: AudiusTrack): Track {
  return {
    id: `au:${t.id}`,
    title: t.title,
    artist: t.user?.name ?? 'Unknown artist',
    artwork: t.artwork?.['480x480'] ?? t.artwork?.['1000x1000'] ?? t.artwork?.['150x150'],
    uri: `${API}/tracks/${t.id}/stream?app_name=${APP}`,
    duration: t.duration ?? 0,
    source: 'online',
    genre: t.genre,
  };
}

async function get(path: string, params: Record<string, string | number | undefined>) {
  const qs = Object.entries({ ...params, app_name: APP })
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  const res = await fetch(`${API}${path}?${qs}`);
  if (!res.ok) throw new Error(`Audius responded ${res.status}`);
  const json = (await res.json()) as { data?: AudiusTrack[] };
  return (json.data ?? []).filter((t) => t.is_streamable !== false).map(toTrack);
}

export function fetchTrending(genre?: string, limit = 40) {
  return get('/tracks/trending', {
    genre: genre && genre !== 'All' ? genre : undefined,
    time: 'week',
    limit,
  });
}

export function searchTracks(query: string) {
  return get('/tracks/search', { query, limit: 40 });
}
