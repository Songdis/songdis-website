"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { removeToken } from "@/lib/api/auth";
import { clearUserCache } from "@/lib/hooks/useUser";
import { useBilling } from "@/lib/hooks/useBilling";
import { ANALYTICS_V2_ENABLED } from "@/lib/featureFlags";

const ROSTER_NAV = { label: "Roster", href: "/dashboard/label", svgIcon: <RosterIcon /> };

const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "/images/home.svg" },
  { label: "Earnings", href: "/dashboard/earnings", icon: "/images/money.svg" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "/images/analytics-dashboard.svg" },
  { label: "Royalty Report", href: "/dashboard/royalties", icon: "/images/document.svg" },
];

const RELEASE_CHILDREN: { label: string; href: string; icon?: string; svgIcon?: React.ReactNode; badge?: string }[] = [
  { label: "Your Music", href: "/dashboard/music", icon: "/images/dashboard-music.svg" },
  { label: "Videos", href: "/dashboard/videos", svgIcon: <VideoIcon /> },
  { label: "Migrations", href: "/dashboard/migrations", badge: "NEW", svgIcon: <MigrationsIcon /> },
];

const AI_TOOLS = [
  { label: "Ayo", href: "/dashboard/ayo", icon: "/images/ayo.svg", highlight: true },
];

const ARTIST_TOOLS = [
  { label: "Press Kit", href: "/dashboard/press-kit", badge: "NEW", svgIcon: <PressKitIcon /> },
  { label: "Splitr", href: "/dashboard/splitr", icon: "/images/splitr.svg" },
  { label: "Amplify", href: "/dashboard/amplify", icon: "/images/megaphone.svg" },
  { label: "Release Links", href: "/dashboard/release-links", icon: "/images/link.svg" },
  { label: "Playlist Portal", href: "/dashboard/playlist-portal", icon: "/images/playlist-broken.svg" },
];

const SETTINGS_NAV = [
  { label: "Settings", href: "/dashboard/settings", icon: "/images/settings.svg" },
];


function NavItem({
  item,
  pathname,
  collapsed,
  isLocked,
}: {
  item: { label: string; href: string; icon?: string; highlight?: boolean; badge?: string; svgIcon?: React.ReactNode };
  pathname: string;
  collapsed: boolean;
  isLocked?: boolean;
}) {
  const active = pathname === item.href;
  const blocked = isLocked && item.href !== "/dashboard" && item.href !== "/dashboard/settings";

  return (
    <li className="relative group/item">
      {blocked ? (
        <span
          className={[
            "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200 cursor-not-allowed opacity-30",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <span className="shrink-0 w-4 h-4 relative flex items-center justify-center opacity-40">
            {item.svgIcon ?? (
              item.icon ? <Image src={item.icon} alt={item.label} fill className="object-contain" unoptimized /> : null
            )}
          </span>
          {!collapsed && (
            <span className="font-body text-[13px] flex items-center gap-1.5 truncate">
              {item.label}
            </span>
          )}
        </span>
      ) : (
        <Link
          href={item.href}
          className={[
            "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200",
            collapsed ? "justify-center" : "",
            active
              ? item.highlight
                ? "bg-[#C30100]/20 text-[#C30100]"
                : "bg-white/[0.08] text-white"
              : "text-white/60 hover:text-white hover:bg-white/[0.05]",
          ].join(" ")}
        >
          <span className={[
            "shrink-0 w-4 h-4 relative transition-opacity flex items-center justify-center",
            active ? "opacity-100" : "opacity-40 group-hover/item:opacity-70",
          ].join(" ")}>
            {item.svgIcon ?? (
              item.icon ? <Image src={item.icon} alt={item.label} fill className="object-contain" unoptimized /> : null
            )}
          </span>
          {!collapsed && (
            <span className="font-body text-[13px] flex items-center gap-1.5 truncate">
              {item.label}
              {item.badge && (
                <span className="text-[8px] font-heading tracking-widest px-1 py-px rounded-sm bg-[#C30100]/20 text-[#C30100] leading-none">
                  {item.badge}
                </span>
              )}
            </span>
          )}
        </Link>
      )}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-0 h-0"
              style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: "6px solid #1A0808" }} />
            <span className="block whitespace-nowrap bg-[#1A0808] border border-white/[0.08] text-white font-body text-xs rounded-lg px-3 py-2 shadow-xl">
              {item.label}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}


function NavSection({
  label,
  items,
  pathname,
  collapsed,
  isLocked,
}: {
  label: string;
  items: { label: string; href: string; icon?: string; highlight?: boolean; badge?: string; svgIcon?: React.ReactNode }[];
  pathname: string;
  collapsed: boolean;
  isLocked?: boolean;
}) {
  return (
    <div>
      {collapsed ? (
        <div className="h-px bg-white/[0.06] mx-2 mb-1.5" />
      ) : (
        <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] px-2.5 mb-1.5">
          {label}
        </p>
      )}
      <ul className="flex flex-col gap-px">
        {items.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
        ))}
      </ul>
    </div>
  );
}


function ReleaseDropdown({
  pathname,
  collapsed,
  isLocked,
}: {
  pathname: string;
  collapsed: boolean;
  isLocked?: boolean;
}) {
  const isActive = RELEASE_CHILDREN.some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  if (isLocked) {
    return (
      <li className="relative group/item">
        <span className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200 cursor-not-allowed opacity-30">
          <span className="shrink-0 w-4 h-4 relative flex items-center justify-center opacity-40">
            <ReleaseIcon />
          </span>
          {!collapsed && (
            <span className="font-body text-[13px] flex-1">Release</span>
          )}
        </span>
      </li>
    );
  }

  return (
    <li className="relative group/item">
      {/* Parent toggle */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-200 w-full text-left",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-white/[0.08] text-white"
            : "text-white/60 hover:text-white hover:bg-white/[0.05]",
        ].join(" ")}
      >
        <span className="shrink-0 w-4 h-4 relative transition-opacity flex items-center justify-center opacity-40 group-hover/item:opacity-70">
          <ReleaseIcon />
        </span>
        {!collapsed && (
          <>
            <span className="font-body text-[13px] flex-1">Release</span>
            <span className="text-white/25 transition-transform">
              {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </span>
          </>
        )}
      </button>

      {/* Collapsed tooltip */}
      {collapsed && (
        <div className="pointer-events-none absolute left-full top-0 ml-3 z-50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
          <div className="relative pt-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-0 h-0"
              style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: "6px solid #1A0808" }} />
            <div className="bg-[#1A0808] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
              <p className="font-heading text-white text-[10px] uppercase tracking-widest mb-1.5">Release</p>
              {RELEASE_CHILDREN.map((child) => (
                <Link key={child.href} href={child.href}
                  className={[
                    "flex items-center gap-2 py-1 rounded transition-colors",
                    pathname === child.href ? "text-white" : "text-white/50 hover:text-white",
                  ].join(" ")}>
                  <span className="w-3 h-3 shrink-0 flex items-center justify-center">
                    {"svgIcon" in child && child.svgIcon ? child.svgIcon : (
                      "icon" in child && child.icon ? <Image src={child.icon} alt="" width={12} height={12} className="object-contain" unoptimized /> : null
                    )}
                  </span>
                  <span className="font-body text-[11px]">{child.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Children (expanded only) */}
      {open && !collapsed && (
        <ul className="flex flex-col gap-px ml-4 mt-px">
          {RELEASE_CHILDREN.map((child) => (
            <li key={child.href} className="relative group/child">
              <Link
                href={child.href}
                className={[
                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-200",
                  pathname === child.href
                    ? "bg-white/[0.08] text-white"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]",
                ].join(" ")}
              >
                <span className={[
                  "shrink-0 w-3.5 h-3.5 relative transition-opacity flex items-center justify-center",
                  pathname === child.href ? "opacity-100" : "opacity-40 group-hover/child:opacity-70",
                ].join(" ")}>
                  {"svgIcon" in child && child.svgIcon ? child.svgIcon : (
                    "icon" in child && child.icon ? <Image src={child.icon} alt={child.label} fill className="object-contain" unoptimized /> : null
                  )}
                </span>
                <span className="font-body text-[12px] flex items-center gap-1.5 truncate">
                  {child.label}
                  {child.badge && (
                    <span className="text-[7px] font-heading tracking-widest px-1 py-px rounded-sm bg-[#C30100]/20 text-[#C30100] leading-none">
                      {child.badge}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}


function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function ChevronUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}
function MigrationsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}
function ReleaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}
function PressKitIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22V4a2 2 0 0 1 2-2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>
      <path d="M15 2v5h5"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  );
}
function RosterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="15" height="16" rx="2"/>
      <polygon points="22 7 17 12 22 17"/>
    </svg>
  );
}


interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  isLocked?: boolean;
  user?: { first_name: string; last_name: string; email: string; avatar_url?: string } | null;
}

export default function Sidebar({ onClose, isMobile, user, isLocked = false }: SidebarProps) {
  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() : "Artist";
  const avatar = user?.avatar_url || "/images/avatar-artiste.svg";
  const { planName, isExpired, hasSubscription, endDate, isLabel } = useBilling(0);
  const showRoster = ANALYTICS_V2_ENABLED && isLabel;
  const plan = planName ?? "Free Plan";
  const expiryLabel = isLocked
    ? (isExpired || hasSubscription ? "Expired" : "No plan")
    : endDate && Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000) <= 3
      ? `Expires ${Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000))}d`
      : null;
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    removeToken();
    clearUserCache();
    router.push("/sign-in");
  };

  return (
    <aside
      className={[
        "flex flex-col h-full bg-[#140C0C] border-r border-white/[0.06] shrink-0 transition-all duration-300",
        collapsed ? "w-[64px]" : "w-[220px] lg:w-[185px]",
      ].join(" ")}
    >
      {/* Logo + collapse */}
      <div className={[
        "flex items-center pt-5 pb-5 px-3 gap-2",
        collapsed ? "justify-center" : "justify-between",
      ].join(" ")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <Image src="/images/logo.svg" alt="Songdis" priority width={120} height={32} className="h-8 w-auto object-contain" />
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="relative shrink-0">
            <Image src="/images/logo-half.svg" alt="Songdis" priority width={120} height={32} className="h-8 w-auto object-contain" />
          </Link>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-white/30 hover:text-white transition-colors focus-visible:outline-none p-1 rounded"
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
          {isMobile && !collapsed && (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 flex flex-col gap-4">
        <div>
          <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] px-2.5 mb-1.5">Main</p>
          <ul className="flex flex-col gap-px">
            <NavItem item={MAIN_NAV[0]} pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
            {showRoster && (
              <NavItem item={ROSTER_NAV} pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
            )}
            <ReleaseDropdown pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
            {MAIN_NAV.slice(1).map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
            ))}
          </ul>
        </div>
        <NavSection label="AI Tools"     items={AI_TOOLS}     pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
        <NavSection label="Artist Tools" items={ARTIST_TOOLS} pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
        <NavSection label="Settings"     items={SETTINGS_NAV} pathname={pathname} collapsed={collapsed} isLocked={isLocked} />
      </nav>

      {/* Bottom */}
      <div className={["px-2 pb-4 flex flex-col gap-2.5", collapsed ? "items-center" : ""].join(" ")}>
        <div className="relative group/logout w-full">
          <button
            onClick={handleLogout}
            className={[
              "flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#C30100] hover:bg-[#C30100]/10 transition-colors w-full",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <span className="shrink-0 w-4 h-4 relative">
              <Image src="/images/logout.svg" alt="Log Out" fill className="object-contain" unoptimized />
            </span>
            {!collapsed && <span className="font-body text-[13px]">Log Out</span>}
          </button>
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/logout:opacity-100 transition-opacity duration-150">
              <span className="block whitespace-nowrap bg-[#1A0808] border border-white/[0.08] text-white font-body text-xs rounded-lg px-3 py-2 shadow-xl">
                Log Out
              </span>
            </div>
          )}
        </div>

        {collapsed ? (
          <div className="relative group/user">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 cursor-pointer">
              <Image src={avatar} alt={displayName} fill className="object-cover" unoptimized />
            </div>
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/user:opacity-100 transition-opacity duration-150">
              <div className="bg-[#1A0808] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
                <p className="font-heading text-white text-xs uppercase tracking-wide whitespace-nowrap">{displayName}</p>
                <p className="font-body text-white/40 text-[10px] whitespace-nowrap">{plan}{expiryLabel ? ` \u00b7 ${expiryLabel}` : ""}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-white/10">
              <Image src={avatar} alt={displayName} fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-white text-[11px] uppercase tracking-wide truncate">{displayName}</p>
              <p className={`font-body text-[9px] truncate ${isLocked ? "text-[#C30100]" : "text-white/40"}`}>
                {plan}{expiryLabel ? ` \u00b7 ${expiryLabel}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}


function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
