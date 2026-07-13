import { useState } from 'react';
import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SignaturePad } from '@/components/signatures/signature-pad';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDateTime } from '@/lib/format/datetime';

export type ClientSignatureModalProps = {
  visible: boolean;
  loading?: boolean;
  documentLabel: string;
  onCancel: () => void;
  onConfirm: (dataUri: string) => void;
};

export function ClientSignatureModal({
  visible,
  loading = false,
  documentLabel,
  onCancel,
  onConfirm,
}: ClientSignatureModalProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Signature client</Text>
          <Text style={styles.description}>
            Le client signe directement ci-dessous pour {documentLabel}.
          </Text>

          <SignaturePad
            loading={loading}
            onError={(message) => setErrorMessage(message)}
            onExport={(dataUri) => {
              setErrorMessage(null);
              onConfirm(dataUri);
            }}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Button disabled={loading} onPress={onCancel} title="Annuler" variant="ghost" />
        </View>
      </View>
    </Modal>
  );
}

type DocumentSignatureSectionProps = {
  signatureUrl: string | null;
  signedAt: string | null;
  loading?: boolean;
  locked?: boolean;
  showSignAction?: boolean;
  onRequestSign: () => void;
  onClearSignature: () => void;
};

export function DocumentSignatureSection({
  signatureUrl,
  signedAt,
  loading = false,
  locked = false,
  showSignAction = true,
  onRequestSign,
  onClearSignature,
}: DocumentSignatureSectionProps) {
  const styles = useStyles();

  if (locked) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signature client</Text>
        <Text style={styles.lockedText}>Disponible avec FACTEO Premium.</Text>
        <Button onPress={onRequestSign} title="Découvrir Premium" variant="ghost" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Signature client</Text>

      {signatureUrl ? (
        <View style={styles.previewCard}>
          <Image contentFit="contain" source={{ uri: signatureUrl }} style={styles.previewImage} />
          {signedAt ? (
            <Text style={styles.signedAt}>Signé électroniquement le {formatDateTime(signedAt)}</Text>
          ) : null}
          <View style={styles.actions}>
            <Button loading={loading} onPress={onRequestSign} title="Refaire signer" variant="ghost" />
            <Button loading={loading} onPress={onClearSignature} title="Effacer la signature" variant="ghost" />
          </View>
        </View>
      ) : showSignAction ? (
        <Button loading={loading} onPress={onRequestSign} title="Faire signer" />
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderStrong,
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    error: {
      ...typography.footnote,
      color: colors.error,
    },
    section: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sectionTitle: {
      ...typography.headline,
      color: colors.text,
    },
    lockedText: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    previewCard: {
      gap: spacing.sm,
    },
    previewImage: {
      width: '100%',
      height: 120,
      borderRadius: radius.card,
      backgroundColor: colors.backgroundGrouped,
    },
    signedAt: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    actions: {
      gap: spacing.xs,
    },
  }));
}
