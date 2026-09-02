export type PaidPlanId = 'basique' | 'standard' | 'pro';
export type CatalogPlanId = 'micro' | PaidPlanId;
export type SubscriptionPlanId = CatalogPlanId | 'free' | 'premium';

export const PAID_PLAN_IDS: PaidPlanId[] = ['basique', 'standard', 'pro'];

const PRICE_ENV_KEYS: Record<PaidPlanId, string[]> = {
  basique: ['STRIPE_BASIQUE_PRICE_ID'],
  standard: ['STRIPE_STANDARD_PRICE_ID'],
  pro: ['STRIPE_PRO_PRICE_ID', 'STRIPE_PREMIUM_PRICE_ID'],
};

export function isPaidPlanId(planId: string): planId is PaidPlanId {
  return PAID_PLAN_IDS.includes(planId as PaidPlanId);
}

export function normalizeRequestedPlanId(raw: string | undefined | null): PaidPlanId | null {
  const value = (raw ?? '').trim().toLowerCase();
  if (value === 'premium') return 'pro';
  if (isPaidPlanId(value)) return value;
  return null;
}

export function resolveStripePriceIdFromEnv(
  planId: PaidPlanId,
  readEnv: (key: string) => string | undefined = (key) => Deno.env.get(key),
): string | null {
  for (const key of PRICE_ENV_KEYS[planId]) {
    const value = readEnv(key)?.trim();
    if (value) return value;
  }
  return null;
}

export function resolveStripePriceId(
  planStripePriceId: string | null | undefined,
  planId?: string | null,
  readEnv: (key: string) => string | undefined = (key) => Deno.env.get(key),
): string | null {
  const fromPlan = planStripePriceId?.trim();
  if (fromPlan) {
    return fromPlan;
  }

  const normalized = normalizeRequestedPlanId(planId);
  if (normalized) {
    return resolveStripePriceIdFromEnv(normalized, readEnv);
  }

  return null;
}

export function resolvePlanId(
  metadataPlanId?: string | null,
  status?: string | null,
): CatalogPlanId {
  const raw = (metadataPlanId ?? '').trim().toLowerCase();

  if (raw === 'micro' || raw === 'free') return 'micro';
  if (raw === 'basique') return 'basique';
  if (raw === 'standard' || raw === 'starter') return 'standard';
  if (raw === 'pro' || raw === 'premium' || raw === 'enterprise') return 'pro';

  const paidStatus = status === 'active' || status === 'trialing';
  return paidStatus ? 'pro' : 'micro';
}

export function isPaidSubscriptionStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}
