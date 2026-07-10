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
import { loginSchema, type LoginFormValues } from '@/lib/validations/login';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
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
    <SafeAreaView style={authScreenStyles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={authScreenStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={authScreenStyles.header}>
            <Text style={authScreenStyles.title}>Sign In</Text>
            <Text style={authScreenStyles.subtitle}>Welcome back to FACTEO</Text>
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
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
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
                    autoComplete="password"
                    error={errors.password?.message}
                    label="Password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Enter your password"
                    returnKeyType="done"
                    secureTextEntry
                    textContentType="password"
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Sign In" />

          <View style={authScreenStyles.footer}>
            <Text style={authScreenStyles.footerText}>
              Don&apos;t have an account?{' '}
              <Link href={'/register' as Href}>
                <Text style={authScreenStyles.footerLink}>Register</Text>
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
