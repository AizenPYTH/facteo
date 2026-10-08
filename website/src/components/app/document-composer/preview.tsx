'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { LineValue } from '@/components/app/document-composer/validation';
import { frenchDateInputToIso } from '@/lib/domain/format/date-input';
import { resolvePdfCompanyInfo } from '@/lib/domain/pdf/document-pdf';
import {
  embedPdfFonts,
  renderDocumentPdfHtml,
  type PdfClientInfo,
  type PdfCompanyInfo,
  type PdfDocumentInput,
} from '@/lib/pdf/engine';
import { inlinePdfCompanyImages } from '@/lib/pdf/inline-images';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import type { Client } from '@/types/client';
import { withInvoiceBankDetails, type InvoicePdfOptions } from '@/types/pdf-options';
import type { Settings } from '@/types/settings';

/** A4 à 96 DPI : la page rendue par le moteur PDF. */
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

/** Délai entre la dernière frappe et le rendu réel de l'aperçu (handoff : ~150 ms). */
const PREVIEW_DEBOUNCE_MS = 150;

/** Entreprise émettrice telle qu'elle figure sur le PDF, logo et signature intégrés. */
export function useComposerPreviewCompany() {
  const { scope } = useTenant();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['composer-preview-company', scope?.companyId ?? '', user?.email ?? ''],
    queryFn: async () =>
      inlinePdfCompanyImages(await resolvePdfCompanyInfo(requireScope(scope), user?.email)),
    enabled: Boolean(scope?.companyId && scope?.userId),
    staleTime: 5 * 60_000,
  });
}

export type ComposerPreviewDraft = {
  kind: 'invoice' | 'quote';
  number: string;
  /** Valeur du champ date (AAAA-MM-JJ ou JJ/MM/AAAA). */
  issuedAt: string;
  /** Échéance (facture) ou fin de validité (devis), AAAA-MM-JJ. `null` : aucune. */
  dueAt: string | null;
  alreadyPaid: boolean;
  notes: string;
  lines: LineValue[];
  totals: { subtotal: number; vat: number; total: number };
  client: Client | null;
  templateId: string;
  pdfOptions: InvoicePdfOptions | null;
};

function toPdfClient(client: Client | null): PdfClientInfo {
  if (!client) {
    return {
      lastName: '',
      firstName: 'Client à choisir',
      company: null,
      email: null,
      phone: null,
      address: null,
      postalCode: null,
      city: null,
      country: null,
      vatNumber: null,
    };
  }
  return {
    lastName: client.lastName,
    firstName: client.firstName,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    vatNumber: client.vatNumber,
  };
}

/** Brouillon de l'éditeur → entrée du moteur PDF (le même que pour le PDF final). */
export function buildComposerPdfInput(
  draft: ComposerPreviewDraft,
  company: PdfCompanyInfo,
  settings: Settings | null | undefined,
): PdfDocumentInput {
  const issuedAtIso = frenchDateInputToIso(draft.issuedAt) ?? new Date().toISOString();
  const dueIso = draft.dueAt ? frenchDateInputToIso(draft.dueAt) : null;
  const total = Math.round((draft.totals.total + Number.EPSILON) * 100) / 100;
  const lines = draft.lines
    .filter((line) => line.description.trim())
    .map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      vatRate: line.vatRate,
      discountPercent: line.discountPercent,
    }));

  const base: PdfDocumentInput = {
    kind: draft.kind,
    number: draft.number,
    issuedAt: issuedAtIso,
    dueOrValidUntil: dueIso,
    notes: draft.notes.trim() || null,
    lines,
    totals: {
      subtotalHt: draft.totals.subtotal,
      totalVat: draft.totals.vat,
      totalTtc: total,
      amountDue: draft.alreadyPaid ? 0 : total,
    },
    company,
    client: toPdfClient(draft.client),
    settings: settings ?? null,
    showPaymentQr: draft.kind === 'invoice' && !draft.alreadyPaid,
    clientSignature: null,
    templateId: draft.templateId,
  };

  if (draft.kind === 'quote' || !draft.pdfOptions) {
    return base;
  }

  // Brouillon encore vide (0 €) : le moteur le tiendrait pour soldé et poserait
  // le cachet « Payée ». On ne le montre que si la facture est vraiment payée.
  const emptyUnpaid = !draft.alreadyPaid && lines.length === 0;

  return {
    ...base,
    paidAt: draft.alreadyPaid ? issuedAtIso : null,
    documentTitle: draft.pdfOptions.title,
    issuerLegalIds: draft.pdfOptions.legalIds,
    stampColor: draft.pdfOptions.stampColor,
    stampPosition: emptyUnpaid ? 'none' : draft.pdfOptions.stampPosition,
    showIssuerEmail: draft.pdfOptions.showEmail,
    company: withInvoiceBankDetails(base.company, draft.pdfOptions.bank),
    paymentMention: draft.pdfOptions.paymentMention,
  };
}

/** HTML réel du document (polices intégrées), recalculé ~150 ms après la dernière modification. */
export function useRenderedPdfHtml(input: PdfDocumentInput | null): string | null {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!input) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const rendered = await embedPdfFonts(renderDocumentPdfHtml(input));
          if (!cancelled) setHtml(rendered);
        } catch {
          // Un rendu raté garde simplement l'aperçu précédent.
        }
      })();
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input]);

  return input ? html : null;
}

/** Valeur retardée : les miniatures n'ont pas à suivre chaque frappe. */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Réglage propre à l'aperçu (jamais au PDF) : avances de glyphes fractionnaires.
 * Le document est mis en page en A4 réel puis réduit (~0,55) ; avec des avances
 * arrondies au pixel (Chromium sous Linux), les espaces des petits corps
 * disparaissaient presque à l'écran.
 */
const PREVIEW_TEXT_STYLE = '<style>html{text-rendering:geometricPrecision}</style>';

function withPreviewTextStyle(html: string | null): string | null {
  if (!html) return html;
  return html.includes('</head>')
    ? html.replace('</head>', `${PREVIEW_TEXT_STYLE}</head>`)
    : `${PREVIEW_TEXT_STYLE}${html}`;
}

/**
 * Feuille A4 à l'échelle de son conteneur. Deux cadres alternent : le nouveau
 * rendu se charge en coulisse et ne remplace l'ancien qu'une fois prêt, ce qui
 * évite le clignotement à chaque frappe.
 */
export function PdfSheet({
  className,
  html,
  placeholder,
  title = 'Aperçu du document',
}: {
  className?: string;
  html: string | null;
  placeholder?: React.ReactNode;
  title?: string;
}) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [slots, setSlots] = useState<[string | null, string | null]>(() => [
    withPreviewTextStyle(html),
    null,
  ]);
  const [front, setFront] = useState<0 | 1>(0);
  const [lastHtml, setLastHtml] = useState(html);

  if (html !== lastHtml) {
    setLastHtml(html);
    const back = front === 0 ? 1 : 0;
    setSlots((prev) => {
      const next: [string | null, string | null] = [prev[0], prev[1]];
      next[back] = withPreviewTextStyle(html);
      return next;
    });
  }

  const scale = width > 0 ? width / A4_WIDTH : 0;

  return (
    <div
      className={cn('relative w-full overflow-hidden bg-white', className)}
      ref={containerRef}
      style={{ aspectRatio: `${A4_WIDTH} / ${A4_HEIGHT}` }}>
      {scale > 0
        ? ([0, 1] as const).map((slot) =>
            slots[slot] ? (
              <iframe
                aria-hidden={slot !== front}
                className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
                key={slot}
                onLoad={() => {
                  if (slot !== front) setFront(slot);
                }}
                sandbox="allow-same-origin"
                srcDoc={slots[slot] ?? undefined}
                style={{
                  width: A4_WIDTH,
                  height: A4_HEIGHT,
                  transform: `scale(${scale})`,
                  opacity: slot === front ? 1 : 0,
                  zIndex: slot === front ? 1 : 0,
                }}
                tabIndex={-1}
                title={title}
              />
            ) : null,
          )
        : null}
      {!slots[front] ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[12px] text-[#A3A1AB]">
          {placeholder ?? 'Préparation de l’aperçu…'}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Miniature réelle d'un modèle : le document courant rendu avec ce modèle,
 * seulement quand la vignette devient visible (82 modèles dans la galerie).
 */
export function TemplateThumbnail({
  className,
  input,
  templateId,
}: {
  className?: string;
  input: PdfDocumentInput | null;
  templateId: string;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = holderRef.current;
    if (!element || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  const html = useMemo(() => {
    if (!visible || !input) return null;
    try {
      // Pas de polices intégrées ni de QR : à cette taille, seul le dessin compte.
      return renderDocumentPdfHtml({ ...input, templateId, showPaymentQr: false });
    } catch {
      return null;
    }
  }, [input, templateId, visible]);

  return (
    <div className={cn('relative w-full', className)} ref={holderRef}>
      <PdfSheet html={html} placeholder={<span />} title={`Modèle ${templateId}`} />
    </div>
  );
}
