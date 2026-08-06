import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks/use-colors';

/**
 * Minimal auth restore gate — no branded splash. Native splash hides, then
 * users land on login or the app stack as soon as the session is ready.
 */
export function AuthLoadingScreen() {
  const colors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ActivityIndicator accessibilityLabel="Chargement" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
