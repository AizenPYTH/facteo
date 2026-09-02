'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Building2, FileText, Receipt, Search, UserPlus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { NoResultsState } from '@/components/app/empty-state';
import { Skeleton } from '@/components/app/skeleton';
import { StatusBadge } from '@/components/app/status-badge';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteClients } from '@/hooks/use-clients';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useInfiniteQuotes } from '@/hooks/use-quotes';
import { getClientDisplayName, getClientSecondaryLabel } from '@/lib/domain/clients/name';
import { formatCurrency } from '@/lib/domain/format/currency';
import { useCompany } from '@/providers/company-provider';

const MIN_QUERY_LENGTH = 2;
const RESULTS_PER_GROUP = 5;
const ease = [0.22, 1, 0.36, 1] as const;

type CommandPaletteContextValue = {
  isOpen: boolean;
  openPalette: () => void;
  closePalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  isOpen: false,
  openPalette: () => {},
  closePalette: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openPalette = useCallback(() => {
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
  }, []);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    trigger?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
      // Une saisie dans une modale ouverte garde ⌘K : ouvrir la palette lui volerait le focus.
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('[role="dialog"]')) return;
      event.preventDefault();
      triggerRef.current = active instanceof HTMLElement ? active : null;
      setIsOpen(true);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ isOpen, openPalette, closePalette }),
    [isOpen, openPalette, closePalette],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette onClose={closePalette} open={isOpen} />
    </CommandPaletteContext.Provider>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fermer la recherche"
            className="absolute inset-0 bg-[rgba(15,21,51,0.34)] backdrop-blur-[3px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            type="button"
          />
          <CommandPalettePanel onClose={onClose} reduceMotion={Boolean(reduceMotion)} />
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function CommandPalettePanel({
  onClose,
  reduceMotion,
}: {
  onClose: () => void;
  reduceMotion: boolean;
}) {
  const router = useRouter();
  const { companies, activeCompany, switchCompany } = useCompany();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const term = debounced.trim();

  const run = useCallback(
    (action: () => void) => {
      onClose();
      action();
    },
    [onClose],
  );

  const goTo = useCallback(
    (href: string) => {
      run(() => router.push(href));
    },
    [router, run],
  );

  const otherCompanies = companies.filter((company) => company.id !== activeCompany?.id);

  function moveFocus(direction: 1 | -1) {
    const root = panelRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-palette-item]'));
    if (items.length === 0) return;
    const current = items.findIndex((item) => item === document.activeElement);
    const next =
      current === -1
        ? direction === 1
          ? 0
          : items.length - 1
        : (current + direction + items.length) % items.length;
    items[next].focus();
    items[next].scrollIntoView({ block: 'nearest' });
  }

  function trapTab(event: React.KeyboardEvent<HTMLDivElement>) {
    const root = panelRef.current;
    if (!root) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>('input, button:not([disabled])'),
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocus(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocus(-1);
      return;
    }
    if (event.key === 'Tab') {
      trapTab(event);
      return;
    }
    if (event.key === 'Enter' && event.target === inputRef.current) {
      event.preventDefault();
      panelRef.current?.querySelector<HTMLElement>('[data-palette-item]')?.click();
      return;
    }
    if (
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      event.target !== inputRef.current
    ) {
      // La frappe reprend dans le champ même quand le focus est sur un résultat.
      event.preventDefault();
      setQuery((current) => current + event.key);
      inputRef.current?.focus();
    }
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0, scale: 1 }}
      aria-label="Recherche globale"
      aria-modal="true"
      className="relative w-[560px] max-w-[92vw] overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-app-float"
      exit={{ opacity: 0, y: 6, scale: 0.99 }}
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
      onKeyDown={handleKeyDown}
      ref={panelRef}
      role="dialog"
      transition={{ duration: reduceMotion ? 0 : 0.16, ease }}>
      <div className="flex items-center gap-2.5 border-b border-app-border-soft px-4 py-3.5">
        <Search className="shrink-0 text-app-faint" size={17} />
        <input
          aria-label="Rechercher un client, un devis, une facture"
          autoFocus
          className="min-w-0 flex-1 border-0 bg-transparent text-sm text-app-text outline-none placeholder:text-app-faint"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un client, un devis, une facture…"
          ref={inputRef}
          type="text"
          value={query}
        />
        <button
          className="shrink-0 rounded-md bg-app-border-soft px-[7px] py-[3px] text-[10.5px] font-semibold text-app-muted-2 transition-colors duration-150 hover:text-app-text-2"
          onClick={onClose}
          type="button">
          Échap
        </button>
      </div>

      <div className="sb max-h-[56vh] overflow-y-auto p-2">
        <PaletteSectionLabel>Actions</PaletteSectionLabel>
        <PaletteAction
          icon={FileText}
          label="Créer un devis"
          onSelect={() => goTo('/app/quotes?create=1')}
        />
        <PaletteAction
          icon={Receipt}
          label="Créer une facture"
          onSelect={() => goTo('/app/invoices?create=1')}
        />
        <PaletteAction
          icon={UserPlus}
          label="Ajouter un client"
          onSelect={() => goTo('/app/clients/new')}
        />
        {otherCompanies.length > 0 ? (
          otherCompanies.map((company) => (
            <PaletteAction
              icon={Building2}
              key={company.id}
              label={`Changer d’entreprise · ${company.name}`}
              onSelect={() => run(() => void switchCompany(company.id))}
            />
          ))
        ) : (
          <PaletteAction
            icon={Building2}
            label="Changer d’entreprise"
            onSelect={() => goTo('/app/companies')}
          />
        )}

        {term.length >= MIN_QUERY_LENGTH ? (
          <PaletteResults onSelect={goTo} term={term} />
        ) : (
          <p className="px-2.5 py-3 text-[12.5px] text-app-muted-2">
            Saisissez au moins {MIN_QUERY_LENGTH} caractères pour chercher un client, un devis ou
            une facture.
          </p>
        )}
      </div>
    </motion.div>
  );
}

function PaletteResults({
  term,
  onSelect,
}: {
  term: string;
  onSelect: (href: string) => void;
}) {
  const clientsQuery = useInfiniteClients(term);
  const quotesQuery = useInfiniteQuotes(term);
  const invoicesQuery = useInfiniteInvoices(term);

  const clients = (clientsQuery.data?.pages ?? [])
    .flatMap((page) => page.clients)
    .slice(0, RESULTS_PER_GROUP);
  const quotes = (quotesQuery.data?.pages ?? [])
    .flatMap((page) => page.quotes)
    .slice(0, RESULTS_PER_GROUP);
  const invoices = (invoicesQuery.data?.pages ?? [])
    .flatMap((page) => page.invoices)
    .slice(0, RESULTS_PER_GROUP);

  const loading =
    (clientsQuery.isFetching && !clientsQuery.data) ||
    (quotesQuery.isFetching && !quotesQuery.data) ||
    (invoicesQuery.isFetching && !invoicesQuery.data);

  if (loading) {
    return (
      <div className="space-y-2 px-2.5 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (clients.length === 0 && quotes.length === 0 && invoices.length === 0) {
    return (
      <NoResultsState
        className="mt-1 border-0 bg-transparent"
        description="Essayez un numéro de document, un nom de client ou un montant."
        query={term}
      />
    );
  }

  return (
    <>
      {clients.length > 0 ? (
        <>
          <PaletteSectionLabel>Clients</PaletteSectionLabel>
          {clients.map((client) => (
            <PaletteResultRow
              icon={Users}
              key={client.id}
              onSelect={() => onSelect(`/app/clients?selected=${client.id}`)}
              subtitle={getClientSecondaryLabel(client) ?? client.city ?? client.email ?? undefined}
              title={getClientDisplayName(client)}
            />
          ))}
        </>
      ) : null}

      {quotes.length > 0 ? (
        <>
          <PaletteSectionLabel>Devis</PaletteSectionLabel>
          {quotes.map((quote) => (
            <PaletteResultRow
              amount={formatCurrency(quote.totalTtc)}
              icon={FileText}
              key={quote.id}
              onSelect={() => onSelect(`/app/quotes?selected=${quote.id}`)}
              status={<StatusBadge kind="quote" status={quote.status} />}
              subtitle={quote.clientName}
              title={quote.number}
            />
          ))}
        </>
      ) : null}

      {invoices.length > 0 ? (
        <>
          <PaletteSectionLabel>Factures</PaletteSectionLabel>
          {invoices.map((invoice) => (
            <PaletteResultRow
              amount={formatCurrency(invoice.totalTtc)}
              icon={Receipt}
              key={invoice.id}
              onSelect={() => onSelect(`/app/invoices?selected=${invoice.id}`)}
              status={<StatusBadge kind="invoice" status={invoice.status} />}
              subtitle={invoice.clientName}
              title={invoice.number}
            />
          ))}
        </>
      ) : null}
    </>
  );
}

function PaletteSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-2.5 my-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-app-faint">
      {children}
    </p>
  );
}

const ROW_BASE =
  'flex w-full items-center gap-[11px] rounded-app-field px-2.5 py-[9px] text-left transition-colors duration-150 outline-none hover:bg-app-accent-soft focus-visible:bg-app-accent-soft focus:bg-app-accent-soft';

function PaletteAction({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button className={ROW_BASE} data-palette-item onClick={onSelect} type="button">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-app-icon bg-app-accent-tint text-app-accent">
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13.5px] text-app-text">{label}</span>
    </button>
  );
}

function PaletteResultRow({
  icon: Icon,
  title,
  subtitle,
  amount,
  status,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  amount?: string;
  status?: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <button className={ROW_BASE} data-palette-item onClick={onSelect} type="button">
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-app-icon bg-app-border-soft text-app-muted">
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-app-text">{title}</span>
        {subtitle ? (
          <span className="block truncate text-[11.5px] text-app-muted-2">{subtitle}</span>
        ) : null}
      </span>
      {status}
      {amount ? (
        <span className="app-num shrink-0 text-[12.5px] font-semibold text-app-text-2">
          {amount}
        </span>
      ) : null}
    </button>
  );
}
