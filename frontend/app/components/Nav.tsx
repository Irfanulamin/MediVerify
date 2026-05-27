"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

export default function Nav() {
  const { lang, t, toggle } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      <nav className="glass shadow-soft rounded-2xl flex items-center justify-between gap-4 px-4 py-2.5 w-full max-w-5xl">
        <a href="/" className="flex items-center gap-2 font-medium text-sm flex-shrink-0">
          <span className="size-7 rounded-lg bg-[var(--foreground)] grid place-items-center flex-shrink-0">
            <ShieldCheck className="size-4 text-[var(--background)]" strokeWidth={2.5} />
          </span>
          <span className="tracking-tight text-[var(--foreground)]">MediVerify</span>
        </a>

        <ul className="hidden md:flex items-center gap-7 text-sm text-[var(--muted-foreground)]">
          {t.nav.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-[var(--foreground)] transition-smooth">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={l.label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="block"
                  >
                    {l.label}
                  </motion.span>
                </AnimatePresence>
              </a>
            </li>
          ))}
          <li>
            <Link href="/dashboard/alerts" className="hover:text-[var(--foreground)] transition-smooth">
              {lang === "bn" ? "সতর্কতা" : "Alerts"}
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Language toggle */}
          <button
            onClick={toggle}
            role="switch"
            aria-checked={lang === "bn"}
            aria-label="Toggle language between English and Bengali"
            className="relative isolate inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--card)] p-0.5 cursor-pointer select-none"
          >
            <motion.span
              aria-hidden
              className="absolute inset-y-0.5 w-[calc(50%-1px)] rounded-lg bg-[var(--foreground)] pointer-events-none"
              animate={{ x: lang === "en" ? 0 : "100%" }}
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
            <span
              className={`relative z-10 px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors duration-150 ${
                lang === "en" ? "text-[var(--background)]" : "text-[var(--muted-foreground)]"
              }`}
            >
              EN
            </span>
            <span
              className={`relative z-10 px-3 py-1 text-[11px] font-semibold tracking-wide transition-colors duration-150 ${
                lang === "bn" ? "text-[var(--background)]" : "text-[var(--muted-foreground)]"
              }`}
            >
              বাং
            </span>
          </button>

          <Link
            href="/register"
            className="text-sm rounded-xl bg-[var(--foreground)] text-[var(--background)] px-3.5 py-1.5 hover:opacity-85 transition-smooth font-medium"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={t.nav.cta}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="block"
              >
                {t.nav.cta}
              </motion.span>
            </AnimatePresence>
          </Link>
        </div>
      </nav>
    </header>
  );
}
