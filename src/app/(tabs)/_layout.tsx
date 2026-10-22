import { Tabs } from 'expo-router/js-tabs';

import { DockBar } from '@/components/dock-bar';
import { usePalette } from '@/hooks/use-palette';

export default function TabsLayout() {
  const p = usePalette();
  return (
    <Tabs
      tabBar={(props) => <DockBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: p.bg },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="local" options={{ title: 'Local' }} />
      <Tabs.Screen name="online" options={{ title: 'Online' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
    </Tabs>
  );
}
