#!/usr/bin/env bash
# Deploy Apple IAP secrets + multi-plan edge functions + migrations.
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   ./scripts/deploy-apple-iap.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="${SUPABASE_PROJECT_REF:-eogyopufctnqasjhsthp}"
KEY_FILE="${APPLE_IAP_PRIVATE_KEY_FILE:-$ROOT/.secrets/SubscriptionKey_Y2T77FFB4S.p8}"
ISSUER_ID="${APPLE_IAP_ISSUER_ID:-31b1363b-3278-4529-820e-cba83f8ce789}"
KEY_ID="${APPLE_IAP_KEY_ID:-Y2T77FFB4S}"
BUNDLE_ID="${APPLE_BUNDLE_ID:-com.inveq.app}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Missing SUPABASE_ACCESS_TOKEN."
  echo "Create one at https://supabase.com/dashboard/account/tokens then:"
  echo "  export SUPABASE_ACCESS_TOKEN=sbp_..."
  exit 1
fi

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Missing Apple .p8 at $KEY_FILE"
  exit 1
fi

# Flatten PEM for Supabase secret storage (single line with \n)
PRIVATE_KEY_ESCAPED="$(awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' "$KEY_FILE")"

echo "==> Setting Apple IAP secrets on $PROJECT_REF"
npx supabase secrets set \
  --project-ref "$PROJECT_REF" \
  "APPLE_IAP_ISSUER_ID=$ISSUER_ID" \
  "APPLE_IAP_KEY_ID=$KEY_ID" \
  "APPLE_IAP_PRIVATE_KEY=$PRIVATE_KEY_ESCAPED" \
  "APPLE_BUNDLE_ID=$BUNDLE_ID"

echo "==> Deploying edge functions"
npx supabase functions deploy apple-confirm-subscription --project-ref "$PROJECT_REF"
npx supabase functions deploy apple-subscription-notifications --project-ref "$PROJECT_REF"
npx supabase functions deploy stripe-create-subscription-checkout --project-ref "$PROJECT_REF"
npx supabase functions deploy stripe-confirm-subscription-checkout --project-ref "$PROJECT_REF"

echo "==> Pushing migrations"
npx supabase db push --project-ref "$PROJECT_REF"

echo ""
echo "Done."
echo "ASN V2 URL (Production + Sandbox) to set in App Store Connect:"
echo "  https://${PROJECT_REF}.supabase.co/functions/v1/apple-subscription-notifications"
