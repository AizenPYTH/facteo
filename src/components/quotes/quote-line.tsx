import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PressableScale } from '@/components/ui/pressable-scale';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { formatPriceHT } from '@/lib/format/currency';
import { parseDecimalInput } from '@/lib/format/decimal';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { QuoteLineValue } from '@/types/quote';

export type QuoteLineProps = {
  index: number;
  value: QuoteLineValue;
  onChange: (value: QuoteLineValue) => void;
  onRemove?: () => void;
};

/**
 * Ligne du composer.
 *
 * Trois manques corrigés ici :
 * - la remise et l'unité existaient dans le modèle, dans le calcul des totaux
 *   et dans l'insertion en base, mais aucun champ ne permettait de les saisir ;
 * - une ligne remplie occupait autant de hauteur qu'une ligne vide, si bien
 *   qu'au-delà de trois prestations le document devenait illisible — le corps
 *   se replie donc dès que la ligne est renseignée ;
 * - la corbeille supprimait sans confirmation.
 */
export function QuoteLine({ index, value, onChange, onRemove }: QuoteLineProps) {
  const styles = useStyles();
  const colors = useColors();
  const totals = useMemo(() => mapLineValueToTotals(value), [value]);

  // Une ligne encore vide s'ouvre : c'est celle que l'utilisateur vient
  // d'ajouter. Une ligne déjà renseignée reste repliée.
  const [expanded, setExpanded] = useState(() => !value.description.trim());
  const [confirmRemove, setConfirmRemove] = useState(false);

  const discount = parseDecimalInput(value.discountPercent || '0');
  const title = value.description.trim() || `Prestation ${index + 1}`;
  const summary = `${value.quantity || '0'} ${value.unit || 'unité'} · ${formatPriceHT(totals.lineTotalHt)} HT`;

  function updateField<K extends keyof QuoteLineValue>(field: K, fieldValue: QuoteLineValue[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <Card flush variant="surface">
      <View style={styles.header}>
        <PressableScale
          accessibilityHint={expanded ? 'Replie la prestation' : 'Déplie la prestation'}
          accessibilityLabel={`${title}. ${summary}`}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          intensity="subtle"
          onPress={() => setExpanded((current) => !current)}
          style={styles.headerButton}>
          <View style={styles.headerText}>
            <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.summary}>
              {summary}
            </Text>
          </View>

          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.amount}>
            {formatPriceHT(totals.lineTotalTtc)}
          </Text>

          <SymbolView
            name={
              expanded
                ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
            }
            size={13}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
        </PressableScale>

        {onRemove ? (
          <PressableScale
            accessibilityLabel={`Supprimer ${title}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setConfirmRemove(true)}
            style={styles.removeButton}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor={colors.error}
              type="hierarchical"
            />
          </PressableScale>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.body}>
          <TextField
            label="Description"
            multiline
            numberOfLines={2}
            onChangeText={(text) => updateField('description', text)}
            placeholder="Description de la prestation"
            textAlignVertical="top"
            value={value.description}
          />

          <View style={styles.row}>
            <View style={styles.field}>
              <TextField
                keyboardType="decimal-pad"
                label="Quantité"
                onChangeText={(text) => updateField('quantity', text)}
                placeholder="1"
                value={value.quantity}
              />
            </View>
            <View style={styles.field}>
              <TextField
                label="Unité"
                onChangeText={(text) => updateField('unit', text)}
                placeholder="unité"
                value={value.unit}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.field}>
              <TextField
                keyboardType="decimal-pad"
                label="Prix HT"
                onChangeText={(text) => updateField('unitPrice', text)}
                placeholder="0"
                value={value.unitPrice}
              />
            </View>
            <View style={styles.field}>
              <TextField
                keyboardType="decimal-pad"
                label="TVA (%)"
                onChangeText={(text) => updateField('vatRate', text)}
                placeholder="20"
                value={value.vatRate}
              />
            </View>
          </View>

          <TextField
            keyboardType="decimal-pad"
            label="Remise (%)"
            onChangeText={(text) => updateField('discountPercent', text)}
            placeholder="0"
            value={value.discountPercent}
          />

          <View style={styles.totals}>
            <TotalRow label="Total HT" value={formatPriceHT(totals.lineTotalHt)} />
            {discount > 0 ? (
              <TotalRow
                label={`Remise ${discount} %`}
                tone={colors.success}
                value={`− ${formatPriceHT(totals.discountAmount)}`}
              />
            ) : null}
            <TotalRow label="TVA" value={formatPriceHT(totals.lineVat)} />
            <TotalRow emphasized label="Total TTC" value={formatPriceHT(totals.lineTotalTtc)} />
          </View>
        </View>
      ) : null}

      <ConfirmDialog
        confirmLabel="Supprimer"
        destructive
        message={`« ${title} » sera retirée du document.`}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          onRemove?.();
        }}
        title="Supprimer cette prestation ?"
        visible={confirmRemove}
      />
    </Card>
  );
}

function TotalRow({
  label,
  value,
  tone,
  emphasized = false,
}: {
  label: string;
  value: string;
  tone?: string;
  emphasized?: boolean;
}) {
  const styles = useStyles();

  return (
    <View style={styles.totalRow}>
      <Text
        maxFontSizeMultiplier={1.4}
        style={emphasized ? styles.totalLabelStrong : styles.totalLabel}>
        {label}
      </Text>
      <Text
        maxFontSizeMultiplier={1.4}
        style={[
          emphasized ? styles.totalValueStrong : styles.totalValue,
          tone ? { color: tone } : null,
        ]}>
        {value}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingRight: spacing[2],
    },
    headerButton: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      minHeight: 56,
      paddingLeft: spacing.md,
      paddingRight: spacing[2],
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      gap: spacing[0.5],
    },
    title: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    summary: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    amount: {
      ...typography.subheadlineMedium,
      color: colors.text,
      flexShrink: 1,
    },
    removeButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: spacing[2],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separatorOpaque,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    field: {
      flex: 1,
      minWidth: 0,
    },
    totals: {
      gap: spacing[1],
      paddingTop: spacing[2],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separatorOpaque,
    },
    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    totalLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    totalValue: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    totalLabelStrong: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    totalValueStrong: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
  }));
}
