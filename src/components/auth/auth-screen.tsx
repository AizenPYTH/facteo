import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useThemedStyles } from '@/hooks/use-colors';
import { motion } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type AuthScreenProps = {
  /** Optional large title under the logo. Prefer slogan-only on login. */
  title?: string;
  subtitle: string;
  children: ReactNode;
  /** Primary actions (button, forgot link) — stay in scroll, above keyboard. */
  actions?: ReactNode;
  footerLink?: ReactNode;
  error?: string | null;
};

/**
 * Auth shell: dark premium layout, keyboard-stable (no sticky footer jump).
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  actions,
  footerLink,
  error,
}: AuthScreenProps) {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAwareScrollView
          bottomOffset={spacing.lg}
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.flex}>
          <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.header}>
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel="INVEQ"
              source={require('@/assets/images/inveq-logo.png')}
              style={styles.logo}
            />
            <Animated.View entering={FadeInDown.delay(80).duration(motion.normal).springify()}>
              {title ? (
                <Text accessibilityRole="header" style={styles.title}>
                  {title}
                </Text>
              ) : null}
              <Text style={[styles.subtitle, !title ? styles.slogan : null]}>{subtitle}</Text>
            </Animated.View>
          </Animated.View>

          {error ? (
            <Animated.View
              accessibilityRole="alert"
              entering={FadeInDown.duration(motion.fast)}
              style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(140).duration(motion.normal).springify()}
            style={styles.form}>
            {children}
          </Animated.View>

          {actions ? (
            <Animated.View
              entering={FadeInDown.delay(180).duration(motion.normal)}
              style={styles.actions}>
              {actions}
            </Animated.View>
          ) : null}

          <View style={styles.spacer} />

          {footerLink ? (
            <Animated.View
              entering={FadeInDown.delay(220).duration(motion.normal)}
              style={styles.footerLinkWrap}>
              {footerLink}
            </Animated.View>
          ) : null}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal + spacing.xs,
      paddingTop: spacing['3xl'],
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    header: {
      gap: spacing.md,
      alignItems: 'center',
      paddingBottom: spacing.sm,
    },
    logo: {
      width: 168,
      height: 46,
      resizeMode: 'contain',
    },
    title: {
      ...typography.title1,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.md,
    },
    slogan: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    form: {
      gap: spacing.lg,
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
