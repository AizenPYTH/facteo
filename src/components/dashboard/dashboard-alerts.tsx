import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import { triggerHaptic } from '@/lib/haptics';
import type { DashboardStats } from '@/types/dashboard';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type ActionTone = 'warning' | 'info' | 'neutral';

type ActionItem = {
  key: string;
  label: string;
  detail?: string;
  href: Href;
  icon: SymbolName;
  tone: ActionTone;
};

type DashboardAlertsProps = {
  stats: Pick<
    DashboardStats,
    | 'lateInvoices'
    | 'pendingQuotes'
    | 'draftInvoices'
    | 'draftQuotes'
    | 'dueThisWeek'
    | 'staleQuotes'
    | 'outstandingAmount'
  >;
  /** Hide section title when embedded in a titled panel. */
  compact?: boolean;
};

/**
 * Action Center — actionable worklist for today, not decorative metrics.
 */
export function DashboardAlerts({ stats, compact = false }: DashboardAlertsProps) {
  const styles = useStyles();

  const actions = buildActions(stats);

  if (actions.length === 0) {
    if (compact) {
      return <Text style={styles.empty}>Rien à traiter pour le moment.</Text>;
    }
    return null;
  }

  return (
    <View style={styles.section}>
      {compact ? null : (
        <>
      <Text style={styles.title}>À faire aujourd’hui</Text>
      <Text style={styles.subtitle}>
        Qui relancer, quoi encaisser — en moins d’une minute.
      </Text>
        </>
      )}
      <View style={styles.card}>
        {actions.map((action, index) => (
          <View key={action.key}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <AlertRow
              detail={action.detail}
              icon={action.icon}
              label={action.label}
              onPress={() => router.push(action.href)}
              tone={action.tone}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

function buildActions(
  stats: DashboardAlertsProps['stats'],
): ActionItem[] {
  const actions: ActionItem[] = [];

  if (stats.lateInvoices > 0) {
    actions.push({
      key: 'late',
      label: `${stats.lateInvoices} facture${stats.lateInvoices > 1 ? 's' : ''} à relancer`,
      detail: 'Sélectionnez et relancez en moins d’une minute',
      href: '/invoices?status=overdue&select=1' as Href,
      icon: { ios: 'bell.badge.fill', android: 'notifications_active', web: 'notifications_active' },
      tone: 'warning',
    });
  }

  if (stats.dueThisWeek > 0) {
    actions.push({
      key: 'due-week',
      label: `${stats.dueThisWeek} paiement${stats.dueThisWeek > 1 ? 's' : ''} attendu${stats.dueThisWeek > 1 ? 's' : ''} cette semaine`,
      detail: 'Anticiper avant l’échéance',
      href: '/invoices?due=week&select=1' as Href,
      icon: { ios: 'calendar', android: 'event', web: 'event' },
      tone: 'info',
    });
  }

  if (stats.staleQuotes > 0) {
    actions.push({
      key: 'stale-quotes',
      label: `${stats.staleQuotes} devis sans réponse depuis 7 jours`,
      detail: 'Relancer le client',
      href: '/quotes?status=sent' as Href,
      icon: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
      tone: 'warning',
    });
  } else if (stats.pendingQuotes > 0) {
    actions.push({
      key: 'pending-quotes',
      label: `${stats.pendingQuotes} devis en attente de réponse`,
      detail: 'Suivre le pipeline',
      href: '/quotes?status=sent' as Href,
      icon: { ios: 'doc.text.fill', android: 'description', web: 'description' },
      tone: 'info',
    });
  }

  if (stats.draftInvoices > 0) {
    actions.push({
      key: 'draft-invoices',
      label: `${stats.draftInvoices} brouillon${stats.draftInvoices > 1 ? 's' : ''} de facture`,
      detail: 'Finaliser et envoyer',
      href: '/invoices?status=draft' as Href,
      icon: { ios: 'pencil', android: 'edit', web: 'edit' },
      tone: 'neutral',
    });
  }

  if (stats.draftQuotes > 0) {
    actions.push({
      key: 'draft-quotes',
      label: `${stats.draftQuotes} brouillon${stats.draftQuotes > 1 ? 's' : ''} de devis`,
      detail: 'Finaliser et envoyer',
      href: '/quotes?status=draft' as Href,
      icon: { ios: 'pencil.and.outline', android: 'edit_note', web: 'edit_note' },
      tone: 'neutral',
    });
  }

  if (stats.outstandingAmount > 0 && stats.lateInvoices === 0 && stats.dueThisWeek === 0) {
    actions.push({
      key: 'outstanding',
      label: `${formatCurrency(stats.outstandingAmount)} à encaisser`,
      detail: 'Voir les factures ouvertes',
      href: '/invoices?status=sent' as Href,
      icon: { ios: 'banknote.fill', android: 'payments', web: 'payments' },
      tone: 'info',
    });
  }

  return actions;
}

function AlertRow({
  label,
  detail,
  icon,
  onPress,
  tone,
}: {
  label: string;
  detail?: string;
  icon: SymbolName;
  onPress: () => void;
  tone: ActionTone;
}) {
  const styles = useStyles();
  const colors = useColors();
  const tint =
    tone === 'warning' ? colors.warning : tone === 'info' ? colors.primary : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconWell, { backgroundColor: colors.primarySubtle }]}>
        <SymbolView name={icon} size={18} tintColor={tint} type="hierarchical" />
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14}
        tintColor={colors.iconTertiary}
        type="hierarchical"
      />
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.sm,
    },
    title: {
      ...type.section,
      fontSize: 20,
      lineHeight: 25,
      color: colors.text,
    },
    subtitle: {
      ...type.secondary,
      color: colors.textSecondary,
      marginBottom: spacing[1],
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 0.5,
      borderColor: colors.border,
      overflow: 'hidden',
      ...elevation[1],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    pressed: {
      backgroundColor: colors.backgroundSelected,
    },
    iconWell: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    label: {
      ...type.cardTitle,
      color: colors.text,
    },
    detail: {
      ...type.caption,
      color: colors.textSecondary,
    },
    separator: {
      height: 0.5,
      backgroundColor: colors.separator,
      marginLeft: spacing.md + 36 + spacing.md,
    },
    empty: {
      ...type.secondary,
      color: colors.textSecondary,
      paddingVertical: spacing.sm,
    },
  }));
}
