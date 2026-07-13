import { router, type Href } from 'expo-router';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  SettingsProfileSummary,
  SettingsRow,
  SettingsScreenHeader,
  SettingsSection,
} from '@/components/settings';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';
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

export default function SettingsScreen() {
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

  async function handleEnableDeveloperMode() {
    try {
      await enableDeveloperMode();
      showSuccess('Mode développeur activé. Toutes les fonctionnalités sont débloquées.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleDisableDeveloperMode() {
    try {
      await disableDeveloperMode();
      showSuccess('Mode développeur désactivé.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleLogout() {
    const { error } = await signOut();

    if (error) {
      Alert.alert('Erreur', 'Impossible de vous déconnecter. Réessayez.');
      return;
    }

    router.replace('/login' as Href);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer le compte',
      'La suppression définitive de votre compte nécessite une assistance. Vous allez être déconnecté. Contactez le support pour finaliser la suppression.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await signOut();
              router.replace('/login' as Href);
            })();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <SettingsScreenHeader title="Paramètres" />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SettingsProfileSummary
          companyName={companyProfile.data?.companyName}
          email={user?.email}
          onPressPlan={() => router.push('/settings/premium' as Href)}
          planLabel={planLabel}
        />

        <SettingsSection title="Entreprise">
          <SettingsRow
            label="Mes entreprises"
            onPress={() => router.push('/settings/companies' as Href)}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Profil entreprise"
            onPress={() => router.push('/company' as Href)}
          />
        </SettingsSection>

        <SettingsSection title="Numérotation & documents">
          <SettingsRow
            label="Préfixes et numéros"
            onPress={() => router.push('/settings/numbering' as Href)}
          />
          <View style={styles.separator} />
          <SettingsRow
            label="Modèles de factures et devis"
            onPress={() => router.push('/settings/templates' as Href)}
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
            onPress={darkModeSupported ? undefined : () => showSuccess('Bientôt disponible sur le web.')}
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

        <SettingsSection title="Compte">
          <SettingsRow label="Se déconnecter" onPress={() => void handleLogout()} />
          <View style={styles.separator} />
          <SettingsRow destructive label="Supprimer le compte" onPress={handleDeleteAccount} />
        </SettingsSection>

        <SettingsSection title="Mode développeur">
          {isDevModeEnabled ? (
            <View style={styles.devActions}>
              <Text style={styles.devActiveLabel}>Mode développeur actif — tout est débloqué.</Text>
              <Button
                onPress={() => {
                  void handleDisableDeveloperMode();
                }}
                title="Désactiver le mode développeur"
                variant="ghost"
              />
            </View>
          ) : (
            <View style={styles.devActions}>
              <Button
                onPress={() => {
                  void handleEnableDeveloperMode();
                }}
                title="Activer le mode développeur"
              />
            </View>
          )}
        </SettingsSection>

        <Text style={styles.version}>
          FACTEO v{versionInfo.version} · build {versionInfo.buildNumber}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur est survenue.';
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
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
      marginTop: spacing.xs,
    },
  }));
}
