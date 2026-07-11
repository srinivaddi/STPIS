/* src/components/RiskTab.tsx */
"use client";

import React from "react";

interface RiskMetrics {
  low: number | null;
  medium: number | null;
  high: number | null;
}

interface Props {
  metrics: RiskMetrics;
}

const RiskTab: React.FC<Props> = ({ metrics }) => {
  const badge = (label: string, value: number | null, color: string) => (
    <div className="flex items-center gap-2 mb-2">
      <span className={`px-2 py-1 rounded text-sm font-medium ${color} text-white`}>{label}</span>
      <span className="text-slate-200">{value ?? "N/A"}</span>
    </div>
  );

  return (
    <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm shadow-xl mt-6">
      <h3 className="text-lg font-bold text-white mb-4">Risk Metrics</h3>
      {badge("Low", metrics.low, "bg-emerald-600")}
      {badge("Medium", metrics.medium, "bg-amber-600")}
      {badge("High", metrics.high, "bg-rose-600")}
    </div>
  );
};

export default RiskTab;
