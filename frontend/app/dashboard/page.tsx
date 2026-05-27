"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Clock, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { ResultCard } from "@/app/components/dashboard/ResultCard";
import { VoiceInput } from "@/app/components/dashboard/VoiceInput";
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
  // image extraction fields
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

export default function DashboardPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"text" | "image">("text");
  const [query, setQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runVerify = async (q: string, img?: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verify`,
        { query: q, image: img }
      );
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
        extracted_name: raw.extracted_name ?? null,
        batch_number: raw.batch_number ?? null,
        expiry_date: raw.expiry_date ?? null,
        manufacturer_from_image: raw.manufacturer_from_image ?? null,
      });
      if (q) {
        saveRecent(q);
        setRecent(loadRecent());
      }
    } catch {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[var(--foreground)] mb-2">
          {t.dashboard.medicineName}
        </h1>
        <p className="text-[var(--muted-foreground)] text-[15px]">
          {t.dashboard.searchPlaceholder}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--card)] w-fit mb-5">
        {(["text", "image"] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
              tab === t_
                ? "bg-[var(--background)] text-[var(--foreground)] shadow-soft"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
          >
            {t_ === "text" ? t.dashboard.searchTab1 : t.dashboard.searchTab2}
          </button>
        ))}
      </div>

      {/* Text tab */}
      <AnimatePresence mode="wait">
        {tab === "text" && (
          <motion.form
            key="text"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleTextSubmit}
            className="glass-card rounded-2xl p-5 mb-6"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.dashboard.searchPlaceholder}
                className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
              />
              <VoiceInput
                onTranscript={(txt) => setQuery(txt)}
                onSubmit={(txt) => runVerify(txt)}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth disabled:opacity-40 whitespace-nowrap"
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
              className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth disabled:opacity-40"
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

      {/* Result */}
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
              setTab("text");
              runVerify(name);
            }}
          />
        </div>
      )}

      {/* Recent searches */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-[var(--muted-foreground)]" />
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              {t.dashboard.recentSearches}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q);
                  setTab("text");
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
