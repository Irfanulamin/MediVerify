"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Max width in px (desktop). Defaults to 480. */
  maxWidth?: number;
  /** Hide the header X button. */
  hideClose?: boolean;
}

/**
 * Shared modal shell — backdrop blur, 20px radius, centered on desktop and
 * bottom-sheet on mobile. Closes on backdrop click and Escape. Animates in
 * with a fade + scale. Uses CSS variables so it adapts to the active theme.
 */
export function Modal({ open, onClose, title, children, footer, maxWidth = 480, hideClose }: ModalProps) {
  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[4px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth }}
              className="relative w-full bg-[var(--background)] shadow-soft border border-[var(--border)] rounded-t-[var(--radius-modal)] sm:rounded-[var(--radius-modal)] max-h-[92vh] overflow-y-auto scrollbar-custom"
            >
              {(title || !hideClose) && (
                <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                  {title ? (
                    <h2 className="text-[18px] font-medium text-[var(--foreground)]">{title}</h2>
                  ) : (
                    <span />
                  )}
                  {!hideClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className="focus-ring -mr-1 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-smooth"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="px-5 pb-5">{children}</div>

              {footer && (
                <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
