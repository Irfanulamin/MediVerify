"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw, Plus, MapPin } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Nav from "@/app/components/Nav";
import { AlertCard, type AlertItem } from "@/app/components/alerts/AlertCard";
import { ReportAlertModal } from "@/app/components/ReportAlertModal";
import { useLanguage } from "@/lib/i18n";

type FilterKey = "all" | "Fake" | "Expired" | "Mislabeled" | "WrongDosage" | "Suspicious";
type Sort = "latest" | "upvotes";

interface AlertsResponse {
  items: AlertItem[];
  page: number;
  limit: number;
  total: number;
}

export default function PublicAlertsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<Sort>("latest");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  const FILTERS = useMemo(() => [
    { key: "all" as FilterKey, label: t.alerts.filterAll, value: undefined },
    { key: "Fake" as FilterKey, label: t.alerts.typeFake, value: "Fake" },
    { key: "Expired" as FilterKey, label: t.alerts.typeExpired, value: "Expired" },
    { key: "Mislabeled" as FilterKey, label: t.alerts.typeMislabeled, value: "Mislabeled" },
    { key: "WrongDosage" as FilterKey, label: t.alerts.filterWrongDosage, value: "WrongDosage" },
    { key: "Suspicious" as FilterKey, label: t.alerts.filterSuspicious, value: "Suspicious" },
  ], [t]);

  const alertType = useMemo(() => FILTERS.find((f) => f.key === filter)?.value, [filter, FILTERS]);

  const fetchAlerts = useCallback(async () => {
    try {
      const params: Record<string, string> = { page: "1", limit: "30", sort };
      if (alertType) params.alertType = alertType;
      const res = await axios.get<AlertsResponse>("/api/proxy/alerts", { params });
      setItems(res.data?.items ?? []);
    } catch {
      toast.error(t.alerts.couldNotLoadAlerts);
    } finally {
      setLoading(false);
    }
  }, [alertType, sort, t]);

  useEffect(() => {
    axios
      .get("/api/auth/me")
      .then((r) => setCurrentUserId(r.data?.id ?? r.data?.userId))
      .catch(() => setCurrentUserId(undefined));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Nav />

      <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <span className="size-10 rounded-xl bg-red-50 border border-red-100 grid place-items-center flex-shrink-0">
                <AlertTriangle className="size-5 text-red-600" strokeWidth={2.2} />
              </span>
              <div>
                <h1 className="font-display text-3xl md:text-[2.25rem] tracking-tight text-[var(--foreground)] leading-tight">
                  {t.alerts.title}
                </h1>
                <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
                  {t.alerts.subtitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth"
            >
              <Plus className="size-4" />
              {t.alerts.reportProblemBtn}
            </button>
          </div>
        </header>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-smooth ${
                  filter === key
                    ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                    : "bg-[var(--background)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              disabled
              title={t.alerts.nearMeComingSoon}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] opacity-60 cursor-not-allowed"
            >
              <MapPin className="size-3" /> {t.alerts.nearMe}
            </button>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            {(
              [
                { k: "latest" as Sort, l: t.alerts.sortLatest },
                { k: "upvotes" as Sort, l: t.alerts.sortMostUpvoted },
              ]
            ).map(({ k, l }) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                className={`px-3 py-1 rounded text-xs font-medium transition-smooth ${
                  sort === k
                    ? "bg-[var(--background)] text-[var(--foreground)] shadow-soft"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

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
      </main>

      <ReportAlertModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
