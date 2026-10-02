import { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { FlatList, Platform, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useWizardFooterInset } from '@/components/ui/wizard-screen';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePlatformActionSheet } from '@/hooks/use-platform-action-sheet';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useToast } from '@/providers/toast-provider';
import type { ProductRow } from '@/types/database';
import type { QuoteLineValue } from '@/types/quote';
import { createEmptyQuoteLine } from '@/types/quote';

import { CatalogPickerModal, mapCatalogItemToLine } from './catalog-picker-modal';
import { QuoteLine } from './quote-line';
import { useProductScan } from './use-product-scan';

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
  const { openActionSheet, actionSheetNode } = usePlatformActionSheet();
  const { showSuccess } = useToast();
  const footerInset = useWizardFooterInset();
  const [catalogVisible, setCatalogVisible] = useState(false);
  const { startScan: handleScanProductWithAi, scanNodes } = useProductScan(onAddLine);

  function handleAddManualPrestation() {
    onAddLine(createEmptyQuoteLine());
  }

  function handleCatalogSelection(items: ProductRow[]) {
    for (const item of items) {
      onAddLine(mapCatalogItemToLine(item));
    }
    if (items.length > 0) {
      showSuccess(items.length > 1 ? `${items.length} lignes ajoutées.` : 'Ligne ajoutée.');
    }
  }

  const catalogNode = (
    <CatalogPickerModal
      onClose={() => setCatalogVisible(false)}
      onSelect={handleCatalogSelection}
      visible={catalogVisible}
    />
  );

  function handleAddPrestation() {
    openActionSheet({
      title: 'Ajouter une prestation',
      options: [
        {
          label: 'Depuis le catalogue (produits ou prestations)',
          onPress: () => setCatalogVisible(true),
        },
        {
          label: 'Ajouter manuellement',
          onPress: handleAddManualPrestation,
        },
        {
          label: 'Lire une fiche produit avec l’IA',
          onPress: handleScanProductWithAi,
        },
      ],
    });
  }

  const listHeader = (
    <View style={styles.headerSection}>
      <Text style={styles.sectionLabel}>
        {lines.length > 1 ? `${lines.length} prestations` : `${lines.length} prestation`}
      </Text>
    </View>
  );

  // Le bouton d'ajout est en pied de liste, là où se trouve le pouce après
  // avoir rempli la dernière ligne — il était en tête, donc hors d'atteinte dès
  // la deuxième prestation.
  const listFooter = (
    <View style={styles.footerSection}>
      <Button onPress={handleAddPrestation} title="Ajouter une prestation" variant="ghost" />
      <Button onPress={() => setCatalogVisible(true)} title="Depuis le catalogue" variant="ghost" />
      {Platform.OS === 'web' ? (
        <Button
          onPress={handleScanProductWithAi}
          title="Lire une fiche produit (IA)"
          variant="ghost"
        />
      ) : null}
    </View>
  );

  if (lines.length === 0) {
    return (
      <>
        <View style={styles.container}>
          <EmptyState
            actionLabel="Ajouter une prestation"
            description="Titre, description, quantité, prix HT, TVA et remise éventuelle."
            icon={{ ios: 'list.bullet.rectangle', android: 'list_alt', web: 'list_alt' }}
            onAction={handleAddPrestation}
            title="Aucune prestation"
          />
          <Button onPress={() => setCatalogVisible(true)} title="Depuis le catalogue" variant="ghost" />
          {Platform.OS === 'web' ? (
            <Button
              onPress={handleScanProductWithAi}
              title="Lire une fiche produit (IA)"
              variant="ghost"
            />
          ) : null}
        </View>
        {actionSheetNode}
        {catalogNode}
        {scanNodes}
      </>
    );
  }

  return (
    <>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={lines}
        keyExtractor={(item) => item.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        renderItem={({ item, index }) => (
          <QuoteLine
            index={index}
            onChange={(updatedLine) => onChangeLine(index, updatedLine)}
            onRemove={() => onRemoveLine(index)}
            value={item}
          />
        )}
        renderScrollComponent={(props) => (
          <KeyboardAwareScrollView {...props} bottomOffset={footerInset} keyboardShouldPersistTaps="handled" />
        )}
        showsVerticalScrollIndicator={false}
      />
      {actionSheetNode}
        {catalogNode}
      {scanNodes}
    </>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerSection: {
    paddingBottom: spacing.xs,
  },
  footerSection: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
}));
}
