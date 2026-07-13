import { type Control, Controller, type FieldErrors } from 'react-hook-form';
import { Pressable, Switch, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';
import { triggerSelectionHaptic } from '@/lib/haptics';
import type { CompanyProfileFormValues } from '@/types/company-profile';
import {
  PAYMENT_METHOD_IDS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethodId,
} from '@/types/payment-methods';

import { FormDivider } from './form-section';

type PaymentMethodsSectionProps = {
  control: Control<CompanyProfileFormValues>;
};

export function PaymentMethodsSection({ control }: PaymentMethodsSectionProps) {
  const styles = useStyles();

  return (
    <Controller
      control={control}
      name="paymentMethods"
      render={({ field: { onChange, value } }) => {
        const selected = new Set(value);

        function toggleMethod(methodId: PaymentMethodId) {
          void triggerSelectionHaptic();
          const next = new Set(selected);

          if (next.has(methodId)) {
            if (next.size === 1) {
              return;
            }

            next.delete(methodId);
          } else {
            next.add(methodId);
          }

          onChange([...next]);
        }

        return (
          <View>
            {PAYMENT_METHOD_IDS.map((methodId, index) => (
              <View key={methodId}>
                <Pressable
                  accessibilityRole="switch"
                  accessibilityState={{ checked: selected.has(methodId) }}
                  onPress={() => toggleMethod(methodId)}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <Text style={styles.label}>{PAYMENT_METHOD_LABELS[methodId]}</Text>
                  <Switch
                    onValueChange={() => toggleMethod(methodId)}
                    value={selected.has(methodId)}
                  />
                </Pressable>
                {index < PAYMENT_METHOD_IDS.length - 1 ? <FormDivider /> : null}
              </View>
            ))}
          </View>
        );
      }}
    />
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    row: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      ...textHierarchy.body,
      color: colors.text,
      flex: 1,
      flexShrink: 1,
    },
  }));
}
