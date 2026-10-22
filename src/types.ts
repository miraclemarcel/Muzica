export type TrackSource = 'local' | 'online';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  uri: string;
  /** Seconds. 0 when unknown (e.g. freshly imported files). */
  duration: number;
  source: TrackSource;
  genre?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type ThemeMode = 'system' | 'light' | 'dark';
