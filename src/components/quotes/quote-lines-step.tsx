import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { Product } from '@/types/product';
import type { QuoteLineValue } from '@/types/quote';

import { QuoteLine } from './quote-line';

type QuoteLinesStepProps = {
  lines: QuoteLineValue[];
  products: Product[];
  onChangeLine: (index: number, line: QuoteLineValue) => void;
  onRemoveLine: (index: number) => void;
};

export function QuoteLinesStep({
  lines,
  products,
  onChangeLine,
  onRemoveLine,
}: QuoteLinesStepProps) {
  if (lines.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Aucune ligne ajoutée. Revenez à l'étape précédente pour ajouter des produits.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Text style={styles.description}>
        Modifiez les quantités, prix et TVA. Les totaux sont recalculés automatiquement.
      </Text>

      {lines.map((line, index) => (
        <QuoteLine
          index={index}
          key={line.id}
          onChange={(updatedLine) => onChangeLine(index, updatedLine)}
          onRemove={lines.length > 1 ? () => onRemoveLine(index) : undefined}
          products={products}
          value={line}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
