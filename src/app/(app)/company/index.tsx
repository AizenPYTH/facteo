import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompanyProfileForm } from '@/components/company';
import { DesktopPage } from '@/components/web/desktop/desktop-page';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { NavigationHeader } from '@/components/ui/navigation-header';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';
import {
  useCompanyProfile,
  useUpdateCompanyProfile,
} from '@/hooks/use-company-profile';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useCompanyProfileAssets } from '@/hooks/use-company-profile-assets';
import { getCompanyProfileErrorMessage } from '@/lib/company-profile/errors';
import { companyProfileSchema } from '@/lib/validations/company-profile';
import { useToast } from '@/providers/toast-provider';
import {
  createEmptyCompanyProfileFormValues,
  type CompanyProfileFormValues,
} from '@/types/company-profile';

export default function CompanyProfileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const useDesktop = isWeb && (isDesktop || isTablet);
  const { data, isLoading } = useCompanyProfile();
  const { data: assets, isLoading: assetsLoading } = useCompanyProfileAssets();
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
      showSuccess('Profil enregistré.');
      reset(values);
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Une erreur est survenue lors de la sauvegarde.';

      showError(getCompanyProfileErrorMessage(rawMessage));
    }
  }

  if (isLoading || assetsLoading) {
    const loading = (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );

    if (useDesktop) {
      return (
        <View style={styles.desktopRoot}>
          <DesktopTopHeader
            subtitle="Identité, coordonnées et visuels de votre entreprise"
            title="Profil entreprise"
          />
          {loading}
        </View>
      );
    }

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {loading}
      </SafeAreaView>
    );
  }

  const form = (
    <CompanyProfileForm
      assets={{
        logoUrl: assets?.logoUrl ?? null,
        signatureUrl: assets?.signatureUrl ?? null,
      }}
      control={control}
      errors={errors}
    />
  );

  if (useDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <DesktopTopHeader
          subtitle="Identité, coordonnées et visuels de votre entreprise"
          title="Profil entreprise"
        />
        <DesktopPage>
          {form}
          <Button
            disabled={!isDirty}
            loading={isSubmitting || updateProfile.isPending}
            onPress={handleSubmit(onSubmit)}
            title="Enregistrer"
          />
        </DesktopPage>
      </View>
    );
  }

  return (
    <FormScreen
      footer={
        <Button
          disabled={!isDirty}
          loading={isSubmitting || updateProfile.isPending}
          onPress={handleSubmit(onSubmit)}
          title="Enregistrer"
        />
      }
      header={<NavigationHeader title="Profil entreprise" />}>
      <CompanyProfileForm
        assets={{
          logoUrl: assets?.logoUrl ?? null,
          signatureUrl: assets?.signatureUrl ?? null,
        }}
        control={control}
        errors={errors}
      />
    </FormScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    desktopRoot: {
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
      ...textHierarchy.subtitle,
      color: colors.textSecondary,
    },
    header: {
      paddingBottom: spacing.sm,
    },
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing['2xl'],
      gap: spacing.sectionGap,
    },
  }));
}
