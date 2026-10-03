import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Modal, Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  composerRadius,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { triggerSelectionHaptic } from '@/lib/haptics';

export type ComposerIconName = SymbolViewProps['name'];

export function ComposerIcon({
  name,
  size = 18,
  color,
}: {
  name: ComposerIconName;
  size?: number;
  color: string;
}) {
  return <SymbolView name={name} size={size} tintColor={color} type="monochrome" />;
}

/** Libellé de section iOS : 13 px, capitales, gris. Action facultative à droite. */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  first = false,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Première section de l'écran : pas d'espace au-dessus. */
  first?: boolean;
}) {
  const styles = useComposerStyles(primitiveStyles);

  return (
    <View style={[styles.sectionHeader, first && styles.sectionHeaderFirst]}>
      <Text accessibilityRole="header" maxFontSizeMultiplier={1.4} style={styles.sectionTitle}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={onAction}
          style={({ pressed }) => [styles.sectionAction, pressed && styles.pressed]}>
          <Text maxFontSizeMultiplier={1.4} style={styles.sectionActionLabel}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Carte groupée iOS : surface, rayon 14, sans bordure. */
export function GroupCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useComposerStyles(primitiveStyles);
  return <View style={[styles.groupCard, style]}>{children}</View>;
}

export type SegmentOption<T extends string> = { value: T; label: string };

/** Contrôle segmenté iOS (piste grise, segment actif en surface). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  columns,
  height = 30,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Grille (ex. 2 colonnes) au lieu d'une seule rangée. */
  columns?: number;
  height?: number;
}) {
  const styles = useComposerStyles(primitiveStyles);

  return (
    <View accessibilityRole="tablist" style={[styles.segmentTrack, columns ? styles.segmentGrid : null]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => {
              if (!active) {
                void triggerSelectionHaptic();
                onChange(option.value);
              }
            }}
            style={[
              styles.segment,
              { height, minHeight: height },
              columns ? { flexBasis: `${100 / columns - 2}%`, flexGrow: 1 } : null,
              active && styles.segmentActive,
            ]}>
            <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.segmentLabel}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pastille sélectionnable (délais, catégories). */
export function Pill({
  label,
  selected,
  onPress,
  variant = 'outline',
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `outline` : délais (bordure) ; `solid` : catégories (encre pleine). */
  variant?: 'outline' | 'solid';
  accessibilityLabel?: string;
}) {
  const styles = useComposerStyles(primitiveStyles);
  const isSolid = variant === 'solid';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        void triggerSelectionHaptic();
        onPress();
      }}
      style={({ pressed }) => [
        isSolid ? styles.pillSolid : styles.pillOutline,
        selected && (isSolid ? styles.pillSolidSelected : styles.pillOutlineSelected),
        pressed && styles.pressed,
      ]}>
      <Text
        maxFontSizeMultiplier={1.3}
        style={[
          isSolid ? styles.pillSolidLabel : styles.pillOutlineLabel,
          selected && (isSolid ? styles.pillSolidLabelSelected : styles.pillOutlineLabelSelected),
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Feuille iOS (page sheet) : titre 20/800 et bouton « Fermer » en haut.
 * Sur Android et le web, la modale occupe l'écran : on y ajoute la marge haute.
 */
export function ComposerSheet({
  visible,
  title,
  onClose,
  closeLabel = 'Fermer',
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const styles = useComposerStyles(primitiveStyles);
  const insets = useSafeAreaInsets();
  const isPageSheet = Platform.OS === 'ios';

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}>
      <View style={[styles.sheetRoot, { paddingTop: isPageSheet ? 0 : insets.top }]}>
        {isPageSheet ? <View style={styles.sheetGrabber} /> : null}
        <View style={styles.sheetHeader}>
          <Text accessibilityRole="header" maxFontSizeMultiplier={1.3} style={styles.sheetTitle}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={({ pressed }) => [styles.sheetClose, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.sheetCloseLabel}>
              {closeLabel}
            </Text>
          </Pressable>
        </View>
        <View style={styles.sheetBody}>{children}</View>
        {footer ? (
          <View style={[styles.sheetFooter, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            {footer}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

/** Bouton principal 54 px, indigo. */
export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useComposerStyles(primitiveStyles);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        isDisabled && styles.primaryButtonDisabled,
        pressed && styles.primaryButtonPressed,
        style,
      ]}>
      <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.primaryButtonLabel}>
        {loading ? 'Enregistrement…' : label}
      </Text>
    </Pressable>
  );
}

/** Champ de recherche iOS (piste grise, loupe). */
export function SearchTrack({ children }: { children: ReactNode }) {
  const styles = useComposerStyles(primitiveStyles);
  const colors = useComposerColors();

  return (
    <View style={styles.searchTrack}>
      <ComposerIcon
        color={colors.ink3}
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={16}
      />
      {children}
    </View>
  );
}

/** Initiales d'un nom : « Groupe Méridien Bâtiment » → « GM ». */
export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

export function primitiveStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.6,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'baseline' as const,
      justifyContent: 'space-between' as const,
      paddingTop: 22,
      paddingBottom: 8,
      paddingHorizontal: 4,
    },
    sectionHeaderFirst: {
      paddingTop: 4,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
      color: colors.ink3,
    },
    sectionAction: {
      minHeight: 28,
      justifyContent: 'center' as const,
    },
    sectionActionLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    groupCard: {
      backgroundColor: colors.surface,
      borderRadius: composerRadius.card,
      overflow: 'hidden' as const,
    },
    segmentTrack: {
      flexDirection: 'row' as const,
      padding: 2,
      gap: 2,
      borderRadius: 9,
      backgroundColor: colors.track,
    },
    segmentGrid: {
      flexWrap: 'wrap' as const,
    },
    segment: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 7,
      paddingHorizontal: 6,
    },
    segmentActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    segmentLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    pillOutline: {
      height: 36,
      minWidth: 44,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pillOutlineSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    pillOutlineLabel: {
      fontSize: 14.5,
      fontWeight: '600' as const,
      color: colors.ink2,
    },
    pillOutlineLabelSelected: {
      color: colors.accentInk,
    },
    pillSolid: {
      height: 32,
      paddingHorizontal: 13,
      borderRadius: 99,
      backgroundColor: colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pillSolidSelected: {
      backgroundColor: colors.ink,
    },
    pillSolidLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.ink2,
    },
    pillSolidLabelSelected: {
      color: colors.bg,
    },
    sheetRoot: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    sheetGrabber: {
      alignSelf: 'center' as const,
      width: 36,
      height: 5,
      borderRadius: 99,
      backgroundColor: colors.line,
      marginTop: 8,
      marginBottom: 6,
    },
    sheetHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      minHeight: 48,
      paddingHorizontal: 16,
    },
    sheetTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: '800' as const,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    sheetClose: {
      minHeight: 44,
      minWidth: 44,
      alignItems: 'flex-end' as const,
      justifyContent: 'center' as const,
    },
    sheetCloseLabel: {
      fontSize: 17,
      color: colors.accent,
    },
    sheetBody: {
      flex: 1,
    },
    sheetFooter: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.bar,
      borderTopWidth: 1,
      borderTopColor: colors.line,
    },
    primaryButton: {
      height: 54,
      borderRadius: composerRadius.button,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: 16,
      shadowColor: '#4F46E5',
      shadowOpacity: 0.45,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonPressed: {
      opacity: 0.88,
    },
    primaryButtonLabel: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: colors.onAccent,
    },
    searchTrack: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      height: 40,
      paddingHorizontal: 12,
      borderRadius: 11,
      backgroundColor: colors.track,
    },
  };
}
