'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronRight, ShoppingBag } from 'lucide-react';

import { Badge, LoadingState, Panel } from '@/components/app/ui';
import { EBAY_PROVIDER, fetchEbayIntegration } from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import { useTenant } from '@/providers/company-provider';
import type { IntegrationStatus } from '@/types/integrations';

const STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: 'Connecté',
  disconnected: 'Non connecté',
  reauth_required: 'Reconnexion requise',
  error: 'Erreur',
};

const STATUS_VARIANTS: Record<IntegrationStatus, 'success' | 'warning' | 'danger' | 'default'> = {
  connected: 'success',
  disconnected: 'default',
  reauth_required: 'warning',
  error: 'danger',
};

/** Paramètres → Intégrations : liste des connexions e-commerce et leur état réel. */
export default function IntegrationsSettingsPage() {
  const { scope } = useTenant();
  const companyId = scope?.companyId ?? null;

  const query = useQuery({
    queryKey: integrationsQueryKeys.status(companyId ?? '', EBAY_PROVIDER),
    queryFn: () => fetchEbayIntegration(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 15_000,
  });

  const status: IntegrationStatus = query.data?.status ?? 'disconnected';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 min-[900px]:p-6">
      <Panel title="E-commerce">
        <p className="mb-4 text-[13.5px] leading-relaxed text-app-muted">
          Importez vos commandes depuis une place de marché pour préparer vos factures INVEQ. Une
          commande importée ne crée jamais de facture automatiquement.
        </p>

        {query.isLoading ? (
          <LoadingState />
        ) : (
          <Link
            className="flex items-center justify-between gap-3 rounded-[10px] border border-app-border px-4 py-3 transition hover:bg-app-hover"
            href="/app/settings/integrations/ebay">
            <span className="flex items-center gap-3">
              <ShoppingBag className="h-[18px] w-[18px] text-app-muted-2" />
              <span className="text-[14px] font-medium text-app-text">eBay</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
              <ChevronRight className="h-4 w-4 text-app-muted-2" />
            </span>
          </Link>
        )}

        {query.error ? (
          <p className="mt-3 text-[13px] text-red-600">
            {query.error instanceof Error ? query.error.message : 'Chargement impossible.'}
          </p>
        ) : null}
      </Panel>

      <Panel title="À propos">
        <p className="text-[13.5px] leading-relaxed text-app-muted">
          INVEQ n’accède qu’en lecture à vos commandes. Aucune modification n’est effectuée sur
          votre compte de place de marché.
        </p>
      </Panel>
    </div>
  );
}
