import { Link, router, type Href } from 'expo-router';
import { Platform, Text } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { openLegalPage } from '@/lib/legal/open-legal-page';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/register';
import { useToast } from '@/providers/toast-provider';

/**
 * iOS / Android : pas de parcours d'inscription — texte informatif seulement (DESIGN §1 / §5.1).
 * Web : formulaire d'inscription conservé.
 */
export default function RegisterScreen() {
  if (Platform.OS === 'web') {
    return <WebRegisterScreen />;
  }

  return <NativeRegisterInfoScreen />;
}

function NativeRegisterInfoScreen() {
  const authScreenStyles = useAuthScreenStyles();

  return (
    <AuthScreen
      footer={
        <Button onPress={() => router.replace('/login' as Href)} title="Se connecter" />
      }
      footerLink={
        <Text style={authScreenStyles.footerText}>
          La création de compte se fait sur inveq.fr. Une fois votre compte créé, reconnectez-vous
          dans l’app.
        </Text>
      }
      subtitle="L’app iOS sert à vous connecter à un compte INVEQ existant."
      title="Compte INVEQ"
    >
      <Text style={authScreenStyles.footerText}>
        Aucun achat ni inscription n’est proposé ici. Créez votre compte sur le site, puis utilisez
        e-mail, Apple ou Google pour vous connecter.
      </Text>
    </AuthScreen>
  );
}

function WebRegisterScreen() {
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
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    const { error } = await signUp(values);

    if (error) {
      setFormError(getAuthErrorMessage(error.message));
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
      subtitle="Créez votre espace de facturation."
      title="Inscription">
      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            autoCapitalize="words"
            error={errors.firstName?.message}
            icon="person.fill"
            label="Prénom"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Jean"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            autoCapitalize="words"
            error={errors.lastName?.message}
            icon="person.fill"
            label="Nom"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Dupont"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="companyName"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            autoCapitalize="words"
            error={errors.companyName?.message}
            icon="building.2.fill"
            label="Nom de l'entreprise"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Acme SARL"
            value={value}
          />
        )}
      />
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
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            error={errors.password?.message}
            icon="lock.fill"
            isPassword
            label="Mot de passe"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Au moins 8 caractères"
            value={value}
          />
        )}
      />
      <Text style={authScreenStyles.footerText}>
        En créant un compte, vous acceptez les{' '}
        <Text onPress={() => openLegalPage('terms')} style={authScreenStyles.footerLink}>
          conditions
        </Text>{' '}
        et la{' '}
        <Text onPress={() => openLegalPage('privacy')} style={authScreenStyles.footerLink}>
          politique de confidentialité
        </Text>
        .
      </Text>
    </AuthScreen>
  );
}
