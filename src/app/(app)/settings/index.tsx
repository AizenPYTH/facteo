import { router, type Href } from 'expo-router';
import { Alert, Linking, Platform, Switch, Text } from 'react-native';

import { SettingsProfileSummary, SettingsRow, SettingsSection } from '@/components/settings';
import { NotificationPreferencesSection } from '@/components/settings/notification-preferences-section';
import { SettingsDesktopContent } from '@/components/web/desktop/screens/settings-desktop-content';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { MARKETING_CONTACT } from '@/constants/marketing/site';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useAuth } from '@/hooks/use-auth';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useSubscription } from '@/hooks/use-subscription';
import { getAppVersionInfo } from '@/lib/app-version';
import { openHelpPage, openLegalPage, openMarketingSite } from '@/lib/legal/open-legal-page';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';
import { useThemePreference } from '@/providers/theme-preference-provider';
import { useToast } from '@/providers/toast-provider';

/**
 * Réglages.
 *
 * Organisation revue : les rubriques suivent maintenant les domaines de l'app —
 * compte, abonnement, entreprise, facturation, catalogue, notifications,
 * préférences, sécurité, aide. « Produits » et « Prestations » étaient rangés
 * sous Facturation, « Se déconnecter » et « Supprimer le compte » sous Compte, à
 * côté d'un lien vers l'abonnement.
 */
const ICONS = {
  email: { ios: 'envelope', android: 'mail', web: 'mail' },
  plan: { ios: 'star', android: 'star', web: 'star' },
  companies: { ios: 'building.2', android: 'domain', web: 'domain' },
  profile: { ios: 'person.text.rectangle', android: 'badge', web: 'badge' },
  numbering: { ios: 'number', android: 'tag', web: 'tag' },
  templates: { ios: 'doc.richtext', android: 'article', web: 'article' },
  eInvoice: { ios: 'bolt', android: 'bolt', web: 'bolt' },
  payments: { ios: 'creditcard', android: 'credit_card', web: 'credit_card' },
  products: { ios: 'cube', android: 'inventory_2', web: 'inventory_2' },
  services: { ios: 'wrench.and.screwdriver', android: 'handyman', web: 'handyman' },
  appearance: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
  signOut: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  deleteAccount: { ios: 'trash', android: 'delete', web: 'delete' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  guide: { ios: 'book', android: 'menu_book', web: 'menu_book' },
  contact: { ios: 'bubble.left', android: 'chat', web: 'chat' },
  website: { ios: 'globe', android: 'public', web: 'public' },
  legal: { ios: 'doc.text', android: 'description', web: 'description' },
} as const;

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

          <SettingsSection title="Compte">
            <SettingsRow icon={ICONS.email} label="Adresse e-mail" value={user?.email ?? '—'} />
          </SettingsSection>

          <SettingsSection
            footer="Les achats sont gérés par l’App Store sur iOS."
            title="Abonnement">
            <SettingsRow
              description="Comparer les offres et changer de formule"
              icon={ICONS.plan}
              label="Formule"
              onPress={() => router.push('/settings/premium' as Href)}
              value={getEffectivePlanDisplayName(subscription?.effectivePlanId ?? 'micro')}
            />
          </SettingsSection>

          <SettingsSection title="Entreprise">
            <SettingsRow
              icon={ICONS.companies}
              label="Mes entreprises"
              onPress={() => router.push('/settings/companies' as Href)}
            />
            <SettingsRow
              description="Identité, mentions légales, coordonnées bancaires"
              icon={ICONS.profile}
              label="Profil entreprise"
              onPress={() => router.push('/company' as Href)}
            />
          </SettingsSection>

          <SettingsSection title="Facturation">
            <SettingsRow
              icon={ICONS.numbering}
              label="Préfixes et numéros"
              onPress={() => router.push('/settings/numbering' as Href)}
            />
            <SettingsRow
              icon={ICONS.templates}
              label="Modèles de factures et devis"
              onPress={() => router.push('/settings/templates' as Href)}
            />
            <SettingsRow
              icon={ICONS.eInvoice}
              label="Facturation électronique"
              onPress={() => router.push('/settings/e-invoicing' as Href)}
            />
            <SettingsRow
              icon={ICONS.payments}
              label="Paiements"
              onPress={() => router.push('/settings/payments' as Href)}
            />
          </SettingsSection>

          <SettingsSection title="Catalogue">
            <SettingsRow
              icon={ICONS.products}
              label="Produits"
              onPress={() => router.push('/settings/catalog?type=product' as Href)}
            />
            <SettingsRow
              icon={ICONS.services}
              label="Prestations"
              onPress={() => router.push('/settings/catalog?type=service' as Href)}
            />
          </SettingsSection>

          <NotificationPreferencesSection />

          <SettingsSection
            footer={
              darkModeSupported
                ? 'Le thème s’applique immédiatement sur l’appareil.'
                : 'Bientôt disponible sur le web.'
            }
            title="Préférences">
            <SettingsRow
              icon={ICONS.appearance}
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

          <SettingsSection title="Sécurité">
            <SettingsRow
              icon={ICONS.signOut}
              label="Se déconnecter"
              onPress={() => void handleLogout()}
            />
            <SettingsRow
              description="Suppression définitive, sous 30 jours"
              destructive
              icon={ICONS.deleteAccount}
              label="Supprimer le compte"
              onPress={handleDeleteAccount}
            />
          </SettingsSection>

          <SettingsSection title="Aide">
            <SettingsRow
              icon={ICONS.help}
              label="Centre d’aide"
              onPress={() => void openHelpPage('support')}
            />
            <SettingsRow
              icon={ICONS.guide}
              label="Guide d’utilisation"
              onPress={() => void openHelpPage('guide')}
            />
            <SettingsRow
              icon={ICONS.contact}
              label="Contact"
              onPress={() => void openHelpPage('contact')}
            />
            <SettingsRow
              icon={ICONS.website}
              label="Site web INVEQ"
              onPress={() => void openMarketingSite()}
            />
          </SettingsSection>

          <SettingsSection title="Confidentialité & conditions">
            <SettingsRow
              icon={ICONS.legal}
              label="Politique de confidentialité"
              onPress={() => void openLegalPage('privacy')}
            />
            <SettingsRow
              icon={ICONS.legal}
              label="Conditions d’utilisation"
              onPress={() => void openLegalPage('terms')}
            />
            <SettingsRow
              icon={ICONS.legal}
              label="Mentions légales"
              onPress={() => void openLegalPage('legal')}
            />
            <SettingsRow
              icon={ICONS.legal}
              label="Politique des cookies"
              onPress={() => void openLegalPage('cookies')}
            />
          </SettingsSection>

          <Text maxFontSizeMultiplier={1.4} style={styles.version}>
            INVEQ v{versionInfo.version} · build {versionInfo.buildNumber}
          </Text>
        </>
      )}
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    version: {
      ...typography.footnote,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  }));
}
