'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Download, FileSpreadsheet, PenLine, Sparkles, Upload } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Choix de la méthode d'ajout d'un produit.
 *
 * Les trois méthodes étaient présentées en boutons secondaires de même poids,
 * au sein d'une section en bas du panneau : l'analyse par photo, de loin la
 * plus rapide, se lisait comme un utilitaire parmi d'autres.
 *
 * Elles sont maintenant hiérarchisées — la photo domine, l'import suit, la
 * saisie manuelle ferme la marche — sans qu'aucune action ne disparaisse.
 *
 * Aucune logique n'est portée ici : le composant appelle les gestionnaires
 * existants du panneau.
 */

type MethodCardProps = {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  tone: 'ai' | 'neutral';
  icon: ReactNode;
  title: string;
  description: string;
  meta?: string;
  /** Contrôles secondaires, rendus hors du bouton pour rester actionnables. */
  footer?: ReactNode;
};

function MethodCard({
  onClick,
  disabled,
  busy,
  tone,
  icon,
  title,
  description,
  meta,
  footer,
}: MethodCardProps) {
  const reduce = useReducedMotion();
  const isAi = tone === 'ai';

  return (
    <motion.div
      className={cn(
        'group overflow-hidden rounded-[var(--radius-app-card)] border transition-colors',
        isAi
          ? 'border-app-accent-violet-border bg-app-accent-violet-tint hover:border-app-accent-violet'
          : 'border-app-border bg-app-surface hover:border-app-accent-border',
        disabled && 'opacity-60',
      )}
      whileHover={reduce || disabled ? undefined : { y: -2 }}>
      <button
        className={cn(
          'flex w-full items-start gap-3 p-4 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          !isAi && !disabled && 'hover:bg-app-hover',
        )}
        disabled={disabled}
        onClick={onClick}
        type="button">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-app-icon)] transition-colors',
            isAi
              ? 'bg-app-accent-violet text-white'
              : 'bg-app-accent-tint text-app-accent group-hover:bg-app-accent group-hover:text-white',
          )}>
          {icon}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-app-text">{title}</span>
            {meta ? (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  isAi
                    ? 'bg-app-accent-violet/12 text-app-accent-violet'
                    : 'bg-app-hover text-app-muted',
                )}>
                {meta}
              </span>
            ) : null}
          </span>
          <span className="mt-1 block text-[12.5px] leading-relaxed text-app-muted">
            {description}
          </span>
        </span>

        {busy ? (
          <motion.span
            animate={reduce ? undefined : { rotate: 360 }}
            className="mt-1 block h-4 w-4 shrink-0 rounded-full border-2 border-app-accent-violet border-t-transparent"
            transition={reduce ? undefined : { duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        ) : null}
      </button>

      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
    </motion.div>
  );
}

export function AddProductMethods({
  onScan,
  onManual,
  onImport,
  onDownloadTemplate,
  isAnalyzing,
  isImporting,
  fileName,
  detectedCount,
  error,
  success,
  overwriteExisting,
  onOverwriteChange,
  duplicates,
}: {
  onScan: () => void;
  onManual: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  isAnalyzing: boolean;
  isImporting: boolean;
  fileName: string;
  detectedCount: number;
  error: string | null;
  success: string | null;
  overwriteExisting: boolean;
  onOverwriteChange: (value: boolean) => void;
  duplicates: string[];
}) {
  const busy = isAnalyzing || isImporting;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-app-text">
          Ajoutez un produit en quelques secondes
        </h3>
        <p className="mt-1 text-[12.5px] text-app-muted">
          Trois façons de créer une fiche. La photo est la plus rapide.
        </p>
      </div>

      <MethodCard
        busy={isAnalyzing}
        description="Photo ou capture d’écran. L’IA remplit le nom, la description, la référence, l’unité, le prix et la TVA."
        disabled={busy}
        icon={<Sparkles size={17} />}
        meta="Le plus rapide"
        onClick={onScan}
        title={isAnalyzing ? 'Analyse en cours…' : 'Scanner une image'}
        tone="ai"
      />

      <MethodCard
        busy={isImporting}
        description="Fichier .xlsx, .xls ou .csv. Les montants et la TVA sont normalisés à la lecture, et le prix HT est recalculé depuis le TTC si besoin."
        disabled={busy}
        footer={
          <div className="space-y-2.5">
            <button
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-app-field)] border border-app-border bg-app-surface px-2.5 py-1.5 text-[11.5px] font-medium text-app-text-2 transition-colors hover:border-app-accent-border hover:text-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
              onClick={onDownloadTemplate}
              type="button">
              <Download size={13} />
              Modèle Excel
            </button>

            <label className="flex items-start gap-2 text-[11.5px] leading-snug text-app-text-2">
              <input
                checked={overwriteExisting}
                className="mt-0.5 h-[14px] w-[14px] [accent-color:var(--app-accent)]"
                onChange={(event) => onOverwriteChange(event.target.checked)}
                type="checkbox"
              />
              Mettre à jour les produits existants (même référence)
            </label>
          </div>
        }
        icon={<FileSpreadsheet size={17} />}
        meta="Plusieurs produits"
        onClick={onImport}
        title={isImporting ? 'Import en cours…' : 'Importer un catalogue'}
        tone="neutral"
      />

      <MethodCard
        description="Remplir la fiche champ par champ."
        disabled={busy}
        icon={<PenLine size={17} />}
        onClick={onManual}
        title="Saisie manuelle"
        tone="neutral"
      />

      <AnimatePresence initial={false}>
        {fileName ? (
          <motion.p
            animate={{ opacity: 1, height: 'auto' }}
            className="truncate text-[11.5px] text-app-muted"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            key="file">
            <Upload className="mr-1 inline" size={11} /> {fileName}
          </motion.p>
        ) : null}

        {detectedCount > 0 ? (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-start gap-2 rounded-[var(--radius-app-field)] border border-app-success/25 bg-app-success-tint px-3 py-2 text-[12px] text-app-success-text"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            key="detected">
            <Check className="mt-0.5 shrink-0" size={13} strokeWidth={3} />
            <span>
              {detectedCount} produit(s) détecté(s). Le premier pré-remplit le formulaire ci-dessous.
            </span>
          </motion.div>
        ) : null}

        {success && detectedCount === 0 ? (
          <motion.p
            animate={{ opacity: 1, height: 'auto' }}
            className="text-[12px] font-medium text-app-success-text"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            key="success">
            {success}
          </motion.p>
        ) : null}

        {error ? (
          <motion.p
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-[var(--radius-app-field)] border border-app-danger-border bg-app-danger-tint px-3 py-2 text-[12px] font-medium text-app-danger-text"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            key="error">
            {error}
          </motion.p>
        ) : null}

        {duplicates.length > 0 ? (
          <motion.div
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-[var(--radius-app-field)] border border-app-warning/30 bg-app-warning-tint px-3 py-2 text-[12px] text-app-warning-text"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            key="dup">
            <p className="font-semibold">Produits en doublon détectés :</p>
            <p className="mt-1">{duplicates.join(' | ')}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
