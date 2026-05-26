"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Alert {
  _id: string;
  medicineName: string;
  alertType: "Fake" | "Expired" | "Mislabeled";
  location: string;
  description: string;
  isVerified: boolean;
  createdAt: string;
}

interface Props {
  alert: Alert;
  index?: number;
}

const typeColors: Record<string, string> = {
  Fake: "bg-red-100 text-red-700",
  Expired: "bg-amber-100 text-amber-700",
  Mislabeled: "bg-orange-100 text-orange-700",
};

export function AlertCard({ alert, index = 0 }: Props) {
  const { t } = useLanguage();

  const typeLabel =
    alert.alertType === "Fake"
      ? t.alerts.typeFake
      : alert.alertType === "Expired"
      ? t.alerts.typeExpired
      : t.alerts.typeMislabeled;

  const date = new Date(alert.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      className="glass-card rounded-2xl p-5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${typeColors[alert.alertType] ?? typeColors.Fake}`}>
            {typeLabel}
          </span>
          <p className="font-semibold text-[var(--foreground)]">{alert.medicineName}</p>
        </div>
        {alert.isVerified && (
          <div className="flex items-center gap-1 text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="size-4" />
            <span className="text-xs font-medium">{t.alerts.verified}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-[var(--muted-foreground)] mb-3 leading-relaxed">
        {alert.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1">
          <MapPin className="size-3" />
          {alert.location}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3" />
          {date}
        </span>
      </div>
    </motion.div>
  );
}
