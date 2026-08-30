#!/usr/bin/env bash
set -euo pipefail
# Requires SUPABASE_ACCESS_TOKEN
PROJECT_REF="${SUPABASE_PROJECT_REF:-eogyopufctnqasjhsthp}"
if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN manquant" >&2
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npx supabase link --project-ref "$PROJECT_REF" --yes
# Push migrations (enum then data)
npx supabase db push --linked --yes
# Deploy Apple edge functions
npx supabase functions deploy apple-confirm-subscription --project-ref "$PROJECT_REF" --yes
npx supabase functions deploy apple-subscription-notifications --project-ref "$PROJECT_REF" --yes
echo "OK migrations + edge functions"
