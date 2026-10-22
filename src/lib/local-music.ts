import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { requestPermissionsAsync } from 'expo-media-library';
import { getAssetsAsync, MediaType, SortBy } from 'expo-media-library/legacy';
import { Platform } from 'react-native';

import { parseFilename, uid } from '@/lib/format';
import type { Track } from '@/types';

export async function requestAudioPermission() {
  if (Platform.OS === 'web') return false;
  const res = await requestPermissionsAsync(false, ['audio']);
  return res.granted;
}

/** Reads every audio file the OS media index knows about (Android; iOS exposes none here). */
export async function scanDeviceAudio(max = 3000): Promise<Track[]> {
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
