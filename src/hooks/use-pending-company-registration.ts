import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import {
  applyPendingCompanyRegistration,
  readPendingRegistration,
} from '@/lib/auth/pending-company-registration';
import { profilesQueryKeys } from '@/lib/supabase/query-keys';
import { companiesQueryKeys } from '@/lib/supabase/query-keys-companies';

/**
 * Première connexion après une inscription avec SIREN / SIRET : l'entreprise
 * créée reçoit son adresse, son SIRET et sa TVA, sans rien ressaisir.
 */
export function usePendingCompanyRegistration() {
  const { user } = useAuth();
  const { activeCompany } = useTenant();
  const queryClient = useQueryClient();
  const runningRef = useRef(false);
  const pending = Boolean(readPendingRegistration(user));
  const companyId = activeCompany?.id ?? null;

  useEffect(() => {
    if (!user || !pending || !companyId || runningRef.current) return;
    runningRef.current = true;
    void applyPendingCompanyRegistration(user, companyId)
      .then((changed) => {
        if (!changed) return;
        void queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
        void queryClient.invalidateQueries({ queryKey: profilesQueryKeys.all });
      })
      .catch(() => undefined)
      .finally(() => {
        runningRef.current = false;
      });
  }, [companyId, pending, queryClient, user]);
}
