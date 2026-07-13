import { useCallback } from 'react';

import { useSubscriptionContext } from '@/providers/subscription-provider';
import { assertPlanLimit, isPlanLimitError } from '@/lib/supabase/subscriptions';
import type { PlanResource } from '@/types/subscription';

export function usePlanLimitGuard() {
  const { showLimitModal } = useSubscriptionContext();

  const guardResource = useCallback(
    async (resource: PlanResource): Promise<boolean> => {
      try {
        await assertPlanLimit(resource);
        return true;
      } catch (error) {
        if (isPlanLimitError(error)) {
          showLimitModal();
          return false;
        }

        throw error;
      }
    },
    [showLimitModal],
  );

  return {
    guardResource,
  };
}
