export function fmtMoney(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return "$" + Number(n).toFixed(2);
}

export function fmtPercent(p) {
  if (p === null || p === undefined || Number.isNaN(p)) return "—";
  return Number(p).toFixed(2) + "%";
}

export function fmtBigNumber(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return Number(v).toLocaleString();
}

export function calcReturnPercent(targetPrice, latestPrice) {
  if (
    targetPrice === null || targetPrice === undefined || Number.isNaN(targetPrice) ||
    latestPrice === null || latestPrice === undefined || Number.isNaN(latestPrice) ||
    latestPrice <= 0
  ) {
    return null;
  }

  return ((targetPrice / latestPrice) - 1) * 100;
}

export function sentimentLabel(score) {
  if (score > 0.5) return { text: "Positive", cls: "good" };
  if (score < -0.5) return { text: "Negative", cls: "bad" };
  return { text: "Neutral", cls: "warn" };
}
