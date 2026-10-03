import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { GroupCard, Pill, SectionHeader } from '@/components/composer/primitives';
import { formatShortFrenchDate } from '@/components/invoices/composer/composer-model';
import {
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { useFieldNavigation } from '@/components/ui/form/form-navigation';

const DELAY_PRESETS = [15, 30, 45, 60] as const;

type ComposerDatesSectionProps = {
  issuedAt: string;
  dueAt: string;
  paymentTermsDays: string;
  onIssuedAtChange: (value: string) => void;
  /** `null` : à réception. */
  onDelayChange: (days: number | null) => void;
  /** Saisie libre du délai (« Autre »). */
  onDelayInput: (value: string) => void;
  onDueAtChange: (value: string) => void;
  hasError: boolean;
};

/**
 * « Dates et paiement » en liste groupée iOS : émission, délai en pastilles
 * défilantes, échéance calculée (modifiable d'un toucher).
 */
export function ComposerDatesSection({
  issuedAt,
  dueAt,
  paymentTermsDays,
  onIssuedAtChange,
  onDelayChange,
  onDelayInput,
  onDueAtChange,
  hasError,
}: ComposerDatesSectionProps) {
  const styles = useComposerStyles(datesStyles);
  const colors = useComposerColors();
  const days = paymentTermsDays.trim();
  const numericDays = /^\d+$/.test(days) ? Number(days) : null;
  const isPreset = numericDays !== null && (DELAY_PRESETS as readonly number[]).includes(numericDays);
  const [customOpen, setCustomOpen] = useState(() => days !== '' && !isPreset);
  const customDelayField = useFieldNavigation({ enabled: customOpen });

  return (
    <>
      <SectionHeader title="Dates et paiement" />
      <GroupCard>
        <View style={styles.row}>
          <Text maxFontSizeMultiplier={1.4} style={styles.rowLabel}>
            Émission
          </Text>
          <DateChip
            accessibilityLabel="Date d’émission"
            invalid={hasError && !formatShortFrenchDate(issuedAt)}
            onChange={onIssuedAtChange}
            value={issuedAt}
          />
        </View>

        <View style={styles.delayBlock}>
          <Text maxFontSizeMultiplier={1.4} style={styles.delayLabel}>
            Délai de paiement
          </Text>
          <ScrollView
            contentContainerStyle={styles.delayPills}
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}>
            <Pill
              label="À réception"
              onPress={() => {
                setCustomOpen(false);
                onDelayChange(null);
              }}
              selected={!customOpen && days === ''}
            />
            {DELAY_PRESETS.map((preset) => (
              <Pill
                accessibilityLabel={`${preset} jours`}
                key={preset}
                label={`${preset} j`}
                onPress={() => {
                  setCustomOpen(false);
                  onDelayChange(preset);
                }}
                selected={!customOpen && numericDays === preset}
              />
            ))}
            <Pill
              accessibilityLabel="Autre délai"
              label={customOpen && numericDays ? `${numericDays} j` : 'Autre'}
              onPress={() => setCustomOpen(true)}
              selected={customOpen || (days !== '' && !isPreset)}
            />
          </ScrollView>
          {customOpen ? (
            <View style={styles.customRow}>
              <Text maxFontSizeMultiplier={1.4} style={styles.customLabel}>
                Délai en jours
              </Text>
              <TextInput
                accessibilityLabel="Délai de paiement en jours"
                autoFocus={!isPreset && days === ''}
                inputMode="numeric"
                keyboardType="number-pad"
                maxLength={3}
                onChangeText={(text) => onDelayInput(text.replace(/\D/g, ''))}
                placeholder="90"
                placeholderTextColor={colors.ink3}
                style={[styles.customInput, hasError && !numericDays && days !== '' && styles.invalid]}
                onSubmitEditing={customDelayField?.onSubmitEditing}
                ref={customDelayField?.ref}
                returnKeyType={customDelayField?.returnKeyType ?? 'done'}
                submitBehavior={customDelayField?.submitBehavior}
                value={paymentTermsDays}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.rowSeparated}>
          <Text maxFontSizeMultiplier={1.4} style={styles.rowLabelMuted}>
            Échéance
          </Text>
          <DateChip
            accessibilityLabel="Date d’échéance"
            emphasized
            onChange={onDueAtChange}
            placeholder="Aucune"
            value={dueAt}
          />
        </View>
      </GroupCard>
    </>
  );
}

/**
 * Date affichée « 2 oct. 2026 » ; un toucher bascule en saisie JJ/MM/AAAA
 * (le format attendu par la validation).
 */
function DateChip({
  value,
  onChange,
  accessibilityLabel,
  emphasized = false,
  invalid = false,
  placeholder = 'JJ/MM/AAAA',
}: {
  value: string;
  onChange: (value: string) => void;
  accessibilityLabel: string;
  emphasized?: boolean;
  invalid?: boolean;
  placeholder?: string;
}) {
  const styles = useComposerStyles(datesStyles);
  const colors = useComposerColors();
  const [editing, setEditing] = useState(false);
  const formatted = formatShortFrenchDate(value);
  const field = useFieldNavigation({ enabled: editing });

  if (editing) {
    return (
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoFocus
        keyboardType="numbers-and-punctuation"
        maxLength={10}
        onBlur={() => setEditing(false)}
        onChangeText={onChange}
        placeholder="JJ/MM/AAAA"
        placeholderTextColor={colors.ink3}
        selectTextOnFocus
        style={[styles.dateInput, !formatted && value ? styles.invalid : null]}
        onSubmitEditing={field?.onSubmitEditing}
        ref={field?.ref}
        returnKeyType={field?.returnKeyType ?? 'done'}
        submitBehavior={field?.submitBehavior}
        value={value}
      />
    );
  }

  return (
    <Pressable
      accessibilityHint="Modifier la date"
      accessibilityLabel={`${accessibilityLabel} : ${formatted ?? (value || placeholder)}`}
      accessibilityRole="button"
      hitSlop={6}
      onPress={() => setEditing(true)}
      style={({ pressed }) => [
        emphasized ? styles.dateText : styles.dateChip,
        invalid && styles.invalid,
        pressed && styles.pressed,
      ]}>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          emphasized ? styles.dateTextLabel : styles.dateChipLabel,
          !formatted && value ? styles.invalidText : null,
        ]}>
        {formatted ?? (value || placeholder)}
      </Text>
    </Pressable>
  );
}

function datesStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      minHeight: 50,
      paddingHorizontal: 16,
      gap: 12,
    },
    rowSeparated: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      minHeight: 50,
      paddingHorizontal: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    rowLabel: {
      fontSize: 16,
      color: colors.ink,
    },
    rowLabelMuted: {
      fontSize: 16,
      color: colors.ink2,
    },
    delayBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
      paddingTop: 12,
      paddingBottom: 14,
    },
    delayLabel: {
      fontSize: 16,
      color: colors.ink,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    delayPills: {
      flexDirection: 'row' as const,
      gap: 8,
      paddingHorizontal: 16,
    },
    customRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    customLabel: {
      fontSize: 15,
      color: colors.ink2,
    },
    customInput: {
      ...tabularNums,
      minWidth: 88,
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.ink,
      textAlign: 'right' as const,
    },
    dateChip: {
      height: 32,
      paddingHorizontal: 11,
      borderRadius: 8,
      backgroundColor: colors.soft,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    dateChipLabel: {
      ...tabularNums,
      fontSize: 15,
      color: colors.accent,
    },
    dateText: {
      minHeight: 32,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: 8,
    },
    dateTextLabel: {
      ...tabularNums,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    dateInput: {
      ...tabularNums,
      minWidth: 130,
      height: 36,
      paddingHorizontal: 11,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.accent,
      backgroundColor: colors.surface,
      fontSize: 16,
      color: colors.ink,
      textAlign: 'right' as const,
    },
    invalid: {
      borderColor: colors.danger,
    },
    invalidText: {
      color: colors.danger,
    },
  };
}
