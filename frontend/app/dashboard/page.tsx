"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Clock, X, Search, Stethoscope, Camera, ShieldCheck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { ResultCard } from "@/app/components/dashboard/ResultCard";
import { VoiceInput } from "@/app/components/dashboard/VoiceInput";
import { InvestigationForm, type InvestigateInput } from "@/app/components/dashboard/InvestigationForm";
import {
  InvestigationResultCard,
  type InvestigationResult,
  type InvestigationInput,
} from "@/app/components/dashboard/InvestigationResultCard";
import { SearchTipsPopover } from "@/app/components/dashboard/SearchTipsPopover";
import { useLanguage } from "@/lib/i18n";

interface VerifyResult {
  result: "VERIFIED" | "SUSPICIOUS" | "UNKNOWN";
  medicineName?: string;
  genericName?: string;
  manufacturer?: string;
  trustScore?: number;
  fakeIndicators?: string[];
  safeAlternatives?: string[];
  explanation?: string;
  uses?: string[];
  sideEffects?: string[];
  foundInDatabase?: boolean;
  couldReadImage?: boolean;
  generalInfo?: string;
  manufacturerMatch?: boolean;
  requiresPrescription?: boolean;
  priceBdt?: string;
  confidenceBreakdown?: Record<string, boolean>;
  extracted_name?: string | null;
  batch_number?: string | null;
  expiry_date?: string | null;
  manufacturer_from_image?: string | null;
  error?: string;
}

const RECENT_KEY = "mv_recent_searches";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const prev = loadRecent().filter((q) => q !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)));
}

interface Suggestion {
  name: string;
  manufacturer?: string;
}

const MODE_KEY = "mv_search_mode";
type Mode = "investigate" | "quick" | "image";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Mode>("investigate");
  const [query, setQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [investigation, setInvestigation] = useState<InvestigationResult | null>(null);
  const [investigationInput, setInvestigationInput] = useState<InvestigationInput | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const suggestionLockRef = useRef(false);

  useEffect(() => {
    setRecent(loadRecent());
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "investigate" || stored === "quick" || stored === "image") setTab(stored);
  }, []);

  const switchTab = (next: Mode) => {
    setTab(next);
    localStorage.setItem(MODE_KEY, next);
  };

  useEffect(() => {
    if (suggestionLockRef.current) {
      suggestionLockRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/proxy/medicines/search`, { params: { q } });
        const raw = res.data;
        const list: Suggestion[] = Array.isArray(raw)
          ? raw
              .slice(0, 5)
              .map((item: unknown) =>
                typeof item === "string"
                  ? { name: item }
                  : { name: (item as Suggestion).name, manufacturer: (item as Suggestion).manufacturer }
              )
              .filter((s) => s.name)
          : [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSuggestions(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const pickSuggestion = (name: string) => {
    suggestionLockRef.current = true;
    setQuery(name);
    setShowSuggestions(false);
    setSuggestions([]);
    runVerify(name);
  };

  const runVerify = async (q: string, img?: string) => {
    setShowSuggestions(false);
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`/api/proxy/verify`, { query: q, image: img });
      const raw = res.data;

      if (raw.error) {
        toast.error(raw.error);
        return;
      }

      const med = raw.medicine ?? {};
      setResult({
        result: raw.result,
        medicineName: med.name ?? raw.medicineName ?? raw.medicine_name,
        genericName: med.genericName ?? raw.genericName ?? raw.generic_name,
        manufacturer: med.manufacturer ?? raw.manufacturer,
        trustScore: raw.trustScore ?? raw.trust_score ?? med.trustScore,
        fakeIndicators: med.fakeIndicators ?? raw.fakeIndicators ?? raw.fake_indicators ?? [],
        safeAlternatives: med.safeAlternatives ?? raw.safeAlternatives ?? raw.safe_alternatives ?? [],
        explanation: raw.explanation,
        uses: med.uses ?? raw.uses ?? [],
        sideEffects: med.sideEffects ?? raw.sideEffects ?? raw.side_effects ?? [],
        foundInDatabase: raw.foundInDatabase ?? raw.found_in_database,
        couldReadImage: raw.couldReadImage ?? raw.could_read_image,
        generalInfo: raw.generalInfo ?? raw.general_info,
        manufacturerMatch: raw.manufacturerMatch ?? raw.manufacturer_match,
        requiresPrescription:
          med.requires_prescription ?? raw.requiresPrescription ?? raw.requires_prescription,
        priceBdt: med.price_bdt ?? raw.priceBdt ?? raw.price_bdt,
        confidenceBreakdown: raw.confidenceBreakdown ?? raw.confidence_breakdown,
        extracted_name: raw.extracted_name ?? null,
        batch_number: raw.batch_number ?? null,
        expiry_date: raw.expiry_date ?? null,
        manufacturer_from_image: raw.manufacturer_from_image ?? null,
      });
      if (q) {
        saveRecent(q);
        setRecent(loadRecent());
      }
    } catch (err: any) {
      console.error("[verify] failed", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });
      toast.error(t.dashboard.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    runVerify(query.trim());
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !imagePreview) return;
    const base64 = imagePreview.split(",")[1];
    runVerify("", base64);
  };

  const runInvestigate = async (input: InvestigateInput) => {
    setLoading(true);
    setInvestigation(null);
    setInvestigationInput(null);
    try {
      const res = await axios.post(`/api/proxy/investigate`, input);
      const data = res.data as InvestigationResult;
      setInvestigation(data);
      setInvestigationInput(input);
      if (input.medicine_name) {
        saveRecent(input.medicine_name);
        setRecent(loadRecent());
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) toast.error(t.dashboard.loginToInvestigate);
      else toast.error(t.dashboard.investigationFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="size-10 rounded-xl bg-[var(--foreground)] grid place-items-center flex-shrink-0">
            <ShieldCheck className="size-5 text-[var(--background)]" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="font-display text-3xl md:text-[2.25rem] tracking-tight text-[var(--foreground)] leading-tight">
              {t.dashboard.verifyHeading}
            </h1>
            <p className="text-[var(--muted-foreground)] text-sm mt-0.5">
              {t.dashboard.verifySubtext}
            </p>
          </div>
        </div>
      </header>

      {/* Mode tabs */}
      <div role="tablist" className="inline-flex p-1 rounded-xl border border-[var(--border)] bg-[var(--card)] mb-6">
        {(
          [
            { key: "investigate", label: t.dashboard.modeInvestigate, icon: Stethoscope, recommended: true },
            { key: "quick", label: t.dashboard.modeQuickSearch, icon: Search, recommended: false },
            { key: "image", label: t.dashboard.modeScanPhoto, icon: Camera, recommended: false },
          ] as { key: Mode; label: string; icon: typeof Search; recommended: boolean }[]
        ).map(({ key, label, icon: Icon, recommended }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => switchTab(key)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-smooth flex items-center gap-2 ${
                active
                  ? "bg-[var(--background)] text-[var(--foreground)] shadow-soft"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {recommended && (
                <span
                  aria-hidden
                  className="size-1.5 rounded-full bg-emerald-500"
                  title="Recommended"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <AnimatePresence mode="wait">
        {tab === "investigate" && (
          <motion.div
            key="investigate"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <InvestigationForm loading={loading} onSubmit={runInvestigate} />
          </motion.div>
        )}

        {tab === "quick" && (
          <motion.form
            key="text"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleTextSubmit}
            className="glass-card rounded-2xl p-5 mb-6"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                  {t.dashboard.quickSearchHeading}
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {t.dashboard.quickSearchSubtext}
                </p>
              </div>
              <SearchTipsPopover />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)] pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={t.dashboard.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-soft overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(s.name)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--card)] transition-smooth flex flex-col gap-0.5"
                      >
                        <span className="text-[var(--foreground)]">{s.name}</span>
                        {s.manufacturer && (
                          <span className="text-xs text-[var(--muted-foreground)]">{s.manufacturer}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <VoiceInput
                onTranscript={(txt) => setQuery(txt)}
                onSubmit={(txt) => runVerify(txt)}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-40 whitespace-nowrap"
              >
                {loading ? t.dashboard.verifying : t.dashboard.verifyBtn}
              </button>
            </div>
          </motion.form>
        )}

        {tab === "image" && (
          <motion.form
            key="image"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleImageSubmit}
            className="glass-card rounded-2xl p-5 mb-6"
          >
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                {t.dashboard.scanPackagingHeading}
              </p>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {t.dashboard.scanPackagingSubtext}
              </p>
            </div>
            <div
              className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--accent)] transition-smooth mb-4"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="max-h-40 rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 size-6 rounded-full bg-[var(--foreground)] text-[var(--background)] grid place-items-center"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
                  <Upload className="size-8 opacity-40" />
                  <p className="text-sm">{t.dashboard.uploadLabel}</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              type="submit"
              disabled={loading || !imageFile}
              className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] transition-smooth disabled:opacity-40"
            >
              {loading ? t.dashboard.readingImage : t.dashboard.verifyBtn}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl border border-[var(--border)] p-6 mb-6 animate-pulse">
          <div className="flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-[var(--card)] rounded w-1/3" />
              <div className="h-3 bg-[var(--card)] rounded w-2/3" />
              <div className="h-3 bg-[var(--card)] rounded w-1/2" />
            </div>
            <div className="size-[120px] rounded-full bg-[var(--card)]" />
          </div>
        </div>
      )}

      {/* Investigation result */}
      {investigation && investigationInput && !loading && (
        <div className="mb-8">
          <InvestigationResultCard
            data={investigation}
            input={investigationInput}
            onAlternativeClick={(name) => {
              switchTab("quick");
              setQuery(name);
              runVerify(name);
            }}
          />
        </div>
      )}

      {/* Verify result */}
      {result && !loading && (
        <div className="mb-8">
          {result.extracted_name && (
            <p className="text-sm text-[var(--muted-foreground)] mb-3">
              <span className="font-medium text-[var(--foreground)]">{t.dashboard.detectedMedicine}</span>{" "}
              {result.extracted_name}
            </p>
          )}
          <ResultCard
            data={result}
            onAlternativeClick={(name) => {
              setQuery(name);
              switchTab("quick");
              runVerify(name);
            }}
          />
        </div>
      )}

      {/* Recent searches */}
      {recent.length > 0 && !showSuggestions && (
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-3.5 text-[var(--muted-foreground)]" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              {t.dashboard.recentSearches}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q);
                  switchTab("quick");
                  runVerify(q);
                }}
                className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] transition-smooth"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
