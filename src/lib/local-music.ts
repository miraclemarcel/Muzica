import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { IS_EXPO_GO } from '@/lib/env';
import { parseFilename, uid } from '@/lib/format';
import type { Track } from '@/types';

export class MediaLibraryUnavailableError extends Error {}

/**
 * Loaded lazily: the native module only exists in development/production builds,
 * so a missing module must disable device scanning rather than crash at import.
 */
async function loadMediaLibrary() {
  // Expo Go can't be granted full media-library access on Android.
  if (IS_EXPO_GO) throw new MediaLibraryUnavailableError('Expo Go');
  try {
    return await import('expo-media-library/legacy');
  } catch (e) {
    throw new MediaLibraryUnavailableError(String(e));
  }
}

export type AudioPermission = { granted: boolean; canAskAgain: boolean };

/** Checks access without prompting. */
export async function getAudioPermission(): Promise<AudioPermission> {
  const { getPermissionsAsync } = await loadMediaLibrary();
  const res = await getPermissionsAsync(false, ['audio']);
  return { granted: res.granted, canAskAgain: res.canAskAgain };
}

/** Shows the system prompt (READ_MEDIA_AUDIO on Android 13+). */
export async function requestAudioPermission(): Promise<AudioPermission> {
  const { requestPermissionsAsync } = await loadMediaLibrary();
  const res = await requestPermissionsAsync(false, ['audio']);
  return { granted: res.granted, canAskAgain: res.canAskAgain };
}

/** Reads every audio file the OS media index knows about (Android; iOS exposes none here). */
export async function scanDeviceAudio(max = 3000): Promise<Track[]> {
  const { getAssetsAsync, MediaType, SortBy } = await loadMediaLibrary();
  const out: Track[] = [];
  let after: string | undefined;
  while (out.length < max) {
    const page = await getAssetsAsync({
      mediaType: MediaType.audio,
      first: 250,
      after,
      sortBy: [[SortBy.modificationTime, false]],
    });
    for (const a of page.assets) {
      // Skip ringtones, notification blips and voice-note fragments.
      if (a.duration > 0 && a.duration < 30) continue;
      const { artist, title } = parseFilename(a.filename);
      out.push({ id: `lo:${a.id}`, title, artist, uri: a.uri, duration: a.duration, source: 'local' });
    }
    if (!page.hasNextPage) break;
    after = page.endCursor;
  }
  return out;
}

/** Lets the user pick audio files and copies them into app storage so they survive cache purges. */
export async function importAudioFiles(): Promise<Track[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return [];

  let dir: Directory | null = null;
  if (Platform.OS !== 'web') {
    try {
      dir = new Directory(Paths.document, 'music');
      if (!dir.exists) dir.create();
    } catch {
      dir = null;
    }
  }

  return res.assets.map((asset) => {
    let uri = asset.uri;
    if (dir) {
      try {
        const dest = new File(dir, `${uid()}-${asset.name}`);
        new File(asset.uri).copy(dest);
        uri = dest.uri;
      } catch {
        // Fall back to the cached copy.
      }
    }
    const { artist, title } = parseFilename(asset.name);
    return { id: `im:${uid()}`, title, artist, uri, duration: 0, source: 'local' as const };
  });
}
