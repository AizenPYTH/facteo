import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button, type ButtonVariant } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';

export type ConsequenceRow = {
  label: string;
  value: string;
};

type ConfirmationSheetProps = {
  visible: boolean;
  title: string;
  /** Phrase d'intro, au-dessus du tableau de conséquences. */
  description?: string;
  /** Tableau de conséquences — DESIGN §3.6 (numéro, montant, échéance, nouvel état…). */
  rows?: ConsequenceRow[];
  /** Phrase sur ce qui ne se produira pas. */
  note?: string;
  primaryLabel: string;
  primaryVariant?: ButtonVariant;
  primaryLoading?: boolean;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmation conséquente — DESIGN §3.6.
 * Jamais « êtes-vous sûr » : un tableau de conséquences, une phrase sur ce qui
 * ne se produira pas, puis le primaire et Annuler en tertiaire.
 */
export function ConfirmationSheet({
  visible,
  title,
  description,
  rows,
  note,
  primaryLabel,
  primaryVariant = 'primary',
  primaryLoading = false,
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}: ConfirmationSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Fermer"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />

          <AppText variant="title">{title}</AppText>

          {description ? (
            <AppText color="secondary" variant="body">
              {description}
            </AppText>
          ) : null}

          {rows && rows.length > 0 ? (
            <View style={styles.table}>
              {rows.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.row, index > 0 && styles.rowSeparator]}>
                  <AppText color="secondary" variant="caption">
                    {row.label}
                  </AppText>
                  <AppText medium style={styles.rowValue} variant="body">
                    {row.value}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {note ? (
            <AppText color="tertiary" variant="caption">
              {note}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Button
              loading={primaryLoading}
              onPress={onConfirm}
              title={primaryLabel}
              variant={primaryVariant}
            />
            <Button onPress={onCancel} title={cancelLabel} variant="tertiary" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.md,
      ...shadows.sheet,
    },
    handle: {
      alignSelf: 'center' as const,
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
    },
    table: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rowSeparator: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    rowValue: {
      flexShrink: 1,
      textAlign: 'right' as const,
    },
    actions: {
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
  }));
