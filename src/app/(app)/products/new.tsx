import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductForm, ProductScreenHeader } from '@/components/products';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { useProductMutations } from '@/hooks/use-product-mutations';
import { getProductErrorMessage } from '@/lib/products/errors';
import { productFormSchema } from '@/lib/validations/product';
import { useToast } from '@/providers/toast-provider';
import { createEmptyProductFormValues, type ProductFormValues } from '@/types/product';

export default function NewProductScreen() {
  const { createProduct } = useProductMutations();
  const { showError, showSuccess } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: createEmptyProductFormValues(),
  });

  async function onSubmit(values: ProductFormValues) {
    try {
      await createProduct.mutateAsync(values);
      showSuccess('Produit ajouté avec succès');
      router.back();
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Une erreur est survenue lors de la création.';

      showError(getProductErrorMessage(rawMessage));
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.header}>
          <ProductScreenHeader title="Nouveau produit" />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ProductForm control={control} errors={errors} />
          <Button
            loading={isSubmitting || createProduct.isPending}
            onPress={handleSubmit(onSubmit)}
            title="Enregistrer le produit"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
});
