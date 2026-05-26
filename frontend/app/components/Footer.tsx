"use client";

import { ShieldCheck, X, Globe, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();
  const f = t.footer;

  return (
    <footer className="relative pt-20 pb-10 border-t border-[var(--border)]/60">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2 font-medium text-sm text-[var(--foreground)]">
            <span className="size-7 rounded-lg bg-[var(--foreground)] grid place-items-center flex-shrink-0">
              <ShieldCheck className="size-4 text-[var(--background)]" strokeWidth={2.5} />
            </span>
            MediVerify
          </div>
          <p className="text-sm text-[var(--muted-foreground)] mt-4 max-w-xs leading-relaxed">
            <AnimatePresence mode="wait">
              <motion.span key={f.tagline} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                {f.tagline}
              </motion.span>
            </AnimatePresence>
          </p>
          <div className="flex gap-2 mt-5">
            {[X, Globe, Mail].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="size-9 rounded-xl border border-[var(--border)] grid place-items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card)] transition-smooth"
                aria-label="social link"
              >
                <Icon className="size-4" strokeWidth={1.6} />
              </a>
            ))}
          </div>
        </div>

        {f.cols.map((col) => (
          <div key={col.title}>
            <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)] mb-4">
              <AnimatePresence mode="wait">
                <motion.span key={col.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {col.title}
                </motion.span>
              </AnimatePresence>
            </div>
            <ul className="space-y-2.5 text-sm">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-smooth">
                    <AnimatePresence mode="wait">
                      <motion.span key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                        {label}
                      </motion.span>
                    </AnimatePresence>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-14 pt-6 border-t border-[var(--border)]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
        <div>
          &copy; {new Date().getFullYear()}{" "}
          <AnimatePresence mode="wait">
            <motion.span key={f.copyright} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {f.copyright}
            </motion.span>
          </AnimatePresence>
        </div>
        <div>
          <AnimatePresence mode="wait">
            <motion.span key={f.madeFor} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {f.madeFor}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </footer>
  );
}
