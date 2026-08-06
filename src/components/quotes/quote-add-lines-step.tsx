import { FlatList, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { fadeInUp } from '@/lib/motion/presets';
import type { QuoteLineValue } from '@/types/quote';
import { createEmptyQuoteLine } from '@/types/quote';

import { QuoteLine } from './quote-line';

type QuoteAddLinesStepProps = {
  lines: QuoteLineValue[];
  onAddLine: (line: QuoteLineValue) => void;
  onChangeLine: (index: number, line: QuoteLineValue) => void;
  onRemoveLine: (index: number) => void;
};

export function QuoteAddLinesStep({
  lines,
  onAddLine,
  onChangeLine,
  onRemoveLine,
}: QuoteAddLinesStepProps) {
  const styles = useStyles();

  function handleAddPrestation() {
    onAddLine(createEmptyQuoteLine());
  }

  const listHeader = (
    <View style={styles.headerSection}>
      <Text style={styles.description}>
        Ajoutez vos prestations : description, quantité, prix HT et TVA.
      </Text>

      <Button onPress={handleAddPrestation} title="Ajouter une prestation" />

      <View style={styles.prestationsHeader}>
        <Text style={styles.sectionLabel}>Prestations ({lines.length})</Text>
      </View>
    </View>
  );

  if (lines.length === 0) {
    return (
      <View style={styles.container}>
        {listHeader}
        <View style={styles.emptyPrestations}>
          <Text style={styles.emptyPrestationsText}>
            Appuyez sur « Ajouter une prestation » pour commencer.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      automaticallyAdjustKeyboardInsets
      contentContainerStyle={styles.listContent}
      data={lines}
      keyExtractor={(item) => item.id}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      ListHeaderComponent={listHeader}
      renderItem={({ item, index }) => (
        <Animated.View entering={fadeInUp({ index, step: 40 })}>
          <QuoteLine
            index={index}
            onChange={(updatedLine) => onChangeLine(index, updatedLine)}
            onRemove={() => onRemoveLine(index)}
            value={item}
          />
        </Animated.View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
    },
    listContent: {
      gap: spacing.lg,
      paddingBottom: spacing.lg,
    },
    headerSection: {
      gap: spacing.lg,
      paddingBottom: spacing.sm,
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    sectionLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    prestationsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    emptyPrestations: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    emptyPrestationsText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));
}
