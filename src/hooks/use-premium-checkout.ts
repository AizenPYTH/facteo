import { useState } from 'react';

import { openManageSubscriptionOnWeb } from '@/lib/subscription/open-manage-subscription';

/**
 * Sur iOS, pas de Stripe Checkout in-app (guideline App Store).
 * Les CTAs ouvrent la page tarifs web.
 */
export function usePremiumCheckout() {
  const [isPending, setIsPending] = useState(false);

  async function startCheckout(): Promise<boolean> {
    setIsPending(true);
    try {
      await openManageSubscriptionOnWeb();
      return true;
    } finally {
      setIsPending(false);
    }
  }

  return {
    isConfigured: true,
    startCheckout,
    subscribe: { isPending, mutateAsync: startCheckout },
    isSubscriptionCheckoutCanceledError: () => false,
  };
}
