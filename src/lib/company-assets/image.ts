import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { CompanyAssetKind } from '@/lib/supabase/storage';
import { presentNatively } from '@/lib/native/presentation';

const CACHE_PREFIX = '@inveq/company-asset/';

/** Plus grand côté conservé : au-delà, l'image est réduite sans changer sa forme. */
const ASSET_CONFIG: Record<CompanyAssetKind, { maxSide: number; compress: number }> = {
  logo: { maxSide: 1200, compress: 0.9 },
  signature: { maxSide: 900, compress: 0.9 },
};

export async function pickCompanyAsset(kind: CompanyAssetKind): Promise<{
  uri: string;
  mimeType: string;
} | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permission refusée pour accéder à la photothèque.');
  }

  // La photothèque est une vue native : choisir un logo puis enchaîner sur la
  // signature présentait deux contrôleurs qui se chevauchaient.
  // Pas de recadrage imposé : sur iOS il est toujours carré et coupait les
  // logos larges ; l'image garde sa forme, ses marges sont gérées au rendu.
  const result = await presentNatively(() =>
    ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    }),
  );

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const config = ASSET_CONFIG[kind];
  // PNG conservé (transparence du logo) ; le reste en JPEG.
  const keepPng = (asset.mimeType ?? asset.uri).toLowerCase().includes('png');

  const image = await ImageManipulator.manipulate(asset.uri).renderAsync();
  const longest = Math.max(image.width, image.height);
  const source =
    longest > config.maxSide
      ? await ImageManipulator.manipulate(asset.uri)
          .resize(image.width >= image.height ? { width: config.maxSide } : { height: config.maxSide })
          .renderAsync()
      : image;
  const saved = await source.saveAsync({
    compress: config.compress,
    format: keepPng ? SaveFormat.PNG : SaveFormat.JPEG,
  });

  return {
    uri: saved.uri,
    mimeType: keepPng ? 'image/png' : 'image/jpeg',
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
