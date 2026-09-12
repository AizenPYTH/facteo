'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AppDialog } from '@/components/app/app-dialog';
import { DangerButton, PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { Badge, LoadingState, Panel } from '@/components/app/ui';
import {
  EBAY_PROVIDER,
  disconnectEbay,
  fetchEbayIntegration,
  startEbayOAuth,
  syncEbayOrders,
} from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import { useTenant } from '@/providers/company-provider';
import type { IntegrationEnvironment, IntegrationStatus } from '@/types/integrations';

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

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleString('fr-FR') : '—';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-app-border-soft py-2 last:border-b-0">
      <span className="text-[13px] text-app-muted">{label}</span>
      <span className="text-right text-[13.5px] font-medium text-app-text">{value}</span>
    </div>
  );
}

function Notice({
  tone,
  title,
  children,
}: {
  tone: 'warning' | 'danger' | 'info';
  title?: string;
  children: React.ReactNode;
}) {
  const palette =
    tone === 'danger'
      ? 'border-l-red-500 bg-red-50 text-red-900'
      : tone === 'warning'
        ? 'border-l-amber-500 bg-amber-50 text-amber-900'
        : 'border-l-indigo-500 bg-indigo-50 text-indigo-900';
  return (
    <div className={`rounded-[10px] border-l-[3px] px-4 py-3 ${palette}`}>
      {title ? <p className="mb-1 text-[11.5px] font-bold uppercase tracking-wide">{title}</p> : null}
      <p className="text-[13.5px] leading-relaxed">{children}</p>
    </div>
  );
}

/**
 * `useSearchParams()` force un rendu client : Next.js exige une frontière
 * Suspense pour pouvoir prérendre la page.
 */
export default function EbayIntegrationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl p-4 min-[900px]:p-6">
          <LoadingState />
        </div>
      }>
      <EbayIntegrationContent />
    </Suspense>
  );
}

/** Paramètres → Intégrations → eBay : connexion OAuth et synchronisation manuelle. */
function EbayIntegrationContent() {
  const { scope } = useTenant();
  const companyId = scope?.companyId ?? null;
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: integrationsQueryKeys.status(companyId ?? '', EBAY_PROVIDER),
    queryFn: () => fetchEbayIntegration(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 15_000,
  });

  const integration = query.data ?? null;
  const connected = integration?.status === 'connected';
  const needsReauth =
    integration?.status === 'reauth_required' || integration?.refreshTokenExpired === true;

  // Retour du callback OAuth : dérivé de l'URL, sans effet de bord.
  const callbackOutcome = searchParams.get('ebay');
  const callbackReason = searchParams.get('reason');
  const callbackError =
    callbackOutcome && callbackOutcome !== 'connected'
      ? `La connexion eBay a échoué${callbackReason ? ` (${callbackReason})` : ''}.`
      : null;
  const callbackMessage = callbackOutcome === 'connected' ? 'Compte eBay connecté.' : null;

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: integrationsQueryKeys.all });
  }

  const connect = useMutation({
    mutationFn: (environment: IntegrationEnvironment) =>
      startEbayOAuth(companyId as string, {
        environment,
        redirectTo: `${window.location.origin}/app/settings/integrations/ebay`,
      }),
    onMutate: () => {
      setActionError(null);
      setActionMessage(null);
    },
    onSuccess: ({ authorizationUrl }) => {
      window.location.href = authorizationUrl;
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Connexion eBay impossible.'),
  });

  const sync = useMutation({
    mutationFn: () => syncEbayOrders(companyId as string),
    onMutate: () => {
      setActionError(null);
      setActionMessage(null);
    },
    onSuccess: (result) => {
      setActionMessage(
        result.fetched === 0
          ? 'Aucune nouvelle commande eBay depuis la dernière synchronisation.'
          : `${result.imported} commande(s) importée(s), ${result.updated} mise(s) à jour.`,
      );
      invalidate();
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Synchronisation impossible.');
      invalidate();
    },
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectEbay(companyId as string),
    onSuccess: () => {
      setConfirmDisconnect(false);
      setActionMessage('Compte eBay déconnecté.');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Déconnexion impossible.'),
  });

  const busy = connect.isPending || sync.isPending || disconnect.isPending;
  const error =
    actionError ??
    callbackError ??
    (query.error instanceof Error ? query.error.message : null);
  const message = actionMessage ?? callbackMessage;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 min-[900px]:p-6">
      <Panel
        action={
          <Badge variant={STATUS_VARIANTS[integration?.status ?? 'disconnected']}>
            {STATUS_LABELS[integration?.status ?? 'disconnected']}
          </Badge>
        }
        title="eBay">
        <p className="mb-4 text-[13.5px] leading-relaxed text-app-muted">
          INVEQ lit vos commandes eBay en lecture seule pour préparer vos factures. Aucune
          modification n’est faite sur votre compte eBay.
        </p>

        {query.isLoading ? <LoadingState /> : null}

        <div className="flex flex-col gap-3">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {message ? <Notice tone="info">{message}</Notice> : null}

          {needsReauth ? (
            <Notice title="Reconnexion nécessaire" tone="warning">
              L’autorisation eBay a expiré ou a été révoquée. Reconnectez le compte pour reprendre
              les synchronisations.
            </Notice>
          ) : null}

          {integration?.lastSyncError ? (
            <Notice title="Dernière erreur" tone="danger">
              {integration.lastSyncError}
            </Notice>
          ) : null}

          {connected && !needsReauth ? (
            <div className="mt-1">
              <Row
                label="Environnement"
                value={integration?.environment === 'sandbox' ? 'Sandbox (test)' : 'Production'}
              />
              <Row label="Vendeur eBay" value={integration?.externalAccountId ?? '—'} />
              <Row label="Connecté le" value={formatDateTime(integration?.connectedAt)} />
              <Row label="Dernière synchronisation" value={formatDateTime(integration?.lastSyncAt)} />
              <Row
                label="Autorisation valable jusqu’au"
                value={formatDateTime(integration?.refreshTokenExpiresAt)}
              />
              <Row label="Commandes importées" value={String(integration?.ordersImported ?? 0)} />
              <Row
                label="En attente de facturation"
                value={String(integration?.ordersPendingInvoice ?? 0)}
              />
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {connected && !needsReauth ? (
              <>
                <PrimaryButton disabled={busy} onClick={() => sync.mutate()}>
                  {sync.isPending ? 'Synchronisation…' : 'Synchroniser les commandes'}
                </PrimaryButton>
                <Link
                  className="inline-flex items-center rounded-[9px] border border-app-border bg-app-surface px-[14px] py-[9px] text-[13.5px] font-medium text-app-text-2 transition hover:bg-app-hover"
                  href="/app/settings/integrations/ebay/orders">
                  Voir les commandes eBay
                </Link>
                <DangerButton disabled={busy} onClick={() => setConfirmDisconnect(true)}>
                  Déconnecter
                </DangerButton>
              </>
            ) : (
              <>
                <PrimaryButton
                  disabled={busy || !companyId}
                  onClick={() => connect.mutate('production')}>
                  {needsReauth ? 'Reconnecter eBay' : 'Connecter mon compte eBay'}
                </PrimaryButton>
                <SecondaryButton onClick={() => setShowSandbox((value) => !value)}>
                  {showSandbox ? 'Masquer les options de test' : 'Options de test'}
                </SecondaryButton>
              </>
            )}
          </div>

          {showSandbox && !connected ? (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-[12.5px] leading-relaxed text-app-muted">
                L’environnement sandbox utilise des identifiants eBay distincts. Les commandes de
                test restent séparées de vos commandes réelles.
              </p>
              <SecondaryButton
                className="self-start"
                disabled={busy || !companyId}
                onClick={() => connect.mutate('sandbox')}>
                Connecter un compte eBay Sandbox
              </SecondaryButton>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel title="Ce qu’INVEQ récupère">
        <p className="mb-2 text-[13.5px] leading-relaxed text-app-muted">
          Numéro de commande, dates, statuts, articles, montants et adresse de livraison. Le
          téléphone, l’identifiant fiscal de l’acheteur et ses commentaires ne sont pas conservés.
        </p>
        <p className="text-[13.5px] leading-relaxed text-app-muted">
          eBay cesse de transmettre l’e-mail de l’acheteur après 14 jours, et son nom ainsi que sa
          rue après 90 jours. INVEQ enregistre donc ces informations dès l’import : synchronisez
          régulièrement pour ne rien perdre.
        </p>
      </Panel>

      <AppDialog
        onClose={() => setConfirmDisconnect(false)}
        open={confirmDisconnect}
        title="Déconnecter eBay">
        <p className="text-[13.5px] leading-relaxed text-app-muted">
          Les autorisations eBay seront supprimées. Les commandes déjà importées et les factures
          créées sont conservées.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryButton onClick={() => setConfirmDisconnect(false)}>Annuler</SecondaryButton>
          <DangerButton disabled={busy} onClick={() => disconnect.mutate()}>
            Déconnecter
          </DangerButton>
        </div>
      </AppDialog>
    </div>
  );
}
