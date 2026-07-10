import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DashboardHeader,
  QuickActions,
  RecentInvoicesSection,
  SectionHeader,
  StatsGrid,
} from '@/components/dashboard';
import { BottomTabInset } from '@/constants/theme';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { useDashboard } from '@/hooks/use-dashboard';

export default function DashboardScreen() {
  const { firstName, companyName, stats, recentInvoices, loading } = useDashboard();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}>
        <DashboardHeader companyName={companyName} firstName={firstName} />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : (
          <StatsGrid stats={stats} />
        )}

        <View style={styles.section}>
          <SectionHeader title="Quick Actions" />
          <QuickActions />
        </View>

        <RecentInvoicesSection invoices={recentInvoices} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
});
