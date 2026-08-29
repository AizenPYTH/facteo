import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { frenchDateInputToIso, isoToFrenchDateInput } from '@/lib/format/date-input';

type DateFieldRequirement = 'required' | 'optional' | 'none';

type DateFieldProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Affiche « requis » / « · facultatif » — DESIGN §3.3 */
  requirement?: DateFieldRequirement;
};

/**
 * Champ de date natif — DESIGN §5.3.
 * La valeur échangée avec les formulaires reste au format JJ/MM/AAAA.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  requirement = 'none',
}: DateFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [draftDate, setDraftDate] = useState(() => pickerDateFromFrenchInput(value));

  function handleOpen() {
    const pickerDate = pickerDateFromFrenchInput(value);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: pickerDate,
        mode: 'date',
        display: 'default',
        negativeButton: { label: 'Annuler', textColor: colors.textSecondary },
        positiveButton: { label: 'Valider', textColor: colors.primary },
        onValueChange: (_event, selectedDate) => {
          onChange(isoToFrenchDateInput(selectedDate.toISOString()));
        },
        ...(requirement === 'optional'
          ? {
              neutralButton: { label: 'Effacer', textColor: colors.textTertiary },
              onNeutralButtonPress: () => onChange(''),
            }
          : {}),
      });
      return;
    }

    setDraftDate(pickerDate);
    setIosPickerVisible(true);
  }

  if (Platform.OS === 'web') {
    return (
      <TextFieldFallback
        error={error}
        label={label}
        onChange={onChange}
        requirement={requirement}
        value={value}
      />
    );
  }

  return (
    <View style={styles.container}>
      {label ? (
        <View style={styles.labelRow}>
          <Text maxFontSizeMultiplier={1.5} style={styles.label}>
            {label}
          </Text>
          {requirement === 'required' ? (
            <Text maxFontSizeMultiplier={1.5} style={styles.required}>
              {' '}
              requis
            </Text>
          ) : null}
          {requirement === 'optional' ? (
            <Text maxFontSizeMultiplier={1.5} style={styles.optional}>
              {' '}
              · facultatif
            </Text>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityHint="Ouvre le sélecteur de date"
        accessibilityLabel={`${label ?? 'Date'} : ${value || 'non renseignée'}`}
        accessibilityRole="button"
        onPress={handleOpen}
        style={({ pressed }) => [
          styles.input,
          pressed ? styles.inputPressed : null,
          error ? styles.inputError : null,
        ]}>
        <Text
          maxFontSizeMultiplier={1.5}
          style={[styles.value, !value ? styles.placeholder : null]}>
          {value || 'JJ/MM/AAAA'}
        </Text>
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          size={19}
          tintColor={error ? colors.error : colors.textTertiary}
        />
      </Pressable>

      {error ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Text>
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setIosPickerVisible(false)}
        statusBarTranslucent
        transparent
        visible={Platform.OS === 'ios' && iosPickerVisible}>
        <View style={styles.overlay}>
          <Pressable
            accessibilityLabel="Fermer le sélecteur de date"
            onPress={() => setIosPickerVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet}>
            <Text maxFontSizeMultiplier={1.5} style={styles.sheetTitle}>
              {label ?? 'Choisir une date'}
            </Text>
            <DateTimePicker
              display="spinner"
              locale="fr-FR"
              mode="date"
              onValueChange={(_event, selectedDate) => setDraftDate(selectedDate)}
              textColor={colors.text}
              value={draftDate}
            />
            <View style={styles.actions}>
              <Button
                onPress={() => setIosPickerVisible(false)}
                style={styles.action}
                title="Annuler"
                variant="tertiary"
              />
              <Button
                onPress={() => {
                  onChange(isoToFrenchDateInput(draftDate.toISOString()));
                  setIosPickerVisible(false);
                }}
                style={styles.action}
                title="Valider"
              />
            </View>
            {requirement === 'optional' && value ? (
              <Button
                onPress={() => {
                  onChange('');
                  setIosPickerVisible(false);
                }}
                title="Effacer la date"
                variant="tertiary"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function pickerDateFromFrenchInput(value: string): Date {
  const iso = frenchDateInputToIso(value);

  if (!iso) {
    return new Date();
  }

  const parsed = new Date(iso);
  return new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12);
}

function TextFieldFallback({
  label,
  value,
  onChange,
  error,
  requirement,
}: Required<Pick<DateFieldProps, 'value' | 'onChange' | 'requirement'>> &
  Pick<DateFieldProps, 'label' | 'error'>) {
  return (
    <TextField
      error={error}
      label={label}
      onChangeText={onChange}
      placeholder="JJ/MM/AAAA"
      requirement={requirement}
      value={value}
    />
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
    },
    labelRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
    },
    label: {
      ...typography.caption1,
      fontFamily: typography.caption2.fontFamily,
      color: colors.textSecondary,
    },
    required: {
      ...typography.caption1,
      color: colors.error,
    },
    optional: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    input: {
      minHeight: 44,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: 0,
      borderRadius: radius.input,
    },
    inputPressed: {
      backgroundColor: colors.primarySubtle,
    },
    inputError: {
      borderBottomWidth: 1,
      borderBottomColor: colors.error,
    },
    value: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    placeholder: {
      color: colors.textPlaceholder,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
    },
    overlay: {
      flex: 1,
      justifyContent: 'flex-end' as const,
      backgroundColor: colors.overlay,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      padding: spacing.lg,
      gap: spacing.md,
    },
    sheetTitle: {
      ...typography.title3,
      color: colors.text,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    action: {
      flex: 1,
    },
  }));
}
