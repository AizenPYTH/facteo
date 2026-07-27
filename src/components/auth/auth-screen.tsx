import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { duration } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

type AuthScreenProps = {
  /** Optional title under the brand mark (register). Prefer slogan-only on login. */
  title?: string;
  subtitle: string;
  children: ReactNode;
  /** Primary actions stay in scroll — never jump with keyboard. */
  actions?: ReactNode;
  footerLink?: ReactNode;
  error?: string | null;
  /** Bumps to remount entering animations on login↔register. */
  contentKey?: string;
};

/**
 * Auth content panel (no logo — BrandMark lives in AuthShell).
 * Keyboard-stable composition.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  actions,
  footerLink,
  error,
  contentKey = 'auth',
}: AuthScreenProps) {
  const styles = useStyles();

  return (
    <KeyboardAwareScrollView
      bottomOffset={spacing.lg}
      contentContainerStyle={styles.content}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.flex}>
      <Animated.View
        entering={FadeInDown.duration(duration.normal).springify()}
        key={`${contentKey}-header`}
        style={styles.header}>
        {title ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        <Text style={[styles.subtitle, !title ? styles.slogan : null]}>{subtitle}</Text>
      </Animated.View>

      {error ? (
        <Animated.View
          accessibilityRole="alert"
          entering={FadeInDown.duration(duration.fast)}
          key={`${contentKey}-error`}
          style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </Animated.View>
      ) : null}

      <Animated.View
        entering={FadeInDown.delay(40).duration(duration.normal).springify()}
        key={`${contentKey}-form`}
        style={styles.form}>
        {children}
      </Animated.View>

      {actions ? (
        <Animated.View
          entering={FadeInDown.delay(80).duration(duration.normal)}
          key={`${contentKey}-actions`}
          style={styles.actions}>
          {actions}
        </Animated.View>
      ) : null}

      <View style={styles.spacer} />

      {footerLink ? (
        <Animated.View
          entering={FadeInDown.delay(100).duration(duration.normal)}
          key={`${contentKey}-footer`}
          style={styles.footerLinkWrap}>
          {footerLink}
        </Animated.View>
      ) : null}
    </KeyboardAwareScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal + spacing.xs,
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    header: {
      gap: spacing.sm,
      alignItems: 'center',
      paddingBottom: spacing.xs,
    },
    title: {
      ...typography.title2,
      color: colors.text,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.md,
    },
    slogan: {
      ...typography.title3,
      color: colors.textSecondary,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    form: {
      gap: spacing.md + 2,
    },
    actions: {
      gap: spacing.md,
    },
    spacer: {
      flexGrow: 1,
      minHeight: spacing.xl,
    },
    errorBanner: {
      backgroundColor: colors.errorSubtle,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.error,
    },
    errorBannerText: {
      ...typography.footnote,
      color: colors.error,
      textAlign: 'center',
    },
    footerLinkWrap: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
  }));
}
