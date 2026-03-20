"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function fmtMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusStyles(status) {
  if (status === "scored") {
    return {
      background: "rgba(34,197,94,0.14)",
      border: "1px solid rgba(34,197,94,0.28)",
      color: "#86efac",
    };
  }

  return {
    background: "rgba(251,191,36,0.14)",
    border: "1px solid rgba(251,191,36,0.28)",
    color: "#fde68a",
  };
}

function StatCard({ label, value, accent = "#93c5fd" }) {
  return (
    <div
      style={{
        borderRadius: "18px",
        padding: "18px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          fontSize: "0.82rem",
          color: accent,
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "white",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const supabase = createClient();

  const [mounted, setMounted] = useState(false);
  const [ticker, setTicker] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [price, setPrice] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadPredictions() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error(error);
      setPredictions([]);
    } else {
      setPredictions(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!mounted) return;
    loadPredictions();
  }, [mounted]);

  const stats = useMemo(() => {
    const open = predictions.filter((p) => p.status !== "scored");
    const scored = predictions.filter((p) => p.status === "scored");

    const avgAccuracy =
      scored.length > 0
        ? (
            scored.reduce(
              (sum, row) => sum + Number(row.accuracy_score || 0),
              0
            ) / scored.length
          ).toFixed(1)
        : "—";

    const directionRate =
      scored.length > 0
        ? `${Math.round(
            (scored.filter((row) => row.direction_correct === true).length /
              scored.length) *
              100
          )}%`
        : "—";

    return {
      openCount: open.length,
      scoredCount: scored.length,
      avgAccuracy: avgAccuracy === "—" ? "—" : `${avgAccuracy}%`,
      directionRate,
    };
  }, [predictions]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must be logged in to place a prediction.");
      setSubmitting(false);
      return;
    }

    const cleanTicker = ticker.trim().toUpperCase();
    const numericPrice = Number(price);

    if (!cleanTicker || !targetDate || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setMessage("Enter a valid ticker, expiry date, and target price.");
      setSubmitting(false);
      return;
    }

    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Anonymous";

    const { error } = await supabase.from("predictions").insert({
      ticker: cleanTicker,
      target_date: targetDate,
      predicted_price: numericPrice,
      user_id: user.id,
      display_name: displayName,
    });

    if (error) {
      console.error(error);
      setMessage("Error saving prediction.");
      setSubmitting(false);
      return;
    }

    setTicker("");
    setTargetDate("");
    setPrice("");
    setMessage("Prediction placed.");
    await loadPredictions();
    setSubmitting(false);
  }

  if (!mounted) {
    return (
      <div className="page-shell">
        <div className="panel">
          <div className="empty-state">Loading predictions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(280px, 0.8fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          className="panel"
          style={{
            padding: "26px",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(10,20,40,0.92))",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 180,
              height: 180,
              borderRadius: "999px",
              background: "rgba(34,197,94,0.08)",
              filter: "blur(8px)",
            }}
          />

          <div
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: "999px",
              background: "rgba(34,197,94,0.14)",
              border: "1px solid rgba(34,197,94,0.28)",
              color: "#86efac",
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: "14px",
            }}
          >
            Prediction Ticket
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "2rem",
              fontWeight: 800,
            }}
          >
            Place your next call
          </h1>

          <p
            style={{
              margin: "0 0 22px",
              color: "rgba(255,255,255,0.72)",
              lineHeight: 1.65,
              maxWidth: "720px",
            }}
          >
            Pick a ticker, choose an expiry date, and enter your target price.
            Your call gets tracked here and scored later against real outcomes.
          </p>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#cbd5e1",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                  }}
                >
                  Ticker
                </label>
                <input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#cbd5e1",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                  }}
                >
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#cbd5e1",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                  }}
                >
                  Target Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="225.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "14px 14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "14px 18px",
                  borderRadius: "14px",
                  border: "none",
                  background: submitting ? "#166534" : "#22c55e",
                  color: "white",
                  fontWeight: 800,
                  cursor: submitting ? "default" : "pointer",
                  boxShadow: "0 10px 24px rgba(34,197,94,0.22)",
                  minWidth: "170px",
                }}
              >
                {submitting ? "Placing..." : "Place Prediction"}
              </button>

              {message ? (
                <div
                  style={{
                    color: message === "Prediction placed." ? "#86efac" : "#fca5a5",
                    fontWeight: 600,
                  }}
                >
                  {message}
                </div>
              ) : null}
            </div>
          </form>
        </div>

        <div
          style={{
            display: "grid",
            gap: "14px",
            alignContent: "start",
          }}
        >
          <StatCard
            label="Open Predictions"
            value={stats.openCount}
            accent="#93c5fd"
          />
          <StatCard
            label="Scored Predictions"
            value={stats.scoredCount}
            accent="#86efac"
          />
          <StatCard
            label="Average Accuracy"
            value={stats.avgAccuracy}
            accent="#fcd34d"
          />
          <StatCard
            label="Direction Rate"
            value={stats.directionRate}
            accent="#c4b5fd"
          />
        </div>
      </div>

      <div className="panel" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <div className="eyebrow">Your Book</div>
            <h2
              style={{
                margin: "6px 0 0",
                fontSize: "1.5rem",
                fontWeight: 800,
              }}
            >
              Open and scored predictions
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading predictions...</div>
        ) : predictions.length === 0 ? (
          <div className="empty-state">No predictions yet. Place your first call above.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {predictions.map((p) => {
              const badge = statusStyles(p.status);

              return (
                <div
                  key={p.id}
                  style={{
                    borderRadius: "18px",
                    padding: "18px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 2fr)",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        flexWrap: "wrap",
                        marginBottom: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 800,
                          color: "white",
                        }}
                      >
                        {p.ticker}
                      </div>

                      <span
                        style={{
                          ...badge,
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {p.status === "scored" ? "Scored" : "Pending"}
                      </span>
                    </div>

                    <div
                      style={{
                        color: "rgba(255,255,255,0.68)",
                        lineHeight: 1.7,
                        fontSize: "0.95rem",
                      }}
                    >
                      <div>Placed: {fmtDate(p.submitted_at || p.created_at)}</div>
                      <div>Expiry: {fmtDate(p.target_date)}</div>
                      <div>Target: {fmtMoney(p.predicted_price)}</div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        borderRadius: "14px",
                        padding: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "rgba(255,255,255,0.6)",
                          marginBottom: "6px",
                        }}
                      >
                        Actual Price
                      </div>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: "white",
                        }}
                      >
                        {p.status === "scored" ? fmtMoney(p.actual_price) : "Waiting"}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: "14px",
                        padding: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "rgba(255,255,255,0.6)",
                          marginBottom: "6px",
                        }}
                      >
                        Accuracy
                      </div>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: "white",
                        }}
                      >
                        {p.status === "scored"
                          ? `${Number(p.accuracy_score || 0).toFixed(2)}`
                          : "Pending"}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: "14px",
                        padding: "14px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "rgba(255,255,255,0.6)",
                          marginBottom: "6px",
                        }}
                      >
                        Direction
                      </div>
                      <div
                        style={{
                          fontSize: "1.05rem",
                          fontWeight: 800,
                          color: "white",
                        }}
                      >
                        {p.status === "scored"
                          ? p.direction_correct
                            ? "Correct"
                            : "Incorrect"
                          : "Open"}
                      </div>
                    </div>
                  </div>

                  {p.summary ? (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: "14px",
                        color: "rgba(255,255,255,0.72)",
                        lineHeight: 1.65,
                      }}
                    >
                      {p.summary}
                    </div>
                  ) : p.status !== "scored" ? (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        borderTop: "1px solid rgba(255,255,255,0.06)",
                        paddingTop: "14px",
                        color: "rgba(255,255,255,0.62)",
                        lineHeight: 1.65,
                      }}
                    >
                      This prediction is waiting for its target date before it can be scored.
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}