"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getCurrentLeaderboardMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function LeaderboardPage() {
  const supabase = createClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = useMemo(() => getCurrentLeaderboardMonth(), []);

  async function loadLeaderboard() {
    setLoading(true);

    const { data, error } = await supabase
      .from("predictions")
      .select("user_id, display_name, accuracy_score, direction_correct, status, leaderboard_month")
      .eq("status", "scored")
      .eq("leaderboard_month", currentMonth)
      .order("accuracy_score", { ascending: false });

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    const grouped = new Map();

    for (const row of data || []) {
      const key = row.user_id;

      if (!grouped.has(key)) {
        grouped.set(key, {
          user_id: row.user_id,
          display_name: row.display_name || "Anonymous",
          predictions_count: 0,
          total_score: 0,
          correct_directions: 0,
          best_score: 0,
        });
      }

      const user = grouped.get(key);
      user.predictions_count += 1;
      user.total_score += Number(row.accuracy_score || 0);

      if (row.direction_correct === true) {
        user.correct_directions += 1;
      }

      user.best_score = Math.max(user.best_score, Number(row.accuracy_score || 0));
    }

    const leaderboard = Array.from(grouped.values())
      .filter((user) => user.predictions_count >= 1)
      .map((user) => ({
        ...user,
        average_score: Number((user.total_score / user.predictions_count).toFixed(2)),
        direction_rate: Number(
          ((user.correct_directions / user.predictions_count) * 100).toFixed(0)
        ),
      }))
      .sort((a, b) => {
        if (b.average_score !== a.average_score) return b.average_score - a.average_score;
        if (b.predictions_count !== a.predictions_count) return b.predictions_count - a.predictions_count;
        return b.best_score - a.best_score;
      });

    setRows(leaderboard);
    setLoading(false);
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

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
                      <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
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