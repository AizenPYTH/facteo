#!/usr/bin/env bash
# Déploie migration + edge functions Stripe multi-plans en production Supabase.
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-eogyopufctnqasjhsthp}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN manquant — impossible de déployer."
  exit 1
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "Warning: STRIPE_SECRET_KEY absent — provision des prices à faire séparément."
fi

echo "==> Link project ${PROJECT_REF}"
npx supabase link --project-ref "$PROJECT_REF"

echo "==> Push migrations"
npx supabase db push

echo "==> Deploy edge functions"
npx supabase functions deploy stripe-create-subscription-checkout --project-ref "$PROJECT_REF"
npx supabase functions deploy stripe-confirm-subscription-checkout --project-ref "$PROJECT_REF"
npx supabase functions deploy stripe-subscription-webhook --project-ref "$PROJECT_REF"
npx supabase functions deploy list-subscription-prices --project-ref "$PROJECT_REF"

if [[ -n "${STRIPE_SECRET_KEY:-}" ]]; then
  echo "==> Provision Stripe prices (lookup_keys)"
  node scripts/provision-stripe-subscription-prices.mjs
fi

echo "Done."
