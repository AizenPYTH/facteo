import { router, type Href } from 'expo-router';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';

import {
  SettingsProfileSummary,
  SettingsRow,
  SettingsSection,
} from '@/components/settings';
import { AppearancePreference } from '@/components/settings/appearance-preference';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { SettingsDesktopContent } from '@/components/web/desktop/screens/settings-desktop-content';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { MARKETING_CONTACT } from '@/constants/marketing/site';
import { openHelpPage, openLegalPage } from '@/lib/legal/open-legal-page';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSubscription } from '@/hooks/use-subscription';
import { getAppVersionInfo } from '@/lib/app-version';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';

/**
 * Réglages — DESIGN §5.9
 * Facturation → Compte → Assistance → un seul lien destructif.
 * Apparence conservée (exigence produit §20) sous Compte.
 */
export default function SettingsScreen() {
  const styles = useStyles();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const useDesktopSettings = isWeb && (isDesktop || isTablet);
  const { user, signOut } = useAuth();
  const companyProfile = useCompanyProfile();
  const { subscription } = useSubscription();
  const versionInfo = getAppVersionInfo();

  const planLabel = `INVEQ ${getEffectivePlanDisplayName(subscription?.effectivePlanId ?? 'micro')}`;

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
      ],
    );
  }

  function handleLegal() {
    Alert.alert('Légal', 'Choisissez un document', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confidentialité', onPress: () => void openLegalPage('privacy') },
      { text: 'Conditions', onPress: () => void openLegalPage('terms') },
      { text: 'Mentions légales', onPress: () => void openLegalPage('legal') },
    ]);
  }

  return (
    <SettingsScreenFrame title="Réglages">
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

          <SettingsSection title="Facturation">
            <SettingsRow
              label="Entreprise"
              onPress={() => router.push('/company' as Href)}
              value={companyProfile.data?.companyName ?? undefined}
            />
            <View style={styles.separator} />
            <SettingsRow
              label="TVA et mentions"
              onPress={() => router.push('/company' as Href)}
              value="Mentions PDF"
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Numérotation"
              onPress={() => router.push('/settings/numbering' as Href)}
              value="Factures & devis"
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Modèles"
              onPress={() => router.push('/settings/templates' as Href)}
              value="PDF"
            />
          </SettingsSection>

          <SettingsSection title="Compte">
            <SettingsRow
              label="Abonnement"
              onPress={() => router.push('/settings/premium' as Href)}
              value={planLabel}
            />
            <View style={styles.separator} />
            <SettingsRow
              label="Sécurité"
              onPress={() => {
                Alert.alert(
                  'Sécurité',
                  `Compte : ${user?.email ?? '—'}\n\nPour changer votre mot de passe, utilisez « Mot de passe oublié » sur l’écran de connexion.`,
                  [
                    { text: 'OK' },
                    { text: 'Supprimer le compte', style: 'destructive', onPress: handleDeleteAccount },
                  ],
                );
              }}
              value={user?.email ?? undefined}
            />
            <View style={styles.separator} />
            <AppearancePreference />
            <View style={styles.separator} />
            <NotificationPreferencesSection variant="embedded" />
          </SettingsSection>

          <SettingsSection title="Assistance">
            <SettingsRow
              label="Découvrir INVEQ"
              onPress={() => router.push('/settings/discover' as Href)}
            />
            <View style={styles.separator} />
            <SettingsRow label="Aide" onPress={() => void openHelpPage('support')} />
            <View style={styles.separator} />
            <SettingsRow label="Légal" onPress={handleLegal} />
          </SettingsSection>

          <SettingsSection title="">
            <SettingsRow destructive label="Se déconnecter" onPress={() => void handleLogout()} />
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
