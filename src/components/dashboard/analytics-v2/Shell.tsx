"use client";

/**
 * The frame every analytics-v2 view sits in: the dashboard chrome, the single
 * filter row, the view tabs, and the freshness line.
 *
 * The freshness line lives here rather than on each page because it qualifies
 * everything below it — when a range is provisional, that is true of the
 * summary, the charts and the track list alike.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, ListMusic, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAnalyticsV2, useSummary } from "@/lib/hooks/useAnalyticsV2";
import { FilterBar } from "./FilterBar";
import { Card, ErrorPanel, FreshnessBar, Shimmer } from "./primitives";

const TABS = [
  { href: "/dashboard/analytics-v2", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/analytics-v2/trends", label: "Trends", icon: TrendingUp },
  { href: "/dashboard/analytics-v2/breakdowns", label: "Breakdowns", icon: BarChart3 },
  { href: "/dashboard/analytics-v2/tracks", label: "Tracks", icon: ListMusic },
];

/**
 * The provider lives inside DashboardLayout, so everything that reads the scope
 * has to render *below* it. That is why the body is a separate component passed
 * as children rather than hooks called here — calling useAnalyticsV2() in this
 * component would look up the context above its own provider and throw.
 */
export function AnalyticsV2Shell({
  children,
  pageTitle = "Analytics",
}: {
  children: React.ReactNode;
  /**
   * The roster shares this shell but is not the analytics section — it answers "how is my
   * roster doing", not "how is this release doing". Titling both "Analytics" left a label
   * unable to tell from the header which screen they were on.
   */
  pageTitle?: string;
}) {
  return (
    <DashboardLayout pageTitle={pageTitle}>
      <ShellBody>{children}</ShellBody>
    </DashboardLayout>
  );
}

function ShellBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profiles, profilesLoading, profilesError, scope, activeProfile, isPooled } =
    useAnalyticsV2();
  const summary = useSummary();

  const scopeLabel = isPooled
    ? `All ${profiles.length} profiles`
    : activeProfile?.display_name ?? "";

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
        {/* Scope + freshness */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            {profilesLoading && profiles.length === 0 ? (
              <Shimmer className="h-4 w-40" />
            ) : (
              scopeLabel && (
                <p className="font-body text-white/50 text-xs">
                  Showing{" "}
                  <span className="text-white/85">{scopeLabel}</span>
                </p>
              )
            )}
          </div>

          {summary.data && (
            <FreshnessBar
              lastRebuiltAt={summary.data.last_rebuilt_at}
              provisional={summary.data.provisional || summary.data.range?.provisional}
              stale={summary.isStale}
            />
          )}
        </div>

        {/* Tabs */}
        <nav
          aria-label="Analytics views"
          className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] -mb-px"
        >
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "font-body text-xs px-3 py-2.5 whitespace-nowrap border-b-2 transition-all duration-200 flex items-center gap-1.5 focus-visible:outline-none focus-visible:text-white",
                  active
                    ? "text-white border-[#C30100]"
                    : "text-white/40 border-transparent hover:text-white/75",
                ].join(" ")}
              >
                <Icon size={13} aria-hidden />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <FilterBar />

        {/* Registry problems are fatal to every view below, so they stop here. */}
        {profilesError && !profilesLoading && (
          <Card>
            <div className="p-4">
              <ErrorPanel error={profilesError} />
            </div>
          </Card>
        )}

        {!profilesError && !profilesLoading && profiles.length === 0 && (
          <Card>
            <div className="p-8 text-center">
              <p className="font-body text-white/55 text-sm">
                No artist profile is linked to this account yet.
              </p>
              <p className="font-body text-white/30 text-xs mt-1.5">
                Analytics appear once a release has been delivered and attributed.
              </p>
            </div>
          </Card>
        )}

      {scope && <div className="av2-module flex flex-col gap-4 sm:gap-5">{children}</div>}
    </div>
  );
}
