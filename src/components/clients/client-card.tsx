import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { iconSize } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { formatFrenchPhoneDisplay } from '@/lib/format/phone';
import { springs } from '@/lib/motion/springs';
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
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const primaryLabel = getClientDisplayName(client);
  const secondaryLabel = getClientSecondaryLabel(client);
  const initial = primaryLabel.trim().slice(0, 1).toUpperCase() || '?';

  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLabel}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text numberOfLines={1} style={styles.primaryLabel}>
            {primaryLabel}
          </Text>
          {secondaryLabel ? (
            <Text numberOfLines={1} style={styles.secondaryLabel}>
              {secondaryLabel}
            </Text>
          ) : null}
        </View>
        {onPress ? (
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={iconSize.sm}
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
    return <View testID={testID}>{content}</View>;
  }

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        accessibilityLabel={`Client ${primaryLabel}`}
        accessibilityRole="button"
        onPress={() => onPress(client)}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue mutation is safe here.
          scale.value = withSpring(0.98, springs.snappy);
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, springs.snappy);
        }}
        testID={testID}>
        {content}
      </Pressable>
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
      ...shadows.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLabel: {
      ...typography.bodySemibold,
      color: colors.primary,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      gap: 1,
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
      paddingLeft: 36 + spacing.sm,
    },
  }));
}
