import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { iconSize, motion } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  /** Leading icon — reserves a consistent slot so fields in the same list align. */
  icon?: SymbolName;
};

/**
 * Every text input in the app funnels through here, so its focus/error
 * treatment is what makes filling a form feel considered instead of filling
 * an HTML form: the accent underline confirms which field is live, and the
 * error state is a color + motion signal, not just red text easy to miss.
 */
export function TextField({
  label,
  error,
  icon,
  style,
  accessibilityLabel,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);
  const shakeX = useSharedValue(0);
  const hadError = useRef(false);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: motion.fast });
  }, [isFocused, focusProgress]);

  useEffect(() => {
    if (error && !hadError.current) {
      shakeX.value = withSequence(
        withTiming(-4, { duration: 40 }),
        withTiming(4, { duration: 60 }),
        withTiming(-3, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
    }
    hadError.current = Boolean(error);
  }, [error, shakeX]);

  const underlineStyle = useAnimatedStyle(() => ({
    opacity: error ? 1 : focusProgress.value,
    backgroundColor: error ? colors.error : colors.primary,
    transform: [{ scaleX: error ? 1 : focusProgress.value }],
  }));

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View style={[styles.container, shakeStyle]}>
      {label ? (
        <Text
          maxFontSizeMultiplier={1.5}
          style={[styles.label, isFocused && !error ? styles.labelFocused : null, error ? styles.labelError : null]}>
          {label}
        </Text>
      ) : null}
      <View style={styles.row}>
        {icon ? (
          <SymbolView
            name={icon}
            size={iconSize.md}
            tintColor={error ? colors.error : isFocused ? colors.primary : colors.iconTertiary}
            type="hierarchical"
          />
        ) : null}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label ?? props.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textPlaceholder}
          style={[styles.input, style]}
          {...props}
        />
      </View>
      <Animated.View style={[styles.underline, underlineStyle]} />
      {error ? (
        <Animated.Text accessibilityRole="alert" maxFontSizeMultiplier={1.5} style={styles.error}>
          {error}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    labelFocused: {
      color: colors.primary,
    },
    labelError: {
      color: colors.error,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      ...typography.body,
      color: colors.text,
      flex: 1,
      minHeight: 44,
      paddingVertical: spacing.sm,
      paddingHorizontal: 0,
      margin: 0,
    },
    underline: {
      height: 2,
      borderRadius: 1,
      marginTop: -1,
    },
    error: {
      ...typography.caption1,
      color: colors.error,
    },
  }));
}
