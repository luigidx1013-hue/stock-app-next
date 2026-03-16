"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";
import { fmtMoney } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function PriceChart({ prices, projections }) {
  const historical = prices.slice(-240);
  const histLabels = historical.map((p) => p.date);
  const histValues = historical.map((p) => p.close);

  const futureLabels = projections.map((p) => `Year ${p.year}`);
  const baseValues = projections.map((p) => p.blendedPrice);
  const bearValues = projections.map((p) => p.bearPrice);
  const bullValues = projections.map((p) => p.bullPrice);

  const labels = [...histLabels, ...futureLabels];
  const histSeries = [...histValues, ...new Array(futureLabels.length).fill(null)];
  const baseSeries = new Array(histValues.length - 1).fill(null)
    .concat([histValues[histValues.length - 1]])
    .concat(baseValues);
  const bearSeries = new Array(histValues.length - 1).fill(null)
    .concat([histValues[histValues.length - 1]])
    .concat(bearValues);
  const bullSeries = new Array(histValues.length - 1).fill(null)
    .concat([histValues[histValues.length - 1]])
    .concat(bullValues);

  return (
    <div style={{ minHeight: 420 }}>
      <Line
        data={{
          labels,
          datasets: [
            { label: "Historical Close", data: histSeries, borderWidth: 2, tension: 0.25 },
            { label: "Base Projection", data: baseSeries, borderDash: [6, 6], borderWidth: 2, tension: 0.25 },
            { label: "Bear Case", data: bearSeries, borderDash: [3, 5], borderWidth: 1.5, tension: 0.25 },
            { label: "Bull Case", data: bullSeries, borderDash: [3, 5], borderWidth: 1.5, tension: 0.25 }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { labels: { color: "#e8ecf8" } },
            tooltip: {
              callbacks: {
                label: (context) => context.raw === null ? "" : `${context.dataset.label}: ${fmtMoney(context.raw)}`
              }
            }
          },
          scales: {
            x: {
              ticks: { color: "#a7b0d1", maxTicksLimit: 14 },
              grid: { color: "rgba(255,255,255,0.05)" }
            },
            y: {
              ticks: { color: "#a7b0d1", callback: (value) => fmtMoney(value) },
              grid: { color: "rgba(255,255,255,0.05)" }
            }
          }
        }}
      />
    </div>
  );
}
