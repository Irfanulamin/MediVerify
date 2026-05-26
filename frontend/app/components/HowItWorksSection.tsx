"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

export default function HowItWorksSection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const h = t.how;

  return (
    <section id="how" className="relative py-28 border-y border-[var(--border)] bg-mesh">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-[var(--foreground)]">
            <AnimatePresence mode="wait">
              <motion.span
                key={h.h2a}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="inline"
              >
                {h.h2a}
              </motion.span>
            </AnimatePresence>
            {" "}
            <AnimatePresence mode="wait">
              <motion.span
                key={h.h2b}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, delay: 0.04 }}
                className="italic text-[var(--muted-foreground)]"
              >
                {h.h2b}
              </motion.span>
            </AnimatePresence>
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-6">
          <div
            aria-hidden
            className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-[var(--border)]"
          />

          {h.steps.map((s, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 80, damping: 20, delay: i * 0.12 }}
              className="relative"
            >
              <div className="relative size-16 mx-auto rounded-2xl glass-surface grid place-items-center mb-6 shadow-soft">
                <span className="font-display text-2xl text-[var(--foreground)]">{s.n}</span>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-medium mb-2 text-[var(--foreground)]">
                  <AnimatePresence mode="wait">
                    <motion.span key={s.t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {s.t}
                    </motion.span>
                  </AnimatePresence>
                </h4>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xs mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.span key={s.d} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                      {s.d}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
