import { type Control, Controller, type FieldErrors } from 'react-hook-form';

import { TextField } from '@/components/ui/text-field';
import type { CompanyProfileFormValues } from '@/types/company-profile';

import { FormDivider, FormField, FormSection } from './form-section';

type CompanyProfileFormProps = {
  control: Control<CompanyProfileFormValues>;
  errors: FieldErrors<CompanyProfileFormValues>;
};

export function CompanyProfileForm({ control, errors }: CompanyProfileFormProps) {
  return (
    <>
      <FormSection title="Entreprise">
        <FormField>
          <Controller
            control={control}
            name="companyName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="words"
                error={errors.companyName?.message}
                label="Nom de l'entreprise"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="FACTEO SARL"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Contact">
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
                textContentType="givenName"
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
                textContentType="fullStreetAddress"
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
                textContentType="postalCode"
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
                textContentType="addressCity"
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
                textContentType="countryName"
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
    </>
  );
}
