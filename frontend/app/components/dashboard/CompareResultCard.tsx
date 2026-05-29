"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Info, Award, Baby, UserCircle2, Tag, Sparkles, Copy } from "lucide-react";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";

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

function RecommendationPill({ icon: Icon, label, value, tone, onCopy, title }: { icon: typeof Award; label: string; value?: string | null; tone: string; onCopy: () => void; title: string }) {
  if (!value) return null;
  return (
    <button
      type="button"
      onClick={onCopy}
      title={title}
      className={`focus-ring inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-smooth hover:brightness-95 active:scale-95 ${tone}`}
    >
      <Icon className="size-3.5" />
      <span className="font-medium opacity-80">{label}:</span>
      <span className="font-semibold">{value}</span>
      <Copy className="size-3 opacity-50" />
    </button>
  );
}

export function CompareResultCard({ data }: Props) {
  const { t } = useLanguage();
  const { generic_name, recommendation, comparison_summary } = data;

  // De-duplicate variants by normalized brand name so the same medicine never
  // renders as two cards/columns (the LLM occasionally emits a brand twice).
  const variants = useMemo(() => {
    const seen = new Set<string>();
    return (data.variants ?? []).filter((v) => {
      const key = (v.brand_name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data.variants]);

  const copy = (val?: string | null) => {
    if (!val) return;
    navigator.clipboard?.writeText(val);
    toast.success(`${t.compare.copied}: ${val}`);
  };

  if (!variants || variants.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">{comparison_summary || t.compare.noVariants}</p>
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
          {t.compare.comparing} {variants.length} {t.compare.variantsOf}
        </p>
        <h2 className="font-display text-2xl tracking-tight text-[var(--foreground)] capitalize">{generic_name}</h2>
      </div>

      {/* Recommendation pills — click to copy */}
      <div className="flex flex-wrap gap-2">
        <RecommendationPill
          icon={Award}
          label={t.compare.bestOverall}
          value={recommendation.best_overall}
          tone="bg-emerald-50 text-emerald-800 border-emerald-200"
          title={t.compare.clickToCopy}
          onCopy={() => copy(recommendation.best_overall)}
        />
        <RecommendationPill
          icon={Baby}
          label={t.compare.bestForChildren}
          value={recommendation.best_for_children}
          tone="bg-blue-50 text-blue-800 border-blue-200"
          title={t.compare.clickToCopy}
          onCopy={() => copy(recommendation.best_for_children)}
        />
        <RecommendationPill
          icon={UserCircle2}
          label={t.compare.bestForElderly}
          value={recommendation.best_for_elderly}
          tone="bg-purple-50 text-purple-800 border-purple-200"
          title={t.compare.clickToCopy}
          onCopy={() => copy(recommendation.best_for_elderly)}
        />
        <RecommendationPill
          icon={Tag}
          label={t.compare.mostAffordable}
          value={recommendation.most_affordable}
          tone="bg-amber-50 text-amber-800 border-amber-200"
          title={t.compare.clickToCopy}
          onCopy={() => copy(recommendation.most_affordable)}
        />
        <RecommendationPill
          icon={Sparkles}
          label={t.compare.mostAvailable}
          value={recommendation.most_available}
          tone="bg-slate-50 text-slate-800 border-slate-200"
          title={t.compare.clickToCopy}
          onCopy={() => copy(recommendation.most_available)}
        />
      </div>

      {/* Variant cards — responsive grid, hover lift */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {variants.map((v) => (
          <div
            key={v.brand_name}
            className="glass-card rounded-2xl p-4 hover:-translate-y-1 hover:shadow-soft transition-smooth"
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
                  <span className="text-[var(--muted-foreground)] text-xs">{t.compare.priceLabel}: </span>
                  <span className="font-semibold text-[var(--foreground)]">{v.price_bdt} BDT</span>
                </p>
              )}
              {v.best_for && (
                <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]">
                  {v.best_for}
                </span>
              )}
              <div className="flex flex-wrap gap-1.5">
                {v.side_effect_severity && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${severityClass[v.side_effect_severity] ?? severityClass.MEDIUM}`}>
                    {v.side_effect_severity} {t.compare.sideEffectsSuffix}
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

      {/* Comparison table — sticky first column, alternating rows */}
      <div className="overflow-x-auto scrollbar-custom glass-card rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--card)]">
              <th className="sticky left-0 z-10 bg-[var(--card)] text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">{t.compare.feature}</th>
              {variants.map((v) => (
                <th key={v.brand_name} className="text-left px-4 py-3 text-xs font-semibold text-[var(--foreground)] tracking-wide whitespace-nowrap">
                  {v.brand_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: t.compare.rowPrice, get: (v: CompareVariant) => (v.price_bdt != null ? `${v.price_bdt}` : "—") },
              { label: t.compare.rowStrength, get: (v: CompareVariant) => v.tablet_strength || "—" },
              { label: t.compare.rowAge, get: (v: CompareVariant) => v.suitable_for_age || "—" },
              { label: t.compare.rowPrescription, get: (v: CompareVariant) => (v.prescription_needed ? t.compare.yes : t.compare.no) },
              { label: t.compare.rowAvailability, get: (v: CompareVariant) => v.availability || "—" },
            ].map((row) => (
              <tr key={row.label} className="border-b border-[var(--border)] last:border-0 even:bg-[var(--card)]/40">
                <td className="sticky left-0 bg-[var(--background)] px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] whitespace-nowrap">{row.label}</td>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">{t.compare.aiSummary}</p>

            <p className="text-sm text-blue-900 leading-relaxed">{comparison_summary}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
