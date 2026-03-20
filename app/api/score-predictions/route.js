import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

function normalizeTicker(ticker) {
  return String(ticker || "").trim().toLowerCase() + ".us";
}

function formatDateForStooq(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function computeAccuracyScore(predictedPrice, actualPrice) {
  if (!Number.isFinite(predictedPrice) || !Number.isFinite(actualPrice) || actualPrice <= 0) {
    return 0;
  }

  const percentError = Math.abs(predictedPrice - actualPrice) / actualPrice;
  return Math.max(0, Number((100 - percentError * 100).toFixed(2)));
}

function computeDirectionCorrect(startingPrice, predictedPrice, actualPrice) {
  if (
    !Number.isFinite(startingPrice) ||
    !Number.isFinite(predictedPrice) ||
    !Number.isFinite(actualPrice)
  ) {
    return null;
  }

  const predictedDirection = predictedPrice - startingPrice;
  const actualDirection = actualPrice - startingPrice;

  if (predictedDirection === 0 || actualDirection === 0) {
    return predictedDirection === actualDirection;
  }

  return (
    (predictedDirection > 0 && actualDirection > 0) ||
    (predictedDirection < 0 && actualDirection < 0)
  );
}

function buildSummary({
  ticker,
  predictedPrice,
  actualPrice,
  score,
  directionCorrect,
}) {
  const directionText =
    directionCorrect === null
      ? "Direction could not be evaluated."
      : directionCorrect
      ? "You correctly predicted the direction."
      : "You missed the direction.";

  return `Your prediction for ${ticker.toUpperCase()} was scored at ${score}. You predicted $${predictedPrice.toFixed(
    2
  )} and the actual price was $${actualPrice.toFixed(2)}. ${directionText}`;
}

async function fetchHistoricalRowsFromStooq(ticker) {
  const symbol = normalizeTicker(ticker);
  const url = `https://stooq.com/q/d/l/?s=${symbol}&i=d`;

  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Stooq data for ${ticker}`);
  }

  const csv = await res.text();
  const lines = csv.trim().split("\n");

  if (lines.length < 2) {
    return [];
  }

  const rows = lines.slice(1).map((line) => {
    const [date, open, high, low, close] = line.split(",");
    return {
      date,
      close: Number(close),
    };
  });

  return rows.filter((row) => row.date && Number.isFinite(row.close));
}

function findClosestTradingClose(rows, targetDateStr) {
  const target = formatDateForStooq(targetDateStr);
  if (!target) return null;

  const onOrAfter = rows.find((row) => row.date >= target);
  if (onOrAfter) return onOrAfter;

  return rows.length ? rows[rows.length - 1] : null;
}

function findStartingClose(rows, submittedAt) {
  const submittedDate = formatDateForStooq(submittedAt);
  if (!submittedDate) return null;

  const onOrAfter = rows.find((row) => row.date >= submittedDate);
  if (onOrAfter) return onOrAfter.close;

  return rows.length ? rows[rows.length - 1].close : null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const headerKey = request.headers.get("x-cron-secret");
const expectedKey = process.env.CRON_SECRET;

if (!expectedKey || headerKey !== expectedKey) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: predictions, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("status", "pending")
      .lte("target_date", today);

    if (error) {
      throw error;
    }

    let scoredCount = 0;
    const results = [];

    for (const prediction of predictions || []) {
      try {
        const rows = await fetchHistoricalRowsFromStooq(prediction.ticker);
        const actualRow = findClosestTradingClose(rows, prediction.target_date);

        if (!actualRow) {
          results.push({
            id: prediction.id,
            ticker: prediction.ticker,
            status: "skipped",
            reason: "No market data found",
          });
          continue;
        }

        const actualPrice = actualRow.close;
        const predictedPrice = Number(prediction.predicted_price);

        let startingPrice = Number(prediction.starting_price);
        if (!Number.isFinite(startingPrice)) {
          startingPrice = findStartingClose(rows, prediction.submitted_at);
        }

        const accuracyScore = computeAccuracyScore(predictedPrice, actualPrice);
        const directionCorrect = computeDirectionCorrect(
          startingPrice,
          predictedPrice,
          actualPrice
        );

        const summary = buildSummary({
          ticker: prediction.ticker,
          predictedPrice,
          actualPrice,
          score: accuracyScore,
          directionCorrect,
        });

        const { error: updateError } = await supabase
          .from("predictions")
          .update({
            starting_price: Number.isFinite(startingPrice) ? startingPrice : null,
            actual_price: actualPrice,
            accuracy_score: accuracyScore,
            direction_correct: directionCorrect,
            summary,
            scored_at: new Date().toISOString(),
            status: "scored",
          })
          .eq("id", prediction.id);

        if (updateError) {
          throw updateError;
        }

        scoredCount += 1;

        results.push({
          id: prediction.id,
          ticker: prediction.ticker,
          status: "scored",
          actual_price: actualPrice,
          accuracy_score: accuracyScore,
        });
      } catch (predictionError) {
        results.push({
          id: prediction.id,
          ticker: prediction.ticker,
          status: "error",
          error: predictionError.message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      scoredCount,
      totalDue: predictions?.length || 0,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Unexpected error",
      },
      { status: 500 }
    );
  }
}