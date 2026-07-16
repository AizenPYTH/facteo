import { type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';

import { FadeInView } from '@/components/marketing/fade-in-view';
import {
  marketingColors,
  marketingSpacing,
  marketingText,
  marketingTypography,
} from '@/constants/marketing/theme';

type MarketingSectionProps = {
  id?: string;
  overline?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  alt?: boolean;
  centered?: boolean;
  style?: ViewStyle;
};

export function MarketingSection({
  id,
  overline,
  title,
  subtitle,
  children,
  alt = false,
  centered = true,
  style,
}: MarketingSectionProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View nativeID={id} style={StyleSheet.flatten([styles.section, alt ? styles.sectionAlt : undefined, { paddingVertical: isMobile ? marketingSpacing.sectionMobile : marketingSpacing.section }, style])}>
      <View style={styles.container}>
        <FadeInView style={centered ? styles.headerCentered : styles.header}>
          {overline ? <Text style={styles.overline}>{overline}</Text> : null}
          <Text accessibilityRole="header" style={isMobile ? styles.titleMobile : styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={isMobile ? styles.subtitleMobile : styles.subtitle}>{subtitle}</Text>
          ) : null}
        </FadeInView>
        {children}
      </View>
    </View>
  );
}

export function FeatureIcon({ glyph }: { glyph: string }) {
  const icons: Record<string, string> = {
    sparkles: '✦',
    shield: '◆',
    phone: '◉',
    cloud: '☁',
    users: '◎',
    file: '▤',
    receipt: '▥',
    pdf: '▦',
    pen: '✎',
    card: '◈',
    ai: '◇',
    sync: '↻',
  };

  return (
    <View style={styles.iconWrap}>
      <Text style={styles.icon}>{icons[glyph] ?? '•'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: marketingSpacing.lg,
  },
  sectionAlt: {
    backgroundColor: marketingColors.backgroundAlt,
  },
  container: {
    maxWidth: marketingSpacing.container,
    alignSelf: 'center',
    width: '100%',
    gap: marketingSpacing.xxl,
  },
  header: {
    gap: marketingSpacing.md,
    maxWidth: 640,
  },
  headerCentered: {
    gap: marketingSpacing.md,
    maxWidth: 720,
    alignSelf: 'center',
    alignItems: 'center',
  },
  overline: marketingText({
    ...marketingTypography.overline,
    color: marketingColors.primary,
  }),
  title: marketingText({
    ...marketingTypography.h1,
    color: marketingColors.text,
    textAlign: 'center',
  }),
  titleMobile: marketingText({
    ...marketingTypography.h2,
    color: marketingColors.text,
    textAlign: 'center',
  }),
  subtitle: marketingText({
    ...marketingTypography.bodyLarge,
    color: marketingColors.textSecondary,
    textAlign: 'center',
  }),
  subtitleMobile: marketingText({
    ...marketingTypography.body,
    color: marketingColors.textSecondary,
    textAlign: 'center',
  }),
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: marketingColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    color: marketingColors.primary,
  },
});
