import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';

type CollapsibleSectionProps = {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  style?: ViewStyle;
};

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = false,
  style,
}: CollapsibleSectionProps) {
  const styles = useStyles();
  const colors = useColors();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.container, style]}>
      <PressableScale
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        intensity="subtle"
        onPress={() => setExpanded((current) => !current)}
        style={styles.trigger}>
        <Text style={styles.title}>{title}</Text>
        <SymbolView
          name={{
            ios: expanded ? 'chevron.up' : 'chevron.down',
            android: expanded ? 'expand_less' : 'expand_more',
            web: expanded ? 'expand_less' : 'expand_more',
          }}
          size={18}
          tintColor={colors.iconSecondary}
          type="hierarchical"
        />
      </PressableScale>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.md,
    },
    trigger: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
    },
    pressed: {
      opacity: 0.85,
    },
    title: {
      ...textHierarchy.body,
      color: colors.text,
      fontWeight: '500',
    },
    content: {
      gap: spacing.sectionGap,
    },
  }));
}
