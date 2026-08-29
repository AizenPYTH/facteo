import type { ComponentProps } from 'react';
import { type Href } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { IPAD_NAVIGATION_RAIL_WIDTH } from '@/components/tablet/ipad-split-shell';
import { spacing } from '@/constants/theme/spacing';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

/**
 * Cinq positions — DESIGN §4 :
 * Accueil · Documents · Créer · Clients · Réglages
 * Factures/Devis restent des routes (sans onglet) pour le détail / deep link.
 */
export default function AppTabs() {
  const { width, height, isTablet } = useBreakpoint();

  if (isTablet && width > height) {
    return <IpadLandscapeTabs />;
  }

  return <PhoneTabs />;
}

function PhoneTabs() {
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

function IpadLandscapeTabs() {
  const styles = useRailStyles();

  return (
    <Tabs>
      <TabSlot style={styles.tabletSlot} />
      <TabList asChild>
        <SafeAreaView edges={['top', 'bottom', 'left']} style={styles.rail}>
          <View style={styles.brand}>
            <AppText semibold variant="caption">
              INVEQ
            </AppText>
          </View>

          <View style={styles.destinations}>
            <TabTrigger name="index" href="/" asChild>
              <RailButton
                icon={{ ios: 'house', android: 'home', web: 'home' }}
                label="Accueil"
              />
            </TabTrigger>
            <TabTrigger name="documents" href={'/documents' as Href} asChild>
              <RailButton
                icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
                label="Documents"
              />
            </TabTrigger>
            <TabTrigger name="create" href={'/create' as Href} asChild>
              <RailButton
                emphasized
                icon={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                label="Créer"
              />
            </TabTrigger>
            <TabTrigger name="clients" href={'/clients' as Href} asChild>
              <RailButton
                icon={{ ios: 'person.2', android: 'group', web: 'group' }}
                label="Clients"
              />
            </TabTrigger>
            <TabTrigger name="settings" href={'/settings' as Href} asChild>
              <RailButton
                icon={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
                label="Réglages"
              />
            </TabTrigger>
          </View>
        </SafeAreaView>
      </TabList>
    </Tabs>
  );
}

type RailButtonProps = TabTriggerSlotProps & {
  emphasized?: boolean;
  icon: ComponentProps<typeof SymbolView>['name'];
  label: string;
};

function RailButton({
  emphasized = false,
  icon,
  isFocused,
  label,
  ...props
}: RailButtonProps) {
  const styles = useRailStyles();
  const colors = useColors();

  return (
    <Pressable
      {...props}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.railButton,
        isFocused && styles.railButtonSelected,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconContainer, emphasized && styles.iconContainerEmphasized]}>
        <SymbolView
          name={icon}
          size={emphasized ? 24 : 22}
          tintColor={emphasized ? colors.onInk : isFocused ? colors.primary : colors.iconTertiary}
          type={isFocused ? 'hierarchical' : 'monochrome'}
        />
      </View>
      <AppText
        color={isFocused ? 'link' : 'tertiary'}
        numberOfLines={1}
        semibold={isFocused}
        style={styles.railLabel}
        variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const useRailStyles = () =>
  useThemedStyles((colors) => ({
    tabletSlot: {
      flex: 1,
      height: '100%',
      marginLeft: IPAD_NAVIGATION_RAIL_WIDTH,
    },
    rail: {
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      left: 0,
      width: IPAD_NAVIGATION_RAIL_WIDTH,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
    },
    brand: {
      height: 56,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    destinations: {
      flex: 1,
      paddingVertical: spacing.sm,
      gap: spacing.xs,
    },
    railButton: {
      minHeight: 64,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.xs,
      marginHorizontal: spacing.xs,
      borderRadius: 12,
    },
    railButtonSelected: {
      backgroundColor: colors.primarySubtle,
    },
    iconContainer: {
      width: 32,
      height: 28,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    iconContainerEmphasized: {
      borderRadius: 8,
      backgroundColor: colors.ink,
    },
    railLabel: {
      fontSize: 11,
    },
    pressed: {
      opacity: 0.7,
    },
  }));
