"use client";

import { useState } from "react";
import PriceChart from "@/components/PriceChart";
import { calcReturnPercent, fmtBigNumber, fmtMoney, fmtPercent, sentimentLabel } from "@/lib/format";

function FactRows({ rows, formatter = (x) => x }) {
  if (!rows?.length) {
    return (
      <tbody>
        <tr><td colSpan="2">No recent data</td></tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {rows.slice(-5).reverse().map((r, index) => (
        <tr key={`${r.fy || r.end}-${index}`}>
          <td>{r.fy || new Date(r.end).getFullYear()}</td>
          <td>{formatter(r.val)}</td>
        </tr>
      ))}
    </tbody>
  );
}

export default function AnalyzerClient() {
  const [ticker, setTicker] = useState("AAPL");
  const [status, setStatus] = useState("Ready.");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function analyzeTicker() {
    const cleanTicker = ticker.trim().toUpperCase();

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

  const model = data?.model;
  const fundamentals = data?.fundamentals;
  const news = data?.news || [];
  const sentiment = sentimentLabel(model?.avgNewsSentiment ?? 0);

  return (
    <>
      <section className="hero">
        <div>
          <h1>Stock Projection Analyzer</h1>
          <p>
            Enter a U.S. stock ticker to build a multi-year projection using historical price action,
            SEC-reported earnings and revenue, recent headline sentiment, volatility, and a blended
            technical plus valuation model.
          </p>
        </div>

        <div className="searchbar">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && analyzeTicker()}
            placeholder="Enter ticker (AAPL, MSFT, NVDA)"
          />
          <button onClick={analyzeTicker} disabled={loading}>
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
                  <h2 className="card-title">{data.companyName} ({data.ticker})</h2>
                  <div className="card-sub">{data.exchange || "Exchange unavailable"} · SEC + Stooq + Google News</div>
                </div>
                <div className={`pill ${sentiment.cls}`}>News sentiment: {sentiment.text}</div>
              </div>
              <div className="card-body">
                <div className="stats">
                  <div className="stat"><div className="stat-label">Latest Price</div><div className="stat-value">{fmtMoney(model.latestPrice)}</div></div>
                  <div className="stat"><div className="stat-label">Annual Drift Estimate</div><div className="stat-value">{fmtPercent(model.annualDrift)}</div></div>
                  <div className="stat"><div className="stat-label">Annual Volatility</div><div className="stat-value">{fmtPercent(model.annualVol)}</div></div>
                  <div className="stat"><div className="stat-label">Forward P/E Used</div><div className="stat-value">{model.forwardPE ? model.forwardPE.toFixed(2) : "—"}</div></div>
                </div>
              </div>
            </div>

            <div className="card span-8">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Historical Price vs Projection</h3>
                  <div className="card-sub">Recent Stooq history plus 5-year projected path</div>
                </div>
              </div>
              <div className="card-body">
                <PriceChart prices={data.prices} projections={model.projections} />
              </div>
            </div>

            <div className="card span-4">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Signal Snapshot</h3>
                  <div className="card-sub">Trend, returns, growth, sentiment</div>
                </div>
              </div>
              <div className="card-body">
                <div className="stats" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="stat"><div className="stat-label">1-Year Return</div><div className="stat-value">{fmtPercent(model.oneYearReturn)}</div></div>
                  <div className="stat"><div className="stat-label">3-Year CAGR</div><div className="stat-value">{fmtPercent(model.threeYearCagr)}</div></div>
                  <div className="stat"><div className="stat-label">EPS Growth Used</div><div className="stat-value">{fmtPercent(model.epsGrowth)}</div></div>
                  <div className="stat"><div className="stat-label">News Sentiment</div><div className="stat-value">{model.avgNewsSentiment.toFixed(2)} ({sentiment.text})</div></div>
                </div>
              </div>
            </div>

            <div className="card span-12">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Projection Table</h3>
                  <div className="card-sub">Bear, base, and bull cases</div>
                </div>
              </div>
              <div className="card-body">
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Projected EPS</th>
                        <th>Technical Price</th>
                        <th>Valuation Price</th>
                        <th>Blended Base</th>
                        <th>Upside / Downside</th>
                        <th>Bear Case</th>
                        <th>Bull Case</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.projections.map((p) => {
                        const upsidePct = calcReturnPercent(p.blendedPrice, model.latestPrice);
                        const upsideClass = upsidePct !== null ? (upsidePct >= 0 ? "good" : "bad") : "";
                        return (
                          <tr key={p.year}>
                            <td>{p.year}</td>
                            <td>{p.projectedEPS !== null ? `$${p.projectedEPS.toFixed(2)}` : "—"}</td>
                            <td>{fmtMoney(p.technicalPrice)}</td>
                            <td>{p.valuationPrice !== null ? fmtMoney(p.valuationPrice) : "—"}</td>
                            <td><strong>{fmtMoney(p.blendedPrice)}</strong></td>
                            <td className={upsideClass}><strong>{fmtPercent(upsidePct)}</strong></td>
                            <td className="bad">{fmtMoney(p.bearPrice)}</td>
                            <td className="good">{fmtMoney(p.bullPrice)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="card span-6">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Fundamentals from SEC</h3>
                  <div className="card-sub">Recent annual revenue, net income, and EPS</div>
                </div>
              </div>
              <div className="card-body">
                <div className="mini-grid">
                  <div>
                    <h4 style={{ marginTop: 0 }}>Revenue</h4>
                    <div className="table-wrap"><table><thead><tr><th>FY</th><th>Value</th></tr></thead><FactRows rows={fundamentals.revenue} formatter={fmtBigNumber} /></table></div>
                  </div>
                  <div>
                    <h4 style={{ marginTop: 0 }}>EPS</h4>
                    <div className="table-wrap"><table><thead><tr><th>FY</th><th>Value</th></tr></thead><FactRows rows={fundamentals.eps} formatter={(v) => `$${Number(v).toFixed(2)}`} /></table></div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <h4>Net Income</h4>
                  <div className="table-wrap"><table><thead><tr><th>FY</th><th>Value</th></tr></thead><FactRows rows={fundamentals.netIncome} formatter={fmtBigNumber} /></table></div>
                </div>
              </div>
            </div>

            <div className="card span-6">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Recent News</h3>
                  <div className="card-sub">Headlines used for simple sentiment scoring</div>
                </div>
              </div>
              <div className="card-body">
                <div className="news-list">
                  {news.length ? news.slice(0, 8).map((item, index) => {
                    const headlineSentiment = sentimentLabel(item.sentimentScore);
                    return (
                      <div className="news-item" key={`${item.link}-${index}`}>
                        <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
                        <div className="news-meta">
                          {new Date(item.pubDate).toLocaleString()} · <span className={headlineSentiment.cls}>{headlineSentiment.text}</span> · Score {item.sentimentScore}
                        </div>
                      </div>
                    );
                  }) : <div className="news-item">No recent headlines found.</div>}
                </div>
              </div>
            </div>

            <div className="card span-12">
              <div className="card-header">
                <div>
                  <h3 className="card-title">How This Model Works</h3>
                  <div className="card-sub">Important assumptions and limitations</div>
                </div>
              </div>
              <div className="card-body explain">
                This tool blends long-run price trend, recent performance, moving-average trend,
                annualized volatility, simple headline sentiment, and SEC-reported EPS and revenue growth.
                It combines a technical projection with a valuation estimate based on projected EPS
                times a bounded forward P/E ratio. This is a screening and idea-generation tool, not a
                DCF model or an investment recommendation.
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
