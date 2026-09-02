import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { SettingsSection } from '@/components/settings';
import { Button } from '@/components/ui/button';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useTenant } from '@/hooks/use-tenant';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import {
  disconnectSuperPdp,
  getSuperPdpConnection,
  startSuperPdpOAuth,
  syncSuperPdp,
  type SuperPdpConnectionPublic,
} from '@/lib/superpdp/api';
import { useToast } from '@/providers/toast-provider';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return value;
  }
}

export default function EInvoicingSettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { companyId, activeCompany } = useTenant();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<SuperPdpConnectionPublic | null>(null);
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await getSuperPdpConnection(companyId, 'status');
      setConnected(result.connected);
      setConnection(result.connection);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [companyId, showError]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleConnect() {
    if (!companyId) return;
    setBusy(true);
    try {
      const redirectTo =
        Platform.OS === 'web' ? `${window.location.origin}/settings/e-invoicing` : undefined;
      const { authorizationUrl } = await startSuperPdpOAuth(companyId, redirectTo);
      const opened = await Linking.openURL(authorizationUrl);
      if (!opened && Platform.OS !== 'web') {
        showError('Impossible d’ouvrir SUPER PDP.');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Connexion impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!companyId) return;
    setBusy(true);
    try {
      const result = await getSuperPdpConnection(companyId, 'verify');
      setConnected(result.connected);
      setConnection(result.connection);
      if (result.verifyError) showError(result.verifyError);
      else showSuccess('Connexion vérifiée.');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Vérification impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (!companyId) return;
    setBusy(true);
    try {
      const result = await syncSuperPdp(companyId, 'both');
      showSuccess(
        `Synchronisation terminée · ${result.updatedOutgoing} émise(s) · ${result.upsertedIncoming} reçue(s)`,
      );
      await refresh();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Synchronisation impossible.');
    } finally {
      setBusy(false);
    }
  }

  function handleDisconnect() {
    if (!companyId) return;
    Alert.alert('Déconnecter SUPER PDP', 'Les jetons de cette entreprise seront révoqués localement.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await disconnectSuperPdp(companyId);
              setConnected(false);
              setConnection(null);
              showSuccess('SUPER PDP déconnecté.');
            } catch (error) {
              showError(error instanceof Error ? error.message : 'Déconnexion impossible.');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  const statusLabel = !connected
    ? '⚪ Non connecté'
    : connection?.status === 'needs_review'
      ? '🟠 Vérification SUPER PDP en cours'
      : '🟢 SUPER PDP connecté';

  return (
    <SettingsScreenFrame title="Facturation électronique">
      <SettingsSection title="Facturation électronique">
        <Text style={styles.lead}>
          Connectez votre entreprise à une Plateforme Agréée pour envoyer et recevoir vos factures
          électroniques.
        </Text>
        <Text style={[styles.status, { color: colors.text }]}>{statusLabel}</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
        ) : null}

        {!connected ? (
          <Button
            disabled={busy || !companyId}
            label={busy ? 'Connexion…' : 'Connecter SUPER PDP'}
            onPress={() => void handleConnect()}
            style={styles.button}
          />
        ) : (
          <View style={styles.connectedBox}>
            <Text style={styles.meta}>Entreprise : {connection?.remote_company_name || activeCompany?.name || '—'}</Text>
            <Text style={styles.meta}>
              Statut réception : {connection?.reception_enabled ? 'Activé' : 'Non activé'}
            </Text>
            <Text style={styles.meta}>
              Statut émission : {connection?.emission_enabled ? 'Activé' : 'Non activé'}
            </Text>
            <Text style={styles.meta}>
              Annuaire :{' '}
              {connection?.directory_registered == null
                ? 'À vérifier'
                : connection.directory_registered
                  ? 'Inscrit'
                  : 'Non inscrit'}
            </Text>
            <Text style={styles.meta}>Dernière synchronisation : {formatDate(connection?.last_sync_at)}</Text>
            {connection?.remote_env ? (
              <Text style={styles.meta}>Environnement SUPER PDP : {connection.remote_env}</Text>
            ) : null}
            {connection?.last_error ? (
              <Text style={[styles.meta, { color: colors.danger }]}>{connection.last_error}</Text>
            ) : null}

            <Button
              disabled={busy}
              label="Vérifier la connexion"
              onPress={() => void handleVerify()}
              style={styles.button}
              variant="ghost"
            />
            <Button
              disabled={busy}
              label="Synchroniser"
              onPress={() => void handleSync()}
              style={styles.button}
              variant="ghost"
            />
            <Button
              disabled={busy}
              label="Factures reçues"
              onPress={() => router.push('/settings/e-invoicing-received' as Href)}
              style={styles.button}
              variant="ghost"
            />
            <Button
              disabled={busy}
              label="Déconnecter"
              onPress={handleDisconnect}
              style={styles.button}
              variant="ghost"
            />
          </View>
        )}
      </SettingsSection>

      <SettingsSection title="Portabilité">
        <Text style={styles.lead}>
          Si votre entreprise était rattachée à une autre plateforme (ex. Qonto), le transfert
          administratif est géré par SUPER PDP. Utilisez « Vérifier la connexion » après migration.
        </Text>
      </SettingsSection>
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((c) =>
    StyleSheet.create({
      lead: {
        ...typography.body,
        color: c.textSecondary,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.md,
      },
      status: {
        ...typography.subtitle,
        fontWeight: '600',
        marginBottom: spacing.md,
        paddingHorizontal: spacing.md,
      },
      connectedBox: {
        paddingHorizontal: spacing.md,
        gap: spacing.xs,
      },
      meta: {
        ...typography.body,
        color: c.text,
        marginBottom: spacing.xs,
      },
      button: {
        marginTop: spacing.sm,
      },
    }),
  );
}
