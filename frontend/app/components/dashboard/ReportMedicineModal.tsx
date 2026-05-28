"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useLanguage } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  prefillName: string;
  prefillManufacturer?: string;
}

export function ReportMedicineModal({ open, onClose, prefillName, prefillManufacturer }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    medicineName: "",
    manufacturer: "",
    purchaseLocation: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        medicineName: prefillName ?? "",
        manufacturer: prefillManufacturer ?? "",
        purchaseLocation: "",
        notes: "",
      });
    }
  }, [open, prefillName, prefillManufacturer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineName.trim()) return;
    setSubmitting(true);
    try {
      await axios.post("/api/proxy/unverified-reports", {
        medicineName: form.medicineName.trim(),
        manufacturer: form.manufacturer.trim() || undefined,
        purchaseLocation: form.purchaseLocation.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      toast.success(t.dashboard.reportSubmitted);
      onClose();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        toast.error(t.dashboard.loginToSubmitReport);
      } else {
        toast.error(t.dashboard.reportFailed);
      }
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
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="size-4" />
              </button>

              <h2 className="font-semibold text-[var(--foreground)] mb-1">
                {t.dashboard.reportVerifyTitle}
              </h2>
              <p className="text-xs text-[var(--muted-foreground)] mb-5">
                {t.dashboard.reportVerifySubtext}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    {t.dashboard.fieldMedicineNameLabel} <span className="text-red-500">*</span>
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
                    {t.dashboard.fieldManufacturerLabel}
                  </label>
                  <input
                    value={form.manufacturer}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                    placeholder={t.dashboard.placeholderManufacturer}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    {t.dashboard.fieldWhereLabel}
                  </label>
                  <input
                    value={form.purchaseLocation}
                    onChange={(e) => setForm((f) => ({ ...f, purchaseLocation: e.target.value }))}
                    placeholder={t.dashboard.placeholderPharmacy}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
                    {t.dashboard.fieldNotesLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder={t.dashboard.placeholderNotes}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-40"
                >
                  {submitting ? t.dashboard.submittingBtn : t.dashboard.submitReportBtn}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
