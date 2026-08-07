import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';

export type DocumentActionItem = {
  id: string;
  label: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

type DocumentActionsSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  sections: DocumentActionItem[][];
  onClose: () => void;
};

function ActionRow({
  item,
  onClose,
}: {
  item: DocumentActionItem;
  onClose: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: item.disabled || item.loading }}
      disabled={item.disabled || item.loading}
      onPress={() => {
        // iOS : ouvrir une 2e Modal pendant la fermeture de la sheet échoue souvent.
        // On ferme d’abord, puis on enchaîne l’action après l’animation.
        onClose();
        setTimeout(() => {
          item.onPress();
        }, 320);
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <SymbolView
        name={item.icon}
        size={20}
        tintColor={item.destructive ? colors.error : colors.primary}
      />
      <AppText
        style={item.destructive ? styles.destructiveLabel : undefined}
        variant="body">
        {item.label}
      </AppText>
    </Pressable>
  );
}

export function DocumentActionsSheet({
  visible,
  title,
  subtitle,
  sections,
  onClose,
}: DocumentActionsSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="title">{title}</AppText>
            {subtitle ? (
              <AppText color="secondary" variant="caption">
                {subtitle}
              </AppText>
            ) : null}
          </View>

          {sections.map((section, sectionIndex) => (
            <View key={`section-${sectionIndex}`} style={styles.section}>
              {section.map((item) => (
                <ActionRow key={item.id} item={item} onClose={onClose} />
              ))}
            </View>
          ))}

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}>
            <AppText medium variant="body">
              Fermer
            </AppText>
          </Pressable>
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
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.backgroundGrouped,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
      marginBottom: spacing.xs,
    },
    header: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xs,
      gap: 2,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    rowPressed: {
      opacity: 0.85,
    },
    destructiveLabel: {
      color: colors.error,
    },
    cancel: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  }));
