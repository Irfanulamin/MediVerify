"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowLeftRight } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { InteractionResultCard, type InteractionResult } from "@/app/components/dashboard/InteractionResultCard";
import { MedicineAutocomplete } from "@/app/components/dashboard/MedicineAutocomplete";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { useLanguage } from "@/lib/i18n";

export default function InteractionsPage() {
  const { t } = useLanguage();
  const [med1, setMed1] = useState("");
  const [med2, setMed2] = useState("");
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const swap = () => {
    setMed1(med2);
    setMed2(med1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!med1.trim() || !med2.trim()) {
      toast.error(t.interactions.errorBothRequired);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(
        `/api/proxy/verify/interactions`,
        { medicine1: med1.trim(), medicine2: med2.trim() }
      );
      setResult(res.data as InteractionResult);
    } catch (err: any) {
      console.error("[interactions] failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      toast.error(t.interactions.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="size-10 rounded-xl bg-[var(--foreground)] grid place-items-center flex-shrink-0">
            <Zap className="size-5 text-[var(--background)]" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-[2.25rem] tracking-tight text-[var(--foreground)] leading-tight">
              {t.interactions.title}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
              {t.interactions.interactionsSubtext}
            </p>
          </div>
        </div>
      </header>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <div className="grid md:grid-cols-[1fr_auto_1fr] items-end gap-3 mb-4">
          <MedicineAutocomplete
            value={med1}
            onChange={setMed1}
            label={t.interactions.medicine1}
            placeholder={t.interactions.placeholder1}
            required
          />
          <button
            type="button"
            onClick={swap}
            aria-label={t.interactions.swap}
            title={t.interactions.swap}
            className="focus-ring mx-auto flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--accent)] hover:border-[var(--accent)] active:scale-95 transition-smooth md:mt-5"
          >
            <ArrowLeftRight className="size-4 rotate-90 md:rotate-0" />
          </button>
          <MedicineAutocomplete
            value={med2}
            onChange={setMed2}
            label={t.interactions.medicine2}
            placeholder={t.interactions.placeholder2}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !med1.trim() || !med2.trim()}
          className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-40"
        >
          {loading ? t.interactions.checking : t.interactions.checkBtn}
        </button>
      </motion.form>

      {loading && (
        <div className="glass-card rounded-2xl p-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}

      {result && !loading && <InteractionResultCard data={result} />}

      {!result && !loading && (
        <EmptyState icon={Zap} title={t.interactions.emptyTitle} subtitle={t.interactions.emptySubtitle} />
      )}
    </div>
  );
}
