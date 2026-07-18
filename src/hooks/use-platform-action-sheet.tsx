import { useCallback, useState } from 'react';
import {
  ActionSheetIOS,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type PlatformActionSheetOption = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type OpenPlatformActionSheetInput = {
  title?: string;
  options: PlatformActionSheetOption[];
};

export function usePlatformActionSheet() {
  const styles = useStyles();
  const [androidSheet, setAndroidSheet] = useState<OpenPlatformActionSheetInput | null>(null);

  const closeAndroidSheet = useCallback(() => {
    setAndroidSheet(null);
  }, []);

  const openActionSheet = useCallback((input: OpenPlatformActionSheetInput) => {
    const normalized = [...input.options, { label: 'Annuler', onPress: () => undefined }];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: input.title,
          options: normalized.map((entry) => entry.label),
          cancelButtonIndex: normalized.length - 1,
          destructiveButtonIndex: normalized.findIndex((entry) => entry.destructive),
        },
        (index) => {
          const selected = normalized[index];
          selected?.onPress();
        },
      );
      return;
    }

    setAndroidSheet(input);
  }, []);

  const actionSheetNode =
    Platform.OS !== 'ios' && androidSheet ? (
      <Modal animationType="fade" onRequestClose={closeAndroidSheet} transparent visible>
        <Pressable onPress={closeAndroidSheet} style={styles.overlay}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
            {androidSheet.title ? <Text style={styles.title}>{androidSheet.title}</Text> : null}
            {androidSheet.options.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => {
                  closeAndroidSheet();
                  option.onPress();
                }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Text style={[styles.rowLabel, option.destructive && styles.destructiveLabel]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={closeAndroidSheet} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.cancelLabel}>Annuler</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    ) : null;

  return {
    openActionSheet,
    actionSheetNode,
  };
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
      padding: spacing.md,
    },
    sheet: {
      borderRadius: radius.sheet,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    title: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xs,
    },
    row: {
      minHeight: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.md,
    },
    rowLabel: {
      ...typography.callout,
      color: colors.text,
      fontWeight: '600',
    },
    destructiveLabel: {
      color: colors.error,
    },
    cancelLabel: {
      ...typography.callout,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    pressed: {
      backgroundColor: colors.surfaceSecondary,
    },
  }));
}
