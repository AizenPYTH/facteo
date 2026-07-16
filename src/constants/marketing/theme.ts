import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const marketingColors = {
  background: '#FAFBFC',
  backgroundAlt: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceHover: '#F8FAFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textInverse: '#FFFFFF',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  accent: '#0EA5E9',
  success: '#10B981',
  gradientStart: '#2563EB',
  gradientEnd: '#1E40AF',
} as const;

export const marketingSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 96,
  sectionMobile: 64,
  container: 1200,
} as const;

export const marketingRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const marketingTypography = {
  hero: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700' as const,
    letterSpacing: -1.2,
  },
  h1: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700' as const,
    letterSpacing: -0.8,
  },
  h2: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontSize: 19,
    lineHeight: 30,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

export const marketingShadow = Platform.select<ViewStyle>({
  web: {
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  default: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});

export const marketingFontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  default: undefined,
});

export function marketingText(style: TextStyle): TextStyle {
  return Platform.OS === 'web' && marketingFontFamily
    ? { ...style, fontFamily: marketingFontFamily }
    : style;
}
