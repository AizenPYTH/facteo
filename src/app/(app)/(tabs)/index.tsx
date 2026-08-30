import { ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardHeader,
  DashboardWelcome,
  OutstandingHero,
  RecentActivitySection,
  TodoNowSection,
} from '@/components/dashboard';
import { FeatureIntroModal } from '@/components/feature-intros';
import { DashboardDesktopScreen } from '@/components/web/desktop/screens/dashboard-desktop-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { BottomTabInset } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDashboard } from '@/hooks/use-dashboard';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useTenant } from '@/hooks/use-tenant';

/**
 * Accueil — DESIGN §5.2 :
 * Reste à encaisser → À faire maintenant (≤2) → Activité récente.
 * Pas de grille de petites cartes statistiques.
 */
export default function DashboardScreen() {
  const { isDesktop, isTablet, isWeb } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <DashboardDesktopScreen />;
  }

  return <DashboardMobileScreen />;
}

function DashboardMobileScreen() {
  const styles = useStyles();
  const { firstName, companyName, stats, extended, recentInvoices, loading } = useDashboard();
  const { companies, activeCompany, switchCompany, createNewCompany } = useTenant();
  const insets = useSafeAreaInsets();
  const hasNoActivity = stats.totalClients === 0 && recentInvoices.length === 0;
  const statsIntro = useFeatureIntro('statistics');

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + spacing.lg },
        ]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <DashboardHeader
          activeCompany={activeCompany}
          companies={companies}
          companyName={companyName}
          firstName={firstName}
          onCreateCompany={async (name) => {
            await createNewCompany({ name });
          }}
          onSwitchCompany={switchCompany}
        />

        {loading ? (
          <LoadingView message="Chargement..." size="small" />
        ) : (
          <>
            {hasNoActivity ? <DashboardWelcome /> : null}
            <OutstandingHero stats={stats} />
            <TodoNowSection recentInvoices={recentInvoices} stats={stats} />
            <RecentActivitySection activity={extended.recentActivity} />
          </>
        )}
      </ScrollView>
      <FeatureIntroModal
        config={statsIntro.config}
        onClose={statsIntro.onClose}
        onCta={statsIntro.onCta}
        onDontShowAgain={statsIntro.onDontShowAgain}
        visible={statsIntro.visible}
      />
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing.md,
      gap: spacing.sectionGap,
    },
  }));
}
