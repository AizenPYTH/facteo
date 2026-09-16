import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/pressable-scale';
import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';
import type { DocumentActionKey } from '@/hooks/use-document-actions';

type PdfPreviewModalProps = {
  visible: boolean;
  pdfUri: string | null;
  /** Le web ne produit pas de fichier : l'aperçu affiche le HTML source. */
  pdfHtml?: string | null;
  title: string;
  pdfLoading?: boolean;
  errorMessage?: string | null;
  pageCount?: number;
  /** Action en cours, pour n'afficher le spinner que sur le bon bouton. */
  busyAction?: DocumentActionKey | null;
  onClose: () => void;
  onShare: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onPageCountChange?: (count: number) => void;
};

export function PdfPreviewModal({
  visible,
  pdfUri,
  pdfHtml,
  title,
  pdfLoading = false,
  errorMessage,
  pageCount,
  busyAction,
  onClose,
  onShare,
  onDownload,
  onPrint,
  onEmail,
  onPageCountChange,
}: PdfPreviewModalProps) {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const colors = useColors();
  const busy = Boolean(busyAction);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.toolbar}>
          <PressableScale
            accessibilityLabel="Fermer l’aperçu"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={styles.closeButton}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={18}
              tintColor={colors.text}
              type="hierarchical"
            />
          </PressableScale>

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
          ) : errorMessage ? (
            <View style={styles.empty}>
              <SymbolView
                name={{
                  ios: 'exclamationmark.triangle',
                  android: 'warning',
                  web: 'warning',
                }}
                size={28}
                tintColor={colors.error}
              />
              <Text style={[styles.emptyText, { color: colors.error }]}>{errorMessage}</Text>
            </View>
          ) : pdfUri || pdfHtml ? (
            <PdfPreviewWebView
              html={pdfHtml ?? undefined}
              onPageCountChange={onPageCountChange}
              pdfUri={pdfUri}
              preferPdfJs
            />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Préparation de l’aperçu…</Text>
            </View>
          )}
        </View>

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          {onPrint ? (
            <ActionButton
              disabled={busy && busyAction !== 'print'}
              icon={{ ios: 'printer', android: 'print', web: 'print' }}
              label="Imprimer"
              loading={busyAction === 'print'}
              onPress={onPrint}
            />
          ) : null}
          {onDownload ? (
            <ActionButton
              disabled={busy && busyAction !== 'download'}
              icon={{ ios: 'arrow.down.circle', android: 'download', web: 'download' }}
              label="Télécharger"
              loading={busyAction === 'download'}
              onPress={onDownload}
            />
          ) : null}
          {onEmail ? (
            <ActionButton
              disabled={busy && busyAction !== 'email'}
              icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
              label="E-mail"
              loading={busyAction === 'email'}
              onPress={onEmail}
            />
          ) : null}
          <ActionButton
            disabled={busy && busyAction !== 'share'}
            highlight
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            label="Partager"
            loading={busyAction === 'share'}
            onPress={onShare}
          />
        </View>
      </View>
    </Modal>
  );
}

type ActionIcon = {
  ios: 'printer' | 'arrow.down.circle' | 'square.and.arrow.up' | 'envelope';
  android: 'print' | 'download' | 'share' | 'mail';
  web: 'print' | 'download' | 'share' | 'mail';
};

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  highlight?: boolean;
  icon: ActionIcon;
};

function ActionButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  highlight = false,
  icon,
}: ActionButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const isDisabled = loading || disabled;

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.actionButton,
        highlight && styles.actionButtonHighlight,
        isDisabled && styles.actionButtonDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={highlight ? '#FFFFFF' : colors.primary} size="small" />
      ) : (
        <SymbolView
          name={icon}
          size={20}
          tintColor={highlight ? '#FFFFFF' : colors.text}
          type="hierarchical"
        />
      )}
      {/*
        Quatre boutons se partagent la largeur à parts égales. « Télécharger »,
        le plus long, passait à la ligne et laissait son « r » seul en dessous.
        Le libellé tient désormais sur une ligne et se réduit légèrement si la
        place manque — écran étroit ou grande taille de texte système.
      */}
      <Text
        adjustsFontSizeToFit
        maxFontSizeMultiplier={1.3}
        minimumFontScale={0.75}
        numberOfLines={1}
        style={[styles.actionLabel, highlight && styles.actionLabelHighlight]}>
        {label}
      </Text>
    </PressableScale>
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
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
    },
    actionButtonHighlight: {
      backgroundColor: colors.primary,
    },
    actionButtonDisabled: {
      opacity: 0.5,
    },
    actionLabel: {
      ...textHierarchy.caption,
      color: colors.text,
      fontWeight: '500',
      textAlign: 'center',
    },
    actionLabelHighlight: {
      color: '#FFFFFF',
    },
  }));
}
