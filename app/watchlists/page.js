import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function WatchlistsPage() {
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

  async function deleteWatchlistItem(formData) {
    "use server";

    const supabase = await createClient();
    const id = formData.get("id");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !id) {
      return;
    }

    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("DELETE ERROR:", error);
    }

    redirect("/watchlists");
  }

  const { data: watchlist, error } = await supabase
    .from("watchlists")
    .select("id, ticker, created_at, user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("WATCHLIST ERROR:", error);
  }

  let pricesMap = {};

  if (watchlist?.length) {
    const tickers = watchlist.map((w) => w.ticker);

    try {
      const res = await fetch(
        `https://stooq.com/q/l/?s=${tickers.join(",").toLowerCase()}&f=sd2t2ohlcv&h&e=csv`,
        { cache: "no-store" }
      );

      const text = await res.text();
      const lines = text.split("\n").slice(1);

      lines.forEach((line) => {
        const parts = line.split(",");
        const symbol = parts[0]?.trim().toUpperCase();
        const close = parseFloat(parts[6]);

        if (symbol && !Number.isNaN(close)) {
          pricesMap[symbol] = close;
        }
      });
    } catch (err) {
      console.error("PRICE FETCH ERROR:", err);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "#0b1120",
        color: "white",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ marginBottom: "8px" }}>My Watchlist</h1>
          <p style={{ opacity: 0.75, marginBottom: "12px" }}>
            Logged in as: {user.email}
          </p>
          <LogoutButton />
        </div>

        {!watchlist?.length ? (
          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
            }}
          >
            <p style={{ marginBottom: "12px" }}>No stocks added yet.</p>
            <Link
              href="/analyzer"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background: "#2563eb",
                color: "white",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Go to Analyzer
            </Link>
          </div>
        ) : (
          <ul style={{ marginTop: "20px", paddingLeft: 0, listStyle: "none" }}>
            {watchlist.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: "16px",
                  marginBottom: "12px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "white",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Link
                      href={`/analyzer?ticker=${item.ticker}`}
                      style={{
                        color: "white",
                        textDecoration: "none",
                        fontSize: "18px",
                        fontWeight: 700,
                      }}
                    >
                      {item.ticker}
                    </Link>

                    <span style={{ opacity: 0.75, fontSize: "14px" }}>
                      {pricesMap[item.ticker]
                        ? `$${pricesMap[item.ticker].toFixed(2)}`
                        : "—"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      opacity: 0.7,
                      marginTop: "4px",
                    }}
                  >
                    Added: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>

                <form action={deleteWatchlistItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    style={{
                      padding: "8px 12px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}