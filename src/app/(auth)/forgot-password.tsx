import { zodResolver } from '@hookform/resolvers/zod';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { AuthScreen } from '@/components/auth/auth-screen';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { Button } from '@/components/ui/button';
import { useAuthScreenStyles } from '@/hooks/use-auth-screen-styles';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { MARKETING_SITE_URL } from '@/constants/marketing/site';
import { supabase } from '@/lib/supabase';

const forgotSchema = z.object({
  email: z.string().trim().email('Adresse e-mail invalide.'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const authScreenStyles = useAuthScreenStyles();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotFormValues) {
    setFormError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(values.email.trim(), {
      redirectTo: `${MARKETING_SITE_URL}/app/reset-password`,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error.message));
      return;
    }

    setSuccessMessage(
      'Si un compte existe pour cet e-mail, vous recevrez un lien de réinitialisation.',
    );
  }

  return (
    <AuthScreen
      error={formError}
      info={successMessage}
      footer={
        <Button
          elevated
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          title="Envoyer le lien"
        />
      }
      footerLink={
        <Text style={authScreenStyles.footerText}>
          Retour à la{' '}
          <Link href={'/login' as Href}>
            <Text style={authScreenStyles.footerLink}>connexion</Text>
          </Link>
        </Text>
      }
      subtitle="Nous vous enverrons un lien pour choisir un nouveau mot de passe."
      title="Mot de passe oublié">
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
    </AuthScreen>
  );
}
