"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function FinalCTASection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const c = t.cta;

  return (
    <section id="cta" className="relative py-24">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ type: "spring", stiffness: 70, damping: 20 }}
          className="relative overflow-hidden rounded-3xl p-12 md:p-20 text-center"
          style={{ background: "var(--foreground)", color: "var(--background)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[1.05]">
              <AnimatePresence mode="wait">
                <motion.span key={c.h2a} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="block">
                  {c.h2a}
                </motion.span>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.span key={c.h2b} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22, delay: 0.04 }} className="block italic opacity-50">
                  {c.h2b}
                </motion.span>
              </AnimatePresence>
            </h2>
            <p className="mt-5 opacity-50 max-w-md mx-auto text-[15px]">
              <AnimatePresence mode="wait">
                <motion.span key={c.p} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {c.p}
                </motion.span>
              </AnimatePresence>
            </p>
            <Link
              href="/register"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--background)] text-[var(--foreground)] px-6 py-3.5 text-sm font-medium hover:opacity-90 transition-smooth"
            >
              <AnimatePresence mode="wait">
                <motion.span key={c.btn} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {c.btn}
                </motion.span>
              </AnimatePresence>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-smooth" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
