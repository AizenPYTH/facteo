'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Camera,
  Check,
  FileSpreadsheet,
  Sparkles,
  Table,
  Upload,
  Users,
  Wrench,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import {
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from '@/components/app/form-fields';
import { Badge } from '@/components/app/ui';
import { analyzeProductImage } from '@/lib/domain/ai/product-image-analysis';
import {
  SPREADSHEET_TEMPLATES,
  SpreadsheetTemplateMismatchError,
  downloadSpreadsheetTemplate,
  fileToBase64,
  isDuplicateReferenceError,
  mapAnalysisToFormValues,
  readCatalogSpreadsheet,
  type SpreadsheetTemplateId,
} from '@/lib/domain/catalog/spreadsheet-import';
import { formatCurrency } from '@/lib/domain/format/currency';
import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';
import {
  createProduct,
  fetchProducts,
  updateProduct,
} from '@/lib/domain/supabase/products';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import type { ProductFormValues, ProductType } from '@/types/product';

/** Étapes de l'import tableur, dans l'ordre imposé par le handoff v2 (§6). */
type ImportStep = 'template' | 'upload' | 'review' | 'saved';

type ImportSource = 'image' | 'spreadsheet';

type RecentImportStatus = 'saved' | 'review' | 'rejected';

type RecentImport = {
  id: string;
  source: ImportSource;
  label: string;
  meta: string;
  status: RecentImportStatus;
  rows?: ProductFormValues[];
  targetType?: ProductType;
};

const RECENT_STATUS: Record<
  RecentImportStatus,
  { label: string; variant: 'success' | 'warning' | 'danger'; action: string }
> = {
  saved: { label: 'Enregistré', variant: 'success', action: 'Voir' },
  review: { label: 'À vérifier', variant: 'warning', action: 'Vérifier' },
  rejected: { label: 'Refusé — colonnes hors modèle INVEQ', variant: 'danger', action: 'Modèle' },
};

const TEMPLATE_ORDER: SpreadsheetTemplateId[] = ['products', 'prestations', 'clients'];

const DROP_ZONE =
  'flex flex-col items-center justify-center gap-2 rounded-app-control border border-dashed border-app-accent-border bg-[#fbfaff] px-4 py-6 text-center transition-colors duration-150';

function nextId() {
  return Math.random().toString(36).slice(2, 10);
}

function rowAmount(row: ProductFormValues) {
  const parsed = Number.parseFloat(row.unitPrice.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function ToolCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Camera;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-app-card border border-app-border bg-app-surface p-[18px]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-app-control bg-app-accent-tint text-app-accent">
          <Icon size={19} strokeWidth={1.75} />
        </span>
        <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-app-text">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DropZone({
  caption,
  disabled,
  onFiles,
  multiple = true,
}: {
  caption: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
}) {
  const [over, setOver] = useState(false);

  return (
    <div
      className={cn(DROP_ZONE, over && 'bg-app-accent-tint', disabled && 'opacity-60')}
      onDragLeave={() => setOver(false)}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        if (disabled) return;
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
      }}>
      <Upload className="text-app-accent" size={18} strokeWidth={1.75} />
      <p className="font-mono text-[11px] leading-relaxed text-app-muted-2">{caption}</p>
    </div>
  );
}

function ReviewTable({
  rows,
  onChange,
  excluded,
  onToggle,
}: {
  rows: ProductFormValues[];
  onChange: (index: number, patch: Partial<ProductFormValues>) => void;
  excluded: number[];
  onToggle: (index: number) => void;
}) {
  return (
    <div className="sb overflow-x-auto rounded-app-card border border-app-border bg-app-surface">
      <table className="w-full min-w-[760px] border-collapse text-left text-[13px] text-app-text">
        <thead>
          <tr>
            {['', 'Désignation', 'Référence', 'Prix HT', 'TVA', 'Unité'].map((label, index) => (
              <th
                className={cn(
                  'border-b border-app-border bg-app-subtle px-3 py-[9px] text-[11px] font-bold uppercase tracking-[0.07em] text-app-muted-2 first:pl-6 last:pr-6',
                  (index === 3 || index === 4) && 'text-right',
                )}
                key={label || 'select'}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const off = excluded.includes(index);
            return (
              <tr className={cn('border-b border-app-border-soft', off && 'opacity-45')} key={index}>
                <td className="py-[9px] pl-6">
                  <input
                    aria-label="Inclure cette ligne"
                    checked={!off}
                    className="h-[15px] w-[15px] [accent-color:var(--app-accent)]"
                    onChange={() => onToggle(index)}
                    type="checkbox"
                  />
                </td>
                <td className="px-3 py-[7px]">
                  <TextInput
                    onChange={(event) => onChange(index, { name: event.target.value })}
                    value={row.name}
                  />
                </td>
                <td className="px-3 py-[7px]">
                  <TextInput
                    onChange={(event) => onChange(index, { reference: event.target.value })}
                    value={row.reference}
                  />
                </td>
                <td className="px-3 py-[7px]">
                  <TextInput
                    className="app-num text-right"
                    inputMode="decimal"
                    onChange={(event) => onChange(index, { unitPrice: event.target.value })}
                    value={row.unitPrice}
                  />
                </td>
                <td className="px-3 py-[7px]">
                  <TextInput
                    className="app-num text-right"
                    inputMode="decimal"
                    onChange={(event) => onChange(index, { vatRate: event.target.value })}
                    value={row.vatRate}
                  />
                </td>
                <td className="px-3 py-[7px] pr-6">
                  <TextInput
                    onChange={(event) => onChange(index, { unit: event.target.value })}
                    value={row.unit}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AiToolsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { scope } = useTenant();
  const { showError, showSuccess } = useToast();

  const imageInputRef = useRef<HTMLInputElement>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement>(null);
  const imageButtonRef = useRef<HTMLButtonElement>(null);
  const spreadsheetButtonRef = useRef<HTMLButtonElement>(null);

  const [step, setStep] = useState<ImportStep>('template');
  const [source, setSource] = useState<ImportSource>('spreadsheet');
  const [rows, setRows] = useState<ProductFormValues[]>([]);
  const [excluded, setExcluded] = useState<number[]>([]);
  const [targetType, setTargetType] = useState<ProductType>('product');
  const [overwriteByReference, setOverwriteByReference] = useState(false);
  const [fileLabel, setFileLabel] = useState('');
  const [busy, setBusy] = useState<ImportSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentImport[]>([]);

  const tool = searchParams.get('tool');

  const resetFlow = useCallback(() => {
    setStep('template');
    setRows([]);
    setExcluded([]);
    setFileLabel('');
    setError(null);
  }, []);

  const pushRecent = useCallback((entry: Omit<RecentImport, 'id'>) => {
    setRecent((previous) => [{ ...entry, id: nextId() }, ...previous].slice(0, 8));
  }, []);

  const openReview = useCallback(
    (imported: ProductFormValues[], from: ImportSource, label: string) => {
      setSource(from);
      setRows(imported);
      setExcluded([]);
      setFileLabel(label);
      setStep('review');
    },
    [],
  );

  const handleImageFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setSource('image');
      setError(null);
      setBusy('image');
      try {
        const aggregated: ProductFormValues[] = [];
        for (const file of files) {
          const base64 = await fileToBase64(file);
          const analysis = await analyzeProductImage({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          });
          const candidates =
            Array.isArray(analysis.products) && analysis.products.length > 0
              ? analysis.products
              : [analysis];
          for (const candidate of candidates) {
            const mapped = mapAnalysisToFormValues(candidate);
            if (mapped.name || mapped.description || mapped.reference) aggregated.push(mapped);
          }
        }

        if (aggregated.length === 0) {
          throw new Error("Aucun produit exploitable détecté dans l'image.");
        }

        const label = files.map((file) => file.name).join(', ');
        openReview(aggregated, 'image', label);
        pushRecent({
          source: 'image',
          label,
          meta: `${aggregated.length} ligne(s) lue(s) · à vérifier avant enregistrement`,
          status: 'review',
          rows: aggregated,
          targetType: 'product',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analyse IA indisponible.';
        setError(message);
        showError(message);
        pushRecent({
          source: 'image',
          label: files.map((file) => file.name).join(', '),
          meta: message,
          status: 'rejected',
        });
      } finally {
        setBusy(null);
      }
    },
    [openReview, pushRecent, showError],
  );

  const handleSpreadsheetFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setSource('spreadsheet');
      setError(null);
      setBusy('spreadsheet');
      const label = files.map((file) => file.name).join(', ');
      try {
        const imported = await readCatalogSpreadsheet(files);
        openReview(imported, 'spreadsheet', label);
        pushRecent({
          source: 'spreadsheet',
          label,
          meta: `${imported.length} ligne(s) lue(s) · à vérifier avant enregistrement`,
          status: 'review',
          rows: imported,
          targetType,
        });
      } catch (err) {
        const refused = err instanceof SpreadsheetTemplateMismatchError;
        const message = refused
          ? 'Fichier refusé : les colonnes ne correspondent pas au modèle INVEQ.'
          : err instanceof Error
            ? err.message
            : 'Import tableur indisponible.';
        setError(message);
        showError(message);
        pushRecent({ source: 'spreadsheet', label, meta: message, status: 'rejected' });
      } finally {
        setBusy(null);
      }
    },
    [openReview, pushRecent, showError, targetType],
  );

  // `?tool=image` / `?tool=spreadsheet` : entrées du menu « Créer », de la palette ⌘K
  // et des barres d'outils. On amène l'outil demandé sous les yeux et sous le focus —
  // ouvrir le sélecteur de fichier sans geste de l'utilisateur serait bloqué par le navigateur.
  useEffect(() => {
    if (tool !== 'image' && tool !== 'spreadsheet') return;
    const button = tool === 'image' ? imageButtonRef.current : spreadsheetButtonRef.current;
    button?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    button?.focus({ preventScroll: true });
    router.replace('/app/ai');
  }, [router, tool]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const activeScope = requireScope(scope);
      const selected = rows.filter((row, index) => !excluded.includes(index) && row.name.trim());
      if (selected.length === 0) throw new Error('Aucune ligne à enregistrer.');

      let created = 0;
      let updated = 0;
      const duplicates: string[] = [];

      for (const row of selected) {
        try {
          await createProduct(activeScope, targetType, row);
          created += 1;
        } catch (err) {
          if (!isDuplicateReferenceError(err) || !row.reference.trim()) throw err;
          duplicates.push(`${row.name.trim() || 'Ligne'} (réf. ${row.reference.trim()})`);

          if (overwriteByReference) {
            const existing = (
              await fetchProducts(activeScope, targetType, row.reference.trim())
            ).find(
              (product) =>
                (product.reference ?? '').trim().toLowerCase() ===
                row.reference.trim().toLowerCase(),
            );
            if (!existing) throw err;
            await updateProduct(activeScope, existing.id, row);
            updated += 1;
          }
        }
      }

      return { created, updated, duplicates, total: selected.length };
    },
    onSuccess: ({ created, updated, duplicates, total }) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      setStep('saved');
      const duplicateNote =
        duplicates.length > 0
          ? ` · ${duplicates.length} doublon(s) ${overwriteByReference ? 'mis à jour' : 'ignoré(s)'}`
          : '';
      showSuccess(`${created} créé(s), ${updated} mis à jour${duplicateNote}.`);
      setRecent((previous) => {
        const [head, ...tail] = previous;
        if (!head || head.status !== 'review') return previous;
        return [
          {
            ...head,
            status: 'saved' as const,
            meta: `${total} ligne(s) enregistrée(s) dans ${targetType === 'product' ? 'Produits' : 'Prestations'}${duplicateNote}`,
            rows: undefined,
          },
          ...tail,
        ];
      });
    },
    onError: (err: Error) => {
      const message = isDuplicateReferenceError(err)
        ? 'Référence déjà existante. Vérifiez la colonne Référence ou laissez-la vide.'
        : err.message;
      setError(message);
      showError(message);
    },
  });

  const keptCount = rows.length - excluded.length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar
        subtitle="Import par image et par tableur. Chaque import est vérifiable avant enregistrement."
        title="Outils IA">
        <PrimaryButton onClick={resetFlow}>
          <Sparkles size={15} strokeWidth={2} />
          Nouvel import
        </PrimaryButton>
      </AppTopBar>

      <input
        accept="image/*,.pdf"
        className="hidden"
        multiple
        onChange={(event) => {
          void handleImageFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
        ref={imageInputRef}
        type="file"
      />
      <input
        accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.txt"
        className="hidden"
        multiple
        onChange={(event) => {
          void handleSpreadsheetFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
        ref={spreadsheetInputRef}
        type="file"
      />

      <div className="sb flex-1 overflow-y-auto bg-app-canvas p-4 lg:px-6 lg:pb-10 lg:pt-5">
        {error ? (
          <div className="mb-3.5 flex items-start gap-2 rounded-app-card border border-app-danger-border bg-app-danger-tint px-4 py-3 text-[13px] text-app-danger-text">
            <AlertCircle className="mt-px shrink-0" size={15} />
            <span className="min-w-0 flex-1">{error}</span>
            {source === 'spreadsheet' ? (
              <button
                className="shrink-0 text-[12.5px] font-semibold underline"
                onClick={() => void downloadSpreadsheetTemplate('products')}
                type="button">
                Modèle
              </button>
            ) : null}
          </div>
        ) : null}

        {step === 'review' ? (
          <section className="rounded-app-card border border-app-border bg-app-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border-soft px-[18px] py-[14px]">
              <div className="min-w-0">
                <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-app-text">
                  Vérifier avant enregistrement
                </h2>
                <p className="mt-0.5 truncate text-[12.5px] text-app-muted">
                  {source === 'image' ? 'Lecture par IA' : 'Modèle de tableur'} · {fileLabel} ·{' '}
                  <span className="app-num">{keptCount}</span> ligne(s) retenue(s)
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <SecondaryButton onClick={resetFlow}>Annuler</SecondaryButton>
                <PrimaryButton
                  disabled={keptCount === 0}
                  loading={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}>
                  Enregistrer dans le catalogue
                </PrimaryButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-b border-app-border-soft px-[18px] py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-app-muted">Enregistrer dans</span>
                {(
                  [
                    { value: 'product' as const, label: 'Produits' },
                    { value: 'service' as const, label: 'Prestations' },
                  ]
                ).map((option) => (
                  <button
                    aria-pressed={targetType === option.value}
                    className={cn(
                      'rounded-app-chip border px-[13px] py-[6px] text-[12.5px] font-semibold transition-colors duration-150',
                      targetType === option.value
                        ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                        : 'border-app-border bg-app-surface text-app-text-2 hover:border-app-accent-border',
                    )}
                    key={option.value}
                    onClick={() => setTargetType(option.value)}
                    type="button">
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-app-text-2">
                <input
                  checked={overwriteByReference}
                  className="h-[15px] w-[15px] [accent-color:var(--app-accent)]"
                  onChange={(event) => setOverwriteByReference(event.target.checked)}
                  type="checkbox"
                />
                Mettre à jour les lignes existantes (même référence)
              </label>
              <span className="app-num ml-auto text-[12.5px] text-app-muted">
                Total HT lu :{' '}
                {formatCurrency(
                  rows.reduce(
                    (sum, row, index) => (excluded.includes(index) ? sum : sum + rowAmount(row)),
                    0,
                  ),
                )}
              </span>
            </div>

            <div className="p-[18px]">
              <ReviewTable
                excluded={excluded}
                onChange={(index, patch) =>
                  setRows((previous) =>
                    previous.map((row, position) =>
                      position === index ? { ...row, ...patch } : row,
                    ),
                  )
                }
                onToggle={(index) =>
                  setExcluded((previous) =>
                    previous.includes(index)
                      ? previous.filter((entry) => entry !== index)
                      : [...previous, index],
                  )
                }
                rows={rows}
              />
              <p className="mt-3 text-[12px] text-app-muted-2">
                Les valeurs lues restent modifiables avant enregistrement. L’IA ne crée jamais une
                fiche sans validation.
              </p>
            </div>
          </section>
        ) : (
          <>
            {step === 'saved' ? (
              <div className="mb-3.5 flex items-center gap-2 rounded-app-card border border-[#d6f0e3] bg-app-success-tint px-4 py-3 text-[13px] text-app-success-text">
                <Check className="shrink-0" size={15} />
                Import enregistré. Retrouvez les lignes dans votre catalogue.
              </div>
            ) : null}

            <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
              <ToolCard icon={Camera} title="Image → produit">
                <p className="text-[13px] leading-relaxed text-app-text-2">
                  Déposez une image où les informations du produit sont écrites : fiche produit
                  d’un site marchand, catalogue fournisseur, étiquette de prix. L’IA lit le nom, la
                  référence, le prix et la TVA — une photo d’objet sans texte ne peut pas être
                  reconnue.
                </p>
                <DropZone
                  caption="capture d’écran ou photo de fiche produit · .jpg, .png, .pdf"
                  disabled={busy === 'image'}
                  onFiles={(files) => void handleImageFiles(files)}
                />
                <PrimaryButton
                  className="w-full"
                  disabled={busy === 'image'}
                  onClick={() => imageInputRef.current?.click()}
                  ref={imageButtonRef}>
                  <Camera size={15} strokeWidth={1.9} />
                  {busy === 'image' ? 'Lecture en cours…' : 'Choisir une image'}
                </PrimaryButton>
                <p className="text-[12px] text-app-muted-2">
                  Les valeurs lues restent modifiables avant enregistrement.
                </p>
              </ToolCard>

              <ToolCard icon={Table} title="Tableur → catalogue">
                <div className="rounded-app-control border border-app-border bg-app-subtle p-3">
                  <p className="text-[11.5px] font-bold uppercase tracking-[0.07em] text-app-faint">
                    Étape 1 — partez du modèle INVEQ
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {TEMPLATE_ORDER.map((id) => {
                      const template = SPREADSHEET_TEMPLATES[id];
                      const Icon =
                        id === 'products' ? FileSpreadsheet : id === 'prestations' ? Wrench : Users;
                      return (
                        <button
                          className="inline-flex items-center gap-1.5 rounded-app-control border border-app-accent-border bg-app-accent-violet-tint px-3 py-[7px] text-[12.5px] font-semibold text-app-accent-strong transition-colors duration-150 hover:bg-app-accent-tint"
                          key={id}
                          onClick={() => void downloadSpreadsheetTemplate(id)}
                          type="button">
                          <Icon size={14} strokeWidth={1.9} />
                          {template.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11.5px] text-app-muted-2">
                    Télécharger le modèle vide (.xlsx) · Colonnes prêtes · ne pas les renommer.
                  </p>
                </div>

                <p className="text-[13px] leading-relaxed text-app-text-2">
                  L’import n’accepte que le modèle INVEQ : téléchargez-le, remplissez les colonnes
                  déjà en place, puis déposez le fichier. Un autre tableur sera refusé.
                </p>

                <DropZone
                  caption="déposez votre modèle rempli · .xlsx, .csv — jusqu’à 2 000 lignes"
                  disabled={busy === 'spreadsheet'}
                  onFiles={(files) => void handleSpreadsheetFiles(files)}
                />
                <PrimaryButton
                  className="w-full"
                  disabled={busy === 'spreadsheet'}
                  onClick={() => {
                    setStep('upload');
                    spreadsheetInputRef.current?.click();
                  }}
                  ref={spreadsheetButtonRef}>
                  <Upload size={15} strokeWidth={1.9} />
                  {busy === 'spreadsheet' ? 'Lecture en cours…' : 'Importer le modèle rempli'}
                </PrimaryButton>
                <p className="text-[12px] text-app-muted-2">
                  Étape 2 — déposez le fichier rempli ci-dessus. Le modèle Clients se télécharge
                  ici, mais son import doit encore être saisi depuis l’écran Clients.
                </p>
              </ToolCard>
            </div>

            <section className="mt-3.5 rounded-app-card border border-app-border bg-app-surface">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-app-border-soft px-[18px] py-[14px]">
                <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-app-text">
                  Imports récents
                </h2>
                <p className="text-[12px] text-app-muted-2">
                  Chaque import est vérifiable avant enregistrement
                </p>
              </div>
              {recent.length === 0 ? (
                <p className="px-[18px] py-6 text-[13px] text-app-muted">
                  Aucun import pour le moment. Vos lectures d’image et de tableur s’affichent ici
                  avec leur état.
                </p>
              ) : (
                <ul>
                  {recent.map((entry) => {
                    const tone = RECENT_STATUS[entry.status];
                    const Icon = entry.source === 'image' ? Camera : Table;
                    return (
                      <li
                        className="flex flex-wrap items-center gap-3 border-b border-app-border-soft px-[18px] py-3 last:border-b-0"
                        key={entry.id}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-app-icon bg-app-border-soft text-app-muted">
                          <Icon size={14} strokeWidth={1.75} />
                        </span>
                        <span className="min-w-[140px] flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-app-text">
                            {entry.label}
                          </span>
                          <span className="block truncate text-[12px] text-app-muted-2">
                            {entry.meta}
                          </span>
                        </span>
                        <Badge variant={tone.variant}>{tone.label}</Badge>
                        <SecondaryButton
                          className="shrink-0 px-3 py-1.5 text-[12.5px]"
                          onClick={() => {
                            if (entry.status === 'saved') {
                              router.push(
                                entry.targetType === 'service' ? '/app/prestations' : '/app/products',
                              );
                              return;
                            }
                            if (entry.status === 'review' && entry.rows) {
                              openReview(entry.rows, entry.source, entry.label);
                              if (entry.targetType) setTargetType(entry.targetType);
                              return;
                            }
                            void downloadSpreadsheetTemplate('products');
                          }}>
                          {tone.action}
                        </SecondaryButton>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export function AiToolsWorkspace() {
  return (
    <Suspense fallback={null}>
      <AiToolsInner />
    </Suspense>
  );
}
