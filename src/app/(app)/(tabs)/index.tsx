import { router, type Href } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardAlerts,
  DashboardHeader,
  DashboardSkeleton,
  DashboardWelcome,
  ExtendedStatsGrid,
  QuickActions,
  RecentActivitySection,
  RecentInvoicesSection,
  ReplayLastSection,
  RevenueChart,
  SectionHeader,
  StatsGrid,
  TopClientsSection,
  TopPrestationsSection,
} from '@/components/dashboard';
import { PremiumGatedSection } from '@/components/subscription/premium-gated-section';
import { DashboardDesktopScreen } from '@/components/web/desktop/screens/dashboard-desktop-screen';
import { BottomTabInset } from '@/constants/theme';
import { entrance } from '@/constants/theme/motion';
import { spacing } from '@/constants/theme/spacing';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
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
  const { firstName, companyName, stats, extended, recentInvoices, loading } = useDashboard();
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
          { paddingBottom: insets.bottom + BottomTabInset + spacing.xl },
        ]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(entrance.cardDuration).springify()}>
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
        </Animated.View>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {hasNoActivity ? <DashboardWelcome /> : null}
            <StatsGrid stats={stats} />
            <DashboardAlerts stats={stats} />
            {!hasNoActivity ? <ReplayLastSection invoices={recentInvoices} /> : null}
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

        <Animated.View
          entering={FadeInDown.delay(entrance.listStagger * 4)
            .duration(entrance.cardDuration)
            .springify()}
          style={styles.section}>
          <SectionHeader title="Actions rapides" />
          <QuickActions />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(entrance.listStagger * 5)
            .duration(entrance.cardDuration)
            .springify()}>
          <RecentInvoicesSection
            invoices={recentInvoices}
            onInvoicePress={(invoice) => router.push(`/invoices/${invoice.id}` as Href)}
          />
        </Animated.View>
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
      paddingTop: spacing.lg,
      gap: spacing.xl,
    },
    section: {
      gap: spacing.md,
    },
  }));
}
