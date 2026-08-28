import type { Href } from 'expo-router';

export type NewDocumentOptions = {
  /**
   * Auto-apply the client's last document lines in the wizard
   * ("Comme la dernière fois").
   */
  replay?: boolean;
};

/**
 * Build create-document routes with optional contextual client prefill.
 * `clientId` / `replay` stay in the URL so back/forward keeps the context.
 */
export function newQuoteHref(
  clientId?: string | null,
  options?: NewDocumentOptions,
): Href {
  return buildNewDocumentHref('/quotes/new', clientId, options);
}

export function newInvoiceHref(
  clientId?: string | null,
  options?: NewDocumentOptions,
): Href {
  return buildNewDocumentHref('/invoices/new', clientId, options);
}

function buildNewDocumentHref(
  path: '/quotes/new' | '/invoices/new',
  clientId?: string | null,
  options?: NewDocumentOptions,
): Href {
  const params = new URLSearchParams();
  if (clientId) {
    params.set('clientId', clientId);
  }
  if (options?.replay) {
    params.set('replay', '1');
  }

  const query = params.toString();
  return (query ? `${path}?${query}` : path) as Href;
}

export function parseClientIdParam(
  value: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : null;
}

export function parseReplayParam(
  value: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === '1' || raw === 'true';
}
