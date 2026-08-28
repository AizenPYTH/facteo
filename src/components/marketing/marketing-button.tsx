import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import {
  marketingColors,
  marketingRadius,
  marketingText,
  marketingTypography,
} from '@/constants/marketing/theme';
import {
  isAccountCreationPathOrUrl,
  isIosAccountCreationDisabled,
} from '@/lib/auth/ios-no-signup';

type MarketingButtonProps = {
  label: string;
  href?: Href;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
};

function resolveSafeHref(href: Href): Href {
  const hrefString = String(href);
  if (isIosAccountCreationDisabled() && isAccountCreationPathOrUrl(hrefString)) {
    return '/login' as Href;
  }
  return href;
}

export function MarketingButton({
  label,
  href,
  onPress,
  variant = 'primary',
  style,
}: MarketingButtonProps) {
  const router = useRouter();

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    if (!href) {
      return;
    }

    const safeHref = resolveSafeHref(href);
    const hrefString = String(safeHref);

    if (hrefString.includes('#')) {
      const [path, anchor] = hrefString.split('#');

      if (typeof window !== 'undefined' && (path === '' || path === '/') && window.location.pathname === '/') {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      router.push(safeHref);
      return;
    }

    router.push(safeHref);
  }

  const buttonStyle = StyleSheet.flatten([
    styles.base,
    variant === 'primary' ? styles.primary : undefined,
    variant === 'secondary' ? styles.secondary : undefined,
    variant === 'ghost' ? styles.ghost : undefined,
    style,
  ]);

  const textStyle = StyleSheet.flatten([
    styles.label,
    variant === 'primary' ? styles.labelPrimary : undefined,
    variant === 'secondary' ? styles.labelSecondary : undefined,
    variant === 'ghost' ? styles.labelGhost : undefined,
  ]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) =>
        StyleSheet.flatten([
          buttonStyle,
          pressed ? styles.pressed : undefined,
        ])
      }>
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: marketingRadius.md,
    minHeight: 48,
  },
  primary: {
    backgroundColor: marketingColors.primary,
  },
  secondary: {
    backgroundColor: marketingColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: marketingColors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
  },
  label: marketingText(marketingTypography.caption),
  labelPrimary: {
    color: marketingColors.textInverse,
    fontWeight: '600',
  },
  labelSecondary: {
    color: marketingColors.text,
    fontWeight: '600',
  },
  labelGhost: {
    color: marketingColors.primary,
    fontWeight: '600',
  },
});
