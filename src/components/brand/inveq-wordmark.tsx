import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { InveqMark } from '@/components/brand/inveq-mark';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { fontFamily, fontWeight } from '@/constants/theme/typography';

type InveqWordmarkProps = {
  /** Total height of the mark + wordmark row. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * App wordmark: mark + "INVEQ" (no tagline).
 * Theme-adaptive ink — readable on light and dark without a white plate.
 * Site keeps the full lockup with tagline; the app uses this simplified mark.
 */
export function InveqWordmark({ height = 40, style, testID }: InveqWordmarkProps) {
  const colors = useColors();
  const styles = useStyles();
  const markSize = height;
  const fontSize = Math.round(height * 0.62);
  const letterSpacing = Math.round(height * 0.04 * 10) / 10;

  return (
    <View
      accessibilityLabel="INVEQ"
      accessibilityRole="image"
      style={[styles.row, { height }, style]}
      testID={testID}>
      <InveqMark size={markSize} />
      <Text
        allowFontScaling={false}
        maxFontSizeMultiplier={1}
        style={[
          styles.wordmark,
          {
            fontSize,
            lineHeight: Math.round(fontSize * 1.1),
            letterSpacing,
          },
        ]}>
        <Text style={[styles.wordmark, styles.accent, { fontSize, color: colors.primary }]}>
          INVE
        </Text>
        <Text style={[styles.wordmark, { fontSize, color: colors.text }]}>Q</Text>
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    wordmark: {
      fontFamily: fontFamily.sans,
      fontWeight: fontWeight.bold,
      includeFontPadding: false,
    },
    accent: {
      fontFamily: fontFamily.sans,
      fontWeight: fontWeight.bold,
    },
  }));
}
