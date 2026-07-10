import { StyleSheet } from 'react-native';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';

import { FormDivider, FormField, FormSection } from '@/components/company/form-section';
import { TextField } from '@/components/ui/text-field';
import type { ClientFormValues } from '@/types/client';

type ClientFormProps = {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
};

export function ClientForm({ control, errors }: ClientFormProps) {
  return (
    <>
      <FormSection title="Informations générales">
        <FormField>
          <Controller
            control={control}
            name="company"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.company?.message}
                label="Société"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Acme SARL"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="contactName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.contactName?.message}
                label="Nom du contact"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Jean Dupont"
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
                label="Email"
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
                onChangeText={onChange}
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

      <FormSection title="Informations légales">
        <FormField>
          <Controller
            control={control}
            name="siren"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.siren?.message}
                keyboardType="number-pad"
                label="SIREN"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="123 456 789"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="siret"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.siret?.message}
                keyboardType="number-pad"
                label="SIRET"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="123 456 789 00012"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
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
      </FormSection>

      <FormSection title="Notes">
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
    </>
  );
}

const styles = StyleSheet.create({
  notesInput: {
    minHeight: 96,
  },
});
