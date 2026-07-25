import { Pressable, ScrollView, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatPriceHT } from '@/lib/format/currency';
import { triggerHaptic } from '@/lib/haptics';
import {
  suggestionToQuoteLine,
  type ClientLineSuggestion,
} from '@/lib/supabase/client-document-memory';
import { parseDecimalInput } from '@/lib/format/decimal';
import type { QuoteLineValue } from '@/types/quote';

type SmartLineSuggestionsProps = {
  suggestions: ClientLineSuggestion[];
  lastDocumentLabel?: string | null;
  onAddLine: (line: QuoteLineValue) => void;
  onReplayLastDocument?: () => void;
};

/**
 * Signature suggestions — "Comme la dernière fois" first, then line chips.
 * Never blocks the path — ignore if unused.
 */
export function SmartLineSuggestions({
  suggestions,
  lastDocumentLabel,
  onAddLine,
  onReplayLastDocument,
}: SmartLineSuggestionsProps) {
  const styles = useStyles();

  if (suggestions.length === 0 && !lastDocumentLabel) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {lastDocumentLabel && onReplayLastDocument ? (
        <Pressable
          accessibilityHint="Remplace les lignes par celles du dernier document"
          accessibilityLabel={`Comme la dernière fois — ${lastDocumentLabel}`}
          accessibilityRole="button"
          onPress={() => {
            void triggerHaptic('selection');
            onReplayLastDocument();
          }}
          style={({ pressed }) => [styles.replay, pressed && styles.pressed]}>
          <Text style={styles.replayEyebrow}>Signature INVEQ</Text>
          <Text style={styles.replayLabel}>Comme la dernière fois</Text>
          <Text style={styles.replayHint}>
            Reprendre {lastDocumentLabel} — toutes les lignes d’un coup
          </Text>
        </Pressable>
      ) : null}

      {suggestions.length > 0 ? (
        <>
          <Text style={styles.title}>Suggestions pour ce client</Text>
          <Text style={styles.subtitle}>Un tap pour ajouter une prestation habituelle.</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}>
            {suggestions.map((suggestion) => {
              const price = parseDecimalInput(suggestion.unitPrice);
              return (
                <Pressable
                  key={suggestion.key}
                  accessibilityRole="button"
                  onPress={() => {
                    void triggerHaptic('selection');
                    onAddLine(suggestionToQuoteLine(suggestion));
                  }}
                  style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                  <Text numberOfLines={2} style={styles.chipTitle}>
                    {suggestion.description || 'Prestation'}
                  </Text>
                  <Text style={styles.chipMeta}>
                    {suggestion.quantity} × {formatPriceHT(price)}
                    {suggestion.frequency > 1 ? ` · ${suggestion.frequency}×` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrap: {
      gap: spacing.sm,
    },
    title: {
      ...type.cardTitle,
      color: colors.text,
    },
    subtitle: {
      ...type.caption,
      color: colors.textSecondary,
      marginBottom: spacing[1],
    },
    replay: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.primarySubtle,
      gap: 2,
    },
    replayEyebrow: {
      ...type.micro,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    replayLabel: {
      ...type.cardTitle,
      color: colors.primary,
    },
    replayHint: {
      ...type.micro,
      color: colors.textSecondary,
    },
    chips: {
      gap: spacing.sm,
      paddingVertical: spacing[1],
    },
    chip: {
      maxWidth: 200,
      minWidth: 140,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: 0.5,
      borderColor: colors.border,
      gap: 4,
    },
    pressed: {
      opacity: 0.85,
    },
    chipTitle: {
      ...type.badge,
      color: colors.text,
    },
    chipMeta: {
      ...type.micro,
      color: colors.textSecondary,
    },
  }));
}
