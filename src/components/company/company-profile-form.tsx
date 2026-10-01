import { useState } from 'react';
import {
  useWatch,
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { TextField } from '@/components/ui/text-field';
import type { CompanyLookupResult } from '@/lib/company-search/types';

import { OwnCompanyLookup } from './own-company-lookup';
import { spacing } from '@/constants/theme/spacing';
import type { CompanyProfileFormValues } from '@/types/company-profile';

import { BankDetailsSection } from './bank-details-section';
import { CompanyAssetsSection } from './company-assets-section';
import { FormDivider, FormField, FormSection } from './form-section';
import { PaymentMethodsSection } from './payment-methods-section';

type CompanyProfileFormProps = {
  control: Control<CompanyProfileFormValues>;
  errors: FieldErrors<CompanyProfileFormValues>;
  assets: {
    logoUrl: string | null;
    signatureUrl: string | null;
  };
  /** Présent : bloc « Remplir avec le SIREN ou le SIRET » en tête du formulaire. */
  setValue?: UseFormSetValue<CompanyProfileFormValues>;
};

export function CompanyProfileForm({ control, errors, assets, setValue }: CompanyProfileFormProps) {
  const paymentMethods = useWatch({ control, name: 'paymentMethods' });
  const showBankDetails = paymentMethods?.includes('bank_transfer') ?? false;
  const [registrationNumber, setRegistrationNumber] = useState('');

  function applyRegistration(result: CompanyLookupResult) {
    if (!setValue) return;
    const options = { shouldDirty: true, shouldValidate: true } as const;
    setValue('companyName', result.companyName, options);
    setValue('address', result.address, options);
    setValue('postalCode', result.postalCode, options);
    setValue('city', result.city, options);
    setValue('country', result.country, options);
    setValue('siret', result.siret, options);
    setValue('siren', result.siren, options);
    if (result.vatNumber) setValue('vatNumber', result.vatNumber, options);
  }

  return (
    <View style={styles.form}>
      {setValue ? (
        <FormSection
          footer="Vérifiez puis enregistrez."
          title="Remplir avec le SIREN ou le SIRET">
          <FormField>
            <OwnCompanyLookup
              onChange={setRegistrationNumber}
              onFound={applyRegistration}
              value={registrationNumber}
            />
          </FormField>
        </FormSection>
      ) : null}

      <FormSection title="Informations">
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
                placeholder="INVEQ SARL"
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
                onChangeText={onChange}
                placeholder="06 12 34 56 78"
                textContentType="telephoneNumber"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>

      <CompanyAssetsSection assets={assets} />

      <FormSection
        footer="Ces moyens de paiement seront affichés sur vos documents."
        title="Moyens de paiement">
        <PaymentMethodsSection control={control} />
      </FormSection>

      {showBankDetails ? (
        <FormSection title="Coordonnées bancaires">
          <BankDetailsSection control={control} errors={errors} />
        </FormSection>
      ) : null}

      <CollapsibleSection title="Options avancées">
        <FormSection>
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
          <FormDivider />
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
                  value={value ?? ''}
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
      </CollapsibleSection>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sectionGap,
  },
});
