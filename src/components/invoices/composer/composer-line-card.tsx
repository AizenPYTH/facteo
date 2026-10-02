import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import {
  describeLineIssues,
  formatQuantity,
  getLineIssues,
} from '@/components/invoices/composer/composer-model';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFieldNavigation } from '@/components/ui/form/form-navigation';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { parseDecimalInput, parseVatRateForTotals } from '@/lib/format/decimal';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { QuoteLineValue } from '@/types/quote';

/** Taux en vigueur en France métropolitaine, proposés en raccourci. */
const VAT_RATE_SHORTCUTS = ['0', '2,1', '5,5', '10', '20'] as const;

type ComposerLineCardProps = {
  index: number;
  value: QuoteLineValue;
  expanded: boolean;
  onToggle: () => void;
  onChange: (value: QuoteLineValue) => void;
  onRemove: () => void;
  /** Validation demandée : anneau rouge et message si la ligne est incomplète. */
  showErrors: boolean;
};

/**
 * Ligne lisible (désignation + total HT, pastilles qté / prix / TVA / remise).
 * Un toucher l'ouvre en édition sur place.
 */
export function ComposerLineCard({
  index,
  value,
  expanded,
  onToggle,
  onChange,
  onRemove,
  showErrors,
}: ComposerLineCardProps) {
  const styles = useComposerStyles(lineStyles);
  const totals = useMemo(() => mapLineValueToTotals(value), [value]);
  const issues = useMemo(() => getLineIssues(value), [value]);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const hasError = showErrors && issues.length > 0;
  const designation = value.title?.trim() || value.description.trim();
  const shownTitle = designation || `Ligne ${index + 1}`;
  const priceMissing = issues.includes('price');
  const discount = parseDecimalInput(value.discountPercent || '0');
  const unitPrice = parseDecimalInput(value.unitPrice);
  const vatRate = parseVatRateForTotals(value.vatRate);

  function update<K extends keyof QuoteLineValue>(field: K, fieldValue: QuoteLineValue[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <View>
      <View style={[styles.card, expanded && styles.cardExpanded, hasError && styles.cardError]}>
        <Pressable
          accessibilityHint={expanded ? 'Replie la ligne' : 'Modifier la ligne'}
          accessibilityLabel={`${shownTitle}, ${formatPriceHT(totals.lineTotalHt)} hors taxes`}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={({ pressed }) => [styles.head, pressed && styles.pressed]}>
          <View style={styles.headTop}>
            <Text
              maxFontSizeMultiplier={1.4}
              numberOfLines={expanded ? undefined : 2}
              style={[styles.title, !designation && styles.titlePlaceholder]}>
              {shownTitle}
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.total}>
              {formatPriceHT(totals.lineTotalHt)}
            </Text>
          </View>
          <View style={styles.chips}>
            <Chip label={`${formatQuantity(value.quantity)} ${value.unit || 'unité'}`} />
            <Chip
              label={priceMissing ? 'Prix ?' : `× ${formatPriceHT(Number.isFinite(unitPrice) ? unitPrice : 0)}`}
              tone={priceMissing ? 'danger' : 'default'}
            />
            <Chip label={`TVA ${formatVatRate(vatRate)}`} />
            {discount > 0 ? <Chip label={`− ${formatQuantity(value.discountPercent)} %`} tone="ok" /> : null}
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.editor}>
            <LineInput
              autoCapitalize="sentences"
              emphasized
              label="Désignation"
              onChangeText={(text) => update('title', text)}
              placeholder="Désignation"
              value={value.title ?? ''}
            />
            <LineInput
              autoCapitalize="sentences"
              label="Description"
              multiline
              onChangeText={(text) => update('description', text)}
              placeholder="Description (facultatif)"
              value={value.description}
            />
            <View style={styles.grid}>
              <LabeledInput
                flex={1}
                invalid={showErrors && issues.includes('quantity')}
                keyboardType="decimal-pad"
                label="Quantité"
                onChangeText={(text) => update('quantity', text)}
                placeholder="1"
                value={value.quantity}
              />
              <LabeledInput
                flex={1}
                invalid={showErrors && issues.includes('unit')}
                label="Unité"
                onChangeText={(text) => update('unit', text)}
                placeholder="unité"
                value={value.unit}
              />
              <LabeledInput
                flex={1.2}
                invalid={showErrors && priceMissing}
                keyboardType="decimal-pad"
                label="Prix HT (€)"
                onChangeText={(text) => update('unitPrice', text)}
                placeholder="0,00"
                value={value.unitPrice}
              />
            </View>
            <View style={styles.grid}>
              <LabeledInput
                flex={1}
                invalid={showErrors && issues.includes('vat')}
                keyboardType="decimal-pad"
                label="TVA (%)"
                onChangeText={(text) => update('vatRate', text)}
                placeholder="20"
                value={value.vatRate}
              />
              <LabeledInput
                flex={1}
                invalid={showErrors && issues.includes('discount')}
                keyboardType="decimal-pad"
                label="Remise (%)"
                onChangeText={(text) => update('discountPercent', text)}
                placeholder="Aucune"
                value={value.discountPercent === '0' ? '' : value.discountPercent}
              />
            </View>
            <View style={styles.vatShortcuts}>
              {VAT_RATE_SHORTCUTS.map((rate) => {
                const active =
                  value.vatRate.trim() !== '' && parseVatRateForTotals(rate) === vatRate;
                return (
                  <Pressable
                    accessibilityLabel={`Appliquer une TVA de ${rate} %`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    key={rate}
                    onPress={() => update('vatRate', rate)}
                    style={({ pressed }) => [
                      styles.vatChip,
                      active && styles.vatChipActive,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      maxFontSizeMultiplier={1.3}
                      style={[styles.vatChipLabel, active && styles.vatChipLabelActive]}>
                      {rate} %
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.editorFooter}>
              <Pressable
                accessibilityLabel={`Supprimer ${shownTitle}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setConfirmRemove(true)}
                style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}>
                <Text maxFontSizeMultiplier={1.3} style={styles.deleteLabel}>
                  Supprimer
                </Text>
              </Pressable>
              <Text maxFontSizeMultiplier={1.3} style={styles.ttcHint}>
                {formatPriceHT(totals.lineTotalTtc)} TTC
              </Text>
              <Pressable
                accessibilityLabel="Valider la ligne"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onToggle}
                style={({ pressed }) => [styles.footerButton, styles.footerEnd, pressed && styles.pressed]}>
                <Text maxFontSizeMultiplier={1.3} style={styles.okLabel}>
                  OK
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {hasError ? (
          <Text maxFontSizeMultiplier={1.3} style={styles.errorText}>
            {describeLineIssues(issues)}
          </Text>
        ) : null}
      </View>

      <ConfirmDialog
        confirmLabel="Supprimer"
        destructive
        message={`« ${shownTitle} » sera retirée du document.`}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() => {
          setConfirmRemove(false);
          onRemove();
        }}
        title="Supprimer cette ligne ?"
        visible={confirmRemove}
      />
    </View>
  );
}

function Chip({ label, tone = 'default' }: { label: string; tone?: 'default' | 'danger' | 'ok' }) {
  const styles = useComposerStyles(lineStyles);
  return (
    <View
      style={[
        styles.chip,
        tone === 'danger' && styles.chipDanger,
        tone === 'ok' && styles.chipOk,
      ]}>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          styles.chipLabel,
          tone === 'danger' && styles.chipLabelDanger,
          tone === 'ok' && styles.chipLabelOk,
        ]}>
        {label}
      </Text>
    </View>
  );
}

function LineInput({
  label,
  value,
  onChangeText,
  placeholder,
  emphasized = false,
  multiline = false,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  emphasized?: boolean;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const styles = useComposerStyles(lineStyles);
  const colors = useComposerColors();
  const field = useFieldNavigation({ multiline });

  return (
    <TextInput
      accessibilityLabel={label}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      onChangeText={onChangeText}
      onSubmitEditing={field?.onSubmitEditing}
      placeholder={placeholder}
      placeholderTextColor={colors.ink3}
      ref={field?.ref}
      returnKeyType={field?.returnKeyType}
      style={[styles.input, emphasized ? styles.inputEmphasized : styles.inputSecondary]}
      submitBehavior={field?.submitBehavior}
      textAlignVertical={multiline ? 'top' : 'center'}
      value={value}
    />
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  invalid = false,
  flex,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  invalid?: boolean;
  flex: number;
}) {
  const styles = useComposerStyles(lineStyles);
  const colors = useComposerColors();
  const field = useFieldNavigation();

  return (
    <View style={[styles.labeled, { flex }, invalid && styles.labeledInvalid]}>
      <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.labeledCaption}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onSubmitEditing={field?.onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        ref={field?.ref}
        returnKeyType={field?.returnKeyType}
        selectTextOnFocus
        style={styles.labeledInput}
        submitBehavior={field?.submitBehavior}
        value={value}
      />
    </View>
  );
}

function lineStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: composerRadius.cardLarge,
      borderWidth: 1.5,
      borderColor: 'transparent',
      overflow: 'hidden' as const,
    },
    cardExpanded: {
      borderColor: colors.accent,
    },
    cardError: {
      borderColor: colors.danger,
    },
    head: {
      paddingHorizontal: 15,
      paddingVertical: 13,
    },
    headTop: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    titlePlaceholder: {
      color: colors.ink3,
    },
    total: {
      ...tabularNums,
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.ink,
    },
    chips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
      marginTop: 8,
    },
    chip: {
      height: 24,
      paddingHorizontal: 8,
      borderRadius: composerRadius.chip,
      backgroundColor: colors.soft,
      justifyContent: 'center' as const,
    },
    chipDanger: {
      backgroundColor: colors.dangerSoft,
    },
    chipOk: {
      backgroundColor: colors.okSoft,
    },
    chipLabel: {
      ...tabularNums,
      fontSize: 13,
      color: colors.ink2,
    },
    chipLabelDanger: {
      color: colors.danger,
      fontWeight: '600' as const,
    },
    chipLabelOk: {
      color: colors.ok,
    },
    editor: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingHorizontal: 15,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 8,
    },
    input: {
      borderRadius: composerRadius.field,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      fontSize: 16,
      color: colors.ink,
    },
    inputEmphasized: {
      height: 44,
      borderWidth: 1.5,
      borderColor: colors.accent,
      fontWeight: '600' as const,
    },
    inputSecondary: {
      minHeight: 44,
      paddingTop: 11,
      paddingBottom: 11,
      borderWidth: 1,
      borderColor: colors.line,
      color: colors.ink2,
    },
    grid: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    labeled: {
      minWidth: 0,
      minHeight: 52,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: composerRadius.field,
      paddingHorizontal: 10,
      paddingTop: 6,
      paddingBottom: 4,
    },
    labeledInvalid: {
      borderColor: colors.danger,
    },
    labeledCaption: {
      fontSize: 11.5,
      color: colors.ink3,
    },
    labeledInput: {
      ...tabularNums,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.ink,
      paddingVertical: 2,
      paddingHorizontal: 0,
    },
    vatShortcuts: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
    },
    vatChip: {
      minHeight: 32,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.soft,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    vatChipActive: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    vatChipLabel: {
      ...tabularNums,
      fontSize: 13,
      color: colors.ink2,
    },
    vatChipLabelActive: {
      color: colors.accentInk,
      fontWeight: '600' as const,
    },
    editorFooter: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginTop: 4,
    },
    footerButton: {
      minHeight: 44,
      minWidth: 44,
      justifyContent: 'center' as const,
    },
    footerEnd: {
      alignItems: 'flex-end' as const,
    },
    deleteLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.danger,
    },
    ttcHint: {
      ...tabularNums,
      fontSize: 13,
      color: colors.ink3,
    },
    okLabel: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.accent,
    },
    errorText: {
      fontSize: 13.5,
      fontWeight: '600' as const,
      color: colors.danger,
      paddingHorizontal: 15,
      paddingBottom: 12,
    },
  };
}
