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

import { MaxContentWidth, spacing } from '@/constants/theme';
import { radius } from '@/constants/theme/radius';
import { useColors } from '@/hooks/use-colors';
import { useBreakpoint } from '@/hooks/use-breakpoint';

/**
 * Cinq positions — DESIGN §4 : Accueil · Documents · Créer · Clients · Réglages.
 * Sur desktop/tablette web, la navigation visible est le `DesktopSidebar` — cette
 * barre reste montée mais masquée pour que le routeur garde ses cinq écrans.
 */
export default function AppTabs() {
  const { isDesktop, isTablet } = useBreakpoint();
  const useDesktopNav = isDesktop || isTablet;

  return (
    <Tabs>
      <TabSlot style={useDesktopNav ? styles.desktopSlot : styles.mobileSlot} />
      {useDesktopNav ? (
        <TabList style={styles.hiddenTabList}>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="documents" href={'/documents' as Href} />
          <TabTrigger name="create" href={'/create' as Href} />
          <TabTrigger name="clients" href={'/clients' as Href} />
          <TabTrigger name="settings" href={'/settings' as Href} />
        </TabList>
      ) : (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="index" href="/" asChild>
              <TabButton>Accueil</TabButton>
            </TabTrigger>
            <TabTrigger name="documents" href={'/documents' as Href} asChild>
              <TabButton>Documents</TabButton>
            </TabTrigger>
            <TabTrigger name="create" href={'/create' as Href} asChild>
              <CreateTabButton>Créer</CreateTabButton>
            </TabTrigger>
            <TabTrigger name="clients" href={'/clients' as Href} asChild>
              <TabButton>Clients</TabButton>
            </TabTrigger>
            <TabTrigger name="settings" href={'/settings' as Href} asChild>
              <TabButton>Réglages</TabButton>
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

/** Onglet central Créer — mis en avant, DESIGN §4 (bouton central). */
export function CreateTabButton({ children, ...props }: TabTriggerSlotProps) {
  const colors = useColors();

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.createButtonView, { backgroundColor: colors.ink }]}>
        <ThemedText type="small" style={{ color: colors.onInk }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          INVEQ
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
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: spacing.sm,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.group,
    borderRadius: spacing.group,
  },
  createButtonView: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.group,
    borderRadius: radius.full,
  },
});
