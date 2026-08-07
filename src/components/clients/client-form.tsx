import { StyleSheet, View } from 'react-native';
import { type Control, Controller, type FieldErrors, type UseFormSetValue } from 'react-hook-form';

import { FormDivider, FormField, FormSection } from '@/components/company/form-section';
import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme/spacing';
import { formatFrenchPhoneInput } from '@/lib/format/phone';
import type { ClientFormValues } from '@/types/client';

import { ClientCompanyLookup } from './client-company-lookup';

type ClientFormProps = {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  setValue: UseFormSetValue<ClientFormValues>;
};

export function ClientForm({ control, errors, setValue }: ClientFormProps) {
  return (
    <View style={styles.form}>
      <ClientCompanyLookup control={control} errors={errors} setValue={setValue} />

      <FormSection title="Identité">
        <FormField>
          <Controller
            control={control}
            name="company"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.company?.message}
                label="Entreprise"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Acme SARL (ou nom + prénom)"
                textContentType="organizationName"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.lastName?.message}
                label="Nom"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Dupont"
                returnKeyType="next"
                textContentType="familyName"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.firstName?.message}
                label="Prénom"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Jean"
                returnKeyType="next"
                textContentType="givenName"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Coordonnées">
        <FormField>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                keyboardType="email-address"
                label="Adresse e-mail"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="contact@entreprise.fr"
                textContentType="emailAddress"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoComplete="tel"
                error={errors.phone?.message}
                keyboardType="phone-pad"
                label="Téléphone"
                onBlur={onBlur}
                onChangeText={(text) => onChange(formatFrenchPhoneInput(text))}
                placeholder="06 12 34 56 78"
                textContentType="telephoneNumber"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Adresse">
        <FormField>
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.address?.message}
                label="Adresse"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="12 rue de la Paix"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="postalCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.postalCode?.message}
                keyboardType="number-pad"
                label="Code postal"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="75001"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.city?.message}
                label="Ville"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Paris"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="country"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.country?.message}
                label="Pays"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="France"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Informations complémentaires">
        <FormField>
          <Controller
            control={control}
            name="vatNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="characters"
                error={errors.vatNumber?.message}
                label="Numéro de TVA"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="FR12345678901"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.notes?.message}
                label="Notes"
                multiline
                numberOfLines={4}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Informations complémentaires..."
                style={styles.notesInput}
                textAlignVertical="top"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  notesInput: {
    minHeight: 96,
  },
});
