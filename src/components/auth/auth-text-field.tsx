import { SymbolView } from 'expo-symbols';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useState } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { duration } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

const AnimatedView = Animated.createAnimatedComponent(View);

type AuthTextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  isPassword?: boolean;
  /** When true, label is only used for a11y; placeholder carries the visual hint. */
  hideLabel?: boolean;
};

/**
 * Floating auth field — depth, animated focus ring, no form clutter.
 */
export function AuthTextField({
  label,
  error,
  icon,
  isPassword = false,
  hideLabel = false,
  style,
  accessibilityLabel,
  onBlur,
  onFocus,
  ...props
}: AuthTextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [secure, setSecure] = useState(isPassword);
  const focusProgress = useSharedValue(0);

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [error ? colors.error : 'rgba(255,255,255,0.12)', error ? colors.error : colors.borderFocus],
    ),
    backgroundColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.1)'],
    ),
    transform: [{ scale: 1 + focusProgress.value * 0.008 }],
  }));

  const handleFocus: NonNullable<TextInputProps['onFocus']> = (event) => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: duration.fast });
    onFocus?.(event);
  };

  const handleBlur: NonNullable<TextInputProps['onBlur']> = (event) => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: duration.fast });
    onBlur?.(event);
  };

  return (
    <View style={styles.container}>
      {hideLabel ? null : (
        <Text maxFontSizeMultiplier={1.5} style={styles.label}>
          {label}
        </Text>
      )}
      <AnimatedView
        style={[
          styles.field,
          error ? styles.fieldError : null,
          fieldStyle,
        ]}>
        <SymbolView
          name={icon}
          size={18}
          style={styles.icon}
          tintColor={focused ? colors.primary : colors.iconSecondary}
          type="hierarchical"
        />
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, style]}
          {...props}
          onBlur={handleBlur}
          onFocus={handleFocus}
          secureTextEntry={isPassword ? secure : false}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={secure ? 'Afficher le mot de passe' : 'Masquer le mot de passe'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setSecure((value) => !value)}
            style={styles.trailingButton}>
            <SymbolView
              name={secure ? 'eye' : 'eye.slash'}
              size={18}
              tintColor={colors.iconSecondary}
              type="hierarchical"
            />
          </Pressable>
        ) : null}
      </AnimatedView>
      {error ? (
        <Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing[1.5],
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      marginLeft: spacing[0.5],
    },
    field: {
      minHeight: components.inputHeight + 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md + 2,
      borderRadius: radius.xl,
      borderWidth: 1.5,
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    fieldError: {
      borderColor: colors.error,
    },
    icon: {
      marginTop: 1,
    },
    input: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      paddingVertical: spacing.sm + 2,
      margin: 0,
    },
    trailingButton: {
      padding: spacing.xs,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
      marginLeft: spacing[0.5],
    },
  }));
}
