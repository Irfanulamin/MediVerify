"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GitCompare, Search } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { CompareResultCard, type CompareResult } from "@/app/components/dashboard/CompareResultCard";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { useLanguage } from "@/lib/i18n";

export default function ComparePage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = query.trim();
    if (!name) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`/api/proxy/compare`, { name });
      setResult(res.data as CompareResult);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) toast.error(t.dashboard.loginToCompare);
      else toast.error(t.dashboard.compareFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="size-10 rounded-xl bg-[var(--foreground)] grid place-items-center flex-shrink-0">
            <GitCompare className="size-5 text-[var(--background)]" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-[2.25rem] tracking-tight text-[var(--foreground)] leading-tight">
              {t.dashboard.compareHeading}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
              {t.dashboard.compareSubtext}
            </p>
          </div>
        </div>
      </header>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.dashboard.comparePlaceholder}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? t.dashboard.comparingBtn : t.dashboard.compareBtn}
          </button>
        </div>
      </motion.form>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-32 rounded-xl" />
            ))}
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
          >
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      )}

      {result && !loading && <CompareResultCard data={result} />}

      {!result && !loading && (
        <EmptyState
          icon={GitCompare}
          title={t.dashboard.compareHeading}
          subtitle={t.dashboard.compareEmptyHint}
        />
      )}
    </div>
  );
}
