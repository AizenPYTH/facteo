import { useQuery } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { getSuperPdpConnection } from '@/lib/superpdp/api';

/**
 * État réel du raccordement à la plateforme de dématérialisation.
 *
 * L'action « Envoyer en facture électronique » ne doit être proposée que si
 * l'entreprise est effectivement raccordée et autorisée à émettre — sinon
 * l'application laisserait croire qu'INVEQ est connecté à un réseau officiel
 * alors qu'elle ne l'est pas.
 */
export type ElectronicInvoicingState = {
  connected: boolean;
  canEmit: boolean;
  statusLabel: string;
  lastError: string | null;
};

const DISCONNECTED: ElectronicInvoicingState = {
  connected: false,
  canEmit: false,
  statusLabel: 'Non raccordé',
  lastError: null,
};

export function useElectronicInvoicing() {
  const { companyId } = useTenant();

  return useQuery<ElectronicInvoicingState>({
    queryKey: ['superpdp', 'connection', companyId ?? 'anonymous'],
    enabled: Boolean(companyId),
    // L'état change rarement et l'appel traverse une Edge Function : on évite
    // de le refaire à chaque ouverture d'écran.
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      if (!companyId) {
        return DISCONNECTED;
      }

      try {
        const result = await getSuperPdpConnection(companyId, 'status');

        if (!result.connected || !result.connection) {
          return DISCONNECTED;
        }

        const { connection } = result;

        return {
          connected: true,
          canEmit: Boolean(connection.emission_enabled) && connection.status === 'connected',
          statusLabel:
            connection.status === 'needs_review'
              ? 'Vérification en cours'
              : connection.status === 'failed'
                ? 'Connexion en échec'
                : connection.emission_enabled
                  ? 'Raccordé · émission active'
                  : 'Raccordé · émission non activée',
          lastError: connection.last_error,
        };
      } catch {
        // Une panne de lecture ne doit pas faire croire à un raccordement.
        return DISCONNECTED;
      }
    },
  });
}
