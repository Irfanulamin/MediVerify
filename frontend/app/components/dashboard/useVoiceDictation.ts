"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceLang = "en-US" | "bn-BD";

const VOICE_LANG_KEY = "mv_voice_lang";

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
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface Options {
  /** Called continuously with `committed + interim` text so callers can mirror it into a field. */
  onText?: (text: string) => void;
  /** Called once when the session ends (explicit stop), with the full finalized transcript. */
  onFinalize?: (finalText: string) => void;
}

/**
 * Continuous speech-to-text that:
 * - keeps listening until the user explicitly stops (a short pause never ends the session;
 *   if the browser ends recognition on its own silence window we transparently restart),
 * - streams `committed + interim` text to `onText` so words appear live in the field,
 * - runs `onFinalize` exactly once on explicit stop.
 *
 * The recognizer is built once per language and never torn down by parent re-renders —
 * the latest callbacks are read through refs, so unstable inline callbacks are safe.
 */
export function useVoiceDictation({ onText, onFinalize }: Options) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [lang, setLang] = useState<VoiceLang>("en-US");

  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const committedRef = useRef("");        // finalized text accumulated this session
  const wantListeningRef = useRef(false); // user's intent to keep listening
  const onTextRef = useRef(onText);
  const onFinalizeRef = useRef(onFinalize);

  // Keep callback refs current without re-running the recognizer effect.
  useEffect(() => { onTextRef.current = onText; });
  useEffect(() => { onFinalizeRef.current = onFinalize; });

  // Restore stored language preference once.
  useEffect(() => {
    const stored = localStorage.getItem(VOICE_LANG_KEY);
    if (stored === "bn-BD" || stored === "en-US") setLang(stored);
  }, []);

  // Build the recognizer once per language. Deps: [lang] only — NOT the callbacks.
  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
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
      if (final) committedRef.current = `${committedRef.current} ${final}`.trim();
      setInterim(interimText);
      const live = `${committedRef.current}${interimText ? ` ${interimText}` : ""}`.trim();
      onTextRef.current?.(live);
    };

    rec.onend = () => {
      // The browser may end recognition on its own silence window. If the user still
      // intends to listen, restart transparently so a pause never ends the session.
      if (wantListeningRef.current) {
        try {
          rec.start();
          return;
        } catch {
          /* fall through to finalize */
        }
      }
      setListening(false);
      setInterim("");
      const finalText = committedRef.current.trim();
      committedRef.current = "";
      if (finalText) onFinalizeRef.current?.(finalText);
    };

    rec.onerror = () => {
      // Let onend decide whether to restart or finalize.
    };

    recRef.current = rec;
    return () => {
      wantListeningRef.current = false;
      try { rec.stop(); } catch { /* noop */ }
      recRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    if (!supported) return;
    committedRef.current = "";
    setInterim("");
    wantListeningRef.current = true;
    setListening(true);
    try { recRef.current?.start(); } catch { /* already started */ }
  }, [supported]);

  const stop = useCallback(() => {
    wantListeningRef.current = false; // intent to stop; onend finalizes
    try { recRef.current?.stop(); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    if (wantListeningRef.current) stop();
    else start();
  }, [start, stop]);

  const swapLang = useCallback(() => {
    if (wantListeningRef.current) return; // don't switch mid-session
    setLang((l) => {
      const next: VoiceLang = l === "en-US" ? "bn-BD" : "en-US";
      localStorage.setItem(VOICE_LANG_KEY, next);
      return next;
    });
  }, []);

  return { supported, listening, interim, lang, start, stop, toggle, swapLang };
}
