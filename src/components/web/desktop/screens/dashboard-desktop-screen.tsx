import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { PremiumGatedSection } from '@/components/subscription/premium-gated-section';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { DesktopWorkspace } from '@/components/web/desktop/layout/desktop-workspace';
import { DesktopShortcutButton } from '@/components/web/desktop/ui/desktop-shortcut-button';
import { DesktopStatCard } from '@/components/web/desktop/ui/desktop-stat-card';
import { LoadingView } from '@/components/ui/loading-view';
import { DESKTOP_LAYOUT } from '@/constants/theme/desktop-tokens';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useDashboard } from '@/hooks/use-dashboard';
import { useSubscription } from '@/hooks/use-subscription';
import { formatCurrency } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import type { ActivityItem, Invoice } from '@/types/dashboard';

export function DashboardDesktopScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { firstName, companyName, stats, extended, recentInvoices, loading } = useDashboard();
  const { hasFeature } = useSubscription();
  const advancedStatsLocked = !hasFeature('advanced_stats');

  return (
    <View style={styles.root}>
      <DesktopTopHeader
        subtitle={companyName ?? 'Vue d’ensemble de votre activité'}
        title={firstName ? `Bonjour, ${firstName}` : 'Tableau de bord'}
      />

      <DesktopWorkspace>
        {loading ? (
          <LoadingView message="Chargement du tableau de bord…" size="small" />
        ) : (
          <>
            <View style={styles.statsRow}>
              <DesktopStatCard
                accentColor={colors.primary}
                icon={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
                label="Chiffre d'affaires"
                style={styles.stat}
                trend="Ce mois"
                value={formatCurrency(stats.monthlyRevenue)}
              />
              <DesktopStatCard
                accentColor={colors.warning}
                icon={{ ios: 'exclamationmark.circle', android: 'warning', web: 'warning' }}
                label="Factures impayées"
                style={styles.stat}
                trend={formatCurrency(stats.outstandingAmount)}
                value={String(stats.unpaidInvoices)}
              />
              <DesktopStatCard
                accentColor={colors.success}
                icon={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }}
                label="Factures payées"
                style={styles.stat}
                value={String(stats.paidInvoices)}
              />
              <DesktopStatCard
                accentColor={colors.iconSecondary}
                icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
                label="Devis en attente"
                style={styles.stat}
                value={String(stats.pendingQuotes)}
              />
              <DesktopStatCard
                accentColor={colors.primary}
                icon={{ ios: 'person.2', android: 'group', web: 'group' }}
                label="Clients actifs"
                style={styles.stat}
                value={String(stats.totalClients)}
              />
            </View>

            <View style={styles.mainGrid}>
              <View style={styles.centerColumn}>
                <DesktopPanel title="Évolution du chiffre d'affaires">
                  <PremiumGatedSection
                    bannerMessage="Statistiques avancées — offre Basique ou supérieure"
                    locked={advancedStatsLocked}>
                    <View style={styles.chartBody}>
                      <RevenueChart
                        data={extended.revenueByMonth}
                        premiumLocked={advancedStatsLocked}
                      />
                    </View>
                  </PremiumGatedSection>
                </DesktopPanel>

                <View style={styles.tablesRow}>
                  <DesktopPanel flex={1} title="Dernières factures">
                    <RecentDocumentsList
                      emptyLabel="Aucune facture récente."
                      items={recentInvoices.map((invoice) => ({
                        id: invoice.id,
                        number: invoice.number,
                        clientName: invoice.clientName,
                        amount: invoice.amount,
                        date: invoice.issuedAt,
                        status: invoice.status,
                      }))}
                      onPress={(id) =>
                        router.push(`/invoices?selected=${encodeURIComponent(id)}` as Href)
                      }
                      type="invoice"
                    />
                  </DesktopPanel>

                  <DesktopPanel flex={1} title="Activité récente">
                    <ActivityList
                      activity={extended.recentActivity}
                      locked={advancedStatsLocked}
                      onPress={(item) => {
                        const path =
                          item.type === 'invoice'
                            ? `/invoices?selected=${encodeURIComponent(item.id)}`
                            : `/quotes?selected=${encodeURIComponent(item.id)}`;
                        router.push(path as Href);
                      }}
                    />
                  </DesktopPanel>
                </View>
              </View>

              <View style={styles.rightRail}>
                <DesktopPanel title="Raccourcis">
                  <View style={styles.shortcuts}>
                    <DesktopShortcutButton
                      description="Créer et envoyer"
                      icon={{ ios: 'doc.plaintext', android: 'receipt', web: 'receipt' }}
                      label="Créer une facture"
                      onPress={() => router.push('/invoices/new' as Href)}
                    />
                    <DesktopShortcutButton
                      description="Proposer un devis"
                      icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
                      label="Créer un devis"
                      onPress={() => router.push('/quotes/new' as Href)}
                    />
                    <DesktopShortcutButton
                      description="Ajouter au CRM"
                      icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                      label="Ajouter un client"
                      onPress={() => router.push('/clients/new' as Href)}
                    />
                  </View>
                </DesktopPanel>

                <DesktopPanel title="Notifications">
                  <View style={styles.notifications}>
                    {stats.lateInvoices > 0 ? (
                      <NotificationItem
                        icon={{ ios: 'bell.badge', android: 'notifications_active', web: 'notifications_active' }}
                        label={`${stats.lateInvoices} facture${stats.lateInvoices > 1 ? 's' : ''} en retard`}
                        onPress={() => router.push('/invoices?status=overdue' as Href)}
                        tone="warning"
                      />
                    ) : null}
                    {stats.pendingQuotes > 0 ? (
                      <NotificationItem
                        icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
                        label={`${stats.pendingQuotes} devis en attente`}
                        onPress={() => router.push('/quotes?status=sent' as Href)}
                        tone="info"
                      />
                    ) : null}
                    {stats.lateInvoices === 0 && stats.pendingQuotes === 0 ? (
                      <Text style={styles.emptyNotice}>Aucune notification pour le moment.</Text>
                    ) : null}
                  </View>
                </DesktopPanel>
              </View>
            </View>
          </>
        )}
      </DesktopWorkspace>
    </View>
  );
}

type DocumentRow = {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  date: string;
  status: string;
};

function RecentDocumentsList({
  items,
  emptyLabel,
  onPress,
  type,
}: {
  items: DocumentRow[];
  emptyLabel: string;
  onPress: (id: string) => void;
  type: 'invoice' | 'quote';
}) {
  const styles = useListStyles();
  const colors = useColors();

  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          onPress={() => onPress(item.id)}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}>
          <View style={styles.icon}>
            <SymbolView
              name={
                type === 'invoice'
                  ? { ios: 'doc.plaintext', android: 'receipt', web: 'receipt' }
                  : { ios: 'doc.text', android: 'description', web: 'description' }
              }
              size={16}
              tintColor={colors.primary}
              type="hierarchical"
            />
          </View>
          <View style={styles.content}>
            <Text numberOfLines={1} style={styles.primary}>
              {item.number}
            </Text>
            <Text numberOfLines={1} style={styles.secondary}>
              {item.clientName}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ActivityList({
  activity,
  locked,
  onPress,
}: {
  activity: ActivityItem[];
  locked: boolean;
  onPress: (item: ActivityItem) => void;
}) {
  const styles = useListStyles();
  const colors = useColors();

  if (activity.length === 0) {
    return (
      <Text style={styles.empty}>
        {locked ? 'Statistiques Premium requises.' : 'Aucune activité récente.'}
      </Text>
    );
  }

  return (
    <View style={[styles.list, locked && styles.listLocked]}>
      {activity.map((item, index) => (
        <Pressable
          key={`${item.type}-${item.id}`}
          onPress={() => onPress(item)}
          style={[styles.row, index < activity.length - 1 && styles.rowBorder]}>
          <View style={styles.icon}>
            <SymbolView
              name={
                item.type === 'invoice'
                  ? { ios: 'doc.text.fill', android: 'description', web: 'description' }
                  : { ios: 'doc.plaintext.fill', android: 'article', web: 'article' }
              }
              size={16}
              tintColor={item.type === 'invoice' ? colors.primary : colors.warning}
              type="hierarchical"
            />
          </View>
          <View style={styles.content}>
            <Text numberOfLines={2} style={styles.primary}>
              {item.label}
            </Text>
            <Text style={styles.date}>{formatDate(item.date)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function NotificationItem({
  label,
  icon,
  onPress,
  tone,
}: {
  label: string;
  icon: { ios: string; android: string; web: string };
  onPress: () => void;
  tone: 'warning' | 'info';
}) {
  const styles = useNoticeStyles();
  const colors = useColors();
  const tint = tone === 'warning' ? colors.warning : colors.primary;

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <SymbolView name={icon as never} size={16} tintColor={tint} type="hierarchical" />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: { flex: 1, minHeight: 0 },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      flexWrap: 'wrap',
    },
    stat: {
      minWidth: DESKTOP_LAYOUT.statCardMinWidth,
    },
    mainGrid: {
      flexDirection: 'row',
      gap: DESKTOP_LAYOUT.panelGap,
      alignItems: 'flex-start',
    },
    centerColumn: {
      flex: 1,
      minWidth: 0,
      gap: DESKTOP_LAYOUT.panelGap,
    },
    tablesRow: {
      flexDirection: 'row',
      gap: DESKTOP_LAYOUT.panelGap,
      alignItems: 'stretch',
    },
    rightRail: {
      width: DESKTOP_LAYOUT.rightRailWidth,
      flexShrink: 0,
      gap: DESKTOP_LAYOUT.panelGap,
    },
    chartBody: {
      padding: spacing.lg,
    },
    shortcuts: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    notifications: {
      padding: spacing.md,
      gap: spacing.sm,
    },
    emptyNotice: {
      ...typography.subheadline,
      color: colors.textSecondary,
      padding: spacing.sm,
    },
  }));

const useListStyles = () =>
  useThemedStyles((colors) => ({
    list: {
      paddingVertical: spacing.xs,
    },
    listLocked: {
      opacity: 0.88,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    right: {
      alignItems: 'flex-end',
      gap: 2,
    },
    primary: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    secondary: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    amount: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    date: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    empty: {
      ...typography.subheadline,
      color: colors.textSecondary,
      padding: spacing.xl,
      textAlign: 'center',
    },
  }));

const useNoticeStyles = () =>
  useThemedStyles((colors) => ({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundSecondary,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.text,
      flex: 1,
    },
  }));
