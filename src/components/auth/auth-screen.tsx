import { SymbolView } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { FormNavigationProvider } from '@/components/ui/form/form-navigation';
import { FormScreen } from '@/components/ui/form-screen';
import { StaggerIn } from '@/components/ui/stagger-in';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  footerLink?: ReactNode;
  error?: string | null;
  /**
   * Action déclenchée depuis le dernier champ du formulaire. Les écrans
   * d'authentification posaient `returnKeyType="next"` sans jamais câbler de
   * ref : la touche existait, elle ne faisait rien.
   */
  onSubmit?: () => void;
  /** Touche de validation du dernier champ. */
  submitLabel?: 'done' | 'go' | 'send';
};

/**
 * Cadre des écrans d'authentification.
 *
 * Les apparitions passaient par les animations d'entrée de Reanimated
 * (`FadeIn`, `FadeInDown.springify()`), montées avant le premier rendu de
 * l'app. On reprend `StaggerIn`, piloté par un shared value : même effet, sans
 * dépendre du cycle de montage natif.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  footerLink,
  error,
  onSubmit,
  submitLabel = 'go',
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

      <FormScreen
        contentContainerStyle={styles.content}
        edges={['top']}
        footer={footer}
        scrollable
        transparent>
        <StaggerIn index={0} style={styles.header}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel="INVEQ"
            source={require('@/assets/images/inveq-logo.png')}
            style={styles.logo}
          />
          <View>
            <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} style={styles.title}>
              {title}
            </Text>
            <Text maxFontSizeMultiplier={1.4} style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
        </StaggerIn>

        {error ? (
          <View accessibilityRole="alert" style={styles.errorBanner}>
            <SymbolView
              name={{ ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
              size={16}
              tintColor={colors.error}
              type="hierarchical"
            />
            <Text maxFontSizeMultiplier={1.5} style={styles.errorBannerText}>
              {error}
            </Text>
          </View>
        ) : null}

        <StaggerIn index={1} style={styles.card}>
          <FormNavigationProvider onSubmit={onSubmit} submitReturnKey={submitLabel}>
            {children}
          </FormNavigationProvider>
        </StaggerIn>

        {footerLink ? (
          <StaggerIn index={2} style={styles.footerLinkWrap}>
            {footerLink}
          </StaggerIn>
        ) : null}
      </FormScreen>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing['3xl'],
      paddingBottom: spacing.xl,
      gap: spacing.xl,
    },
    header: {
      gap: spacing.lg,
      alignItems: 'center',
      paddingBottom: spacing.sm,
    },
    logo: {
      width: 176,
      height: 48,
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius['2xl'],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.lg,
      ...shadows.card,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
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
      flex: 1,
    },
    footerLinkWrap: {
      alignItems: 'center',
      paddingTop: spacing.xs,
    },
  }));
}
