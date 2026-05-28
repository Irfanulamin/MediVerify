"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Skull,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Phone,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export interface InvestigationCheck {
  status: "PASS" | "FAIL" | "UNKNOWN";
  detail: string;
}

export interface InvestigationGeneralInfo {
  generic_name?: string;
  manufacturer?: string;
  uses?: string[];
  side_effects?: string[];
  safe_alternatives?: string[];
  fake_indicators?: string[];
}

export interface InvestigationResult {
  trust_score: number;
  verdict: "AUTHENTIC" | "SUSPICIOUS" | "LIKELY_FAKE" | "EXPIRED" | "UNVERIFIED";
  checks: Record<string, InvestigationCheck>;
  verdict_explanation: string;
  should_consume: boolean;
  recommendation: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  report_to_authorities: boolean;
  dgda_hotline: string;
  general_info?: InvestigationGeneralInfo;
  source?: string;
}

export interface InvestigationInput {
  medicine_name: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  purchase_location?: string;
  price_paid?: number;
}

interface Props {
  data: InvestigationResult;
  input: InvestigationInput;
  onAlternativeClick?: (name: string) => void;
}

const verdictTheme: Record<InvestigationResult["verdict"], { bg: string; border: string; text: string; headline: string; Icon: typeof ShieldCheck }> = {
  AUTHENTIC: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    headline: "This medicine appears authentic",
    Icon: ShieldCheck,
  },
  SUSPICIOUS: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    headline: "Some details look suspicious",
    Icon: ShieldAlert,
  },
  LIKELY_FAKE: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    headline: "Do not consume — possibly counterfeit",
    Icon: ShieldAlert,
  },
  EXPIRED: {
    bg: "bg-red-100",
    border: "border-red-300",
    text: "text-red-900",
    headline: "Do not consume — this medicine is expired",
    Icon: Skull,
  },
  UNVERIFIED: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-800",
    headline: "Could not verify — consult a pharmacist",
    Icon: HelpCircle,
  },
};

const riskTheme: Record<InvestigationResult["risk_level"], string> = {
  LOW: "bg-emerald-50 text-emerald-800 border-emerald-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-900 border-red-300",
};

const CHECK_LABELS: Record<string, string> = {
  manufacturer: "Manufacturer",
  batch_number: "Batch Number",
  expiry_date: "Expiry Date",
  price: "Price",
  purchase_location: "Purchase Location",
};

const CHECK_ORDER = ["manufacturer", "batch_number", "expiry_date", "price", "purchase_location"];

function checkIcon(status: InvestigationCheck["status"]) {
  if (status === "PASS") return <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />;
  if (status === "FAIL") return <XCircle className="size-4 text-red-600 flex-shrink-0" />;
  if (status === "UNKNOWN") return <HelpCircle className="size-4 text-[var(--muted-foreground)] flex-shrink-0" />;
  return <AlertCircle className="size-4 text-amber-600 flex-shrink-0" />;
}

export function InvestigationResultCard({ data, input, onAlternativeClick }: Props) {
  const [generalOpen, setGeneralOpen] = useState(false);
  const [reportedDgda, setReportedDgda] = useState(false);
  const [reporting, setReporting] = useState(false);

  const theme = verdictTheme[data.verdict] ?? verdictTheme.UNVERIFIED;
  const { Icon } = theme;

  const submitDgdaReport = async () => {
    setReporting(true);
    try {
      await axios.post("/api/proxy/unverified-reports", {
        medicineName: input.medicine_name,
        manufacturer: input.manufacturer || undefined,
        purchaseLocation: input.purchase_location || undefined,
        notes: `Investigation verdict: ${data.verdict}. ${data.verdict_explanation}${
          input.batch_number ? ` Batch: ${input.batch_number}.` : ""
        }${input.expiry_date ? ` Expiry: ${input.expiry_date}.` : ""}${
          input.price_paid != null ? ` Price paid: ${input.price_paid} BDT.` : ""
        }`,
      });
      toast.success("Reported. We'll review it.");
      setReportedDgda(true);
    } catch {
      toast.error("Could not submit report");
    } finally {
      setReporting(false);
    }
  };

  const info = data.general_info ?? {};

  return (
    <motion.div
      className="glass-card rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Section 1 — Verdict banner */}
      <div className={`p-5 border-b ${theme.border} ${theme.bg}`}>
        <div className="flex items-center gap-3">
          <Icon className={`size-7 ${theme.text}`} strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${theme.text} opacity-70`}>
              {data.verdict.replace("_", " ")}
            </p>
            <p className={`text-lg font-semibold ${theme.text} leading-tight`}>{theme.headline}</p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${riskTheme[data.risk_level]}`}>
            {data.risk_level} RISK
          </div>
        </div>
      </div>

      {/* Section 2 — Should you take it? */}
      <div className="p-6 border-b border-[var(--border)] flex items-center gap-4">
        {data.should_consume ? (
          <>
            <CheckCircle2 className="size-12 text-emerald-600 flex-shrink-0" strokeWidth={2} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Should you take it?
              </p>
              <p className="text-2xl font-display font-bold text-emerald-700 leading-tight">Yes — safe to consume</p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="size-12 text-red-600 flex-shrink-0" strokeWidth={2} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Should you take it?
              </p>
              <p className="text-2xl font-display font-bold text-red-700 leading-tight">No — do not consume</p>
            </div>
          </>
        )}
      </div>

      {/* Section 3 — Checks */}
      <div className="p-6 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
          Investigation Checks
        </p>
        <ul className="space-y-2">
          {CHECK_ORDER.map((key) => {
            const check = data.checks?.[key] ?? { status: "UNKNOWN" as const, detail: "not provided" };
            return (
              <li key={key} className="flex items-start gap-3">
                {checkIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)]">{CHECK_LABELS[key]}</p>
                  <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{check.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Section 4 — Recommendation */}
      <div className="p-6 border-b border-[var(--border)] bg-blue-50/60">
        <div className="flex items-start gap-2">
          <Info className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">Recommendation</p>
            <p className="text-sm text-blue-900 leading-relaxed">{data.recommendation}</p>
            {data.verdict_explanation && data.verdict_explanation !== data.recommendation && (
              <p className="text-xs text-blue-800/80 mt-2 leading-relaxed">{data.verdict_explanation}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 5 — Report to authorities */}
      {data.report_to_authorities && (
        <div className="p-5 border-b border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <ShieldAlert className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">This may be a counterfeit medicine</p>
              <p className="text-xs text-red-700 mt-0.5 flex items-center gap-1 flex-wrap">
                <Phone className="size-3" /> DGDA Hotline:
                <a href={`tel:${data.dgda_hotline}`} className="font-semibold underline">
                  {data.dgda_hotline}
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={submitDgdaReport}
              disabled={reporting || reportedDgda}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-smooth whitespace-nowrap disabled:opacity-50"
            >
              {reportedDgda ? "Reported ✓" : reporting ? "Sending…" : "Report This Medicine"}
            </button>
          </div>
        </div>
      )}

      {/* Section 6 — General info (collapsible) */}
      {(info.uses?.length || info.side_effects?.length || info.safe_alternatives?.length) ? (
        <div>
          <button
            type="button"
            onClick={() => setGeneralOpen((v) => !v)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--card)] transition-smooth"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              General information
              {info.generic_name && (
                <span className="ml-2 normal-case font-normal tracking-normal text-[var(--muted-foreground)]/80">
                  · {info.generic_name}
                </span>
              )}
            </span>
            {generalOpen ? (
              <ChevronUp className="size-4 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {generalOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5 space-y-4">
                  {info.uses && info.uses.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Uses</p>
                      <div className="flex flex-wrap gap-1.5">
                        {info.uses.map((u, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                            {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {info.side_effects && info.side_effects.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Side effects</p>
                      <div className="flex flex-wrap gap-1.5">
                        {info.side_effects.map((s, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {info.safe_alternatives && info.safe_alternatives.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--muted-foreground)] mb-1.5">Safe alternatives</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {info.safe_alternatives.map((a, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onAlternativeClick?.(a)}
                            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)] transition-smooth whitespace-nowrap"
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
    </motion.div>
  );
}
