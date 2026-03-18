export function clamp(value, min, max) {
  if (value == null || Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function calcCAGR(start, end, years) {
  if (
    start == null ||
    end == null ||
    years == null ||
    start <= 0 ||
    end <= 0 ||
    years <= 0
  ) {
    return 0;
  }

  return Math.pow(end / start, 1 / years) - 1;
}

export function normalizeGrowth({
  epsCagr = 0,
  revenueCagr = 0,
  sentimentScore = 0,
}) {
  const safeEps = Number.isFinite(epsCagr) ? epsCagr : 0;
  const safeRevenue = Number.isFinite(revenueCagr) ? revenueCagr : 0;
  const safeSentiment = Number.isFinite(sentimentScore) ? sentimentScore : 0;

  const softenedEps = safeEps < 0 ? safeEps * 0.5 : safeEps;
  const sentimentTilt = safeSentiment * 0.02;

  const blended =
    softenedEps * 0.35 +
    safeRevenue * 0.45 +
    sentimentTilt * 0.20;

  return clamp(blended, -0.08, 0.22);
}

export function projectEPS(currentEPS, growthRate, years = 1) {
  if (
    currentEPS == null ||
    !Number.isFinite(currentEPS) ||
    currentEPS <= 0 ||
    !Number.isFinite(growthRate) ||
    years <= 0
  ) {
    return null;
  }

  return currentEPS * Math.pow(1 + growthRate, years);
}

export function normalizePE(pe) {
  if (pe == null || !Number.isFinite(pe) || pe <= 0) {
    return 15;
  }

  return clamp(pe, 5, 40);
}

export function buildScenarioPE(basePE) {
  const pe = normalizePE(basePE);

  return {
    bear: pe * 0.8,
    base: pe,
    bull: pe * 1.15,
  };
}

export function calcFairValue(projectedEPS, projectedPE) {
  if (
    projectedEPS == null ||
    projectedPE == null ||
    !Number.isFinite(projectedEPS) ||
    !Number.isFinite(projectedPE) ||
    projectedEPS <= 0 ||
    projectedPE <= 0
  ) {
    return null;
  }

  return projectedEPS * projectedPE;
}

function hashString(str) {
  let h = 2166136261;

  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;

  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomNormal(rng) {
  let u = 0;
  let v = 0;

  while (u === 0) u = rng();
  while (v === 0) v = rng();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function buildMonthlyPath({
  ticker = "",
  currentPrice,
  targetPrice,
  months = 12,
  annualDrift = 0.08,
  annualVolatility = 0.30,
  meanReversionStrength = 0.35,
}) {
  if (
    currentPrice == null ||
    targetPrice == null ||
    !Number.isFinite(currentPrice) ||
    !Number.isFinite(targetPrice) ||
    currentPrice <= 0 ||
    targetPrice <= 0 ||
    !Number.isFinite(months) ||
    months <= 0
  ) {
    return [];
  }

  const startPrice = Number(currentPrice);
  const endTarget = Number(targetPrice);
  const dt = 1 / 12;

  const drift = clamp(
    Number.isFinite(annualDrift) ? annualDrift : 0.08,
    -0.30,
    0.40
  );

  const vol = clamp(
    Number.isFinite(annualVolatility) ? annualVolatility : 0.30,
    0.12,
    0.80
  );

  const reversion = clamp(
    Number.isFinite(meanReversionStrength) ? meanReversionStrength : 0.35,
    0,
    1
  );

  const seed = hashString(
    `${ticker}|${startPrice}|${endTarget}|${months}|${drift}|${vol}|${reversion}`
  );
  const rng = mulberry32(seed);

  const path = [];
  let price = startPrice;

  for (let i = 1; i <= months; i += 1) {
    const shock = randomNormal(rng);
    const remainingMonths = months - i + 1;

    const pull =
      remainingMonths > 0 && price > 0 && endTarget > 0
        ? (Math.log(endTarget / price) / remainingMonths) * reversion
        : 0;

    const step = Math.exp(
  pull +
    (drift - 0.5 * vol * vol) * dt +
    (vol * 0.4) * Math.sqrt(dt) * shock
);

    price *= step;

    path.push({
      month: i,
      price,
    });
  }

  return path;
}