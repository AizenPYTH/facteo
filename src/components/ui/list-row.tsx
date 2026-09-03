import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Icône SF/Material affichée dans une pastille à gauche. */
  icon?: SymbolName;
  /** Contenu libre à gauche, prioritaire sur `icon`. */
  leading?: ReactNode;
  /** Contenu libre à droite : montant, badge, interrupteur. */
  trailing?: ReactNode;
  /** Valeur textuelle à droite, ignorée si `trailing` est fourni. */
  value?: string;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const CHEVRON = { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' } as const satisfies SymbolName;

/**
 * Ligne de liste canonique : paramètres, détails, sélecteurs.
 *
 * Hauteur minimale de 52 pt pour rester au-dessus du seuil tactile de 44 pt,
 * même quand la ligne n'a qu'un titre.
 */
export function ListRow({
  title,
  subtitle,
  icon,
  leading,
  trailing,
  value,
  showChevron,
  destructive = false,
  disabled = false,
  onPress,
  accessibilityHint,
  style,
  testID,
}: ListRowProps) {
  const styles = useStyles();
  const colors = useColors();
  const chevron = showChevron ?? Boolean(onPress);
  const titleColor = destructive ? colors.error : colors.text;

  const content = (
    <View style={[styles.row, disabled && styles.disabled, style]}>
      {leading ?? (icon ? (
        <View style={styles.iconWrap}>
          <SymbolView
            name={icon}
            size={18}
            tintColor={destructive ? colors.error : colors.primary}
            type="hierarchical"
          />
        </View>
      ) : null)}

      <View style={styles.body}>
        <Text maxFontSizeMultiplier={1.6} numberOfLines={2} style={[styles.title, { color: titleColor }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text maxFontSizeMultiplier={1.5} numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ?? (value ? (
        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      ) : null)}

      {chevron ? (
        <SymbolView name={CHEVRON} size={14} tintColor={colors.iconTertiary} type="hierarchical" />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View testID={testID}>{content}</View>;
  }

  return (
    <PressableScale
      accessibilityHint={accessibilityHint}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      intensity="subtle"
      onPress={onPress}
      testID={testID}>
      {content}
    </PressableScale>
  );
}

/** Séparateur aligné sur le texte, à intercaler entre deux ListRow. */
export function ListRowSeparator({ inset = true }: { inset?: boolean }) {
  const styles = useStyles();
  return <View style={[styles.separator, inset && styles.separatorInset]} />;
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      minHeight: 52,
      paddingVertical: spacing[2.5],
      paddingHorizontal: spacing.listItemPadding,
      backgroundColor: colors.surface,
    },
    disabled: {
      opacity: 0.5,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    body: {
      flex: 1,
      gap: spacing[0.5],
    },
    title: {
      ...typography.body,
    },
    subtitle: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    value: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separatorOpaque,
    },
    separatorInset: {
      marginLeft: spacing.listItemPadding,
    },
  }));
