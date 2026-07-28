import { useLocalSearchParams, router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ClientDetailView } from '@/components/clients/client-detail-view';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { MasterDetailLayout } from '@/components/web/desktop/layout/master-detail-layout';
import { DesktopDataTable } from '@/components/web/desktop/ui/desktop-data-table';
import { DesktopSearchInput } from '@/components/web/desktop/ui/desktop-search-input';
import { DesktopTabs, type DesktopTab } from '@/components/web/desktop/ui/desktop-tabs';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/app-text';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useClient, useInfiniteClients } from '@/hooks/use-clients';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useInfiniteQuotes } from '@/hooks/use-quotes';
import { useTenant } from '@/hooks/use-tenant';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { newInvoiceHref, newQuoteHref } from '@/lib/navigation/new-document';
import { getClientDisplayName, getClientSecondaryLabel, type Client } from '@/types/client';

const CLIENT_TABS: DesktopTab[] = [
  { id: 'info', label: 'Informations' },
  { id: 'invoices', label: 'Factures' },
  { id: 'quotes', label: 'Devis' },
  { id: 'history', label: 'Historique' },
];

export function ClientsDesktopScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { isSwitching } = useTenant();
  const { selected, search: searchParam } = useLocalSearchParams<{
    selected?: string | string[];
    search?: string | string[];
  }>();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const raw = selected;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (id) {
      setSelectedId(id);
    }
  }, [selected]);

  useEffect(() => {
    const raw = searchParam;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) {
      setSearch(value);
    }
  }, [searchParam]);

  const {
    clients,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteClients(debouncedSearch);

  const { data: selectedClient, isLoading: detailLoading } = useClient(selectedId ?? '');
  const { invoices } = useInfiniteInvoices('', 'all');
  const { quotes } = useInfiniteQuotes('', 'all');

  const clientInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.clientId === selectedId),
    [invoices, selectedId],
  );
  const clientQuotes = useMemo(
    () => quotes.filter((quote) => quote.clientId === selectedId),
    [quotes, selectedId],
  );

  const tabsWithCounts: DesktopTab[] = CLIENT_TABS.map((tab) => {
    if (tab.id === 'invoices') {
      return { ...tab, count: clientInvoices.length };
    }
    if (tab.id === 'quotes') {
      return { ...tab, count: clientQuotes.length };
    }
    return tab;
  });

  const isInitialLoading = (isLoading || isSwitching) && clients.length === 0;

  function handleSelect(client: Client) {
    setSelectedId(client.id);
    setActiveTab('info');
    router.replace(`/clients?selected=${encodeURIComponent(client.id)}` as Href);
  }

  return (
    <View style={styles.root}>
      <DesktopTopHeader
        actions={
          <View style={styles.headerActions}>
            <Button
              onPress={() => router.push('/clients/new?ai=1' as Href)}
              title="Ajouter par IA"
              variant="ghost"
            />
            <Button
              onPress={() => router.push('/clients/new' as Href)}
              title="Nouveau client"
            />
          </View>
        }
        subtitle="CRM — gérez vos relations clients"
        title="Clients"
      />

      <MasterDetailLayout
        detail={
          <DesktopPanel
            flex={1}
            title={selectedClient ? getClientDisplayName(selectedClient) : 'Fiche client'}>
            {!selectedId ? (
              <AppText color="secondary" style={styles.emptyDetail} variant="body">
                Sélectionnez un client dans la liste pour afficher sa fiche complète.
              </AppText>
            ) : detailLoading || !selectedClient ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <>
                <DesktopTabs
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  tabs={tabsWithCounts}
                />
                <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                  {activeTab === 'info' ? (
                    <View style={styles.detailBody}>
                      <ClientDetailView client={selectedClient} />
                      <View style={styles.detailActions}>
                        <Button
                          onPress={() =>
                            router.push(
                              newInvoiceHref(selectedClient.id, {
                                replay: clientInvoices.length > 0,
                              }),
                            )
                          }
                          title={
                            clientInvoices.length > 0
                              ? 'Comme la dernière fois'
                              : 'Nouvelle facture'
                          }
                        />
                        <Button
                          onPress={() => router.push(newQuoteHref(selectedClient.id))}
                          title="Nouveau devis"
                          variant="ghost"
                        />
                        <Button
                          onPress={() =>
                            router.push(`/clients/${selectedClient.id}/edit` as Href)
                          }
                          title="Modifier"
                          variant="ghost"
                        />
                      </View>
                    </View>
                  ) : null}

                  {activeTab === 'invoices' ? (
                    <ClientDocumentsTab
                      emptyMessage="Aucune facture pour ce client."
                      items={clientInvoices.map((invoice) => ({
                        id: invoice.id,
                        number: invoice.number,
                        amount: invoice.totalTtc,
                        date: invoice.issuedAt ?? invoice.createdAt,
                      }))}
                      onPress={(id) =>
                        router.push(`/invoices?selected=${encodeURIComponent(id)}` as Href)
                      }
                    />
                  ) : null}

                  {activeTab === 'quotes' ? (
                    <ClientDocumentsTab
                      emptyMessage="Aucun devis pour ce client."
                      items={clientQuotes.map((quote) => ({
                        id: quote.id,
                        number: quote.number,
                        amount: quote.totalTtc,
                        date: quote.issuedAt ?? quote.createdAt,
                      }))}
                      onPress={(id) =>
                        router.push(`/quotes?selected=${encodeURIComponent(id)}` as Href)
                      }
                    />
                  ) : null}

                  {activeTab === 'history' ? (
                    <View style={styles.history}>
                      <Text style={styles.historyTitle}>Historique d'activité</Text>
                      {[...clientInvoices, ...clientQuotes]
                        .sort(
                          (a, b) =>
                            new Date(b.issuedAt ?? b.createdAt).getTime() -
                            new Date(a.issuedAt ?? a.createdAt).getTime(),
                        )
                        .slice(0, 10)
                        .map((doc) => (
                          <View key={doc.id} style={styles.historyRow}>
                            <Text style={styles.historyLabel}>{doc.number}</Text>
                            <Text style={styles.historyMeta}>
                              {formatDate(doc.issuedAt ?? doc.createdAt)} ·{' '}
                              {formatPriceHT(doc.totalTtc)}
                            </Text>
                          </View>
                        ))}
                      {clientInvoices.length === 0 && clientQuotes.length === 0 ? (
                        <Text style={styles.historyEmpty}>Aucune activité enregistrée.</Text>
                      ) : null}
                    </View>
                  ) : null}
                </ScrollView>
              </>
            )}
          </DesktopPanel>
        }
        list={
          <DesktopPanel flex={0} style={styles.listPanel}>
            <View style={styles.listToolbar}>
              <DesktopSearchInput onChangeText={setSearch} value={search} />
            </View>

            {isInitialLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : (
              <DesktopDataTable
                columns={[
                  {
                    id: 'name',
                    label: 'Client',
                    flex: 1,
                    render: (client: Client) => (
                      <View>
                        <Text numberOfLines={1} style={styles.listPrimary}>
                          {getClientDisplayName(client)}
                        </Text>
                        {getClientSecondaryLabel(client) ? (
                          <Text numberOfLines={1} style={styles.listSecondary}>
                            {getClientSecondaryLabel(client)}
                          </Text>
                        ) : null}
                      </View>
                    ),
                  },
                  {
                    id: 'email',
                    label: 'Email',
                    flex: 1,
                    render: (client: Client) => (
                      <Text numberOfLines={1} style={styles.listSecondary}>
                        {client.email ?? '—'}
                      </Text>
                    ),
                  },
                ]}
                data={clients}
                emptyMessage="Aucun client trouvé."
                keyExtractor={(client) => client.id}
                onRowPress={handleSelect}
                selectedKey={selectedId}
              />
            )}

            {hasNextPage ? (
              <View style={styles.loadMore}>
                <Button
                  loading={isFetchingNextPage}
                  onPress={() => fetchNextPage()}
                  title="Charger plus"
                  variant="ghost"
                />
              </View>
            ) : null}
          </DesktopPanel>
        }
      />
    </View>
  );
}

function ClientDocumentsTab({
  items,
  emptyMessage,
  onPress,
}: {
  items: { id: string; number: string; amount: number; date: string }[];
  emptyMessage: string;
  onPress: (id: string) => void;
}) {
  const styles = useTabStyles();

  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.rowMain}>
            <Text style={styles.number}>{item.number}</Text>
            <Text style={styles.meta}>{formatDate(item.date)}</Text>
          </View>
          <Text style={styles.amount}>{formatPriceHT(item.amount)}</Text>
          <Button onPress={() => onPress(item.id)} title="Voir" variant="ghost" />
        </View>
      ))}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: { flex: 1, minHeight: 0 },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    listPanel: { flex: 0 },
    listToolbar: {
      padding: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    listPrimary: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    listSecondary: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    detailScroll: { flex: 1 },
    detailBody: { padding: spacing.lg, gap: spacing.lg },
    detailActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    history: { padding: spacing.lg, gap: spacing.sm },
    historyTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    historyRow: {
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: 2,
    },
    historyLabel: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    historyMeta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    historyEmpty: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    loadMore: { padding: spacing.sm },
    emptyDetail: { padding: spacing.xl, textAlign: 'center' },
    loader: { marginTop: spacing.xl },
  }));

const useTabStyles = () =>
  useThemedStyles((colors) => ({
    list: { padding: spacing.lg, gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowMain: { flex: 1, gap: 2 },
    number: { ...typography.subheadlineMedium, color: colors.text },
    meta: { ...typography.caption1, color: colors.textSecondary },
    amount: { ...typography.subheadlineMedium, color: colors.text },
    empty: {
      ...typography.subheadline,
      color: colors.textSecondary,
      padding: spacing.xl,
      textAlign: 'center',
    },
  }));
