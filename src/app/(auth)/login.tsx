import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { MARKETING_HELP_URLS } from '@/constants/marketing/site';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { openExternalUrl, openLegalPage } from '@/lib/legal/open-legal-page';
import { loginSchema, type LoginFormValues } from '@/lib/validations/login';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/register';
import { useToast } from '@/providers/toast-provider';

type AuthMode = 'login' | 'register';

function parseMode(raw: string | string[] | undefined): AuthMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'register' ? 'register' : 'login';
}

/**
 * Single auth experience — Login ↔ Register is content evolution, not navigation.
 */
export default function AuthExperienceScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<AuthMode>(() => parseMode(params.mode));
  const authScreenStyles = useAuthScreenStyles();
  const { signIn, signUp } = useAuth();
  const { showSuccess } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMode(parseMode(params.mode));
  }, [params.mode]);

  const switchMode = useCallback((next: AuthMode) => {
    setFormError(null);
    setMode(next);
    // Update URL without remounting AuthShell (keeps opening continuity).
    router.setParams({ mode: next });
  }, []);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onLogin(values: LoginFormValues) {
    setFormError(null);
    const { error } = await signIn(values);
    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }
    router.replace('/');
  }

  async function onRegister(values: RegisterFormValues) {
    setFormError(null);
    const { error, session } = await signUp({
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }

    if (!session) {
      showSuccess("Un e-mail de confirmation vient d'être envoyé.");
      switchMode('login');
      return;
    }

    showSuccess('Compte créé avec succès.');
    router.replace('/' as Href);
  }

  const isLogin = mode === 'login';
  const isSubmitting = isLogin
    ? loginForm.formState.isSubmitting
    : registerForm.formState.isSubmitting;

  const footerLink = useMemo(
    () =>
      isLogin ? (
        <Text style={authScreenStyles.footerText}>
          Pas encore de compte ?{' '}
          <Text
            accessibilityRole="link"
            onPress={() => switchMode('register')}
            style={authScreenStyles.footerLink}>
            Créer un compte
          </Text>
        </Text>
      ) : (
        <Text style={authScreenStyles.footerText}>
          Déjà un compte ?{' '}
          <Text
            accessibilityRole="link"
            onPress={() => switchMode('login')}
            style={authScreenStyles.footerLink}>
            Connexion
          </Text>
        </Text>
      ),
    [authScreenStyles.footerLink, authScreenStyles.footerText, isLogin, switchMode],
  );

  return (
    <AuthScreen
      actions={
        <View style={authScreenStyles.actionsBlock}>
          <AuthPrimaryButton
            loading={isSubmitting}
            onPress={
              isLogin
                ? loginForm.handleSubmit(onLogin)
                : registerForm.handleSubmit(onRegister)
            }
            title={isLogin ? 'Connexion' : 'Créer un compte'}
          />
          {isLogin ? (
            <Pressable
              accessibilityRole="link"
              hitSlop={8}
              onPress={() => void openExternalUrl(MARKETING_HELP_URLS.forgotPassword)}
              style={authScreenStyles.forgotWrap}>
              <Text style={authScreenStyles.forgotLink}>Mot de passe oublié ?</Text>
            </Pressable>
          ) : (
            <Text style={authScreenStyles.footerText}>
              En créant un compte, vous acceptez nos{' '}
              <Text
                accessibilityRole="link"
                onPress={() => void openLegalPage('terms')}
                style={authScreenStyles.footerLink}>
                conditions d’utilisation
              </Text>
              {' '}et notre{' '}
              <Text
                accessibilityRole="link"
                onPress={() => void openLegalPage('privacy')}
                style={authScreenStyles.footerLink}>
                politique de confidentialité
              </Text>
              .
            </Text>
          )}
        </View>
      }
      contentKey={mode}
      error={formError}
      footerLink={footerLink}
      subtitle={isLogin ? 'Facturez simplement.' : 'Commencez en quelques secondes.'}
      title={isLogin ? undefined : 'Créer un compte'}>
      {isLogin ? (
        <>
          <Controller
            control={loginForm.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoComplete="email"
                error={loginForm.formState.errors.email?.message}
                hideLabel
                icon="envelope.fill"
                keyboardType="email-address"
                label="Adresse e-mail"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Adresse e-mail"
                returnKeyType="next"
                textContentType="emailAddress"
                value={value}
              />
            )}
          />
          <Controller
            control={loginForm.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoComplete="password"
                error={loginForm.formState.errors.password?.message}
                hideLabel
                icon="lock.fill"
                isPassword
                label="Mot de passe"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Mot de passe"
                returnKeyType="done"
                textContentType="password"
                value={value}
              />
            )}
          />
        </>
      ) : (
        <>
          <Controller
            control={registerForm.control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoCapitalize="words"
                autoComplete="given-name"
                error={registerForm.formState.errors.firstName?.message}
                hideLabel
                icon="person.fill"
                label="Prénom"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Prénom"
                returnKeyType="next"
                textContentType="givenName"
                value={value}
              />
            )}
          />
          <Controller
            control={registerForm.control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoCapitalize="words"
                autoComplete="family-name"
                error={registerForm.formState.errors.lastName?.message}
                hideLabel
                icon="person.fill"
                label="Nom"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Nom"
                returnKeyType="next"
                textContentType="familyName"
                value={value}
              />
            )}
          />
          <Controller
            control={registerForm.control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoComplete="email"
                error={registerForm.formState.errors.email?.message}
                hideLabel
                icon="envelope.fill"
                keyboardType="email-address"
                label="Adresse e-mail"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Adresse e-mail"
                returnKeyType="next"
                textContentType="emailAddress"
                value={value}
              />
            )}
          />
          <Controller
            control={registerForm.control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoComplete="new-password"
                error={registerForm.formState.errors.password?.message}
                hideLabel
                icon="lock.fill"
                isPassword
                label="Mot de passe"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Mot de passe (8+ caractères)"
                returnKeyType="next"
                textContentType="newPassword"
                value={value}
              />
            )}
          />
          <Controller
            control={registerForm.control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                autoComplete="new-password"
                error={registerForm.formState.errors.confirmPassword?.message}
                hideLabel
                icon="lock.fill"
                isPassword
                label="Confirmer le mot de passe"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Confirmer le mot de passe"
                returnKeyType="done"
                textContentType="newPassword"
                value={value}
              />
            )}
          />
        </>
      )}
    </AuthScreen>
  );
}
