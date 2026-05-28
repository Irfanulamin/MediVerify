"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Keyboard, Mic, Camera } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

/**
 * Collapsible inline search-tips section shown below the search bar. Closed by
 * default; toggled with a "Search tips ↓" link. Expands to a responsive grid of
 * three tip cards (text / voice / image) with a smooth height animation.
 */
export function SearchTips({ className = "" }: { className?: string }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const tips = [
    { icon: Keyboard, title: t.dashboard.tipTextTitle, body: t.dashboard.tipTextBody },
    { icon: Mic, title: t.dashboard.tipVoiceTitle, body: t.dashboard.tipVoiceBody },
    { icon: Camera, title: t.dashboard.tipImageTitle, body: t.dashboard.tipImageBody },
  ];

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-medium text-[var(--accent)] hover:underline transition-smooth"
      >
        {t.dashboard.searchTipsToggle}
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mt-3 grid gap-3"
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
            >
              {tips.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-2.5 rounded-[var(--radius-card)] border border-[var(--accent)]/15 bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] p-3"
                >
                  <span className="grid size-8 flex-shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                    <Icon className="size-4 text-[var(--accent)]" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[var(--foreground)]">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
