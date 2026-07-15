import Constants from 'expo-constants';

export type AppEnvironmentLabel = 'Development' | 'TestFlight' | 'Production';

export type AppVersionInfo = {
  version: string;
  buildNumber: string;
  nativeAppVersion: string;
};

/** Toujours true — le bouton Mode développeur est visible dans tous les builds (bêta). */
export function isDeveloperModeAvailable(): boolean {
  return true;
}

export function getAppEnvironment(): AppEnvironmentLabel {
  if (__DEV__) {
    return 'Development';
  }

  const env = process.env.EXPO_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (env === 'testflight' || env === 'preview' || env === 'internal') {
    return 'TestFlight';
  }

  return 'Production';
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: Constants.expoConfig?.version ?? '—',
    buildNumber: Constants.nativeBuildVersion ?? '—',
    nativeAppVersion: Constants.nativeAppVersion ?? '—',
  };
}
