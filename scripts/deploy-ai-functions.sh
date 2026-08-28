#!/usr/bin/env bash
# Déploie les Edge Functions IA (parse-clients, analyze-product-image, process-voice-command).
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-eogyopufctnqasjhsthp}"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN manquant — impossible de déployer."
  echo "Créez un token sur https://supabase.com/dashboard/account/tokens"
  exit 1
fi

echo "==> Link project ${PROJECT_REF}"
npx supabase link --project-ref "$PROJECT_REF"

echo "==> Deploy AI edge functions"
npx supabase functions deploy parse-clients --project-ref "$PROJECT_REF"
npx supabase functions deploy analyze-product-image --project-ref "$PROJECT_REF"
npx supabase functions deploy process-voice-command --project-ref "$PROJECT_REF"

echo ""
echo "Vérifiez le secret OPENAI_API_KEY :"
echo "  Dashboard → Project Settings → Edge Functions → Secrets"
echo "  ou : npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref ${PROJECT_REF}"
echo ""
echo "Done."
