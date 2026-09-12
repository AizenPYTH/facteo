import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  resolveCompanyId,
  statusForError,
} from '../_shared/integrations/auth.ts';
import {
  EBAY_PROVIDER,
  getValidAccessToken,
  IntegrationError,
  loadIntegration,
  markStatus,
} from '../_shared/integrations/ebay/connection.ts';
import { loadEbayConfig } from '../_shared/integrations/ebay/config.ts';
import { EbayApiError, buildSyncFilter, fetchAllOrders } from '../_shared/integrations/ebay/orders.ts';
import { latestModifiedAt, normalizeEbayOrder, type BuyerSnapshot } from '../_shared/integrations/ebay/normalize.ts';
import { buildExternalOrderRow, chunk, dedupeOrders } from '../_shared/integrations/ebay/sync.ts';

/**
 * POST { companyId? } → { imported, updated, truncated, lastSyncAt, ... }
 *
 * Synchronisation manuelle (V1). N'écrit jamais de facture : elle alimente
 * uniquement `external_orders`. La création de facture reste une action
 * explicite de l'utilisateur.
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let integrationId: string | null = null;
  let serviceClientRef: Awaited<ReturnType<typeof createAuthedClients>>['serviceClient'] | null = null;

  try {
    const { serviceClient, userId } = await createAuthedClients(request);
    serviceClientRef = serviceClient;

    const body = (await request.json().catch(() => ({}))) as { companyId?: string };
    const companyId = resolveCompanyId(request, body.companyId);
    if (!companyId) {
      return jsonResponse({ error: 'companyId est requis.' }, 400);
    }
    await assertCompanyAccess(serviceClient, userId, companyId);

    const integration = await loadIntegration(serviceClient, companyId);
    if (!integration || integration.status === 'disconnected') {
      return jsonResponse({ error: 'Aucun compte eBay connecté pour cette entreprise.' }, 409);
    }
    integrationId = integration.id;

    const accessToken = await getValidAccessToken(serviceClient, integration);
    const config = loadEbayConfig(integration.environment);

    const since = integration.last_synced_modified_at
      ? new Date(integration.last_synced_modified_at)
      : null;
    const filter = buildSyncFilter(Number.isNaN(since?.getTime() ?? NaN) ? null : since);

    const { orders: rawOrders, truncated, pages } = await fetchAllOrders(
      config,
      accessToken,
      filter,
    );

    const capturedAt = new Date().toISOString();
    const normalized = dedupeOrders(
      rawOrders
        .map((order) => normalizeEbayOrder(order, capturedAt))
        .filter((order): order is NonNullable<typeof order> => order !== null),
    );

    let imported = 0;
    let updated = 0;
    let sellerId: string | null = integration.external_account_id;

    if (normalized.length > 0) {
      const previousById = new Map<string, BuyerSnapshot | null>();
      for (const ids of chunk(normalized.map((order) => order.externalOrderId))) {
        const { data: existingRows } = await serviceClient
          .from('external_orders')
          .select('external_order_id, buyer_snapshot')
          .eq('company_id', companyId)
          .eq('provider', EBAY_PROVIDER)
          .in('external_order_id', ids);

        for (const row of existingRows ?? []) {
          previousById.set(
            row.external_order_id as string,
            (row.buyer_snapshot as BuyerSnapshot | null) ?? null,
          );
        }
      }

      const rows = normalized.map((order) =>
        buildExternalOrderRow(
          companyId,
          integration.environment,
          order,
          previousById.get(order.externalOrderId) ?? null,
          capturedAt,
        ),
      );

      for (const batch of chunk(rows)) {
        const { error: upsertError } = await serviceClient
          .from('external_orders')
          .upsert(batch, { onConflict: 'company_id,provider,external_order_id' });

        if (upsertError) {
          throw new IntegrationError(
            'Enregistrement des commandes eBay impossible.',
            500,
            'upsert_failed',
          );
        }
      }

      updated = previousById.size;
      imported = rows.length - updated;

      for (const order of rawOrders) {
        const candidate = (order as { sellerId?: unknown }).sellerId;
        if (typeof candidate === 'string' && candidate.trim()) {
          sellerId = candidate.trim();
          break;
        }
      }
    }

    const cursor = latestModifiedAt(normalized);
    const syncedAt = new Date().toISOString();

    await markStatus(serviceClient, integration.id, {
      status: 'connected',
      last_sync_at: syncedAt,
      last_sync_error: null,
      external_account_id: sellerId,
      // Le curseur n'avance que si eBay a renvoyé une date : sinon on rejoue
      // la même fenêtre plutôt que de risquer un trou de synchronisation.
      ...(cursor ? { last_synced_modified_at: cursor } : {}),
    });

    return jsonResponse({
      imported,
      updated,
      fetched: normalized.length,
      pages,
      truncated,
      lastSyncAt: syncedAt,
      environment: integration.environment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Synchronisation impossible.';
    console.error('[ebay-sync-orders]', message);

    if (integrationId && serviceClientRef) {
      const reauth =
        (error instanceof IntegrationError && error.code === 'reauth_required') ||
        (error instanceof EbayApiError && error.requiresReauth);
      await markStatus(serviceClientRef, integrationId, {
        status: reauth ? 'reauth_required' : 'error',
        last_sync_error: message.slice(0, 500),
      }).catch(() => undefined);
    }

    const status =
      error instanceof IntegrationError
        ? error.status
        : error instanceof EbayApiError
          ? error.status
          : statusForError(error);
    return jsonResponse({ error: message }, status);
  }
});
