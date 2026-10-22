import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Sheet } from '@/components/sheet';
import { GlowButton, Hud } from '@/components/ui';
import { usePalette } from '@/hooks/use-palette';
import { useLibraryStore } from '@/store/library';
import { useUIStore } from '@/store/ui';

export function CreatePlaylistDialog() {
  const p = usePalette();
  const dialog = useUIStore((s) => s.createDialog);
  const close = useUIStore((s) => s.closeCreate);
  const toast = useUIStore((s) => s.showToast);
  const [name, setName] = useState('');

  const submit = () => {
    const playlist = useLibraryStore.getState().createPlaylist(name, dialog?.track);
    toast(dialog?.track ? `Added to ${playlist.name}` : `Created ${playlist.name}`, 'checkmark-circle');
    setName('');
    close();
  };

  return (
    <Sheet open={!!dialog} onClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="px-5 pb-2">
          <Hud>New playlist</Hud>
          <Text className="mb-5 mt-1 text-2xl font-extrabold text-ink dark:text-white">Name your mix</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            placeholder="Late-night transmissions"
            placeholderTextColor={p.muted}
            selectionColor={p.accent}
            onSubmitEditing={submit}
            returnKeyType="done"
            className="mb-5 h-14 rounded-2xl border border-ink/10 bg-ink/5 px-4 text-[16px] font-semibold text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <GlowButton label="Create playlist" onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </Sheet>
  );
}
