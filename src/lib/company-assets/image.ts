import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { CompanyAssetKind } from '@/lib/supabase/storage';

const CACHE_PREFIX = '@facteo/company-asset/';

const ASSET_CONFIG: Record<
  CompanyAssetKind,
  { maxWidth: number; maxHeight: number; compress: number; label: string }
> = {
  logo: {
    maxWidth: 1200,
    maxHeight: 600,
    compress: 0.82,
    label: 'logo',
  },
  signature: {
    maxWidth: 800,
    maxHeight: 300,
    compress: 0.85,
    label: 'signature',
  },
};

export async function pickCompanyAsset(kind: CompanyAssetKind): Promise<{
  uri: string;
  mimeType: string;
} | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permission refusée pour accéder à la photothèque.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: kind === 'logo' ? [3, 1] : [4, 1],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const config = ASSET_CONFIG[kind];

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: config.maxWidth, height: config.maxHeight } }],
    {
      compress: config.compress,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return {
    uri: manipulated.uri,
    mimeType: 'image/jpeg',
  };
}

export async function cacheCompanyAssetUrl(
  companyId: string,
  kind: CompanyAssetKind,
  url: string | null,
): Promise<void> {
  const key = `${CACHE_PREFIX}${companyId}/${kind}`;

  if (!url) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, url);
}

export async function getCachedCompanyAssetUrl(
  companyId: string,
  kind: CompanyAssetKind,
): Promise<string | null> {
  const key = `${CACHE_PREFIX}${companyId}/${kind}`;
  return AsyncStorage.getItem(key);
}

export function getAssetLabel(kind: CompanyAssetKind): string {
  return kind === 'logo' ? 'Logo' : 'Signature';
}
