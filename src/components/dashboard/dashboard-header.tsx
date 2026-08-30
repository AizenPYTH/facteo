import { View, type ViewStyle } from 'react-native';

import { CompanySwitcher } from '@/components/company/company-switcher';
import { AppText } from '@/components/ui/app-text';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import type { TenantCompany } from '@/types/tenant';

export type DashboardHeaderProps = {
  firstName?: string;
  companyName?: string;
  greetingPrefix?: string;
  companies?: TenantCompany[];
  activeCompany?: TenantCompany | null;
  onSwitchCompany?: (companyId: string) => void;
  onCreateCompany?: (name: string) => Promise<void>;
  style?: ViewStyle;
};

/** Accueil — plus d’engrenage : Réglages est un onglet (DESIGN §4). */
export function DashboardHeader({
  firstName,
  companyName,
  greetingPrefix = 'Bonjour',
  companies = [],
  activeCompany,
  onSwitchCompany,
  onCreateCompany,
  style,
}: DashboardHeaderProps) {
  const styles = useStyles();
  const greeting = firstName ? `${greetingPrefix}, ${firstName}` : greetingPrefix;
  const showSwitcher = companies.length > 0 && onSwitchCompany && onCreateCompany;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textBlock}>
        <AppText accessibilityRole="header" numberOfLines={2} variant="display">
          {greeting}
        </AppText>
        {showSwitcher ? (
          <CompanySwitcher
            activeCompany={activeCompany ?? null}
            companies={companies}
            onCreate={onCreateCompany}
            onSelect={onSwitchCompany}
          />
        ) : companyName ? (
          <AppText color="secondary" numberOfLines={2} variant="subtitle">
            {companyName}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    container: {
      gap: spacing.xs,
    },
    textBlock: {
      gap: spacing.xs,
    },
  }));
}
