import { Children, Fragment, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ListRowSeparator } from '@/components/ui/list-row';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

type SettingsSectionProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

/**
 * Groupe de réglages.
 *
 * Insère lui-même le séparateur entre deux lignes : l'écran des paramètres
 * intercalait une vingtaine de `<View style={styles.separator} />` à la main,
 * et il en manquait à trois endroits.
 */
export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const styles = useStyles();
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      {title ? (
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={styles.title}>
          {title}
        </Text>
      ) : null}

      <Card flush variant="surface">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <ListRowSeparator /> : null}
            {row}
          </Fragment>
        ))}
      </Card>

      {footer ? (
        <Text maxFontSizeMultiplier={1.5} style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.xs,
    },
    title: {
      ...textHierarchy.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.xs,
      fontWeight: '500',
    },
    footer: {
      ...textHierarchy.caption,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },
  }));
}
