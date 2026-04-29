/**
 * lib/mock/session.ts
 * ─────────────────────────────────────────────────────────────────
 * Utility to check if a mock session exists.
 * Used by dashboard pages to gate access while APIs aren't ready.
 * ─────────────────────────────────────────────────────────────────
 */

const TOKEN_KEY = "songdis_access_token";

export function getMockSession() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  return {
    user: {
      id: "mock-user-001",
      fullName: "Demo Artist",
      email: "demo@songdis.com",
      isVerified: true,
    },
    token,
  };
}

export function isMockLoggedIn(): boolean {
  return !!getMockSession();
}