import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/constants/theme/spacing';

import { QuickActionCard } from './quick-action-card';

const ACTIONS = [
  {
    label: 'Nouveau devis',
    icon: { ios: 'doc.text', android: 'description', web: 'description' },
    href: '/quotes/new' as Href,
  },
  {
    label: 'Nouvelle facture',
    icon: { ios: 'doc.plaintext', android: 'receipt', web: 'receipt' },
    href: '/invoices/new' as Href,
  },
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
] as const;

export function QuickActions() {
  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
        <QuickActionCard
          key={action.label}
          icon={action.icon}
          label={action.label}
          onPress={() => router.push(action.href)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
