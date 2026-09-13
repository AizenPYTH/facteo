import { router, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';
import { useTenant } from '@/hooks/use-tenant';
import { useCompanyAsset } from '@/hooks/use-company-asset';
import { useSubscription } from '@/hooks/use-subscription';
import { getAssetLabel } from '@/lib/company-assets/image';
import type { CompanyAssetKind } from '@/lib/supabase/storage';
import { useToast } from '@/providers/toast-provider';

type CompanyAssetFieldProps = {
  kind: CompanyAssetKind;
  value: string | null;
};

export function CompanyAssetField({ kind, value }: CompanyAssetFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const { scope } = useTenant();
  const { uploadAsset, deleteAsset, getOfflineFallback } = useCompanyAsset(kind);
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const featureKey = kind === 'logo' ? 'custom_logo' : 'company_signature';
  const isLocked = !hasFeature(featureKey);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const isLoading = uploadAsset.isPending || deleteAsset.isPending;
  const displayUrl = previewUrl ?? value ?? fallbackUrl;

  useEffect(() => {
    if (value) {
      setPreviewUrl(value);
    }
  }, [value]);

  useEffect(() => {
    if (value || !scope?.companyId) {
      return;
    }

    let cancelled = false;

    void getOfflineFallback(scope.companyId).then((cached) => {
      if (!cancelled && cached) {
        setFallbackUrl(cached);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [getOfflineFallback, scope?.companyId, value]);

  async function handleUpload() {
    if (isLocked) {
      router.push('/settings/premium' as Href);
      return;
    }

    try {
      const result = await uploadAsset.mutateAsync(displayUrl);

      if (result.status === 'cancelled') {
        return;
      }

      setPreviewUrl(result.url);
      setFallbackUrl(null);
      showSuccess(`${getAssetLabel(kind)} mis à jour.`);
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (isLocked) {
      router.push('/settings/premium' as Href);
      return;
    }

    try {
      const result = await deleteAsset.mutateAsync(displayUrl);

      if (result.status === 'success') {
        setPreviewUrl(null);
        setFallbackUrl(null);
        showSuccess(`${getAssetLabel(kind)} supprimé.`);
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  return (
    <View style={styles.container}>
      <PressableScale
        accessibilityLabel={getAssetLabel(kind)}
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoading }}
        disabled={isLoading}
        intensity="subtle"
        onPress={handleUpload}
        style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>{getAssetLabel(kind)}</Text>
          <Text style={styles.action}>
            {isLocked ? 'Premium' : displayUrl ? 'Remplacer' : 'Importer'}
          </Text>
        </View>

        <View style={styles.preview}>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : isLocked ? (
            <SymbolView name="lock.fill" size={22} tintColor={colors.primary} type="hierarchical" />
          ) : displayUrl ? (
            <Image
              cachePolicy="none"
              contentFit="contain"
              key={displayUrl}
              source={{ uri: displayUrl }}
              style={styles.previewImage}
            />
          ) : (
            <SymbolView
              name={{ ios: 'photo', android: 'image', web: 'image' }}
              size={22}
              tintColor={colors.iconTertiary}
              type="hierarchical"
            />
          )}
        </View>
      </PressableScale>

      {displayUrl ? (
        <PressableScale
          accessibilityRole="button"
          disabled={isLoading}
          onPress={handleDelete}
          style={styles.deleteRow}>
          <Text style={styles.deleteLabel}>Supprimer {getAssetLabel(kind).toLowerCase()}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

function readErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: string }).message);

    if (message.includes('Permission refusée')) {
      return 'Autorisez l’accès à la photothèque pour importer une image.';
    }

    if (message.includes('ArrayBuffer') || message.includes('blob')) {
      return 'Impossible de lire l’image sélectionnée. Réessayez avec une autre photo.';
    }

    if (message.includes('Bucket not found')) {
      return 'Le stockage des images n’est pas configuré. Contactez le support.';
    }

    if (message.includes('row-level security') || message.includes('RLS')) {
      return 'Vous n’avez pas l’autorisation de modifier cette image.';
    }

    return message.length > 0 ? message : 'Impossible de mettre à jour l’image.';
  }

  return 'Impossible de mettre à jour l’image.';
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: 0,
    },
    row: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    label: {
      ...textHierarchy.body,
      color: colors.text,
      fontWeight: '500',
    },
    action: {
      ...textHierarchy.caption,
      color: colors.primary,
    },
    preview: {
      width: 72,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    deleteRow: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    deleteLabel: {
      ...textHierarchy.caption,
      color: colors.error,
    },
  }));
}
