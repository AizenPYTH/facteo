import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

export function useAuthScreenStyles() {
  return useThemedStyles((colors) => ({
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
      alignItems: 'flex-start' as const,
    },
    title: {
      ...typography.largeTitle,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    form: {
      gap: spacing.lg,
    },
    errorBanner: {
      backgroundColor: colors.errorSubtle,
      borderRadius: radius.md,
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
    footerText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    footerLink: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
  }));
}
