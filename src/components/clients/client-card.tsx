import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import type { Client } from '@/types/client';

import { ClientField } from './client-field';

export type ClientCardProps = {
  client: Client;
  onPress?: (client: Client) => void;
  style?: ViewStyle;
  testID?: string;
};

export function ClientCard({ client, onPress, style, testID }: ClientCardProps) {
  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <ClientField emphasize label="Nom" value={client.name} />
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
        <ClientField label="Société" value={client.company} />
        <ClientField label="Téléphone" value={client.phone} />
        <ClientField label="Email" value={client.email} />
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
      accessibilityRole="button"
      onPress={() => onPress(client)}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
      testID={testID}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  fields: {
    gap: spacing.sm,
  },
});
