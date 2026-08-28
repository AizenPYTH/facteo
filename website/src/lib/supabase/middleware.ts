import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@inveq/types/database";

import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import {
  AUTH_FETCH_TIMEOUT_MS,
  decideSessionGate,
  needsOnboardingGate,
} from "./middleware-session";

export {
  AUTH_FETCH_TIMEOUT_MS,
  decideSessionGate,
  isAuthFlowRoute,
  isPrivateAppPath,
  isPublicAuthRoute,
  needsOnboardingGate,
  type SessionGateDecision,
} from "./middleware-session";

/**
 * Fetch wrapper that aborts after AUTH_FETCH_TIMEOUT_MS so middleware cannot
 * hang until Vercel's MIDDLEWARE_INVOCATION_TIMEOUT (~25s).
 */
function createTimeoutFetch(timeoutMs: number): typeof fetch {
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const upstream = init?.signal;
    if (upstream) {
      if (upstream.aborted) {
        controller.abort();
      } else {
        upstream.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }
    }

    return fetch(input, { ...init, signal: controller.signal }).finally(() => {
      clearTimeout(timer);
    });
  };
}

/**
 * @returns boolean when the query succeeds (missing profile → false, same as before)
 * @returns null on network/timeout so we do not invent redirects
 */
async function fetchOnboardingCompleted(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string
): Promise<boolean | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    // Si le profil n'existe pas encore, forcer l'onboarding (comportement historique)
    if (error || !data) return false;
    return Boolean(data.onboarding_completed);
  } catch {
    return null;
  }
}

function applyDecision(
  request: NextRequest,
  decision: ReturnType<typeof decideSessionGate>
) {
  if (decision.type === "next") return null;

  const url = request.nextUrl.clone();
  url.pathname = decision.to;
  if (decision.redirectParam) {
    url.search = "";
    url.searchParams.set("redirect", decision.redirectParam);
  } else {
    url.search = "";
  }
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  try {
    const supabase = createServerClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: CookieOptions;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
        global: {
          fetch: createTimeoutFetch(AUTH_FETCH_TIMEOUT_MS),
        },
      }
    );

    const { pathname } = request.nextUrl;
    let userId: string | null = null;
    let authUnavailable = false;

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        // Invalid/expired session is not an outage — treat as logged out.
        // Only mark unavailable when we could not reach Auth at all.
        // getUser() typically returns a user error without throwing for bad JWT.
        userId = null;
        authUnavailable = false;
      } else {
        userId = user?.id ?? null;
      }
    } catch {
      authUnavailable = true;
      userId = null;
    }

    let onboardingCompleted: boolean | null = null;
    if (userId && !authUnavailable && needsOnboardingGate(pathname)) {
      onboardingCompleted = await fetchOnboardingCompleted(supabase, userId);
    }

    const decision = decideSessionGate({
      pathname,
      userId,
      authUnavailable,
      onboardingCompleted,
    });

    const redirected = applyDecision(request, decision);
    if (redirected) return redirected;

    return response;
  } catch (err) {
    // Last-resort: never crash middleware for public traffic.
    // Private routes: fail-closed via a second decide with authUnavailable.
    console.error("[middleware] unexpected error:", err);
    const { pathname } = request.nextUrl;
    const decision = decideSessionGate({
      pathname,
      userId: null,
      authUnavailable: true,
      onboardingCompleted: null,
    });
    const redirected = applyDecision(request, decision);
    if (redirected) return redirected;
    return response;
  }
}
