"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

const spring = { type: "spring" as const, stiffness: 70, damping: 20 };

export default function MissionVisionSection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const m = t.mission;

  return (
    <section id="mission" className="relative py-32 overflow-hidden border-t border-[var(--border)]">
      <div className="relative max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={spring}
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted-foreground)] mb-4">
            <AnimatePresence mode="wait">
              <motion.span key={m.missionEyebrow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {m.missionEyebrow}
              </motion.span>
            </AnimatePresence>
          </p>
          <p className="font-display text-3xl md:text-4xl leading-snug tracking-tight text-[var(--foreground)]">
            <AnimatePresence mode="wait">
              <motion.span key={m.missionA} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="block">
                {m.missionA}{" "}
                <span className="italic text-[var(--muted-foreground)]">{m.missionItalic}</span>{" "}
                {m.missionB}
              </motion.span>
            </AnimatePresence>
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted-foreground)] mb-4">
            <AnimatePresence mode="wait">
              <motion.span key={m.visionEyebrow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {m.visionEyebrow}
              </motion.span>
            </AnimatePresence>
          </p>
          <p className="font-display text-3xl md:text-4xl leading-snug tracking-tight text-[var(--foreground)]">
            <AnimatePresence mode="wait">
              <motion.span key={m.visionA} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="block">
                {m.visionA}{" "}
                <span className="italic text-[var(--muted-foreground)]">{m.visionItalic}</span>{" "}
                {m.visionB}
              </motion.span>
            </AnimatePresence>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
