/**
 * Snapshot of expected middleware behavior (pre/post fix).
 *
 * BEFORE:
 * - Every matched request → supabase.auth.getUser() (no timeout)
 * - Every authenticated request (any path) → profiles.onboarding_completed
 * - Auth hang → MIDDLEWARE_INVOCATION_TIMEOUT (504)
 *
 * AFTER:
 * - getUser / profiles fetches abort after AUTH_FETCH_TIMEOUT_MS (4s)
 * - profiles fetch only for /app, /onboarding, public auth routes
 * - Public/marketing: Auth timeout → NextResponse.next() (fail-open)
 * - /app|/onboarding: no user / Auth timeout → /login?redirect=… (fail-closed)
 * - Auth flow routes (/auth/*) never redirected mid-flow
 * - No redirect loops (/app↔/onboarding based on stable boolean)
 */
export const MIDDLEWARE_BEHAVIOR_CONTRACT = {
  supabaseFetchTimeoutMs: 4000,
  privatePrefixes: ["/app", "/onboarding"] as const,
  publicAuthPrefixes: [
    "/login",
    "/register",
    "/mot-de-passe-oublie",
    "/connexion",
    "/inscription",
  ] as const,
  authFlowPrefixes: [
    "/reinitialiser-mot-de-passe",
    "/auth/confirm",
    "/auth/callback",
    "/auth/confirmed",
  ] as const,
} as const;
