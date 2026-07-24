import { usePathname, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import {
  DESKTOP_NAV_FOOTER,
  DESKTOP_NAV_SECTIONS,
  isNavItemActive,
} from '@/components/web/desktop/navigation';
import { DesktopSearchInput } from '@/components/web/desktop/ui/desktop-search-input';
import { DESKTOP_LAYOUT } from '@/constants/theme/desktop-tokens';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';

export function DesktopSidebar() {
  const styles = useStyles();
  const colors = useColors();
  const pathname = usePathname();
  const router = useRouter();
  const { isTablet } = useBreakpoint();
  const { user } = useAuth();
  const { activeCompany, companies } = useTenant();
  const [search, setSearch] = useState('');
  const collapsed = isTablet;

  function handleSearchSubmit() {
    const query = search.trim();
    if (!query) {
      return;
    }

    router.push(`/clients?search=${encodeURIComponent(query)}`);
    setSearch('');
  }

  function handleFooterPress(label: string) {
    if (label === 'Support' || label === 'Légal') {
      router.push('/settings');
      return;
    }

    if (label === 'Profil') {
      router.push('/settings');
      return;
    }

    router.push('/settings');
  }

  return (
    <View style={collapsed ? styles.sidebarCollapsed : styles.sidebar}>
      <View style={styles.top}>
        <View style={styles.brandBlock}>
          <BrandLogo size={collapsed ? 28 : 32} />
          {!collapsed ? <Text style={styles.brandName}>INVEQ</Text> : null}
        </View>

        {!collapsed && activeCompany ? (
          <Pressable
            onPress={() => router.push('/settings/companies')}
            style={({ pressed }) => [styles.companyCard, pressed && styles.pressed]}>
            <View style={styles.companyIcon}>
              <SymbolView
                name={{ ios: 'building.2', android: 'business', web: 'business' }}
                size={14}
                tintColor={colors.primary}
                type="hierarchical"
              />
            </View>
            <View style={styles.companyText}>
              <Text numberOfLines={1} style={styles.companyName}>
                {activeCompany.name}
              </Text>
              {companies.length > 1 ? (
                <Text style={styles.companyMeta}>{companies.length} espaces</Text>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        {!collapsed ? (
          <View
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleSearchSubmit}>
            <DesktopSearchInput
              compact
              onChangeText={setSearch}
              placeholder="Rechercher clients, factures…"
              value={search}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.nav}>
        {DESKTOP_NAV_SECTIONS.map((section) => (
          <View key={section.id} style={styles.section}>
            {!collapsed && section.label ? (
              <Text style={styles.sectionLabel}>{section.label}</Text>
            ) : null}
            {section.items.map((item) => (
              <NavItem
                active={isNavItemActive(pathname, item)}
                collapsed={collapsed}
                item={item}
                key={item.label}
                onPress={() => router.push(item.href)}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {!collapsed ? <View style={styles.separator} /> : null}
        {DESKTOP_NAV_FOOTER.map((item) => {
          const active =
            item.label === 'Paramètres' && isNavItemActive(pathname, item);

          return (
            <NavItem
              active={active}
              collapsed={collapsed}
              item={item}
              key={item.label}
              onPress={() => handleFooterPress(item.label)}
            />
          );
        })}

        {!collapsed && user?.email ? (
          <View style={styles.profileHint}>
            <Text numberOfLines={1} style={styles.profileEmail}>
              {user.email}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function NavItem({
  item,
  active,
  collapsed,
  onPress,
}: {
  item: { label: string; icon: { ios: string; android: string; web: string } };
  active: boolean;
  collapsed: boolean;
  onPress: () => void;
}) {
  const styles = useNavStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityLabel={item.label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => {
        if (collapsed) {
          return [
            styles.itemCollapsed,
            active && styles.itemCollapsedActive,
            pressed && styles.pressed,
          ];
        }

        return [
          styles.item,
          active && styles.itemActive,
          pressed && styles.pressed,
        ];
      }}>
      <SymbolView
        name={item.icon as never}
        size={18}
        tintColor={active ? colors.primary : colors.textSecondary}
        type="hierarchical"
      />
      {!collapsed ? (
        <Text style={active ? styles.labelActive : styles.label}>{item.label}</Text>
      ) : null}
      {!collapsed && active ? <View style={styles.activeBar} /> : null}
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    sidebar: {
      flex: 1,
      width: '100%',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.md,
      ...(Platform.OS === 'web'
        ? {
            height: '100vh' as unknown as number,
            overflow: 'hidden' as const,
          }
        : {}),
    },
    sidebarCollapsed: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      gap: spacing.md,
      ...(Platform.OS === 'web'
        ? {
            height: '100vh' as unknown as number,
            overflow: 'hidden' as const,
          }
        : {}),
    },
    top: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    brandBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
      minHeight: 40,
    },
    brandName: {
      ...typography.title3,
      color: colors.text,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    companyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    companyIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    companyText: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    companyName: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    companyMeta: {
      ...typography.caption2,
      color: colors.textTertiary,
    },
    nav: {
      flex: 1,
      gap: spacing.md,
      paddingHorizontal: spacing.xs,
      minHeight: 0,
    },
    section: {
      gap: spacing.xs,
    },
    sectionLabel: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
    },
    footer: {
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    profileHint: {
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
    },
    profileEmail: {
      ...typography.caption2,
      color: colors.textTertiary,
    },
    pressed: {
      opacity: 0.85,
    },
  }));

const useNavStyles = () =>
  useThemedStyles((colors) => ({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 38,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      position: 'relative' as const,
    },
    itemActive: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 38,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.primarySubtle,
      position: 'relative' as const,
    },
    itemCollapsed: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      width: 44,
      borderRadius: radius.md,
    },
    itemCollapsedActive: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      width: 44,
      borderRadius: radius.md,
      backgroundColor: colors.primarySubtle,
    },
    label: {
      ...typography.subheadline,
      color: colors.textSecondary,
      flex: 1,
    },
    labelActive: {
      ...typography.subheadlineMedium,
      color: colors.primary,
      flex: 1,
    },
    activeBar: {
      position: 'absolute' as const,
      left: 0,
      top: 8,
      bottom: 8,
      width: 3,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    pressed: {
      opacity: 0.88,
    },
  }));
