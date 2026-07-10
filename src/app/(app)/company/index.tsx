import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompanyProfileForm } from '@/components/company';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
} from '@/hooks/use-company-profile';
import { getCompanyProfileErrorMessage } from '@/lib/company-profile/errors';
import { companyProfileSchema } from '@/lib/validations/company-profile';
import { useToast } from '@/providers/toast-provider';
import {
  createEmptyCompanyProfileFormValues,
  type CompanyProfileFormValues,
} from '@/types/company-profile';

export default function CompanyProfileScreen() {
  const { data, isLoading } = useCompanyProfile();
  const updateProfile = useUpdateCompanyProfile();
  const { showError, showSuccess } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: createEmptyCompanyProfileFormValues(),
  });

  useEffect(() => {
    if (data) {
      reset(data);
    }
  }, [data, reset]);

  async function onSubmit(values: CompanyProfileFormValues) {
    try {
      await updateProfile.mutateAsync(values);
      showSuccess('Profil enregistré avec succès');
      reset(values);
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Une erreur est survenue lors de la sauvegarde.';

      showError(getCompanyProfileErrorMessage(rawMessage));
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={18}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text style={styles.backLabel}>Retour</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Mon entreprise
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <CompanyProfileForm control={control} errors={errors} />

          <Button
            disabled={!isDirty}
            loading={isSubmitting || updateProfile.isPending}
            onPress={handleSubmit(onSubmit)}
            title="Enregistrer"
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  backLabel: {
    ...typography.subheadlineMedium,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
});
