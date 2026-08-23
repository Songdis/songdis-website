"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ApiResponse } from "@/lib/api/core";
import {
  cacheKey,
  canonicalIds,
  getBreakdown,
  getCoverage,
  getEngagement,
  getHourly,
  getProfiles,
  getRoster,
  getSummary,
  getTimeseries,
  getTrackDetail,
  getTracks,
  pooledScope,
  singleScope,
  type AnalyticsFilters,
  type AnalyticsScope,
  type Breakdown,
  type BreakdownParams,
  type Coverage,
  type Dimension,
  type Engagement,
  type Granularity,
  type Hourly,
  type Metric,
  type ProfileSummary,
  type Roster,
  type Summary,
  type Timeseries,
  type TrackDetail,
  type TrackDetailParams,
  type TrackList,
  type TrackListParams,
  type TrackSort,
  type SortOrder,
} from "@/lib/api/analytics-v2";
import { ANALYTICS_V2_ENABLED } from "@/lib/featureFlags";

export { ANALYTICS_V2_ENABLED };

const ACTIVE_PROFILE_KEY = "songdis_active_profile";
const POOLED = "pooled";

const PROVISIONAL_DAYS = 45;
const TTL_PROVISIONAL_MS = 900 * 1000;
const TTL_SETTLED_MS = 24 * 60 * 60 * 1000;

const SWITCH_FADE_MS = 190;


export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toIsoDate(d);
}

export type RangePreset = "7d" | "28d" | "90d" | "12m" | "all" | "custom";


/**
 * Opens on everything, not the last year.
 *
 * A 12-month window silently hides catalogue: an artist whose releases predate it sees a
 * dashboard that looks empty, and the legacy Aug 2025 – Mar 2026 streams fall outside it
 * entirely as the year rolls forward. Showing the whole history first, and letting them
 * narrow, means the numbers on screen match the numbers they know.
 */
export const DEFAULT_RANGE_PRESET: RangePreset = "all";

/**
 * How far back "all time" reaches.
 *
 * Songdis has no streams before this, so it is the whole archive without asking the API
 * for an unbounded range that would defeat the response cache and scan every partition.
 */
export const ANALYTICS_EPOCH = "2024-01-01";

export const RANGE_PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "28d", label: "28 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

export interface DateRange {
  from: string;
  to: string;
}

export function rangeForPreset(preset: RangePreset): DateRange {
  const to = toIsoDate(new Date());
  switch (preset) {
    case "7d":
      return { from: daysAgo(6), to };
    case "90d":
      return { from: daysAgo(89), to };
    case "12m": {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      d.setDate(d.getDate() + 1);
      return { from: toIsoDate(d), to };
    }
    case "all":
      return { from: ANALYTICS_EPOCH, to };
    case "28d":
    case "custom":
    default:
      return { from: daysAgo(27), to };
  }
}

export function granularityForRange(range: DateRange): Granularity {
  const ms = new Date(range.to).getTime() - new Date(range.from).getTime();
  const days = Math.round(ms / 86_400_000) + 1;
  if (days <= 62) return "day";
  if (days <= 365) return "week";
  return "month";
}

/** True when the range reaches into the still-restatable window. */
export function rangeIsProvisional(range: DateRange): boolean {
  const boundary = new Date();
  boundary.setDate(boundary.getDate() - PROVISIONAL_DAYS);
  return new Date(range.to).getTime() >= boundary.getTime();
}

/* ─── Response cache ──────────────────────────────────────────── */

interface CacheEntry {
  value: unknown;
  expires: number;
}

const responseCache = new Map<string, CacheEntry>();

/**
 * In-flight requests, keyed the same way as the cache.
 *
 * Two components can legitimately want the same slice at once — the page shell
 * shows `last_rebuilt_at` from the summary while the overview renders its
 * totals. Without this they would both miss the cold cache and fire the same
 * request. Sharing the promise makes it one.
 */
const inflight = new Map<string, Promise<unknown>>();

function cacheGet<T>(key: string): T | undefined {
  const hit = responseCache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return hit.value as T;
}

function cacheSet(key: string, value: unknown, ttlMs: number): void {
  responseCache.set(key, { value, expires: Date.now() + ttlMs });
}

/** Drop every key for a scope — used by the manual refresh control. */
export function invalidateScope(scope: AnalyticsScope | null): void {
  if (!scope) {
    responseCache.clear();
    return;
  }
  const prefix = `analytics:v2:${
    scope.pooledIds && scope.pooledIds.length > 1
      ? canonicalIds(scope.pooledIds).join(",")
      : scope.artistId
  }:`;
  for (const key of Array.from(responseCache.keys())) {
    if (key.startsWith(prefix)) responseCache.delete(key);
  }
}

/* ─── Motion ──────────────────────────────────────────────────── */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}


export interface AnalyticsV2ContextValue {
  enabled: boolean;

  profiles: ProfileSummary[];
  profilesLoading: boolean;
  profilesError: string | null;
  reloadProfiles: () => void;
  activeId: number | null;
  activeProfile: ProfileSummary | null;
  isPooled: boolean;
  scope: AnalyticsScope | null;
  scopeToken: string;
  isSwitching: boolean;
  select: (id: number | null) => void;

  /* Shared filter row */
  preset: RangePreset;
  range: DateRange;
  setPreset: (preset: RangePreset) => void;
  setCustomRange: (range: DateRange) => void;
  platforms: string[];
  setPlatforms: (platforms: string[]) => void;
  filters: AnalyticsFilters;

  /** Drop this scope's cached responses and refetch. */
  refreshAll: () => void;
  /** Bumped by refreshAll; hooks watch it. */
  refreshToken: number;
}

const AnalyticsV2Context = createContext<AnalyticsV2ContextValue | null>(null);

function readStoredSelection(): number | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (raw === null) return undefined;
    if (raw === POOLED) return null;
    const id = Number(raw);
    return Number.isFinite(id) ? id : undefined;
  } catch {
    return undefined;
  }
}

function writeStoredSelection(id: number | null): void {
  try {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id === null ? POOLED : String(id));
  } catch {
    /* storage unavailable — selection stays in memory only */
  }
}

export function useAnalyticsV2State(): AnalyticsV2ContextValue {
  const enabled = ANALYTICS_V2_ENABLED;

  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(enabled);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [profileToken, setProfileToken] = useState(0);

  /**
   * `undefined` means "the artist hasn't chosen in this session" — the stored
   * selection is then resolved against the live registry during render. `null`
   * is a real choice: pooled.
   */
  const [selection, setSelection] = useState<number | null | undefined>(undefined);
  const [isSwitching, setIsSwitching] = useState(false);

  const [preset, setPresetState] = useState<RangePreset>(DEFAULT_RANGE_PRESET);
  const [range, setRange] = useState<DateRange>(() => rangeForPreset(DEFAULT_RANGE_PRESET));
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [refreshToken, setRefreshToken] = useState(0);

  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Registry. `enabled` is a build constant, so profilesLoading is seeded from
     it and needs no reset here when the flag is off. */
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      const res = await getProfiles();
      if (cancelled) return;

      if (res.data) {
        setProfiles(res.data);
        setProfilesError(null);
      } else {
        setProfilesError(res.error ?? "Could not load your artist profiles.");
      }
      setProfilesLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, profileToken]);


  const activeId = useMemo<number | null>(() => {
    if (selection !== undefined) return selection;
    if (profiles.length === 0) return null;

    const stored = readStoredSelection();
    if (stored === null) return null;
    if (stored !== undefined && profiles.some((p) => p.id === stored)) return stored;
    return profiles[0].id;
  }, [selection, profiles]);

  useEffect(
    () => () => {
      if (switchTimer.current) clearTimeout(switchTimer.current);
    },
    []
  );

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? null,
    [profiles, activeId]
  );

  const isPooled = activeId === null && profiles.length > 0;

  const scope = useMemo<AnalyticsScope | null>(() => {
    if (activeId !== null) return singleScope(activeId);
    if (profiles.length > 0) return pooledScope(profiles.map((p) => p.id));
    return null;
  }, [activeId, profiles]);

  const scopeToken = scope
    ? scope.pooledIds && scope.pooledIds.length > 1
      ? canonicalIds(scope.pooledIds).join(",")
      : String(scope.artistId)
    : "none";


  const select = useCallback(
    (id: number | null) => {
      if (id === activeId) return;
      writeStoredSelection(id);

      if (prefersReducedMotion()) {
        setSelection(id);
        return;
      }

      setIsSwitching(true);
      if (switchTimer.current) clearTimeout(switchTimer.current);
      switchTimer.current = setTimeout(() => {
        setSelection(id);
        setIsSwitching(false);
      }, SWITCH_FADE_MS);
    },
    [activeId]
  );

  const setPreset = useCallback((next: RangePreset) => {
    setPresetState(next);
    if (next !== "custom") setRange(rangeForPreset(next));
  }, []);

  const setCustomRange = useCallback((next: DateRange) => {
    setPresetState("custom");
    setRange(next);
  }, []);

  const refreshAll = useCallback(() => {
    invalidateScope(scope);
    setRefreshToken((n) => n + 1);
    setProfileToken((n) => n + 1);
  }, [scope]);

  const filters = useMemo<AnalyticsFilters>(
    () => ({
      from: range.from,
      to: range.to,
      platform: platforms.length > 0 ? platforms : undefined,
    }),
    [range.from, range.to, platforms]
  );

  return {
    enabled,
    profiles,
    profilesLoading,
    profilesError,
    reloadProfiles: () => setProfileToken((n) => n + 1),
    activeId,
    activeProfile,
    isPooled,
    scope,
    scopeToken,
    isSwitching,
    select,
    preset,
    range,
    setPreset,
    setCustomRange,
    platforms,
    setPlatforms,
    filters,
    refreshAll,
    refreshToken,
  };
}

export { AnalyticsV2Context };

export function useAnalyticsV2(): AnalyticsV2ContextValue {
  const ctx = useContext(AnalyticsV2Context);
  if (!ctx) {
    throw new Error("useAnalyticsV2 must be used inside <AnalyticsV2Provider>.");
  }
  return ctx;
}

/** Non-throwing form, for components that render outside the provider. */
export function useAnalyticsV2Optional(): AnalyticsV2ContextValue | null {
  return useContext(AnalyticsV2Context);
}


export interface ResourceState<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  error: string | null;
  errors: Record<string, string[]> | null;
  refresh: () => void;
}


function useResource<T>(
  key: string | null,
  fetcher: () => Promise<ApiResponse<T>>,
  ttlMs: number
): ResourceState<T> {
  const [data, setData] = useState<T | null>(() => (key ? cacheGet<T>(key) ?? null : null));
  const [isLoading, setIsLoading] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const hasData = data !== null;

  useEffect(() => {
    if (!key) {
      setIsLoading(false);
      setIsStale(false);
      return;
    }

    const cached = cacheGet<T>(key);
    if (cached !== undefined) {
      setData(cached);
      setError(null);
      setErrors(null);
      setIsLoading(false);
      setIsStale(false);
      return;
    }

    let cancelled = false;
    setIsLoading(!hasData);
    setIsStale(hasData);

    (async () => {
      let pending = inflight.get(key) as Promise<ApiResponse<T>> | undefined;
      if (!pending) {
        pending = fetcherRef.current();
        inflight.set(key, pending);
        void pending.finally(() => inflight.delete(key));
      }

      const res = await pending;
      if (cancelled) return;

      if (res.data !== null && res.data !== undefined) {
        cacheSet(key, res.data, ttlMs);
        setData(res.data);
        setError(null);
        setErrors(null);
      } else {
        setError(res.error ?? "Could not load this data.");
        setErrors(res.errors ?? null);
        if (res.status === 422) setData(null);
      }
      setIsLoading(false);
      setIsStale(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [key, ttlMs, nonce]);

  const refresh = useCallback(() => {
    if (key) responseCache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { data, isLoading, isStale, error, errors, refresh };
}

/** TTL for a range, matching the server's provisional/settled boundary. */
function ttlFor(range: DateRange): number {
  return rangeIsProvisional(range) ? TTL_PROVISIONAL_MS : TTL_SETTLED_MS;
}

/* ─── Endpoint hooks ──────────────────────────────────────────── */

export function useSummary(compare = true): ResourceState<Summary> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const params = useMemo(() => ({ ...filters, compare }), [filters, compare]);

  const key = scope
    ? `${cacheKey(scope, "summary", { ...params, compare })}#${refreshToken}`
    : null;

  return useResource<Summary>(
    key,
    () => getSummary(scope as AnalyticsScope, params),
    ttlFor(range)
  );
}

export function useTimeseries(
  metric: Metric = "streams",
  granularity?: Granularity
): ResourceState<Timeseries> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const grain = granularity ?? granularityForRange(range);
  const params = useMemo(
    () => ({ ...filters, metric, granularity: grain }),
    [filters, metric, grain]
  );

  const key = scope
    ? `${cacheKey(scope, "timeseries", params)}#${refreshToken}`
    : null;

  return useResource<Timeseries>(
    key,
    () => getTimeseries(scope as AnalyticsScope, params),
    ttlFor(range)
  );
}

export function useBreakdown(dimension: Dimension): ResourceState<Breakdown> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const params = useMemo<BreakdownParams>(
    () => ({ ...filters, dimension }),
    [filters, dimension]
  );

  const key = scope
    ? `${cacheKey(scope, "breakdown", params)}#${refreshToken}`
    : null;

  return useResource<Breakdown>(
    key,
    () => getBreakdown(scope as AnalyticsScope, params),
    ttlFor(range)
  );
}

export interface TrackQuery {
  search?: string;
  sort?: TrackSort;
  order?: SortOrder;
  page?: number;
  per_page?: number;
}

export function useTracks(query: TrackQuery = {}): ResourceState<TrackList> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const { search, sort = "streams", order = "desc", page = 1, per_page = 25 } = query;

  const params = useMemo<TrackListParams>(
    () => ({ ...filters, search: search || undefined, sort, order, page, per_page }),
    [filters, search, sort, order, page, per_page]
  );

  const key = scope ? `${cacheKey(scope, "tracks", params)}#${refreshToken}` : null;

  return useResource<TrackList>(
    key,
    () => getTracks(scope as AnalyticsScope, params),
    ttlFor(range)
  );
}

export function useTrackDetail(
  trackId: number | null,
  params: TrackDetailParams = {}
): ResourceState<TrackDetail> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const { dimension, metric, granularity } = params;

  const merged = useMemo<TrackDetailParams>(
    () => ({ ...filters, dimension, metric, granularity }),
    [filters, dimension, metric, granularity]
  );

  const key =
    scope && trackId !== null
      ? `${cacheKey(scope, `track:${trackId}`, merged)}#${refreshToken}`
      : null;

  return useResource<TrackDetail>(
    key,
    () => getTrackDetail(scope as AnalyticsScope, trackId as number, merged),
    ttlFor(range)
  );
}

export function useHourly(): ResourceState<Hourly> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const key = scope ? `${cacheKey(scope, "hourly", filters)}#${refreshToken}` : null;

  return useResource<Hourly>(
    key,
    () => getHourly(scope as AnalyticsScope, filters),
    ttlFor(range)
  );
}

export function useEngagement(): ResourceState<Engagement> {
  const { scope, filters, range, refreshToken } = useAnalyticsV2();
  const key = scope ? `${cacheKey(scope, "engagement", filters)}#${refreshToken}` : null;

  return useResource<Engagement>(
    key,
    () => getEngagement(scope as AnalyticsScope, filters),
    ttlFor(range)
  );
}

export function useCoverage(): ResourceState<Coverage> {
  const { scope, range, refreshToken } = useAnalyticsV2();
  const params = useMemo(() => ({ from: range.from, to: range.to }), [range.from, range.to]);
  const key = scope ? `${cacheKey(scope, "coverage", params)}#${refreshToken}` : null;

  return useResource<Coverage>(
    key,
    () => getCoverage(scope as AnalyticsScope, params),
    ttlFor(range)
  );
}


export function useRoster(): ResourceState<Roster> {
  const { profiles, filters, range, refreshToken } = useAnalyticsV2();

  const rosterScope = useMemo<AnalyticsScope | null>(() => {
    if (profiles.length === 0) return null;
    return pooledScope(profiles.map((p) => p.id));
  }, [profiles]);

  const key = rosterScope
    ? `${cacheKey(rosterScope, "roster", filters)}#${refreshToken}`
    : null;

  return useResource<Roster>(
    key,
    () => getRoster(rosterScope as AnalyticsScope, filters),
    ttlFor(range)
  );
}
