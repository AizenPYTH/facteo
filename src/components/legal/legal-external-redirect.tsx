import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import * as Linking from 'expo-linking';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type LegalExternalRedirectProps = {
  url: string;
  label: string;
};

/** Ouvre la page légale sur facteo.app (exigence App Store / store listing). */
export function LegalExternalRedirect({ url, label }: LegalExternalRedirectProps) {
  const styles = useStyles();
  const colors = useColors();

  useEffect(() => {
    void Linking.openURL(url);
  }, [url]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.subtitle}>Redirection vers facteo.app…</Text>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(url)}>
        <Text style={styles.link}>Ouvrir la page</Text>
      </Pressable>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    title: {
      ...typography.headline,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    link: {
      ...typography.subheadline,
      color: colors.primary,
      fontWeight: '600',
      marginTop: spacing.sm,
    },
  }));
}
