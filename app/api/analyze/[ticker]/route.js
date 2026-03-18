import {
  buildMonthlyPath,
  buildScenarioPE,
  calcCAGR,
  calcFairValue,
  normalizeGrowth,
  projectEPS,
} from "@/lib/projection";

const USER_AGENT = "StockProjectionSite/1.0 luigidx1013@gmail.com";

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = mean(arr.map((x) => (x - m) ** 2));
  return Math.sqrt(variance);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] || "").trim();
    });
    return row;
  });
}

function stripHtml(s) {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const out = [];
  let match;
  while ((match = regex.exec(xml)) !== null) out.push(stripHtml(match[1]));
  return out;
}

function scoreHeadline(text) {
  const positive = [
    "beat",
    "beats",
    "surge",
    "surges",
    "growth",
    "strong",
    "stronger",
    "record",
    "bullish",
    "upgrade",
    "upgrades",
    "expands",
    "expansion",
    "profit",
    "profits",
    "outperform",
    "outperforms",
    "win",
    "wins",
    "partnership",
    "launch",
    "raises",
    "raised",
    "improves",
    "improved",
  ];

  const negative = [
    "miss",
    "misses",
    "drop",
    "drops",
    "fall",
    "falls",
    "weak",
    "weaker",
    "cut",
    "cuts",
    "downgrade",
    "downgrades",
    "lawsuit",
    "probe",
    "risk",
    "risks",
    "decline",
    "declines",
    "warning",
    "warns",
    "slump",
    "slumps",
    "loss",
    "losses",
    "recall",
    "fraud",
    "delay",
    "delays",
  ];

  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  let score = 0;

  for (const w of words) {
    if (positive.includes(w)) score += 1;
    if (negative.includes(w)) score -= 1;
  }

  return score;
}

function annualizeReturn(totalReturn, years) {
  if (years <= 0) return 0;
  if (1 + totalReturn <= 0) return -1;
  return Math.pow(1 + totalReturn, 1 / years) - 1;
}

function formatCIK(cik) {
  return String(cik).padStart(10, "0");
}

async function fetchText(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return await res.text();
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  return await res.json();
}

async function fetchStooqHistory(ticker) {
  const symbol = `${ticker.toLowerCase()}.us`;
  const url = `https://stooq.com/q/d/l/?s=${symbol}&i=d`;
  const csv = await fetchText(url, { headers: { "User-Agent": USER_AGENT } });

  const rows = parseCsv(csv)
    .map((r) => ({
      date: r.Date,
      open: safeNumber(r.Open),
      high: safeNumber(r.High),
      low: safeNumber(r.Low),
      close: safeNumber(r.Close),
      volume: safeNumber(r.Volume),
    }))
    .filter((r) => r.date && r.close !== null);

  if (!rows.length) throw new Error("No Stooq history returned for that ticker.");
  return rows;
}

async function fetchTickerMap() {
  const data = await fetchJson(
    "https://www.sec.gov/files/company_tickers_exchange.json",
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    }
  );

  const map = new Map();
  for (const row of data.data || []) {
    const [cik, name, ticker, exchange] = row;
    if (ticker) map.set(String(ticker).toUpperCase(), { cik, name, exchange });
  }
  return map;
}

function getLatestAnnualFacts(factObj) {
  if (!factObj || !factObj.units) return [];

  const unitKeys = Object.keys(factObj.units);
  if (!unitKeys.length) return [];

  const entries = factObj.units[unitKeys[0]] || [];

  const annualEntries = entries
    .filter((x) => {
      const formOk = x.form === "10-K" || x.form === "10-K/A" || x.fp === "FY";
      const valueOk = safeNumber(x.val) !== null;
      const endOk = !!x.end;
      return formOk && valueOk && endOk;
    })
    .map((x) => {
      const year = Number.isFinite(Number(x.fy))
        ? Number(x.fy)
        : new Date(x.end).getFullYear();

      return {
        fy: year,
        end: x.end,
        val: safeNumber(x.val),
        filed: x.filed || null,
      };
    });

  const byYear = new Map();

  for (const row of annualEntries) {
    const existing = byYear.get(row.fy);

    if (!existing) {
      byYear.set(row.fy, row);
      continue;
    }

    const existingFiled = existing.filed ? new Date(existing.filed).getTime() : 0;
    const rowFiled = row.filed ? new Date(row.filed).getTime() : 0;

    const existingEnd = existing.end ? new Date(existing.end).getTime() : 0;
    const rowEnd = row.end ? new Date(row.end).getTime() : 0;

    if (
      rowFiled > existingFiled ||
      (rowFiled === existingFiled && rowEnd > existingEnd)
    ) {
      byYear.set(row.fy, row);
    }
  }

  return Array.from(byYear.values()).sort(
    (a, b) => new Date(a.end) - new Date(b.end)
  );
}

function pickFact(facts, namespace, names) {
  const ns = facts?.[namespace];
  if (!ns) return null;
  for (const name of names) {
    if (ns[name]) return ns[name];
  }
  return null;
}

async function fetchSecFundamentals(ticker) {
  const map = await fetchTickerMap();
  const item = map.get(String(ticker).toUpperCase());
  if (!item) throw new Error("Ticker not found in SEC mapping.");

  const cikPadded = formatCIK(item.cik);
  const companyFacts = await fetchJson(
    `https://data.sec.gov/api/xbrl/companyfacts/CIK${cikPadded}.json`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    }
  );

  const facts = companyFacts.facts || {};
  const revenueFact = pickFact(facts, "us-gaap", [
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "Revenues",
    "SalesRevenueNet",
  ]);
  const netIncomeFact = pickFact(facts, "us-gaap", ["NetIncomeLoss", "ProfitLoss"]);
  const epsFact = pickFact(facts, "us-gaap", [
    "EarningsPerShareDiluted",
    "EarningsPerShareBasic",
  ]);

  return {
    companyName: item.name,
    exchange: item.exchange,
    cik: cikPadded,
    revenue: getLatestAnnualFacts(revenueFact),
    netIncome: getLatestAnnualFacts(netIncomeFact),
    eps: getLatestAnnualFacts(epsFact),
  };
}

async function fetchNews(ticker, companyName = "") {
  const query = encodeURIComponent(`${ticker} ${companyName}`.trim());
  const xml = await fetchText(
    `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`,
    {
      headers: { "User-Agent": USER_AGENT },
    }
  );

  const titles = extractTag(xml, "title").slice(1);
  const links = extractTag(xml, "link").slice(1);
  const pubDates = extractTag(xml, "pubDate").slice(1);

  const items = [];
  const limit = Math.min(titles.length, links.length, pubDates.length, 12);

  for (let i = 0; i < limit; i++) {
    items.push({
      title: titles[i],
      link: links[i],
      pubDate: pubDates[i],
      sentimentScore: scoreHeadline(titles[i]),
    });
  }

  return items;
}

function estimateForwardEPS({ latestPrice, forwardPE, recentEps }) {
  const price = safeNumber(latestPrice);
  const pe = safeNumber(forwardPE);
  const impliedEPS = price != null && pe != null && pe > 0 ? price / pe : null;

  if (recentEps != null && recentEps > 0) {
    if (price != null) {
      const impliedTrailingPE = price / recentEps;
      if (impliedTrailingPE > 0 && impliedTrailingPE <= 120) {
        return recentEps;
      }
    } else {
      return recentEps;
    }
  }

  return impliedEPS;
}

function getRecentPositiveSeries(series, count = 3) {
  return (series || [])
    .filter((x) => x?.val != null && x.val > 0)
    .slice(-count);
}

function getRecentSeries(series, count = 3) {
  return (series || [])
    .filter((x) => x?.val != null)
    .slice(-count);
}

function projectScenarioPrices({
  ticker,
  latestPrice,
  recentEps,
  forwardPE,
  annualDrift,
  volatility,
  epsGrowth,
  revenueGrowth,
  avgNewsSentiment,
  years = 5,
}) {
  const forwardEPS = estimateForwardEPS({
    latestPrice,
    forwardPE,
    recentEps,
  });

  if (!forwardEPS || forwardEPS <= 0) {
    return {
      forwardEPS: null,
      normalizedGrowth: null,
      scenarioPEs: null,
      scenarioGrowths: null,
      projections: [],
      monthlyPath: [],
      fairValues: null,
    };
  }

  const normalizedGrowthRate = normalizeGrowth({
    epsCagr: epsGrowth,
    revenueCagr: revenueGrowth,
    sentimentScore: avgNewsSentiment,
  });

  const projectedEPSByYear = [];
  for (let year = 1; year <= years; year += 1) {
    projectedEPSByYear.push(projectEPS(forwardEPS, normalizedGrowthRate, year));
  }

  const scenarioPE = buildScenarioPE(forwardPE);

  const projections = projectedEPSByYear.map((eps, index) => {
    const year = index + 1;

    const bearPrice = calcFairValue(eps, scenarioPE.bear);
    const basePrice = calcFairValue(eps, scenarioPE.base);
    const bullPrice = calcFairValue(eps, scenarioPE.bull);

    return {
      year,
      projectedBearEPS: eps ? Number(eps.toFixed(2)) : null,
      projectedBaseEPS: eps ? Number(eps.toFixed(2)) : null,
      projectedBullEPS: eps ? Number(eps.toFixed(2)) : null,
      bearPrice: bearPrice ? Number(bearPrice.toFixed(2)) : null,
      blendedPrice: basePrice ? Number(basePrice.toFixed(2)) : null,
      bullPrice: bullPrice ? Number(bullPrice.toFixed(2)) : null,
    };
  });

  const oneYearEPS = projectEPS(forwardEPS, normalizedGrowthRate, 1);
  const bearFairValue = oneYearEPS ? calcFairValue(oneYearEPS, scenarioPE.bear) : null;
  const baseFairValue = oneYearEPS ? calcFairValue(oneYearEPS, scenarioPE.base) : null;
  const bullFairValue = oneYearEPS ? calcFairValue(oneYearEPS, scenarioPE.bull) : null;

  const fairValues =
    bearFairValue != null && baseFairValue != null && bullFairValue != null
      ? {
          bear: Number(bearFairValue.toFixed(2)),
          base: Number(baseFairValue.toFixed(2)),
          bull: Number(bullFairValue.toFixed(2)),
        }
      : null;

  const monthlyPath = fairValues?.base
    ? buildMonthlyPath({
        ticker,
        currentPrice: latestPrice,
        targetPrice: fairValues.base,
        months: 12,
        annualDrift,
        annualVolatility: volatility,
        meanReversionStrength: 0.35,
      }).map((point) => ({
        month: point.month,
        price: Number(point.price.toFixed(2)),
      }))
    : [];

const vol = clamp(safeNumber(volatility) ?? 0.25, 0.05, 1.0);

// confidence band width scaling (tune this later if needed)
const bandScale = 0.18;

const projectionBands = monthlyPath.map((point, index) => {
  const t = index + 1;

  // width grows over time (very important)
  const width = latestPrice * vol * Math.sqrt(t / 12) * bandScale;

  return {
    month: point.month,
    base: point.price,
    low: Number(Math.max(0, point.price - width).toFixed(2)),
    high: Number((point.price + width).toFixed(2)),
  };
});

  const uncertainty = clamp(vol * 0.35, 0.03, 0.10);

  return {
    forwardEPS: Number(forwardEPS.toFixed(2)),
    normalizedGrowth: Number((normalizedGrowthRate * 100).toFixed(2)),
    scenarioPEs: {
      bearPE: Number(scenarioPE.bear.toFixed(2)),
      basePE: Number(scenarioPE.base.toFixed(2)),
      bullPE: Number(scenarioPE.bull.toFixed(2)),
    },
    scenarioGrowths: {
      bearGrowth: Number(((normalizedGrowthRate - uncertainty) * 100).toFixed(2)),
      baseGrowth: Number((normalizedGrowthRate * 100).toFixed(2)),
      bullGrowth: Number(((normalizedGrowthRate + uncertainty) * 100).toFixed(2)),
    },
    fairValues,
    projections,
    monthlyPath,
    projectionBands,
  };
}

function buildProjection({ ticker, prices, fundamentals, news }) {
  const closes = prices.map((p) => p.close).filter((x) => x !== null);
  if (closes.length < 200) throw new Error("Not enough price history.");

  const latestPrice = closes[closes.length - 1];
  const oneYearAgoPrice = closes[Math.max(0, closes.length - 252)] || closes[0];
  const threeYearsAgoIndex = Math.max(0, closes.length - 252 * 3);
  const threeYearsAgoPrice = closes[threeYearsAgoIndex] || closes[0];

  const dailyReturns = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) {
      dailyReturns.push(closes[i] / closes[i - 1] - 1);
    }
  }

  const annualVol = stdDev(dailyReturns) * Math.sqrt(252);
  const oneYearReturn = latestPrice / oneYearAgoPrice - 1;
  const threeYearTotalReturn = latestPrice / threeYearsAgoPrice - 1;
  const threeYearCagr = annualizeReturn(threeYearTotalReturn, 3);

  const ma50 = mean(closes.slice(-50));
  const ma200 = mean(closes.slice(-200));
  const trendSignal = ma200 > 0 ? ma50 / ma200 - 1 : 0;

  const newsScores = news.map((n) => n.sentimentScore);
  const avgNewsSentiment = newsScores.length ? mean(newsScores) : 0;
  const newsAdjustment = clamp(avgNewsSentiment * 0.01, -0.03, 0.03);

  const epsSeries = (fundamentals.eps || []).filter((x) => x.val !== null);
  const recentEps = epsSeries.length ? epsSeries[epsSeries.length - 1].val : null;

  const recentPositiveEpsSeries = getRecentPositiveSeries(epsSeries, 3);

  let epsGrowth = 0.08;
  if (recentPositiveEpsSeries.length >= 2) {
    const start = recentPositiveEpsSeries[0]?.val;
    const end = recentPositiveEpsSeries[recentPositiveEpsSeries.length - 1]?.val;
    const years = recentPositiveEpsSeries.length - 1;

    if (start > 0 && end > 0 && years > 0) {
      epsGrowth = calcCAGR(start, end, years);
    } else {
      const priorEps =
        recentPositiveEpsSeries[recentPositiveEpsSeries.length - 2]?.val;
      if (recentEps !== null && priorEps !== null && Math.abs(priorEps) > 0.0001) {
        epsGrowth = recentEps / priorEps - 1;
      }
    }
  }
  epsGrowth = clamp(epsGrowth, -0.2, 0.3);

  const revenueSeries = (fundamentals.revenue || []).filter((x) => x.val !== null);
  const recentRevenueSeries = getRecentSeries(revenueSeries, 3);

  let revenueGrowth = 0.06;
  if (recentRevenueSeries.length >= 2) {
    const startRevenue = recentRevenueSeries[0]?.val;
    const endRevenue = recentRevenueSeries[recentRevenueSeries.length - 1]?.val;
    const years = recentRevenueSeries.length - 1;

    if (startRevenue > 0 && endRevenue > 0 && years > 0) {
      revenueGrowth = calcCAGR(startRevenue, endRevenue, years);
    } else {
      const prevRevenue = recentRevenueSeries[recentRevenueSeries.length - 2]?.val;
      const lastRevenue = recentRevenueSeries[recentRevenueSeries.length - 1]?.val;
      if (prevRevenue > 0 && lastRevenue > 0) {
        revenueGrowth = lastRevenue / prevRevenue - 1;
      }
    }
  }
  revenueGrowth = clamp(revenueGrowth, -0.15, 0.25);

  let trailingPE = null;
  if (recentEps && recentEps > 0) {
    trailingPE = latestPrice / recentEps;
  }

  let annualDrift =
    threeYearCagr * 0.4 +
    clamp(oneYearReturn, -0.3, 0.3) * 0.25 +
    clamp(trendSignal * 2, -0.15, 0.15) * 0.2 +
    newsAdjustment * 0.15;

  annualDrift -= clamp((annualVol - 0.25) * 0.25, 0, 0.1);
  annualDrift = clamp(annualDrift, -0.12, 0.22);

  let forwardPE = trailingPE;
  if (!forwardPE || !Number.isFinite(forwardPE) || forwardPE <= 0) {
    forwardPE = 18;
  }

  forwardPE = clamp(forwardPE, 8, 35);
  forwardPE *= 1 + clamp(newsAdjustment + trendSignal * 0.2, -0.1, 0.1);
  forwardPE = clamp(forwardPE, 8, 38);

  const scenarioModel = projectScenarioPrices({
    ticker,
    latestPrice,
    recentEps,
    forwardPE,
    annualDrift,
    volatility: annualVol,
    epsGrowth,
    revenueGrowth,
    avgNewsSentiment,
    years: 5,
  });

  return {
  latestPrice: Number(latestPrice.toFixed(2)),
  ma50: Number(ma50.toFixed(2)),
  ma200: Number(ma200.toFixed(2)),
  oneYearReturn: Number((oneYearReturn * 100).toFixed(2)),
  threeYearCagr: Number((threeYearCagr * 100).toFixed(2)),
  annualVol: Number((annualVol * 100).toFixed(2)),
  annualDrift: Number((annualDrift * 100).toFixed(2)),
  trailingPE: trailingPE ? Number(trailingPE.toFixed(2)) : null,
  forwardPE: Number(forwardPE.toFixed(2)),
  epsGrowth: Number((epsGrowth * 100).toFixed(2)),
  revenueGrowth: Number((revenueGrowth * 100).toFixed(2)),
  avgNewsSentiment: Number(avgNewsSentiment.toFixed(2)),
  assumptions: {
    forwardEPS: scenarioModel.forwardEPS,
    normalizedGrowth: scenarioModel.normalizedGrowth,
    scenarioGrowths: scenarioModel.scenarioGrowths,
    scenarioPEs: scenarioModel.scenarioPEs,
    fairValues: scenarioModel.fairValues,
  },
  projections: scenarioModel.projections,
  monthlyPath: scenarioModel.monthlyPath,
  projectionBands: scenarioModel.projectionBands,
};
}

export async function GET(_request, context) {
  try {
    const params = await context.params;
    const cleanTicker = String(params?.ticker || "").trim().toUpperCase();

    if (!cleanTicker) {
      return Response.json({ error: "Ticker is required." }, { status: 400 });
    }

    const prices = await fetchStooqHistory(cleanTicker);
    const fundamentals = await fetchSecFundamentals(cleanTicker);
    const news = await fetchNews(cleanTicker, fundamentals.companyName);

    const model = buildProjection({
      ticker: cleanTicker,
      prices,
      fundamentals,
      news,
    });

    return Response.json({
      ticker: cleanTicker,
      companyName: fundamentals.companyName,
      exchange: fundamentals.exchange,
      prices: prices.slice(-600),
      fundamentals,
      news,
      model,
    });
  } catch (err) {
    return Response.json(
      { error: err.message || "Analysis failed." },
      { status: 500 }
    );
  }
}