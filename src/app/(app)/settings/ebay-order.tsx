import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SettingsSection } from '@/components/settings';
import {
  EmptyState,
  InfoRow,
  NoticeBox,
} from '@/components/integrations/integration-pieces';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { useInfiniteClients } from '@/hooks/use-clients';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useEbayOrder } from '@/hooks/use-ebay-orders';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { linkOrderToInvoice } from '@/lib/integrations/ebay/api';
import { formatMoney } from '@/lib/integrations/money';
import {
  buildClientFormFromBuyer,
  buildOrderInvoiceDraft,
  draftTotalMismatch,
} from '@/lib/integrations/ebay/order-to-invoice';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import { useToast } from '@/providers/toast-provider';
import { getClientDisplayName } from '@/types/client';
import { describeFulfillmentStatus, describePaymentStatus } from '@/types/integrations';
import { useQueryClient } from '@tanstack/react-query';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString('fr-FR') : '—';
}

/**
 * Détail d'une commande eBay et création MANUELLE d'une facture INVEQ.
 *
 * La commande n'est qu'une source de données : la facture est produite par
 * `createInvoice()`, le moteur existant, après validation explicite.
 */
export default function EbayOrderScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { showError, showSuccess } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useEbayOrder(id ?? '');
  const { createInvoice } = useInvoiceMutations();
  const { createClient } = useClientMutations();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { clients, isLoading: clientsLoading } = useInfiniteClients(debouncedSearch);

  const draft = useMemo(() => (order ? buildOrderInvoiceDraft(order) : null), [order]);
  const mismatch = useMemo(
    () => (order && draft ? draftTotalMismatch(order, draft.lines) : null),
    [order, draft],
  );

  const busy = createInvoice.isPending || createClient.isPending;

  const handleCreateClient = useCallback(async () => {
    if (!order) return;
    try {
      const created = await createClient.mutateAsync(buildClientFormFromBuyer(order.buyer));
      setSelectedClientId(created.id);
      showSuccess('Client créé depuis les données eBay.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Création du client impossible.');
    }
  }, [createClient, order, showError, showSuccess]);

  const handleCreateInvoice = useCallback(async () => {
    if (!order || !draft || !selectedClientId) return;
    try {
      const invoice = await createInvoice.mutateAsync({
        clientId: selectedClientId,
        lines: draft.lines,
        notes: draft.notes,
      });
      // Le rattachement est refusé par la base si la commande est déjà facturée.
      await linkOrderToInvoice(order.id, invoice.id);
      await queryClient.invalidateQueries({ queryKey: integrationsQueryKeys.all });
      showSuccess(`Facture ${invoice.number} créée.`);
      router.replace(`/invoices/${invoice.id}` as Href);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Création de la facture impossible.');
    }
  }, [createInvoice, draft, order, queryClient, selectedClientId, showError, showSuccess]);

  if (isLoading) {
    return (
      <SettingsScreenFrame title="Commande eBay">
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </SettingsScreenFrame>
    );
  }

  if (!order || !draft) {
    return (
      <SettingsScreenFrame title="Commande eBay">
        <EmptyState
          title="Commande introuvable"
          message="Cette commande n’existe pas ou n’appartient pas à l’entreprise sélectionnée."
        />
      </SettingsScreenFrame>
    );
  }

  const alreadyInvoiced = Boolean(order.invoiceId);
  const blocking = draft.warnings.filter((warning) => warning.level === 'blocking');
  const canSubmit =
    !alreadyInvoiced && Boolean(selectedClientId) && (blocking.length === 0 || acknowledged);

  return (
    <SettingsScreenFrame title={`Commande ${order.externalOrderId}`}>
      <SettingsSection title="Commande eBay">
        <View style={styles.block}>
          <InfoRow label="Numéro eBay" value={order.externalOrderId} />
          {order.orderReference ? (
            <InfoRow label="Référence des ventes" value={order.orderReference} />
          ) : null}
          <InfoRow label="Passée le" value={formatDate(order.orderCreatedAt)} />
          <InfoRow label="Paiement" value={describePaymentStatus(order.paymentStatus)} />
          <InfoRow label="Expédition" value={describeFulfillmentStatus(order.fulfillmentStatus)} />
          <InfoRow
            label="Sous-total articles"
            value={formatMoney(order.subtotalAmount, order.currency)}
          />
          <InfoRow label="Livraison" value={formatMoney(order.shippingAmount, order.currency)} />
          <InfoRow label="Total eBay" value={formatMoney(order.totalAmount, order.currency)} />
          {order.collectAndRemit ? (
            <InfoRow
              label="Dont taxe collectée par eBay"
              value={formatMoney(order.marketplaceTaxAmount, order.currency)}
            />
          ) : null}
          {order.environment === 'sandbox' ? (
            <InfoRow label="Environnement" value="Sandbox (test)" />
          ) : null}
        </View>
      </SettingsSection>

      <SettingsSection title="Acheteur">
        <View style={styles.block}>
          <InfoRow
            label="Nom"
            value={order.buyer.fullName ?? order.buyer.companyName ?? 'Non communiqué'}
          />
          <InfoRow label="Pseudo eBay" value={order.buyerUsername ?? '—'} />
          <InfoRow label="E-mail" value={order.buyer.email ?? 'Non communiqué'} />
          <InfoRow
            label="Adresse"
            value={
              order.buyer.address
                ? [
                    order.buyer.address.addressLine1,
                    order.buyer.address.addressLine2,
                    [order.buyer.address.postalCode, order.buyer.address.city]
                      .filter(Boolean)
                      .join(' '),
                    order.buyer.address.countryCode,
                  ]
                    .filter(Boolean)
                    .join('\n')
                : 'Non communiquée'
            }
          />
        </View>
      </SettingsSection>

      {draft.warnings.length > 0 ? (
        <SettingsSection title="À vérifier">
          <View style={styles.warnings}>
            {draft.warnings.map((warning) => (
              <NoticeBox
                key={warning.code}
                tone={warning.level === 'blocking' ? 'warning' : 'info'}
                message={warning.message}
              />
            ))}
            {mismatch ? (
              <NoticeBox
                tone="info"
                message={`Le brouillon diffère du total eBay hors taxe marketplace de ${mismatch} ${order.currency ?? ''}. Vérifiez les lignes avant validation.`}
              />
            ) : null}
          </View>
        </SettingsSection>
      ) : null}

      <SettingsSection title="Lignes proposées">
        <View style={styles.block}>
          {draft.lines.map((line) => (
            <View key={line.id} style={styles.lineRow}>
              <Text style={styles.lineTitle}>{line.title}</Text>
              <Text style={styles.lineMeta}>
                {line.quantity} × {formatMoney(line.unitPrice, order.currency)} · TVA à renseigner
              </Text>
            </View>
          ))}
          <Text style={styles.hint}>
            Les taux de TVA sont volontairement vides. Vous les renseignerez dans la facture, qui
            reste modifiable tant qu’elle est en brouillon.
          </Text>
        </View>
      </SettingsSection>

      {alreadyInvoiced ? (
        <SettingsSection title="Facturation">
          <View style={styles.block}>
            <NoticeBox
              tone="info"
              message="Cette commande a déjà donné lieu à une facture INVEQ. Une commande ne peut être facturée qu’une seule fois."
            />
            <Button
              title="Ouvrir la facture"
              variant="ghost"
              onPress={() => router.push(`/invoices/${order.invoiceId}` as Href)}
            />
          </View>
        </SettingsSection>
      ) : (
        <>
          <SettingsSection title="Client de la facture">
            <View style={styles.block}>
              <Button
                disabled={busy || (!order.buyer.fullName && !order.buyer.companyName)}
                loading={createClient.isPending}
                title="Créer le client depuis eBay"
                variant="ghost"
                onPress={() => void handleCreateClient()}
              />
              <TextField
                autoCapitalize="none"
                label="Ou choisir un client existant"
                onChangeText={setSearch}
                placeholder="Rechercher un client"
                value={search}
              />
              {clientsLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.loaderSmall} />
              ) : (
                <ScrollView style={styles.clientList} nestedScrollEnabled>
                  {clients.slice(0, 12).map((client) => {
                    const selected = client.id === selectedClientId;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={client.id}
                        onPress={() => setSelectedClientId(client.id)}
                        style={[styles.clientRow, selected && { borderColor: colors.primary }]}>
                        <Text style={styles.clientName}>{getClientDisplayName(client)}</Text>
                        {client.email ? (
                          <Text style={styles.clientMeta}>{client.email}</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                  {clients.length === 0 ? (
                    <Text style={styles.hint}>Aucun client ne correspond à cette recherche.</Text>
                  ) : null}
                </ScrollView>
              )}
            </View>
          </SettingsSection>

          <SettingsSection title="Validation">
            <View style={styles.block}>
              {blocking.length > 0 ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acknowledged }}
                  onPress={() => setAcknowledged((value) => !value)}
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      acknowledged && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  />
                  <Text style={styles.checkboxLabel}>
                    J’ai lu les {blocking.length} point(s) à vérifier ci-dessus et je confirme
                    vouloir créer la facture.
                  </Text>
                </Pressable>
              ) : null}

              <Button
                disabled={!canSubmit || busy}
                loading={createInvoice.isPending}
                title="Créer la facture INVEQ"
                onPress={() => void handleCreateInvoice()}
              />
              {!selectedClientId ? (
                <Text style={styles.hint}>Sélectionnez ou créez un client pour continuer.</Text>
              ) : null}
            </View>
          </SettingsSection>
        </>
      )}
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) =>
    StyleSheet.create({
      block: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      },
      warnings: {
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
      },
      lineRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
        paddingVertical: spacing.sm,
        gap: 2,
      },
      lineTitle: {
        ...typography.subheadlineMedium,
        color: colors.text,
      },
      lineMeta: {
        ...typography.footnote,
        color: colors.textSecondary,
      },
      hint: {
        ...typography.footnote,
        color: colors.textSecondary,
        lineHeight: 18,
      },
      clientList: {
        maxHeight: 260,
      },
      clientRow: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.sm,
        marginBottom: spacing.xs,
        gap: 2,
      },
      clientName: {
        ...typography.subheadlineMedium,
        color: colors.text,
      },
      clientMeta: {
        ...typography.footnote,
        color: colors.textSecondary,
      },
      checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
      },
      checkbox: {
        width: 22,
        height: 22,
        borderRadius: radius.xs,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        marginTop: 1,
      },
      checkboxLabel: {
        ...typography.subheadline,
        color: colors.text,
        flex: 1,
        lineHeight: 20,
      },
      loader: {
        marginVertical: spacing.xl,
      },
      loaderSmall: {
        marginVertical: spacing.sm,
      },
    }),
  );
}
