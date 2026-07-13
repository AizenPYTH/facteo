import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TemplatePreviewCard } from '@/components/pdf/template-preview-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';
import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates';

type TemplatePickerSheetProps = {
  visible: boolean;
  title: string;
  selectedTemplateId: string;
  onClose: () => void;
  onSelect: (templateId: string) => void;
};

export function TemplatePickerSheet({
  visible,
  title,
  selectedTemplateId,
  onClose,
  onSelect,
}: TemplatePickerSheetProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [draftId, setDraftId] = useState(selectedTemplateId);

  const selectedTemplate = useMemo(
    () => PDF_TEMPLATES.find((template) => template.id === draftId) ?? PDF_TEMPLATES[0],
    [draftId],
  );

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <AppText variant="title">{title}</AppText>
          <AppText color="secondary" variant="subtitle">
            Prévisualisez les styles avant de générer le PDF.
          </AppText>

          <View style={styles.previewHero}>
            <TemplatePreviewCard selected template={selectedTemplate} />
          </View>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {PDF_TEMPLATES.map((template) => {
              const selected = draftId === template.id;
              return (
                <Pressable
                  key={template.id}
                  onPress={() => setDraftId(template.id)}
                  style={[
                    styles.card,
                    selected && { borderColor: colors.primary, backgroundColor: colors.primarySubtle },
                  ]}>
                  <TemplatePreviewCard compact selected={selected} template={template} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Button
              onPress={() => {
                onSelect(draftId);
                onClose();
              }}
              title="Utiliser ce modèle"
            />
            <Button onPress={onClose} title="Annuler" variant="ghost" />
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
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '88%',
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
    },
    previewHero: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    card: {
      width: '48%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.xs,
      backgroundColor: colors.surface,
    },
    actions: {
      gap: spacing.sm,
    },
  }));
