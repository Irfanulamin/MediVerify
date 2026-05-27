"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ReportAlertModal({ open, onClose }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    medicineName: "",
    alertType: "Fake",
    location: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    axios.get("/api/auth/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post("/api/proxy/alerts", form);
      toast.success(t.alerts.reportModalSuccess);
      setForm({ medicineName: "", alertType: "Fake", location: "", description: "" });
      onClose();
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
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
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                      {t.alerts.reportModalLocation}
                    </label>
                    <input
                      required
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
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
                    {submitting ? "Submitting…" : t.alerts.reportModalSubmit}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
