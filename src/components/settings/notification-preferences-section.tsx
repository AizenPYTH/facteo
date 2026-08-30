import { StyleSheet, Switch, Text, View } from 'react-native';

import { SettingsRow, SettingsSection } from '@/components/settings';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/use-notification-preferences';
import type { NotificationPreferences } from '@/lib/notifications/preferences';
import { useToast } from '@/providers/toast-provider';

type NotificationPreferencesSectionProps = {
  /**
   * `section` : bloc autonome « Notifications ».
   * `embedded` : lignes seules, à placer dans Compte — DESIGN §5.9.
   */
  variant?: 'section' | 'embedded';
};

export function NotificationPreferencesSection({
  variant = 'section',
}: NotificationPreferencesSectionProps) {
  const styles = useStyles();
  const colors = useColors();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { showError } = useToast();

  async function handleToggle<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) {
    if (!preferences) {
      return;
    }

    try {
      await updatePreferences.mutateAsync({
        ...preferences,
        [key]: value,
      });
    } catch {
      showError('Impossible de mettre à jour les préférences.');
    }
  }

  if (isLoading || !preferences) {
    return null;
  }

  const rows = (
    <>
      {variant === 'embedded' ? (
        <>
          <View style={styles.separator} />
          <SettingsRow label="Notifications" value="Factures, devis, paiements" />
          <View style={styles.separator} />
        </>
      ) : null}
      <SettingsRow
        label="Facture en retard"
        trailing={
          <Switch
            onValueChange={(value) => {
              void handleToggle('invoiceOverdueEnabled', value);
            }}
            thumbColor={colors.surface}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            value={preferences.invoiceOverdueEnabled}
          />
        }
      />
      <View style={styles.separator} />
      <SettingsRow
        label="Devis accepté"
        trailing={
          <Switch
            onValueChange={(value) => {
              void handleToggle('quoteAcceptedEnabled', value);
            }}
            thumbColor={colors.surface}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            value={preferences.quoteAcceptedEnabled}
          />
        }
      />
      <View style={styles.separator} />
      <SettingsRow
        label="Paiement reçu"
        trailing={
          <Switch
            onValueChange={(value) => {
              void handleToggle('paymentReceivedEnabled', value);
            }}
            thumbColor={colors.surface}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            value={preferences.paymentReceivedEnabled}
          />
        }
      />
      <View style={styles.separator} />
      <SettingsRow
        label="Rappel avant échéance"
        trailing={
          <Switch
            onValueChange={(value) => {
              void handleToggle('dueDateReminderEnabled', value);
            }}
            thumbColor={colors.surface}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            value={preferences.dueDateReminderEnabled}
          />
        }
      />
      <View style={styles.reminderInfo}>
        <Text style={styles.reminderText}>
          Rappel {preferences.dueDateReminderDays} jour(s) avant l’échéance
        </Text>
      </View>
    </>
  );

  if (variant === 'embedded') {
    return rows;
  }

  return (
    <SettingsSection
      footer="Les notifications sont envoyées sur votre appareil."
      title="Notifications">
      {rows}
    </SettingsSection>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
    reminderInfo: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    reminderText: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
  }));
}
