"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";

type Status = "pending" | "verified" | "rejected";

interface AlertItem {
  _id: string;
  medicineName: string;
  alertType: string;
  pharmacyName?: string;
  location?: string;
  reportedBy?: string;
  status: Status;
  createdAt: string;
}

export default function AdminAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Status>("pending");

  useEffect(() => {
    axios.get("/api/proxy/alerts/all")
      .then((r) => setAlerts(r.data))
      .catch(() => toast.error(t.admin.failedLoadAlerts))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = (id: string, status: Status) =>
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, status } : a)));

  const verify = async (id: string) => {
    await axios.patch(`/api/proxy/alerts/${id}`);
    setStatus(id, "verified");
    toast.success(t.admin.alertVerified);
  };

  const reject = async (id: string) => {
    await axios.patch(`/api/proxy/alerts/${id}/reject`);
    setStatus(id, "rejected");
    toast.success(t.admin.alertRejected);
  };

  const remove = async (id: string) => {
    await axios.delete(`/api/proxy/alerts/${id}`);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    toast.success(t.admin.alertDeleted);
  };

  const counts: Record<Status, number> = {
    pending: alerts.filter((a) => a.status === "pending").length,
    verified: alerts.filter((a) => a.status === "verified").length,
    rejected: alerts.filter((a) => a.status === "rejected").length,
  };
  const items = alerts.filter((a) => a.status === tab);

  const tabLabel: Record<Status, string> = {
    pending: t.admin.pending,
    verified: t.admin.colVerified,
    rejected: t.alerts.falseAlert,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
          {t.admin.alertsMgmt}
        </h1>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          {(["pending", "verified", "rejected"] as Status[]).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-smooth ${
                tab === tb
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tabLabel[tb]} ({counts[tb]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--muted-foreground)]">
          {t.admin.alertsEmptyHint}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[t.admin.colMedicine, t.admin.colType, t.admin.pharmacy, t.admin.colLocation, t.admin.colDate, t.admin.colActions].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((alert) => (
                <tr key={alert._id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/30 transition-smooth">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{alert.medicineName}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {alert.alertType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{alert.pharmacyName || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{alert.location || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap text-xs">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {alert.status !== "verified" && (
                        <button
                          onClick={() => verify(alert._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-smooth"
                        >
                          <CheckCircle2 className="size-3" /> {t.admin.verifyAction}
                        </button>
                      )}
                      {alert.status !== "rejected" && (
                        <button
                          onClick={() => reject(alert._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-smooth"
                        >
                          <XCircle className="size-3" /> {t.admin.rejectAction}
                        </button>
                      )}
                      <button
                        onClick={() => remove(alert._id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-smooth"
                      >
                        <Trash2 className="size-3" /> {t.admin.deleteBtn}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
