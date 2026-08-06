import { router, type Href } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardHeader,
  DashboardSkeleton,
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
import { DashboardDesktopScreen } from '@/components/web/desktop/screens/dashboard-desktop-screen';
import { BottomTabInset } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDashboard } from '@/hooks/use-dashboard';
import { useSubscription } from '@/hooks/use-subscription';
import { useTenant } from '@/hooks/use-tenant';

export default function DashboardScreen() {
  const { isDesktop, isTablet, isWeb } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <DashboardDesktopScreen />;
  }

  return <DashboardMobileScreen />;
}

function DashboardMobileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { firstName, companyName, stats, extended, recentInvoices, loading, isRefetching, refetch } =
    useDashboard();
  const { companies, activeCompany, switchCompany, createNewCompany } = useTenant();
  const { hasFeature } = useSubscription();
  const advancedStatsLocked = !hasFeature('advanced_stats');
  const insets = useSafeAreaInsets();
  const hasNoActivity = stats.totalClients === 0 && recentInvoices.length === 0;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + spacing.lg },
        ]}
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refetch()}
            refreshing={isRefetching}
            tintColor={colors.primary}
          />
        }
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
          <DashboardSkeleton />
        ) : (
          <>
            {hasNoActivity ? <DashboardWelcome /> : null}
            <StatsGrid stats={stats} />
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

        <View style={styles.section}>
          <SectionHeader title="Actions rapides" />
          <QuickActions />
        </View>

        <RecentInvoicesSection
          invoices={recentInvoices}
          onInvoicePress={(invoice) => router.push(`/invoices/${invoice.id}` as Href)}
        />
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
