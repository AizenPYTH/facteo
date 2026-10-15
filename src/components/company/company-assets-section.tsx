import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Switch, Text, View } from 'react-native';

import { CompanyAssetField } from '@/components/company/company-asset-field';
import { FormDivider, FormSection } from '@/components/company/form-section';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import type { CompanyProfileAssets } from '@/hooks/use-company-profile-assets';
import { useTenant } from '@/hooks/use-tenant';
import { clearPdfCache } from '@/lib/pdf/document-cache';
import { settingsQueryKeys } from '@/lib/supabase/query-keys';
import { fetchSettings, updateShowLogo } from '@/lib/supabase/settings';
import { requireScope } from '@/lib/tenant/scope';
import { useToast } from '@/providers/toast-provider';

type CompanyAssetsSectionProps = {
  assets: CompanyProfileAssets;
};

export function CompanyAssetsSection({ assets }: CompanyAssetsSectionProps) {
  const styles = useStyles();
  const colors = useColors();
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const { showError } = useToast();

  // Logo sur les documents : seulement si l'entreprise l'active ici.
  const showLogoQuery = useQuery({
    queryKey: [...settingsQueryKeys.byCompany(scope?.companyId ?? ''), 'show-logo'],
    queryFn: async () => (await fetchSettings(requireScope(scope)))?.showLogo === true,
    enabled: Boolean(scope?.companyId),
  });
  const toggle = useMutation({
    mutationFn: (value: boolean) => updateShowLogo(requireScope(scope), value),
    onSuccess: () => {
      // Les PDF déjà produits ont l'ancien réglage.
      clearPdfCache();
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
    },
    onError: () => showError('Réglage du logo impossible. Réessayez.'),
  });
  const showLogo = toggle.isPending ? Boolean(toggle.variables) : showLogoQuery.data === true;

  return (
    <FormSection
      footer="Le logo n’apparaît sur vos devis et factures que si vous l’activez ; la signature apparaît sur vos documents."
      title="Identité visuelle">
      <CompanyAssetField kind="logo" value={assets.logoUrl} />
      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Afficher le logo sur mes factures et devis</Text>
        <Switch
          disabled={!assets.logoUrl || showLogoQuery.isLoading}
          onValueChange={(value) => toggle.mutate(value)}
          trackColor={{ true: colors.primary }}
          value={showLogo}
        />
      </View>
      <FormDivider />
      <CompanyAssetField kind="signature" value={assets.signatureUrl} />
    </FormSection>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    switchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    switchText: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1,
    },
  }));
}
