import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/integrations/integration-pieces';
import { EbayOrderCard } from '@/components/integrations/ebay-order-card';
import { Button } from '@/components/ui/button';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useEbayIntegration } from '@/hooks/use-ebay-integration';
import { useEbayOrders } from '@/hooks/use-ebay-orders';
import type { ExternalOrderFilter } from '@/lib/integrations/ebay/api';
import { useToast } from '@/providers/toast-provider';

const FILTERS: { key: ExternalOrderFilter; label: string }[] = [
  { key: 'pending', label: 'À facturer' },
  { key: 'invoiced', label: 'Facturées' },
  { key: 'all', label: 'Toutes' },
];

/**
 * E-commerce → eBay → Commandes.
 *
 * N'affiche que des commandes réellement importées. Quand rien n'a été
 * synchronisé, l'écran le dit clairement au lieu d'afficher un compteur vide.
 */
export default function EbayOrdersScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { showError, showInfo, showSuccess } = useToast();
  const [filter, setFilter] = useState<ExternalOrderFilter>('pending');
  const { connected, sync } = useEbayIntegration();
  const { orders, isLoading, refetch, isRefetching } = useEbayOrders(filter);

  async function handleSync() {
    try {
      const result = await sync.mutateAsync();
      if (result.fetched === 0) {
        showInfo('Aucune nouvelle commande eBay.');
      } else {
        showSuccess(`${result.imported} commande(s) importée(s).`);
      }
      await refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Synchronisation impossible.');
    }
  }

  if (!connected) {
    return (
      <SettingsScreenFrame title="Commandes eBay">
        <EmptyState
          title="Aucun compte eBay connecté"
          message="Connectez votre compte eBay pour importer vos commandes."
        />
        <View style={styles.actions}>
          <Button
            title="Connecter eBay"
            onPress={() => router.push('/settings/integrations-ebay' as Href)}
          />
        </View>
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Commandes eBay">
      <View style={styles.filterRow}>
        {FILTERS.map((entry) => {
          const active = entry.key === filter;
          return (
            <Pressable
              accessibilityRole="button"
              key={entry.key}
              onPress={() => setFilter(entry.key)}
              style={[styles.filterChip, active && { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterLabel, active && { color: colors.surface }]}>
                {entry.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : orders.length === 0 ? (
        <>
          <EmptyState
            title="Aucune commande importée"
            message={
              filter === 'pending'
                ? 'Aucune commande eBay en attente de facturation. Lancez une synchronisation pour récupérer les dernières commandes.'
                : filter === 'invoiced'
                  ? 'Aucune commande eBay n’a encore donné lieu à une facture.'
                  : 'Lancez une synchronisation pour importer vos commandes eBay.'
            }
          />
          <View style={styles.actions}>
            <Button
              loading={sync.isPending}
              title="Synchroniser maintenant"
              onPress={() => void handleSync()}
            />
          </View>
        </>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={orders}
          keyExtractor={(order) => order.id}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <EbayOrderCard
              order={item}
              onPress={() => router.push(`/settings/ebay-order?id=${item.id}` as Href)}
            />
          )}
          ListFooterComponent={
            <View style={styles.actions}>
              <Button
                loading={sync.isPending}
                title="Synchroniser"
                variant="ghost"
                onPress={() => void handleSync()}
              />
            </View>
          }
        />
      )}
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) =>
    StyleSheet.create({
      filterRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
      },
      filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.chip,
        backgroundColor: colors.surfaceSecondary,
      },
      filterLabel: {
        ...typography.footnoteMedium,
        color: colors.textSecondary,
      },
      list: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.xl,
        gap: spacing.sm,
      },
      actions: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.sm,
      },
      loader: {
        marginVertical: spacing.xl,
      },
    }),
  );
}
