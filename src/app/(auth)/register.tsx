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
import { registerSchema, type RegisterFormValues } from '@/lib/validations/register';
import { useToast } from '@/providers/toast-provider';

const FIELDS = [
  ['firstName', 'Prénom', 'Jean', 'given-name', 'givenName', 'words'] as const,
  ['lastName', 'Nom', 'Dupont', 'family-name', 'familyName', 'words'] as const,
  ['companyName', "Nom de l'entreprise", 'Acme SARL', 'organization', 'organizationName', 'words'] as const,
  ['email', 'Adresse e-mail', 'vous@entreprise.fr', 'email', 'emailAddress', 'none'] as const,
  ['password', 'Mot de passe', 'Au moins 8 caractères', 'new-password', 'newPassword', 'none'] as const,
  ['confirmPassword', 'Confirmer le mot de passe', 'Confirmez votre mot de passe', 'new-password', 'newPassword', 'none'] as const,
] as const;

export default function RegisterScreen() {
  const authScreenStyles = useAuthScreenStyles();
  const { signUp } = useAuth();
  const { showSuccess } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    const { error, session } = await signUp({
      email: values.email,
      password: values.password,
      firstName: values.firstName,
      lastName: values.lastName,
      companyName: values.companyName,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }

    if (!session) {
      showSuccess("Un e-mail de confirmation vient d'être envoyé.");
      router.replace('/login' as Href);
      return;
    }

    showSuccess('Compte créé avec succès.');
    router.replace('/' as Href);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={authScreenStyles.container}>
      <FormScreen
        contentContainerStyle={authScreenStyles.content}
        footer={
          <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Créer un compte" />
        }
        scrollable>
        <View style={authScreenStyles.header}>
          <Image
            accessibilityIgnoresInvertColors
            source={require('@/assets/images/facteo-logo.png')}
            style={styles.logo}
          />
          <Text accessibilityRole="header" style={authScreenStyles.title}>
            Créer un compte
          </Text>
          <Text style={authScreenStyles.subtitle}>Commencez en quelques secondes.</Text>
        </View>

        {formError ? (
          <View accessibilityRole="alert" style={authScreenStyles.errorBanner}>
            <Text style={authScreenStyles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        <View style={authScreenStyles.form}>
          {FIELDS.map(([name, label, placeholder, autoComplete, textContentType, autoCapitalize], index) => (
            <Controller
              key={name}
              control={control}
              name={name}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  autoCapitalize={autoCapitalize}
                  autoComplete={autoComplete}
                  error={errors[name]?.message}
                  keyboardType={name === 'email' ? 'email-address' : 'default'}
                  label={label}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder={placeholder}
                  returnKeyType={index < FIELDS.length - 1 ? 'next' : 'done'}
                  secureTextEntry={name.includes('password')}
                  textContentType={textContentType}
                  value={value}
                />
              )}
            />
          ))}
        </View>

        <View style={authScreenStyles.footer}>
          <Text style={authScreenStyles.footerText}>
            Déjà un compte ?{' '}
            <Link href={'/login' as Href}>
              <Text style={authScreenStyles.footerLink}>Connexion</Text>
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
