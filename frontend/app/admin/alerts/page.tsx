"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";

interface AlertItem {
  _id: string;
  medicineName: string;
  alertType: string;
  pharmacyName?: string;
  location?: string;
  reportedBy?: string;
  isVerified: boolean;
  createdAt: string;
}

type Tab = "pending" | "verified";

export default function AdminAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");

  useEffect(() => {
    axios.get("/api/proxy/alerts/all")
      .then((r) => setAlerts(r.data))
      .catch(() => toast.error("Failed to load alerts"))
      .finally(() => setLoading(false));
  }, []);

  const verify = async (id: string) => {
    await axios.patch(`/api/proxy/alerts/${id}`, { isVerified: true });
    setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isVerified: true } : a)));
    toast.success("Alert verified");
  };

  const reject = async (id: string) => {
    await axios.delete(`/api/proxy/alerts/${id}`);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    toast.success("Alert rejected");
  };

  const remove = async (id: string) => {
    await axios.delete(`/api/proxy/alerts/${id}`);
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    toast.success("Alert deleted");
  };

  const pending = alerts.filter((a) => !a.isVerified);
  const verified = alerts.filter((a) => a.isVerified);
  const items = tab === "pending" ? pending : verified;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
          {t.admin.alertsMgmt}
        </h1>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          {(["pending", "verified"] as Tab[]).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-smooth ${
                tab === tb
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {tb === "pending" ? `Pending (${pending.length})` : `Verified (${verified.length})`}
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
          No {tab} alerts.
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[t.admin.colMedicine, t.admin.colType, "Pharmacy", t.admin.colLocation, t.admin.colDate, t.admin.colActions].map((col) => (
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
                      {tab === "pending" ? (
                        <>
                          <button
                            onClick={() => verify(alert._id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-smooth"
                          >
                            <CheckCircle2 className="size-3" /> Verify
                          </button>
                          <button
                            onClick={() => reject(alert._id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-smooth"
                          >
                            <XCircle className="size-3" /> Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => remove(alert._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-smooth"
                        >
                          <Trash2 className="size-3" /> {t.admin.deleteBtn}
                        </button>
                      )}
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
