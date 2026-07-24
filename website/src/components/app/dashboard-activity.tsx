'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  FileText,
  Lightbulb,
  Package,
  Receipt,
  UserPlus,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

import { Badge, Panel } from '@/components/app/ui';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import { fetchProducts } from '@/lib/domain/supabase/products';
import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import type { ActivityItem, Invoice, TopClient } from '@/types/dashboard';
import { cn } from '@/lib/utils';

function enrichActivity(
  item: ActivityItem,
  invoices: Invoice[],
): { icon: React.ReactNode; title: string; tone: string } {
  const invoice = invoices.find((entry) => entry.id === item.id);

  if (item.type === 'quote') {
    return {
      icon: <FileText size={14} />,
      title: item.label.replace(' · ', ' — '),
      tone: 'bg-violet-50 text-violet-600',
    };
  }

  if (invoice?.status === 'paid') {
    return {
      icon: <Wallet size={14} />,
      title: `Paiement reçu · ${invoice.number}`,
      tone: 'bg-emerald-50 text-emerald-600',
    };
  }

  if (invoice?.status === 'sent' || invoice?.status === 'overdue') {
    return {
      icon: <CheckCircle2 size={14} />,
      title: `Facture ${invoice.number} envoyée`,
      tone: 'bg-blue-50 text-primary',
    };
  }

  return {
    icon: <Receipt size={14} />,
    title: item.label.replace(' · ', ' — '),
    tone: 'bg-slate-100 text-slate-600',
  };
}

export function DashboardActivityFeed({
  activity,
  invoices,
}: {
  activity: ActivityItem[];
  invoices: Invoice[];
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Panel title="Centre d’activité">
      {activity.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-700">Aucune activité pour le moment</p>
          <p className="mt-1 text-xs text-slate-500">
            Créez une facture ou un devis pour animer ce fil.
          </p>
          <Link
            className="mt-4 inline-flex rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark"
            href="/app/invoices?create=1">
            Créer une facture
          </Link>
        </div>
      ) : (
        <ul className="relative space-y-0">
          <span
            aria-hidden
            className="absolute bottom-3 left-[15px] top-3 w-px bg-slate-200"
          />
          {activity.slice(0, 8).map((item, index) => {
            const meta = enrichActivity(item, invoices);
            return (
              <motion.li
                className="relative flex gap-3 pb-4 last:pb-0"
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                key={item.id}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                viewport={{ once: true }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}>
                <span
                  className={cn(
                    'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                    meta.tone,
                  )}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{meta.title}</p>
                    <Badge className="shrink-0" variant={item.type === 'invoice' ? 'info' : 'default'}>
                      {item.type === 'invoice' ? 'Facture' : 'Devis'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDate(item.date)} ·{' '}
                    {formatDistanceToNow(new Date(item.date), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

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
  const tips: { id: string; text: string; href: string; icon: React.ReactNode }[] = [];

  if (totalClients === 0) {
    tips.push({
      id: 'client',
      text: 'Ajoutez votre premier client.',
      href: '/app/clients/new',
      icon: <UserPlus size={14} />,
    });
  }

  if (!productsQuery.isLoading && productCount === 0) {
    tips.push({
      id: 'product',
      text: 'Vous n’avez encore créé aucun produit.',
      href: '/app/products',
      icon: <Package size={14} />,
    });
  }

  if (invoiceCount === 0) {
    tips.push({
      id: 'invoice',
      text: 'Envoyez votre première facture.',
      href: '/app/invoices?create=1',
      icon: <Receipt size={14} />,
    });
  }

  if (tips.length === 0 && topClient) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white px-4 py-3.5 text-sm text-emerald-800">
        <span className="font-semibold">Meilleur client du mois :</span>{' '}
        {topClient.name} · {formatCurrency(topClient.revenue)}
      </div>
    );
  }

  if (tips.length === 0) return null;

  return (
    <div className="space-y-2">
      {tips.map((tip) => (
        <Link
          className="flex items-start gap-3 rounded-2xl border border-amber-100/90 bg-gradient-to-br from-amber-50/90 to-white px-4 py-3.5 text-sm text-amber-950 transition duration-150 hover:-translate-y-0.5 hover:border-amber-200"
          href={tip.href}
          key={tip.id}>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm ring-1 ring-amber-100">
            <Lightbulb size={14} />
          </span>
          <span className="min-w-0">
            <span className="font-medium">{tip.text}</span>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-amber-700/80">
              {tip.icon}
              Voir
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
