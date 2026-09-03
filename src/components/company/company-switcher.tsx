import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CompanyWorkspaceSheet } from '@/components/company/company-workspace-sheet';
import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import type { TenantCompany } from '@/types/tenant';

type CompanySwitcherProps = {
  companies: TenantCompany[];
  activeCompany: TenantCompany | null;
  onSelect: (companyId: string) => void;
  onCreate: (name: string) => Promise<void>;
};

export function CompanySwitcher({
  companies,
  activeCompany,
  onSelect,
}: CompanySwitcherProps) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PressableScale
        accessibilityLabel="Changer d'entreprise"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        intensity="subtle"
        style={styles.trigger}>
        <View style={styles.avatar}>
          {activeCompany?.logoUrl ? (
            <Image
              contentFit="cover"
              source={{ uri: activeCompany.logoUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <AppText variant="caption">
              {(activeCompany?.name ?? 'E').slice(0, 1).toUpperCase()}
            </AppText>
          )}
        </View>
        <View style={styles.triggerText}>
          <AppText medium numberOfLines={1} variant="body">
            {activeCompany?.name ?? 'Choisir une entreprise'}
          </AppText>
          <AppText color="secondary" numberOfLines={1} variant="caption">
            {companies.length} entreprise{companies.length > 1 ? 's' : ''}
          </AppText>
        </View>
        <SymbolView
          name={{ ios: 'chevron.up.chevron.down', android: 'unfold_more', web: 'unfold_more' }}
          size={16}
          tintColor={colors.textSecondary}
        />
      </PressableScale>

      <CompanyWorkspaceSheet
        activeCompany={activeCompany}
        companies={companies}
        onClose={() => setOpen(false)}
        onSelect={onSelect}
        visible={open}
      />
    </>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    trigger: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      maxWidth: 280,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    triggerText: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    pressed: {
      opacity: 0.88,
    },
  }));
