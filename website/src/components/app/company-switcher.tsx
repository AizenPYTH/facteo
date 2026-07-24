'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { AppDialog } from '@/components/app/app-dialog';
import { PrimaryButton, SecondaryButton, TextInput } from '@/components/app/form-fields';
import { useCompany } from '@/providers/company-provider';
import { cn } from '@/lib/utils';

export function CompanySwitcher() {
  const { activeCompany, companies, switchCompany, createNewCompany, loading } = useCompany();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Indiquez un nom d’entreprise.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createNewCompany({ name: trimmed });
      setName('');
      setCreateOpen(false);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer l’entreprise.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mt-4 h-11 animate-pulse rounded-xl bg-slate-100" />;
  }

  return (
    <>
      <div className="relative mt-4" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className="flex w-full items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-left text-sm font-medium text-slate-800 outline-none transition hover:border-slate-300 hover:bg-white focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          onClick={() => setOpen((v) => !v)}
          type="button">
          <Building2 className="shrink-0 text-slate-400" size={16} />
          <span className="min-w-0 flex-1 truncate">
            {activeCompany?.name ?? 'Choisir une entreprise'}
          </span>
          <ChevronDown
            className={cn(
              'shrink-0 text-slate-400 transition duration-200',
              open && 'rotate-180',
            )}
            size={16}
          />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)]"
              exit={{ opacity: 0, y: -4 }}
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              role="listbox"
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}>
              <ul className="max-h-56 overflow-y-auto py-1">
                {companies.map((company) => {
                  const active = company.id === activeCompany?.id;
                  return (
                    <li key={company.id}>
                      <button
                        className={cn(
                          'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition duration-150',
                          active
                            ? 'bg-blue-50/90 font-semibold text-primary'
                            : 'text-slate-700 hover:bg-slate-50',
                        )}
                        onClick={() => {
                          void switchCompany(company.id);
                          setOpen(false);
                        }}
                        role="option"
                        type="button">
                        <span className="min-w-0 flex-1 truncate">{company.name}</span>
                        {active ? <Check className="shrink-0" size={14} /> : null}
                      </button>
                    </li>
                  );
                })}
                {companies.length === 0 ? (
                  <li className="px-3 py-3 text-sm text-slate-500">Aucune entreprise</li>
                ) : null}
              </ul>
              <div className="border-t border-slate-100 p-1.5">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm font-semibold text-primary transition duration-150 hover:bg-blue-50"
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                  type="button">
                  <Plus size={16} strokeWidth={2.25} />
                  Créer une entreprise
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AppDialog
        description="Ajoutez un nouvel espace de travail."
        onClose={() => {
          if (!saving) {
            setCreateOpen(false);
            setError(null);
            setName('');
          }
        }}
        open={createOpen}
        size="sm"
        title="Nouvelle entreprise">
        <form className="space-y-4 p-5" onSubmit={(e) => void handleCreate(e)}>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-slate-700" htmlFor="company-name">
              Nom de l’entreprise
            </label>
            <TextInput
              autoFocus
              id="company-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Atelier Nord"
              value={name}
            />
            {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton
              disabled={saving}
              onClick={() => {
                setCreateOpen(false);
                setError(null);
                setName('');
              }}
              type="button">
              Annuler
            </SecondaryButton>
            <PrimaryButton loading={saving} type="submit">
              Créer
            </PrimaryButton>
          </div>
        </form>
      </AppDialog>
    </>
  );
}
