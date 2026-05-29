"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const spring = { type: "spring" as const, stiffness: 70, damping: 20 };

export default function ShowcaseSection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const { row1, row2 } = t.showcase;

  return (
    <section id="product" className="relative py-28 overflow-hidden border-t border-[var(--border)]">
      <div className="relative max-w-7xl mx-auto px-6 space-y-28">
        {/* Row 1 */}
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={spring}
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted-foreground)] mb-3">
              <AnimatePresence mode="wait">
                <motion.span key={row1.eyebrow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {row1.eyebrow}
                </motion.span>
              </AnimatePresence>
            </p>
            <h3 className="font-display text-4xl tracking-tight mb-4 text-[var(--foreground)]">
              <AnimatePresence mode="wait">
                <motion.span key={row1.h3a} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="block">
                  {row1.h3a}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span key={row1.h3b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, delay: 0.04 }} className="block italic text-[var(--muted-foreground)]">
                  {row1.h3b}
                </motion.span>
              </AnimatePresence>
            </h3>
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-6 max-w-md">
              <AnimatePresence mode="wait">
                <motion.span key={row1.p} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                  {row1.p}
                </motion.span>
              </AnimatePresence>
            </p>
            <ul className="space-y-3 text-sm">
              {row1.bullets.map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[var(--foreground)]">
                  <CheckCircle2 className="size-4 text-[var(--muted-foreground)] flex-shrink-0" strokeWidth={1.6} />
                  <AnimatePresence mode="wait">
                    <motion.span key={item} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {item}
                    </motion.span>
                  </AnimatePresence>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={spring}
          >
            <img
              src="/compare.png"
              alt="MediVerify medicine brand comparison view"
              loading="lazy"
              width={1128}
              height={880}
              className="rounded-2xl border border-[var(--border)] shadow-soft w-full object-cover"
            />
          </motion.div>
        </div>

        {/* Row 2 */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-12 items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, x: -24, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={spring}
            className="relative flex justify-center"
          >
            <img
              src="/dashboard.png"
              alt="MediVerify verification dashboard — scan a strip and trust the result"
              loading="lazy"
              width={1669}
              height={945}
              className="rounded-3xl border border-[var(--border)] shadow-soft w-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={spring}
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted-foreground)] mb-3">
              <AnimatePresence mode="wait">
                <motion.span key={row2.eyebrow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {row2.eyebrow}
                </motion.span>
              </AnimatePresence>
            </p>
            <h3 className="font-display text-4xl tracking-tight mb-4 text-[var(--foreground)]">
              <AnimatePresence mode="wait">
                <motion.span key={row2.h3a} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="inline">
                  {row2.h3a}{" "}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span key={row2.h3b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, delay: 0.04 }} className="italic text-[var(--muted-foreground)]">
                  {row2.h3b}
                </motion.span>
              </AnimatePresence>
            </h3>
            <p className="text-[var(--muted-foreground)] leading-relaxed mb-6 max-w-md">
              <AnimatePresence mode="wait">
                <motion.span key={row2.p} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                  {row2.p}
                </motion.span>
              </AnimatePresence>
            </p>

            <div className="grid grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden">
              {row2.stats.map(([n, l], i) => (
                <div key={i} className="bg-[var(--background)] p-5">
                  <div className="font-display text-3xl text-[var(--foreground)]">{n}</div>
                  <div className="text-xs text-[var(--muted-foreground)] mt-1">
                    <AnimatePresence mode="wait">
                      <motion.span key={l} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        {l}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
