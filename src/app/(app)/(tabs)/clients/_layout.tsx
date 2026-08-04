import { Stack } from 'expo-router';

export default function ClientsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
    </Stack>
  );
}
