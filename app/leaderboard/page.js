"use client";

import { useEffect, useMemo, useState } from "react";

function getCurrentLeaderboardMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const currentMonth = useMemo(() => getCurrentLeaderboardMonth(), []);

  async function loadLeaderboard() {
    setLoading(true);
    setErrorMessage("");

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
        throw new Error(payload.error || "Failed to load leaderboard");
      }

      setRows(payload.rows || []);
    } catch (err) {
      console.error(err);
      setRows([]);
      setErrorMessage(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaderboard();
  }, [currentMonth]);

  return (
    <div className="page-shell">
      <div className="panel hero-panel">
        <div className="eyebrow">Competition</div>
        <h1 className="page-title">Monthly Leaderboard</h1>
        <p className="page-subtitle">
          Ranked by average prediction accuracy for {currentMonth}. This resets each month without deleting history.
        </p>
      </div>

      <div className="panel">
        {loading ? (
          <div className="empty-state">Loading leaderboard...</div>
        ) : errorMessage ? (
          <div className="empty-state">{errorMessage}</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No scored predictions yet this month.</div>
        ) : (
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Avg Score</th>
                  <th>Predictions</th>
                  <th>Direction %</th>
                  <th>Best Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.user_id}>
                    <td>
                      <span className={`rank-badge rank-${index + 1}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td>{row.display_name}</td>
                    <td>{row.average_score}</td>
                    <td>{row.predictions_count}</td>
                    <td>{row.direction_rate}%</td>
                    <td>{row.best_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}