import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function fmtMoney(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `$${Number(value).toFixed(2)}`;
}

function fmtPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  return `${Number(value).toFixed(2)}%`;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("USER ERROR:", userError);
  }

  if (!user) {
    redirect("/login");
  }

  const { data: analyses, error: analysesError } = await supabase
    .from("analyses")
    .select("id, ticker, price, drift, volatility, forward_pe, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: watchlist, error: watchlistError } = await supabase
    .from("watchlists")
    .select("id, ticker, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (analysesError) {
    console.error("ANALYSES ERROR:", analysesError);
  }

  if (watchlistError) {
    console.error("WATCHLIST ERROR:", watchlistError);
  }

  const analysisCount = analyses?.length || 0;
  const watchlistCount = watchlist?.length || 0;
  const latestAnalysis = analyses?.[0] || null;

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "#0b1120",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ marginBottom: "8px" }}>Dashboard</h1>
          <p style={{ opacity: 0.75 }}>
            Overview of your saved analyses and watchlist activity.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ opacity: 0.7, fontSize: "14px", marginBottom: "8px" }}>
              Saved Analyses
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700 }}>{analysisCount}</div>
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ opacity: 0.7, fontSize: "14px", marginBottom: "8px" }}>
              Watchlist Items
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700 }}>{watchlistCount}</div>
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ opacity: 0.7, fontSize: "14px", marginBottom: "8px" }}>
              Latest Saved Ticker
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700 }}>
              {latestAnalysis?.ticker || "—"}
            </div>
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ opacity: 0.7, fontSize: "14px", marginBottom: "8px" }}>
              Latest Saved Price
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700 }}>
              {fmtMoney(latestAnalysis?.price)}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              padding: "20px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <h2 style={{ margin: 0 }}>Recent Analyses</h2>
              <p style={{ opacity: 0.7, marginTop: "6px" }}>
                Your 10 most recent saved stock analyses.
              </p>
            </div>

            {!analyses?.length ? (
              <div>
                <p style={{ opacity: 0.8 }}>No saved analyses yet.</p>
                <Link
                  href="/analyzer"
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "10px 14px",
                    background: "#2563eb",
                    color: "white",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Go Analyze a Stock
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", opacity: 0.8 }}>
                      <th style={{ padding: "10px 8px" }}>Ticker</th>
                      <th style={{ padding: "10px 8px" }}>Price</th>
                      <th style={{ padding: "10px 8px" }}>Drift</th>
                      <th style={{ padding: "10px 8px" }}>Volatility</th>
                      <th style={{ padding: "10px 8px" }}>Forward P/E</th>
                      <th style={{ padding: "10px 8px" }}>Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyses.map((item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <td style={{ padding: "12px 8px", fontWeight: 700 }}>
                          <Link
                            href={`/analyzer?ticker=${item.ticker}`}
                            style={{
                              color: "white",
                              textDecoration: "none",
                            }}
                          >
                            {item.ticker}
                          </Link>
                        </td>
                        <td style={{ padding: "12px 8px" }}>{fmtMoney(item.price)}</td>
                        <td style={{ padding: "12px 8px" }}>{fmtPercent(item.drift)}</td>
                        <td style={{ padding: "12px 8px" }}>
                          {fmtPercent(item.volatility)}
                        </td>
                        <td style={{ padding: "12px 8px" }}>
                          {item.forward_pe !== null && item.forward_pe !== undefined
                            ? Number(item.forward_pe).toFixed(2)
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 8px", opacity: 0.75 }}>
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section
            style={{
              padding: "20px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ marginBottom: "14px" }}>
              <h2 style={{ margin: 0 }}>Watchlist</h2>
              <p style={{ opacity: 0.7, marginTop: "6px" }}>
                Your saved ticker symbols.
              </p>
            </div>

            {!watchlist?.length ? (
              <p style={{ opacity: 0.8 }}>No watchlist items yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {watchlist.map((item) => (
                  <Link
                    key={item.id}
                    href={`/analyzer?ticker=${item.ticker}`}
                    style={{
                      display: "block",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <div>{item.ticker}</div>
                    <div style={{ fontSize: "12px", opacity: 0.65, marginTop: "4px" }}>
                      Added {new Date(item.created_at).toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}