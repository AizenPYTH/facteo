import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PremiumUpgradeBanner } from '@/components/subscription/premium-upgrade-banner';
import { spacing } from '@/constants/theme/spacing';

type PremiumGatedSectionProps = {
  locked: boolean;
  bannerMessage?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function PremiumGatedSection({
  locked,
  bannerMessage,
  children,
  style,
}: PremiumGatedSectionProps) {
  if (!locked) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.wrap, style]}>
      <PremiumUpgradeBanner message={bannerMessage} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  content: {
    gap: spacing.sectionGap,
  },
});
