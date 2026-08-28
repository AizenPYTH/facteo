import { Pressable, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import type { ClientDuplicateMatch } from '@/lib/clients/duplicates';
import { getClientDisplayName } from '@/types/client';

export type ClientDuplicateSuggestionsProps = {
  matches: ClientDuplicateMatch[];
  onUseClient: (clientId: string) => void;
  onConfirmCreate: () => void;
};

export function ClientDuplicateSuggestions({
  matches,
  onUseClient,
  onConfirmCreate,
}: ClientDuplicateSuggestionsProps) {
  const styles = useStyles();
  const top = matches[0];
  if (!top) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Possible doublon détecté</Text>
      <Text style={styles.description}>
        {getClientDisplayName(top.client)} — {top.reasons.join(', ')}. Utilisez le client
        existant ou confirmez la création.
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onUseClient(top.client.id)}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
          <Text style={styles.primaryLabel}>Utiliser ce client</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onConfirmCreate}
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>Créer quand même</Text>
        </Pressable>
      </View>
      {matches.length > 1 ? (
        <Text style={styles.more}>{matches.length - 1} autre(s) correspondance(s)</Text>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrap: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.warning,
      backgroundColor: colors.warningSubtle,
    },
    title: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    description: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    primaryBtn: {
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      backgroundColor: colors.primary,
    },
    primaryLabel: {
      ...typography.footnoteMedium,
      color: colors.onPrimary,
    },
    secondaryBtn: {
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryLabel: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    more: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    pressed: {
      opacity: 0.85,
    },
  }));
}
