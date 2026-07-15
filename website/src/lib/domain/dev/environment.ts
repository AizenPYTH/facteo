import { IS_DEV, readPublicEnv } from '@/lib/runtime';

export type AppEnvironmentLabel = 'Development' | 'Staging' | 'Production';

export type AppVersionInfo = {
  version: string;
  buildNumber: string;
  nativeAppVersion: string;
};

/** Visible en développement et sur les previews Vercel. */
export function isDeveloperModeAvailable(): boolean {
  return IS_DEV || readPublicEnv('NEXT_PUBLIC_APP_ENV') === 'preview';
}

export function getAppEnvironment(): AppEnvironmentLabel {
  if (IS_DEV) {
    return 'Development';
  }

  const env = readPublicEnv('NEXT_PUBLIC_APP_ENV')?.toLowerCase();

  if (env === 'preview' || env === 'staging' || env === 'test') {
    return 'Staging';
  }

  return 'Production';
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: readPublicEnv('NEXT_PUBLIC_APP_VERSION') ?? '1.0.0',
    buildNumber: readPublicEnv('NEXT_PUBLIC_BUILD_ID', 'VERCEL_GIT_COMMIT_SHA') ?? '—',
    nativeAppVersion: '—',
  };
}
