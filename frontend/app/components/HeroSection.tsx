"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const spring = { type: "spring", stiffness: 70, damping: 22 } as const;
const textSwap = { duration: 0.22, ease: "easeOut" } as const;

export default function HeroSection() {
  const reduce = useReducedMotion();
  const { t } = useLanguage();
  const h = t.hero;

  const fadeUp = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { ...spring, delay },
        };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-hero-gradient">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at top, black, transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black, transparent 72%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[10%] h-[640px]"
        style={{
          background: "radial-gradient(circle, rgba(109,40,217,0.12) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 w-full grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center py-24">
        <div>
          <motion.div {...fadeUp(0)}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)]/60 px-3 py-1 text-xs text-[var(--muted-foreground)] mb-6">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={h.badge}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={textSwap}
                >
                  {h.badge}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp(0.07)}
            className="font-display text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.02] tracking-tight text-[var(--foreground)]"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={h.h1a}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={textSwap}
                className="block"
              >
                {h.h1a}
              </motion.span>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.span
                key={h.h1b}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ ...textSwap, delay: 0.04 }}
                className="block italic text-[var(--muted-foreground)]"
              >
                {h.h1b}
              </motion.span>
            </AnimatePresence>
          </motion.h1>

          <motion.p
            {...fadeUp(0.14)}
            className="mt-6 text-[17px] text-[var(--muted-foreground)] max-w-xl leading-relaxed"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={h.p}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={textSwap}
                className="block"
              >
                {h.p}
              </motion.span>
            </AnimatePresence>
          </motion.p>

          <motion.div {...fadeUp(0.21)} className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] px-5 py-3 text-sm font-medium hover:opacity-85 transition-smooth"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={h.cta1}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={textSwap}
                >
                  {h.cta1}
                </motion.span>
              </AnimatePresence>
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-smooth" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)]/60 px-5 py-3 text-sm font-medium hover:bg-[var(--card)] transition-smooth text-[var(--foreground)]"
            >
              <Play className="size-3.5 fill-current flex-shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={h.cta2}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={textSwap}
                >
                  {h.cta2}
                </motion.span>
              </AnimatePresence>
            </a>
          </motion.div>

          <motion.div
            {...fadeUp(0.28)}
            className="mt-12 pt-6 border-t border-[var(--border)]/70 text-xs text-[var(--muted-foreground)]"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={h.stat}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={textSwap}
              >
                {h.stat}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right — dashboard mockup */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ ...spring, delay: 0.15 }}
          className="relative"
        >
          <div className="relative rounded-2xl glass-surface p-1.5 shadow-soft">
            <div className="flex items-center gap-1.5 px-3 py-2">
              {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c) => (
                <span key={c} className={`size-2.5 rounded-full ${c} opacity-70`} />
              ))}
              <div className="ml-2 flex-1 h-4 rounded bg-[var(--border)] max-w-[200px]" />
            </div>
            <img
              src="https://picsum.photos/seed/mediverify-dashboard-bd/1280/800"
              alt="MediVerify verification dashboard showing medicine safety scores and batch details"
              width={1280}
              height={800}
              className="rounded-xl w-full object-cover"
              loading="eager"
            />
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, x: -10, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ ...spring, delay: 0.4 }}
            className="absolute -bottom-5 -left-5 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 shadow-soft flex items-center gap-3"
          >
            <span className="size-8 rounded-lg bg-[var(--card)] grid place-items-center flex-shrink-0">
              <span className="size-2 rounded-full bg-[var(--accent)]" />
            </span>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
                <AnimatePresence mode="wait">
                  <motion.span key={h.scanLabel} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={textSwap}>
                    {h.scanLabel}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="text-sm font-medium text-[var(--foreground)]">
                <AnimatePresence mode="wait">
                  <motion.span key={h.scanValue} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={textSwap}>
                    {h.scanValue}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
