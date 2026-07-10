import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export function getAuthErrorMessage(message: string): string {
  switch (message) {
    case 'Invalid login credentials':
      return 'Incorrect email or password.';
    case 'Email not confirmed':
      return 'Please confirm your email before signing in.';
    case 'User already registered':
      return 'An account with this email already exists.';
    default:
      return message;
  }
}

export const authScreenStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden' as const,
  },
  field: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.inputPadding,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
  errorBanner: {
    backgroundColor: colors.errorSubtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  },
  footerLink: {
    ...typography.subheadlineMedium,
    color: colors.textLink,
  },
};
