import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompanyWorkspaceSheet } from '@/components/company/company-workspace-sheet';
import { SettingsScreenHeader } from '@/components/settings';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListRow, ListRowSeparator } from '@/components/ui/list-row';
import { CompaniesDesktopScreen } from '@/components/web/desktop/screens/companies-desktop-screen';
import { spacing } from '@/constants/theme/spacing';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useTenant } from '@/hooks/use-tenant';

export default function CompaniesSettingsScreen() {
  const { isWeb, isDesktop, isTablet } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <CompaniesDesktopScreen />;
  }

  return <CompaniesSettingsMobile />;
}

/**
 * Espaces de travail.
 *
 * L'écran n'affichait qu'une carte d'explication et un bouton : il fallait
 * ouvrir la feuille de gestion pour savoir quelles entreprises existaient et
 * laquelle était active. La liste est maintenant à même l'écran, et le
 * basculement se fait d'un appui.
 */
function CompaniesSettingsMobile() {
  const styles = useStyles();
  const colors = useColors();
  const { companies, activeCompany, switchCompany } = useTenant();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <SettingsScreenHeader title="Mes entreprises" />

      <View style={styles.content}>
        {companies.length > 0 ? (
          <Card flush variant="surface">
            {companies.map((company, index) => {
              const isActive = company.id === activeCompany?.id;

              return (
                <View key={company.id}>
                  {index > 0 ? <ListRowSeparator /> : null}
                  <ListRow
                    accessibilityHint={
                      isActive ? 'Entreprise déjà active' : 'Basculer sur cette entreprise'
                    }
                    onPress={isActive ? undefined : () => switchCompany(company.id)}
                    showChevron={false}
                    subtitle={[company.city, company.siret].filter(Boolean).join(' · ') || undefined}
                    title={company.name}
                    trailing={
                      isActive ? (
                        <Badge label="Active" tone="primary" />
                      ) : (
                        <SymbolView
                          name={{ ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' }}
                          size={16}
                          tintColor={colors.iconTertiary}
                          type="hierarchical"
                        />
                      )
                    }
                  />
                </View>
              );
            })}
          </Card>
        ) : null}

        <Card variant="subtle">
          <AppText variant="title">Espaces de travail</AppText>
          <AppText color="secondary" variant="subtitle">
            Créez, renommez et organisez vos entreprises. Chaque espace a ses propres clients,
            documents et numérotation.
          </AppText>
          <Button onPress={() => setSheetVisible(true)} title="Gérer mes entreprises" />
        </Card>
      </View>

      <CompanyWorkspaceSheet
        activeCompany={activeCompany}
        companies={companies}
        onClose={() => setSheetVisible(false)}
        onSelect={switchCompany}
        visible={sheetVisible}
      />
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    content: {
      gap: spacing.lg,
      paddingTop: spacing.md,
    },
  }));
}
