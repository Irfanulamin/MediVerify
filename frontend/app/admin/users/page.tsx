"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/lib/i18n";

interface User {
  _id: string;
  name?: string;
  email: string;
  role: string;
  createdAt: string;
  verificationsCount?: number;
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    axios.get("/api/proxy/admin/users")
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-display text-2xl md:text-3xl tracking-tight text-[var(--foreground)]">
          {t.admin.users}
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-smooth text-sm w-60"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-sm text-[var(--muted-foreground)]">
          No users found.
        </div>
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {[t.admin.colName, t.admin.colEmail, t.admin.colRole, t.admin.colJoined, "Verifications"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user._id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/30 transition-smooth">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      user.role === "admin"
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "bg-[var(--card)] text-[var(--muted-foreground)] border border-[var(--border)]"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] whitespace-nowrap text-xs">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)] tabular-nums">
                    {user.verificationsCount ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
