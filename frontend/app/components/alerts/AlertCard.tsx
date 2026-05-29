"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, ThumbsUp, Clock, XCircle } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useLanguage, type Translations } from "@/lib/i18n";

export interface AlertItem {
  _id: string;
  medicineName: string;
  alertType: "Fake" | "Expired" | "Mislabeled" | "WrongDosage" | "Suspicious";
  location: string;
  pharmacyName?: string;
  description: string;
  batchNumber?: string;
  photoUrl?: string;
  status: "pending" | "verified" | "rejected";
  upvotes?: string[];
  reportedBy?: string;
  createdAt: string;
  upvoteCount?: number;
}

interface Props {
  alert: AlertItem;
  currentUserId?: string;
  onUpvoted?: (next: AlertItem) => void;
}

const TYPE_THEME: Record<AlertItem["alertType"], { bg: string; text: string }> = {
  Fake: { bg: "bg-red-100 border-red-200", text: "text-red-800" },
  Expired: { bg: "bg-orange-100 border-orange-200", text: "text-orange-800" },
  Mislabeled: { bg: "bg-amber-100 border-amber-200", text: "text-amber-800" },
  WrongDosage: { bg: "bg-purple-100 border-purple-200", text: "text-purple-800" },
  Suspicious: { bg: "bg-slate-100 border-slate-200", text: "text-slate-800" },
};

function typeLabel(t: Translations, type: AlertItem["alertType"]) {
  const labels: Record<AlertItem["alertType"], string> = {
    Fake: t.alerts.typeFake,
    Expired: t.alerts.typeExpired,
    Mislabeled: t.alerts.typeMislabeled,
    WrongDosage: t.alerts.filterWrongDosage,
    Suspicious: t.alerts.filterSuspicious,
  };
  return labels[type] ?? labels.Suspicious;
}

function formatRelative(iso: string, t: Translations) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t.alerts.relJustNow;
  if (minutes < 60) return t.alerts.relMinutes.replace("{n}", String(minutes));
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t.alerts.relHours.replace("{n}", String(hours));
  const days = Math.floor(hours / 24);
  if (days < 30) return t.alerts.relDays.replace("{n}", String(days));
  return date.toLocaleDateString();
}

export function AlertCard({ alert, currentUserId, onUpvoted }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const theme = TYPE_THEME[alert.alertType] ?? TYPE_THEME.Suspicious;
  const statusBadge = {
    verified: { Icon: CheckCircle2, cls: "text-emerald-700", label: t.alerts.verified },
    pending: { Icon: Clock, cls: "text-amber-700", label: t.alerts.statusPending },
    rejected: { Icon: XCircle, cls: "text-slate-500", label: t.alerts.falseAlert },
  }[alert.status] ?? { Icon: Clock, cls: "text-amber-700", label: t.alerts.statusPending };
  const StatusIcon = statusBadge.Icon;
  const upvoteCount = alert.upvoteCount ?? alert.upvotes?.length ?? 0;
  const upvotedByMe = !!currentUserId && (alert.upvotes ?? []).map(String).includes(currentUserId);
  const [busy, setBusy] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(upvoteCount);
  const [localUpvotedByMe, setLocalUpvotedByMe] = useState(upvotedByMe);

  const handleUpvote = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await axios.patch(`/api/proxy/alerts/${alert._id}/upvote`, {});
      const next = res.data as AlertItem;
      const nextCount = next.upvotes?.length ?? 0;
      const nextMine = !!currentUserId && (next.upvotes ?? []).map(String).includes(currentUserId);
      setLocalUpvotes(nextCount);
      setLocalUpvotedByMe(nextMine);
      onUpvoted?.({ ...alert, upvotes: next.upvotes ?? [], upvoteCount: nextCount });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error(t.alerts.loginToUpvote);
        router.push("/login");
      } else {
        toast.error(t.alerts.upvoteFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded border ${theme.bg} ${theme.text}`}>
              {typeLabel(t, alert.alertType)}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${statusBadge.cls}`}>
              <StatusIcon className="size-3" /> {statusBadge.label}
            </span>
            <span className="text-[11px] text-[var(--muted-foreground)]">{formatRelative(alert.createdAt, t)}</span>
          </div>
          <h3 className="text-base font-semibold text-[var(--foreground)] truncate">{alert.medicineName}</h3>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-0.5">
            <MapPin className="size-3" />
            <span>
              {alert.pharmacyName ? `${alert.pharmacyName} · ` : ""}
              {alert.location}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">{alert.description}</p>
      {alert.batchNumber && (
        <p className="text-xs text-[var(--muted-foreground)] mt-2 font-mono">{t.alerts.batchPrefix}: {alert.batchNumber}</p>
      )}
      {alert.status === "pending" && (
        <p className="inline-flex items-center gap-1 mt-3 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
          <Clock className="size-3" /> {t.alerts.awaitingVerification}
        </p>
      )}
    </motion.div>
  );
}
