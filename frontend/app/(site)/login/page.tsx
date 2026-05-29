"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async (email: string, password: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        { email, password }
      );
      await axios.post("/api/auth/session", {
        access_token: res.data.access_token,
      });
      try {
        const payload = JSON.parse(atob(res.data.access_token.split(".")[1]));
        router.push(payload?.role === "admin" ? "/admin" : "/dashboard");
      } catch {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg =
        axiosErr?.response?.data?.message ?? "Login failed. Please check your credentials.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(form.email, form.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 pt-28">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-soft">
        <div className="flex items-center gap-2 mb-8">
          <Image src="/logo.png" alt="MediVerify" width={32} height={32} className="flex-shrink-0" priority />
          <span className="font-medium text-sm text-[var(--foreground)]">MediVerify</span>
        </div>

        <h1 className="font-display text-2xl text-[var(--foreground)] mb-1">Welcome back</h1>
        <p className="text-[var(--muted-foreground)] text-sm mb-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Sign up
          </Link>
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[var(--muted-foreground)] text-xs mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
            />
          </div>

          <div>
            <label className="block text-[var(--muted-foreground)] text-xs mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Your password"
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3.5 rounded-xl text-sm font-medium bg-[var(--foreground)] text-[var(--background)] hover:opacity-85 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Demo quick-login */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Demo accounts
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => doLogin("user@test.com", "123456")}
            className="py-3 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test as User
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => doLogin("admin@test.com", "123456")}
            className="py-3 rounded-xl text-sm font-medium border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test as Admin
          </button>
        </div>
      </div>
    </div>
  );
}
