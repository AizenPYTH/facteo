import { Redirect, type Href } from 'expo-router';

/**
 * Deep-link compatibility — register lives inside the login experience as a mode.
 */
export default function RegisterRedirect() {
  return <Redirect href={'/login?mode=register' as Href} />;
}
