"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCcw } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { AlertCard, type AlertItem } from "@/app/components/alerts/AlertCard";
import { ReportAlertModal } from "@/app/components/ReportAlertModal";
import { useLanguage } from "@/lib/i18n";

interface AlertsResponse {
  items: AlertItem[];
  page: number;
  limit: number;
  total: number;
}

export default function DashboardAlertsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await axios.get<AlertsResponse>("/api/proxy/alerts", {
        params: { page: "1", limit: "30", sort: "latest" },
      });
      setItems(res.data?.items ?? []);
    } catch {
      toast.error(t.alerts.couldNotLoadAlerts);
    } finally {
      setLoading(false);
    }
  // `t` is intentionally omitted: it only feeds the error toast, and including it
  // would rebuild fetchAlerts on every language toggle, churning the 30s interval.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((r) => setCurrentUserId(r.data?.id ?? r.data?.userId))
      .catch(() => setCurrentUserId(undefined));
  }, []);

  useEffect(() => {
    // `loading` defaults to true, so the skeleton shows only on the very first load.
    // The 30s background refresh updates the list in place (items are keyed by `_id`,
    // so cards keep their identity and don't re-animate).
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="font-display text-3xl md:text-[2.25rem] tracking-tight text-[var(--foreground)] leading-tight">
              {t.alerts.title}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
              {t.alerts.subtitle}
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* List column — always shows all alerts (verified / pending / rejected mixed) */}
        <div>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl border border-[var(--border)] bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] p-10 text-center">
              <p className="text-sm text-[var(--muted-foreground)]">
                {t.alerts.noAlertsInCategory}
              </p>
            </div>
          ) : (
            <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {items.map((a) => (
                <AlertCard
                  key={a._id}
                  alert={a}
                  currentUserId={currentUserId}
                  onUpvoted={(next) => {
                    setItems((prev) => prev.map((p) => (p._id === next._id ? { ...p, ...next } : p)));
                  }}
                />
              ))}
            </motion.div>
          )}

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
            <RefreshCcw className="size-3" />
            <span>{t.alerts.refreshing}</span>
          </div>
        </div>

        {/* Report form — co-located, sticky on wide screens */}
        <aside className="lg:sticky lg:top-8">
          <p className="text-xs text-[var(--muted-foreground)] mb-3 px-1">{t.alerts.reportPanelSubtitle}</p>
          <ReportAlertModal inline onSubmitted={fetchAlerts} />
        </aside>
      </div>
    </div>
  );
}
