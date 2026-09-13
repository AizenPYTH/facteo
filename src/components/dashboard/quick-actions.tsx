import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme/spacing';

import { QuickActionCard } from './quick-action-card';

/**
 * Deux créations dominent l'activité — facture et devis. Elles occupent la
 * première ligne en pleine largeur et en couleur primaire ; le reste suit en
 * second rang. La grille de quatre tuiles identiques ne hiérarchisait rien.
 */
const PRIMARY_ACTIONS = [
  {
    label: 'Nouvelle facture',
    icon: { ios: 'doc.plaintext.fill', android: 'receipt', web: 'receipt' },
    href: '/invoices/new' as Href,
  },
  {
    label: 'Nouveau devis',
    icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
    href: '/quotes/new' as Href,
  },
] as const;

const SECONDARY_ACTIONS = [
  {
    label: 'Nouveau client',
    icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
    href: '/clients/new' as Href,
  },
  {
    label: 'Produit',
    icon: { ios: 'cube', android: 'inventory_2', web: 'inventory_2' },
    href: '/settings/catalog?type=product' as Href,
  },
  {
    label: 'Prestation',
    icon: { ios: 'wrench.and.screwdriver', android: 'handyman', web: 'handyman' },
    href: '/settings/catalog?type=service' as Href,
  },
] as const;

export function QuickActions() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {PRIMARY_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.label}
            emphasis="primary"
            icon={action.icon}
            label={action.label}
            onPress={() => router.push(action.href)}
          />
        ))}
      </View>
      <View style={styles.row}>
        {SECONDARY_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.label}
            icon={action.icon}
            label={action.label}
            onPress={() => router.push(action.href)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
