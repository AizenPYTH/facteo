import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

import { press } from '@/constants/theme/interaction';
import { entrance, spring } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { formatFrenchPhoneDisplay } from '@/lib/format/phone';
import { triggerHaptic } from '@/lib/haptics';
import { getClientDisplayName, getClientSecondaryLabel, type Client } from '@/types/client';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ClientCardProps = {
  client: Client;
  onPress?: (client: Client) => void;
  index?: number;
  style?: ViewStyle;
  testID?: string;
};

export function ClientCard({ client, onPress, index = 0, style, testID }: ClientCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const primaryLabel = getClientDisplayName(client);
  const secondaryLabel = getClientSecondaryLabel(client);
  const phone = formatFrenchPhoneDisplay(client.phone);
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const stagger =
    Math.min(index, entrance.listStaggerMax - 1) * entrance.listStagger;

  const initial = (primaryLabel.trim().charAt(0) || '?').toUpperCase();

  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.primaryLabel}>
          {primaryLabel}
        </Text>
        {secondaryLabel ? (
          <Text numberOfLines={1} style={styles.secondaryLabel}>
            {secondaryLabel}
          </Text>
        ) : null}
        <Text numberOfLines={1} style={styles.meta}>
          {[phone, client.email].filter(Boolean).join(' · ') || 'Aucune coordonnée'}
        </Text>
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
  );

  const inner = onPress ? (
    <AnimatedPressable
      accessibilityLabel={`Client ${primaryLabel}`}
      accessibilityRole="button"
      onPress={() => {
        void triggerHaptic('selection');
        onPress(client);
      }}
      onPressIn={() => {
        scale.value = withSpring(press.card.scale, spring.snappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring.snappy);
      }}
      style={animatedStyle}
      testID={testID}>
      {content}
    </AnimatedPressable>
  ) : (
    <View testID={testID}>{content}</View>
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(stagger).duration(entrance.listItemDuration).springify()}>
      {inner}
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      ...type.cardTitle,
      color: colors.primary,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    primaryLabel: {
      ...type.cardTitle,
      color: colors.text,
    },
    secondaryLabel: {
      ...type.secondary,
      color: colors.textSecondary,
    },
    meta: {
      ...type.caption,
      color: colors.textTertiary,
      marginTop: 2,
    },
  }));
}
