'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { Badge, LoadingState, Panel, StatCard } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { fetchSubscriptionSnapshot } from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDate } from '@/lib/domain/format/date';
import { SUPPORT_EMAIL } from '@/lib/constants';
import {
  getPremiumQrImageUrl,
  PREMIUM_APP_DEEP_LINK,
  PREMIUM_MARKETING,
} from '@/lib/premium-marketing';
import {
  confirmSubscriptionCheckout,
  isSubscriptionCheckoutConfigured,
  startPremiumCheckoutRedirect,
} from '@/lib/stripe/subscription-checkout';

export default function SubscriptionSettingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const confirmStarted = useRef(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: subscriptionQueryKeys.snapshot(user?.id ?? ''),
    queryFn: () => fetchSubscriptionSnapshot(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    const subscription = searchParams.get('subscription');
    const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId');

    if (subscription === 'canceled') {
      setConfirmMessage('Paiement annulé. Vous pouvez réessayer quand vous voulez.');
      return;
    }

    if (subscription !== 'success' || !sessionId || confirmStarted.current) {
      return;
    }

    confirmStarted.current = true;

    void (async () => {
      try {
        const result = await confirmSubscriptionCheckout(sessionId);
        if (user?.id) {
          await queryClient.invalidateQueries({
            queryKey: subscriptionQueryKeys.snapshot(user.id),
          });
        }
        setConfirmMessage(
          result.isPremium
            ? 'INVEQ Premium est activé. Merci !'
            : 'Paiement reçu. L’activation peut prendre quelques instants.',
        );
        router.replace('/app/settings/subscription');
      } catch (error) {
        setCheckoutError(
          error instanceof Error ? error.message : 'Impossible de confirmer le paiement.',
        );
      }
    })();
  }, [queryClient, router, searchParams, user?.id]);

  async function handleCheckout() {
    setCheckoutError(null);

    if (!isSubscriptionCheckoutConfigured()) {
      setCheckoutError('Le paiement n’est pas encore disponible. Réessayez plus tard.');
      return;
    }

    setCheckoutLoading(true);
    try {
      await startPremiumCheckoutRedirect();
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Une erreur est survenue.');
      setCheckoutLoading(false);
    }
  }

  if (query.isLoading) {
    return <LoadingState message="Chargement de l’abonnement…" />;
  }

  if (query.error || !query.data) {
    return (
      <>
        <AppTopBar subtitle="Gérez votre plan" title="Abonnement">
          <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
            ← Paramètres
          </Link>
        </AppTopBar>
        <div className="flex-1 p-8">
          <Panel>
            <p className="text-sm text-slate-600">
              Impossible de charger les informations d’abonnement. Réessayez plus tard ou contactez{' '}
              <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <Link className="mt-4 inline-block font-medium text-primary hover:underline" href="/tarifs">
              Voir les tarifs
            </Link>
          </Panel>
        </div>
      </>
    );
  }

  const { subscription, plan, usage } = query.data;
  const isPremium = subscription.effectivePlanId !== 'micro' && subscription.plan !== 'free';

  return (
    <>
      <AppTopBar subtitle="Plan actuel et utilisation" title="Abonnement">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {confirmMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {confirmMessage}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard accent="primary" label="Plan" value={plan.displayName} />
            <StatCard
              accent="muted"
              label="Statut"
              trend={subscription.cancelAtPeriodEnd ? 'Résiliation programmée' : undefined}
              value={subscription.status}
            />
            <StatCard
              accent="success"
              label="Renouvellement"
              value={
                subscription.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd)
                  : '—'
              }
            />
          </div>

          {!isPremium ? (
            <Panel title="Passer à Premium">
              <p className="text-sm text-slate-600">
                {PREMIUM_MARKETING.subtitle} {PREMIUM_MARKETING.priceDisplay}.
              </p>
              <button
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
                disabled={checkoutLoading}
                onClick={() => void handleCheckout()}
                type="button">
                {checkoutLoading ? 'Redirection Stripe…' : PREMIUM_MARKETING.unlockCta}
              </button>
              {checkoutError ? (
                <p className="mt-3 text-sm text-red-600">{checkoutError}</p>
              ) : null}
              <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="QR Code Premium INVEQ"
                  className="h-28 w-28 rounded-lg border border-slate-200 bg-white p-1"
                  height={112}
                  src={getPremiumQrImageUrl(112)}
                  width={112}
                />
                <div>
                  <p className="text-sm text-slate-600">
                    Ou ouvrez l’abonnement dans l’application :
                  </p>
                  <a
                    className="mt-2 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                    href={PREMIUM_APP_DEEP_LINK}>
                    Ouvrir Premium dans l’app
                  </a>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{PREMIUM_MARKETING.guarantee}</p>
            </Panel>
          ) : (
            <Panel title="INVEQ Premium actif">
              <p className="text-sm text-slate-600">
                Merci pour votre abonnement. Pour toute question facturation, contactez{' '}
                <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
              <Link
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                href="/tarifs">
                Voir les tarifs
              </Link>
            </Panel>
          )}

          <Panel title="Utilisation">
            <div className="grid gap-4 sm:grid-cols-3">
              <UsageBar current={usage.clients} label="Clients" max={plan.maxClients} />
              <UsageBar current={usage.quotes} label="Devis" max={plan.maxQuotes} />
              <UsageBar current={usage.invoices} label="Factures" max={plan.maxInvoices} />
            </div>
          </Panel>

          <Panel title="Fonctionnalités incluses">
            <ul className="grid gap-2 sm:grid-cols-2">
              {Object.entries(plan.features).map(([key, enabled]) => (
                <li className="flex items-center gap-2 text-sm text-slate-700" key={key}>
                  <Badge variant={enabled ? 'success' : 'default'}>
                    {enabled ? '✓' : '—'}
                  </Badge>
                  {formatFeatureLabel(key)}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const unlimited = max === null;
  const percent = unlimited ? 0 : Math.min(100, (current / Math.max(max, 1)) * 100);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {current}
          {unlimited ? '' : ` / ${max}`}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-emerald-600">Illimité</p>
      )}
    </div>
  );
}

function formatFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    custom_logo: 'Logo personnalisé',
    company_signature: 'Signature entreprise',
    client_signature: 'Signature client',
    stripe_payments: 'Paiements Stripe',
    ai_assistant: 'Assistant IA',
    advanced_stats: 'Statistiques avancées',
    siren_search: 'Recherche SIREN',
    pdf_templates: 'Modèles PDF',
  };
  return labels[key] ?? key;
}
