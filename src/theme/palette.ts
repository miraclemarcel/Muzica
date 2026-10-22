export const spectrum = ['#3DF5FF', '#8B6CFF', '#FF3DCB'] as const;

export const coverGradients: readonly (readonly [string, string])[] = [
  ['#3DF5FF', '#8B6CFF'],
  ['#8B6CFF', '#FF3DCB'],
  ['#FF3DCB', '#FF9F3D'],
  ['#3DFFB0', '#3DF5FF'],
  ['#5B3DF5', '#00B8D9'],
  ['#FF5E7E', '#8B6CFF'],
  ['#C6FF3D', '#3DFFB0'],
];

export const palettes = {
  dark: {
    scheme: 'dark' as const,
    bg: '#05060A',
    elevated: '#0D0F18',
    surface: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.09)',
    text: '#F5F7FF',
    muted: 'rgba(245,247,255,0.55)',
    faint: 'rgba(245,247,255,0.16)',
    accent: '#3DF5FF',
    accent2: '#8B6CFF',
    accent3: '#FF3DCB',
    dockBg: 'rgba(13,15,24,0.86)',
  },
  light: {
    scheme: 'light' as const,
    bg: '#F3F4FA',
    elevated: '#FFFFFF',
    surface: 'rgba(11,13,23,0.04)',
    border: 'rgba(11,13,23,0.08)',
    text: '#0B0D17',
    muted: 'rgba(11,13,23,0.55)',
    faint: 'rgba(11,13,23,0.13)',
    accent: '#0090B0',
    accent2: '#5B3DF5',
    accent3: '#D6007F',
    dockBg: 'rgba(255,255,255,0.9)',
  },
};

export type Palette = (typeof palettes)['dark'] | (typeof palettes)['light'];

/** Interpolates across the cyan → violet → magenta spectrum, t in [0,1]. */
export function spectrumAt(t: number) {
  const stops = spectrum.map(hexToRgb);
  const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const [a, b] = [stops[i], stops[i + 1]];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
