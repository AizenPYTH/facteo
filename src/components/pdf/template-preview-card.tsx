import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

type TemplatePreviewCardProps = {
  template: PdfTemplateDefinition;
  selected?: boolean;
  compact?: boolean;
};

export function TemplatePreviewCard({ template, selected = false, compact = false }: TemplatePreviewCardProps) {
  const styles = useStyles();
  const { theme, layout: layoutVariant } = template;
  const previewHeight = compact ? 88 : components.templatePreviewHeight;

  return (
    <View style={[styles.wrap, selected && styles.wrapSelected]}>
      <View style={[styles.preview, { height: previewHeight, backgroundColor: theme.surfaceAlt }]}>
        {layoutVariant === 'banner' ? (
          <View style={[styles.banner, { backgroundColor: theme.primary }]} />
        ) : layoutVariant === 'sidebar' ? (
          <View style={[styles.sidebar, { backgroundColor: theme.primary }]} />
        ) : layoutVariant === 'stripe' ? (
          <View style={[styles.stripe, { backgroundColor: theme.accent }]} />
        ) : (
          <View style={[styles.headerLine, { backgroundColor: theme.primary }]} />
        )}

        <View style={styles.body}>
          <View style={styles.metaRow}>
            <View style={[styles.logoBlock, { backgroundColor: theme.surface }]} />
            <View style={styles.metaLines}>
              <View style={[styles.line, { backgroundColor: theme.border, width: '70%' }]} />
              <View style={[styles.line, { backgroundColor: theme.border, width: '45%' }]} />
            </View>
          </View>

          <View style={[styles.tableHeader, { backgroundColor: theme.surface }]}>
            <View style={[styles.line, { backgroundColor: theme.muted, width: '30%' }]} />
            <View style={[styles.line, { backgroundColor: theme.muted, width: '18%' }]} />
          </View>
          <View style={[styles.tableRow, { borderColor: theme.border }]}>
            <View style={[styles.line, { backgroundColor: theme.border, width: '55%' }]} />
            <View style={[styles.line, { backgroundColor: theme.border, width: '20%' }]} />
          </View>
          <View style={[styles.totals, { backgroundColor: theme.paymentBg, borderColor: theme.paymentBorder }]}>
            <View style={[styles.line, { backgroundColor: theme.primary, width: '40%' }]} />
          </View>
        </View>
      </View>

      <AppText medium numberOfLines={1} variant="body">
        {template.name}
      </AppText>
      {!compact ? (
        <AppText color="secondary" numberOfLines={2} variant="caption">
          {template.description}
        </AppText>
      ) : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    wrap: {
      gap: spacing.xs,
      flex: 1,
      minWidth: '46%',
    },
    wrapSelected: {
      opacity: 1,
    },
    preview: {
      borderRadius: radius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    banner: {
      height: 14,
      width: '100%',
    },
    sidebar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 10,
    },
    stripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    headerLine: {
      height: 3,
      width: '36%',
      marginTop: spacing.sm,
      marginLeft: spacing.sm,
      borderRadius: radius.full,
    },
    body: {
      flex: 1,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      alignItems: 'center',
    },
    logoBlock: {
      width: 18,
      height: 18,
      borderRadius: 4,
    },
    metaLines: {
      flex: 1,
      gap: 4,
    },
    line: {
      height: 4,
      borderRadius: 2,
    },
    tableHeader: {
      marginTop: spacing.xs,
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderRadius: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tableRow: {
      borderBottomWidth: 1,
      paddingVertical: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    totals: {
      marginTop: 'auto',
      padding: 6,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'flex-end',
    },
  }));
