import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DashboardHeader,
  DashboardHero,
  DashboardSkeleton,
  DashboardTodayTasks,
  DashboardWelcome,
  ExtendedStatsGrid,
  QuickActions,
  RecentActivitySection,
  RecentInvoicesSection,
  RevenueChart,
  SectionHeader,
  StatsGrid,
  TopClientsSection,
  TopPrestationsSection,
} from '@/components/dashboard';
import { PremiumGatedSection } from '@/components/subscription/premium-gated-section';
import { ErrorState } from '@/components/ui/error-state';
import { StaggerIn } from '@/components/ui/stagger-in';
import { DashboardDesktopScreen } from '@/components/web/desktop/screens/dashboard-desktop-screen';
import { spacing } from '@/constants/theme/spacing';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useDashboard } from '@/hooks/use-dashboard';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useSubscription } from '@/hooks/use-subscription';
import { useTenant } from '@/hooks/use-tenant';
import type { MonthlyRevenue } from '@/types/dashboard';

export default function DashboardScreen() {
  const { isDesktop, isTablet, isWeb } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <DashboardDesktopScreen />;
  }

  return <DashboardMobileScreen />;
}

/** Mois précédent, quand la série en compte au moins deux. Sert à la tendance. */
function previousMonthRevenue(series: MonthlyRevenue[]): number | undefined {
  return series.length >= 2 ? series[series.length - 2].amount : undefined;
}

function DashboardMobileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const insets = useScreenInsets();

  const {
    firstName,
    companyName,
    stats,
    extended,
    recentInvoices,
    loading,
    error,
    refetch,
  } = useDashboard();
  const { companies, activeCompany, switchCompany, createNewCompany } = useTenant();
  const { hasFeature } = useSubscription();

  const advancedStatsLocked = !hasFeature('advanced_stats');
  const isEmptyAccount = stats.totalClients === 0 && recentInvoices.length === 0;

  // `refetch` de React Query résout même en cas d'échec ; l'état d'erreur, lui,
  // est rendu par `ErrorState`. On ne garde ici que l'indicateur de tirage.
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const header = (
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
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.scrollBottom }]}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            onRefresh={handleRefresh}
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        {header}

        {loading ? (
          <DashboardSkeleton />
        ) : error ? (
          // Un échec réseau affichait « 0 € encaissé ». Il se voit maintenant,
          // et propose une reprise.
          <ErrorState
            message="Vérifiez votre connexion, puis réessayez."
            onRetry={() => {
              void refetch();
            }}
            title="Tableau de bord indisponible"
          />
        ) : isEmptyAccount ? (
          <StaggerIn index={0}>
            <DashboardWelcome firstName={firstName} />
          </StaggerIn>
        ) : (
          <>
            <StaggerIn index={0}>
              <DashboardHero
                monthlyRevenue={stats.monthlyRevenue}
                onPress={() => router.push('/invoices' as Href)}
                previousMonthRevenue={previousMonthRevenue(extended.revenueByMonth)}
                yearlyRevenue={stats.yearlyRevenue}
              />
            </StaggerIn>

            <StaggerIn index={1}>
              <StatsGrid stats={stats} />
            </StaggerIn>

            <StaggerIn index={2}>
              <View style={styles.section}>
                <SectionHeader title="Créer" />
                <QuickActions />
              </View>
            </StaggerIn>

            <StaggerIn index={3}>
              <DashboardTodayTasks invoices={recentInvoices} />
            </StaggerIn>

            <StaggerIn index={4}>
              <RecentInvoicesSection
                invoices={recentInvoices}
                onInvoicePress={(invoice) => router.push(`/invoices/${invoice.id}` as Href)}
              />
            </StaggerIn>

            <PremiumGatedSection
              bannerMessage="Statistiques avancées — INVEQ Premium"
              locked={advancedStatsLocked}>
              <ExtendedStatsGrid premiumLocked={advancedStatsLocked} stats={stats} />
              <RevenueChart data={extended.revenueByMonth} premiumLocked={advancedStatsLocked} />
              <TopClientsSection clients={extended.topClients} premiumLocked={advancedStatsLocked} />
              <TopPrestationsSection
                premiumLocked={advancedStatsLocked}
                prestations={extended.topPrestations}
              />
              <RecentActivitySection
                activity={extended.recentActivity}
                premiumLocked={advancedStatsLocked}
              />
            </PremiumGatedSection>
          </>
        )}
      </ScrollView>
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
    section: {
      gap: spacing.md,
    },
  }));
}
