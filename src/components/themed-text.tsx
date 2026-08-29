import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColor } from '@/constants/theme';
import { typography } from '@/constants/theme/typography';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && [styles.link, { color: theme.primary }],
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    ...typography.footnote,
  },
  smallBold: {
    ...typography.footnoteMedium,
  },
  default: {
    ...typography.bodyMedium,
  },
  title: {
    ...typography.largeTitle,
  },
  subtitle: {
    ...typography.title2,
  },
  link: {
    ...typography.footnote,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '600' }) ?? '500',
    fontSize: 12,
  },
});
