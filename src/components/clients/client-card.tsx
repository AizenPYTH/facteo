import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatFrenchPhoneDisplay } from '@/lib/format/phone';
import { getClientDisplayName, getClientSecondaryLabel, type Client } from '@/types/client';

import { ClientField } from './client-field';

export type ClientCardProps = {
  client: Client;
  onPress?: (client: Client) => void;
  style?: ViewStyle;
  testID?: string;
};

export function ClientCard({ client, onPress, style, testID }: ClientCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const primaryLabel = getClientDisplayName(client);
  const secondaryLabel = getClientSecondaryLabel(client);

  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text numberOfLines={2} style={styles.primaryLabel}>
            {primaryLabel}
          </Text>
          {secondaryLabel ? (
            <Text numberOfLines={2} style={styles.secondaryLabel}>
              {secondaryLabel}
            </Text>
          ) : null}
        </View>
        {onPress ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
        ) : null}
      </View>

      <View style={styles.fields}>
        <ClientField label="Téléphone" value={formatFrenchPhoneDisplay(client.phone)} />
        <ClientField label="Adresse e-mail" value={client.email} />
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={styles.wrapper} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={`Client ${primaryLabel}`}
      accessibilityRole="button"
      onPress={() => onPress(client)}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      testID={testID}>
      {content}
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  wrapper: {
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.backgroundSecondary,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  primaryLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    flexShrink: 1,
  },
  secondaryLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  fields: {
    gap: spacing.sm,
  },
}));
}
