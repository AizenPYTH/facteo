import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import type { SentDocument } from '@/types/sent-document';

import { SectionHeader } from '../dashboard/section-header';

type SentDocumentsSectionProps = {
  documents: SentDocument[];
  loading?: boolean;
};

const CHANNEL_LABELS: Record<SentDocument['channel'], string> = {
  mail: 'E-mail',
  share: 'Partage',
  resend: 'E-mail automatique',
};

export function SentDocumentsSection({ documents, loading = false }: SentDocumentsSectionProps) {
  const styles = useStyles();
  const colors = useColors();
  if (loading) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Historique des envois" />
        <Text style={styles.empty}>Chargement...</Text>
      </View>
    );
  }

  if (documents.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Historique des envois" />
      <View style={styles.card}>
        {documents.map((document, index) => (
          <View key={document.id}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.subject}>{document.subject}</Text>
                <Text style={styles.meta}>
                  {CHANNEL_LABELS[document.channel]} · {document.recipientEmail}
                </Text>
                <Text style={styles.date}>{formatDate(document.sentAt)}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  section: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowContent: {
    gap: spacing.xs,
  },
  subject: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
  meta: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  date: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
  empty: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
}));
}
