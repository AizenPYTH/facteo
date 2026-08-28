import { ScrollView, StyleSheet, View } from 'react-native';

import { FeatureIntroModal } from '@/components/feature-intros';
import { SettingsRow, SettingsSection } from '@/components/settings';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { AppText } from '@/components/ui/app-text';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { listFeatureIntroConfigs } from '@/lib/feature-intros/config';
import { resetAllFeatureIntros } from '@/lib/feature-intros/storage';
import type { FeatureIntroId } from '@/lib/feature-intros/types';
import { useToast } from '@/providers/toast-provider';

/**
 * Hub to replay first-use animated feature intros.
 */
export default function DiscoverInveqScreen() {
  const styles = useStyles();
  const { showSuccess } = useToast();
  const configs = listFeatureIntroConfigs();

  return (
    <SettingsScreenFrame title="Découvrir INVEQ">
      <AppText color="secondary" variant="subtitle">
        Revoyez les démonstrations animées des fonctionnalités importantes. Elles ne
        bloquent jamais votre parcours.
      </AppText>

      <SettingsSection title="Démonstrations">
        {configs.map((config, index) => (
          <View key={config.id}>
            {index > 0 ? <View style={styles.separator} /> : null}
            <DiscoverRow configId={config.id} label={config.title} />
          </View>
        ))}
      </SettingsSection>

      <SettingsSection title="Réinitialiser">
        <SettingsRow
          label="Réafficher toutes les introductions"
          onPress={() => {
            void resetAllFeatureIntros().then(() => {
              showSuccess(
                'Les introductions seront de nouveau proposées à la prochaine ouverture.',
              );
            });
          }}
        />
      </SettingsSection>
    </SettingsScreenFrame>
  );
}

function DiscoverRow({ configId, label }: { configId: FeatureIntroId; label: string }) {
  const intro = useFeatureIntro(configId);

  return (
    <>
      <SettingsRow
        label={label}
        onPress={() => {
          void intro.resetAndShow();
        }}
      />
      <FeatureIntroModal
        config={intro.config}
        onClose={intro.onClose}
        onCta={intro.onCta}
        onDontShowAgain={intro.onDontShowAgain}
        visible={intro.visible}
      />
    </>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
  }));
}
