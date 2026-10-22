# Muzica

A music player for Android and iOS that plays your **local files** and **free, full-length online music**, with an animated "orbit" player, light and dark themes, and smooth animations throughout.

Built with Expo SDK 57, React Native, TypeScript, NativeWind and Zustand.

## Features

- **Orbit player**: the cover spins like a vinyl record inside rotating rings with coloured dots circling them. The disc pulses while music plays and freezes in place when you pause. Pull the top half down to close the player.
- **Waveform progress bar**: every track gets its own waveform, which fills with a cyan → violet → magenta gradient as it plays. Tap or drag anywhere on it to seek.
- **Floating dock**: a capsule tab bar with a highlight that glides between tabs, and a mini player above it. Swipe the mini player left or right to skip tracks.
- **Local music**: scans the device's audio files on Android. On every platform, tap **+** to import audio files; they're copied into app storage so they keep working offline.
- **Online music**: trending tracks, genre filters and search, powered by the free [Audius](https://audius.co) API (no key required).
- **Library**: liked songs, playlists you create, and listening history.
- **Queue**: play next, add to queue, jump to or remove tracks, shuffle, and repeat (off / all / one).
- **Light, dark and system themes**: switch with the sun/moon button on Home, or under Settings → Appearance.
- **Background playback** with lock-screen controls.
- **Remembered between launches**: your queue, likes, playlists, history and settings.

## Getting started

Requirements: Node 20+ and either Android Studio (for an emulator) or a physical device.

```bash
npm install
npx expo run:android      # build and run a development build
npx expo run:ios          # macOS only
```

You can also build in the cloud with `npx eas-cli@latest build --profile development`.

> **Expo Go isn't supported.** The app needs native configuration for background audio and media-library permissions, so it must run as a [development build](https://docs.expo.dev/develop/development-builds/introduction/).

After the first build, start the dev server with:

```bash
npx expo start
```

## Platform notes

| | Android | iOS |
| --- | --- | --- |
| Device library scan | ✅ (asks for audio permission) | ❌ Apple keeps the Music library private |
| Import audio files | ✅ | ✅ (from the Files app) |
| Online streaming | ✅ | ✅ |
| Background playback and lock screen | ✅ | ✅ |

## Project structure

```
src/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # root stack, theme, global sheets, audio engine
│   ├── (tabs)/             # Home, Local, Online, Library + custom dock
│   ├── player.tsx          # full-screen orbit player
│   ├── playlist/[id].tsx   # playlist and Liked songs detail
│   └── settings.tsx
├── components/             # UI: orbit-disc, waveform, dock-bar, mini-player, sheets…
├── store/                  # Zustand stores (player, library, local, settings, ui)
├── lib/                    # audio player, Audius API, local file scanning, helpers
├── hooks/                  # usePalette (theme colours for non-NativeWind styling)
└── theme/palette.ts        # light/dark palettes and spectrum colours
```

### How playback works

- `lib/audio.ts` holds a single app-wide `expo-audio` player.
- `store/player.ts` owns the queue, shuffle and repeat. Actions request a load by incrementing `loadKey`.
- `components/player-engine.tsx` is a component that renders nothing. It loads tracks when `loadKey` changes, advances when a track ends, and mirrors the play and buffering state into the store. List rows read that state from the store, so they don't re-render on every progress tick.

### Styling

NativeWind (Tailwind) classes with `dark:` variants handle most styling. Colours that have to be passed as JavaScript values, such as gradients and icon colours, come from `usePalette()`. The theme is set with NativeWind's `colorScheme.set()` and saved in `store/settings.ts`.

## Scripts

```bash
npm run start        # Expo dev server
npm run android      # open on Android
npm run ios          # open on iOS
npm run lint         # ESLint (includes React Compiler rules)
npx tsc --noEmit     # type-check
```

## Credits

Online music is streamed from [Audius](https://audius.co), an open music network. All tracks belong to their respective artists.
