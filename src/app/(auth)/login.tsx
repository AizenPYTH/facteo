import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { SocialAuthButton } from '@/components/auth/social-auth-button';
import { Button } from '@/components/ui/button';
import { PressableScale } from '@/components/ui/pressable-scale';
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
      onSubmit={handleSubmit(onSubmit)}
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
              placeholder="Votre mot de passe"
              textContentType="password"
              value={value}
            />
            <PressableScale
              accessibilityLabel="Mot de passe oublié"
              accessibilityRole="link"
              hitSlop={8}
              intensity="subtle"
              onPress={() => router.push('/forgot-password' as Href)}
              style={styles.forgot}>
              <Text maxFontSizeMultiplier={1.4} style={styles.forgotLabel}>
                Mot de passe oublié
              </Text>
            </PressableScale>
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
    passwordBlock: {
      gap: spacing.xs,
    },
    forgot: {
      alignSelf: 'flex-end' as const,
      justifyContent: 'center' as const,
      minHeight: 44,
      paddingHorizontal: spacing.xs,
    },
    forgotLabel: {
      ...typography.footnote,
      color: colors.primary,
    },
  }));
}
