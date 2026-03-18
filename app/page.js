import Link from "next/link";

const quickLinks = [
  {
    title: "Analyzer",
    description:
      "Run a full stock projection using price history, SEC fundamentals, volatility, and news sentiment.",
    href: "/analyzer",
    button: "Open Analyzer",
  },
  {
    title: "Watchlists",
    description:
      "See the stocks you’ve saved and build out your personal research list.",
    href: "/watchlists",
    button: "View Watchlists",
  },
  {
    title: "Dashboard",
    description:
      "Jump into your authenticated workspace and manage your account-based experience.",
    href: "/dashboard",
    button: "Go to Dashboard",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 24px 64px",
        background:
          "linear-gradient(135deg, #08112b 0%, #020817 55%, #0b2447 100%)",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(10px)",
            borderRadius: "24px",
            padding: "40px 32px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#86efac",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "18px",
              letterSpacing: "0.3px",
            }}
          >
            Stock Projection Platform
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 4rem)",
              lineHeight: 1.05,
              margin: "0 0 16px",
              fontWeight: 800,
            }}
          >
            Research stocks with a cleaner, smarter home base.
          </h1>

          <p
            style={{
              maxWidth: "760px",
              fontSize: "1.05rem",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.78)",
              margin: 0,
            }}
          >
            Analyze stocks, save tickers to your watchlist, and build toward a
            more complete investing workflow with authenticated, user-specific
            data.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
              marginTop: "28px",
            }}
          >
            <Link href="/analyzer" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#22c55e",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(34,197,94,0.28)",
                }}
              >
                Start Analyzing
              </button>
            </Link>

            <Link href="/watchlists" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Open Watchlists
              </button>
            </Link>

            <Link href="/login" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "12px 18px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Log In
              </button>
            </Link>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          {quickLinks.map((item) => (
            <div
              key={item.href}
              style={{
                borderRadius: "22px",
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
              }}
            >
              <h2
                style={{
                  margin: "0 0 10px",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                }}
              >
                {item.title}
              </h2>

              <p
                style={{
                  margin: "0 0 20px",
                  color: "rgba(255,255,255,0.74)",
                  lineHeight: 1.65,
                  minHeight: "78px",
                }}
              >
                {item.description}
              </p>

              <Link href={item.href} style={{ textDecoration: "none" }}>
                <button
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(10,132,255,0.16)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {item.button}
                </button>
              </Link>
            </div>
          ))}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
          }}
        >
          <div
            style={{
              borderRadius: "22px",
              padding: "24px",
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                color: "#93c5fd",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Current Build
            </div>
            <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem" }}>
              Full-stack foundation is live
            </h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.74)", lineHeight: 1.65 }}>
              You now have authentication, protected routes, Supabase-backed
              watchlists, and a working analyzer pipeline.
            </p>
          </div>

          <div
            style={{
              borderRadius: "22px",
              padding: "24px",
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                color: "#86efac",
                fontWeight: 700,
                marginBottom: "10px",
              }}
            >
              Next Up
            </div>
            <h3 style={{ margin: "0 0 10px", fontSize: "1.2rem" }}>
              Expand the user experience
            </h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.74)", lineHeight: 1.65 }}>
              Next improvements can include delete actions, duplicate protection,
              richer watchlist cards, saved analyses, and dashboard summaries.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}