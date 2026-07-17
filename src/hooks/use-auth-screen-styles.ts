import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

export function useAuthScreenStyles() {
  return useThemedStyles((colors) => ({
    footerText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    footerLink: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    // Kept for any residual callers during migration.
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing['4xl'],
      paddingBottom: spacing.xl,
      gap: spacing['2xl'],
    },
    header: {
      gap: spacing.md,
      alignItems: 'center' as const,
    },
    title: {
      ...typography.title1,
      color: colors.text,
      textAlign: 'center' as const,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    form: {
      gap: spacing.lg,
    },
    errorBanner: {
      backgroundColor: colors.errorSubtle,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.error,
    },
    errorBannerText: {
      ...typography.footnote,
      color: colors.error,
    },
    footer: {
      alignItems: 'center' as const,
      marginTop: spacing.sm,
    },
  }));
}
