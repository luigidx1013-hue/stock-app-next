"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Target,
  Trophy,
  LayoutDashboard,
  Bookmark,
  User,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/analyzer", label: "Analyzer", icon: BarChart3 },
  { href: "/predictions", label: "Predictions", icon: Target },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlists", label: "Watchlists", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

function NavLinks({ pathname, onNavigate }) {
  return (
    <nav className="nav-list">
      {links.map((link) => {
        const isHome = link.href === "/";
        const active =
          pathname === link.href ||
          (!isHome && pathname.startsWith(`${link.href}/`));
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-link ${active ? "active" : ""}`}
            onClick={onNavigate}
          >
            <span className="nav-icon-wrap">
              <Icon size={18} strokeWidth={2.2} />
            </span>

            <span className="nav-label">{link.label}</span>

            {active ? <span className="nav-active-dot" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-logo">
        <div className="brand-logo-shine" />
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="brand-logo-svg"
        >
          <path d="M4 16l4.5-4.5 3 3L20 6.5" />
          <path d="M15 6.5H20v5" />
        </svg>
      </div>

      <div className="brand-text">
        <div className="brand-title">Market Arena</div>
        <div className="brand-sub">
          <Sparkles size={12} />
          <span>Predict. Compete. Win.</span>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="mobile-topbar">
        <div className="mobile-topbar-left">
          <div className="mobile-topbar-title">Market Arena</div>
          <div className="mobile-topbar-sub">Predict. Compete. Win.</div>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </header>

      <aside className="sidebar desktop-sidebar">
        <Brand />
        <NavLinks pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="mobile-drawer-wrap">
          <button
            className="mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu backdrop"
          />
          <aside className="mobile-drawer">
            <div className="mobile-drawer-header">
              <Brand />
              <button
                className="mobile-close-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <NavLinks
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}