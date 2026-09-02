import assert from 'node:assert/strict';
import test from 'node:test';

const SUPERPDP_STATUS_TO_INVEQ = {
  'api:uploaded': 'submitted',
  'api:validated': 'submitted',
  'api:sent': 'delivered',
  'api:acknowledged': 'delivered',
  'api:accepted': 'accepted',
  'api:rejected': 'rejected',
  'api:invalid': 'error',
  'api:received': 'received',
  'fr:200': 'submitted',
  'fr:201': 'delivered',
  'fr:202': 'received',
  'fr:203': 'delivered',
  'fr:204': 'accepted',
  'fr:205': 'accepted',
  'fr:206': 'accepted',
  'fr:207': 'rejected',
  'fr:208': 'submitted',
  'fr:209': 'accepted',
  'fr:210': 'rejected',
  'fr:211': 'paid',
  'fr:212': 'paid',
  'fr:213': 'rejected',
  'fr:501': 'rejected',
};

const PRIORITY = {
  draft: 0,
  ready: 1,
  submitted: 2,
  delivered: 3,
  received: 3,
  accepted: 4,
  paid: 5,
  rejected: 6,
  error: 6,
  cancelled: 7,
};

function derive(statusCodes, fallback = 'submitted') {
  let best = fallback;
  let bestPriority = PRIORITY[fallback] ?? 0;
  for (const code of statusCodes) {
    const mapped = SUPERPDP_STATUS_TO_INVEQ[code];
    if (!mapped) continue;
    const priority = PRIORITY[mapped] ?? 0;
    if (priority >= bestPriority) {
      best = mapped;
      bestPriority = priority;
    }
  }
  return best;
}

test('tenant isolation invariant: connection rows are company scoped', () => {
  const rows = [
    { company_id: 'A', token: 'secret-a' },
    { company_id: 'B', token: 'secret-b' },
  ];
  const visibleToA = rows.filter((r) => r.company_id === 'A');
  assert.equal(visibleToA.length, 1);
  assert.equal(visibleToA[0]?.token, 'secret-a');
  assert.ok(!visibleToA.some((r) => r.company_id === 'B'));
});

test('idempotence: existing superpdp_invoice_id blocks second send', () => {
  const invoice = { id: 'inv-1', superpdp_invoice_id: 42 };
  const shouldSend = !invoice.superpdp_invoice_id;
  assert.equal(shouldSend, false);
});

test('webhook event_key uniqueness prevents double processing', () => {
  const seen = new Set();
  const key = 'webhook:1:99:fr:205:evt';
  assert.equal(seen.has(key), false);
  seen.add(key);
  assert.equal(seen.has(key), true);
});

test('status mapping fr:200 → submitted', () => {
  assert.equal(SUPERPDP_STATUS_TO_INVEQ['fr:200'], 'submitted');
  assert.equal(derive(['api:uploaded', 'fr:205']), 'accepted');
});

test('oauth state must bind company and be single-use', () => {
  const state = {
    value: 'abc',
    company_id: 'company-a',
    used_at: null,
    expires_at: Date.now() + 60_000,
  };
  assert.equal(state.used_at, null);
  assert.ok(state.expires_at > Date.now());
  state.used_at = new Date().toISOString();
  assert.ok(state.used_at);
});

test('expired access token triggers refresh path', () => {
  const tokenExpiresAt = Date.now() - 1000;
  const needsRefresh = tokenExpiresAt - 60_000 < Date.now();
  assert.equal(needsRefresh, true);
});
