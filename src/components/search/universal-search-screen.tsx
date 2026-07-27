import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useUniversalSearch } from '@/hooks/use-universal-search';
import { formatPriceHT } from '@/lib/format/currency';
import { triggerHaptic } from '@/lib/haptics';
import { getClientDisplayName, type Client } from '@/types/client';
import type { Invoice } from '@/types/invoice';
import type { Quote } from '@/types/quote';

export function UniversalSearchScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const { isSearching, isLoading, results } = useUniversalSearch(search);

  const total =
    results.clients.length + results.quotes.length + results.invoices.length;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            void triggerHaptic('selection');
            router.back();
          }}
          style={styles.backBtn}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={colors.primary}
            type="hierarchical"
          />
        </Pressable>
        <View style={styles.searchField}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
          <TextInput
            autoFocus
            clearButtonMode="while-editing"
            onChangeText={setSearch}
            placeholder="Client, devis, facture, n°, téléphone…"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            style={styles.input}
            value={search}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {!isSearching ? (
          <View style={styles.hint}>
            <Text style={styles.hintTitle}>Recherche universelle</Text>
            <Text style={styles.hintBody}>
              Retrouvez un client, un devis ou une facture par nom, numéro, e-mail, téléphone
              ou ville.
            </Text>
          </View>
        ) : isLoading && total === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Recherche…</Text>
          </View>
        ) : total === 0 ? (
          <View style={styles.hint}>
            <Text style={styles.hintTitle}>Aucun résultat</Text>
            <Text style={styles.hintBody}>Essayez un autre terme ou un numéro de document.</Text>
          </View>
        ) : (
          <>
            {results.clients.length > 0 ? (
              <ResultSection title="Clients">
                {results.clients.map((client) => (
                  <ClientRow
                    client={client}
                    key={client.id}
                    onPress={() => router.push(`/clients/${client.id}` as Href)}
                  />
                ))}
              </ResultSection>
            ) : null}

            {results.invoices.length > 0 ? (
              <ResultSection title="Factures">
                {results.invoices.map((invoice) => (
                  <DocumentRow
                    amount={formatPriceHT(invoice.totalTtc)}
                    key={invoice.id}
                    onPress={() => router.push(`/invoices/${invoice.id}` as Href)}
                    subtitle={invoice.clientName || 'Client'}
                    title={invoice.number}
                  />
                ))}
              </ResultSection>
            ) : null}

            {results.quotes.length > 0 ? (
              <ResultSection title="Devis">
                {results.quotes.map((quote) => (
                  <DocumentRow
                    amount={formatPriceHT(quote.totalTtc)}
                    key={quote.id}
                    onPress={() => router.push(`/quotes/${quote.id}` as Href)}
                    subtitle={quote.clientName || 'Client'}
                    title={quote.number}
                  />
                ))}
              </ResultSection>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function ClientRow({ client, onPress }: { client: Client; onPress: () => void }) {
  const styles = useStyles();
  const colors = useColors();
  const secondary =
    [client.email, client.phone, client.city].filter(Boolean).join(' · ') || null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {getClientDisplayName(client)}
        </Text>
        {secondary ? (
          <Text numberOfLines={1} style={styles.rowSubtitle}>
            {secondary}
          </Text>
        ) : null}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14}
        tintColor={colors.iconTertiary}
        type="hierarchical"
      />
    </Pressable>
  );
}

function DocumentRow({
  title,
  subtitle,
  amount,
  onPress,
}: {
  title: string;
  subtitle: string;
  amount: string;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.rowSubtitle}>
          {subtitle}
        </Text>
      </View>
      <Text style={styles.amount}>{amount}</Text>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14}
        tintColor={colors.iconTertiary}
        type="hierarchical"
      />
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchField: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      ...elevation[1],
    },
    input: {
      flex: 1,
      ...type.body,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    hint: {
      paddingTop: spacing.xl,
      gap: spacing.sm,
    },
    hintTitle: {
      ...type.section,
      color: colors.text,
      textAlign: 'center',
    },
    hintBody: {
      ...type.secondary,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loading: {
      paddingTop: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    loadingText: {
      ...type.secondary,
      color: colors.textSecondary,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      ...type.section,
      fontSize: 18,
      lineHeight: 22,
      color: colors.text,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 0.5,
      borderColor: colors.border,
      overflow: 'hidden',
      ...elevation[1],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    rowPressed: {
      backgroundColor: colors.backgroundSelected,
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    rowTitle: {
      ...type.cardTitle,
      color: colors.text,
    },
    rowSubtitle: {
      ...type.caption,
      color: colors.textSecondary,
    },
    amount: {
      ...type.badge,
      color: colors.text,
    },
  }));
}
