"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, AlertTriangle, ShieldAlert, Skull, Info, Clock, Stethoscope } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export type InteractionSeverity = "SAFE" | "MILD" | "MODERATE" | "SEVERE" | "DANGEROUS";

export interface InteractionMedicineInfo {
  name: string;
  generic_name?: string | null;
  manufacturer?: string | null;
  found?: boolean;
}

export interface InteractionResult {
  is_safe: boolean;
  severity: InteractionSeverity;
  interaction_type: string;
  what_happens: string;
  recommendation: string;
  can_take_together: boolean;
  time_gap_needed?: string | null;
  consult_doctor: boolean;
  medicine1?: InteractionMedicineInfo;
  medicine2?: InteractionMedicineInfo;
  source?: string;
}

interface Props {
  data: InteractionResult;
}

const severityStyle: Record<InteractionSeverity, { bg: string; border: string; text: string; Icon: typeof CheckCircle2 }> = {
  SAFE: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", Icon: CheckCircle2 },
  MILD: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", Icon: AlertCircle },
  MODERATE: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", Icon: AlertTriangle },
  SEVERE: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", Icon: ShieldAlert },
  DANGEROUS: { bg: "bg-red-100", border: "border-red-300", text: "text-red-900", Icon: Skull },
};

function MedicineSummary({ info, label }: { info?: InteractionMedicineInfo; label: string }) {
  const { t } = useLanguage();
  if (!info) return null;
  return (
    <div className="glass-card rounded-2xl p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{label}</p>
      <p className="text-sm font-semibold text-[var(--foreground)]">{info.name}</p>
      {info.generic_name && (
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{info.generic_name}</p>
      )}
      {info.manufacturer && (
        <p className="text-xs text-[var(--muted-foreground)] mt-1">{info.manufacturer}</p>
      )}
      {info.found === false && (
        <p className="text-xs text-amber-700 mt-2">{t.interactions.medicineNotFound}</p>
      )}
    </div>
  );
}

export function InteractionResultCard({ data }: Props) {
  const { t } = useLanguage();
  const style = severityStyle[data.severity] ?? severityStyle.MODERATE;
  const { Icon } = style;

  const headlineMap: Record<InteractionSeverity, string> = {
    SAFE: t.interactions.safeTogether,
    MILD: t.interactions.minorInteraction,
    MODERATE: t.interactions.useWithCaution,
    SEVERE: t.interactions.dangerousCombination,
    DANGEROUS: t.interactions.doNotTakeTogether,
  };
  const headline = headlineMap[data.severity] ?? data.severity;

  return (
    <motion.div
      className="glass-card rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`p-5 border-b ${style.border} ${style.bg}`}>
        <div className="flex items-center gap-3">
          <Icon className={`size-7 ${style.text}`} strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${style.text} opacity-70`}>
              {data.severity}
            </p>
            <p className={`text-lg font-semibold ${style.text} leading-tight`}>{headline}</p>
            {data.interaction_type && data.interaction_type.toLowerCase() !== "no known interaction" && (
              <p className={`text-xs ${style.text} opacity-80 mt-0.5`}>{data.interaction_type}</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">
          {t.interactions.whatHappensTogether}
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">{data.what_happens}</p>
      </div>

      <div className="p-6 border-b border-[var(--border)] bg-blue-50/60">
        <div className="flex items-start gap-2">
          <Info className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-1">
              {t.interactions.recommendation}
            </p>
            <p className="text-sm text-blue-900 leading-relaxed">{data.recommendation}</p>
          </div>
        </div>
      </div>

      {data.time_gap_needed && (
        <div className="p-5 border-b border-amber-200 bg-amber-50 flex items-center gap-3">
          <Clock className="size-5 text-amber-700 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-800">
              {t.interactions.timeGapNeeded}
            </p>
            <p className="text-sm font-semibold text-amber-900 mt-0.5">{data.time_gap_needed}</p>
          </div>
        </div>
      )}

      {data.consult_doctor && (
        <div className="p-5 border-b border-red-200 bg-red-50 flex items-start gap-3">
          <Stethoscope className="size-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{t.interactions.consultDoctor}</p>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              {t.interactions.consultDoctorHint}
            </p>
          </div>
        </div>
      )}

      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3">
          {t.interactions.medicinesCompared}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MedicineSummary info={data.medicine1} label={t.interactions.medicine1} />
          <MedicineSummary info={data.medicine2} label={t.interactions.medicine2} />
        </div>
      </div>
    </motion.div>
  );
}
