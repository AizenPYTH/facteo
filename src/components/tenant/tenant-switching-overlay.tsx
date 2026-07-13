import { StyleSheet, View } from 'react-native';

import { LoadingView } from '@/components/ui/loading-view';
import { useTenant } from '@/hooks/use-tenant';

export function TenantSwitchingOverlay() {
  const { isSwitching } = useTenant();

  if (!isSwitching) {
    return null;
  }

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <LoadingView message="Changement d'espace…" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
