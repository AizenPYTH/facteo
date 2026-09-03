import { Stack } from 'expo-router';

export default function AuthDeepLinkLayout() {
  return <Stack screenOptions={{ animation: 'fade', headerShown: false }} />;
}
