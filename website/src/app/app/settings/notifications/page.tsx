'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import { FormActions, PrimaryButton } from '@/components/app/form-fields';
import { Panel } from '@/components/app/ui';

type NotificationPrefs = {
  invoicePaid: boolean;
  invoiceOverdue: boolean;
  quoteAccepted: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
};

const STORAGE_KEY = 'facteo-notification-prefs';

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
  { key: 'productUpdates', label: 'Nouveautés FACTEO', description: 'Fonctionnalités et améliorations du produit.' },
];

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saved, setSaved] = useState(false);

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
  }

  return (
    <>
      <AppTopBar subtitle="E-mails, alertes et notifications" title="Notifications">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-2xl space-y-4">
          {PREF_ITEMS.map((item) => (
            <Panel key={item.key}>
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
                <input
                  checked={prefs[item.key]}
                  className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary/20"
                  onChange={() => toggle(item.key)}
                  type="checkbox"
                />
              </label>
            </Panel>
          ))}
          <FormActions>
            {saved ? <span className="text-sm text-emerald-600">Préférences enregistrées</span> : null}
            <PrimaryButton onClick={handleSave} type="button">
              Enregistrer
            </PrimaryButton>
          </FormActions>
        </div>
      </div>
    </>
  );
}
