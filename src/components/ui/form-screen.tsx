import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type FormScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  scrollable?: boolean;
  transparent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function FormScreen({
  children,
  header,
  footer,
  edges = ['top'],
  scrollable = true,
  transparent = false,
  contentContainerStyle,
  testID,
}: FormScreenProps) {
  const styles = useStyles(transparent);
  const footerInset = useStickyFooterInset();

  return (
    <View style={styles.root} testID={testID}>
      <SafeAreaView edges={edges} style={styles.safeArea}>
        {header ? <View style={styles.header}>{header}</View> : null}

        {scrollable ? (
          <KeyboardAwareScrollView
            bottomOffset={footer ? footerInset : spacing.md}
            contentContainerStyle={[
              styles.scrollContent,
              footer ? { paddingBottom: footerInset + spacing.md } : null,
              contentContainerStyle,
            ]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.flex}>
            {children}
          </KeyboardAwareScrollView>
        ) : (
          <View style={styles.flex}>{children}</View>
        )}
      </SafeAreaView>

      {footer ? <StickyFooter transparent={transparent}>{footer}</StickyFooter> : null}
    </View>
  );
}

const useStyles = (transparent: boolean) =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: transparent ? 'transparent' : colors.backgroundGrouped,
    },
    safeArea: {
      flex: 1,
    },
    flex: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
  }));
