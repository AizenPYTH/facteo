import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type ClientSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  testID?: string;
};

export function ClientSearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher par société, contact, téléphone ou email',
  style,
  testID,
}: ClientSearchBarProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={18}
        tintColor={colors.iconTertiary}
        type="hierarchical"
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
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
            size={18}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    padding: 0,
    margin: 0,
  },
});
