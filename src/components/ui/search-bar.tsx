import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, TextInput, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { iconSize, motion } from '@/constants/theme/design-system';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Generic search field for list screens (clients, invoices, quotes) —
 * one implementation instead of three near-identical copies, with a
 * focus ring that ties it visually to `TextField`.
 */
export function SearchBar({ value, onChangeText, placeholder = 'Rechercher', style, testID }: SearchBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: motion.fast });
  }, [isFocused, focusProgress]);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: isFocused ? colors.primary : colors.border,
    shadowOpacity: focusProgress.value * 0.12,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle, style]} testID={testID}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={iconSize.md}
        tintColor={isFocused ? colors.primary : colors.iconTertiary}
        type="hierarchical"
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onBlur={() => setIsFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityLabel="Effacer la recherche"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}>
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
            size={iconSize.md}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.inputPadding,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      shadowOpacity: 0,
    },
    input: {
      ...typography.body,
      flex: 1,
      color: colors.text,
      padding: 0,
      margin: 0,
    },
  }));
}
