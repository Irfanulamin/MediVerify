"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface Props {
  className?: string;
}

const GOOD = [
  { example: "Napa Extra", why: "Exact brand name with variant" },
  { example: "Seclo 20mg", why: "Brand name with dosage" },
  { example: "Ciprofloxacin 500mg", why: "Generic name with dosage" },
  { example: "Beximco Napa", why: "Manufacturer with brand" },
];

const BAD = [
  { example: "headache pill", why: "Symptom, not a medicine name" },
  { example: "antibiotic", why: "Category, not a specific brand" },
  { example: "napaa / naaapa", why: "Typos or extra letters" },
  { example: "pill from pharmacy", why: "Too vague to match" },
];

export function SearchTipsPopover({ className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Search tips"
        className={`p-2.5 rounded-xl border transition-smooth ${
          open
            ? "border-[var(--foreground)] bg-[var(--card)] text-[var(--foreground)]"
            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]"
        }`}
      >
        <Info className="size-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[min(420px,90vw)] z-30 rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-soft overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[var(--foreground)]" />
                <p className="text-sm font-semibold text-[var(--foreground)]">How to search</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-smooth"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
                    Good examples
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {GOOD.map(({ example, why }) => (
                    <li key={example} className="flex items-baseline gap-2 text-sm">
                      <span className="font-mono text-[13px] text-[var(--foreground)] bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                        {example}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] leading-relaxed">{why}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <div className="flex items-center gap-1.5 mb-2">
                  <XCircle className="size-3.5 text-red-600" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-red-700">
                    Avoid
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {BAD.map(({ example, why }) => (
                    <li key={example} className="flex items-baseline gap-2 text-sm">
                      <span className="font-mono text-[13px] text-[var(--muted-foreground)] bg-red-50 border border-red-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                        {example}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] leading-relaxed">{why}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Tip:</span> Use the brand name printed on the packaging. The first word usually works — try{" "}
                <span className="font-mono">Napa</span> instead of{" "}
                <span className="font-mono">Napa Extra 665mg Beximco</span>.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
