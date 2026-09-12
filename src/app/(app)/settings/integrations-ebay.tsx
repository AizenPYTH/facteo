import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';

import { SettingsSection } from '@/components/settings';
import {
  InfoRow,
  IntegrationStatusPill,
  NoticeBox,
} from '@/components/integrations/integration-pieces';
import { Button } from '@/components/ui/button';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useEbayIntegration } from '@/hooks/use-ebay-integration';
import { useToast } from '@/providers/toast-provider';
import type { IntegrationEnvironment } from '@/types/integrations';

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '—';
  return new Date(timestamp).toLocaleString('fr-FR');
}

const ENVIRONMENT_LABELS: Record<IntegrationEnvironment, string> = {
  production: 'Production',
  sandbox: 'Sandbox (test)',
};

/**
 * Réglages → Intégrations → eBay.
 *
 * Connexion OAuth, synchronisation manuelle, état réel. Aucun secret eBay
 * n'est manipulé ici : l'application demande une URL d'autorisation au serveur
 * et l'ouvre dans le navigateur.
 */
export default function EbayIntegrationScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { showSuccess, showError, showInfo } = useToast();
  const params = useLocalSearchParams<{ ebay?: string; reason?: string }>();
  const handledCallback = useRef(false);

  const { companyId, integration, connected, needsReauth, loading, error, refresh, connect, sync, disconnect } =
    useEbayIntegration();

  const busy = connect.isPending || sync.isPending || disconnect.isPending;

  // Retour du callback OAuth (web) : l'URL porte ?ebay=connected|error.
  useEffect(() => {
    if (handledCallback.current || !params.ebay) return;
    handledCallback.current = true;
    if (params.ebay === 'connected') {
      showSuccess('Compte eBay connecté.');
      void refresh();
    } else {
      showError(`La connexion eBay a échoué${params.reason ? ` (${params.reason})` : ''}.`);
    }
  }, [params.ebay, params.reason, refresh, showError, showSuccess]);

  const handleConnect = useCallback(
    async (environment: IntegrationEnvironment) => {
      if (!companyId) return;
      try {
        const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
        const { authorizationUrl } = await connect.mutateAsync({
          environment,
          platform: isWeb ? 'web' : 'native',
          redirectTo: isWeb ? `${window.location.origin}/settings/integrations-ebay` : undefined,
        });
        handledCallback.current = false;
        await Linking.openURL(authorizationUrl);
        showInfo('Autorisez INVEQ dans la fenêtre eBay, puis revenez ici.');
      } catch (connectError) {
        showError(
          connectError instanceof Error ? connectError.message : 'Connexion eBay impossible.',
        );
      }
    },
    [companyId, connect, showError, showInfo],
  );

  const handleSync = useCallback(async () => {
    try {
      const result = await sync.mutateAsync();
      if (result.fetched === 0) {
        showInfo('Aucune nouvelle commande eBay depuis la dernière synchronisation.');
      } else {
        showSuccess(
          `${result.imported} commande(s) importée(s), ${result.updated} mise(s) à jour.`,
        );
      }
      if (result.truncated) {
        showInfo('Beaucoup de commandes à traiter : relancez la synchronisation pour la suite.');
      }
    } catch (syncError) {
      showError(syncError instanceof Error ? syncError.message : 'Synchronisation impossible.');
    }
  }, [showError, showInfo, showSuccess, sync]);

  function handleDisconnect() {
    Alert.alert(
      'Déconnecter eBay',
      'Les autorisations eBay seront supprimées. Les commandes déjà importées et les factures créées sont conservées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await disconnect.mutateAsync();
                showSuccess('Compte eBay déconnecté.');
              } catch (disconnectError) {
                showError(
                  disconnectError instanceof Error
                    ? disconnectError.message
                    : 'Déconnexion impossible.',
                );
              }
            })();
          },
        },
      ],
    );
  }

  const [showSandbox, setShowSandbox] = useState(false);

  return (
    <SettingsScreenFrame title="eBay">
      <SettingsSection title="Connexion">
        <View style={styles.headerRow}>
          <Text style={styles.lead}>
            INVEQ lit vos commandes eBay en lecture seule pour préparer vos factures.
          </Text>
          <View style={styles.pillRow}>
            <IntegrationStatusPill status={integration?.status ?? null} />
          </View>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {error ? <View style={styles.block}><NoticeBox tone="error" message={error} /></View> : null}

        {needsReauth ? (
          <View style={styles.block}>
            <NoticeBox
              tone="warning"
              title="Reconnexion nécessaire"
              message="L’autorisation eBay a expiré ou a été révoquée. Reconnectez le compte pour reprendre les synchronisations."
            />
          </View>
        ) : null}

        {integration?.lastSyncError ? (
          <View style={styles.block}>
            <NoticeBox
              tone="error"
              title="Dernière erreur"
              message={integration.lastSyncError}
            />
          </View>
        ) : null}

        {connected && !needsReauth ? (
          <View style={styles.block}>
            <InfoRow
              label="Environnement"
              value={ENVIRONMENT_LABELS[integration?.environment ?? 'production']}
            />
            <InfoRow label="Vendeur eBay" value={integration?.externalAccountId ?? '—'} />
            <InfoRow label="Connecté le" value={formatDateTime(integration?.connectedAt ?? null)} />
            <InfoRow
              label="Dernière synchronisation"
              value={formatDateTime(integration?.lastSyncAt ?? null)}
            />
            <InfoRow
              label="Autorisation valable jusqu’au"
              value={formatDateTime(integration?.refreshTokenExpiresAt ?? null)}
            />
            <InfoRow
              label="Commandes importées"
              value={String(integration?.ordersImported ?? 0)}
            />
            <InfoRow
              label="En attente de facturation"
              value={String(integration?.ordersPendingInvoice ?? 0)}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          {connected && !needsReauth ? (
            <>
              <Button
                disabled={busy}
                loading={sync.isPending}
                title="Synchroniser les commandes"
                onPress={() => void handleSync()}
              />
              <Button
                disabled={busy}
                title="Voir les commandes eBay"
                variant="ghost"
                onPress={() => router.push('/settings/ebay-orders' as Href)}
              />
              <Button
                disabled={busy}
                title="Déconnecter eBay"
                variant="ghost"
                onPress={handleDisconnect}
              />
            </>
          ) : (
            <>
              <Button
                disabled={busy || !companyId}
                loading={connect.isPending}
                title={needsReauth ? 'Reconnecter eBay' : 'Connecter mon compte eBay'}
                onPress={() => void handleConnect('production')}
              />
              <Button
                title={showSandbox ? 'Masquer les options de test' : 'Options de test'}
                variant="ghost"
                onPress={() => setShowSandbox((value) => !value)}
              />
              {showSandbox ? (
                <>
                  <Text style={styles.hint}>
                    L’environnement sandbox utilise des identifiants eBay distincts. Les commandes
                    de test restent séparées de vos commandes réelles.
                  </Text>
                  <Button
                    disabled={busy || !companyId}
                    title="Connecter un compte eBay Sandbox"
                    variant="ghost"
                    onPress={() => void handleConnect('sandbox')}
                  />
                </>
              ) : null}
            </>
          )}
        </View>
      </SettingsSection>

      <SettingsSection title="Ce qu’INVEQ récupère">
        <Text style={styles.lead}>
          Numéro de commande, dates, statuts, articles, montants et adresse de livraison. Le
          téléphone, l’identifiant fiscal de l’acheteur et ses commentaires ne sont pas conservés.
        </Text>
        <Text style={styles.lead}>
          eBay cesse de transmettre l’e-mail de l’acheteur après 14 jours, et son nom ainsi que sa
          rue après 90 jours. INVEQ enregistre donc ces informations dès l’import : synchronisez
          régulièrement pour ne rien perdre.
        </Text>
      </SettingsSection>
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) =>
    StyleSheet.create({
      headerRow: {
        gap: spacing.sm,
        paddingBottom: spacing.sm,
      },
      pillRow: {
        paddingHorizontal: spacing.md,
      },
      lead: {
        ...typography.subheadline,
        color: colors.textSecondary,
        lineHeight: 20,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
      },
      block: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
      },
      actions: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        gap: spacing.sm,
      },
      hint: {
        ...typography.footnote,
        color: colors.textSecondary,
        lineHeight: 18,
      },
      loader: {
        marginVertical: spacing.md,
      },
    }),
  );
}
