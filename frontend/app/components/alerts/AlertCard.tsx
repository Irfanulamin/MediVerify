"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, ThumbsUp } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export interface AlertItem {
  _id: string;
  medicineName: string;
  alertType: "Fake" | "Expired" | "Mislabeled" | "WrongDosage" | "Suspicious";
  location: string;
  pharmacyName?: string;
  description: string;
  batchNumber?: string;
  photoUrl?: string;
  isVerified: boolean;
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

const TYPE_THEME: Record<AlertItem["alertType"], { bg: string; text: string; label: string }> = {
  Fake: { bg: "bg-red-100 border-red-200", text: "text-red-800", label: "Fake" },
  Expired: { bg: "bg-orange-100 border-orange-200", text: "text-orange-800", label: "Expired" },
  Mislabeled: { bg: "bg-amber-100 border-amber-200", text: "text-amber-800", label: "Mislabeled" },
  WrongDosage: { bg: "bg-purple-100 border-purple-200", text: "text-purple-800", label: "Wrong Dosage" },
  Suspicious: { bg: "bg-slate-100 border-slate-200", text: "text-slate-800", label: "Suspicious" },
};

function formatRelative(iso: string) {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function AlertCard({ alert, currentUserId, onUpvoted }: Props) {
  const router = useRouter();
  const theme = TYPE_THEME[alert.alertType] ?? TYPE_THEME.Suspicious;
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
        toast.error("Please log in to upvote alerts");
        router.push("/login");
      } else {
        toast.error("Could not upvote. Try again.");
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
              {theme.label}
            </span>
            {alert.isVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="size-3" /> Verified
              </span>
            )}
            <span className="text-[11px] text-[var(--muted-foreground)]">{formatRelative(alert.createdAt)}</span>
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
        <button
          type="button"
          onClick={handleUpvote}
          disabled={busy}
          className={`flex flex-col items-center justify-center min-w-[52px] px-2 py-1.5 rounded-xl border transition-smooth ${
            localUpvotedByMe
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]"
          } ${busy ? "opacity-60 cursor-wait" : ""}`}
          title={localUpvotedByMe ? "Remove your upvote" : "Confirm this alert"}
        >
          <ThumbsUp className="size-4" strokeWidth={localUpvotedByMe ? 2.5 : 1.8} />
          <span className="text-xs font-semibold tabular-nums">{localUpvotes}</span>
        </button>
      </div>
      <p className="text-sm text-[var(--foreground)] leading-relaxed">{alert.description}</p>
      {alert.batchNumber && (
        <p className="text-xs text-[var(--muted-foreground)] mt-2 font-mono">Batch: {alert.batchNumber}</p>
      )}
    </motion.div>
  );
}
