export type AppVersionInfo = {
  version: string;
  buildNumber: string;
  nativeAppVersion: string;
};

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: readEnv('EXPO_PUBLIC_APP_VERSION', 'NEXT_PUBLIC_APP_VERSION') ?? '1.0.0',
    buildNumber: readEnv('EXPO_PUBLIC_BUILD_NUMBER', 'NEXT_PUBLIC_BUILD_ID') ?? '—',
    nativeAppVersion: readEnv('EXPO_PUBLIC_NATIVE_APP_VERSION') ?? '—',
  };
}
