'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Badge, LoadingState, Panel, StatCard } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { fetchSubscriptionSnapshot } from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDate } from '@/lib/domain/format/date';
import { SUPPORT_EMAIL } from '@/lib/constants';

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
      <div className="mx-auto max-w-[720px] p-5 sm:p-6">
        <Panel>
          <p className="text-[13px] text-app-text-2">
            Impossible de charger les informations d’abonnement. Réessayez plus tard ou contactez{' '}
            <a className="text-app-accent hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Panel>
      </div>
    );
  }

  const { subscription, plan, usage } = query.data;

  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
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
                <li className="flex items-center gap-2 text-[13px] text-app-text-2" key={key}>
                  <Badge variant={enabled ? 'success' : 'default'}>
                    {enabled ? '✓' : '—'}
                  </Badge>
                  {formatFeatureLabel(key)}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel>
            <p className="text-[13px] text-app-text-2">
              INVEQ Premium : 6,99 €/mois. Pour souscrire ou gérer votre facturation, utilisez
              l’application mobile (paiement Stripe sécurisé, codes promo acceptés) ou contactez{' '}
              <a className="font-medium text-app-accent hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              . Voir aussi la page{' '}
              <Link className="font-medium text-app-accent hover:underline" href="/tarifs">
                tarifs
              </Link>
              .
            </p>
          </Panel>
    </div>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const unlimited = max === null;
  const percent = unlimited ? 0 : Math.min(100, (current / Math.max(max, 1)) * 100);

  return (
    <div className="rounded-[12px] border border-app-border p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-app-text-2">{label}</span>
        <span className="app-num text-app-muted">
          {current}
          {unlimited ? '' : ` / ${max}`}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-app-border-soft">
          <div
            className="h-full rounded-full bg-app-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-app-success-text">Illimité</p>
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
