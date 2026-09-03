import { supabase } from '@/lib/supabase';
import { fetchSubscriptionSnapshot } from '@/lib/supabase/subscriptions';
import { hasPlanFeature } from '@/lib/subscription/plans';
import { PremiumFeatureError, type PlanFeatureKey } from '@/types/subscription';

export async function assertCurrentUserFeature(feature: PlanFeatureKey): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Utilisateur non authentifié.');
  }

  const snapshot = await fetchSubscriptionSnapshot(data.user.id);
  if (!hasPlanFeature(snapshot.plan.features, feature, snapshot.subscription.effectivePlanId)) {
    throw new PremiumFeatureError(feature);
  }
}
