'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, FileText, Package, Receipt, Send, UserPlus, Wallet } from 'lucide-react';
import Link from 'next/link';

import { EmptyState } from '@/components/app/empty-state';
import { PrimaryLink, SecondaryLink } from '@/components/app/form-fields';
import { Panel } from '@/components/app/ui';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import { fetchProducts } from '@/lib/domain/supabase/products';
import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import type { ActivityItem, Invoice, TopClient } from '@/types/dashboard';
import { cn } from '@/lib/utils';

export type DashboardTone = 'accent' | 'violet' | 'success' | 'danger' | 'neutral';

const TONE_CLASSES: Record<DashboardTone, string> = {
  accent: 'bg-app-accent-tint text-app-accent',
  violet: 'bg-app-accent-violet-tint text-app-accent-violet',
  success: 'bg-app-success-tint text-app-success',
  danger: 'bg-app-danger-tint text-app-danger',
  neutral: 'bg-app-border-soft text-app-muted',
};

const ROW_ACTION =
  'shrink-0 rounded-app-field border border-app-border bg-app-surface px-3 py-[7px] text-[12.5px] font-semibold text-app-text-2 transition-colors duration-150 hover:border-app-accent-border hover:bg-app-accent-soft hover:text-app-accent';

const PANEL_ACTION =
  'text-[12.5px] font-semibold text-app-muted transition-colors duration-150 hover:text-app-accent';

/** Ligne de la file « À traiter aujourd'hui ». À placer dans une `<ul>`. */
export function DashboardTaskRow({
  icon: Icon,
  tone = 'neutral',
  title,
  meta,
  amount,
  actionLabel,
  href,
}: {
  icon: LucideIcon;
  tone?: DashboardTone;
  title: string;
  meta: string;
  amount?: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <li className="flex items-center gap-3 border-b border-app-border-soft px-[18px] py-3 transition-colors duration-150 last:border-b-0 hover:bg-app-subtle">
      <span
        className={cn(
          'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-app-field',
          TONE_CLASSES[tone],
        )}>
        <Icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-app-text">{title}</p>
        <p className="mt-0.5 truncate text-[12px] text-app-muted">{meta}</p>
      </div>
      {amount ? (
        <p className="app-num hidden shrink-0 text-[13.5px] font-semibold text-app-text sm:block">
          {amount}
        </p>
      ) : null}
      <Link className={ROW_ACTION} href={href}>
        {actionLabel}
      </Link>
    </li>
  );
}

function enrichActivity(
  item: ActivityItem,
  invoices: Invoice[],
): { icon: LucideIcon; title: string; tone: DashboardTone } {
  const invoice = invoices.find((entry) => entry.id === item.id);

  if (item.type === 'quote') {
    return { icon: FileText, title: item.label.replace(' · ', ' — '), tone: 'violet' };
  }

  if (invoice?.status === 'paid') {
    return { icon: Wallet, title: `Paiement reçu · ${invoice.number}`, tone: 'success' };
  }

  if (invoice?.status === 'sent' || invoice?.status === 'overdue') {
    return { icon: Send, title: `Facture ${invoice.number} envoyée`, tone: 'accent' };
  }

  return { icon: Receipt, title: item.label.replace(' · ', ' — '), tone: 'neutral' };
}

export function DashboardActivityFeed({
  activity,
  invoices,
}: {
  activity: ActivityItem[];
  invoices: Invoice[];
}) {
  return (
    <Panel
      action={
        <Link className={PANEL_ACTION} href="/app/invoices">
          Voir tout
        </Link>
      }
      bodyClassName={activity.length === 0 ? undefined : 'p-0'}
      title="Activité récente">
      {activity.length === 0 ? (
        <EmptyState
          action={<PrimaryLink href="/app/invoices?create=1">Créer une facture</PrimaryLink>}
          description="Vos envois, paiements et devis signés apparaîtront ici au fil de l’eau."
          icon={Receipt}
          secondaryAction={<SecondaryLink href="/app/quotes?create=1">Créer un devis</SecondaryLink>}
          title="Aucune activité pour le moment"
        />
      ) : (
        <ul>
          {activity.slice(0, 6).map((item) => {
            const meta = enrichActivity(item, invoices);
            const Icon = meta.icon;
            const invoice = invoices.find((entry) => entry.id === item.id);
            const href =
              item.type === 'invoice'
                ? `/app/invoices?selected=${item.id}`
                : `/app/quotes?selected=${item.id}`;

            return (
              <li className="border-b border-app-border-soft last:border-b-0" key={item.id}>
                <Link
                  className="flex items-center gap-[11px] px-[18px] py-[11px] transition-colors duration-150 hover:bg-app-subtle"
                  href={href}>
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      TONE_CLASSES[meta.tone],
                    )}>
                    <Icon size={14} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-app-text">
                      {meta.title}
                    </span>
                    <span
                      className="block truncate text-[11.5px] text-app-muted-2"
                      title={formatDate(item.date)}>
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: fr })}
                    </span>
                  </span>
                  <span className="app-num shrink-0 text-[12.5px] font-semibold text-app-text-2">
                    {invoice ? formatCurrency(invoice.amount) : '—'}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/**
 * Conseils d'onboarding affichés à la place de la file de tâches quand tous les
 * compteurs sont à zéro (§4.1 du handoff).
 */
export function DashboardTips({
  totalClients,
  invoiceCount,
  topClient,
}: {
  totalClients: number;
  invoiceCount: number;
  topClient?: TopClient | null;
}) {
  const { user } = useAuth();
  const { scope } = useTenant();
  const productsQuery = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', 'product', ''),
    queryFn: () => fetchProducts(requireScope(scope), 'product'),
    enabled: Boolean(scope?.companyId && user?.id),
    staleTime: 60_000,
  });

  const productCount = productsQuery.data?.length ?? 0;
  const tips: {
    id: string;
    icon: LucideIcon;
    tone: DashboardTone;
    title: string;
    meta: string;
    actionLabel: string;
    href: string;
  }[] = [];

  if (totalClients === 0) {
    tips.push({
      id: 'client',
      icon: UserPlus,
      tone: 'accent',
      title: 'Ajoutez votre premier client',
      meta: 'Un client est nécessaire pour émettre un devis ou une facture.',
      actionLabel: 'Ajouter',
      href: '/app/clients/new',
    });
  }

  if (!productsQuery.isLoading && productCount === 0) {
    tips.push({
      id: 'product',
      icon: Package,
      tone: 'neutral',
      title: 'Créez votre premier produit',
      meta: 'Le catalogue accélère la saisie des lignes de vos documents.',
      actionLabel: 'Ouvrir',
      href: '/app/products',
    });
  }

  if (invoiceCount === 0) {
    tips.push({
      id: 'invoice',
      icon: Receipt,
      tone: 'violet',
      title: 'Envoyez votre première facture',
      meta: 'Quelques lignes suffisent : le PDF et la numérotation sont automatiques.',
      actionLabel: 'Créer',
      href: '/app/invoices?create=1',
    });
  }

  if (tips.length === 0) {
    return (
      <div className="px-[18px] py-4">
        <EmptyState
          action={<PrimaryLink href="/app/quotes?create=1">Créer un devis</PrimaryLink>}
          description={
            topClient
              ? `Rien à relancer aujourd’hui. Meilleur client : ${topClient.name} · ${formatCurrency(topClient.revenue)}.`
              : 'Rien à relancer aujourd’hui : aucun retard de paiement ni devis en attente.'
          }
          icon={CheckCircle2}
          secondaryAction={
            <SecondaryLink href="/app/invoices?create=1">Créer une facture</SecondaryLink>
          }
          title="Tout est à jour"
        />
      </div>
    );
  }

  return (
    <ul>
      {tips.map((tip) => (
        <DashboardTaskRow
          actionLabel={tip.actionLabel}
          href={tip.href}
          icon={tip.icon}
          key={tip.id}
          meta={tip.meta}
          title={tip.title}
          tone={tip.tone}
        />
      ))}
    </ul>
  );
}
