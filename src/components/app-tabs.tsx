import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
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
