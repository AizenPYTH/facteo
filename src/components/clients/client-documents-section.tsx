import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CommeLaDerniereFoisCard } from '@/components/documents/comme-la-derniere-fois-card';
import { InvoiceCard } from '@/components/invoices/invoice-card';
import { QuoteCard } from '@/components/quotes/quote-card';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { useClientDocumentMemory } from '@/hooks/use-client-document-memory';
import { useClientDocuments } from '@/hooks/use-client-documents';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { newInvoiceHref, newQuoteHref } from '@/lib/navigation/new-document';

type TabId = 'invoices' | 'quotes';

type ClientDocumentsSectionProps = {
  clientId: string;
};

export function ClientDocumentsSection({ clientId }: ClientDocumentsSectionProps) {
  const styles = useStyles();
  const [tab, setTab] = useState<TabId>('invoices');
  const { data, isLoading } = useClientDocuments(clientId);
  const { data: memory } = useClientDocumentMemory(clientId);

  const invoices = data?.invoices ?? [];
  const quotes = data?.quotes ?? [];
  const items = tab === 'invoices' ? invoices : quotes;
  const lastLabel = memory?.lastDocument?.label;

  return (
    <View style={styles.section}>
      {lastLabel ? (
        <CommeLaDerniereFoisCard
          onPress={() => router.push(newInvoiceHref(clientId, { replay: true }))}
          subtitle={lastLabel}
          testID="client-replay-last"
        />
      ) : null}

      <View style={styles.headerRow}>
        <Text style={styles.title}>Documents</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push(newQuoteHref(clientId))}
            style={styles.linkBtn}>
            <Text style={styles.link}>+ Devis</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push(newInvoiceHref(clientId))}
            style={styles.linkBtn}>
            <Text style={styles.link}>+ Facture</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tabs}>
        <TabChip
          active={tab === 'invoices'}
          count={invoices.length}
          label="Factures"
          onPress={() => setTab('invoices')}
        />
        <TabChip
          active={tab === 'quotes'}
          count={quotes.length}
          label="Devis"
          onPress={() => setTab('quotes')}
        />
      </View>

      {isLoading ? (
        <LoadingView message="Chargement des documents…" size="small" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {tab === 'invoices' ? 'Aucune facture pour ce client' : 'Aucun devis pour ce client'}
          </Text>
          <Text style={styles.emptyDescription}>
            {lastLabel
              ? 'Ou reprenez le dernier document en un tap ci-dessus.'
              : 'Créez un document pour démarrer la relation commerciale.'}
          </Text>
          <Button
            onPress={() =>
              router.push(tab === 'invoices' ? newInvoiceHref(clientId) : newQuoteHref(clientId))
            }
            title={tab === 'invoices' ? 'Créer une facture' : 'Créer un devis'}
          />
        </View>
      ) : (
        <View style={styles.list}>
          {tab === 'invoices'
            ? invoices.map((invoice, index) => (
                <View key={invoice.id}>
                  <InvoiceCard
                    index={index}
                    invoice={invoice}
                    onPress={(doc) => router.push(`/invoices/${doc.id}`)}
                  />
                  {index < invoices.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              ))
            : quotes.map((quote, index) => (
                <View key={quote.id}>
                  <QuoteCard
                    index={index}
                    onPress={(doc) => router.push(`/quotes/${doc.id}`)}
                    quote={quote}
                  />
                  {index < quotes.length - 1 ? <View style={styles.separator} /> : null}
                </View>
              ))}
        </View>
      )}
    </View>
  );
}

function TabChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && { color: colors.primary }]}>
        {label} ({count})
      </Text>
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      ...type.section,
      fontSize: 20,
      lineHeight: 25,
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    linkBtn: {
      paddingVertical: spacing[1],
    },
    link: {
      ...type.badge,
      color: colors.primary,
    },
    tabs: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[1.5],
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSecondary,
    },
    chipActive: {
      backgroundColor: colors.primarySubtle,
    },
    chipLabel: {
      ...type.badge,
      color: colors.textSecondary,
    },
    list: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
      ...elevation[1],
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
    empty: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...elevation[1],
    },
    emptyTitle: {
      ...type.cardTitle,
      color: colors.text,
      textAlign: 'center',
    },
    emptyDescription: {
      ...type.secondary,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
  }));
}
