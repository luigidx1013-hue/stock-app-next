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
    headers.forEach((h, i) => { row[h] = (values[i] || "").trim(); });
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
  const positive = ["beat", "beats", "surge", "surges", "growth", "strong", "stronger", "record", "bullish", "upgrade", "upgrades", "expands", "expansion", "profit", "profits", "outperform", "outperforms", "win", "wins", "partnership", "launch", "raises", "raised", "improves", "improved"];
  const negative = ["miss", "misses", "drop", "drops", "fall", "falls", "weak", "weaker", "cut", "cuts", "downgrade", "downgrades", "lawsuit", "probe", "risk", "risks", "decline", "declines", "warning", "warns", "slump", "slumps", "loss", "losses", "recall", "fraud", "delay", "delays"];
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
      volume: safeNumber(r.Volume)
    }))
    .filter((r) => r.date && r.close !== null);

  if (!rows.length) throw new Error("No Stooq history returned for that ticker.");
  return rows;
}

async function fetchTickerMap() {
  const data = await fetchJson("https://www.sec.gov/files/company_tickers_exchange.json", {
    headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
  });

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

  return entries
    .filter((x) => x.form === "10-K" || x.fp === "FY")
    .map((x) => ({ fy: x.fy, end: x.end, val: safeNumber(x.val), filed: x.filed }))
    .filter((x) => x.val !== null)
    .sort((a, b) => new Date(a.end) - new Date(b.end));
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
  const companyFacts = await fetchJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cikPadded}.json`, {
    headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
  });

  const facts = companyFacts.facts || {};
  const revenueFact = pickFact(facts, "us-gaap", ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"]);
  const netIncomeFact = pickFact(facts, "us-gaap", ["NetIncomeLoss", "ProfitLoss"]);
  const epsFact = pickFact(facts, "us-gaap", ["EarningsPerShareDiluted", "EarningsPerShareBasic"]);

  return {
    companyName: item.name,
    exchange: item.exchange,
    cik: cikPadded,
    revenue: getLatestAnnualFacts(revenueFact),
    netIncome: getLatestAnnualFacts(netIncomeFact),
    eps: getLatestAnnualFacts(epsFact)
  };
}

async function fetchNews(ticker, companyName = "") {
  const query = encodeURIComponent(`${ticker} ${companyName}`.trim());
  const xml = await fetchText(`https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`, {
    headers: { "User-Agent": USER_AGENT }
  });

  const titles = extractTag(xml, "title").slice(1);
  const links = extractTag(xml, "link").slice(1);
  const pubDates = extractTag(xml, "pubDate").slice(1);
  const items = [];
  const limit = Math.min(titles.length, links.length, pubDates.length, 12);
  for (let i = 0; i < limit; i++) {
    items.push({ title: titles[i], link: links[i], pubDate: pubDates[i], sentimentScore: scoreHeadline(titles[i]) });
  }
  return items;
}

function buildProjection({ prices, fundamentals, news }) {
  const closes = prices.map((p) => p.close).filter((x) => x !== null);
  if (closes.length < 200) throw new Error("Not enough price history.");

  const latestPrice = closes[closes.length - 1];
  const oneYearAgoPrice = closes[Math.max(0, closes.length - 252)] || closes[0];
  const threeYearsAgoIndex = Math.max(0, closes.length - 252 * 3);
  const threeYearsAgoPrice = closes[threeYearsAgoIndex] || closes[0];

  const dailyReturns = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) dailyReturns.push(closes[i] / closes[i - 1] - 1);
  }

  const annualVol = stdDev(dailyReturns) * Math.sqrt(252);
  const oneYearReturn = latestPrice / oneYearAgoPrice - 1;
  const threeYearTotalReturn = latestPrice / threeYearsAgoPrice - 1;
  const threeYearCagr = annualizeReturn(threeYearTotalReturn, 3);
  const ma50 = mean(closes.slice(-50));
  const ma200 = mean(closes.slice(-200));
  const trendSignal = ma200 > 0 ? (ma50 / ma200 - 1) : 0;

  const newsScores = news.map((n) => n.sentimentScore);
  const avgNewsSentiment = newsScores.length ? mean(newsScores) : 0;
  const newsAdjustment = clamp(avgNewsSentiment * 0.01, -0.03, 0.03);

  const epsSeries = (fundamentals.eps || []).filter((x) => x.val !== null);
  const recentEps = epsSeries.length ? epsSeries[epsSeries.length - 1].val : null;
  const priorEps = epsSeries.length > 1 ? epsSeries[epsSeries.length - 2].val : null;

  let epsGrowth = 0.08;
  if (recentEps !== null && priorEps !== null && Math.abs(priorEps) > 0.0001) {
    epsGrowth = clamp(recentEps / priorEps - 1, -0.20, 0.30);
  }

  let trailingPE = null;
  if (recentEps && recentEps > 0) trailingPE = latestPrice / recentEps;

  const revenueSeries = (fundamentals.revenue || []).filter((x) => x.val !== null);
  if (revenueSeries.length > 1) {
    const last = revenueSeries[revenueSeries.length - 1].val;
    const prev = revenueSeries[revenueSeries.length - 2].val;
    if (prev > 0) {
      const revGrowth = clamp(last / prev - 1, -0.15, 0.25);
      epsGrowth = clamp((epsGrowth + revGrowth) / 2, -0.15, 0.25);
    }
  }

  let annualDrift = threeYearCagr * 0.4 + clamp(oneYearReturn, -0.30, 0.30) * 0.25 + clamp(trendSignal * 2, -0.15, 0.15) * 0.2 + newsAdjustment * 0.15;
  annualDrift -= clamp((annualVol - 0.25) * 0.25, 0, 0.10);
  annualDrift = clamp(annualDrift, -0.12, 0.22);

  let forwardPE = trailingPE;
  if (!forwardPE || !Number.isFinite(forwardPE) || forwardPE <= 0) forwardPE = 18;
  forwardPE = clamp(forwardPE, 8, 35);
  forwardPE *= 1 + clamp(newsAdjustment + trendSignal * 0.20, -0.10, 0.10);
  forwardPE = clamp(forwardPE, 8, 38);

  const projections = [1, 2, 3, 4, 5].map((y) => {
    const technicalPrice = latestPrice * Math.pow(1 + annualDrift, y);
    let valuationPrice = null;
    let projectedEPS = null;

    if (recentEps && recentEps > 0) {
      projectedEPS = recentEps * Math.pow(1 + epsGrowth, y);
      valuationPrice = projectedEPS * forwardPE;
    }

    let blended = technicalPrice;
    if (valuationPrice) blended = technicalPrice * 0.55 + valuationPrice * 0.45;

    const bear = blended * Math.pow(1 - clamp(annualVol * 0.55, 0.08, 0.25), y);
    const bull = blended * Math.pow(1 + clamp(annualVol * 0.40, 0.10, 0.28), y);

    return {
      year: y,
      technicalPrice: Number(technicalPrice.toFixed(2)),
      valuationPrice: valuationPrice ? Number(valuationPrice.toFixed(2)) : null,
      projectedEPS: projectedEPS ? Number(projectedEPS.toFixed(2)) : null,
      blendedPrice: Number(blended.toFixed(2)),
      bearPrice: Number(bear.toFixed(2)),
      bullPrice: Number(bull.toFixed(2))
    };
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
    avgNewsSentiment: Number(avgNewsSentiment.toFixed(2)),
    projections
  };
}

export async function GET(_request, { params }) {
  try {
    const cleanTicker = String(params.ticker || "").trim().toUpperCase();
    if (!cleanTicker) {
      return Response.json({ error: "Ticker is required." }, { status: 400 });
    }

    const prices = await fetchStooqHistory(cleanTicker);
    const fundamentals = await fetchSecFundamentals(cleanTicker);
    const news = await fetchNews(cleanTicker, fundamentals.companyName);
    const model = buildProjection({ prices, fundamentals, news });

    return Response.json({
      ticker: cleanTicker,
      companyName: fundamentals.companyName,
      exchange: fundamentals.exchange,
      prices: prices.slice(-600),
      fundamentals,
      news,
      model
    });
  } catch (err) {
    return Response.json({ error: err.message || "Analysis failed." }, { status: 500 });
  }
}
