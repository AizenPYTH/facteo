'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, FileText, Mic, RefreshCw, UserCheck, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import { Badge, DataTable, Panel, StatCard } from '@/components/app/ui';
import {
  ADMIN_PAGE_SIZE,
  fetchActivityOverview,
  fetchInvoiceHistory,
  fetchUserActivity,
  fetchUserEvents,
  type PeriodRange,
  type UserActivityRow,
} from '@/lib/domain/admin/activity';
import { cn } from '@/lib/utils';

// -----------------------------------------------------------------------------
// Libellés
// -----------------------------------------------------------------------------

const PLATFORM_LABELS: Record<string, string> = {
  web: 'Web',
  ios: 'iOS',
  android: 'Android',
  unknown: 'Inconnue',
};

const METHOD_LABELS: Record<string, string> = {
  manual: 'Manuelle',
  voice: 'Vocale',
  quote_conversion: 'Conversion de devis',
  ai_import: 'Import IA (photo)',
  duplicate: 'Duplication',
  unknown: 'Inconnue',
};

const EVENT_LABELS: Record<string, string> = {
  session_active: 'Présence (jour)',
  invoice_created: 'Facture créée',
  invoice_creation_method: 'Méthode de création',
  voice_invoice_started: 'Dictée commencée',
  voice_invoice_transcription_completed: 'Transcription terminée',
  voice_invoice_draft_generated: 'Brouillon vocal généré',
  voice_invoice_saved: 'Facture vocale enregistrée',
  voice_invoice_failed: 'Dictée échouée',
};

const ERROR_LABELS: Record<string, string> = {
  microphone_denied: 'Micro refusé',
  microphone_unsupported: 'Micro non pris en charge',
  recording_too_short: 'Enregistrement trop court',
  recording_start_failed: 'Enregistrement impossible',
  recording_failed: 'Enregistrement interrompu',
  cancelled: 'Annulée par l’utilisateur',
  request_failed: 'Requête échouée (réseau)',
  plan_required: 'Offre sans assistant IA',
  ai_not_configured: 'IA non configurée',
  invalid_audio: 'Audio invalide',
  transcription_failed: 'Transcription échouée',
  analysis_failed: 'Analyse échouée',
  openai_timeout: 'Délai IA dépassé',
  no_items: 'Aucune ligne comprise',
  server_error: 'Erreur serveur',
  unknown: 'Inconnue',
};

const label = (labels: Record<string, string>, key: string | null | undefined) =>
  key ? (labels[key] ?? key) : '—';

type PeriodId = '24h' | '7d' | '30d' | '90d' | 'all';

const PERIODS: { id: PeriodId; label: string; hours: number | null }[] = [
  { id: '24h', label: '24 h', hours: 24 },
  { id: '7d', label: '7 jours', hours: 24 * 7 },
  { id: '30d', label: '30 jours', hours: 24 * 30 },
  { id: '90d', label: '90 jours', hours: 24 * 90 },
  { id: 'all', label: 'Tout', hours: null },
];

/** Bornes arrondies à la minute : la clé de cache reste stable pendant la saisie. */
function periodRange(period: PeriodId): PeriodRange {
  const hours = PERIODS.find((entry) => entry.id === period)?.hours ?? null;
  if (hours === null) return { from: null, to: null };
  const now = Math.floor(Date.now() / 60_000) * 60_000;
  return { from: new Date(now - hours * 3_600_000).toISOString(), to: null };
}

const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Europe/Paris',
});

function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFormat.format(new Date(value)) : '—';
}

const numberFormat = new Intl.NumberFormat('fr-FR');
const formatCount = (value: number | null | undefined) => numberFormat.format(Number(value ?? 0));

// -----------------------------------------------------------------------------
// Petits composants
// -----------------------------------------------------------------------------

function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div aria-label={ariaLabel} className="inline-flex flex-wrap gap-1 rounded-app-field bg-app-subtle p-1" role="group">
      {options.map((option) => (
        <button
          aria-pressed={option.id === value}
          className={cn(
            'h-7 rounded-[7px] px-2.5 text-[12.5px] font-semibold transition-colors duration-150',
            option.id === value
              ? 'bg-app-surface text-app-text shadow-sm'
              : 'text-app-muted hover:text-app-text',
          )}
          key={option.id}
          onClick={() => onChange(option.id)}
          type="button">
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-8 rounded-app-field border border-app-border bg-app-surface px-2 text-[12.5px] text-app-text"
      onChange={(event) => onChange(event.target.value)}
      value={value}>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function BreakdownList({ data, labels, total }: { data: Record<string, number> | null; labels: Record<string, string>; total: number }) {
  const entries = Object.entries(data ?? {}).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <p className="text-[13px] text-app-muted">Aucune donnée.</p>;
  return (
    <ul className="space-y-2.5">
      {entries.map(([key, value]) => {
        const share = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <li key={key}>
            <div className="flex items-center justify-between text-[13px]">
              <span className={cn('font-medium', key === 'unknown' ? 'text-app-muted' : 'text-app-text')}>
                {label(labels, key)}
              </span>
              <span className="app-num font-semibold text-app-text">
                {formatCount(value)} <span className="font-normal text-app-muted">· {share} %</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-app-border-soft">
              <div
                className={cn('h-full rounded-full', key === 'unknown' ? 'bg-app-muted-2' : 'bg-app-accent')}
                style={{ width: `${share}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ErrorBox({ error }: { error: unknown }) {
  return (
    <p className="rounded-[10px] bg-app-danger-tint px-3 py-2 text-[13px] font-semibold text-app-danger" role="alert">
      {error instanceof Error ? error.message : 'Chargement impossible.'}
    </p>
  );
}

function UserButton({ email, userId, onOpen }: { email: string | null; userId: string; onOpen: (userId: string) => void }) {
  return (
    <button
      className="max-w-[260px] truncate text-left font-medium text-app-accent hover:underline"
      onClick={(event) => {
        event.stopPropagation();
        onOpen(userId);
      }}
      title="Voir l’activité de cet utilisateur"
      type="button">
      {email ?? userId.slice(0, 8)}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Historique des factures
// -----------------------------------------------------------------------------

function InvoiceHistory({ onOpenUser, userId }: { onOpenUser: (userId: string) => void; userId?: string }) {
  const [period, setPeriod] = useState<PeriodId>(userId ? 'all' : '30d');
  const [platform, setPlatform] = useState('all');
  const [method, setMethod] = useState('all');
  const [page, setPage] = useState(0);
  const range = useMemo(() => periodRange(period), [period]);

  const query = useQuery({
    queryKey: ['admin', 'invoice-history', userId ?? null, range, platform, method, page],
    queryFn: () =>
      fetchInvoiceHistory({
        page,
        range,
        platform: platform === 'all' ? null : platform,
        method: method === 'all' ? null : method,
        userId: userId ?? null,
      }),
  });

  const rows = query.data ?? [];
  const total = rows[0]?.total_count ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const reset = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented ariaLabel="Période" onChange={reset(setPeriod)} options={PERIODS} value={period} />
        <Select
          ariaLabel="Plateforme"
          onChange={reset(setPlatform)}
          options={[{ id: 'all', label: 'Toutes plateformes' }, ...Object.entries(PLATFORM_LABELS).map(([id, text]) => ({ id, label: text }))]}
          value={platform}
        />
        <Select
          ariaLabel="Méthode de création"
          onChange={reset(setMethod)}
          options={[{ id: 'all', label: 'Toutes méthodes' }, ...Object.entries(METHOD_LABELS).map(([id, text]) => ({ id, label: text }))]}
          value={method}
        />
        <span className="ml-auto text-[12.5px] text-app-muted">
          {formatCount(total)} facture{total > 1 ? 's' : ''}
        </span>
      </div>

      {query.error ? <ErrorBox error={query.error} /> : null}

      <DataTable
        columns={[
          { key: 'created', label: 'Créée le' },
          ...(userId ? [] : [{ key: 'user', label: 'Utilisateur' }]),
          { key: 'number', label: 'Facture' },
          { key: 'platform', label: 'Plateforme' },
          { key: 'method', label: 'Méthode' },
        ]}
        emptyMessage={query.isLoading ? 'Chargement…' : 'Aucune facture sur cette période.'}
        rows={rows.map((row) => ({
          id: row.invoice_id,
          created: <span className="app-num whitespace-nowrap">{formatDateTime(row.created_at)}</span>,
          user: <UserButton email={row.user_email} onOpen={onOpenUser} userId={row.user_id} />,
          number: (
            <span className="flex items-center gap-2">
              <span className="font-medium text-app-text">{row.invoice_number}</span>
              <span className="hidden font-mono text-[11px] text-app-muted-2 xl:inline" title={row.invoice_id}>
                {row.invoice_id.slice(0, 8)}
              </span>
              {row.deleted ? <Badge variant="danger">Supprimée</Badge> : null}
            </span>
          ),
          platform: (
            <span className={cn(row.platform === 'unknown' && 'text-app-muted')}>{label(PLATFORM_LABELS, row.platform)}</span>
          ),
          method:
            row.creation_method === 'voice' ? (
              <Badge variant="info">Vocale</Badge>
            ) : (
              <span className={cn(row.creation_method === 'unknown' && 'text-app-muted')}>
                {label(METHOD_LABELS, row.creation_method)}
              </span>
            ),
        }))}
      />

      {pages > 1 ? (
        <div className="flex items-center justify-end gap-2 text-[12.5px]">
          <button
            className="h-8 rounded-app-field border border-app-border px-3 font-semibold disabled:opacity-40"
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            type="button">
            Précédent
          </button>
          <span className="text-app-muted">
            Page {page + 1} / {pages}
          </span>
          <button
            className="h-8 rounded-app-field border border-app-border px-3 font-semibold disabled:opacity-40"
            disabled={page + 1 >= pages}
            onClick={() => setPage((value) => value + 1)}
            type="button">
            Suivant
          </button>
        </div>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Activité d'un utilisateur
// -----------------------------------------------------------------------------

function UserDetail({ user, onClose }: { user: UserActivityRow; onClose: () => void }) {
  const [period, setPeriod] = useState<PeriodId>('30d');
  const [event, setEvent] = useState('all');
  const range = useMemo(() => periodRange(period), [period]);
  const userId = user.user_id;

  const events = useQuery({
    queryKey: ['admin', 'user-events', userId, range, event],
    queryFn: () => fetchUserEvents(userId, range, event === 'all' ? null : event),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold text-app-text">{user.user_email ?? user.user_id}</p>
          <p className="font-mono text-[11.5px] text-app-muted-2">{user.user_id}</p>
        </div>
        <button
          aria-label="Fermer"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-app-field text-app-muted hover:bg-app-hover"
          onClick={onClose}
          type="button">
          <X size={16} />
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-4">
        {[
          ['Inscription', formatDateTime(user.signed_up_at)],
          ['Dernière activité connue', formatDateTime(user.last_activity_at)],
          ['Factures (total)', formatCount(user.invoices_total)],
          ['Dernière facture', formatDateTime(user.last_invoice_at)],
          ['Créations vocales réussies', formatCount(user.voice_saved)],
          ['Tentatives vocales échouées', formatCount(user.voice_failed)],
          ['Dernière utilisation vocale', formatDateTime(user.last_voice_at)],
          ['Plateformes', user.platforms.length > 0 ? user.platforms.map((p) => label(PLATFORM_LABELS, p)).join(', ') : 'Inconnue'],
        ].map(([term, value]) => (
          <div key={term}>
            <dt className="text-[11.5px] font-semibold text-app-muted">{term}</dt>
            <dd className="app-num mt-0.5 font-medium text-app-text">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] text-app-muted">
        Compteurs vocaux sur la période choisie dans la liste des utilisateurs.
      </p>

      <Panel bodyClassName="space-y-3" title="Journal d’événements">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented ariaLabel="Période" onChange={setPeriod} options={PERIODS} value={period} />
          <Select
            ariaLabel="Type d’événement"
            onChange={setEvent}
            options={[{ id: 'all', label: 'Tous les événements' }, ...Object.entries(EVENT_LABELS).map(([id, text]) => ({ id, label: text }))]}
            value={event}
          />
        </div>
        {events.error ? <ErrorBox error={events.error} /> : null}
        <DataTable
          className="max-h-[420px]"
          columns={[
            { key: 'at', label: 'Date' },
            { key: 'event', label: 'Événement' },
            { key: 'platform', label: 'Plateforme' },
            { key: 'detail', label: 'Détail' },
          ]}
          emptyMessage={
            events.isLoading
              ? 'Chargement…'
              : 'Aucun événement sur cette période (le suivi détaillé commence au déploiement).'
          }
          rows={(events.data ?? []).map((row, index) => ({
            id: `${row.occurred_at}-${row.event_name}-${index}`,
            at: <span className="app-num whitespace-nowrap">{formatDateTime(row.occurred_at)}</span>,
            event: label(EVENT_LABELS, row.event_name),
            platform: label(PLATFORM_LABELS, row.platform),
            detail: (
              <span className="text-[12.5px] text-app-muted">
                {[
                  row.invoice_number ? `Facture ${row.invoice_number}` : null,
                  row.creation_method ? label(METHOD_LABELS, row.creation_method) : null,
                  row.error_code ? label(ERROR_LABELS, row.error_code) : null,
                  row.attempt_id ? `Tentative ${row.attempt_id.slice(0, 8)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </span>
            ),
          }))}
        />
      </Panel>

      <Panel title="Factures de l’utilisateur">
        <InvoiceHistory onOpenUser={() => undefined} userId={user.user_id} />
      </Panel>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export function ActivityDashboard() {
  const [usersPeriod, setUsersPeriod] = useState<PeriodId>('30d');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const usersRange = useMemo(() => periodRange(usersPeriod), [usersPeriod]);

  const overview = useQuery({ queryKey: ['admin', 'overview'], queryFn: fetchActivityOverview });
  const users = useQuery({
    queryKey: ['admin', 'user-activity', usersRange],
    queryFn: () => fetchUserActivity(usersRange),
  });

  const data = overview.data;
  const selectedUser = users.data?.find((row) => row.user_id === selectedUserId) ?? null;

  function openUser(userId: string) {
    setSelectedUserId(userId);
    requestAnimationFrame(() =>
      document.getElementById('admin-user-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  const voice = data?.voice_totals ?? {};
  const voice30 = data?.voice_30d ?? {};

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppTopBar
        subtitle="Données réelles de production · accès réservé aux administrateurs"
        title="Activité utilisateurs">
        <button
          className="flex h-9 items-center gap-2 rounded-app-control border border-app-border px-3 text-[13px] font-semibold text-app-text-2 hover:bg-app-hover"
          onClick={() => {
            void overview.refetch();
            void users.refetch();
          }}
          type="button">
          <RefreshCw className={cn(overview.isFetching && 'animate-spin')} size={15} />
          Actualiser
        </button>
      </AppTopBar>

      <div className="sb min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        {overview.error ? <ErrorBox error={overview.error} /> : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Utilisateurs inscrits"
            trend={`${formatCount(data?.users_with_invoice)} avec au moins une facture`}
            value={data ? formatCount(data.registered_users) : '…'}
          />
          <StatCard
            accent="success"
            icon={UserCheck}
            label="Utilisateurs actifs · 24 h"
            trend={`7 j : ${formatCount(data?.active_users_7d)} · 30 j : ${formatCount(data?.active_users_30d)}`}
            value={data ? formatCount(data.active_users_24h) : '…'}
          />
          <StatCard
            accent="info"
            icon={FileText}
            label="Factures aujourd’hui"
            trend={`7 j : ${formatCount(data?.invoices_7d)} · 30 j : ${formatCount(data?.invoices_30d)} · total : ${formatCount(data?.invoices_total)}`}
            value={data ? formatCount(data.invoices_today) : '…'}
          />
          <StatCard
            accent="warning"
            icon={Mic}
            label="Utilisateurs · création vocale"
            trend={`${formatCount(data?.voice_users_tried)} ont essayé la dictée`}
            value={data ? formatCount(data.voice_users_saved) : '…'}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Panel title="Dernière facture créée">
            {data?.last_invoice ? (
              <div className="space-y-1.5 text-[13px]">
                <p className="app-num text-[20px] font-semibold text-app-text">
                  {formatDateTime(data.last_invoice.created_at)}
                </p>
                <p className="text-app-text-2">
                  {data.last_invoice.number}{' '}
                  <span className="font-mono text-[11.5px] text-app-muted-2">{data.last_invoice.id}</span>
                </p>
                <UserButton
                  email={data.last_invoice.email}
                  onOpen={openUser}
                  userId={data.last_invoice.user_id}
                />
              </div>
            ) : (
              <p className="text-[13px] text-app-muted">{data ? 'Aucune facture.' : 'Chargement…'}</p>
            )}
          </Panel>
          <Panel title="Factures par plateforme">
            <BreakdownList data={data?.invoices_by_platform ?? null} labels={PLATFORM_LABELS} total={data?.invoices_total ?? 0} />
          </Panel>
          <Panel title="Factures par méthode de création">
            <BreakdownList data={data?.invoices_by_method ?? null} labels={METHOD_LABELS} total={data?.invoices_total ?? 0} />
          </Panel>
        </div>
        <p className="text-[12px] leading-relaxed text-app-muted">
          « Inconnue » : facture créée avant le suivi
          {data?.tracking_since ? ` (actif depuis le ${formatDateTime(data.tracking_since)})` : ' (pas encore actif)'},
          ou depuis une ancienne version de l’app. La méthode vocale n’est jamais déduite : elle n’est
          comptée que lorsque le serveur a confirmé la dictée et que la facture a été enregistrée. Un
          utilisateur est « actif » s’il s’est connecté, a utilisé l’app ou a créé une facture sur la
          période.
        </p>

        <Panel title="Création vocale">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-[12px] font-semibold text-app-muted">Entonnoir (total · 30 derniers jours)</p>
              <ul className="space-y-1.5 text-[13px]">
                {[
                  'voice_invoice_started',
                  'voice_invoice_transcription_completed',
                  'voice_invoice_draft_generated',
                  'voice_invoice_saved',
                  'voice_invoice_failed',
                ].map((key) => (
                  <li className="flex items-center justify-between gap-3" key={key}>
                    <span className="text-app-text-2">{EVENT_LABELS[key]}</span>
                    <span className="app-num font-semibold text-app-text">
                      {formatCount(voice[key])} <span className="font-normal text-app-muted">· {formatCount(voice30[key])}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[12px] font-semibold text-app-muted">Causes d’échec (30 derniers jours)</p>
              {data && data.voice_errors_30d.length > 0 ? (
                <ul className="space-y-1.5 text-[13px]">
                  {data.voice_errors_30d.map((entry) => (
                    <li className="flex items-center justify-between gap-3" key={entry.error_code}>
                      <span className="text-app-text-2">
                        {label(ERROR_LABELS, entry.error_code)}{' '}
                        <span className="font-mono text-[11px] text-app-muted-2">{entry.error_code}</span>
                      </span>
                      <span className="app-num font-semibold text-app-text">{formatCount(entry.total)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-app-muted">Aucun échec enregistré.</p>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Historique des factures">
          <InvoiceHistory onOpenUser={openUser} />
        </Panel>

        <Panel bodyClassName="space-y-3" title="Utilisateurs">
          <Segmented ariaLabel="Période" onChange={setUsersPeriod} options={PERIODS} value={usersPeriod} />
          {users.error ? <ErrorBox error={users.error} /> : null}
          <DataTable
            activeRowId={selectedUserId}
            className="max-h-[520px]"
            columns={[
              { key: 'user', label: 'Utilisateur' },
              { key: 'signup', label: 'Inscription' },
              { key: 'last', label: 'Dernière activité' },
              { key: 'invoices', label: 'Factures (période / total)', align: 'right' },
              { key: 'voice', label: 'Vocal ✓ / ✗', align: 'right' },
              { key: 'platforms', label: 'Plateformes' },
            ]}
            emptyMessage={users.isLoading ? 'Chargement…' : 'Aucun utilisateur.'}
            onRowClick={(row) => openUser(String(row.id))}
            rows={(users.data ?? []).map((row) => ({
              id: row.user_id,
              user: <UserButton email={row.user_email} onOpen={openUser} userId={row.user_id} />,
              signup: <span className="app-num whitespace-nowrap">{formatDateTime(row.signed_up_at)}</span>,
              last: <span className="app-num whitespace-nowrap">{formatDateTime(row.last_activity_at)}</span>,
              invoices: `${formatCount(row.invoices_in_period)} / ${formatCount(row.invoices_total)}`,
              voice: `${formatCount(row.voice_saved)} / ${formatCount(row.voice_failed)}`,
              platforms:
                row.platforms.length > 0 ? row.platforms.map((p) => label(PLATFORM_LABELS, p)).join(', ') : '—',
            }))}
          />
        </Panel>

        {selectedUserId ? (
          <div id="admin-user-detail">
            <Panel>
              {selectedUser ? (
                <UserDetail
                  key={selectedUserId}
                  onClose={() => setSelectedUserId(null)}
                  user={selectedUser}
                />
              ) : (
                <p className="flex items-center gap-2 text-[13px] text-app-muted">
                  <Activity size={15} /> Chargement de l’utilisateur…
                </p>
              )}
            </Panel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
