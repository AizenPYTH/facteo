/**
 * Middleware session-gate contract + decideSessionGate unit tests.
 * Run: npx tsx --test src/lib/supabase/__tests__/middleware-session.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTH_FETCH_TIMEOUT_MS,
  decideSessionGate,
  isAuthFlowRoute,
  isPrivateAppPath,
  isPublicAuthRoute,
  needsOnboardingGate,
} from "../middleware-session";

describe("AUTH_FETCH_TIMEOUT_MS", () => {
  it("is between 3s and 5s", () => {
    assert.ok(AUTH_FETCH_TIMEOUT_MS >= 3000);
    assert.ok(AUTH_FETCH_TIMEOUT_MS <= 5000);
  });
});

describe("needsOnboardingGate", () => {
  it("is false for marketing pages", () => {
    assert.equal(needsOnboardingGate("/"), false);
    assert.equal(needsOnboardingGate("/tarifs"), false);
    assert.equal(needsOnboardingGate("/blog"), false);
    assert.equal(needsOnboardingGate("/a-propos"), false);
  });

  it("is true for app / onboarding / public auth", () => {
    assert.equal(needsOnboardingGate("/app"), true);
    assert.equal(needsOnboardingGate("/app/settings"), true);
    assert.equal(needsOnboardingGate("/onboarding"), true);
    assert.equal(needsOnboardingGate("/login"), true);
    assert.equal(needsOnboardingGate("/register"), true);
    assert.equal(needsOnboardingGate("/connexion"), true);
    assert.equal(needsOnboardingGate("/inscription"), true);
    assert.equal(needsOnboardingGate("/mot-de-passe-oublie"), true);
  });
});

describe("isPublicAuthRoute / isAuthFlowRoute / isPrivateAppPath", () => {
  it("classifies routes without overlap that would loop", () => {
    assert.equal(isPrivateAppPath("/app"), true);
    assert.equal(isPrivateAppPath("/onboarding"), true);
    assert.equal(isPrivateAppPath("/login"), false);
    assert.equal(isPublicAuthRoute("/login"), true);
    assert.equal(isPublicAuthRoute("/tarifs"), false);
    assert.equal(isAuthFlowRoute("/auth/callback"), true);
    assert.equal(isAuthFlowRoute("/login"), false);
  });
});

describe("decideSessionGate — public / marketing", () => {
  it("allows anonymous access", () => {
    for (const path of ["/", "/tarifs", "/blog"]) {
      assert.deepEqual(
        decideSessionGate({
          pathname: path,
          userId: null,
          authUnavailable: false,
          onboardingCompleted: null,
        }),
        { type: "next" },
        path
      );
    }
  });

  it("fail-opens when Auth times out / unavailable", () => {
    for (const path of ["/", "/tarifs", "/login", "/register", "/connexion"]) {
      assert.deepEqual(
        decideSessionGate({
          pathname: path,
          userId: null,
          authUnavailable: true,
          onboardingCompleted: null,
        }),
        { type: "next" },
        path
      );
    }
  });

  it("does not redirect authenticated users on marketing (no onboarding fetch needed)", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: true,
      }),
      { type: "next" }
    );
    assert.deepEqual(
      decideSessionGate({
        pathname: "/tarifs",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: false,
      }),
      { type: "next" }
    );
  });
});

describe("decideSessionGate — private /app", () => {
  it("redirects anonymous users to /login with redirect param", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/app",
        userId: null,
        authUnavailable: false,
        onboardingCompleted: null,
      }),
      { type: "redirect", to: "/login", redirectParam: "/app" }
    );
  });

  it("fail-closes to /login when Auth is unavailable", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/app/settings",
        userId: null,
        authUnavailable: true,
        onboardingCompleted: null,
      }),
      { type: "redirect", to: "/login", redirectParam: "/app/settings" }
    );
    assert.deepEqual(
      decideSessionGate({
        pathname: "/onboarding",
        userId: null,
        authUnavailable: true,
        onboardingCompleted: null,
      }),
      { type: "redirect", to: "/login", redirectParam: "/onboarding" }
    );
  });

  it("redirects incomplete onboarding from /app to /onboarding", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/app",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: false,
      }),
      { type: "redirect", to: "/onboarding" }
    );
  });

  it("allows /app when onboarding is complete", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/app",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: true,
      }),
      { type: "next" }
    );
  });

  it("passes through when onboarding is unknown (timeout)", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/app",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: null,
      }),
      { type: "next" }
    );
  });
});

describe("decideSessionGate — auth pages + no loops", () => {
  it("redirects completed users from public auth to /app", () => {
    for (const path of [
      "/login",
      "/register",
      "/connexion",
      "/inscription",
      "/mot-de-passe-oublie",
    ]) {
      assert.deepEqual(
        decideSessionGate({
          pathname: path,
          userId: "u1",
          authUnavailable: false,
          onboardingCompleted: true,
        }),
        { type: "redirect", to: "/app" },
        path
      );
    }
  });

  it("redirects incomplete users from public auth to /onboarding", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/login",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: false,
      }),
      { type: "redirect", to: "/onboarding" }
    );
  });

  it("does not loop: incomplete user on /onboarding stays", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/onboarding",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: false,
      }),
      { type: "next" }
    );
  });

  it("does not loop: completed user on /app stays", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/app",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: true,
      }),
      { type: "next" }
    );
  });

  it("does not loop: anonymous /login stays", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/login",
        userId: null,
        authUnavailable: false,
        onboardingCompleted: null,
      }),
      { type: "next" }
    );
  });

  it("never redirects away from auth flow routes", () => {
    assert.deepEqual(
      decideSessionGate({
        pathname: "/auth/callback",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: true,
      }),
      { type: "next" }
    );
    assert.deepEqual(
      decideSessionGate({
        pathname: "/reinitialiser-mot-de-passe",
        userId: "u1",
        authUnavailable: false,
        onboardingCompleted: false,
      }),
      { type: "next" }
    );
  });
});
