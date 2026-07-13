import { StyleSheet, View } from 'react-native';

import { CompanyAssetField } from '@/components/company/company-asset-field';
import { FormDivider, FormSection } from '@/components/company/form-section';
import type { CompanyProfileAssets } from '@/hooks/use-company-profile-assets';

type CompanyAssetsSectionProps = {
  assets: CompanyProfileAssets;
};

export function CompanyAssetsSection({ assets }: CompanyAssetsSectionProps) {
  return (
    <FormSection
      footer="Le logo et la signature apparaissent sur vos devis et factures."
      title="Identité visuelle">
      <CompanyAssetField kind="logo" value={assets.logoUrl} />
      <FormDivider />
      <CompanyAssetField kind="signature" value={assets.signatureUrl} />
    </FormSection>
  );
}
