import { SymbolView } from 'expo-symbols';
import { Text, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { formatFrenchPhoneDisplay } from '@/lib/format/phone';
import { getClientDisplayName, getClientSecondaryLabel, type Client } from '@/types/client';

export type ClientCardProps = {
  client: Client;
  onPress?: (client: Client) => void;
  style?: ViewStyle;
  testID?: string;
};

/** Deux premières lettres du nom affiché, pour la pastille d'identité. */
function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

/**
 * Ligne de la liste des clients.
 *
 * Le téléphone et l'e-mail occupaient chacun une ligne étiquetée, souvent
 * vides : la carte faisait la même hauteur qu'un client complet pour n'afficher
 * que deux tirets. Ils tiennent maintenant sur une seule ligne de contact, et
 * disparaissent quand ils n'existent pas.
 */
export function ClientCard({ client, onPress, style, testID }: ClientCardProps) {
  const styles = useStyles();
  const colors = useColors();

  const primaryLabel = getClientDisplayName(client);
  const secondaryLabel = getClientSecondaryLabel(client);
  const phone = formatFrenchPhoneDisplay(client.phone);
  const contact = [phone, client.email].filter(Boolean).join(' · ');

  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.avatar}>
        <Text maxFontSizeMultiplier={1.2} style={styles.avatarLabel}>
          {initials(primaryLabel)}
        </Text>
      </View>

      <View style={styles.body}>
        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.primaryLabel}>
          {primaryLabel}
        </Text>
        {secondaryLabel ? (
          <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.secondaryLabel}>
            {secondaryLabel}
          </Text>
        ) : null}
        {contact ? (
          <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.contact}>
            {contact}
          </Text>
        ) : null}
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

  if (!onPress) {
    return (
      <View style={styles.wrapper} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityHint="Ouvre la fiche client"
      accessibilityLabel={secondaryLabel ? `${primaryLabel}, ${secondaryLabel}` : primaryLabel}
      accessibilityRole="button"
      intensity="subtle"
      onPress={() => onPress(client)}
      style={styles.wrapper}
      testID={testID}>
      {content}
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrapper: {
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[3],
      minHeight: 64,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    avatarLabel: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing[0.5],
    },
    primaryLabel: {
      ...typography.bodyMedium,
      color: colors.text,
    },
    secondaryLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    contact: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
  }));
}
