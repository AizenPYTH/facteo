import { Image, type ImageProps } from 'expo-image';

import { useCompanyAssetSrc } from '@/lib/company-assets/asset-url';

/**
 * Logo ou signature d'entreprise : le bucket est privé, l'adresse enregistrée
 * est remplacée par une URL signée. Rien n'est affiché tant qu'elle n'est pas prête.
 */
export function CompanyAssetImage({ uri, ...props }: Omit<ImageProps, 'source'> & { uri: string | null | undefined }) {
  const src = useCompanyAssetSrc(uri);
  if (!src) return null;
  return <Image {...props} source={{ uri: src }} />;
}
