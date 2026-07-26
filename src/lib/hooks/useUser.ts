import { useState, useEffect } from "react";
import { getUser, type AuthUser } from "@/lib/api/auth";

const CACHE_KEY = "songdis_user";

function getCached(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function setCache(user: AuthUser) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(user));
  } catch {}
}

export function clearUserCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {}
}

export function useUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached();
    if (cached?.id) {
      setUser(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getUser().then((res) => {
      if (cancelled) return;

      const raw = res.data as Record<string, unknown> | null;
      const fetched =
        (raw?.user as AuthUser | undefined) ??
        (raw as AuthUser | null);

      if (fetched?.id) {
        setUser(fetched);
        setCache(fetched);
      } else if (res.error) {
        setError(res.error);
      }
      setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const firstName = user?.first_name ?? "";
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : "";
  const displayName = firstName || fullName || "Artist";

  return { user, firstName, fullName, displayName, isLoading, error };
}