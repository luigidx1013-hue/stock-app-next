"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import { createClient } from "@/lib/supabase/client";
import {
  calcReturnPercent,
  fmtBigNumber,
  fmtMoney,
  fmtPercent,
  sentimentLabel,
} from "@/lib/format";

function InfoTooltip({ text }) {
  return (
    <span
      title={text}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        marginLeft: "6px",
        borderRadius: "999px",
        background: "rgba(148, 163, 184, 0.18)",
        color: "#cbd5e1",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "help",
        verticalAlign: "middle",
      }}
    >
      i
    </span>
  );
}

function FactRows({ rows, formatter = (x) => x }) {
  if (!rows?.length) {
    return (
      <tbody>
        <tr>
          <td colSpan="2">No recent data</td>
        </tr>
      </tbody>
    );
  }

  const normalized = rows.map((r) => ({
    ...r,
    year: r.fy || new Date(r.end).getFullYear(),
  }));

  normalized.sort((a, b) => b.year - a.year);

  const seen = new Set();
  const cleaned = [];

  for (const r of normalized) {
    if (!seen.has(r.year)) {
      seen.add(r.year);
      cleaned.push(r);
    }
  }

  const finalRows = cleaned.slice(0, 5);

  return (
    <tbody>
      {finalRows.map((r, index) => (
        <tr key={`${r.year}-${index}`}>
          <td>{r.year}</td>
          <td>{formatter(r.val)}</td>
        </tr>
      ))}
    </tbody>
  );
}

export default function AnalyzerClient() {
  const searchParams = useSearchParams();

  const [ticker, setTicker] = useState(searchParams.get("ticker") || "");
  const [status, setStatus] = useState("Ready.");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [savingAnalysis, setSavingAnalysis] = useState(false);

  const model = data?.model;
  const fundamentals = data?.fundamentals;
  const news = data?.news || [];
  const sentiment = sentimentLabel(model?.avgNewsSentiment ?? 0);

  const fairValues = model?.assumptions?.fairValues || null;
  const normalizedGrowth = model?.assumptions?.normalizedGrowth ?? null;
  const scenarioPEs = model?.assumptions?.scenarioPEs || null;
  const scenarioGrowths = model?.assumptions?.scenarioGrowths || null;

  const baseUpside = useMemo(() => {
    if (!fairValues?.base || !model?.latestPrice) return null;
    return calcReturnPercent(fairValues.base, model.latestPrice);
  }, [fairValues, model?.latestPrice]);

  async function runAnalysis(inputTicker) {
    const cleanTicker = inputTicker.trim().toUpperCase();

    if (!cleanTicker) {
      setStatus("Please enter a ticker.");
      return;
    }

    if (!/^[A-Z]{1,5}$/.test(cleanTicker)) {
      setStatus("Please enter a valid ticker symbol (1–5 letters only).");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setData(null);
      setStatus(`Analyzing ${cleanTicker}...`);

      const res = await fetch(`/api/analyze/${encodeURIComponent(cleanTicker)}`);
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload.error || "Analysis failed.");
      }

      setData(payload);
      setStatus(`Finished analyzing ${cleanTicker}.`);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const urlTicker = searchParams.get("ticker");
    if (urlTicker) {
      const clean = urlTicker.toUpperCase();
      setTicker(clean);
      runAnalysis(clean);
    }
  }, [searchParams]);

  async function handleAddToWatchlist() {
    if (!data?.ticker) {
      alert("Analyze a stock first.");
      return;
    }

    try {
      setSavingWatchlist(true);

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);

      if (!user) {
        alert("You must be logged in to add to your watchlist.");
        return;
      }

      const { error: insertError } = await supabase.from("watchlists").insert([
        {
          user_id: user.id,
          ticker: data.ticker,
        },
      ]);

      if (insertError) {
        if (insertError.code === "23505") {
          alert(`${data.ticker} is already in your watchlist.`);
          return;
        }
        throw new Error(insertError.message);
      }

      alert(`${data.ticker} added to watchlist!`);
    } catch (err) {
      alert(err.message || "Error adding to watchlist.");
    } finally {
      setSavingWatchlist(false);
    }
  }

  async function handleSaveAnalysis() {
    if (!data || !model) {
      alert("Analyze a stock first.");
      return;
    }

    try {
      setSavingAnalysis(true);

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(userError.message);

      if (!user) {
        alert("You must be logged in to save an analysis.");
        return;
      }

      const { error: insertError } = await supabase.from("analyses").insert([
        {
          user_id: user.id,
          ticker: data.ticker,
          price: model.latestPrice ?? null,
          drift: model.annualDrift ?? null,
          volatility: model.annualVol ?? null,
          forward_pe: model.forwardPE ?? null,
        },
      ]);

      if (insertError) throw new Error(insertError.message);

      alert(`${data.ticker} analysis saved.`);
    } catch (err) {
      alert(err.message || "Failed to save analysis.");
    } finally {
      setSavingAnalysis(false);
    }
  }

  return (
    <>
      <section className="hero">
        <h1>Stock Projection Analyzer</h1>

        <div className="searchbar">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && runAnalysis(ticker)}
            placeholder="Enter ticker (AAPL, JPM, NVDA)"
          />
          <button onClick={() => runAnalysis(ticker)} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Stock"}
          </button>
        </div>

        <div className="status">{status}</div>
      </section>

      {error && !data ? <div className="placeholder-card">{error}</div> : null}

      {data && model ? (
        <section>
          <div className="grid">
            <div className="card span-12">
              <div className="card-header">
                <div>
                  <h2 className="card-title">
                    {data.companyName} ({data.ticker})
                  </h2>
                  <div className="card-sub">
                    {data.exchange || "Exchange unavailable"} · SEC + Stooq + Google News
                  </div>
                </div>
                <div className={`pill ${sentiment.cls}`}>
                  News sentiment: {sentiment.text}
                </div>
              </div>

              <div className="card-body">
                <div className="stats">
                  <div className="stat">
                    <div className="stat-label">Latest Price</div>
                    <div className="stat-value">{fmtMoney(model.latestPrice)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Base Fair Value
                      <InfoTooltip text="Base-case valuation from projected EPS multiplied by the base scenario P/E multiple." />
                    </div>
                    <div className="stat-value">
                      {fairValues?.base != null ? fmtMoney(fairValues.base) : "—"}
                    </div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Base Upside / Downside
                      <InfoTooltip text="Difference between current price and base-case fair value." />
                    </div>
                    <div className="stat-value">
                      {baseUpside != null ? fmtPercent(baseUpside) : "—"}
                    </div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Forward P/E Used
                      <InfoTooltip text="Valuation multiple applied to projected earnings to estimate fair value." />
                    </div>
                    <div className="stat-value">
                      {model.forwardPE != null ? model.forwardPE.toFixed(2) : "—"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={handleAddToWatchlist}
                    disabled={savingWatchlist}
                    style={{
                      padding: "8px 12px",
                      background: "#22c55e",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: savingWatchlist ? "not-allowed" : "pointer",
                      opacity: savingWatchlist ? 0.7 : 1,
                    }}
                  >
                    {savingWatchlist ? "Adding..." : "Add to Watchlist"}
                  </button>

                  <button
                    onClick={handleSaveAnalysis}
                    disabled={savingAnalysis}
                    style={{
                      padding: "8px 12px",
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: savingAnalysis ? "not-allowed" : "pointer",
                      opacity: savingAnalysis ? 0.7 : 1,
                    }}
                  >
                    {savingAnalysis ? "Saving..." : "Save Analysis"}
                  </button>
                </div>
              </div>
            </div>

            <div className="card span-8">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Historical Price vs Projection</h3>
                  <div className="card-sub">
                    Historical prices with mean-reverting monthly base-case path
                  </div>
                </div>
              </div>
              <div className="card-body">
                <PriceChart
                  historical={data.prices}
                  projections={model.monthlyPath || []}
                   projectionBands={model.projectionBands || []}
                />
              </div>
            </div>

            <div className="card span-4">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Signal Snapshot</h3>
                  <div className="card-sub">
                    Trend, returns, growth, valuation, sentiment
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="stats" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="stat">
                    <div className="stat-label">1Y Return</div>
                    <div className="stat-value">{fmtPercent(model.oneYearReturn)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">3Y CAGR</div>
                    <div className="stat-value">{fmtPercent(model.threeYearCagr)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Annual Drift
                      <InfoTooltip text="Historical price-based expected return estimate used in the monthly projection path." />
                    </div>
                    <div className="stat-value">{fmtPercent(model.annualDrift)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Annual Volatility
                      <InfoTooltip text="Historical annualized volatility estimate. Higher means larger price swings." />
                    </div>
                    <div className="stat-value">{fmtPercent(model.annualVol)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      EPS Growth
                      <InfoTooltip text="Recent EPS trend used as one input into the blended growth estimate." />
                    </div>
                    <div className="stat-value">{fmtPercent(model.epsGrowth)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Revenue Growth
                      <InfoTooltip text="Recent revenue trend used as one input into the blended growth estimate." />
                    </div>
                    <div className="stat-value">{fmtPercent(model.revenueGrowth)}</div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Normalized Growth
                      <InfoTooltip text="Capped blended growth estimate combining recent EPS trend, revenue trend, and a small sentiment adjustment." />
                    </div>
                    <div className="stat-value">
                      {normalizedGrowth != null ? fmtPercent(normalizedGrowth) : "—"}
                    </div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      News Sentiment
                      <InfoTooltip text="Average sentiment score from recent news headlines." />
                    </div>
                    <div className="stat-value">
                      {model.avgNewsSentiment != null
                        ? `${model.avgNewsSentiment.toFixed(2)} (${sentiment.text})`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card span-12">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Valuation Scenarios</h3>
                  <div className="card-sub">
                    One-year EPS, fair value, and upside/downside by scenario
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Bear EPS</th>
                        <th>Base EPS</th>
                        <th>Bull EPS</th>
                        <th>Base Upside / Downside</th>
                        <th>Bear Price</th>
                        <th>Base Price</th>
                        <th>Bull Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(model.projections || []).map((p) => {
                        const upsidePct = calcReturnPercent(
                          p.blendedPrice,
                          model.latestPrice
                        );

                        const upsideClass =
                          upsidePct != null ? (upsidePct >= 0 ? "good" : "bad") : "";

                        return (
                          <tr key={p.year}>
                            <td>{p.year}</td>
                            <td>
                              {p.projectedBearEPS != null
                                ? `$${p.projectedBearEPS.toFixed(2)}`
                                : "—"}
                            </td>
                            <td>
                              {p.projectedBaseEPS != null
                                ? `$${p.projectedBaseEPS.toFixed(2)}`
                                : "—"}
                            </td>
                            <td>
                              {p.projectedBullEPS != null
                                ? `$${p.projectedBullEPS.toFixed(2)}`
                                : "—"}
                            </td>
                            <td className={upsideClass}>
                              <strong>{fmtPercent(upsidePct)}</strong>
                            </td>
                            <td className="bad">{fmtMoney(p.bearPrice)}</td>
                            <td>
                              <strong>{fmtMoney(p.blendedPrice)}</strong>
                            </td>
                            <td className="good">{fmtMoney(p.bullPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <div className="stat">
                    <div className="stat-label">
                      Forward EPS Used
                      <InfoTooltip text="EPS anchor used by the valuation engine before projecting future earnings." />
                    </div>
                    <div className="stat-value">
                      {model.assumptions?.forwardEPS != null
                        ? `$${Number(model.assumptions.forwardEPS).toFixed(2)}`
                        : "—"}
                    </div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Scenario P/Es
                      <InfoTooltip text="Bear, base, and bull valuation multiples used to convert projected EPS into fair values." />
                    </div>
                    <div className="stat-value" style={{ fontSize: "0.95rem" }}>
                      {scenarioPEs
                        ? `${scenarioPEs.bearPE.toFixed(2)} / ${scenarioPEs.basePE.toFixed(
                            2
                          )} / ${scenarioPEs.bullPE.toFixed(2)}`
                        : "—"}
                    </div>
                  </div>

                  <div className="stat">
                    <div className="stat-label">
                      Scenario Growths
                      <InfoTooltip text="Bear, base, and bull growth assumptions derived from the normalized growth estimate." />
                    </div>
                    <div className="stat-value" style={{ fontSize: "0.95rem" }}>
                      {scenarioGrowths
                        ? `${fmtPercent(scenarioGrowths.bearGrowth)} / ${fmtPercent(
                            scenarioGrowths.baseGrowth
                          )} / ${fmtPercent(scenarioGrowths.bullGrowth)}`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card span-6">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Fundamentals from SEC</h3>
                  <div className="card-sub">
                    Recent annual revenue, net income, and EPS
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="mini-grid">
                  <div>
                    <h4 style={{ marginTop: 0 }}>Revenue</h4>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>FY</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <FactRows rows={fundamentals?.revenue} formatter={fmtBigNumber} />
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ marginTop: 0 }}>EPS</h4>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>FY</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <FactRows
                          rows={fundamentals?.eps}
                          formatter={(v) => `$${Number(v).toFixed(2)}`}
                        />
                      </table>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <h4>Net Income</h4>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>FY</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <FactRows
                        rows={fundamentals?.netIncome}
                        formatter={fmtBigNumber}
                      />
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="card span-6">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent News</h3>
                  <div className="card-sub">
                    Headlines used for simple sentiment scoring
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="news-list">
                  {news.length ? (
                    news.slice(0, 5).map((n, i) => (
                      <div className="news-item" key={i}>
                        {n.title}
                      </div>
                    ))
                  ) : (
                    <div className="news-item">No recent headlines found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}