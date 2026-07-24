'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, Plus, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AppDialog } from '@/components/app/app-dialog';
import { ClientForm } from '@/components/app/client-form';
import { getClientDisplayName } from '@/lib/domain/clients/name';
import { createClient } from '@/lib/domain/supabase/clients';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import type { Client } from '@/types/client';
import type { ClientFormValues } from '@/types/client';
import { cn } from '@/lib/utils';

function clientLabel(client: Client): string {
  return (
    client.company ||
    getClientDisplayName(client) ||
    `${client.firstName} ${client.lastName}`.trim() ||
    client.lastName
  );
}

export function ClientPicker({
  clients,
  value,
  onChange,
  error,
  loading,
}: {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  error?: boolean;
  loading?: boolean;
}) {
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => clients.find((c) => c.id === value) ?? null,
    [clients, value],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => clientLabel(c).toLowerCase().includes(q));
  }, [clients, search]);

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

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (values: ClientFormValues) => createClient(requireScope(scope), values),
    onSuccess: (client) => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      onChange(client.id);
      setCreateOpen(false);
    },
  });

  return (
    <>
      <div className="relative" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'flex w-full items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm outline-none transition duration-150 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20',
            error
              ? 'border-red-300 ring-2 ring-red-100'
              : 'border-slate-200/90',
            !selected && 'text-slate-400',
          )}
          onClick={() => setOpen((v) => !v)}
          type="button">
          <span className="min-w-0 flex-1 truncate text-slate-900">
            {selected ? clientLabel(selected) : '— Choisir un client —'}
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
              {clients.length > 4 ? (
                <div className="border-b border-slate-100 p-2">
                  <input
                    autoFocus
                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    type="search"
                    value={search}
                  />
                </div>
              ) : null}

              <ul className="max-h-52 overflow-y-auto py-1">
                {loading ? (
                  <li className="px-3 py-3 text-sm text-slate-500">Chargement…</li>
                ) : filtered.length === 0 && clients.length > 0 ? (
                  <li className="px-3 py-3 text-sm text-slate-500">Aucun résultat</li>
                ) : clients.length === 0 ? (
                  <li className="px-3 py-4 text-center">
                    <UserPlus className="mx-auto text-slate-300" size={22} />
                    <p className="mt-2 text-sm font-medium text-slate-700">Aucun client</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Créez-en un pour continuer.
                    </p>
                  </li>
                ) : (
                  filtered.map((client) => {
                    const active = client.id === value;
                    return (
                      <li key={client.id}>
                        <button
                          className={cn(
                            'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition duration-150',
                            active
                              ? 'bg-blue-50/90 font-semibold text-primary'
                              : 'text-slate-700 hover:bg-slate-50',
                          )}
                          onClick={() => {
                            onChange(client.id);
                            setOpen(false);
                          }}
                          role="option"
                          type="button">
                          <span className="min-w-0 flex-1 truncate">{clientLabel(client)}</span>
                          {active ? <Check className="shrink-0" size={14} /> : null}
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>

              <div
                className={cn(
                  'border-t border-slate-100 p-1.5',
                  clients.length === 0 && 'bg-blue-50/40 p-2',
                )}>
                <button
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition duration-150',
                    clients.length === 0
                      ? 'bg-primary text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] hover:bg-primary-dark'
                      : 'text-primary hover:bg-blue-50',
                  )}
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                  type="button">
                  <Plus size={16} strokeWidth={2.25} />
                  Créer un client
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AppDialog
        description="Le nouveau client sera sélectionné automatiquement."
        onClose={() => {
          if (!createMutation.isPending) setCreateOpen(false);
        }}
        open={createOpen}
        size="lg"
        title="Nouveau client">
        <div className="p-5">
          <ClientForm
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (values) => {
              await createMutation.mutateAsync(values);
            }}
            submitLabel="Créer le client"
          />
        </div>
      </AppDialog>
    </>
  );
}
