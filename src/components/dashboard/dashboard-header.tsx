import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, View, type ViewStyle } from 'react-native';

import { CompanySwitcher } from '@/components/company/company-switcher';
import { AppText } from '@/components/ui/app-text';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { iconSize } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import type { TenantCompany } from '@/types/tenant';

export type DashboardHeaderProps = {
  firstName?: string;
  companyName?: string;
  greetingPrefix?: string;
  companies?: TenantCompany[];
  activeCompany?: TenantCompany | null;
  onSwitchCompany?: (companyId: string) => void;
  onCreateCompany?: (name: string) => Promise<void>;
  style?: ViewStyle;
};

export function DashboardHeader({
  firstName,
  companyName,
  greetingPrefix = 'Bonjour',
  companies = [],
  activeCompany,
  onSwitchCompany,
  onCreateCompany,
  style,
}: DashboardHeaderProps) {
  const styles = useStyles();
  const colors = useColors();
  const greeting = firstName ? `${greetingPrefix}, ${firstName}` : greetingPrefix;
  const showSwitcher = companies.length > 0 && onSwitchCompany && onCreateCompany;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.topRow}>
        <View style={styles.textBlock}>
          <AppText accessibilityRole="header" numberOfLines={2} variant="display">
            {greeting}
          </AppText>
          {showSwitcher ? (
            <CompanySwitcher
              activeCompany={activeCompany ?? null}
              companies={companies}
              onCreate={onCreateCompany}
              onSelect={onSwitchCompany}
            />
          ) : companyName ? (
            <AppText color="secondary" numberOfLines={2} variant="subtitle">
              {companyName}
            </AppText>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel="Paramètres"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push('/settings' as Href)}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
            size={iconSize.lg}
            tintColor={colors.iconSecondary}
            type="hierarchical"
          />
        </Pressable>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    settingsButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.75,
    },
  }));
}
