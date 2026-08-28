import { assertPlanLimit, isPlanLimitError } from '@/lib/supabase/subscriptions';
import type { PlanResource } from '@/types/subscription';

export async function enforcePlanLimit(
  resource: PlanResource,
  onLimitReached: () => void,
): Promise<void> {
  try {
    await assertPlanLimit(resource);
  } catch (error) {
    if (isPlanLimitError(error)) {
      onLimitReached();
    }

    throw error;
  }
}

/** Catch DB-enforced PLAN_LIMIT_REACHED after a mutation (defense in depth). */
export async function withPlanLimitUi<T>(
  onLimitReached: () => void,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isPlanLimitError(error)) {
      onLimitReached();
    }
    throw error;
  }
}
