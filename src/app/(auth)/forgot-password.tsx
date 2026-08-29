import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';

const schema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const authScreenStyles = useAuthScreenStyles();
  const { resetPasswordForEmail } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const { error } = await resetPasswordForEmail(values.email);

    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }

    setSent(true);
  }

  return (
    <AuthScreen
      error={formError}
      footer={
        sent ? (
          <Button onPress={() => router.replace('/login' as Href)} title="Retour à la connexion" />
        ) : (
          <Button
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            title="Envoyer le lien"
          />
        )
      }
      footerLink={
        sent ? null : (
          <Text
            onPress={() => router.replace('/login' as Href)}
            style={authScreenStyles.footerLink}>
            Retour à la connexion
          </Text>
        )
      }
      subtitle={
        sent
          ? 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.'
          : 'Indiquez l’e-mail de votre compte INVEQ. Nous vous enverrons un lien de réinitialisation.'
      }
      title="Mot de passe oublié">
      {sent ? null : (
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
              returnKeyType="done"
              textContentType="emailAddress"
              value={value}
            />
          )}
        />
      )}
    </AuthScreen>
  );
}
