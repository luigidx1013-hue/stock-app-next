"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function getCurrentLeaderboardMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function medalFor(rank) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return "#";
}

export default function LeaderboardPreview() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = useMemo(() => getCurrentLeaderboardMonth(), []);

  useEffect(() => {
    async function loadLeaderboardPreview() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/leaderboard?month=${encodeURIComponent(currentMonth)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload = await res.json();

        if (!res.ok || !payload.ok) {
          throw new Error(payload.error || "Failed to load leaderboard preview");
        }

        setRows((payload.rows || []).slice(0, 3));
      } catch (error) {
        console.error(error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    loadLeaderboardPreview();
  }, [currentMonth]);

  return (
    <section
      style={{
        marginTop: "28px",
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(10px)",
        borderRadius: "24px",
        padding: "28px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.9rem",
              color: "#fcd34d",
              fontWeight: 700,
              marginBottom: "8px",
            }}
          >
            Live Competition
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.6rem",
              fontWeight: 800,
            }}
          >
            Top performers this month
          </h2>
        </div>

        <Link
          href="/leaderboard"
          style={{
            textDecoration: "none",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontWeight: 700,
          }}
        >
          View Full Leaderboard
        </Link>
      </div>

      {loading ? (
        <div
          style={{
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.74)",
          }}
        >
          Loading leaderboard...
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            borderRadius: "18px",
            padding: "18px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.74)",
          }}
        >
          No scored predictions yet this month.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {rows.map((row, index) => {
            const rank = index + 1;

            return (
              <div
                key={row.user_id}
                style={{
                  borderRadius: "20px",
                  padding: "22px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    rank === 1
                      ? "linear-gradient(180deg, rgba(250,204,21,0.16), rgba(255,255,255,0.03))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.03))",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 800,
                    }}
                  >
                    {medalFor(rank)} #{rank}
                  </div>

                  <div
                    style={{
                      fontSize: "0.85rem",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: "rgba(34,197,94,0.14)",
                      border: "1px solid rgba(34,197,94,0.28)",
                      color: "#86efac",
                      fontWeight: 700,
                    }}
                  >
                    {row.average_score}% avg
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    marginBottom: "12px",
                  }}
                >
                  {row.display_name}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "14px",
                      padding: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                      }}
                    >
                      Predictions
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>
                      {row.predictions_count}
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: "14px",
                      padding: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                      }}
                    >
                      Direction
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>
                      {row.direction_rate}%
                    </div>
                  </div>

                  <div
                    style={{
                      borderRadius: "14px",
                      padding: "12px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: "4px",
                      }}
                    >
                      Best
                    </div>
                    <div style={{ fontSize: "1rem", fontWeight: 700 }}>
                      {row.best_score}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}