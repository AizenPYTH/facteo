import { router, type Href } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { usePlanLimitGuard } from '@/hooks/use-plan-limit';

export type AddInvoiceFabProps = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
  testID?: string;
};

export function AddInvoiceFab({
  onPress,
  label = 'Nouvelle facture',
  style,
  testID,
}: AddInvoiceFabProps) {
  const { guardResource } = usePlanLimitGuard();

  async function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    const allowed = await guardResource('documents');

    if (!allowed) {
      return;
    }

    router.push('/invoices/new' as Href);
  }

  return (
    <FloatingActionButton
      label={label}
      onPress={() => void handlePress()}
      style={style}
      testID={testID}
    />
  );
}
