import { router, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SettingsRow, SettingsSection } from '@/components/settings';
import { IntegrationStatusPill } from '@/components/integrations/integration-pieces';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useEbayIntegration } from '@/hooks/use-ebay-integration';

/**
 * Réglages → Intégrations.
 * Liste les connexions e-commerce disponibles avec leur état réel.
 */
export default function IntegrationsSettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { integration, loading, error } = useEbayIntegration();

  return (
    <SettingsScreenFrame title="Intégrations">
      <SettingsSection title="E-commerce">
        <Text style={styles.lead}>
          Importez vos commandes depuis une place de marché pour préparer vos factures INVEQ. Les
          commandes ne créent jamais de facture automatiquement.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.rowWrapper}>
            <SettingsRow
              label="eBay"
              onPress={() => router.push('/settings/integrations-ebay' as Href)}
              trailing={<IntegrationStatusPill status={integration?.status ?? null} />}
            />
          </View>
        )}

        {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
      </SettingsSection>

      <SettingsSection
        footer="D’autres places de marché pourront être ajoutées ultérieurement."
        title="À propos">
        <Text style={styles.lead}>
          INVEQ n’accède qu’en lecture à vos commandes. Aucune modification n’est effectuée sur
          votre compte de place de marché.
        </Text>
      </SettingsSection>
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) =>
    StyleSheet.create({
      lead: {
        ...typography.subheadline,
        color: colors.textSecondary,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
        lineHeight: 20,
      },
      rowWrapper: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.separator,
      },
      loader: {
        marginVertical: spacing.md,
      },
      error: {
        ...typography.footnote,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
      },
    }),
  );
}
