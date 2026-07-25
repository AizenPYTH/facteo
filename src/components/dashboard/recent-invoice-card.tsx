import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { press } from '@/constants/theme/interaction';
import { spring } from '@/constants/theme/motion';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { formatCurrency } from '@/lib/format/currency';
import { triggerHaptic } from '@/lib/haptics';
import { newInvoiceHref } from '@/lib/navigation/new-document';
import type { Invoice } from '@/types/dashboard';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type RecentInvoiceCardProps = {
  invoice: Invoice;
  onPress?: () => void;
  showSeparator?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function RecentInvoiceCard({
  invoice,
  onPress,
  showSeparator = false,
  style,
  testID,
}: RecentInvoiceCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const canReplay = Boolean(invoice.clientId);

  const row = (
    <View style={[styles.row, style]}>
      <View style={styles.leading}>
        <Text style={styles.invoiceNumber}>{invoice.number}</Text>
        <Text style={styles.clientName}>{invoice.clientName}</Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(invoice.amount)}</Text>
    </View>
  );

  return (
    <View testID={testID}>
      {onPress ? (
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => {
            void triggerHaptic('selection');
            onPress();
          }}
          onPressIn={() => {
            scale.value = withSpring(press.row.scale === 1 ? 0.99 : press.row.scale, spring.snappy);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, spring.snappy);
          }}
          style={animatedStyle}>
          {row}
        </AnimatedPressable>
      ) : (
        row
      )}
      {canReplay ? (
        <Pressable
          accessibilityLabel="Comme la dernière fois"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            void triggerHaptic('selection');
            router.push(newInvoiceHref(invoice.clientId, { replay: true }));
          }}
          style={styles.replayLink}>
          <Text style={[styles.replayText, { color: colors.primary }]}>
            Comme la dernière fois
          </Text>
        </Pressable>
      ) : null}
      {showSeparator ? <View style={styles.separator} /> : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    leading: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    invoiceNumber: {
      ...type.cardTitle,
      color: colors.text,
    },
    clientName: {
      ...type.caption,
      color: colors.textSecondary,
    },
    replayLink: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: 0,
    },
    replayText: {
      ...type.micro,
      fontWeight: '600',
    },
    amount: {
      ...type.primaryNumber,
      fontSize: 17,
      lineHeight: 22,
      color: colors.text,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
  }));
}
