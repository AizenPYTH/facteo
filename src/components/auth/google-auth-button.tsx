import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '@/hooks/use-auth';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { triggerImpactHaptic } from '@/lib/haptics';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type GoogleAuthButtonProps = {
  label?: string;
};

export function GoogleAuthButton({ label = 'Continuer avec Google' }: GoogleAuthButtonProps) {
  const styles = useStyles();
  const colors = useColors();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePress() {
    setError(null);
    setLoading(true);
    void triggerImpactHaptic();

    try {
      const { error: oauthError, session, canceled } = await signInWithGoogle();

      if (canceled) {
        setLoading(false);
        return;
      }

      if (oauthError) {
        setError(getAuthErrorMessage(oauthError.message));
        setLoading(false);
        return;
      }

      if (session) {
        router.replace('/');
        return;
      }

      setLoading(false);
    } catch {
      setError('Impossible de démarrer la connexion Google.');
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading, busy: loading }}
        disabled={loading}
        onPress={() => void handlePress()}
        style={({ pressed }) => [
          styles.button,
          pressed && !loading ? styles.pressed : null,
          loading ? styles.disabled : null,
        ]}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <GoogleGlyph />
            <Text style={styles.label}>{label}</Text>
          </>
        )}
      </Pressable>
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function GoogleGlyph() {
  return (
    <Svg accessibilityElementsHidden height={18} viewBox="0 0 24 24" width={18}>
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

export function AuthDivider({ label = 'ou' }: { label?: string }) {
  const styles = useDividerStyles();

  return (
    <View accessibilityRole="none" style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrap: {
      gap: spacing.sm,
    },
    button: {
      minHeight: 52,
      borderRadius: radius.buttonLarge,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    pressed: {
      backgroundColor: colors.backgroundGrouped,
      transform: [{ scale: 0.985 }],
    },
    disabled: {
      opacity: 0.6,
    },
    label: {
      ...typography.headline,
      color: colors.text,
    },
    error: {
      ...typography.footnote,
      color: colors.error,
      textAlign: 'center',
    },
  }));
}

function useDividerStyles() {
  return useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    line: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    label: {
      ...typography.caption1,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
  }));
}
