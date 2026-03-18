"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

function parseDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatMonthLabel(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export default function PriceChart({
  historical = [],
  projections = [],
  projectionBands = [],
}) {
  const historicalDaily = historical
  .filter((p) => p?.date && Number.isFinite(Number(p?.close)))
  .map((p) => ({
    date: parseDate(p.date),
    close: Number(p.close),
  }))
  .filter((p) => p.date);

const monthlyMap = new Map();

for (const point of historicalDaily) {
  const key = `${point.date.getFullYear()}-${point.date.getMonth()}`;
  monthlyMap.set(key, point); // keeps the latest point in each month
}

const historicalPoints = Array.from(monthlyMap.values()).slice(-12);

  if (!historicalPoints.length) {
    return <p>No chart data available.</p>;
  }

  const lastHistoricalDate = historicalPoints[historicalPoints.length - 1].date;
  const lastHistoricalClose =
    historicalPoints[historicalPoints.length - 1]?.close ?? null;

  const projectionPoints = projections.map((point, index) => ({
    date: addMonths(lastHistoricalDate, index + 1),
    price: Number(point.price),
  }));

  const bandPoints = projectionBands.map((point, index) => ({
    date: addMonths(lastHistoricalDate, index + 1),
    low: Number(point.low),
    high: Number(point.high),
    base: Number(point.base),
  }));

  const historicalRows = historicalPoints.map((p, index) => {
    const isLastHistorical = index === historicalPoints.length - 1;

    return {
      key: `hist-${p.date.toISOString()}-${index}`,
      label: formatMonthLabel(p.date),
      historical: p.close,
      projection: isLastHistorical ? lastHistoricalClose : null,
      low: isLastHistorical ? lastHistoricalClose : null,
      high: isLastHistorical ? lastHistoricalClose : null,
    };
  });

  const projectionRows = projectionPoints.map((p, index) => ({
    key: `proj-${p.date.toISOString()}-${index}`,
    label: formatMonthLabel(p.date),
    historical: null,
    projection: p.price,
    low: bandPoints[index]?.low ?? null,
    high: bandPoints[index]?.high ?? null,
  }));

  const allPoints = [...historicalRows, ...projectionRows];

  const labels = allPoints.map((p) => p.label);
  const historicalData = allPoints.map((p) => p.historical);
  const projectionData = allPoints.map((p) => p.projection);
  const lowBandData = allPoints.map((p) => p.low);
  const highBandData = allPoints.map((p) => p.high);

  const data = {
    labels,
    datasets: [
      {
        label: "Historical Close",
        data: historicalData,
        borderColor: "#8ab4ff",
        backgroundColor: "#8ab4ff",
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 3,
      },
      {
        label: "Projection Low",
        data: lowBandData,
        borderColor: "rgba(125, 211, 252, 0)",
        backgroundColor: "rgba(125, 211, 252, 0)",
        pointRadius: 0,
        borderWidth: 0,
      },
      {
        label: "Projection Range",
        data: highBandData,
        borderColor: "rgba(34, 197, 94, 0.12)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        pointRadius: 0,
        borderWidth: 1,
        fill: "-1",
        tension: 0.2,
      },
      {
        label: "Base Projection",
        data: projectionData,
        borderColor: "#9ae6b4",
        backgroundColor: "#9ae6b4",
        tension: 0.2,
        pointRadius: 4,
        borderWidth: 4,
        borderDash: [6, 6],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: "#e5e7eb",
          filter: (legendItem) => !["Projection Low"].includes(legendItem.text),
        },
      },
      tooltip: {
        callbacks: {
          label(context) {
            const value = context.parsed.y;
            if (value == null) return null;
            return `${context.dataset.label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#cbd5e1",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
        },
      },
      y: {
        ticks: {
          color: "#cbd5e1",
          callback(value) {
            return `$${value}`;
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
        },
      },
    },
  };

  return (
    <div style={{ height: 420 }}>
      <Line data={data} options={options} />
    </div>
  );
}