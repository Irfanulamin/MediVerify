"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";

interface Alert {
  _id: string;
  medicineName: string;
  alertType: string;
  location: string;
  description: string;
  isVerified: boolean;
  createdAt: string;
}

export default function AdminAlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("mv_token")}` },
  });

  const fetchAlerts = async () => {
    try {
      const r = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/alerts`);
      setAlerts(r.data);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/alerts/${id}`, {}, authHeader());
      setAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isVerified: true } : a)));
      toast.success("Alert approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const remove = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/alerts/${id}`, authHeader());
      setAlerts((prev) => prev.filter((a) => a._id !== id));
      toast.success("Alert deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)] mb-8">
        {t.admin.alertsMgmt}
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm">No alerts found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--card)]">
                {[t.admin.colMedicine, t.admin.colType, t.admin.colLocation, t.admin.colDate, t.admin.colVerified, t.admin.colActions].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, i) => (
                <motion.tr
                  key={alert._id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--card)] transition-smooth"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{alert.medicineName}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{alert.alertType}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{alert.location}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {alert.isVerified ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                        <CheckCircle2 className="size-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-[var(--muted-foreground)] text-xs">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!alert.isVerified && (
                        <button
                          onClick={() => approve(alert._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-smooth"
                        >
                          <CheckCircle2 className="size-3" />
                          {t.admin.approveBtn}
                        </button>
                      )}
                      <button
                        onClick={() => remove(alert._id)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-smooth"
                      >
                        <Trash2 className="size-3" />
                        {t.admin.deleteBtn}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
