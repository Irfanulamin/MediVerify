"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ChevronRight } from "lucide-react";
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
