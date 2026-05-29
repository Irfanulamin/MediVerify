"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Check } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

interface Props {
  /** Modal mode */
  open?: boolean;
  onClose?: () => void;
  /** Inline mode — render the form bare (no overlay), e.g. as a page section */
  inline?: boolean;
  /** Called after a successful submission (e.g. to refetch the list) */
  onSubmitted?: () => void;
}

export function ReportAlertModal({ open = false, onClose, inline = false, onSubmitted }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    medicineName: "",
    alertType: "Fake",
    pharmacyName: "",
    location: "",
    description: "",
    batchNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inline && !open) return;
    axios.get("/api/auth/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, [open, inline]);

  // Close the custom type dropdown when clicking outside it.
  useEffect(() => {
    if (!typeOpen) return;
    const onDown = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [typeOpen]);

  const ALERT_TYPE_OPTIONS = [
    { value: "Fake", label: t.alerts.typeFake, dot: "bg-red-500" },
    { value: "Expired", label: t.alerts.typeExpired, dot: "bg-orange-500" },
    { value: "Mislabeled", label: t.alerts.typeMislabeled, dot: "bg-amber-500" },
    { value: "WrongDosage", label: t.alerts.filterWrongDosage, dot: "bg-purple-500" },
    { value: "Suspicious", label: t.alerts.filterSuspicious, dot: "bg-slate-500" },
  ];
  const selectedType = ALERT_TYPE_OPTIONS.find((o) => o.value === form.alertType) ?? ALERT_TYPE_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/proxy/alerts", form);
      toast.success(t.alerts.reportModalSuccess);
      setForm({ medicineName: "", alertType: "Fake", pharmacyName: "", location: "", description: "", batchNumber: "" });
      onSubmitted?.();
      onClose?.();
    } catch {
      toast.error(t.alerts.reportModalFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const body = (
    <>
      <h2 className="font-semibold text-[var(--foreground)] mb-5">
        {t.alerts.reportModalTitle}
      </h2>

      {isLoggedIn === null ? (
        <div className="flex justify-center py-8">
          <div className="size-6 rounded-full border-2 border-[var(--border)] border-t-[var(--foreground)] animate-spin" />
        </div>
      ) : !isLoggedIn ? (
        <div className="text-center py-4">
          <p className="text-[var(--muted-foreground)] text-sm mb-4">
            {t.alerts.reportModalLoginPrompt}
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth"
          >
            {t.alerts.loginToReport}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              {t.alerts.reportModalMedicine}
            </label>
            <input
              required
              value={form.medicineName}
              onChange={(e) => setForm((f) => ({ ...f, medicineName: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              {t.alerts.reportModalType}
            </label>
            <div className="relative" ref={typeRef}>
              <button
                type="button"
                onClick={() => setTypeOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={typeOpen}
                className={`w-full flex items-center justify-between gap-2 pl-3 pr-3 py-2.5 rounded-xl border bg-[var(--background)] text-[var(--foreground)] text-sm transition-smooth ${
                  typeOpen
                    ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/20"
                    : "border-[var(--border)] hover:border-[var(--accent)]/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${selectedType.dot}`} />
                  {selectedType.label}
                </span>
                <ChevronDown className={`size-4 text-[var(--muted-foreground)] transition-transform ${typeOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {typeOpen && (
                  <motion.ul
                    role="listbox"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-30 mt-1.5 w-full p-1 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-soft"
                  >
                    {ALERT_TYPE_OPTIONS.map((opt) => {
                      const active = opt.value === form.alertType;
                      return (
                        <li key={opt.value} role="option" aria-selected={active}>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((f) => ({ ...f, alertType: opt.value }));
                              setTypeOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm transition-smooth ${
                              active
                                ? "bg-[var(--accent)]/10 text-[var(--foreground)] font-medium"
                                : "text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${opt.dot}`} />
                              {opt.label}
                            </span>
                            {active && <Check className="size-4 text-[var(--accent)]" />}
                          </button>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              {t.alerts.reportModalPharmacy}
            </label>
            <input
              value={form.pharmacyName}
              onChange={(e) => setForm((f) => ({ ...f, pharmacyName: e.target.value }))}
              placeholder={t.alerts.reportModalPharmacyPlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              {t.alerts.reportModalLocation}
            </label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder={t.alerts.reportModalLocationPlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              {t.alerts.reportModalBatch}
            </label>
            <input
              value={form.batchNumber}
              onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
              placeholder={t.alerts.reportModalBatchPlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
              {t.alerts.reportModalDesc}
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth disabled:opacity-40"
          >
            {submitting ? t.alerts.reportModalSubmitting : t.alerts.reportModalSubmit}
          </button>
        </form>
      )}
    </>
  );

  if (inline) {
    return <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-auto">{body}</div>;
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-card rounded-2xl p-6 w-full max-w-md relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="size-4" />
              </button>
              {body}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
