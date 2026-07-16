export type AppEnvironmentLabel = 'Development' | 'TestFlight' | 'Production';

export type AppVersionInfo = {
  version: string;
  buildNumber: string;
  nativeAppVersion: string;
};

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function isDevelopmentRuntime(): boolean {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }
  return process.env.NODE_ENV === 'development';
}

/** Toujours true — le bouton Mode développeur est visible dans tous les builds (bêta). */
export function isDeveloperModeAvailable(): boolean {
  return true;
}

export function getAppEnvironment(): AppEnvironmentLabel {
  if (isDevelopmentRuntime()) {
    return 'Development';
  }

  const env = readEnv('EXPO_PUBLIC_APP_ENV', 'NEXT_PUBLIC_APP_ENV')?.toLowerCase();

  if (env === 'testflight' || env === 'preview' || env === 'internal') {
    return 'TestFlight';
  }

  return 'Production';
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: readEnv('EXPO_PUBLIC_APP_VERSION', 'NEXT_PUBLIC_APP_VERSION') ?? '1.0.0',
    buildNumber: readEnv('EXPO_PUBLIC_BUILD_NUMBER', 'NEXT_PUBLIC_BUILD_ID') ?? '—',
    nativeAppVersion: readEnv('EXPO_PUBLIC_NATIVE_APP_VERSION') ?? '—',
  };
}
