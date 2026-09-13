import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  // `useColorScheme` de react-native renvoie 'light' | 'dark' | null. Le null arrive
  // notamment parce que ThemePreferenceProvider appelle Appearance.setColorScheme(null)
  // quand la préférence vaut 'system' (le défaut). Indexer Colors avec null donnait
  // `undefined`, et le premier accès à une couleur levait un TypeError sur le premier
  // écran rendu après le splash.
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Tableau de bord</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="home"
          sf={{ default: 'house', selected: 'house.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="clients">
        <NativeTabs.Trigger.Label>Clients</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="group"
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="quotes">
        <NativeTabs.Trigger.Label>Devis</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="description"
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="invoices">
        <NativeTabs.Trigger.Label>Factures</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          md="receipt_long"
          sf={{ default: 'doc.plaintext', selected: 'doc.plaintext.fill' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
