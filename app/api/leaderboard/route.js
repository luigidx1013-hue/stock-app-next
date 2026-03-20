import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getCurrentLeaderboardMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedMonth = searchParams.get("month");
    const month = requestedMonth || getCurrentLeaderboardMonth();

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("predictions")
      .select(
        "user_id, display_name, accuracy_score, direction_correct, status, leaderboard_month"
      )
      .eq("status", "scored")
      .eq("leaderboard_month", month);

    if (error) {
      throw error;
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
      const accuracy = Number(row.accuracy_score || 0);

      user.predictions_count += 1;
      user.total_score += accuracy;

      if (row.direction_correct === true) {
        user.correct_directions += 1;
      }

      user.best_score = Math.max(user.best_score, accuracy);
    }

    const leaderboard = Array.from(grouped.values())
      .filter((user) => user.predictions_count >= 1)
      .map((user) => ({
        user_id: user.user_id,
        display_name: user.display_name,
        predictions_count: user.predictions_count,
        average_score: Number(
          (user.total_score / user.predictions_count).toFixed(2)
        ),
        direction_rate: Number(
          ((user.correct_directions / user.predictions_count) * 100).toFixed(0)
        ),
        best_score: Number(user.best_score.toFixed(2)),
      }))
      .sort((a, b) => {
        if (b.average_score !== a.average_score) {
          return b.average_score - a.average_score;
        }
        if (b.predictions_count !== a.predictions_count) {
          return b.predictions_count - a.predictions_count;
        }
        return b.best_score - a.best_score;
      });

    return NextResponse.json({
      ok: true,
      month,
      rows: leaderboard,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Failed to load leaderboard",
      },
      { status: 500 }
    );
  }
}