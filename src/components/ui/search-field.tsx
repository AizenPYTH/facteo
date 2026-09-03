import { SymbolView } from 'expo-symbols';
import { TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Libellé lu par VoiceOver ; à préciser quand le placeholder est générique. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Champ de recherche canonique.
 *
 * Factures, devis et clients en avaient chacun une copie, avec des paddings et
 * des bordures qui divergeaient. Le bouton d'effacement est une zone tactile de
 * 44 pt — il faisait 18 pt.
 *
 * Volontairement hors de la chaîne de navigation du formulaire : une recherche
 * ne fait pas partie d'une saisie à valider.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder = 'Rechercher',
  accessibilityLabel,
  style,
  testID,
}: SearchFieldProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={18}
        tintColor={colors.iconTertiary}
        type="hierarchical"
      />

      <TextInput
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        // `clearButtonMode` n'existe que sur iOS : on rend notre propre bouton
        // pour que le geste soit le même sur les deux plateformes.
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textPlaceholder}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />

      {value.length > 0 ? (
        <PressableScale
          accessibilityLabel="Effacer la recherche"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText('')}
          style={styles.clearButton}>
          <SymbolView
            name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
            size={18}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
        </PressableScale>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 48,
      backgroundColor: colors.surface,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: spacing.md,
      paddingRight: spacing[2],
    },
    input: {
      ...typography.body,
      flex: 1,
      color: colors.text,
      paddingVertical: spacing.sm,
      paddingHorizontal: 0,
      margin: 0,
    },
    clearButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));
}
