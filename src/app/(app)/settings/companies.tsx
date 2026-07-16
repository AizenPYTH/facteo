import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompanyWorkspaceSheet } from '@/components/company/company-workspace-sheet';
import { SettingsScreenHeader } from '@/components/settings';
import { CompaniesDesktopScreen } from '@/components/web/desktop/screens/companies-desktop-screen';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useTenant } from '@/hooks/use-tenant';

export default function CompaniesSettingsScreen() {
  const { isWeb, isDesktop, isTablet } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <CompaniesDesktopScreen />;
  }

  return <CompaniesSettingsMobile />;
}

function CompaniesSettingsMobile() {
  const styles = useStyles();
  const { companies, activeCompany, switchCompany } = useTenant();
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <SettingsScreenHeader title="Mes entreprises" />
      <SurfaceCard style={styles.intro}>
        <AppText variant="title">Espaces de travail</AppText>
        <AppText color="secondary" variant="subtitle">
          Créez, renommez et organisez vos entreprises. Basculez d’un espace à l’autre en un clic
          depuis le tableau de bord.
        </AppText>
        <Button onPress={() => setSheetVisible(true)} title="Gérer mes entreprises" />
      </SurfaceCard>

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
      gap: spacing.lg,
    },
    intro: {
      marginTop: spacing.md,
      gap: spacing.md,
    },
  }));
}
