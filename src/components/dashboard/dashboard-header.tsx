import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { CompanySwitcher } from '@/components/company/company-switcher';
import { AppText } from '@/components/ui/app-text';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { press } from '@/constants/theme/interaction';
import { spring } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { triggerHaptic } from '@/lib/haptics';
import type { TenantCompany } from '@/types/tenant';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type DashboardHeaderProps = {
  firstName?: string;
  companyName?: string;
  greetingPrefix?: string;
  companies?: TenantCompany[];
  activeCompany?: TenantCompany | null;
  onSwitchCompany?: (companyId: string) => void;
  onCreateCompany?: (name: string) => Promise<void>;
  /** Show Premium badge when the user is on the free plan. */
  showPremiumBadge?: boolean;
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
  showPremiumBadge = false,
  style,
}: DashboardHeaderProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
        <View style={styles.chromeActions}>
          {showPremiumBadge ? (
            <AnimatedPressable
              accessibilityLabel="Passer à Premium"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                void triggerHaptic('selection');
                router.push('/settings/premium' as Href);
              }}
              onPressIn={() => {
                scale.value = withSpring(press.chrome.scale, spring.snappy);
              }}
              onPressOut={() => {
                scale.value = withSpring(1, spring.snappy);
              }}
              style={[styles.premiumBadge, animatedStyle]}>
              <AppText style={styles.premiumBadgeText} variant="caption">
                Premium
              </AppText>
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            accessibilityLabel="Rechercher"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              void triggerHaptic('selection');
              router.push('/search' as Href);
            }}
            onPressIn={() => {
              scale.value = withSpring(press.chrome.scale, spring.snappy);
            }}
            onPressOut={() => {
              scale.value = withSpring(1, spring.snappy);
            }}
            style={[styles.settingsButton, animatedStyle]}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={20}
              tintColor={colors.iconSecondary}
              type="hierarchical"
            />
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel="Paramètres"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              void triggerHaptic('selection');
              router.push('/settings' as Href);
            }}
            onPressIn={() => {
              scale.value = withSpring(press.chrome.scale, spring.snappy);
            }}
            onPressOut={() => {
              scale.value = withSpring(1, spring.snappy);
            }}
            style={[styles.settingsButton, animatedStyle]}>
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              size={20}
              tintColor={colors.iconSecondary}
              type="hierarchical"
            />
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
      paddingBottom: spacing.xs,
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
    chromeActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      ...elevation[1],
    },
    premiumBadge: {
      height: 32,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primary,
    },
    premiumBadgeText: {
      color: colors.primary,
      fontWeight: '700',
    },
  }));
}
