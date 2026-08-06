import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';

import {
  confirmSubscriptionCheckout,
  parseSubscriptionReturnUrl,
} from '@/lib/stripe/subscription-checkout';
import { useSubscription } from '@/hooks/use-subscription';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';
import { useToast } from '@/providers/toast-provider';

export function usePremiumCheckoutReturn() {
  const params = useLocalSearchParams<{
    subscription?: string | string[];
    session_id?: string | string[];
  }>();
  const { refresh } = useSubscription();
  const { showError, showSuccess } = useToast();

  const subscription = readParam(params.subscription);
  const sessionId = readParam(params.session_id);

  useEffect(() => {
    if (subscription === 'canceled') {
      showError('Paiement annulé.');
      return;
    }

    if (subscription !== 'success' || !sessionId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const result = await confirmSubscriptionCheckout(sessionId);

        if (cancelled) {
          return;
        }

        await refresh();
        showSuccess(`Offre ${getEffectivePlanDisplayName(result.planId)} activée.`);
      } catch (error) {
        if (!cancelled) {
          showError(readErrorMessage(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subscription, sessionId, refresh, showError, showSuccess]);
}

export function parsePremiumDeepLink(url: string) {
  return parseSubscriptionReturnUrl(url);
}

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Impossible de confirmer l’abonnement.';
}
