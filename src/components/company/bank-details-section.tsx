import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';
import type { CompanyProfileFormValues } from '@/types/company-profile';

import { FormDivider, FormField } from './form-section';

type BankDetailsSectionProps = {
  control: Control<CompanyProfileFormValues>;
  errors: FieldErrors<CompanyProfileFormValues>;
};

export function BankDetailsSection({ control, errors }: BankDetailsSectionProps) {
  const styles = useStyles();

  return (
    <View>
      <FormField>
        <Controller
          control={control}
          name="iban"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              autoCapitalize="characters"
              error={errors.iban?.message}
              label="IBAN"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
              value={value}
            />
          )}
        />
      </FormField>
      <FormDivider />
      <FormField>
        <Controller
          control={control}
          name="bic"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              autoCapitalize="characters"
              error={errors.bic?.message}
              label="BIC"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="BNPAFRPP"
              value={value}
            />
          )}
        />
      </FormField>
      <Text style={styles.hint}>
        Ces coordonnées apparaîtront sur vos devis et factures lorsque le virement bancaire est
        activé.
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    hint: {
      ...textHierarchy.caption,
      color: colors.textSecondary,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
  }));
}
