import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { textHierarchy, type TextHierarchy } from '@/constants/theme/typography';
import { useColors } from '@/hooks/use-colors';

type AppTextProps = TextProps & {
  variant?: TextHierarchy;
  color?: 'primary' | 'secondary' | 'tertiary' | 'link' | 'error' | 'success';
  medium?: boolean;
  semibold?: boolean;
  style?: StyleProp<TextStyle>;
};

const colorMap = {
  primary: 'text',
  secondary: 'textSecondary',
  tertiary: 'textTertiary',
  link: 'textLink',
  error: 'error',
  success: 'success',
} as const;

export function AppText({
  variant = 'body',
  color = 'primary',
  medium = false,
  semibold = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const colors = useColors();
  const baseStyle = textHierarchy[variant];
  const weightStyle: TextStyle | undefined = semibold
    ? { fontWeight: '600' }
    : medium
      ? { fontWeight: '500' }
      : undefined;

  return (
    <Text
      style={[
        baseStyle,
        { color: colors[colorMap[color]] },
        weightStyle,
        style,
      ]}
      {...props}>
      {children}
    </Text>
  );
}
