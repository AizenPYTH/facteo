import { router, type Href } from 'expo-router';
import { Alert, Linking, Platform, StyleSheet, Switch, Text, View } from 'react-native';

import {
  SettingsProfileSummary,
  SettingsRow,
  SettingsSection,
} from '@/components/settings';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { SettingsDesktopContent } from '@/components/web/desktop/screens/settings-desktop-content';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { MARKETING_CONTACT } from '@/constants/marketing/site';
import { openHelpPage, openLegalPage, openMarketingSite } from '@/lib/legal/open-legal-page';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSubscription } from '@/hooks/use-subscription';
import { getAppVersionInfo } from '@/lib/app-version';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';
import { useThemePreference } from '@/providers/theme-preference-provider';
import { useToast } from '@/providers/toast-provider';

export default function SettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const useDesktopSettings = isWeb && (isDesktop || isTablet);
  const { user, signOut } = useAuth();
  const companyProfile = useCompanyProfile();
  const { subscription } = useSubscription();
  const { preference, setPreference } = useThemePreference();
  const { showSuccess } = useToast();
  const versionInfo = getAppVersionInfo();

  const isDarkMode = preference === 'dark';
  const darkModeSupported = Platform.OS !== 'web';
  const planLabel = `INVEQ ${getEffectivePlanDisplayName(subscription?.effectivePlanId ?? 'micro')}`;

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

  function handleDeleteAccount() {
    Alert.alert(
      'Supprimer le compte',
      `Conformément aux règles App Store, vous pouvez demander la suppression définitive de votre compte et de vos données.\n\nÉcrivez à ${MARKETING_CONTACT.support} depuis l’adresse e-mail de votre compte. Nous traiterons la demande sous 30 jours.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Contacter le support',
          onPress: () => {
            void Linking.openURL(
              `mailto:${MARKETING_CONTACT.support}?subject=${encodeURIComponent(
                'Demande de suppression de compte INVEQ',
              )}&body=${encodeURIComponent(
                `Bonjour,\n\nJe souhaite supprimer définitivement mon compte INVEQ associé à l’adresse : ${user?.email ?? ''}.\n\nMerci.`,
              )}`,
            );
          },
        },
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
    <SettingsScreenFrame title="Paramètres">
      {useDesktopSettings ? (
        <SettingsDesktopContent />
      ) : (
        <>
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
              onPress={
                darkModeSupported ? undefined : () => showSuccess('Bientôt disponible sur le web.')
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

          <SettingsSection title="Compte">
            <SettingsRow label="Se déconnecter" onPress={() => void handleLogout()} />
            <View style={styles.separator} />
            <SettingsRow destructive label="Supprimer le compte" onPress={handleDeleteAccount} />
          </SettingsSection>

          <SettingsSection title="Aide">
            <SettingsRow
              label="Centre d’aide"
              onPress={() => void openHelpPage('support')}
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Guide d’utilisation"
              onPress={() => void openHelpPage('guide')}
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Contact"
              onPress={() => void openHelpPage('contact')}
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Site web INVEQ"
              onPress={() => void openMarketingSite()}
            />
          </SettingsSection>

          <SettingsSection title="Confidentialité & conditions">
            <SettingsRow
              label="Politique de confidentialité"
              onPress={() => void openLegalPage('privacy')}
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Conditions d’utilisation"
              onPress={() => void openLegalPage('terms')}
            />
            <View style={styles.separator} />
            <SettingsRow label="Mentions légales" onPress={() => void openLegalPage('legal')} />
            <View style={styles.separator} />
            <SettingsRow
              label="Politique des cookies"
              onPress={() => void openLegalPage('cookies')}
            />
          </SettingsSection>

          <Text style={styles.version}>
            INVEQ v{versionInfo.version} · build {versionInfo.buildNumber}
          </Text>
        </>
      )}
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
    version: {
      ...typography.footnote,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  }));
}
