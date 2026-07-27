import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';

import { useClient } from '@/hooks/use-clients';
import {
  parseClientIdParam,
  parseReplayParam,
} from '@/lib/navigation/new-document';
import { useToast } from '@/providers/toast-provider';
import { getClientDisplayName } from '@/types/client';

export type WizardClientPrefill = {
  clientId: string;
  clientName: string;
};

/**
 * Reads `clientId` (or legacy `client`) + `replay` from the route.
 * When a client is prefilled, create wizards should start at step 2.
 * When `replay=1`, wizards auto-apply "Comme la dernière fois".
 */
export function useWizardClientPrefill() {
  const { showError } = useToast();
  const params = useLocalSearchParams<{
    clientId?: string | string[];
    client?: string | string[];
    replay?: string | string[];
  }>();
  const requestedClientId = parseClientIdParam(params.clientId ?? params.client);
  const replayRequested = parseReplayParam(params.replay);
  const { data: client, isFetched, isLoading } = useClient(requestedClientId ?? '');
  const missingWarned = useRef(false);

  useEffect(() => {
    if (!requestedClientId || !isFetched || client || missingWarned.current) {
      return;
    }

    missingWarned.current = true;
    showError('Client introuvable — sélectionnez un client.');
  }, [client, isFetched, requestedClientId, showError]);

  const prefill = useMemo<WizardClientPrefill | null>(() => {
    if (!client) {
      return null;
    }

    return {
      clientId: client.id,
      clientName: getClientDisplayName(client),
    };
  }, [client]);

  return {
    requestedClientId,
    /** True while a requested client is still loading. */
    isLoading: Boolean(requestedClientId) && !isFetched && isLoading,
    /** Ready when there is no param, or the client query has settled. */
    isReady: !requestedClientId || isFetched,
    prefill,
    /** Skip client step when context already provides one client. */
    initialStep: prefill ? 2 : 1,
    /**
     * Auto-replay last document lines once memory loads.
     * Only valid when a client is prefilled.
     */
    autoReplay: Boolean(prefill) && replayRequested,
  };
}
