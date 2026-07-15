/** Runtime Next.js — remplace `__DEV__` et les helpers Expo. */
export const IS_DEV = process.env.NODE_ENV === 'development';

export function readPublicEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}
