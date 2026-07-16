import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

export type DesktopWizardStep = {
  id: number;
  label: string;
  description?: string;
};

type DesktopWizardFrameProps = {
  title: string;
  subtitle?: string;
  steps: DesktopWizardStep[];
  currentStep: number;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function DesktopWizardFrame({
  title,
  subtitle,
  steps,
  currentStep,
  onClose,
  children,
  footer,
}: DesktopWizardFrameProps) {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.wizardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.wizardSubtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.steps}>
          {steps.map((step) => {
            const active = step.id === currentStep;
            const completed = step.id < currentStep;

            return (
              <View
                key={step.id}
                style={[
                  styles.step,
                  active && styles.stepActive,
                  completed && styles.stepCompleted,
                ]}>
                <View
                  style={[
                    styles.bullet,
                    active && styles.bulletActive,
                    completed && styles.bulletCompleted,
                  ]}>
                  <Text
                    style={[
                      styles.bulletText,
                      active && styles.bulletTextOnPrimary,
                      completed && styles.bulletTextActive,
                    ]}>
                    {step.id}
                  </Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                    {step.label}
                  </Text>
                  {step.description ? (
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeLabel}>Fermer</Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={styles.content}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      flexDirection: 'row',
      minHeight: 0,
      backgroundColor: colors.backgroundGrouped,
    },
    sidebar: {
      width: 280,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.xl,
      gap: spacing.xl,
    },
    sidebarHeader: {
      gap: spacing.xs,
    },
    wizardTitle: {
      ...typography.title2,
      color: colors.text,
      fontWeight: '700',
    },
    wizardSubtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    steps: {
      gap: spacing.md,
      flex: 1,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    stepActive: {
      backgroundColor: colors.primarySubtle,
    },
    stepCompleted: {
      opacity: 0.9,
    },
    bullet: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bulletActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    bulletCompleted: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    bulletText: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    bulletTextActive: {
      color: colors.primary,
    },
    bulletTextOnPrimary: {
      color: colors.onPrimary,
    },
    stepText: {
      flex: 1,
      gap: 2,
      paddingTop: 2,
    },
    stepLabel: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    stepLabelActive: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    stepDescription: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    closeButton: {
      paddingVertical: spacing.sm,
    },
    closeLabel: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    main: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
    content: {
      flex: 1,
      minHeight: 0,
      padding: spacing.xl,
    },
    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
  }));
