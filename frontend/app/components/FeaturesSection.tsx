"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ShieldCheck, GitBranch, Pill } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const icons = [ShieldCheck, GitBranch, Pill];

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

export default function FeaturesSection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const f = t.features;

  return (
    <section id="features" className="relative py-28">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="max-w-2xl mb-14"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted-foreground)] mb-3">
            <AnimatePresence mode="wait">
              <motion.span key={f.eyebrow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {f.eyebrow}
              </motion.span>
            </AnimatePresence>
          </p>
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-[var(--foreground)]">
            <AnimatePresence mode="wait">
              <motion.span
                key={f.h2a}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="block"
              >
                {f.h2a}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.span
                key={f.h2b}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, delay: 0.04 }}
                className="block"
              >
                {f.h2b}
              </motion.span>
            </AnimatePresence>
          </h2>
        </motion.div>

        <motion.div
          variants={reduce ? undefined : containerVariants}
          initial={reduce ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid md:grid-cols-3 gap-px bg-[var(--border)] rounded-2xl overflow-hidden border border-[var(--border)]"
        >
          {f.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.article
                key={i}
                variants={reduce ? undefined : itemVariants}
                className="group relative glass-card p-8 hover:brightness-[0.97] transition-smooth cursor-default"
              >
                <Icon className="size-5 text-[var(--foreground)] mb-8" strokeWidth={1.6} />
                <h3 className="text-lg font-medium tracking-tight mb-2 text-[var(--foreground)]">
                  <AnimatePresence mode="wait">
                    <motion.span key={item.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                      {item.title}
                    </motion.span>
                  </AnimatePresence>
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  <AnimatePresence mode="wait">
                    <motion.span key={item.desc} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="block">
                      {item.desc}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
