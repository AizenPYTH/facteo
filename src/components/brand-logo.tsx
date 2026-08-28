import { View, type StyleProp, type ViewStyle } from 'react-native';

import { InveqMark } from '@/components/brand/inveq-mark';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Compact brand mark for sidebars / loading — SVG, theme-safe. */
export function BrandLogo({ size = 88, style, testID }: BrandLogoProps) {
  return (
    <View
      accessibilityLabel="INVEQ"
      style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}
      testID={testID}>
      <InveqMark size={size} />
    </View>
  );
}
