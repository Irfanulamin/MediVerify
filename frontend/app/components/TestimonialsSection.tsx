"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 80, damping: 20 },
  },
};

export default function TestimonialsSection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const s = t.testimonials;

  return (
    <section className="relative py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="max-w-2xl mb-14"
        >
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-[var(--foreground)]">
            <AnimatePresence mode="wait">
              <motion.span key={s.h2a} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="inline">
                {s.h2a}
              </motion.span>
            </AnimatePresence>
            {" "}
            <AnimatePresence mode="wait">
              <motion.span key={s.h2b} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, delay: 0.04 }} className="italic text-[var(--muted-foreground)]">
                {s.h2b}
              </motion.span>
            </AnimatePresence>
          </h2>
        </motion.div>

        <motion.div
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden"
        >
          {s.items.map((item, i) => (
            <motion.figure
              key={i}
              variants={reduce ? undefined : itemVariants}
              className="glass-card p-8 flex flex-col justify-between min-h-[260px]"
            >
              <blockquote className="font-display italic text-[15px] leading-relaxed text-[var(--foreground)]/90">
                <AnimatePresence mode="wait">
                  <motion.span key={item.quote} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                    &ldquo;{item.quote}&rdquo;
                  </motion.span>
                </AnimatePresence>
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-[var(--border)]">
                <div className="text-sm font-medium text-[var(--foreground)]">
                  <AnimatePresence mode="wait">
                    <motion.span key={item.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {item.name}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  <AnimatePresence mode="wait">
                    <motion.span key={item.role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {item.role}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
