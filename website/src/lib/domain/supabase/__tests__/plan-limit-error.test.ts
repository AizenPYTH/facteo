/**
 * Mapping PostgREST P0001 → PlanLimitError.
 * Run: npx tsx --test src/lib/domain/supabase/__tests__/plan-limit-error.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parsePlanLimitError } from '@/lib/domain/supabase/subscriptions';
import { PlanLimitError } from '@/types/subscription';

describe('parsePlanLimitError', () => {
  it('returns PlanLimitError from a Postgres P0001 payload', () => {
    const parsed = parsePlanLimitError({
      code: 'P0001',
      message: 'PLAN_LIMIT_REACHED:documents',
      details: JSON.stringify({
        allowed: false,
        resource: 'documents',
        current: 3,
        limit: 3,
        plan_id: 'micro',
        plan_name: 'Micro',
        status: 'active',
        is_premium: false,
      }),
    });

    assert.ok(parsed instanceof PlanLimitError);
    assert.equal(parsed.check.resource, 'documents');
    assert.equal(parsed.check.current, 3);
    assert.equal(parsed.check.limit, 3);
    assert.equal(parsed.check.allowed, false);
  });

  it('ignores unrelated errors', () => {
    assert.equal(parsePlanLimitError(new Error('Unable to create quote.')), null);
    assert.equal(parsePlanLimitError(null), null);
    assert.equal(
      parsePlanLimitError({
        code: 'P0001',
        message: 'Plan configuration not found for micro',
      }),
      null,
    );
  });
});
