import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { SocialAuthButton } from '@/components/auth/social-auth-button';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { loginSchema, type LoginFormValues } from '@/lib/validations/login';

export default function LoginScreen() {
  const authScreenStyles = useAuthScreenStyles();
  const styles = useStyles();
  const { signIn, signInWithApple, signInWithGoogle } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'apple' | 'google' | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    const { error } = await signIn(values);

    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }

    router.replace('/');
  }

  async function handleApple() {
    setFormError(null);
    setOauthLoading('apple');
    try {
      const { error, session } = await signInWithApple();
      if (error) {
        setFormError(getAuthErrorMessage(error.message));
        return;
      }
      if (session) {
        router.replace('/');
      }
    } finally {
      setOauthLoading(null);
    }
  }

  async function handleGoogle() {
    setFormError(null);
    setOauthLoading('google');
    try {
      const { error, session } = await signInWithGoogle();
      if (error) {
        setFormError(getAuthErrorMessage(error.message));
        return;
      }
      if (session) {
        router.replace('/');
      }
    } finally {
      setOauthLoading(null);
    }
  }

  const busy = isSubmitting || oauthLoading !== null;

  return (
    <AuthScreen
      error={formError}
      footer={
        <Button
          elevated
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          title="Se connecter"
        />
      }
      footerLink={
        <Text style={authScreenStyles.footerText}>
          Pas encore de compte ?{' '}
          <Link href={'/register' as Href}>
            <Text style={authScreenStyles.footerLink}>Créer un compte</Text>
          </Link>
        </Text>
      }
      subtitle="Le même compte INVEQ sur iPhone, Android et inveq.fr."
      title="Connexion">
      <View style={styles.oauthColumn}>
        {Platform.OS === 'ios' ? (
          <SocialAuthButton
            disabled={busy}
            loading={oauthLoading === 'apple'}
            onPress={() => void handleApple()}
            provider="apple"
            title="Continuer avec Apple"
          />
        ) : null}
        <SocialAuthButton
          disabled={busy}
          loading={oauthLoading === 'google'}
          onPress={() => void handleGoogle()}
          provider="google"
          title="Continuer avec Google"
        />
        {Platform.OS !== 'ios' ? (
          <SocialAuthButton
            disabled={busy}
            loading={oauthLoading === 'apple'}
            onPress={() => void handleApple()}
            provider="apple"
            title="Continuer avec Apple"
          />
        ) : null}
      </View>

      <View style={styles.separatorRow}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>ou</Text>
        <View style={styles.separatorLine} />
      </View>

      <Pressable
        accessibilityHint="Méthode recommandée si vous êtes déjà connecté sur ordinateur"
        accessibilityRole="button"
        disabled={busy}
        onPress={() => router.push('/login-qr' as Href)}
        style={({ pressed }) => [styles.qrCard, pressed && styles.qrCardPressed]}>
        <Text style={styles.qrTitle}>Se connecter avec un QR code</Text>
        <Text style={styles.qrHint}>
          Méthode recommandée si vous êtes déjà connecté sur inveq.fr
        </Text>
      </Pressable>

      <View style={styles.separatorRow}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>ou avec e-mail</Text>
        <View style={styles.separatorLine} />
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            autoComplete="email"
            error={errors.email?.message}
            icon="envelope.fill"
            keyboardType="email-address"
            label="Adresse e-mail"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="vous@entreprise.fr"
            returnKeyType="next"
            textContentType="emailAddress"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View style={styles.passwordBlock}>
            <AuthTextField
              autoComplete="password"
              error={errors.password?.message}
              icon="lock.fill"
              isPassword
              label="Mot de passe"
              onBlur={onBlur}
              onChangeText={onChange}
              onSubmitEditing={handleSubmit(onSubmit)}
              placeholder="Votre mot de passe"
              returnKeyType="done"
              textContentType="password"
              value={value}
            />
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => router.push('/forgot-password' as Href)}
              style={styles.forgot}>
              <Text style={styles.forgotLabel}>Mot de passe oublié</Text>
            </Pressable>
          </View>
        )}
      />
    </AuthScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    oauthColumn: {
      gap: spacing.sm,
    },
    separatorRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    separatorText: {
      ...typography.caption1,
      color: colors.textTertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    qrCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs,
    },
    qrCardPressed: {
      opacity: 0.85,
    },
    qrTitle: {
      ...typography.subheadlineMedium,
      color: colors.primary,
      textAlign: 'center' as const,
    },
    qrHint: {
      ...typography.caption1,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    passwordBlock: {
      gap: spacing.xs,
    },
    forgot: {
      alignSelf: 'flex-end' as const,
    },
    forgotLabel: {
      ...typography.footnote,
      color: colors.primary,
    },
  }));
}
