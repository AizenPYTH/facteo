import { type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { marketingColors } from '@/constants/marketing/theme';

type MarketingShellProps = {
  children: ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  return (
    <View style={styles.root}>
      <MarketingHeader isWide={isWide} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}>
        <View style={styles.main}>{children}</View>
        <MarketingFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: marketingColors.background,
    minHeight: '100vh' as unknown as number,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  main: {
    flex: 1,
  },
});
