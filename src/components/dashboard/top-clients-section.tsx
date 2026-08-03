import { StyleSheet, Text, View } from 'react-native';

import { BlurredTeaser } from '@/components/ui/blurred-teaser';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import type { TopClient } from '@/types/dashboard';

import { SectionHeader } from './section-header';

type TopClientsSectionProps = {
  clients: TopClient[];
  premiumLocked?: boolean;
};

export function TopClientsSection({ clients, premiumLocked = false }: TopClientsSectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Meilleurs clients" />
      <BlurredTeaser active={premiumLocked}>
        <View style={styles.card}>
          {clients.length === 0 ? (
            <Text style={styles.empty}>Aucun client pour le moment.</Text>
          ) : (
            clients.map((client, index) => (
              <View key={`${client.name}-${index}`}>
                <View style={styles.row}>
                  <View style={styles.leading}>
                    <Text style={styles.rank}>{index + 1}</Text>
                    <Text numberOfLines={2} style={styles.name}>
                      {client.name}
                    </Text>
                  </View>
                  <Text style={styles.amount}>{formatCurrency(client.revenue)}</Text>
                </View>
                {index < clients.length - 1 ? <View style={styles.separator} /> : null}
              </View>
            ))
          )}
        </View>
      </BlurredTeaser>
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
    overflow: 'hidden',
  },
  empty: {
    ...typography.subheadline,
    color: colors.textSecondary,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  leading: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rank: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    width: 18,
    textAlign: 'center',
    flexShrink: 0,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
    flexShrink: 1,
  },
  amount: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
}));
}
