import type { Track } from '@/types';

export function formatTime(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m % 60).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

export function formatTotal(tracks: Track[]) {
  const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const mins = Math.round(total / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
}

/** FNV-1a — stable hash used to derive visuals (waveforms, cover gradients) from ids. */
export function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG */
export function seededRandom(seed: number) {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "01 - Artist - Song_name.mp3" → { artist: 'Artist', title: 'Song name' } */
export function parseFilename(name: string) {
  let base = name.replace(/\.[^.]+$/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  base = base.replace(/^\d{1,3}\s*[-.)]\s*/, '');
  const m = base.match(/^(.+?)\s+-\s+(.+)$/);
  if (m) return { artist: m[1].trim(), title: m[2].trim() };
  return { artist: 'Unknown artist', title: base || 'Untitled' };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function shuffleArray<T>(items: T[]) {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
