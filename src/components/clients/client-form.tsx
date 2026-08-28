import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { type Control, Controller, type FieldErrors, type UseFormSetValue } from 'react-hook-form';

import { FormDivider, FormField, FormSection } from '@/components/company/form-section';
import { TextField } from '@/components/ui/text-field';
import { CLIENT_PLACEHOLDERS } from '@/constants/client-placeholders';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { CLIENT_IDENTITY_HINT } from '@/lib/clients/identity';
import { formatFrenchPhoneInput } from '@/lib/format/phone';
import type { ClientFormValues } from '@/types/client';

import { ClientCompanyLookup } from './client-company-lookup';

type ClientFormTab = 'identity' | 'address' | 'legal' | 'notes';

const TABS: { id: ClientFormTab; label: string }[] = [
  { id: 'identity', label: 'Identité' },
  { id: 'address', label: 'Adresse' },
  { id: 'legal', label: 'Légal' },
  { id: 'notes', label: 'Notes' },
];

type ClientFormProps = {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  setValue: UseFormSetValue<ClientFormValues>;
  /** First-invoice path: Nom + e-mail first; the rest one tap away. */
  compact?: boolean;
};

export function ClientForm({
  control,
  errors,
  setValue,
  compact = false,
}: ClientFormProps) {
  const colors = useColors();
  const styles = useStyles();
  const [showMore, setShowMore] = useState(!compact);
  const [tab, setTab] = useState<ClientFormTab>('identity');

  if (compact) {
    return (
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{CLIENT_IDENTITY_HINT}</Text>
        <FormSection title="Identité">
          <FormField>
            <Controller
              control={control}
              name="company"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  autoCapitalize="words"
                  autoFocus
                  error={errors.company?.message}
                  label="Entreprise"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={CLIENT_PLACEHOLDERS.company}
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
                  placeholder={CLIENT_PLACEHOLDERS.lastName}
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
                  placeholder={CLIENT_PLACEHOLDERS.firstName}
                  returnKeyType="next"
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
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email?.message}
                  keyboardType="email-address"
                  label="E-mail (pour envoyer)"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={CLIENT_PLACEHOLDERS.email}
                  textContentType="emailAddress"
                  value={value}
                />
              )}
            />
          </FormField>
        </FormSection>

        {!showMore ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowMore(true)}
            style={styles.moreBtn}>
            <Text style={[styles.moreLabel, { color: colors.primary }]}>
              Plus d’informations (optionnel)
            </Text>
          </Pressable>
        ) : (
          <>
            <ClientCompanyLookup control={control} errors={errors} setValue={setValue} />
            <AddressFields control={control} errors={errors} />
            <LegalFields control={control} errors={errors} />
            <NotesField control={control} errors={errors} />
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <View style={styles.tabs}>
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={item.id}
              onPress={() => setTab(item.id)}
              style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'identity' ? (
        <>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{CLIENT_IDENTITY_HINT}</Text>
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
                    placeholder={CLIENT_PLACEHOLDERS.company}
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
                    placeholder={CLIENT_PLACEHOLDERS.lastName}
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
                    placeholder={CLIENT_PLACEHOLDERS.firstName}
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
                    placeholder={CLIENT_PLACEHOLDERS.email}
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
                    placeholder={CLIENT_PLACEHOLDERS.phone}
                    textContentType="telephoneNumber"
                    value={value}
                  />
                )}
              />
            </FormField>
            <FormDivider />
            <FormField>
              <Controller
                control={control}
                name="website"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={errors.website?.message}
                    keyboardType="url"
                    label="Site web"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder={CLIENT_PLACEHOLDERS.website}
                    textContentType="URL"
                    value={value}
                  />
                )}
              />
            </FormField>
          </FormSection>
        </>
      ) : null}

      {tab === 'address' ? <AddressFields control={control} errors={errors} /> : null}
      {tab === 'legal' ? <LegalFields control={control} errors={errors} /> : null}
      {tab === 'notes' ? <NotesField control={control} errors={errors} /> : null}
    </View>
  );
}

function AddressFields({
  control,
  errors,
}: {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
}) {
  return (
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
              placeholder={CLIENT_PLACEHOLDERS.address}
              value={value}
            />
          )}
        />
      </FormField>
      <FormDivider />
      <FormField>
        <Controller
          control={control}
          name="addressLine2"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              autoCapitalize="words"
              error={errors.addressLine2?.message}
              label="Complément d’adresse"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={CLIENT_PLACEHOLDERS.addressLine2}
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
              placeholder={CLIENT_PLACEHOLDERS.postalCode}
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
              placeholder={CLIENT_PLACEHOLDERS.city}
              value={value}
            />
          )}
        />
      </FormField>
      <FormDivider />
      <FormField>
        <Controller
          control={control}
          name="region"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              autoCapitalize="words"
              error={errors.region?.message}
              label="Région"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={CLIENT_PLACEHOLDERS.region}
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
              placeholder={CLIENT_PLACEHOLDERS.country}
              value={value}
            />
          )}
        />
      </FormField>
    </FormSection>
  );
}

function LegalFields({
  control,
  errors,
}: {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
}) {
  return (
    <FormSection title="Légal">
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
              placeholder={CLIENT_PLACEHOLDERS.vatNumber}
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
              placeholder={CLIENT_PLACEHOLDERS.siren}
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
              placeholder={CLIENT_PLACEHOLDERS.siret}
              value={value}
            />
          )}
        />
      </FormField>
    </FormSection>
  );
}

function NotesField({
  control,
  errors,
}: {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
}) {
  const styles = useStyles();
  return (
    <FormSection title="Notes">
      <FormField>
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              error={errors.notes?.message}
              label="Notes internes"
              multiline
              numberOfLines={6}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={CLIENT_PLACEHOLDERS.notes}
              style={styles.notesInput}
              textAlignVertical="top"
              value={value}
            />
          )}
        />
      </FormField>
    </FormSection>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    form: {
      gap: spacing.lg,
    },
    hint: {
      ...typography.footnote,
      lineHeight: 18,
      marginBottom: spacing.xs,
    },
    notesInput: {
      minHeight: 120,
    },
    moreBtn: {
      paddingVertical: spacing.sm,
      alignItems: 'center' as const,
    },
    moreLabel: {
      ...typography.footnoteMedium,
    },
    tabs: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.card,
      padding: spacing.xs,
    },
    tab: {
      flexGrow: 1,
      minWidth: '22%',
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.button,
    },
    tabActive: {
      backgroundColor: colors.surface,
    },
    tabLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    tabLabelActive: {
      color: colors.primary,
    },
  }));
}
