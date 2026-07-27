import { type StyleProp, type ViewStyle } from 'react-native';

import { BrandMark } from '@/components/brand/brand-mark';

type BrandLogoProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant?: 'full' | 'mono';
};

/** @deprecated Prefer BrandMark — kept as a thin alias for existing call sites. */
export function BrandLogo({ size = 88, style, testID, variant = 'full' }: BrandLogoProps) {
  return <BrandMark size={size} style={style} testID={testID} variant={variant} />;
}
