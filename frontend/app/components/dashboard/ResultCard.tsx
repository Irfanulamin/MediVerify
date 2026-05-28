"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  HelpCircle,
} from "lucide-react";
import { TrustScoreRing } from "./TrustScoreRing";
import { ReportMedicineModal } from "./ReportMedicineModal";
import { useLanguage } from "@/lib/i18n";

interface ConfidenceBreakdown {
  manufacturer_match?: boolean;
  batch_format_valid?: boolean;
  price_in_range?: boolean;
  [key: string]: boolean | undefined;
}

export interface VerifyResult {
  result: "VERIFIED" | "SUSPICIOUS" | "UNKNOWN";
  medicineName?: string;
  genericName?: string;
  manufacturer?: string;
  trustScore?: number;
  fakeIndicators?: string[];
  safeAlternatives?: string[];
  explanation?: string;
  uses?: string[];
  sideEffects?: string[];
  foundInDatabase?: boolean;
  couldReadImage?: boolean;
  generalInfo?: string;
  manufacturerMatch?: boolean;
  requiresPrescription?: boolean;
  priceBdt?: string;
  confidenceBreakdown?: ConfidenceBreakdown;
  extracted_name?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  manufacturer_from_image?: string | null;
}

interface Props {
  data: VerifyResult;
  onAlternativeClick?: (name: string) => void;
}

const CONFIDENCE_LABELS: Record<string, string> = {
  manufacturer_match: "Manufacturer verified",
  batch_format_valid: "Batch format valid",
  price_in_range: "Price in expected range",
  found_in_database: "Found in verified database",
};

function humaniseKey(key: string) {
  return CONFIDENCE_LABELS[key] ?? key.replace(/_/g, " ");
}

export function ResultCard({ data, onAlternativeClick }: Props) {
  const { t } = useLanguage();
  const [showAllUses, setShowAllUses] = useState(false);
  const [sideEffectsOpen, setSideEffectsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (data.couldReadImage === false) {
    return (
      <motion.div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start gap-3">
          <Camera className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">{t.dashboard.couldNotReadImage}</p>
            <p className="text-sm text-amber-700">{t.dashboard.couldNotReadImageHint}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const score = data.trustScore ?? (data.result === "VERIFIED" ? 88 : data.result === "SUSPICIOUS" ? 22 : 50);
  const uses = data.uses ?? [];
  const sideEffects = data.sideEffects ?? [];
  const fakeIndicators = data.fakeIndicators ?? [];
  const safeAlternatives = data.safeAlternatives ?? [];
  const breakdown: ConfidenceBreakdown = {
    found_in_database: data.foundInDatabase ?? true,
    ...(data.confidenceBreakdown ?? {}),
  };

  const showHelpBanner = data.foundInDatabase === false || score < 40;
  const showExplanation = !!data.explanation && data.foundInDatabase !== false;
  const visibleUses = showAllUses ? uses : uses.slice(0, 4);

  const verdictMap = {
    VERIFIED: { Icon: CheckCircle2, label: t.dashboard.resultVerified, cls: "border-emerald-500 bg-emerald-50/70 text-emerald-800" },
    SUSPICIOUS: { Icon: AlertTriangle, label: t.dashboard.resultSuspicious, cls: "border-red-500 bg-red-50/70 text-red-800" },
    UNKNOWN: { Icon: HelpCircle, label: t.dashboard.resultUnknown, cls: "border-amber-500 bg-amber-50/70 text-amber-800" },
  } as const;
  const verdict = verdictMap[data.result] ?? verdictMap.UNKNOWN;

  return (
    <>
      <motion.div
        className="glass-card rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Verdict banner — left-border accent, surfaces overall result */}
        <div className="p-4 pb-0">
          <div className={`flex items-center gap-2.5 rounded-xl border-l-4 px-4 py-3 ${verdict.cls}`}>
            <verdict.Icon className="size-5 flex-shrink-0" strokeWidth={2} />
            <span className="text-sm font-semibold">{verdict.label}</span>
          </div>
        </div>

        {/* Section 1 — Overview */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {data.medicineName && (
                <h2 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)] truncate">
                  {data.medicineName}
                </h2>
              )}
              {data.genericName && (
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{data.genericName}</p>
              )}
              {data.manufacturer && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-sm text-[var(--foreground)]">{data.manufacturer}</span>
                  {data.manufacturerMatch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                      <CheckCircle2 className="size-3" />
                      {t.dashboard.resultVerified}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {data.priceBdt && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]">
                    BDT {data.priceBdt}
                  </span>
                )}
                {typeof data.requiresPrescription === "boolean" && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                      data.requiresPrescription
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    {data.requiresPrescription ? t.dashboard.prescriptionRequired : t.dashboard.noPrescriptionNeeded}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Trust Score + Confidence */}
        <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex flex-col items-center gap-1">
            <TrustScoreRing score={score} />
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{t.dashboard.verifiedBy}</p>
          </div>
          <ul className="flex-1 space-y-1.5 w-full">
            {Object.entries(breakdown).map(([key, value]) => {
              const ok = value === true;
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  {ok ? (
                    <CheckCircle2 className="size-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span className={ok ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"}>
                    {humaniseKey(key)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Section 3 — Uses */}
        {uses.length > 0 && (
          <div className="p-6 border-b border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
              {t.dashboard.whatIsItFor}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {visibleUses.map((use, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]"
                >
                  {use}
                </span>
              ))}
            </div>
            {uses.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllUses((v) => !v)}
                className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-3 inline-flex items-center gap-1 transition-smooth"
              >
                {showAllUses ? (
                  <>Show less <ChevronUp className="size-3" /></>
                ) : (
                  <>Show all ({uses.length}) <ChevronDown className="size-3" /></>
                )}
              </button>
            )}
          </div>
        )}

        {/* Section 4 — Side Effects (collapsible) */}
        {sideEffects.length > 0 && (
          <div className="border-b border-[var(--border)]">
            <button
              type="button"
              onClick={() => setSideEffectsOpen((v) => !v)}
              className="w-full p-6 flex items-center justify-between text-left hover:bg-[var(--card)] transition-smooth"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                <AlertTriangle className="size-3.5 text-amber-600" />
                {t.dashboard.sideEffectsLabel} ({sideEffects.length})
              </span>
              {sideEffectsOpen ? (
                <ChevronUp className="size-4 text-[var(--muted-foreground)]" />
              ) : (
                <ChevronDown className="size-4 text-[var(--muted-foreground)]" />
              )}
            </button>
            <AnimatePresence initial={false}>
              {sideEffectsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    <div className="flex flex-wrap gap-1.5">
                      {sideEffects.map((se, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200"
                        >
                          {se}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Section 5 — Fake Indicators */}
        {fakeIndicators.length > 0 && (
          <div className="p-6 border-b border-[var(--border)] bg-red-50/60">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-red-600" />
              <p className="text-xs font-semibold uppercase tracking-widest text-red-700">
                {t.dashboard.howToSpotFake}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fakeIndicators.map((item, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 6 — Safe Alternatives */}
        {safeAlternatives.length > 0 && (
          <div className="p-6 border-b border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
              {t.dashboard.safeAlternatives}
            </p>
            <div className="flex flex-wrap gap-2">
              {safeAlternatives.map((alt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onAlternativeClick?.(alt)}
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-smooth"
                >
                  {alt}
                  <ChevronRight className="size-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help us verify banner */}
        {showHelpBanner && (
          <div className="p-5 border-b border-amber-200 bg-amber-50 flex items-start gap-3">
            <HelpCircle className="size-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {data.foundInDatabase === false ? t.dashboard.notInDatabase : t.dashboard.lowConfidenceMatch}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">{t.dashboard.submitReportHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 transition-smooth whitespace-nowrap"
            >
              {t.dashboard.helpUsVerify}
            </button>
          </div>
        )}

        {/* Section 7 — AI Explanation */}
        {showExplanation && (
          <div className="p-6 bg-blue-50/60">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">
                  {t.dashboard.aiExplanation}
                </p>
                <p className="text-sm text-blue-900 leading-relaxed">{data.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <ReportMedicineModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        prefillName={data.medicineName ?? ""}
        prefillManufacturer={data.manufacturer ?? ""}
      />
    </>
  );
}
