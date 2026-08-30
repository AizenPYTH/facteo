import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
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

  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <AuthScreen
      error={formError}
      footer={
        <Button
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          title="Se connecter"
        />
      }
      footerLink={
        <Text style={authScreenStyles.footerText}>
          {isNative ? (
            <>
              Pas encore de compte INVEQ ? Créez-en un sur inveq.fr, puis reconnectez-vous ici.
            </>
          ) : (
            <>
              Pas encore de compte ?{' '}
              <Link href={'/register' as Href}>
                <Text style={authScreenStyles.footerLink}>Créer un compte</Text>
              </Link>
            </>
          )}
        </Text>
      }
      subtitle="Connectez-vous à votre compte INVEQ."
      title="Connexion">
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

      <View style={styles.separatorRow}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>ou continuer avec</Text>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.oauthRow}>
        <View style={styles.oauthButton}>
          <Button
            loading={oauthLoading === 'apple'}
            onPress={() => void handleApple()}
            title="Continuer avec Apple"
            variant="secondary"
          />
        </View>
        <View style={styles.oauthButton}>
          <Button
            loading={oauthLoading === 'google'}
            onPress={() => void handleGoogle()}
            title="Continuer avec Google"
            variant="secondary"
          />
        </View>
      </View>
    </AuthScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    passwordBlock: {
      gap: spacing.xs,
    },
    forgot: {
      alignSelf: 'flex-end' as const,
      minHeight: 44,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.xs,
    },
    forgotLabel: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
    separatorRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.separator,
    },
    separatorText: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    oauthRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    oauthButton: {
      flex: 1,
    },
  }));
}
