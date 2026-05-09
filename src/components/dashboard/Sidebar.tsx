"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { removeToken } from "@/lib/api";
import { clearUserCache } from "@/lib/hooks/useUser";

/* ─────────────────────────────────────────────────────────────────
   NAV DATA
   icon: string = path to your Figma-exported SVG in /public/icons/
   When you export from Figma, drop the SVG files into:
     /public/icons/nav/dashboard.svg
     /public/icons/nav/music.svg
     etc.
   Then update the icon paths below to match your filenames.
───────────────────────────────────────────────────────────────── */
const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "/images/home.svg" },
  { label: "Your Music", href: "/dashboard/music", icon: "/images/dashboard-music.svg" },
  { label: "Earnings", href: "/dashboard/earnings", icon: "/images/money.svg" },
  { label: "Analytics", href: "/dashboard/analytics", icon: "/images/analytics-dashboard.svg" },
  { label: "Royalty Report", href: "/dashboard/royalties", icon: "/images/document.svg" },
];

const AI_TOOLS = [
  { label: "Ayo AI", href: "/dashboard/ayo", icon: "/images/ayo.svg", highlight: true },
];

const ARTIST_TOOLS = [
  { label: "Splitr", href: "/dashboard/splitr", icon: "/images/splitr.svg" },
  { label: "Amplify", href: "/dashboard/amplify", icon: "/images/megaphone.svg" },
  { label: "Release Links", href: "/dashboard/release-links", icon: "/images/link.svg" },
  { label: "Playlist Portal", href: "/dashboard/playlist-portal", icon: "/images/playlist-broken.svg" },
];

const SETTINGS_NAV = [
  { label: "Settings", href: "/dashboard/settings", icon: "/images/settings.svg" },
];


/* ─────────────────────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────────────────────── */
function NavItem({
  item,
  pathname,
  collapsed,
}: {
  item: { label: string; href: string; icon: string; highlight?: boolean };
  pathname: string;
  collapsed: boolean;
}) {
  const active = pathname === item.href;

  return (
    <li className="relative group/item">
      <Link
        href={item.href}
        className={[
          "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200",
          collapsed ? "justify-center" : "",
          active
            ? item.highlight
              ? "bg-[#C30100]/20 text-[#C30100]"
              : "bg-white/[0.08] text-white"
            : "text-white/60 hover:text-white hover:bg-white/[0.05]",
        ].join(" ")}
      >
        {/* Icon — Figma SVG via next/image */}
        <span className={[
          "shrink-0 w-[18px] h-[18px] relative transition-opacity",
          active ? "opacity-100" : "opacity-40 group-hover/item:opacity-70",
        ].join(" ")}>
          <Image
            src={item.icon}
            alt={item.label}
            fill
            className="object-contain"
            // SVGs don't need size optimisation
            unoptimized
          />
        </span>

        {/* Label — hidden when collapsed */}
        {!collapsed && (
          <span className="font-body text-sm truncate">{item.label}</span>
        )}
      </Link>

      {/* Tooltip — only shown when collapsed */}
      {collapsed && (
        <div
          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                     opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
        >
          <div className="relative">
            {/* Arrow */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-0 h-0"
              style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: "6px solid #1A0808" }}
            />
            <span className="block whitespace-nowrap bg-[#1A0808] border border-white/[0.08] text-white font-body text-xs rounded-lg px-3 py-2 shadow-xl">
              {item.label}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAV SECTION
───────────────────────────────────────────────────────────────── */
function NavSection({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string;
  items: { label: string; href: string; icon: string; highlight?: boolean }[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div>
      {/* Section label — hidden when collapsed, replaced by a divider */}
      {collapsed ? (
        <div className="h-px bg-white/[0.06] mx-2 mb-2" />
      ) : (
        <p className="font-heading text-white/30 uppercase text-[10px] tracking-[0.25em] px-3 mb-2">
          {label}
        </p>
      )}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────────── */
interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
  user?: { first_name: string; last_name: string; email: string } | null;
}

export default function Sidebar({ onClose, isMobile, user }: SidebarProps) {
  const displayName = user
    ? `${user.first_name} ${user.last_name}`.trim()
    : "Artist";
  const avatar = "/images/avatar-artiste.svg"; // swap for user.avatar when API provides it
  const plan = "Growth Plan"; // swap for user.account_type when API provides it
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
        collapsed ? "w-[64px]" : "w-[185px]",
      ].join(" ")}
    >
      {/* Logo + collapse toggle */}
      <div className={[
        "flex items-center pt-5 pb-6 px-4 gap-2",
        collapsed ? "justify-center" : "justify-between",
      ].join(" ")}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="relative shrink-0">
               <Image src="/images/logo.svg" alt="Songdis" priority width={120} height={32} className="h-8 w-auto object-contain" />
            </div>
           
          </Link>
        )}

        {collapsed && (
          <Link href="/dashboard" className="relative shrink-0">
           <Image src="/images/logo-half.svg" alt="Songdis" priority width={120} height={32} className="h-8 w-auto object-contain" />
          </Link>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-white/30 hover:text-white transition-colors focus-visible:outline-none p-1 rounded"
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>

          {/* Mobile close */}
          {isMobile && !collapsed && (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 flex flex-col gap-5">
        <NavSection label="Main"         items={MAIN_NAV}     pathname={pathname} collapsed={collapsed} />
        <NavSection label="AI Tools"     items={AI_TOOLS}     pathname={pathname} collapsed={collapsed} />
        <NavSection label="Artist Tools" items={ARTIST_TOOLS} pathname={pathname} collapsed={collapsed} />
        <NavSection label="Settings"     items={SETTINGS_NAV} pathname={pathname} collapsed={collapsed} />
      </nav>

      {/* Bottom: logout + user */}
      <div className={["px-2 pb-4 flex flex-col gap-3", collapsed ? "items-center" : ""].join(" ")}>
        {/* Logout */}
        <div className="relative group/logout w-full">
          <button
            onClick={handleLogout}
            className={[
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#C30100] hover:bg-[#C30100]/10 transition-colors w-full",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <span className="shrink-0 w-[18px] h-[18px] relative">
              <Image src="/images/logout.svg" alt="Log Out" fill className="object-contain" unoptimized />
            </span>
            {!collapsed && <span className="font-body text-sm">Log Out</span>}
          </button>

          {/* Logout tooltip */}
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/logout:opacity-100 transition-opacity duration-150">
              <span className="block whitespace-nowrap bg-[#1A0808] border border-white/[0.08] text-white font-body text-xs rounded-lg px-3 py-2 shadow-xl">
                Log Out
              </span>
            </div>
          )}
        </div>

        {/* User pill */}
        {collapsed ? (
          <div className="relative group/user">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 cursor-pointer">
              <Image src={avatar} alt={displayName} fill className="object-cover" />
            </div>
            <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 opacity-0 group-hover/user:opacity-100 transition-opacity duration-150">
              <div className="bg-[#1A0808] border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
                <p className="font-heading text-white text-xs uppercase tracking-wide whitespace-nowrap">{displayName}</p>
                <p className="font-body text-white/40 text-[10px] whitespace-nowrap">{plan}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
              <Image src={avatar} alt={displayName} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-white text-xs uppercase tracking-wide truncate">{displayName}</p>
              <p className="font-body text-white/40 text-[10px] truncate">{plan}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ─── Toggle icons (keep as inline SVG — no Figma export needed) ─ */
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