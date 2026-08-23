import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { isIosAccountCreationDisabled } from '@/lib/auth/ios-no-signup';
import { loginSchema, type LoginFormValues } from '@/lib/validations/login';

const hideAccountCreation = isIosAccountCreationDisabled();

export default function LoginScreen() {
  const authScreenStyles = useAuthScreenStyles();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

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

  return (
    <AuthScreen
      error={formError}
      footer={
        <Button
          elevated
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          title="Connexion"
        />
      }
      footerLink={
        hideAccountCreation ? null : (
          <Text style={authScreenStyles.footerText}>
            Pas encore de compte ?{' '}
            <Link href={'/register' as Href}>
              <Text style={authScreenStyles.footerLink}>Créer un compte</Text>
            </Link>
          </Text>
        )
      }
      subtitle="Gérez vos devis et factures simplement."
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
        )}
      />
      <Text style={authScreenStyles.footerText}>
        <Link href={'/forgot-password' as Href}>
          <Text style={authScreenStyles.footerLink}>Mot de passe oublié ?</Text>
        </Link>
      </Text>
    </AuthScreen>
  );
}
