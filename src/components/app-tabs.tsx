import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useColors } from '@/hooks/use-colors';

/**
 * Cinq positions — DESIGN §4 :
 * Accueil · Documents · Créer · Clients · Réglages
 * Factures/Devis restent des routes (sans onglet) pour le détail / deep link.
 */
export default function AppTabs() {
  const colors = useColors();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{
        selected: { color: colors.primary },
        default: { color: colors.textTertiary },
      }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="home"
          sf={{ default: 'house', selected: 'house.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="documents">
        <NativeTabs.Trigger.Label>Documents</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="description"
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create">
        <NativeTabs.Trigger.Label>Créer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="add_circle"
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="clients">
        <NativeTabs.Trigger.Label>Clients</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="group"
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Réglages</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="settings"
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
