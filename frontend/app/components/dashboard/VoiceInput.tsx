"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useVoiceDictation } from "./useVoiceDictation";

interface Props {
  /** Live transcript (committed + interim) — mirror into the field as the user speaks. */
  onTranscript: (text: string) => void;
  /** Full transcript when the user explicitly stops — run name extraction here. */
  onSubmit: (text: string) => void;
  extracting?: boolean;
}

export function VoiceInput({ onTranscript, onSubmit, extracting = false }: Props) {
  const { t } = useLanguage();
  const { supported, listening, lang, toggle, swapLang } = useVoiceDictation({
    onText: onTranscript,
    onFinalize: onSubmit,
  });

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        title={t.dashboard.voiceTooltip}
        className="p-3 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] opacity-40 cursor-not-allowed"
      >
        <MicOff className="size-4" />
      </button>
    );
  }

  const isEn = lang === "en-US";
  const langLabel = isEn ? "EN" : "BN";

  return (
    <div className="relative flex items-stretch gap-1">
      <button
        type="button"
        onClick={swapLang}
        disabled={listening}
        title={isEn ? "Voice language: English (click to switch to Bangla)" : "Voice language: Bangla (click to switch to English)"}
        className={`px-2 rounded-xl border text-[11px] font-semibold tracking-wide transition-smooth ${
          isEn
            ? "border-blue-300 bg-blue-50 text-blue-700"
            : "border-emerald-300 bg-emerald-50 text-emerald-700"
        } ${listening ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {langLabel}
      </button>
      <button
        type="button"
        onClick={() => !extracting && toggle()}
        disabled={extracting}
        title={extracting ? "Extracting medicine name…" : `Voice search (${langLabel})`}
        className={`p-3 rounded-xl border transition-smooth ${
          extracting
            ? "border-[var(--border)] text-[var(--muted-foreground)] opacity-60 cursor-wait"
            : listening
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]"
        }`}
      >
        <div className="relative">
          {extracting ? (
            <Sparkles className="size-4 animate-pulse" />
          ) : (
            <Mic className="size-4" />
          )}
          {listening && !extracting && (
            <motion.span
              className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </button>
    </div>
  );
}
