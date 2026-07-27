import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { palette } from '@/constants/theme/colors';

type BrandMarkProps = {
  size?: number;
  /** full = violet→blue gradient; mono = white (dark surfaces). */
  variant?: 'full' | 'mono';
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * INVEQ symbol (document + lines + €) — vector, no background.
 * Geometry matches the app icon mark without the squircle plate.
 */
export function BrandMark({
  size = 88,
  variant = 'full',
  style,
  testID,
}: BrandMarkProps) {
  const fill = variant === 'mono' ? '#FFFFFF' : 'url(#inveqMarkGrad)';
  const detail = variant === 'mono' ? palette.blue[700] : '#FFFFFF';

  return (
    <View
      accessibilityLabel="INVEQ"
      accessibilityRole="image"
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}>
      <Svg height={size} viewBox="0 0 100 100" width={size}>
        <Defs>
          <LinearGradient id="inveqMarkGrad" x1="0%" x2="0%" y1="0%" y2="100%">
            <Stop offset="0%" stopColor="#C4B5FD" />
            <Stop offset="35%" stopColor="#818CF8" />
            <Stop offset="100%" stopColor="#4F46E5" />
          </LinearGradient>
        </Defs>

        {/* Document body with folded top-right corner */}
        <Path
          d="M18 14
             C18 9.6 21.6 6 26 6
             H64
             L82 24
             V86
             C82 90.4 78.4 94 74 94
             H26
             C21.6 94 18 90.4 18 86
             Z"
          fill={fill}
        />

        {/* Fold face + soft underside */}
        <Path d="M64 6 L82 24 H70 C66.7 24 64 21.3 64 18 Z" fill="rgba(255,255,255,0.32)" />
        <Path d="M64 18 C64 21.3 66.7 24 70 24 L82 24 L64 6 Z" fill="rgba(15,23,42,0.16)" />

        {/* Invoice lines */}
        <Rect fill={detail} height="5" rx="2.5" width="22" x="28" y="38" />
        <Rect fill={detail} height="5" rx="2.5" width="30" x="28" y="50" />
        <Rect fill={detail} height="5" rx="2.5" width="18" x="28" y="62" />

        {/* Euro mark */}
        <SvgText
          fill={detail}
          fontFamily="System"
          fontSize="28"
          fontWeight="700"
          letterSpacing={-0.5}
          textAnchor="middle"
          x="66"
          y="78">
          €
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
