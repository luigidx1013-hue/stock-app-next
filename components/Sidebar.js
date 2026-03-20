"use client";

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

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">📈</div>
        <div>
          <div className="brand-title">Stock Projection</div>
          <div className="brand-sub">Predict. Compete. Win.</div>
        </div>
      </div>

      <nav className="nav-list">
        {links.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}