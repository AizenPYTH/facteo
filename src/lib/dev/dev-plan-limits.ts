import type { PlanLimitCheck, PlanResource, SubscriptionUsage } from '@/types/subscription';

import { getIsDeveloperModeEnabled } from './dev-state';

export function isDeveloperModeActive(): boolean {
  return getIsDeveloperModeEnabled();
}

export function getDevPlanLimitCheck(
  resource: PlanResource,
  realUsage: SubscriptionUsage,
): PlanLimitCheck | null {
  if (!isDeveloperModeActive()) {
    return null;
  }

  return {
    allowed: true,
    resource,
    current: getUsageCount(realUsage, resource),
    limit: null,
    planId: 'premium',
    planName: 'Mode développeur',
    status: 'active',
    isPremium: true,
  };
}

function getUsageCount(usage: SubscriptionUsage, resource: PlanResource): number {
  switch (resource) {
    case 'clients':
      return usage.clients;
    case 'quotes':
      return usage.quotes;
    case 'invoices':
      return usage.invoices;
    default:
      return 0;
  }
}
