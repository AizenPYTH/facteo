import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ComposerIcon, type ComposerIconName } from '@/components/composer/primitives';
import { ComposerLineCard } from '@/components/invoices/composer/composer-line-card';
import { CatalogPickerModal, mapCatalogItemToLine } from '@/components/quotes/catalog-picker-modal';
import { useProductScan } from '@/components/quotes/use-product-scan';
import {
  composerRadius,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { triggerImpactHaptic } from '@/lib/haptics';
import { useToast } from '@/providers/toast-provider';
import type { ProductRow } from '@/types/database';
import { createEmptyQuoteLine, type QuoteLineValue } from '@/types/quote';

type ComposerLinesStepProps = {
  lines: QuoteLineValue[];
  onAddLine: (line: QuoteLineValue) => void;
  onChangeLine: (index: number, line: QuoteLineValue) => void;
  onRemoveLine: (index: number) => void;
  showErrors: boolean;
};

function isBlank(line: QuoteLineValue): boolean {
  return !line.title?.trim() && !line.description.trim();
}

/**
 * Étape 2 : cartes de ligne lisibles, une seule ouverte à la fois, puis
 * « Ajouter une ligne » et les raccourcis Catalogue / Photo (lecture IA).
 */
export function ComposerLinesStep({
  lines,
  onAddLine,
  onChangeLine,
  onRemoveLine,
  showErrors,
}: ComposerLinesStepProps) {
  const styles = useComposerStyles(linesStyles);
  const { showSuccess } = useToast();
  const [catalogVisible, setCatalogVisible] = useState(false);
  const { startScan, scanNodes } = useProductScan(onAddLine);

  // Une ligne vide (celle qu'on vient d'ajouter) s'ouvre d'elle-même.
  const [expandedId, setExpandedId] = useState<string | null>(
    () => lines.find(isBlank)?.id ?? null,
  );
  const knownIdsRef = useRef(new Set(lines.map((line) => line.id)));

  useEffect(() => {
    const known = knownIdsRef.current;
    const added = lines.filter((line) => !known.has(line.id));
    knownIdsRef.current = new Set(lines.map((line) => line.id));
    const blankAdded = added.find(isBlank);
    if (blankAdded) {
      // Ouvre la ligne vide qui vient d'être ajoutée.
      setExpandedId(blankAdded.id);
    }
  }, [lines]);

  function handleCatalogSelection(items: ProductRow[]) {
    for (const item of items) {
      onAddLine(mapCatalogItemToLine(item));
    }
    if (items.length > 0) {
      showSuccess(items.length > 1 ? `${items.length} lignes ajoutées.` : 'Ligne ajoutée.');
    }
  }

  const count = lines.length;

  return (
    <>
      <View style={styles.header}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.heading}>
          Lignes <Text style={styles.headingCount}>{count}</Text>
        </Text>
        {count > 0 ? (
          <Text maxFontSizeMultiplier={1.3} style={styles.headerHint}>
            Touchez pour modifier
          </Text>
        ) : null}
      </View>

      {count === 0 ? (
        <View style={[styles.empty, showErrors && styles.emptyError]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.emptyTitle}>
            Aucune ligne pour l’instant
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.emptyText}>
            Ajoutez une ligne, piochez dans le catalogue ou photographiez une fiche produit.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {lines.map((line, index) => (
            <ComposerLineCard
              expanded={expandedId === line.id}
              index={index}
              key={line.id}
              onChange={(updated) => onChangeLine(index, updated)}
              onRemove={() => onRemoveLine(index)}
              onToggle={() => setExpandedId((current) => (current === line.id ? null : line.id))}
              showErrors={showErrors}
              value={line}
            />
          ))}
        </View>
      )}

      <AddLineButton
        onPress={() => {
          void triggerImpactHaptic();
          onAddLine(createEmptyQuoteLine());
        }}
      />

      <View style={styles.tiles}>
        <Tile
          icon={{ ios: 'book', android: 'menu_book', web: 'menu_book' }}
          label="Catalogue"
          onPress={() => setCatalogVisible(true)}
        />
        <Tile
          icon={{ ios: 'viewfinder', android: 'document_scanner', web: 'document_scanner' }}
          label="Photo"
          onPress={startScan}
        />
      </View>
      <Text maxFontSizeMultiplier={1.3} style={styles.tilesHint}>
        Une photo d’étiquette ou de fiche produit est lue par l’IA et ajoutée au catalogue.
      </Text>

      <CatalogPickerModal
        onClose={() => setCatalogVisible(false)}
        onSelect={handleCatalogSelection}
        visible={catalogVisible}
      />
      {scanNodes}
    </>
  );
}

function AddLineButton({ onPress }: { onPress: () => void }) {
  const styles = useComposerStyles(linesStyles);
  const colors = useComposerColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
      <ComposerIcon color={colors.accentInk} name={{ ios: 'plus', android: 'add', web: 'add' }} size={16} />
      <Text maxFontSizeMultiplier={1.3} style={styles.addLabel}>
        Ajouter une ligne
      </Text>
    </Pressable>
  );
}

function Tile({
  icon,
  label,
  onPress,
}: {
  icon: ComposerIconName;
  label: string;
  onPress: () => void;
}) {
  const styles = useComposerStyles(linesStyles);
  const colors = useComposerColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      <ComposerIcon color={colors.accent} name={icon} size={22} />
      <Text maxFontSizeMultiplier={1.3} style={styles.tileLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

function linesStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 10,
    },
    heading: {
      fontSize: 22,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
      color: colors.ink,
    },
    headingCount: {
      fontWeight: '600' as const,
      color: colors.ink3,
      fontVariant: ['tabular-nums' as const],
    },
    headerHint: {
      fontSize: 14,
      color: colors.ink3,
    },
    list: {
      gap: 10,
    },
    empty: {
      backgroundColor: colors.surface,
      borderRadius: composerRadius.cardLarge,
      paddingVertical: 28,
      paddingHorizontal: 20,
      alignItems: 'center' as const,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    emptyError: {
      borderColor: colors.danger,
      borderStyle: 'dashed' as const,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: colors.ink,
    },
    emptyText: {
      marginTop: 6,
      fontSize: 14.5,
      lineHeight: 21,
      textAlign: 'center' as const,
      color: colors.ink3,
    },
    addButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      height: 50,
      marginTop: 10,
      borderRadius: composerRadius.card,
      borderWidth: 1.5,
      borderStyle: 'dashed' as const,
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    addLabel: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.accentInk,
    },
    tiles: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 10,
    },
    tile: {
      flex: 1,
      alignItems: 'center' as const,
      gap: 7,
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: composerRadius.card,
      backgroundColor: colors.surface,
    },
    tileLabel: {
      fontSize: 13.5,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    tilesHint: {
      marginTop: 12,
      fontSize: 13.5,
      lineHeight: 20,
      textAlign: 'center' as const,
      color: colors.ink3,
      paddingHorizontal: 8,
    },
  };
}
