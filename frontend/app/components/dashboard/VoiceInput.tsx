"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  onTranscript: (text: string) => void;
  onSubmit: (text: string) => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [key: number]: { isFinal: boolean; [key: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const LANG_KEY = "mv_voice_lang";
type Lang = "en-US" | "bn-BD";

export function VoiceInput({ onTranscript, onSubmit }: Props) {
  const { t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState<Lang>("en-US");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "bn-BD" || stored === "en-US") setLang(stored);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec: SpeechRecognitionInstance = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let final = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += txt;
        else interimText += txt;
      }
      if (interimText) setInterim(interimText);
      if (final) {
        onTranscript(final);
        setInterim("");
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          rec.stop();
          setListening(false);
          onSubmit(final);
        }, 2000);
      }
    };

    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, [onTranscript, onSubmit, lang]);

  const toggle = () => {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    } else {
      setInterim("");
      recognitionRef.current?.start();
      setListening(true);
    }
  };

  const swapLang = () => {
    if (listening) return;
    const next: Lang = lang === "en-US" ? "bn-BD" : "en-US";
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
  };

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
        onClick={toggle}
        title={`Voice search (${langLabel})`}
        className={`p-3 rounded-xl border transition-smooth ${
          listening
            ? "border-red-300 bg-red-50 text-red-600"
            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]"
        }`}
      >
        <div className="relative">
          <Mic className="size-4" />
          {listening && (
            <motion.span
              className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </button>

      <AnimatePresence>
        {interim && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-2 left-0 right-0 min-w-[200px] glass-card rounded-xl px-3 py-2 text-sm text-[var(--muted-foreground)] whitespace-nowrap"
          >
            {interim}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
