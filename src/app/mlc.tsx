import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

export default function MobileLoginDeepLink() {
  const { c, s } = useLocalSearchParams<{ c?: string; s?: string }>();
  const challengeId = typeof c === 'string' ? c : '';
  const secret = typeof s === 'string' ? s : '';
  const href = (
    challengeId && secret ? `/login-qr?c=${encodeURIComponent(challengeId)}&s=${encodeURIComponent(secret)}` : '/login-qr'
  ) as Href;

  return <Redirect href={href} />;
}
