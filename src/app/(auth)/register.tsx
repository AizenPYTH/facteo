import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, type Href } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/hooks/use-auth';
import { authScreenStyles, getAuthErrorMessage } from '@/lib/auth/errors';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/register';

export default function RegisterScreen() {
  const { signUp } = useAuth();
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
      setFormError('Please check your email to confirm your account, then sign in.');
      router.replace('/login' as Href);
      return;
    }

    router.replace('/' as Href);
  }

  return (
    <SafeAreaView style={authScreenStyles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={authScreenStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={authScreenStyles.header}>
            <Text style={authScreenStyles.title}>Create Account</Text>
            <Text style={authScreenStyles.subtitle}>Start invoicing with FACTEO</Text>
          </View>

          {formError ? (
            <View style={authScreenStyles.errorBanner}>
              <Text style={authScreenStyles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          <View style={authScreenStyles.formCard}>
            <View style={authScreenStyles.field}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="words"
                    autoComplete="given-name"
                    error={errors.firstName?.message}
                    label="First name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Jane"
                    returnKeyType="next"
                    textContentType="givenName"
                    value={value}
                  />
                )}
              />
            </View>

            <View style={authScreenStyles.divider} />

            <View style={authScreenStyles.field}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="words"
                    autoComplete="family-name"
                    error={errors.lastName?.message}
                    label="Last name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Doe"
                    returnKeyType="next"
                    textContentType="familyName"
                    value={value}
                  />
                )}
              />
            </View>

            <View style={authScreenStyles.divider} />

            <View style={authScreenStyles.field}>
              <Controller
                control={control}
                name="companyName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="words"
                    autoComplete="organization"
                    error={errors.companyName?.message}
                    label="Company name"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Acme Inc."
                    returnKeyType="next"
                    textContentType="organizationName"
                    value={value}
                  />
                )}
              />
            </View>

            <View style={authScreenStyles.divider} />

            <View style={authScreenStyles.field}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="none"
                    autoComplete="email"
                    error={errors.email?.message}
                    keyboardType="email-address"
                    label="Email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="you@company.com"
                    returnKeyType="next"
                    textContentType="emailAddress"
                    value={value}
                  />
                )}
              />
            </View>

            <View style={authScreenStyles.divider} />

            <View style={authScreenStyles.field}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="none"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    label="Password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="At least 8 characters"
                    returnKeyType="next"
                    secureTextEntry
                    textContentType="newPassword"
                    value={value}
                  />
                )}
              />
            </View>

            <View style={authScreenStyles.divider} />

            <View style={authScreenStyles.field}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    autoCapitalize="none"
                    autoComplete="new-password"
                    error={errors.confirmPassword?.message}
                    label="Confirm password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Re-enter your password"
                    returnKeyType="done"
                    secureTextEntry
                    textContentType="newPassword"
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          <Button
            loading={isSubmitting}
            onPress={handleSubmit(onSubmit)}
            title="Create Account"
          />

          <View style={authScreenStyles.footer}>
            <Text style={authScreenStyles.footerText}>
              Already have an account?{' '}
              <Link href={'/login' as Href}>
                <Text style={authScreenStyles.footerLink}>Sign In</Text>
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
