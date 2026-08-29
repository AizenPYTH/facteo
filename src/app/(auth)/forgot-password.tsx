import { zodResolver } from '@hookform/resolvers/zod';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { NavigationHeader } from '@/components/ui/navigation-header';
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
    <FormScreen
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
      header={
        <NavigationHeader
          backLabel="Connexion"
          fallbackHref={'/login' as Href}
          title="Mot de passe oublié"
        />
      }>
      <Text style={authScreenStyles.footerText}>
        {sent
          ? 'Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.'
          : 'Indiquez l’e-mail de votre compte INVEQ. Nous vous enverrons un lien pour choisir un nouveau mot de passe sur inveq.fr.'}
      </Text>

      {formError ? (
        <View style={authScreenStyles.errorBanner}>
          <Text style={authScreenStyles.errorBannerText}>{formError}</Text>
        </View>
      ) : null}

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
    </FormScreen>
  );
}
