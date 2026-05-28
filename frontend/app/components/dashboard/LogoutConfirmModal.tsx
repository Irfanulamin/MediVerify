"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LogoutConfirmModal({ open, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
              <h2 className="font-semibold text-[var(--foreground)] mb-1">
                {t.dashboard.logoutModalTitle}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-6">
                {t.dashboard.logoutModalBody}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--card)] transition-smooth"
                >
                  {t.dashboard.logoutModalCancel}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-smooth"
                >
                  {t.dashboard.logoutModalConfirm}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
