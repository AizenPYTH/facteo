import { router, type Href } from 'expo-router';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import {
  SettingsProfileSummary,
  SettingsRow,
  SettingsSection,
} from '@/components/settings';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSubscription } from '@/hooks/use-subscription';
import { getAppVersionInfo } from '@/lib/dev/environment';
import { useDeveloperMode } from '@/providers/developer-mode-provider';
import { useThemePreference } from '@/providers/theme-preference-provider';
import { useToast } from '@/providers/toast-provider';

export function SettingsDesktopContent() {
  const styles = useStyles();
  const colors = useColors();
  const { user, signOut } = useAuth();
  const companyProfile = useCompanyProfile();
  const { isPremium, isDeveloperModeEnabled } = useSubscription();
  const { preference, setPreference } = useThemePreference();
  const { showError, showSuccess } = useToast();
  const {
    isEnabled: isDevModeEnabled,
    enableDeveloperMode,
    disableDeveloperMode,
  } = useDeveloperMode();
  const versionInfo = getAppVersionInfo();

  const isDarkMode = preference === 'dark';
  const darkModeSupported = Platform.OS !== 'web';

  const planLabel = isDeveloperModeEnabled
    ? 'Premium · mode développeur'
    : isPremium
      ? 'FACTEO Premium'
      : 'FACTEO Standard';

  async function handleToggleDarkMode(value: boolean) {
    if (!darkModeSupported) {
      showSuccess('Le mode sombre sera bientôt disponible sur le web.');
      return;
    }

    await setPreference(value ? 'dark' : 'light');
  }

  async function handleLogout() {
    const { error } = await signOut();

    if (error) {
      Alert.alert('Erreur', 'Impossible de vous déconnecter. Réessayez.');
      return;
    }

    router.replace('/login' as Href);
  }

  return (
    <View style={styles.root}>
      <DesktopPanel title="Compte">
        <View style={styles.panelBody}>
          <SettingsProfileSummary
            companyName={companyProfile.data?.companyName}
            email={user?.email}
            onPressPlan={() => router.push('/settings/premium' as Href)}
            planLabel={planLabel}
          />

          <SettingsSection title="Identité">
            <SettingsRow label="Email" trailing={<Text style={styles.value}>{user?.email}</Text>} />
            <View style={styles.separator} />
            <SettingsRow
              label="Mot de passe"
              onPress={() =>
                showSuccess('La modification du mot de passe sera bientôt disponible sur le web.')
              }
            />
          </SettingsSection>

          <NotificationPreferencesSection />

          <SettingsSection
            footer={
              darkModeSupported
                ? 'Le thème s’applique immédiatement sur l’appareil.'
                : 'Bientôt disponible sur le web.'
            }
            title="Apparence">
            <SettingsRow
              label="Mode sombre"
              onPress={
                darkModeSupported
                  ? undefined
                  : () => showSuccess('Bientôt disponible sur le web.')
              }
              trailing={
                <Switch
                  disabled={!darkModeSupported}
                  onValueChange={(value) => {
                    void handleToggleDarkMode(value);
                  }}
                  thumbColor={colors.surface}
                  trackColor={{ false: colors.borderStrong, true: colors.primary }}
                  value={isDarkMode}
                />
              }
            />
          </SettingsSection>

          <SettingsSection title="Session">
            <SettingsRow label="Se déconnecter" onPress={() => void handleLogout()} />
          </SettingsSection>

          {isDevModeEnabled ? (
            <SettingsSection title="Mode développeur">
              <View style={styles.devActions}>
                <Text style={styles.devActiveLabel}>
                  Mode développeur actif — tout est débloqué.
                </Text>
                <Button
                  onPress={() => void disableDeveloperMode()}
                  title="Désactiver"
                  variant="ghost"
                />
              </View>
            </SettingsSection>
          ) : null}
        </View>
      </DesktopPanel>

      <Text style={styles.version}>
        FACTEO v{versionInfo.version} · build {versionInfo.buildNumber}
      </Text>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      gap: spacing.lg,
      padding: spacing.lg,
    },
    panelBody: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
    value: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    devActions: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    devActiveLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    version: {
      ...typography.footnote,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  }));
