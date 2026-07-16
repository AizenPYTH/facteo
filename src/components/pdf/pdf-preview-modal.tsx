import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';

type PdfPreviewModalProps = {
  visible: boolean;
  pdfUri: string | null;
  title: string;
  loading?: boolean;
  pdfLoading?: boolean;
  pageCount?: number;
  onClose: () => void;
  onShare: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onPageCountChange?: (count: number) => void;
};

export function PdfPreviewModal({
  visible,
  pdfUri,
  title,
  loading = false,
  pdfLoading = false,
  pageCount,
  onClose,
  onShare,
  onSave,
  onPrint,
  onEmail,
  onPageCountChange,
}: PdfPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const colors = useColors();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.toolbar}>
          <Pressable
            accessibilityLabel="Fermer l’aperçu"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={18}
              tintColor={colors.text}
              type="hierarchical"
            />
          </Pressable>

          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {pageCount && pageCount > 0 ? (
              <Text style={styles.subtitle}>
                {pageCount} page{pageCount > 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>

          <View style={styles.toolbarSpacer} />
        </View>

        <View style={styles.viewer}>
          {pdfLoading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.emptyText}>Génération du PDF…</Text>
            </View>
          ) : pdfUri ? (
            <PdfPreviewWebView onPageCountChange={onPageCountChange} pdfUri={pdfUri} preferPdfJs />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Préparation de l’aperçu…</Text>
            </View>
          )}
        </View>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {onPrint ? (
            <ActionButton
              icon={{ ios: 'printer', android: 'print', web: 'print' }}
              label="Imprimer"
              onPress={onPrint}
            />
          ) : null}
          {onSave ? (
            <ActionButton
              icon={{ ios: 'square.and.arrow.down', android: 'download', web: 'download' }}
              label="Enregistrer"
              loading={loading}
              onPress={onSave}
            />
          ) : null}
          {onEmail ? (
            <ActionButton
              icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
              label="E-mail"
              onPress={onEmail}
            />
          ) : null}
          <ActionButton
            highlight
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            label="Partager"
            loading={loading}
            onPress={onShare}
          />
        </View>
      </View>
    </Modal>
  );
}

type ActionIcon = {
  ios: 'printer' | 'square.and.arrow.down' | 'square.and.arrow.up' | 'envelope';
  android: 'print' | 'download' | 'share' | 'mail';
  web: 'print' | 'download' | 'share' | 'mail';
};

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  highlight?: boolean;
  icon: ActionIcon;
};

function ActionButton({ label, onPress, loading = false, highlight = false, icon }: ActionButtonProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        highlight && styles.actionButtonHighlight,
        pressed && styles.pressed,
        loading && styles.actionButtonDisabled,
      ]}>
      <SymbolView
        name={icon}
        size={20}
        tintColor={highlight ? '#FFFFFF' : colors.text}
        type="hierarchical"
      />
      <Text style={[styles.actionLabel, highlight && styles.actionLabelHighlight]}>{label}</Text>
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: '#EBEBF0',
    },
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.separator,
      backgroundColor: colors.surface,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    toolbarSpacer: {
      width: 36,
    },
    title: {
      ...textHierarchy.body,
      color: colors.text,
      fontWeight: '600',
    },
    subtitle: {
      ...textHierarchy.caption,
      color: colors.textSecondary,
    },
    viewer: {
      flex: 1,
      backgroundColor: '#EBEBF0',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.lg,
    },
    emptyText: {
      ...textHierarchy.subtitle,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 0.5,
      borderTopColor: colors.separator,
    },
    actionButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    actionButtonHighlight: {
      backgroundColor: colors.primary,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    actionLabel: {
      ...textHierarchy.caption,
      color: colors.text,
      fontWeight: '500',
    },
    actionLabelHighlight: {
      color: '#FFFFFF',
    },
    pressed: {
      opacity: 0.85,
    },
  }));
}
