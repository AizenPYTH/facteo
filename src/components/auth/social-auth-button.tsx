import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { triggerImpactHaptic } from '@/lib/haptics';

type SocialProvider = 'apple' | 'google';

type SocialAuthButtonProps = {
  provider: SocialProvider;
  title: string;
  loading?: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const LOGO_SIZE = 18;

/**
 * CTA OAuth professionnel — logo officiel + libellé, alignés (DESIGN §1 Sign in with Apple).
 */
export function SocialAuthButton({
  provider,
  title,
  loading = false,
  onPress,
  disabled = false,
}: SocialAuthButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        if (!isDisabled) {
          void triggerImpactHaptic();
          onPress();
        }
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.content}>
          <View style={styles.logoSlot}>
            {provider === 'apple' ? <AppleLogo /> : <GoogleLogo />}
          </View>
          <Text style={styles.label}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

function AppleLogo() {
  const colors = useColors();
  return (
    <Svg accessibilityElementsHidden height={LOGO_SIZE} viewBox="0 0 24 24" width={LOGO_SIZE}>
      <Path
        d="M16.365 1.43c0 1.14-.42 2.2-1.18 3.02-.8.88-2.12 1.56-3.3 1.46-.14-1.1.4-2.26 1.18-3.08.84-.9 2.28-1.56 3.3-1.4zM20.5 17.1c-.56 1.28-.82 1.86-1.54 3-.98 1.5-2.36 3.36-4.08 3.38-1.52.02-1.92-.98-4-1-.2 0-2.5.02-4 .98-1.54.02-2.84-1.72-3.82-3.22C1.3 16.9-.3 12.1 1.7 8.86c1.12-1.82 2.9-2.96 4.9-2.98 1.54-.04 2.98 1.04 4 1.04 1 0 2.56-1.28 4.32-1.1.74.04 2.8.3 4.12 2.24-.1.06-2.46 1.44-2.44 4.3.04 3.42 3 4.56 3.02 4.58-.02.06-.48 1.64-1.12 3.16z"
        fill={colors.text}
      />
    </Svg>
  );
}

function GoogleLogo() {
  return (
    <Svg accessibilityElementsHidden height={LOGO_SIZE} viewBox="0 0 24 24" width={LOGO_SIZE}>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    button: {
      minHeight: components.buttonHeight,
      borderRadius: radius.buttonLarge,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    disabled: {
      opacity: 0.5,
    },
    content: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
    },
    logoSlot: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
  }));
}
