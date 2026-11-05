import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { TextField } from '@/components/ui/text-field';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-colors';
import { useTenant } from '@/hooks/use-tenant';
import {
  AUTOMATIC_REMINDER_STAGES,
  DEFAULT_REMINDER_TEMPLATES,
  REMINDER_PLACEHOLDERS_HELP,
  REMINDER_STAGE_LABELS,
  type ReminderStage,
} from '@/lib/reminders/templates';
import { fetchReminderSettings, saveReminderSettings, type ReminderSettings } from '@/lib/supabase/reminders';
import { useToast } from '@/providers/toast-provider';

const EDITABLE_STAGES: ReminderStage[] = [...AUTOMATIC_REMINDER_STAGES, 'manual'];

/** Réglages des relances automatiques (mêmes réglages que sur le site). */
export default function ReminderSettingsScreen() {
  const { activeCompany } = useTenant();
  const companyId = activeCompany?.id ?? '';
  const query = useQuery({
    queryKey: ['reminder-settings', companyId],
    queryFn: () => fetchReminderSettings(companyId),
    enabled: Boolean(companyId),
  });

  return (
    <SettingsScreenFrame title="Relances">
      {!companyId || !query.data ? (
        <LoadingView />
      ) : (
        <ReminderSettingsForm companyId={companyId} initial={query.data} key={companyId} />
      )}
    </SettingsScreenFrame>
  );
}

function ReminderSettingsForm({ companyId, initial }: { companyId: string; initial: ReminderSettings }) {
  const styles = useStyles();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();
  const [settings, setSettings] = useState<ReminderSettings>(initial);
  const [openStage, setOpenStage] = useState<ReminderStage | null>(null);

  const mutation = useMutation({
    mutationFn: () => saveReminderSettings(companyId, user?.id ?? '', settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reminder-settings', companyId] });
      void queryClient.invalidateQueries({ queryKey: ['invoice-next-reminder'] });
      showSuccess(settings.enabled ? 'Relances automatiques activées.' : 'Réglages enregistrés.');
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  const template = (stage: ReminderStage) => settings.templates[stage] ?? { subject: '', body: '' };
  const setTemplate = (stage: ReminderStage, patch: Partial<{ subject: string; body: string }>) =>
    setSettings((current) => ({
      ...current,
      templates: { ...current.templates, [stage]: { ...template(stage), ...patch } },
    }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.title}>Relances automatiques</Text>
            <Text style={styles.body}>
              Vos clients sont relancés par e-mail selon le calendrier ci-dessous. Les relances s’arrêtent dès que la
              facture est payée ; les factures annulées ou en brouillon ne sont jamais relancées.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Relances automatiques"
            onValueChange={(enabled) => setSettings({ ...settings, enabled })}
            value={settings.enabled}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Calendrier</Text>
        {AUTOMATIC_REMINDER_STAGES.map((stage) => (
          <View key={stage} style={styles.row}>
            <Text style={styles.label}>{REMINDER_STAGE_LABELS[stage]}</Text>
            <Switch
              accessibilityLabel={REMINDER_STAGE_LABELS[stage]}
              onValueChange={(value) => setSettings({ ...settings, stages: { ...settings.stages, [stage]: value } })}
              value={settings.stages[stage]}
            />
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.label}>Lien de paiement en ligne quand il existe</Text>
          <Switch
            accessibilityLabel="Lien de paiement"
            onValueChange={(includePaymentLink) => setSettings({ ...settings, includePaymentLink })}
            value={settings.includePaymentLink}
          />
        </View>
        <Text style={styles.hint}>
          Une facture échue depuis plus de 45 jours n’est plus relancée automatiquement. Chaque étape n’est envoyée
          qu’une fois.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.hint}>{REMINDER_PLACEHOLDERS_HELP}</Text>
        {EDITABLE_STAGES.map((stage) => {
          const custom = template(stage);
          const isCustom = Boolean(custom.subject.trim() || custom.body.trim());
          const open = openStage === stage;
          return (
            <View key={stage} style={styles.templateBlock}>
              <Pressable accessibilityRole="button" onPress={() => setOpenStage(open ? null : stage)} style={styles.row}>
                <Text style={styles.label}>{REMINDER_STAGE_LABELS[stage]}</Text>
                <Text style={styles.hint}>{isCustom ? 'Personnalisé' : 'Par défaut'}</Text>
              </Pressable>
              {open ? (
                <View style={styles.templateFields}>
                  <TextField
                    label="Objet"
                    maxLength={200}
                    onChangeText={(subject) => setTemplate(stage, { subject })}
                    placeholder={DEFAULT_REMINDER_TEMPLATES[stage].subject}
                    skipFieldNavigation
                    value={custom.subject}
                  />
                  <TextField
                    label="Message"
                    maxLength={5000}
                    multiline
                    numberOfLines={8}
                    onChangeText={(body) => setTemplate(stage, { body })}
                    placeholder={DEFAULT_REMINDER_TEMPLATES[stage].body}
                    skipFieldNavigation
                    style={styles.multiline}
                    value={custom.body}
                  />
                  {isCustom ? (
                    <Button
                      onPress={() => setTemplate(stage, { subject: '', body: '' })}
                      title="Revenir au message par défaut"
                      variant="ghost"
                    />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Button loading={mutation.isPending} onPress={() => mutation.mutate()} title="Enregistrer" />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.lg,
      paddingBottom: spacing.xl,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: 44,
    },
    rowText: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    label: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1,
    },
    body: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    hint: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    templateBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    templateFields: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    multiline: {
      minHeight: 160,
      textAlignVertical: 'top',
    },
  }));
}
