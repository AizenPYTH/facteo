import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { OutstandingHero } from '@/components/dashboard/outstanding-hero';
import { RecentActivitySection } from '@/components/dashboard/recent-activity-section';
import { TodoNowSection } from '@/components/dashboard/todo-now-section';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { DesktopWorkspace } from '@/components/web/desktop/layout/desktop-workspace';
import { DesktopShortcutButton } from '@/components/web/desktop/ui/desktop-shortcut-button';
import { LoadingView } from '@/components/ui/loading-view';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useDashboard } from '@/hooks/use-dashboard';

/** Accueil web — même hiérarchie DESIGN §5.2 (pas de grille de stats). */
export function DashboardDesktopScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { firstName, companyName, stats, extended, recentInvoices, loading } = useDashboard();

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
          <View style={styles.layout}>
            <View style={styles.main}>
              <OutstandingHero stats={stats} />
              <TodoNowSection recentInvoices={recentInvoices} stats={stats} />
              <RecentActivitySection activity={extended.recentActivity} />
            </View>

            <View style={styles.rail}>
              <DesktopPanel title="Créer">
                <View style={styles.shortcuts}>
                  <DesktopShortcutButton
                    description="Créer et envoyer"
                    icon={{ ios: 'doc.plaintext', android: 'receipt', web: 'receipt' }}
                    label="Créer une facture"
                    onPress={() => router.push('/documents/invoices/new' as Href)}
                  />
                  <DesktopShortcutButton
                    description="Proposer un devis"
                    icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
                    label="Créer un devis"
                    onPress={() => router.push('/documents/quotes/new' as Href)}
                  />
                  <DesktopShortcutButton
                    description="Ajouter au CRM"
                    icon={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }}
                    label="Ajouter un client"
                    onPress={() => router.push('/clients/new' as Href)}
                  />
                </View>
              </DesktopPanel>

              <DesktopPanel title="À surveiller">
                <View style={styles.notifications}>
                  {stats.lateInvoices > 0 ? (
                    <Pressable
                      onPress={() => router.push('/documents?segment=invoices' as Href)}
                      style={styles.noticeRow}>
                      <SymbolView
                        name={{
                          ios: 'bell.badge',
                          android: 'notifications_active',
                          web: 'notifications_active',
                        }}
                        size={18}
                        tintColor={colors.warning}
                      />
                      <Text style={styles.noticeLabel}>
                        {stats.lateInvoices} facture{stats.lateInvoices > 1 ? 's' : ''} en retard
                      </Text>
                    </Pressable>
                  ) : null}
                  {stats.pendingQuotes > 0 ? (
                    <Pressable
                      onPress={() => router.push('/documents?segment=quotes' as Href)}
                      style={styles.noticeRow}>
                      <SymbolView
                        name={{ ios: 'doc.text', android: 'description', web: 'description' }}
                        size={18}
                        tintColor={colors.primary}
                      />
                      <Text style={styles.noticeLabel}>
                        {stats.pendingQuotes} devis en attente
                      </Text>
                    </Pressable>
                  ) : null}
                  {stats.lateInvoices === 0 && stats.pendingQuotes === 0 ? (
                    <Text style={styles.emptyNotice}>Rien d’urgent pour le moment.</Text>
                  ) : null}
                </View>
              </DesktopPanel>
            </View>
          </View>
        )}
      </DesktopWorkspace>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    layout: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.lg,
    },
    main: {
      flex: 1,
      gap: spacing.sectionGap,
      minWidth: 0,
    },
    rail: {
      width: 320,
      gap: spacing.md,
    },
    shortcuts: {
      gap: spacing.sm,
    },
    notifications: {
      gap: spacing.sm,
    },
    noticeRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      minHeight: 44,
    },
    noticeLabel: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    emptyNotice: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
  }));
}
