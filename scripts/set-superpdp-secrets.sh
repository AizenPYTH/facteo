#!/usr/bin/env bash
# Configure SUPER PDP secrets on Supabase (does NOT print secret values).
# Usage:
#   export SUPABASE_ACCESS_TOKEN=sbp_...
#   export SUPER_PDP_CLIENT_ID=...
#   export SUPER_PDP_CLIENT_SECRET=...
#   export SUPER_PDP_PROJECT_REF=eogyopufctnqasjhsthp
#   ./scripts/set-superpdp-secrets.sh
set -euo pipefail

PROJECT_REF="${SUPER_PDP_PROJECT_REF:-${SUPABASE_PROJECT_REF:-}}"
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN}"
: "${PROJECT_REF:?Set SUPER_PDP_PROJECT_REF}"
: "${SUPER_PDP_CLIENT_ID:?Set SUPER_PDP_CLIENT_ID}"
: "${SUPER_PDP_CLIENT_SECRET:?Set SUPER_PDP_CLIENT_SECRET}"

REDIRECT_URI="${SUPER_PDP_REDIRECT_URI:-https://${PROJECT_REF}.supabase.co/functions/v1/superpdp-oauth-callback}"
ENC_KEY="${SUPER_PDP_TOKEN_ENCRYPTION_KEY:-$(openssl rand -hex 32)}"
SUCCESS_URL="${SUPER_PDP_SUCCESS_REDIRECT_URL:-https://www.inveq.fr/app/settings/e-invoicing}"
API_BASE="${SUPER_PDP_API_BASE_URL:-https://api.superpdp.tech}"

echo "Setting SUPER PDP secrets on project ${PROJECT_REF} (values hidden)…"
echo "Redirect URI to register at SUPER PDP: ${REDIRECT_URI}"

# Prefer supabase CLI if available
if command -v supabase >/dev/null 2>&1; then
  supabase secrets set \
    --project-ref "$PROJECT_REF" \
    "SUPER_PDP_CLIENT_ID=${SUPER_PDP_CLIENT_ID}" \
    "SUPER_PDP_CLIENT_SECRET=${SUPER_PDP_CLIENT_SECRET}" \
    "SUPER_PDP_REDIRECT_URI=${REDIRECT_URI}" \
    "SUPER_PDP_API_BASE_URL=${API_BASE}" \
    "SUPER_PDP_TOKEN_ENCRYPTION_KEY=${ENC_KEY}" \
    "SUPER_PDP_SUCCESS_REDIRECT_URL=${SUCCESS_URL}"
  echo "Done via supabase CLI."
  exit 0
fi

echo "supabase CLI not found — set secrets via Dashboard → Edge Functions → Secrets."
echo "Required keys: SUPER_PDP_CLIENT_ID, SUPER_PDP_CLIENT_SECRET, SUPER_PDP_REDIRECT_URI,"
echo "SUPER_PDP_API_BASE_URL, SUPER_PDP_TOKEN_ENCRYPTION_KEY, SUPER_PDP_SUCCESS_REDIRECT_URL"
