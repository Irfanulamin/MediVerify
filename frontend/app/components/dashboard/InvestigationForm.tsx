"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Sparkles } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { SearchTipsPopover } from "./SearchTipsPopover";
import { useLanguage } from "@/lib/i18n";

export interface InvestigateInput {
  medicine_name: string;
  manufacturer?: string;
  batch_number?: string;
  expiry_date?: string;
  purchase_location?: string;
  price_paid?: number;
}

interface Props {
  loading: boolean;
  onSubmit: (input: InvestigateInput) => void;
}

const VOICE_LANG_KEY = "mv_voice_lang";
type VoiceLang = "en-US" | "bn-BD";

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

export function InvestigationForm({ loading, onSubmit }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    medicineName: "",
    manufacturer: "",
    batchNumber: "",
    expiryDate: "",
    purchaseLocation: "",
    pricePaid: "",
  });
  const [prefilled, setPrefilled] = useState<Set<string>>(new Set());
  const [voiceLang, setVoiceLang] = useState<VoiceLang>("en-US");
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(VOICE_LANG_KEY);
    if (stored === "bn-BD" || stored === "en-US") setVoiceLang(stored);
  }, []);

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec: SpeechRecognitionInstance = new SR();
    rec.lang = voiceLang;
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
        transcriptRef.current += " " + final;
        setInterim("");
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
          rec.stop();
        }, 2000);
      }
    };
    rec.onend = () => {
      setListening(false);
      const finalText = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (finalText) runExtraction(finalText);
    };
    recRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceLang]);

  const swapLang = () => {
    if (listening) return;
    const next: VoiceLang = voiceLang === "en-US" ? "bn-BD" : "en-US";
    setVoiceLang(next);
    localStorage.setItem(VOICE_LANG_KEY, next);
  };

  const toggleMic = () => {
    if (!supported || extracting) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
    } else {
      transcriptRef.current = "";
      setInterim("");
      recRef.current?.start();
      setListening(true);
    }
  };

  const runExtraction = async (transcript: string) => {
    setExtracting(true);
    try {
      const res = await axios.post("/api/proxy/extract-from-speech", { transcript });
      const data = res.data as Record<string, string | number | null>;
      const added = new Set(prefilled);
      const next = { ...form };
      if (data.medicine_name) { next.medicineName = String(data.medicine_name); added.add("medicineName"); }
      if (data.manufacturer) { next.manufacturer = String(data.manufacturer); added.add("manufacturer"); }
      if (data.batch_number) { next.batchNumber = String(data.batch_number); added.add("batchNumber"); }
      if (data.expiry_date) { next.expiryDate = String(data.expiry_date); added.add("expiryDate"); }
      if (data.purchase_location) { next.purchaseLocation = String(data.purchase_location); added.add("purchaseLocation"); }
      if (data.price_paid !== null && data.price_paid !== undefined) { next.pricePaid = String(data.price_paid); added.add("pricePaid"); }
      setForm(next);
      setPrefilled(added);
      const filledCount = added.size - prefilled.size;
      if (filledCount > 0) {
        toast.success(t.dashboard.speechExtracted.replace("{count}", String(added.size)));
      } else {
        toast(t.dashboard.speechNoFields);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) toast.error(t.dashboard.loginToVoice);
      else toast.error(t.dashboard.voiceExtractFailed);
    } finally {
      setExtracting(false);
    }
  };

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (prefilled.has(key)) {
      const next = new Set(prefilled);
      next.delete(key);
      setPrefilled(next);
    }
  };

  const cls = (key: string) =>
    `w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:border-[var(--accent)] transition-smooth ${
      prefilled.has(key)
        ? "bg-amber-50 border-amber-300 text-amber-900"
        : "bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
    }`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineName.trim()) {
      toast.error(t.dashboard.medicineRequired);
      return;
    }
    const input: InvestigateInput = {
      medicine_name: form.medicineName.trim(),
      manufacturer: form.manufacturer.trim() || undefined,
      batch_number: form.batchNumber.trim() || undefined,
      expiry_date: form.expiryDate.trim() || undefined,
      purchase_location: form.purchaseLocation.trim() || undefined,
      price_paid: form.pricePaid ? Number(form.pricePaid) : undefined,
    };
    onSubmit(input);
  };

  const isEn = voiceLang === "en-US";

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            {t.dashboard.investigationTitle}
          </p>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {t.dashboard.investigationSubtext}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <SearchTipsPopover />
          {supported ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={swapLang}
                disabled={listening || extracting}
                title={isEn ? t.dashboard.voiceLangEnglish : t.dashboard.voiceLangBangla}
                className={`px-2 py-2 rounded-xl border text-[11px] font-semibold ${
                  isEn ? "border-blue-300 bg-blue-50 text-blue-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"
                } ${listening || extracting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isEn ? "EN" : "BN"}
              </button>
              <button
                type="button"
                onClick={toggleMic}
                disabled={extracting}
                title={t.dashboard.voiceHint}
                className={`p-2.5 rounded-xl border transition-smooth relative ${
                  listening
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                } ${extracting ? "opacity-60 cursor-wait" : ""}`}
              >
                {extracting ? <Sparkles className="size-4 animate-pulse" /> : <Mic className="size-4" />}
                {listening && (
                  <motion.span
                    className="absolute -top-1 -right-1 size-2 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-foreground)] opacity-40 cursor-not-allowed"
              title={t.dashboard.voiceTooltip}
            >
              <MicOff className="size-4" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {interim && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-sm text-[var(--muted-foreground)]"
          >
            {interim}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {t.dashboard.fieldMedicineName} <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.medicineName}
            onChange={(e) => update("medicineName", e.target.value)}
            placeholder={t.dashboard.placeholderMedicineName}
            className={cls("medicineName")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {t.dashboard.fieldManufacturer}
          </label>
          <input
            value={form.manufacturer}
            onChange={(e) => update("manufacturer", e.target.value)}
            placeholder={t.dashboard.placeholderManufacturer}
            className={cls("manufacturer")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {t.dashboard.fieldBatchNumber}
          </label>
          <input
            value={form.batchNumber}
            onChange={(e) => update("batchNumber", e.target.value)}
            placeholder={t.dashboard.placeholderBatch}
            className={cls("batchNumber")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {t.dashboard.fieldExpiryDate}
          </label>
          <input
            value={form.expiryDate}
            onChange={(e) => update("expiryDate", e.target.value)}
            placeholder={t.dashboard.placeholderExpiry}
            className={cls("expiryDate")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {t.dashboard.fieldWherePurchased}
          </label>
          <input
            value={form.purchaseLocation}
            onChange={(e) => update("purchaseLocation", e.target.value)}
            placeholder={t.dashboard.placeholderLocation}
            className={cls("purchaseLocation")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">
            {t.dashboard.fieldPricePaid}
          </label>
          <input
            type="number"
            min="0"
            value={form.pricePaid}
            onChange={(e) => update("pricePaid", e.target.value)}
            placeholder={t.dashboard.placeholderPrice}
            className={cls("pricePaid")}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || extracting}
        className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-40"
      >
        {loading ? t.dashboard.investigatingBtn : t.dashboard.investigateBtn}
      </button>
    </form>
  );
}
