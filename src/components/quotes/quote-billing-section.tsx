import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { SectionHeader } from '@/components/dashboard/section-header';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { FilterChip } from '@/components/ui/filter-chip';
import { TextField } from '@/components/ui/text-field';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { invoicesQueryKeys, quotesQueryKeys } from '@/lib/supabase/query-keys';
import {
  BILLING_ROLE_LABELS,
  createDepositInvoice,
  createFinalInvoiceFromQuote,
  fetchQuoteBillingState,
  previewDepositTtc,
  quoteVatGroups,
  type DepositMode,
  type QuoteBillingState,
} from '@/lib/supabase/quote-billing';
import { useToast } from '@/providers/toast-provider';
import type { QuoteDetail } from '@/types/quote';

export const quoteBillingQueryKey = (quoteId: string) => ['quote-billing', quoteId] as const;

/**
 * Facturation d'un devis accepté : acomptes (pourcentage ou montant TTC),
 * reste à facturer, facture de solde et liens vers chaque facture.
 * Mêmes règles que sur le site : elles sont appliquées par la base.
 */
export function QuoteBillingSection({ quote }: { quote: QuoteDetail }) {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [mode, setMode] = useState<DepositMode>('percent');
  const [rawValue, setRawValue] = useState('30');
  const enabled = quote.status === 'accepted' || quote.status === 'converted';

  const stateQuery = useQuery({
    queryKey: quoteBillingQueryKey(quote.id),
    queryFn: () => fetchQuoteBillingState(quote.id),
    enabled,
  });
  const state = stateQuery.data;
  const vatGroups = useMemo(() => quoteVatGroups(quote.lines), [quote.lines]);
  const value = Number(rawValue.replace(',', '.'));
  const preview = previewDepositTtc(vatGroups, quote.totalTtc, mode, value);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: quoteBillingQueryKey(quote.id) });
    void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
  };

  const depositMutation = useMutation({
    mutationFn: () => createDepositInvoice(quote.id, mode, value),
    onSuccess: (created) => {
      refresh();
      setDepositOpen(false);
      showSuccess(`Facture d’acompte ${created.number} créée (${formatCurrency(created.totalTtc)}).`);
      router.push(`/invoices/${created.id}` as Href);
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  const finalMutation = useMutation({
    mutationFn: () => createFinalInvoiceFromQuote(quote.id),
    onSuccess: (created) => {
      refresh();
      showSuccess(`Facture de solde ${created.number} créée (${formatCurrency(created.totalTtc)}).`);
      router.push(`/invoices/${created.id}` as Href);
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  if (!enabled) {
    return null;
  }

  const hasDeposits = state?.invoices.some((invoice) => invoice.role === 'deposit' && invoice.active) ?? false;
  const valueError =
    !Number.isFinite(value) || value <= 0
      ? 'Indiquez une valeur positive.'
      : mode === 'percent' && value >= 100
        ? 'Un acompte est inférieur à 100 %.'
        : state && preview > state.remainingTtc - 0.01
          ? `Il doit rester un solde : au plus ${formatCurrency(Math.max(state.remainingTtc - 0.01, 0))}.`
          : undefined;

  return (
    <View style={styles.section}>
      <SectionHeader title="Facturation du devis" />
      <View style={styles.card}>
        {state ? (
          <>
            <Totals state={state} />
            <BillingInvoiceList state={state} />
            {state.canCreateDeposit ? (
              <Button onPress={() => setDepositOpen(true)} title="Créer une facture d’acompte" variant="ghost" />
            ) : null}
            {state.canCreateFinal && hasDeposits ? (
              <Button
                loading={finalMutation.isPending}
                onPress={() => finalMutation.mutate()}
                title={`Créer la facture de solde (${formatCurrency(state.remainingTtc)})`}
              />
            ) : null}
          </>
        ) : (
          <Text style={styles.meta}>{stateQuery.isLoading ? 'Chargement…' : 'Indisponible.'}</Text>
        )}
      </View>

      <ConfirmDialog
        confirmLabel={`Créer (${formatCurrency(preview)})`}
        loading={depositMutation.isPending}
        message="L’acompte reprend la répartition du devis par taux de TVA. Il sera déduit de la facture de solde."
        onCancel={() => setDepositOpen(false)}
        onConfirm={() => {
          if (valueError) {
            showError(valueError);
            return;
          }
          depositMutation.mutate();
        }}
        title={`Acompte sur le devis ${quote.number}`}
        visible={depositOpen}>
        <View style={styles.dialogBody}>
          <View style={styles.chips}>
            <FilterChip
              label="Pourcentage"
              onPress={() => {
                setMode('percent');
                setRawValue('30');
              }}
              selected={mode === 'percent'}
            />
            <FilterChip
              label="Montant TTC"
              onPress={() => {
                setMode('amount');
                setRawValue('');
              }}
              selected={mode === 'amount'}
            />
          </View>
          <TextField
            error={valueError}
            keyboardType="decimal-pad"
            label={mode === 'percent' ? 'Pourcentage du devis (%)' : 'Montant TTC (€)'}
            onChangeText={setRawValue}
            skipFieldNavigation
            value={rawValue}
          />
          <Text style={styles.meta}>
            Acompte : {formatCurrency(preview)} TTC
            {state ? ` · reste ensuite : ${formatCurrency(Math.max(state.remainingTtc - preview, 0))}` : ''}
          </Text>
        </View>
      </ConfirmDialog>
    </View>
  );
}

function Totals({ state }: { state: QuoteBillingState }) {
  const styles = useStyles();
  const rows: [string, string][] = [
    ['Devis', `${formatCurrency(state.quoteTotalTtc)} TTC`],
    ['Acomptes facturés', formatCurrency(state.depositsTotalTtc)],
    ['Acomptes encaissés', formatCurrency(state.depositsPaid)],
    ['Reste à facturer', formatCurrency(state.remainingTtc)],
  ];
  return (
    <View style={styles.totals}>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.totalRow}>
          <Text style={styles.meta}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function BillingInvoiceList({ state, excludeId }: { state: QuoteBillingState; excludeId?: string }) {
  const styles = useStyles();
  const invoices = state.invoices.filter((invoice) => invoice.id !== excludeId);
  if (invoices.length === 0) return null;
  return (
    <View style={styles.list}>
      {invoices.map((invoice) => (
        <Pressable
          accessibilityRole="link"
          key={invoice.id}
          onPress={() => router.push(`/invoices/${invoice.id}` as Href)}
          style={styles.invoiceRow}>
          <Text numberOfLines={1} style={[styles.link, !invoice.active && styles.canceled]}>
            {BILLING_ROLE_LABELS[invoice.role]} {invoice.number}
            {invoice.role === 'deposit' && invoice.depositPercent
              ? ` · ${invoice.depositPercent.toLocaleString('fr-FR')} %`
              : ''}
          </Text>
          <Text style={[styles.meta, !invoice.active && styles.canceled]}>
            {formatCurrency(invoice.totalTtc)}
            {invoice.issuedAt ? ` · ${formatDate(invoice.issuedAt)}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Sur une facture liée à un devis : son rôle et les autres documents du devis. */
export function InvoiceQuoteLinksSection({ quoteId, invoiceId }: { quoteId: string; invoiceId: string }) {
  const styles = useStyles();
  const stateQuery = useQuery({
    queryKey: quoteBillingQueryKey(quoteId),
    queryFn: () => fetchQuoteBillingState(quoteId),
  });
  const state = stateQuery.data;
  if (!state) return null;
  const current = state.invoices.find((invoice) => invoice.id === invoiceId);

  return (
    <View style={styles.section}>
      <SectionHeader title={current ? BILLING_ROLE_LABELS[current.role] : 'Facture du devis'} />
      <View style={styles.card}>
        <Pressable accessibilityRole="link" onPress={() => router.push(`/quotes/${state.quoteId}` as Href)}>
          <Text style={styles.link}>Devis {state.quoteNumber}</Text>
        </Pressable>
        <BillingInvoiceList excludeId={invoiceId} state={state} />
        <Text style={styles.meta}>
          Devis : {formatCurrency(state.quoteTotalTtc)} · acomptes : {formatCurrency(state.depositsTotalTtc)}
          {state.finalInvoiceId ? '' : ` · reste à facturer : ${formatCurrency(state.remainingTtc)}`}
        </Text>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    totals: {
      gap: spacing.xs,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    value: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    meta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    list: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    invoiceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    link: {
      ...typography.footnote,
      color: colors.primary,
      flexShrink: 1,
    },
    canceled: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    dialogBody: {
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    chips: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
  }));
}
