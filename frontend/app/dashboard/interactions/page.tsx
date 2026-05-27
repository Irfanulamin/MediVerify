"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { InteractionResultCard } from "@/app/components/dashboard/InteractionResultCard";
import { useLanguage } from "@/lib/i18n";

interface InteractionResult {
  safe: boolean;
  severity?: "mild" | "moderate" | "severe";
  explanation?: string;
  recommendation?: string;
}

export default function InteractionsPage() {
  const { t } = useLanguage();
  const [med1, setMed1] = useState("");
  const [med2, setMed2] = useState("");
  const [result, setResult] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);

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
        `${process.env.NEXT_PUBLIC_API_URL}/verify/interactions`,
        { medicine1: med1.trim(), medicine2: med2.trim() }
      );
      setResult(res.data);
    } catch {
      toast.error(t.interactions.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="size-9 rounded-xl bg-[var(--foreground)] grid place-items-center flex-shrink-0">
          <Zap className="size-4 text-[var(--background)]" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
            {t.interactions.title}
          </h1>
        </div>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              {t.interactions.medicine1}
            </label>
            <input
              type="text"
              value={med1}
              onChange={(e) => setMed1(e.target.value)}
              placeholder={t.interactions.placeholder1}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1.5">
              {t.interactions.medicine2}
            </label>
            <input
              type="text"
              value={med2}
              onChange={(e) => setMed2(e.target.value)}
              placeholder={t.interactions.placeholder2}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !med1.trim() || !med2.trim()}
          className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth disabled:opacity-40"
        >
          {loading ? t.interactions.checking : t.interactions.checkBtn}
        </button>
      </motion.form>

      {loading && (
        <div className="rounded-2xl border border-[var(--border)] p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-5 bg-[var(--card)] rounded w-1/4" />
            <div className="h-3 bg-[var(--card)] rounded w-3/4" />
            <div className="h-3 bg-[var(--card)] rounded w-2/3" />
          </div>
        </div>
      )}

      {result && !loading && <InteractionResultCard data={result} />}
    </div>
  );
}
