"use client";

import { motion } from "framer-motion";
import { Info, Award, Baby, UserCircle2, Tag, Sparkles } from "lucide-react";

export interface CompareVariant {
  brand_name: string;
  manufacturer: string;
  price_bdt?: number | null;
  tablet_strength?: string;
  suitable_for_age?: string;
  reliability_score?: number;
  availability?: "widely available" | "limited" | string;
  prescription_needed?: boolean;
  best_for?: string;
  not_recommended_for?: string;
  side_effect_severity?: "LOW" | "MEDIUM" | "HIGH";
  value_for_money?: "BUDGET" | "STANDARD" | "PREMIUM";
}

export interface CompareRecommendation {
  best_overall?: string;
  best_for_children?: string | null;
  best_for_elderly?: string | null;
  most_affordable?: string;
  most_available?: string;
}

export interface CompareResult {
  generic_name: string;
  variants: CompareVariant[];
  recommendation: CompareRecommendation;
  comparison_summary: string;
  source?: string;
}

interface Props {
  data: CompareResult;
}

const severityClass: Record<string, string> = {
  LOW: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-red-50 text-red-800 border-red-200",
};

const valueClass: Record<string, string> = {
  BUDGET: "bg-emerald-50 text-emerald-800 border-emerald-200",
  STANDARD: "bg-blue-50 text-blue-800 border-blue-200",
  PREMIUM: "bg-purple-50 text-purple-800 border-purple-200",
};

function reliabilityColour(score?: number) {
  if (score == null) return "#71717a";
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

function ReliabilityRing({ score }: { score?: number }) {
  const val = Math.max(0, Math.min(100, score ?? 0));
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (val / 100) * circ;
  const colour = reliabilityColour(score);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colour} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums" style={{ color: colour }}>
        {val}
      </span>
    </div>
  );
}

function RecommendationPill({ icon: Icon, label, value, tone }: { icon: typeof Award; label: string; value?: string | null; tone: string }) {
  if (!value) return null;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${tone}`}>
      <Icon className="size-3.5" />
      <span className="font-medium opacity-80">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function CompareResultCard({ data }: Props) {
  const { generic_name, variants, recommendation, comparison_summary } = data;

  if (!variants || variants.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">{comparison_summary || "No variants found."}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Comparing {variants.length} variants of
        </p>
        <h2 className="font-display text-2xl tracking-tight text-[var(--foreground)] capitalize">{generic_name}</h2>
      </div>

      {/* Recommendation pills */}
      <div className="flex flex-wrap gap-2">
        <RecommendationPill
          icon={Award}
          label="Best Overall"
          value={recommendation.best_overall}
          tone="bg-emerald-50 text-emerald-800 border-emerald-200"
        />
        <RecommendationPill
          icon={Baby}
          label="Best for Children"
          value={recommendation.best_for_children}
          tone="bg-blue-50 text-blue-800 border-blue-200"
        />
        <RecommendationPill
          icon={UserCircle2}
          label="Best for Elderly"
          value={recommendation.best_for_elderly}
          tone="bg-purple-50 text-purple-800 border-purple-200"
        />
        <RecommendationPill
          icon={Tag}
          label="Most Affordable"
          value={recommendation.most_affordable}
          tone="bg-amber-50 text-amber-800 border-amber-200"
        />
        <RecommendationPill
          icon={Sparkles}
          label="Most Available"
          value={recommendation.most_available}
          tone="bg-slate-50 text-slate-800 border-slate-200"
        />
      </div>

      {/* Variant cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {variants.map((v) => (
          <div
            key={v.brand_name}
            className="snap-start flex-shrink-0 w-[260px] glass-card rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)] truncate">{v.brand_name}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{v.manufacturer}</p>
              </div>
              <ReliabilityRing score={v.reliability_score} />
            </div>
            <div className="space-y-2">
              {v.price_bdt != null && (
                <p className="text-sm">
                  <span className="text-[var(--muted-foreground)] text-xs">Price: </span>
                  <span className="font-semibold text-[var(--foreground)]">{v.price_bdt} BDT</span>
                </p>
              )}
              {v.best_for && (
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{v.best_for}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {v.side_effect_severity && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${severityClass[v.side_effect_severity] ?? severityClass.MEDIUM}`}>
                    {v.side_effect_severity} side effects
                  </span>
                )}
                {v.value_for_money && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${valueClass[v.value_for_money] ?? valueClass.STANDARD}`}>
                    {v.value_for_money}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto glass-card rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--card)]">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Feature</th>
              {variants.map((v) => (
                <th key={v.brand_name} className="text-left px-4 py-3 text-xs font-semibold text-[var(--foreground)] tracking-wide whitespace-nowrap">
                  {v.brand_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Price (BDT)", get: (v: CompareVariant) => (v.price_bdt != null ? `${v.price_bdt}` : "—") },
              { label: "Strength", get: (v: CompareVariant) => v.tablet_strength || "—" },
              { label: "Suitable age", get: (v: CompareVariant) => v.suitable_for_age || "—" },
              { label: "Prescription", get: (v: CompareVariant) => (v.prescription_needed ? "Yes" : "No") },
              { label: "Availability", get: (v: CompareVariant) => v.availability || "—" },
            ].map((row) => (
              <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">{row.label}</td>
                {variants.map((v) => (
                  <td key={v.brand_name} className="px-4 py-3 text-[var(--foreground)]">{row.get(v)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Summary */}
      {comparison_summary && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 flex items-start gap-2">
          <Info className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">AI summary</p>
            <p className="text-sm text-blue-900 leading-relaxed">{comparison_summary}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
