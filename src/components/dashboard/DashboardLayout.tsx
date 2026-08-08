"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import UploadModal from "@/components/dashboard/upload/UploadModal";
import NotificationPanel from "@/components/dashboard/notifications/NotificationPanel";
import SubscriptionBanner from "@/components/dashboard/SubscriptionBanner";
import AyoChatWidget from "@/components/dashboard/ayo/AyoChatWidget";
import { useUser } from "@/lib/hooks/useUser";
import { useBilling } from "@/lib/hooks/useBilling";
import { getUnreadCount } from "@/lib/api/notifications";
import { ArtistSwitcher } from "@/components/dashboard/analytics-v2/ArtistSwitcher";
import { ViewCrossfade } from "@/components/dashboard/analytics-v2/ViewCrossfade";

const ALLOWED_ROUTES_WHEN_EXPIRED = ["/dashboard", "/dashboard/settings"];

/**
 * Routes that are ALWAYS pooled across the whole account, where the artist switcher is
 * hidden rather than shown-and-ignored.
 *
 * These are the money screens. `royalty_data` carries no artist attribution at all —
 * ownership is inferred by UPC/ISRC back to a release — so there is no honest way to split
 * earnings per artist today (Label design DL8). A switcher here would promise a filter that
 * does not exist, and a wrong number about money is worse than no number.
 */
const ACCOUNT_SCOPED_ROUTES = ["/dashboard/earnings", "/dashboard/royalties"];

interface DashboardLayoutProps {
  children: React.ReactNode;
  /**
   * `disabled` keeps the action visible but inert — a feature that is
   * temporarily off has to stay on screen, or the artist assumes it was taken
   * away. `disabledReason` is announced with the button so the state is not
   * carried by the dimmed styling alone.
   */
  customCta?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    disabledReason?: string;
  };
  showWelcome?: boolean;
  pageTitle?: string;
}

export default function DashboardLayout({ children, customCta, showWelcome = false, pageTitle }: DashboardLayoutProps) {
  const ctaDisabled = Boolean(customCta?.disabled);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { firstName, user } = useUser();
  const {
    isLocked,
    isExpired,
    hasSubscription,
    isTrialing,
    endDate,
    daysUntilExpiry,
    isContract,
    isLoading: subLoading,
  } = useBilling(0);
  const pathname = usePathname();
  const router = useRouter();


  const isRouteBlocked = isLocked && !ALLOWED_ROUTES_WHEN_EXPIRED.some((r) => pathname === r || pathname.startsWith(r + "/"));

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res.data) return res.data.count;
    } catch {
      // silent
    }
    return 0;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const count = await fetchUnreadCount();
      if (!cancelled) setUnreadCount(count);
    })();
    const interval = setInterval(async () => {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    }, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isRouteBlocked) {
      router.replace("/dashboard");
    }
  }, [isRouteBlocked, router]);

  if (isRouteBlocked) return null;

  return (
    /*
     * The AnalyticsV2Provider used to wrap this component. It now lives in the route
     * layout at app/dashboard/layout.tsx — a page calling a scope-aware hook in its own
     * body sits ABOVE this component, so a provider here was invisible to exactly the
     * callers that needed it. Do not move it back.
     */
    <div className="flex h-screen w-full bg-[#0E0808] overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={[
        "fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:flex transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}>
        <Sidebar user={user} isMobile={sidebarOpen} onClose={() => setSidebarOpen(false)} isLocked={isLocked} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Subscription expiry banner */}
        {!subLoading && (
          <SubscriptionBanner
            isLocked={isLocked}
            isExpired={isExpired}
            hasSubscription={hasSubscription}
            isTrialing={isTrialing}
            endDate={endDate}
            daysUntilExpiry={daysUntilExpiry}
            isContract={isContract}
          />
        )}

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/60 hover:text-white transition-colors shrink-0 focus-visible:outline-none"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </button>

            {showWelcome ? (
              <div className="min-w-0">
                <h1 className="font-heading text-white uppercase text-lg sm:text-2xl lg:text-3xl tracking-wide truncate">
                  Welcome Back, {firstName || "..."}!
                </h1>
                <p className="font-body text-white/50 text-xs sm:text-sm mt-0.5 hidden sm:block">
                  Here&apos;s what&apos;s happening today.
                </p>
              </div>
            ) : pageTitle ? (
              <div className="min-w-0">
                <h1 className="font-heading text-white uppercase text-lg sm:text-2xl tracking-wide truncate">
                  {pageTitle}
                </h1>
              </div>
            ) : (
              <div className="min-w-0" />
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative">
            {/* Multi-profile accounts only; renders nothing otherwise. */}
            {/* Money is reported per ACCOUNT, not per artist (Label design DL8): royalty
                rows carry no artist attribution, so an artist-scoped earnings figure would
                be a number nobody can stand behind. Offering a switcher on these pages
                would imply a filter that does not exist — so it is hidden, and those
                screens stay pooled across the whole account. */}
            {!ACCOUNT_SCOPED_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/")) && (
              <ArtistSwitcher />
            )}

            <button
              data-notification-toggle
              onClick={() => setNotifOpen((open) => !open)}
              aria-expanded={notifOpen}
              aria-label={notifOpen ? "Close notifications" : "Open notifications"}
              className="relative text-white/60 hover:text-white transition-colors focus-visible:outline-none"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#C30100] text-white text-[9px] font-bold px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <NotificationPanel
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              onCountChange={setUnreadCount}
            />

            {!isLocked && (
              <button
                onClick={ctaDisabled ? undefined : customCta ? customCta.onClick : () => setUploadOpen(true)}
                disabled={ctaDisabled}
                title={ctaDisabled ? customCta?.disabledReason : undefined}
                className={[
                  "flex items-center gap-1.5 font-heading text-white uppercase text-[10px] sm:text-xs tracking-widest rounded-full border border-[#C30100] bg-[#140C0C] px-3 sm:px-5 py-2 sm:py-3 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C30100] whitespace-nowrap",
                  ctaDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[#C30100]",
                ].join(" ")}
              >
                {!customCta && <span className="text-sm leading-none">+</span>}
                <span className="hidden sm:inline">{customCta ? customCta.label : "Upload New Release"}</span>
                <span className="sm:hidden">{customCta ? customCta.label.replace("+ ", "").split(" ").slice(0, 2).join(" ") : "Upload"}</span>
                {/* The reason travels with the button, so it is not conveyed by
                    the dimmed styling alone. */}
                {ctaDisabled && customCta?.disabledReason && (
                  <span className="sr-only">{customCta.disabledReason}</span>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
          <ViewCrossfade>{children}</ViewCrossfade>
        </main>
      </div>

      {!isLocked && <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} />}
      {!isLocked && pathname !== "/dashboard/ayo" && <AyoChatWidget />}
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}