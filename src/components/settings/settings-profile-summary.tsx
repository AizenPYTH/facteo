import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

type SettingsProfileSummaryProps = {
  companyName?: string | null;
  email?: string | null;
  planLabel: string;
  onPressPlan?: () => void;
};

export function SettingsProfileSummary({
  companyName,
  email,
  planLabel,
  onPressPlan,
}: SettingsProfileSummaryProps) {
  const styles = useStyles();
  const displayName = companyName?.trim() || 'Entreprise';

  return (
    <Card variant="elevated">
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} numberOfLines={2} style={styles.companyName}>
        {displayName}
      </Text>
      <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.email}>
        {email ?? '—'}
      </Text>
      {onPressPlan ? (
        <PressableScale
          accessibilityHint="Ouvre la comparaison des offres"
          accessibilityLabel={`Formule ${planLabel}`}
          accessibilityRole="button"
          intensity="subtle"
          onPress={onPressPlan}
          style={styles.planBadge}>
          <Text maxFontSizeMultiplier={1.3} style={styles.planLabel}>
            {planLabel}
          </Text>
        </PressableScale>
      ) : (
        <View style={styles.planBadge}>
          <Text maxFontSizeMultiplier={1.3} style={styles.planLabel}>
            {planLabel}
          </Text>
        </View>
      )}
    </Card>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    companyName: {
      ...typography.title3,
      color: colors.text,
    },
    email: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    planBadge: {
      alignSelf: 'flex-start',
      justifyContent: 'center',
      marginTop: spacing.xs,
      minHeight: 36,
      paddingHorizontal: spacing.md,
      borderRadius: radius.chip,
      backgroundColor: colors.primarySubtle,
    },
    planLabel: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
  }));
}
