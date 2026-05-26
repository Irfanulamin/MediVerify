"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface InteractionResult {
  interaction_level?: string;
  safe?: boolean;
  severity?: string;
  explanation?: string;
  recommendation?: string;
}

interface Props {
  data: InteractionResult;
}

export function InteractionResultCard({ data }: Props) {
  const { t } = useLanguage();

  const level = data.interaction_level?.toUpperCase() ?? (data.safe ? "SAFE" : "MODERATE");
  const isSafe = level === "SAFE";
  const isHigh = level === "HIGH";

  const config = isSafe
    ? { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle }
    : isHigh
    ? { bg: "bg-red-50 border-red-200", text: "text-red-700", icon: XCircle }
    : { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: AlertTriangle };

  const Icon = config.icon;

  const severityLabel =
    data.severity === "mild" || level === "SAFE"
      ? t.interactions.severityMild
      : data.severity === "severe" || level === "HIGH"
      ? t.interactions.severitySevere
      : t.interactions.severityModerate;

  return (
    <motion.div
      className={`rounded-2xl border p-6 ${config.bg}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`size-6 ${config.text}`} strokeWidth={2} />
        <p className={`font-semibold text-lg ${config.text}`}>{severityLabel}</p>
      </div>

      {data.explanation && (
        <div className="mb-4">
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-1.5 ${config.text}`}>
            {t.interactions.explanation}
          </p>
          <p className={`text-sm leading-relaxed opacity-80 ${config.text}`}>{data.explanation}</p>
        </div>
      )}

      {data.recommendation && (
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest opacity-60 mb-1.5 ${config.text}`}>
            {t.interactions.recommendation}
          </p>
          <p className={`text-sm leading-relaxed opacity-80 ${config.text}`}>{data.recommendation}</p>
        </div>
      )}
    </motion.div>
  );
}
