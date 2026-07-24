import { usePathname, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { normalizeAppPath } from '@/components/web/desktop/navigation';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { openHelpPage, openLegalPage } from '@/lib/legal/open-legal-page';

type SettingsNavItem = {
  href: string;
  label: string;
  description?: string;
};

type SettingsNavGroup = {
  id: string;
  title: string;
  items: SettingsNavItem[];
};

const SETTINGS_NAV_GROUPS: SettingsNavGroup[] = [
  {
    id: 'account',
    title: 'Compte',
    items: [
      { href: '/settings', label: 'Profil', description: 'Identité et préférences' },
      { href: '/settings', label: 'Email', description: 'Adresse de connexion' },
      { href: '/settings', label: 'Mot de passe', description: 'Sécurité du compte' },
    ],
  },
  {
    id: 'company',
    title: 'Entreprise',
    items: [
      { href: '/company', label: 'Informations', description: 'Raison sociale et coordonnées' },
      { href: '/company', label: 'Logo', description: 'Identité visuelle' },
      { href: '/company', label: 'TVA & IBAN', description: 'Facturation et paiements' },
      { href: '/settings/companies', label: 'Espaces', description: 'Gérer vos entreprises' },
    ],
  },
  {
    id: 'billing',
    title: 'Facturation',
    items: [
      { href: '/settings/numbering', label: 'Numérotation', description: 'Préfixes et séquences' },
      { href: '/settings/templates', label: 'Modèles', description: 'Factures et devis' },
      { href: '/company', label: 'Signature', description: 'Signature électronique' },
    ],
  },
  {
    id: 'payments',
    title: 'Paiements',
    items: [
      { href: '/settings/premium', label: 'Abonnement', description: 'INVEQ Premium' },
      { href: '/settings/premium', label: 'Stripe', description: 'Paiements en ligne' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    items: [
      { href: 'help:support', label: 'Centre d’aide', description: 'Assistance et contact' },
      { href: 'help:guide', label: 'Guide d’utilisation', description: 'Prise en main' },
      { href: 'help:contact', label: 'Contact', description: 'Page contact' },
    ],
  },
  {
    id: 'legal',
    title: 'Légal',
    items: [
      { href: 'legal:privacy', label: 'Confidentialité' },
      { href: 'legal:terms', label: 'Conditions d’utilisation' },
      { href: 'legal:legal', label: 'Mentions légales' },
      { href: 'legal:cookies', label: 'Cookies' },
    ],
  },
];

function isSettingsNavActive(pathname: string, item: SettingsNavItem): boolean {
  const path = normalizeAppPath(pathname);

  if (item.href.startsWith('legal:') || item.href.startsWith('help:')) {
    return false;
  }

  if (item.href === '/settings') {
    return path === '/settings';
  }

  return path === item.href || path.startsWith(`${item.href}/`);
}

export function DesktopSettingsNav() {
  const styles = useStyles();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.nav}>
      {SETTINGS_NAV_GROUPS.map((group) => (
        <View key={group.id} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.items.map((item) => {
            const active = isSettingsNavActive(pathname, item);

            return (
              <Pressable
                accessibilityRole="button"
                key={`${group.id}-${item.label}`}
                onPress={() => {
                  if (item.href.startsWith('legal:')) {
                    const page = item.href.replace('legal:', '') as
                      | 'privacy'
                      | 'terms'
                      | 'legal'
                      | 'cookies';
                    void openLegalPage(page);
                    return;
                  }

                  if (item.href.startsWith('help:')) {
                    const page = item.href.replace('help:', '') as
                      | 'support'
                      | 'guide'
                      | 'contact';
                    void openHelpPage(page);
                    return;
                  }

                  router.push(item.href as never);
                }}
                style={active ? styles.itemActive : styles.item}>
                <Text style={active ? styles.labelActive : styles.label}>{item.label}</Text>
                {item.description ? (
                  <Text style={styles.description}>{item.description}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    nav: {
      width: 280,
      padding: spacing.md,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
    },
    group: {
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    groupTitle: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xs,
    },
    item: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      gap: 2,
    },
    itemActive: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      gap: 2,
      backgroundColor: colors.primarySubtle,
    },
    label: {
      ...typography.subheadline,
      color: colors.text,
    },
    labelActive: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    description: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
