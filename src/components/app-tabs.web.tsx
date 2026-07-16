import { type Href } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';

export default function AppTabs() {
  const { isDesktop, isTablet } = useBreakpoint();
  const useDesktopNav = isDesktop || isTablet;

  return (
    <Tabs>
      <TabSlot style={useDesktopNav ? styles.desktopSlot : styles.mobileSlot} />
      {useDesktopNav ? (
        <TabList style={styles.hiddenTabList}>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="clients" href={'/clients' as Href} />
          <TabTrigger name="quotes" href={'/quotes' as Href} />
          <TabTrigger name="invoices" href={'/invoices' as Href} />
        </TabList>
      ) : (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="index" href="/" asChild>
              <TabButton>Tableau de bord</TabButton>
            </TabTrigger>
            <TabTrigger name="clients" href={'/clients' as Href} asChild>
              <TabButton>Clients</TabButton>
            </TabTrigger>
            <TabTrigger name="quotes" href={'/quotes' as Href} asChild>
              <TabButton>Devis</TabButton>
            </TabTrigger>
            <TabTrigger name="invoices" href={'/invoices' as Href} asChild>
              <TabButton>Factures</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      )}
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          FACTEO
        </ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopSlot: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  mobileSlot: {
    height: '100%',
  },
  hiddenTabList: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'hidden',
    opacity: 0,
    pointerEvents: 'none',
  },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
