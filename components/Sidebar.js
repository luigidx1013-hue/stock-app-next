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
  Sparkles,
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
      <div
        className="brand"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "6px 4px 18px",
          marginBottom: "10px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background:
              "linear-gradient(135deg, rgba(34,197,94,1) 0%, rgba(59,130,246,1) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 12px 28px rgba(34,197,94,0.18), 0 6px 18px rgba(59,130,246,0.18)",
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0))",
            }}
          />
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "relative", zIndex: 1 }}
          >
            <path d="M4 16l4.5-4.5 3 3L20 6.5" />
            <path d="M15 6.5H20v5" />
          </svg>
        </div>

        <div style={{ minWidth: 0 }}>
          <div
            className="brand-title"
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f8fafc",
              lineHeight: 1.05,
            }}
          >
            Market Arena
          </div>

          <div
            className="brand-sub"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "4px",
              color: "rgba(226,232,240,0.78)",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            <Sparkles size={12} />
            Predict. Compete. Win.
          </div>
        </div>
      </div>

      <nav className="nav-list" style={{ display: "grid", gap: "8px" }}>
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "13px 14px",
                borderRadius: "16px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1rem",
                color: active ? "#ffffff" : "rgba(226,232,240,0.82)",
                background: active
                  ? "linear-gradient(135deg, rgba(37,99,235,0.28), rgba(30,64,175,0.22))"
                  : "transparent",
                border: active
                  ? "1px solid rgba(96,165,250,0.28)"
                  : "1px solid transparent",
                boxShadow: active
                  ? "0 10px 24px rgba(15,23,42,0.32), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "none",
                transition:
                  "transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.08)";
                  e.currentTarget.style.transform = "translateX(2px)";
                  e.currentTarget.style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.color = "rgba(226,232,240,0.82)";
                }
              }}
            >
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} strokeWidth={2.2} />
              </span>

              <span>{link.label}</span>

              {active ? (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    background: "#4ade80",
                    boxShadow: "0 0 14px rgba(74,222,128,0.8)",
                    flexShrink: 0,
                  }}
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}