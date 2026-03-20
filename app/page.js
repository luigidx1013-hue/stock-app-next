import Link from "next/link";
import LeaderboardPreview from "@/components/LeaderboardPreview";

const quickLinks = [
  {
    title: "Make Predictions",
    description:
      "Submit your own stock price predictions for future dates and track your accuracy over time.",
    href: "/predictions",
    button: "Start Predicting",
  },
  {
    title: "Leaderboard",
    description:
      "See how you rank against others based on prediction accuracy, consistency, and direction.",
    href: "/leaderboard",
    button: "View Rankings",
  },
  {
    title: "Analyzer",
    description:
      "Use stock projections, financials, and trends to inform your predictions.",
    href: "/analyzer",
    button: "Open Analyzer",
  },
  {
    title: "Watchlists",
    description: "Save and track stocks you’re actively predicting on.",
    href: "/watchlists",
    button: "View Watchlists",
  },
  {
    title: "Dashboard",
    description:
      "Track your predictions, performance, and saved activity in one place.",
    href: "/dashboard",
    button: "Go to Dashboard",
  },
  {
    title: "Profile",
    description:
      "View your stats, accuracy, and overall prediction performance.",
    href: "/profile",
    button: "Open Profile",
  },
];

const highlights = [
  {
    eyebrow: "Core Loop",
    eyebrowColor: "#93c5fd",
    title: "Predict → Get Scored → Improve",
    description:
      "Make predictions on future stock prices, get scored against real outcomes, and refine your strategy over time.",
  },
  {
    eyebrow: "Competition",
    eyebrowColor: "#86efac",
    title: "Climb the leaderboard",
    description:
      "Rank against other users based on accuracy, number of predictions, and directional performance.",
  },
  {
    eyebrow: "Edge",
    eyebrowColor: "#c4b5fd",
    title: "Data-backed decisions",
    description:
      "Use the analyzer to explore trends, growth signals, and projections before placing your predictions.",
  },
];

export default async function HomePage() {
  // Replace this with the same top-3 rows your leaderboard page already uses.
  // If you already have a helper/query there, import and reuse it here.
  const topLeaders = [];

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
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
            }}
          >
            Stock Prediction Platform
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              lineHeight: 1.05,
              margin: "0 0 16px",
              fontWeight: 800,
            }}
          >
            Predict stock prices.
            <br />
            Prove it with real results.
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
            Make predictions on where stocks are going, get scored based on real
            outcomes, and compete on accuracy through a live leaderboard.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "14px",
              marginTop: "28px",
            }}
          >
            <Link href="/predictions" style={{ textDecoration: "none" }}>
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
                Start Predicting
              </button>
            </Link>

            <Link href="/leaderboard" style={{ textDecoration: "none" }}>
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
                View Leaderboard
              </button>
            </Link>

            <Link href="/analyzer" style={{ textDecoration: "none" }}>
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
                Open Analyzer
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
              <h2 style={{ margin: "0 0 10px", fontWeight: 800 }}>
                {item.title}
              </h2>

              <p
                style={{
                  margin: "0 0 20px",
                  color: "rgba(255,255,255,0.74)",
                  lineHeight: 1.65,
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
          {highlights.map((item) => (
            <div
              key={item.title}
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
                  color: item.eyebrowColor,
                  fontWeight: 700,
                  marginBottom: "10px",
                }}
              >
                {item.eyebrow}
              </div>

              <h3 style={{ margin: "0 0 10px" }}>{item.title}</h3>

              <p
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.74)",
                  lineHeight: 1.65,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <LeaderboardPreview />
      </div>
    </main>
  );
}