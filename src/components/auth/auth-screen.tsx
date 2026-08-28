import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { InveqWordmark } from '@/components/brand/inveq-wordmark';
import { FormScreen } from '@/components/ui/form-screen';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { motion } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { shadows } from '@/constants/theme/theme';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  footerLink?: ReactNode;
  error?: string | null;
};

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  footerLink,
  error,
}: AuthScreenProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.primarySubtle, colors.background, colors.background]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <FormScreen contentContainerStyle={styles.content} edges={[]} scrollable transparent>
          <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.header}>
            <InveqWordmark height={42} />
            <Animated.View entering={FadeInDown.delay(80).duration(motion.normal).springify()}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
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
            style={styles.card}>
            {children}
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(180).duration(motion.normal).springify()}
            style={styles.actions}>
            {footer}
          </Animated.View>

          {footerLink ? (
            <Animated.View
              entering={FadeInDown.delay(220).duration(motion.normal)}
              style={styles.footerLinkWrap}>
              {footerLink}
            </Animated.View>
          ) : null}
        </FormScreen>
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
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing.xl,
      paddingBottom: spacing['2xl'],
      gap: spacing.lg,
      justifyContent: 'flex-start',
    },
    header: {
      gap: spacing.md,
      alignItems: 'center',
      paddingBottom: spacing.xs,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius['2xl'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.lg,
      ...shadows.card,
    },
    actions: {
      gap: spacing.sm,
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
      paddingTop: spacing.xs,
      paddingBottom: spacing.md,
    },
  }));
}
