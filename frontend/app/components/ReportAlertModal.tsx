"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

interface Props {
  /** Modal mode */
  open?: boolean;
  onClose?: () => void;
  /** Inline mode — render the form bare (no overlay), e.g. as a page tab */
  inline?: boolean;
}

export function ReportAlertModal({ open = false, onClose, inline = false }: Props) {
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

  useEffect(() => {
    if (!inline && !open) return;
    axios.get("/api/auth/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, [open, inline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/proxy/alerts", form);
      toast.success(t.alerts.reportModalSuccess);
      setForm({ medicineName: "", alertType: "Fake", pharmacyName: "", location: "", description: "", batchNumber: "" });
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
            <select
              value={form.alertType}
              onChange={(e) => setForm((f) => ({ ...f, alertType: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="Fake">{t.alerts.typeFake}</option>
              <option value="Expired">{t.alerts.typeExpired}</option>
              <option value="Mislabeled">{t.alerts.typeMislabeled}</option>
              <option value="WrongDosage">{t.alerts.filterWrongDosage}</option>
              <option value="Suspicious">{t.alerts.filterSuspicious}</option>
            </select>
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
