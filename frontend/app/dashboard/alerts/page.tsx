"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Plus } from "lucide-react";
import axios from "axios";
import { AlertCard } from "@/app/components/AlertCard";
import { ReportAlertModal } from "@/app/components/ReportAlertModal";
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

export default function AlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/alerts`);
      setAlerts(res.data);
    } catch {
      // fail silently on auto-refresh
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-red-100 grid place-items-center">
            <AlertTriangle className="size-4 text-red-600" />
          </div>
          <div>
            <h1 className="font-semibold text-[var(--foreground)]">{t.alerts.title}</h1>
            <p className="text-xs text-[var(--muted-foreground)]">{t.alerts.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-smooth"
          >
            <Plus className="size-3" />
            {t.alerts.reportBtn}
          </button>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-smooth"
          >
            <RefreshCw className="size-3" />
            <span className="hidden sm:inline">{t.alerts.refreshing}</span>
          </button>
        </div>
      </div>

      {/* Count header */}
      {!loading && alerts.length > 0 && (
        <p className="text-xs text-[var(--muted-foreground)] mb-5">
          {alerts.length} {alerts.length === 1 ? t.alerts.count : t.alerts.countPlural}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] p-5 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="h-5 w-16 bg-[var(--card)] rounded-full" />
                <div className="h-5 w-32 bg-[var(--card)] rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-[var(--card)] rounded w-full" />
                <div className="h-3 bg-[var(--card)] rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertTriangle className="size-12 mx-auto text-[var(--border)] mb-4" />
          <p className="font-medium text-[var(--foreground)]">{t.alerts.emptyTitle}</p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{t.alerts.emptySubtitle}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => (
            <AlertCard key={alert._id} alert={alert} index={i} />
          ))}
        </div>
      )}

      <ReportAlertModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
