import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useThemedStyles } from '@/hooks/use-colors';
import { press } from '@/constants/theme/interaction';
import { spring } from '@/constants/theme/motion';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { formatCurrency } from '@/lib/format/currency';
import { triggerHaptic } from '@/lib/haptics';
import type { Invoice } from '@/types/dashboard';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type RecentInvoiceCardProps = {
  invoice: Invoice;
  onPress?: () => void;
  showSeparator?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/** Row only — replay lives in the Accueil « Comme la dernière fois » section. */
export function RecentInvoiceCard({
  invoice,
  onPress,
  showSeparator = false,
  style,
  testID,
}: RecentInvoiceCardProps) {
  const styles = useStyles();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
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
          {content}
        </AnimatedPressable>
      ) : (
        content
      )}
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
      paddingVertical: spacing.md,
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
