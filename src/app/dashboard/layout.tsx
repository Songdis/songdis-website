import { AnalyticsV2Provider } from "@/components/dashboard/analytics-v2/AnalyticsV2Provider";

/**
 * The artist-profile scope for the whole dashboard.
 *
 * ── Why it lives here and not in DashboardLayout ────────────────────────────
 *
 * It used to live inside the DashboardLayout *component*, which every page renders as
 * part of its own JSX:
 *
 *     export default function MusicPage() {
 *       const { releases } = useMusic();          // reads the scope…
 *       return <DashboardLayout>…</DashboardLayout>;   // …but the provider is in HERE
 *     }
 *
 * A page that calls a scope-aware hook in its own body is therefore ABOVE its own
 * provider in the React tree, so useContext walks past it and finds nothing. The releases
 * list read `null`, fell back to pooled, and showed the whole account's catalogue no
 * matter which artist was selected in the switcher — while the switcher itself, being
 * rendered *inside* DashboardLayout, updated correctly. That mismatch is what made the bug
 * look like a filtering problem rather than a tree problem.
 *
 * A route layout wraps the page module itself, so both the page body and everything
 * inside DashboardLayout now sit underneath it.
 *
 * ── The second thing this fixes ─────────────────────────────────────────────
 *
 * App Router layouts persist across navigation within the segment, so the provider is no
 * longer torn down and rebuilt on every page change. The selected artist survives moving
 * from Roster to Your Music without a round-trip through storage.
 *
 * With the analytics v2 flag off the provider is inert — no fetch, no UI — so this changes
 * nothing for anyone until the flag is on.
 */
export default function DashboardSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AnalyticsV2Provider>{children}</AnalyticsV2Provider>;
}
