'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { Badge, LoadingState, Panel, StatCard } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { fetchSubscriptionSnapshot } from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDate } from '@/lib/domain/format/date';

export default function SubscriptionSettingsPage() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: subscriptionQueryKeys.snapshot(user?.id ?? ''),
    queryFn: () => fetchSubscriptionSnapshot(user!.id),
    enabled: Boolean(user?.id),
  });

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
              <a className="text-primary hover:underline" href="mailto:support@facteo.app">
                support@facteo.app
              </a>
              .
            </p>
          </Panel>
        </div>
      </>
    );
  }

  const { subscription, plan, usage } = query.data;

  return (
    <>
      <AppTopBar subtitle="Plan actuel et utilisation" title="Abonnement">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
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

          <Panel title="Utilisation">
            <div className="grid gap-4 sm:grid-cols-3">
              <UsageBar
                current={usage.clients}
                label="Clients"
                max={plan.maxClients}
              />
              <UsageBar current={usage.quotes} label="Devis" max={plan.maxQuotes} />
              <UsageBar
                current={usage.invoices}
                label="Factures"
                max={plan.maxInvoices}
              />
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

          <Panel>
            <p className="text-sm text-slate-600">
              FACTEO Premium : 6,99 €/mois. Pour souscrire ou gérer votre facturation, utilisez
              l’application mobile (paiement Stripe sécurisé, codes promo acceptés) ou contactez{' '}
              <a className="font-medium text-primary hover:underline" href="mailto:support@facteo.app">
                support@facteo.app
              </a>
              . Voir aussi la page{' '}
              <Link className="font-medium text-primary hover:underline" href="/tarifs">
                tarifs
              </Link>
              .
            </p>
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
  };
  return labels[key] ?? key;
}
