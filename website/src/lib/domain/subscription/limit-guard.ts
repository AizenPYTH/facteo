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
