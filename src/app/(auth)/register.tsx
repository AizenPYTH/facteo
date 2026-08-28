import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Redirect, router, type Href } from 'expo-router';
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
import { openLegalPage } from '@/lib/legal/open-legal-page';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/register';
import { useToast } from '@/providers/toast-provider';

const FIELDS = [
  {
    name: 'firstName' as const,
    label: 'Prénom',
    placeholder: 'Jean',
    autoComplete: 'given-name' as const,
    textContentType: 'givenName' as const,
    autoCapitalize: 'words' as const,
    icon: 'person.fill' as const,
  },
  {
    name: 'lastName' as const,
    label: 'Nom',
    placeholder: 'Dupont',
    autoComplete: 'family-name' as const,
    textContentType: 'familyName' as const,
    autoCapitalize: 'words' as const,
    icon: 'person.fill' as const,
  },
  {
    name: 'companyName' as const,
    label: "Nom de l'entreprise",
    placeholder: 'Acme SARL',
    autoComplete: 'organization' as const,
    textContentType: 'organizationName' as const,
    autoCapitalize: 'words' as const,
    icon: 'building.2.fill' as const,
  },
  {
    name: 'email' as const,
    label: 'Adresse e-mail',
    placeholder: 'vous@entreprise.fr',
    autoComplete: 'email' as const,
    textContentType: 'emailAddress' as const,
    autoCapitalize: 'none' as const,
    icon: 'envelope.fill' as const,
  },
  {
    name: 'password' as const,
    label: 'Mot de passe',
    placeholder: 'Au moins 8 caractères',
    autoComplete: 'new-password' as const,
    textContentType: 'newPassword' as const,
    autoCapitalize: 'none' as const,
    icon: 'lock.fill' as const,
    isPassword: true,
  },
  {
    name: 'confirmPassword' as const,
    label: 'Confirmer le mot de passe',
    placeholder: 'Confirmez votre mot de passe',
    autoComplete: 'new-password' as const,
    textContentType: 'newPassword' as const,
    autoCapitalize: 'none' as const,
    icon: 'lock.fill' as const,
    isPassword: true,
  },
] as const;

export default function RegisterScreen() {
  // Guideline 3.1.1 — iOS binary must not expose account creation (business/org signup).
  if (isIosAccountCreationDisabled()) {
    return <Redirect href={'/login' as Href} />;
  }

  return <RegisterScreenForm />;
}

function RegisterScreenForm() {
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
    <AuthScreen
      error={formError}
      footer={
        <Button
          elevated
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          title="Créer un compte"
        />
      }
      footerLink={
        <Text style={authScreenStyles.footerText}>
          Déjà un compte ?{' '}
          <Link href={'/login' as Href}>
            <Text style={authScreenStyles.footerLink}>Connexion</Text>
          </Link>
        </Text>
      }
      subtitle="Commencez en quelques secondes."
      title="Créer un compte">
      {FIELDS.map((field, index) => (
        <Controller
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthTextField
              autoCapitalize={field.autoCapitalize}
              autoComplete={field.autoComplete}
              error={errors[field.name]?.message}
              icon={field.icon}
              isPassword={'isPassword' in field ? field.isPassword : false}
              keyboardType={field.name === 'email' ? 'email-address' : 'default'}
              label={field.label}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={field.placeholder}
              returnKeyType={index < FIELDS.length - 1 ? 'next' : 'done'}
              textContentType={field.textContentType}
              value={value}
            />
          )}
        />
      ))}
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
    </AuthScreen>
  );
}
