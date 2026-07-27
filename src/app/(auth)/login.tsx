import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { Button } from '@/components/ui/button';
import { MARKETING_HELP_URLS } from '@/constants/marketing/site';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { openExternalUrl } from '@/lib/legal/open-legal-page';
import { loginSchema, type LoginFormValues } from '@/lib/validations/login';

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
      actions={
        <View style={authScreenStyles.actionsBlock}>
          <Button
            elevated
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            title="Connexion"
          />
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => void openExternalUrl(MARKETING_HELP_URLS.forgotPassword)}
            style={authScreenStyles.forgotWrap}>
            <Text style={authScreenStyles.forgotLink}>Mot de passe oublié ?</Text>
          </Pressable>
        </View>
      }
      error={formError}
      footerLink={
        <Text style={authScreenStyles.footerText}>
          Pas encore de compte ?{' '}
          <Link href={'/register' as Href}>
            <Text style={authScreenStyles.footerLink}>Créer un compte</Text>
          </Link>
        </Text>
      }
      subtitle="Facturez simplement.">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            autoComplete="email"
            error={errors.email?.message}
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
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            autoComplete="password"
            error={errors.password?.message}
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
    </AuthScreen>
  );
}
