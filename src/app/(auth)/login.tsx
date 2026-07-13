import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';
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
    <SafeAreaView edges={['top', 'bottom']} style={authScreenStyles.container}>
      <FormScreen
        contentContainerStyle={authScreenStyles.content}
        footer={
          <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Connexion" />
        }
        scrollable>
        <View style={authScreenStyles.header}>
          <Image
            accessibilityIgnoresInvertColors
            source={require('@/assets/images/facteo-logo.png')}
            style={styles.logo}
          />
          <Text accessibilityRole="header" style={authScreenStyles.title}>
            Connexion
          </Text>
          <Text style={authScreenStyles.subtitle}>
            Gérez vos devis et factures simplement.
          </Text>
        </View>

        {formError ? (
          <View accessibilityRole="alert" style={authScreenStyles.errorBanner}>
            <Text style={authScreenStyles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        <View style={authScreenStyles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoComplete="email"
                error={errors.email?.message}
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
              <TextField
                autoComplete="password"
                error={errors.password?.message}
                label="Mot de passe"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Votre mot de passe"
                returnKeyType="done"
                secureTextEntry
                textContentType="password"
                value={value}
              />
            )}
          />
        </View>

        <View style={authScreenStyles.footer}>
          <Text style={authScreenStyles.footerText}>
            Pas encore de compte ?{' '}
            <Link href={'/register' as Href}>
              <Text style={authScreenStyles.footerLink}>Créer un compte</Text>
            </Link>
          </Text>
        </View>
      </FormScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 148,
    height: 40,
    resizeMode: 'contain',
  },
});
