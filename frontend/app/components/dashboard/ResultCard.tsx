"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ChevronRight, AlertTriangle, Camera, Info } from "lucide-react";
import { TrustScoreRing } from "./TrustScoreRing";
import { useLanguage } from "@/lib/i18n";

interface VerifyResult {
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
}

interface Props {
  data: VerifyResult;
  onAlternativeClick?: (name: string) => void;
}

const verdictConfig = {
  VERIFIED: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    icon: ShieldCheck,
  },
  SUSPICIOUS: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    icon: ShieldAlert,
  },
  UNKNOWN: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    icon: ShieldQuestion,
  },
};

export function ResultCard({ data, onAlternativeClick }: Props) {
  const { t } = useLanguage();

  // Unreadable image state
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
            <p className="font-semibold text-amber-800 mb-1">Could not read image clearly</p>
            <p className="text-sm text-amber-700">
              Please try better lighting or type the medicine name directly.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Soft unverified state: Gemini general-knowledge fallback returned useful info
  if (data.foundInDatabase === false && data.trustScore && data.trustScore > 0) {
    return (
      <motion.div
        className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Disclaimer banner */}
        <div className="flex items-start gap-2 mb-5 pb-4 border-b border-amber-200">
          <Info className="size-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            General information only — not in our verified database. Please confirm with a pharmacist before use.
          </p>
        </div>

        {/* Medicine name */}
        {data.medicineName && (
          <p className="font-semibold text-lg text-amber-900 mb-1">{data.medicineName}</p>
        )}

        {/* General info */}
        {data.generalInfo && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 opacity-70 mb-1.5">
              General Information
            </p>
            <p className="text-sm text-amber-800 leading-relaxed">{data.generalInfo}</p>
          </div>
        )}

        {/* Explanation */}
        {data.explanation && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 opacity-70 mb-1.5">
              Analysis
            </p>
            <p className="text-sm text-amber-800 leading-relaxed opacity-80">{data.explanation}</p>
          </div>
        )}

        {/* Safe alternatives */}
        {data.safeAlternatives && data.safeAlternatives.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 opacity-70 mb-2">
              Safe Alternatives
            </p>
            <div className="flex flex-wrap gap-2">
              {data.safeAlternatives.map((alt, i) => (
                <button
                  key={i}
                  onClick={() => onAlternativeClick?.(alt)}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 opacity-80 hover:opacity-100 transition-smooth"
                >
                  {alt}
                  <ChevronRight className="size-3" />
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Hard error state: truly unknown (trustScore 0 — API failure or complete mismatch)
  if (data.foundInDatabase === false && data.result === "UNKNOWN") {
    return (
      <motion.div
        className="rounded-2xl border border-red-200 bg-red-50 p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 mb-1">
              {data.medicineName
                ? `"${data.medicineName}" was not found in our database`
                : "Medicine not found in our database"}
            </p>
            <p className="text-sm text-red-700">
              This medicine was not found in our database. Please consult a pharmacist.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const config = verdictConfig[data.result] ?? verdictConfig.UNKNOWN;
  const Icon = config.icon;
  const score = data.trustScore ?? (data.result === "VERIFIED" ? 88 : data.result === "SUSPICIOUS" ? 22 : 55);

  const verdictLabel =
    data.result === "VERIFIED"
      ? t.dashboard.resultVerified
      : data.result === "SUSPICIOUS"
      ? t.dashboard.resultSuspicious
      : t.dashboard.resultUnknown;

  return (
    <motion.div
      className={`rounded-2xl border p-6 ${config.bg}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Icon className={`size-6 ${config.text}`} strokeWidth={2} />
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 ${config.text}`}>
              {verdictLabel}
            </p>
            {data.medicineName && (
              <p className={`font-semibold text-lg leading-tight mt-0.5 ${config.text}`}>
                {data.medicineName}
              </p>
            )}
          </div>
        </div>
        <TrustScoreRing score={score} />
      </div>

      {/* Meta */}
      {(data.genericName || data.manufacturer) && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {data.genericName && (
            <div>
              <p className={`text-xs opacity-60 ${config.text}`}>{t.dashboard.genericName}</p>
              <p className={`text-sm font-medium ${config.text}`}>{data.genericName}</p>
            </div>
          )}
          {data.manufacturer && (
            <div>
              <p className={`text-xs opacity-60 ${config.text}`}>{t.dashboard.manufacturer}</p>
              <p className={`text-sm font-medium ${config.text}`}>{data.manufacturer}</p>
            </div>
          )}
        </div>
      )}

      {/* AI explanation */}
      {data.explanation && (
        <div className="mb-5">
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-1.5 ${config.text}`}>
            {t.dashboard.aiExplanation}
          </p>
          <p className={`text-sm leading-relaxed opacity-80 ${config.text}`}>{data.explanation}</p>
        </div>
      )}

      {/* Uses */}
      {data.uses && data.uses.length > 0 && (
        <div className="mb-5">
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-2 ${config.text}`}>
            Uses
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.uses.map((use, i) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-lg border border-current/20 opacity-80 ${config.text}`}
              >
                {use}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Side effects */}
      {data.sideEffects && data.sideEffects.length > 0 && (
        <div className="mb-5">
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-2 ${config.text}`}>
            Side Effects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.sideEffects.map((se, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200"
              >
                {se}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fake indicators */}
      {data.fakeIndicators && data.fakeIndicators.length > 0 && (
        <div className="mb-5">
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-2 ${config.text}`}>
            {t.dashboard.fakeIndicators}
          </p>
          <ul className="space-y-1">
            {data.fakeIndicators.map((item, i) => (
              <li key={i} className={`text-sm opacity-80 flex items-start gap-2 ${config.text}`}>
                <span className="mt-1.5 size-1.5 rounded-full bg-current flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safe alternatives */}
      {data.safeAlternatives && data.safeAlternatives.length > 0 && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-2 ${config.text}`}>
            {t.dashboard.safeAlternatives}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.safeAlternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => onAlternativeClick?.(alt)}
                className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-current opacity-70 hover:opacity-100 transition-smooth ${config.text}`}
              >
                {alt}
                <ChevronRight className="size-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
