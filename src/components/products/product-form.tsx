import { StyleSheet } from 'react-native';
import { type Control, Controller, type FieldErrors } from 'react-hook-form';

import { FormDivider, FormField, FormSection } from '@/components/company/form-section';
import { TextField } from '@/components/ui/text-field';
import type { ProductFormValues } from '@/types/product';

type ProductFormProps = {
  control: Control<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
};

export function ProductForm({ control, errors }: ProductFormProps) {
  return (
    <>
      <FormSection title="Informations générales">
        <FormField>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="sentences"
                error={errors.name?.message}
                label="Nom"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Consultation"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.description?.message}
                label="Description"
                multiline
                numberOfLines={3}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Description du produit ou service..."
                style={styles.descriptionInput}
                textAlignVertical="top"
                value={value}
              />
            )}
          />
        </FormField>
      </FormSection>

      <FormSection title="Tarification">
        <FormField>
          <Controller
            control={control}
            name="unitPrice"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.unitPrice?.message}
                keyboardType="decimal-pad"
                label="Prix HT"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="100,00"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="vatRate"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                error={errors.vatRate?.message}
                keyboardType="decimal-pad"
                label="TVA"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="20"
                value={value}
              />
            )}
          />
        </FormField>
        <FormDivider />
        <FormField>
          <Controller
            control={control}
            name="unit"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="none"
                error={errors.unit?.message}
                label="Unité"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="heure, pièce, forfait..."
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
  descriptionInput: {
    minHeight: 80,
  },
});
