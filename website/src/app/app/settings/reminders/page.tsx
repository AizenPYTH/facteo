'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { FormActions, PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { LoadingState, Panel } from '@/components/app/ui';
import {
  AUTOMATIC_REMINDER_STAGES,
  DEFAULT_REMINDER_TEMPLATES,
  REMINDER_PLACEHOLDERS_HELP,
  REMINDER_STAGE_LABELS,
  type ReminderStage,
} from '@/lib/domain/reminders/templates';
import {
  fetchReminderSettings,
  saveReminderSettings,
  type ReminderSettings,
} from '@/lib/domain/supabase/reminders';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';

const EDITABLE_STAGES: ReminderStage[] = [...AUTOMATIC_REMINDER_STAGES, 'manual'];

export default function ReminderSettingsPage() {
  const { activeCompany } = useTenant();
  const companyId = activeCompany?.id ?? '';
  const query = useQuery({
    queryKey: ['reminder-settings', companyId],
    queryFn: () => fetchReminderSettings(companyId),
    enabled: Boolean(companyId),
  });

  if (!companyId || query.isLoading || !query.data) {
    return <LoadingState />;
  }

  // La clé remet le formulaire à zéro quand on change d'entreprise.
  return <ReminderSettingsForm initial={query.data} key={companyId} companyId={companyId} />;
}

function ReminderSettingsForm({ initial, companyId }: { initial: ReminderSettings; companyId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<ReminderSettings>(initial);
  const [openStage, setOpenStage] = useState<ReminderStage | null>(null);

  const mutation = useMutation({
    mutationFn: () => saveReminderSettings(companyId, user?.id ?? '', settings),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reminder-settings', companyId] });
      void queryClient.invalidateQueries({ queryKey: ['invoice-next-reminder'] });
      showSuccess(settings.enabled ? 'Relances automatiques activées.' : 'Réglages des relances enregistrés.');
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
    <div className="mx-auto max-w-[720px] space-y-3 p-5 sm:p-6">
      <Panel>
        <label className="flex min-h-11 cursor-pointer items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-app-text">Relances automatiques des impayés</p>
            <p className="mt-1 text-[13px] text-app-muted">
              INVEQ relance vos clients par e-mail selon le calendrier ci-dessous. Les relances s’arrêtent dès que la
              facture est payée ; les factures annulées, en brouillon ou supprimées ne sont jamais relancées.
            </p>
          </div>
          <input
            checked={settings.enabled}
            className="mt-1 h-5 w-5 [accent-color:var(--app-accent)]"
            onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
            type="checkbox"
          />
        </label>
      </Panel>

      <Panel>
        <p className="mb-2 font-semibold text-app-text">Calendrier</p>
        <div className="space-y-2">
          {AUTOMATIC_REMINDER_STAGES.map((stage) => (
            <label key={stage} className="flex cursor-pointer items-center justify-between gap-4 text-[13.5px]">
              <span className={settings.enabled ? 'text-app-text' : 'text-app-muted'}>{REMINDER_STAGE_LABELS[stage]}</span>
              <input
                checked={settings.stages[stage]}
                className="h-[18px] w-[18px] [accent-color:var(--app-accent)]"
                onChange={(event) =>
                  setSettings({ ...settings, stages: { ...settings.stages, [stage]: event.target.checked } })
                }
                type="checkbox"
              />
            </label>
          ))}
          <label className="flex cursor-pointer items-center justify-between gap-4 border-t border-app-border-soft pt-2 text-[13.5px]">
            <span className="text-app-text">Ajouter le lien de paiement en ligne quand il existe</span>
            <input
              checked={settings.includePaymentLink}
              className="h-[18px] w-[18px] [accent-color:var(--app-accent)]"
              onChange={(event) => setSettings({ ...settings, includePaymentLink: event.target.checked })}
              type="checkbox"
            />
          </label>
        </div>
        <p className="mt-3 text-[12px] text-app-faint">
          Une facture échue depuis plus de 45 jours n’est plus relancée automatiquement. Chaque étape n’est envoyée
          qu’une fois. Vous pouvez aussi couper les relances d’une seule facture depuis sa fiche.
        </p>
      </Panel>

      <Panel>
        <p className="font-semibold text-app-text">Messages</p>
        <p className="mt-1 text-[12.5px] text-app-muted">{REMINDER_PLACEHOLDERS_HELP}</p>
        <div className="mt-3 divide-y divide-app-border-soft">
          {EDITABLE_STAGES.map((stage) => {
            const custom = template(stage);
            const isCustom = Boolean(custom.subject.trim() || custom.body.trim());
            const open = openStage === stage;
            return (
              <div key={stage} className="py-2.5">
                <button
                  className="flex w-full items-center justify-between gap-3 text-left text-[13.5px]"
                  onClick={() => setOpenStage(open ? null : stage)}
                  type="button">
                  <span className="text-app-text">{REMINDER_STAGE_LABELS[stage]}</span>
                  <span className="text-[12px] text-app-faint">{isCustom ? 'Personnalisé' : 'Message par défaut'}</span>
                </button>
                {open ? (
                  <div className="mt-2 space-y-2">
                    <input
                      className="w-full rounded-app-control border border-app-border px-3 py-2 text-[13.5px] text-app-text outline-none focus:border-app-accent"
                      maxLength={200}
                      onChange={(event) => setTemplate(stage, { subject: event.target.value })}
                      placeholder={DEFAULT_REMINDER_TEMPLATES[stage].subject}
                      value={custom.subject}
                    />
                    <textarea
                      className="w-full rounded-app-control border border-app-border px-3 py-2 text-[13.5px] text-app-text outline-none focus:border-app-accent"
                      maxLength={5000}
                      onChange={(event) => setTemplate(stage, { body: event.target.value })}
                      placeholder={DEFAULT_REMINDER_TEMPLATES[stage].body}
                      rows={8}
                      value={custom.body}
                    />
                    {isCustom ? (
                      <button
                        className="text-[12.5px] font-medium text-app-accent"
                        onClick={() => setTemplate(stage, { subject: '', body: '' })}
                        type="button">
                        Revenir au message par défaut
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>

      <FormActions>
        <SecondaryButton onClick={() => setSettings(initial)} type="button">
          Annuler
        </SecondaryButton>
        <PrimaryButton disabled={mutation.isPending} onClick={() => mutation.mutate()} type="button">
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </PrimaryButton>
      </FormActions>
    </div>
  );
}
