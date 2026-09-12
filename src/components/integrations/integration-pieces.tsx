import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { IntegrationStatus } from '@/types/integrations';

const STATUS_LABELS: Record<IntegrationStatus, string> = {
  connected: 'Connecté',
  disconnected: 'Non connecté',
  reauth_required: 'Reconnexion requise',
  error: 'Erreur',
};

/** Pastille d'état. Reflète l'état réel en base, jamais un état supposé. */
export function IntegrationStatusPill({ status }: { status: IntegrationStatus | null }) {
  const colors = useColors();
  const styles = usePieceStyles();
  const effective: IntegrationStatus = status ?? 'disconnected';

  const tone =
    effective === 'connected'
      ? { background: colors.successSubtle, text: colors.success }
      : effective === 'reauth_required'
        ? { background: colors.warningSubtle, text: colors.warning }
        : effective === 'error'
          ? { background: colors.errorSubtle, text: colors.error }
          : { background: colors.surfaceSecondary, text: colors.textSecondary };

  return (
    <View style={[styles.pill, { backgroundColor: tone.background }]}>
      <Text style={[styles.pillLabel, { color: tone.text }]}>{STATUS_LABELS[effective]}</Text>
    </View>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = usePieceStyles();
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export type NoticeTone = 'warning' | 'error' | 'info';

/** Encart d'avertissement. Utilisé pour la TVA « Collect and Remit » et les PII manquantes. */
export function NoticeBox({
  tone = 'info',
  title,
  message,
}: {
  tone?: NoticeTone;
  title?: string;
  message: string;
}) {
  const colors = useColors();
  const styles = usePieceStyles();

  const palette =
    tone === 'error'
      ? { background: colors.errorSubtle, border: colors.error, text: colors.error }
      : tone === 'warning'
        ? { background: colors.warningSubtle, border: colors.warning, text: colors.warning }
        : { background: colors.primarySubtle, border: colors.primary, text: colors.primary };

  return (
    <View
      style={[styles.notice, { backgroundColor: palette.background, borderLeftColor: palette.border }]}>
      {title ? <Text style={[styles.noticeTitle, { color: palette.text }]}>{title}</Text> : null}
      <Text style={styles.noticeMessage}>{message}</Text>
    </View>
  );
}

/** État vide honnête : aucun compteur, aucune donnée de démonstration. */
export function EmptyState({ title, message }: { title: string; message: string }) {
  const styles = usePieceStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

function usePieceStyles() {
  return useThemedStyles((colors) =>
    StyleSheet.create({
      pill: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
      },
      pillLabel: {
        ...typography.footnoteMedium,
      },
      infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.md,
        paddingVertical: 6,
      },
      infoLabel: {
        ...typography.subheadline,
        color: colors.textSecondary,
        flexShrink: 1,
      },
      infoValue: {
        ...typography.subheadlineMedium,
        color: colors.text,
        textAlign: 'right',
        flexShrink: 1,
      },
      notice: {
        borderLeftWidth: 3,
        borderRadius: radius.md,
        padding: spacing.md,
        gap: 4,
      },
      noticeTitle: {
        ...typography.footnoteMedium,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      },
      noticeMessage: {
        ...typography.subheadline,
        color: colors.text,
        lineHeight: 20,
      },
      empty: {
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
      },
      emptyTitle: {
        ...typography.bodySemibold,
        color: colors.text,
      },
      emptyMessage: {
        ...typography.subheadline,
        color: colors.textSecondary,
        textAlign: 'center',
      },
    }),
  );
}
