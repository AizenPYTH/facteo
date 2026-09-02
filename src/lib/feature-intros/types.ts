export const FEATURE_INTRO_IDS = [
  'scanner',
  'invoice',
  'quote',
  'ai',
  'templates',
  'payments',
  'statistics',
] as const;

export type FeatureIntroId = (typeof FEATURE_INTRO_IDS)[number];

export type FeatureIntroStep = {
  key: string;
  headline: string;
  body: string;
  /** How long this step stays visible before auto-advance (ms). */
  durationMs: number;
};

export type FeatureIntroConfig = {
  id: FeatureIntroId;
  title: string;
  ctaLabel: string;
  steps: FeatureIntroStep[];
};

export function isFeatureIntroId(value: string): value is FeatureIntroId {
  return (FEATURE_INTRO_IDS as readonly string[]).includes(value);
}

export function featureIntroStorageKey(id: FeatureIntroId): string {
  return `feature_intro_${id}_seen`;
}
