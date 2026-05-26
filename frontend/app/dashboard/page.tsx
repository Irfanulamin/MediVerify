"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { ShieldCheck, LogOut, Home } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ result: string; explanation: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("mv_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("mv_token");
    router.push("/login");
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("mv_token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/verify`,
        { query },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch {
      setError("Verification failed. Make sure the verification service is running.");
    } finally {
      setLoading(false);
    }
  };

  const resultStyle: Record<string, string> = {
    VERIFIED: "text-emerald-700 border-emerald-200 bg-emerald-50",
    SUSPICIOUS: "text-red-700 border-red-200 bg-red-50",
    UNKNOWN: "text-amber-700 border-amber-200 bg-amber-50",
  };

  return (
    <div className="min-h-screen pt-20 px-4 py-8" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-[var(--foreground)] grid place-items-center flex-shrink-0">
              <ShieldCheck className="size-4 text-[var(--background)]" strokeWidth={2.5} />
            </span>
            <span className="font-medium text-sm text-[var(--foreground)]">MediVerify</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[var(--muted-foreground)] text-sm hover:text-[var(--foreground)] transition-smooth"
            >
              <Home className="size-3.5" strokeWidth={1.6} />
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-[var(--muted-foreground)] text-sm hover:text-[var(--foreground)] transition-smooth"
            >
              <LogOut className="size-3.5" strokeWidth={1.6} />
              Sign out
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-4xl tracking-tight text-[var(--foreground)] mb-2">
            Medicine Verification
          </h1>
          <p className="text-[var(--muted-foreground)] text-[15px]">
            Enter a medicine name or describe it to verify its authenticity using AI.
          </p>
        </div>

        {/* Verify form */}
        <form
          onSubmit={handleVerify}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <label className="block text-[var(--muted-foreground)] text-xs mb-2">
            Medicine name or description
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Paracetamol 500mg, Napa Extra, white round tablet…"
              className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`rounded-2xl border p-6 ${resultStyle[result.result] ?? resultStyle.UNKNOWN}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
                Verdict
              </span>
              <span className="font-medium text-lg">{result.result}</span>
            </div>
            <p className="text-sm leading-relaxed opacity-80">{result.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
