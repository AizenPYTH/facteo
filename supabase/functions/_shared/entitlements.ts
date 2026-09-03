import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { resolveCanonicalPlanId, type CanonicalPlanId } from './subscription-sync.ts';

export type PlanFeatureKey =
  | 'custom_logo'
  | 'company_signature'
  | 'client_signature'
  | 'pdf_templates'
  | 'stripe_payments'
  | 'ai_assistant'
  | 'advanced_stats'
  | 'siren_search';

const DEFAULT_FEATURES: Record<CanonicalPlanId, Record<PlanFeatureKey, boolean>> = {
  micro: {
    custom_logo: false,
    company_signature: false,
    client_signature: false,
    pdf_templates: false,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: false,
  },
  basique: {
    custom_logo: true,
    company_signature: true,
    client_signature: false,
    pdf_templates: true,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: true,
  },
  standard: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: true,
  },
  pro: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: true,
  },
  max: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: true,
    ai_assistant: true,
    advanced_stats: true,
    siren_search: true,
  },
};

export async function assertUserHasFeature(
  client: SupabaseClient,
  userId: string,
  feature: PlanFeatureKey,
): Promise<void> {
  const { data: subscription, error } = await client
    .from('subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const planId = resolveCanonicalPlanId(subscription?.plan);
  const { data: planRow } = await client
    .from('subscription_plans')
    .select('features')
    .eq('id', planId)
    .maybeSingle();

  const features = (planRow?.features ?? {}) as Partial<Record<PlanFeatureKey, boolean>>;
  const allowed =
    feature in features ? Boolean(features[feature]) : DEFAULT_FEATURES[planId][feature];

  if (!allowed) {
    throw new Error(`FONCTIONNALITE_REQUISE:${feature}`);
  }
}
