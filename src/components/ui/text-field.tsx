import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

const AnimatedView = Animated.createAnimatedComponent(View);

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function TextField({
  label,
  error,
  style,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusProgress.value,
      [0, 1],
      [error ? colors.error : colors.border, error ? colors.error : colors.borderFocus],
    ),
  }));

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(true);
    focusProgress.value = withTiming(1, { duration: duration.fast });
    onFocus?.(e);
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: duration.fast });
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label ? (
        <Text maxFontSizeMultiplier={1.5} style={styles.label}>
          {label}
        </Text>
      ) : null}
      <AnimatedView
        style={[
          styles.field,
          error ? styles.fieldError : null,
          focused && !error ? styles.fieldFocused : null,
          borderStyle,
        ]}>
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, style]}
          {...props}
        />
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
      ...type.label,
      color: colors.textSecondary,
    },
    field: {
      minHeight: 48,
      borderRadius: radius.input,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
    },
    fieldFocused: {
      backgroundColor: colors.background,
    },
    fieldError: {
      borderColor: colors.error,
      backgroundColor: colors.errorSubtle,
    },
    input: {
      ...type.body,
      color: colors.text,
      paddingVertical: spacing.sm,
      margin: 0,
    },
    error: {
      ...type.caption,
      color: colors.error,
    },
  }));
}
