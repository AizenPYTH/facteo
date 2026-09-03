/**
 * Pure session-gate helpers for Next.js middleware (no Supabase SDK imports).
 */

export const AUTH_FETCH_TIMEOUT_MS = 4_000;

export type SessionGateDecision =
  | { type: "next" }
  | { type: "redirect"; to: string; redirectParam?: string };

/** Paths that need `profiles.onboarding_completed` in middleware. */
export function needsOnboardingGate(pathname: string): boolean {
  return (
    pathname.startsWith("/app") ||
    pathname.startsWith("/onboarding") ||
    isPublicAuthRoute(pathname)
  );
}

export function isPrivateAppPath(pathname: string): boolean {
  return pathname.startsWith("/app") || pathname.startsWith("/onboarding");
}

export function isPublicAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/mot-de-passe-oublie") ||
    pathname.startsWith("/connexion") ||
    pathname.startsWith("/inscription")
  );
}

/** OAuth / reset flows — never redirect away mid-flow. */
export function isAuthFlowRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/reinitialiser-mot-de-passe") ||
    pathname.startsWith("/auth/confirm") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/confirmed")
  );
}

/**
 * GoTrue PKCE `code` is a long opaque token. Ignore short marketing `?code=` params.
 */
export function isOauthPkceCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return code.length >= 20 && /^[A-Za-z0-9_-]+$/.test(code);
}

/**
 * If Supabase falls back to Site URL (`https://www.inveq.fr/?code=…`) the
 * homepage renders the marketing shell while the browser client still
 * exchanges the code. Send that return to `/auth/callback` first.
 */
export function shouldRewriteOauthReturnToCallback(
  pathname: string,
  code: string | null | undefined,
): boolean {
  if (!isOauthPkceCode(code)) return false;
  if (pathname.startsWith("/auth/callback")) return false;
  if (pathname.startsWith("/auth/confirm")) return false;
  if (pathname.startsWith("/reinitialiser-mot-de-passe")) return false;
  return true;
}

/**
 * Fail-open on public routes when Auth is unavailable.
 * Fail-closed on /app and /onboarding (redirect to /login).
 * Preserves prior redirect rules when session + onboarding are known.
 */
export function decideSessionGate(params: {
  pathname: string;
  userId: string | null;
  authUnavailable: boolean;
  onboardingCompleted: boolean | null;
}): SessionGateDecision {
  const { pathname, userId, authUnavailable, onboardingCompleted } = params;
  const privatePath = isPrivateAppPath(pathname);

  if (authUnavailable) {
    if (privatePath) {
      return { type: "redirect", to: "/login", redirectParam: pathname };
    }
    return { type: "next" };
  }

  if (!userId) {
    if (privatePath) {
      return { type: "redirect", to: "/login", redirectParam: pathname };
    }
    return { type: "next" };
  }

  // Authenticated technical auth flows: never bounce.
  if (isAuthFlowRoute(pathname)) {
    return { type: "next" };
  }

  // Marketing / other public: no onboarding redirects.
  if (!needsOnboardingGate(pathname)) {
    return { type: "next" };
  }

  // Profiles timed out / network error: do not invent a redirect.
  if (onboardingCompleted === null) {
    return { type: "next" };
  }

  if (pathname.startsWith("/app") && !onboardingCompleted) {
    return { type: "redirect", to: "/onboarding" };
  }

  if (pathname.startsWith("/onboarding") && onboardingCompleted) {
    return { type: "redirect", to: "/app" };
  }

  if (isPublicAuthRoute(pathname)) {
    return {
      type: "redirect",
      to: onboardingCompleted ? "/app" : "/onboarding",
    };
  }

  return { type: "next" };
}
