'use client';

import { useEffect, useState } from 'react';

import { FormActions, PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { Panel } from '@/components/app/ui';
import { useToast } from '@/providers/toast-provider';

type NotificationPrefs = {
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  quoteAccepted: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
};

const STORAGE_KEY = 'INVEQ-notification-prefs';

const DEFAULT_PREFS: NotificationPrefs = {
  invoicePaid: true,
  invoiceOverdue: true,
  quoteAccepted: true,
  weeklyDigest: false,
  productUpdates: true,
};

const PREF_ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'invoicePaid', label: 'Facture payée', description: 'Recevoir une alerte quand un paiement est enregistré.' },
  { key: 'invoiceOverdue', label: 'Facture en retard', description: 'Être notifié des échéances dépassées.' },
  { key: 'quoteAccepted', label: 'Devis accepté', description: 'Alerte lorsqu’un client accepte un devis.' },
  { key: 'weeklyDigest', label: 'Résumé hebdomadaire', description: 'Synthèse de votre activité chaque lundi.' },
  { key: 'productUpdates', label: 'Nouveautés INVEQ', description: 'Fonctionnalités et améliorations du produit.' },
];

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);
  const { showSuccess } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    showSuccess('Préférences de notification enregistrées.');
  }

  function handleCancel() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setPrefs(raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS);
    } catch {
      setPrefs(DEFAULT_PREFS);
    }
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-3 p-5 sm:p-6">
      {PREF_ITEMS.map((item) => (
        <Panel key={item.key}>
          <label className="flex min-h-11 cursor-pointer items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-app-text">{item.label}</p>
              <p className="mt-1 text-[13px] text-app-muted">{item.description}</p>
            </div>
            <input
              checked={prefs[item.key]}
              className="mt-1 h-5 w-5 [accent-color:var(--app-accent)]"
              onChange={() => toggle(item.key)}
              type="checkbox"
            />
          </label>
        </Panel>
      ))}
      <FormActions>
        {saved ? (
          <span className="mr-auto text-[13px] text-app-success-text">Préférences enregistrées</span>
        ) : null}
        <SecondaryButton onClick={handleCancel} type="button">
          Annuler
        </SecondaryButton>
        <PrimaryButton onClick={handleSave} type="button">
          Enregistrer
        </PrimaryButton>
      </FormActions>
    </div>
  );
}
